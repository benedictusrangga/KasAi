import { db } from '@/lib/db'
import { business, transaction, user, goal, budget, businessMember } from '@/lib/db/schema'
import { and, eq, gte, lte } from 'drizzle-orm'
import { nanoid } from 'nanoid'
import { extractTransactionsFromText, extractTransactionsFromImage, chatWithAI } from '@/lib/gemini'
import { generateReportPdf, type ReportData } from '@/lib/pdf-server'
import {
  getOrCreateSession,
  setPendingAction,
  getPendingAction,
  clearPendingAction,
  addRecentOperation,
  getLastOperation,
} from '@/lib/conversation-store'
import { parseUserIntent, generateConfirmationMessage, generateSuccessMessage } from '@/lib/ai-actions'
import { getFeatureConfig } from './features'
import { executeAIAction } from '@/lib/ai-action-executor'
import { parseEditIntent, executeEdit, executeUndo, formatEditSuccessMessage } from '@/lib/ai-edit-handler'
import { buildSpendingByCategory, CATEGORY_SLUG_TO_LABEL } from '@/lib/category-utils'

const TELEGRAM_BOT_TOKEN = process.env.TELEGRAM_BOT_TOKEN

// Alias untuk backward compat dengan kode yang masih pakai CATEGORY_LABELS
const CATEGORY_LABELS = CATEGORY_SLUG_TO_LABEL

function escapeHtml(text: string) {
  return text
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;')
}

async function sendTelegramMessage(chatId: number, text: string, parseMode: 'HTML' | 'plain' = 'plain') {
  if (!TELEGRAM_BOT_TOKEN) {
    throw new Error('TELEGRAM_BOT_TOKEN is not configured')
  }
  const url = `https://api.telegram.org/bot${TELEGRAM_BOT_TOKEN}/sendMessage`
  const body: Record<string, unknown> = {
    chat_id: chatId,
    text,
    disable_web_page_preview: true,
  }
  if (parseMode === 'HTML') {
    body.parse_mode = 'HTML'
  }

  try {
    const res = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    })

    if (!res.ok) {
      const errData = await res.json().catch(() => ({}))
      // Jika HTML parse error, coba kirim ulang sebagai plain text
      if (parseMode === 'HTML' && errData?.description?.includes('parse')) {
        const plainBody = { ...body, text: text.replace(/<[^>]*>/g, ''), parse_mode: undefined }
        await fetch(url, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(plainBody),
        })
      }
    }
  } catch {
    // Network error — log tapi jangan crash handler
    console.error('[Telegram] Failed to send message to chatId:', chatId)
  }
}

async function findUserByTelegramId(telegramId: string) {
  return db.query.user.findFirst({
    where: eq(user.telegramId, telegramId),
  })
}

async function findUserByPhoneNumber(phoneNumber: string) {
  return db.query.user.findFirst({
    where: eq(user.phoneNumber, phoneNumber),
  })
}

/**
 * Ambil bisnis yang bisa diakses user via Telegram.
 * Prioritas: activeTelegramBusinessId (jika disetel) → bisnis pertama yang dimiliki → member aktif.
 */
async function getAccessibleBusinessForTelegram(userId: string, preferredBizId?: string | null) {
  // Semua bisnis yang dimiliki
  const ownedBusinesses = await db.query.business.findMany({
    where: eq(business.userId, userId),
  })

  // Semua membership aktif
  const memberships = await db.query.businessMember.findMany({
    where: and(eq(businessMember.userId, userId), eq(businessMember.status, 'active')),
  })
  const memberBizIds = memberships.map(m => m.businessId)
  const memberBusinesses = memberBizIds.length > 0
    ? await db.query.business.findMany({ where: (b, { inArray }) => inArray(b.id, memberBizIds) })
    : []

  // Bangun daftar semua bisnis yang bisa diakses
  const allAccessible = [
    ...ownedBusinesses.map(b => ({ business: b, ownerId: userId, role: 'owner' as const })),
    ...memberBusinesses.map(b => {
      const m = memberships.find(m => m.businessId === b.id)
      return { business: b, ownerId: b.userId, role: (m?.role ?? 'admin') as 'admin' | 'viewer' }
    }),
  ]

  if (allAccessible.length === 0) return null

  // Jika ada preferensi bisnis aktif, cari yang cocok
  if (preferredBizId) {
    const preferred = allAccessible.find(a => a.business.id === preferredBizId)
    if (preferred) return preferred
  }

  // Default: bisnis pertama
  return allAccessible[0]
}

// Kirim file PDF ke Telegram user via sendDocument
async function sendTelegramDocument(
  chatId: number,
  pdfBuffer: Buffer,
  filename: string,
  caption?: string
) {
  if (!TELEGRAM_BOT_TOKEN) return

  try {
    // Buat FormData dengan file buffer
    const formData = new FormData()
    formData.append('chat_id', String(chatId))
    formData.append(
      'document',
      new Blob([new Uint8Array(pdfBuffer)], { type: 'application/pdf' }),
      filename
    )
    if (caption) formData.append('caption', caption)
    formData.append('parse_mode', 'HTML')

    const res = await fetch(
      `https://api.telegram.org/bot${TELEGRAM_BOT_TOKEN}/sendDocument`,
      { method: 'POST', body: formData }
    )

    if (!res.ok) {
      const err = await res.json().catch(() => ({}))
      console.error('[Telegram] sendDocument failed:', err)
    }
  } catch (err) {
    console.error('[Telegram] sendDocument error:', err)
  }
}

// Ambil data laporan dari DB dan format untuk PDF
async function buildReportData(
  ownerId: string,
  businessId: string,
  businessName: string,
  businessType: string,
  period: 'month' | 'week' | 'all'
): Promise<ReportData> {
  const now = new Date()
  let startDate: Date | undefined
  let endDate: Date | undefined
  let periodLabel = 'Semua Waktu'

  if (period === 'month') {
    startDate = new Date(now.getFullYear(), now.getMonth(), 1)
    endDate = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59)
    periodLabel = now.toLocaleDateString('id-ID', { month: 'long', year: 'numeric' })
  } else if (period === 'week') {
    const day = now.getDay()
    startDate = new Date(now)
    startDate.setDate(now.getDate() - day)
    startDate.setHours(0, 0, 0, 0)
    endDate = new Date(startDate)
    endDate.setDate(startDate.getDate() + 6)
    endDate.setHours(23, 59, 59)
    periodLabel = 'Minggu Ini'
  }

  const whereConditions = [
    eq(transaction.businessId, businessId),
    ...(startDate ? [gte(transaction.createdAt, startDate)] : []),
    ...(endDate ? [lte(transaction.createdAt, endDate)] : []),
  ]

  const [txns, goals, budgets] = await Promise.all([
    db.query.transaction.findMany({
      where: and(...whereConditions as any),
      orderBy: (t, { desc }) => [desc(t.createdAt)],
    }),
    db.query.goal.findMany({ where: and(eq(goal.businessId, businessId), eq(goal.userId, ownerId)) }),
    db.query.budget.findMany({ where: and(eq(budget.businessId, businessId), eq(budget.userId, ownerId)) }),
  ])

  const totalIncome = txns.filter(t => t.transaction_type === 'income').reduce((s, t) => s + parseFloat(t.amount), 0)
  const totalExpense = txns.filter(t => t.transaction_type === 'expense').reduce((s, t) => s + parseFloat(t.amount), 0)

  // Category breakdown
  const byCategoryMap: Record<string, number> = {}
  txns.filter(t => t.transaction_type === 'expense').forEach(t => {
    const cat = t.categoryId || 'other'
    byCategoryMap[cat] = (byCategoryMap[cat] || 0) + parseFloat(t.amount)
  })
  const byCategory = Object.entries(byCategoryMap)
    .map(([category, amount]) => ({
      category: CATEGORY_LABELS[category] || category,
      amount,
      percentage: totalExpense > 0 ? Math.round((amount / totalExpense) * 100) : 0,
    }))
    .sort((a, b) => b.amount - a.amount)

  // Budget status
  const budgetStatus = budgets.map(b => {
    const spent = byCategoryMap[b.category] || 0
    const budgetAmt = parseFloat(b.amount)
    const pct = Math.round((spent / budgetAmt) * 100)
    return {
      category: b.category,
      budget: budgetAmt,
      spent,
      percentage: pct,
      status: pct > 100 ? 'MELEBIHI' : pct > 80 ? 'HAMPIR HABIS' : 'AMAN',
    }
  })

  return {
    businessName,
    businessType,
    period: periodLabel,
    generatedAt: now,
    summary: {
      totalIncome,
      totalExpense,
      netProfit: totalIncome - totalExpense,
      txCount: txns.length,
    },
    transactions: txns.map(t => ({
      date: new Date(t.createdAt).toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' }),
      description: t.description,
      type: t.transaction_type,
      amount: parseFloat(t.amount),
      categoryId: t.categoryId,
      source: t.source,
    })),
    byCategory,
    budgetStatus,
    goals: goals.map(g => ({
      title: g.title,
      target: parseFloat(g.targetAmount),
      current: parseFloat(g.currentAmount),
      percentage: Math.min(Math.round((parseFloat(g.currentAmount) / parseFloat(g.targetAmount)) * 100), 100),
      completed: g.completed,
      deadline: g.deadline ? new Date(g.deadline).toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' }) : null,
    })),
  }
}

async function getTelegramFileBase64(fileId: string): Promise<{ base64: string; mimeType: string } | null> {
  if (!TELEGRAM_BOT_TOKEN) return null
  try {
    // Get file path
    const res = await fetch(`https://api.telegram.org/bot${TELEGRAM_BOT_TOKEN}/getFile?file_id=${fileId}`)
    const data = await res.json()
    if (!data.ok) return null
    const filePath = data.result.file_path

    // Download file
    const fileRes = await fetch(`https://api.telegram.org/file/bot${TELEGRAM_BOT_TOKEN}/${filePath}`)
    const buffer = await fileRes.arrayBuffer()
    const base64 = Buffer.from(buffer).toString('base64')

    // Determine mime type from extension
    const ext = filePath.split('.').pop()?.toLowerCase()
    const mimeType = ext === 'png' ? 'image/png' : ext === 'webp' ? 'image/webp' : 'image/jpeg'

    return { base64, mimeType }
  } catch {
    return null
  }
}

export async function handleTelegramUpdate(update: any) {
  const message = update.message || update.edited_message
  if (!message || !message.chat) {
    return
  }

  const chatId = message.chat.id
  const sender = message.from
  const senderTelegramId = sender?.id ? String(sender.id) : undefined
  const contactPhone = message.contact?.phone_number
  const messageText = typeof message.text === 'string' ? message.text.trim() : ''

  // ── Handle /start command ──────────────────────────────────────────────────
  if (messageText === '/start' || messageText.startsWith('/start ')) {
    await sendTelegramMessage(
      chatId,
      `👋 Halo! Saya <b>@Aiaccountingsbot</b> — asisten keuangan AI untuk UMKM Indonesia.\n\n` +
      `Saya bisa membantu Anda:\n` +
      `• Mencatat transaksi hanya dengan mengirim pesan\n` +
      `• Menjawab pertanyaan tentang keuangan bisnis Anda\n` +
      `• Memberikan ringkasan laporan keuangan\n\n` +
      `<b>Cara menghubungkan akun:</b>\n` +
      `1. Daftar di aplikasi KasAI\n` +
      `2. Buka menu <b>Pengaturan</b>\n` +
      `3. Masukkan nomor HP Telegram Anda\n` +
      `4. Kembali ke sini dan mulai kirim transaksi!\n\n` +
      `Contoh: <i>"beli bahan baku kopi 450rb"</i> atau <i>"terima pembayaran 1.2jt"</i>`,
      'HTML'
    )
    return
  }

  // ── Handle /help command ───────────────────────────────────────────────────
  if (messageText === '/help') {
    await sendTelegramMessage(
      chatId,
      `📖 <b>Panduan @Aiaccountingsbot</b>\n\n` +
      `<b>📝 Catat transaksi:</b>\n` +
      `• "beli gula 50rb" → pengeluaran Rp 50.000\n` +
      `• "terima bayaran 1.5jt" → pemasukan Rp 1.500.000\n` +
      `• Kirim foto struk/bukti transfer → AI baca otomatis\n\n` +
      `<b>✏️ Koreksi input:</b>\n` +
      `• "eh salah, yang tadi 9.5jt bukan 10jt"\n` +
      `• "koreksi deskripsinya jadi bahan baku"\n` +
      `• "undo" / "batalkan yang tadi"\n\n` +
      `<b>🎯 Goals & Tabungan:</b>\n` +
      `• "buat target 10jt untuk beli motor"\n` +
      `• "tambah 500rb ke target motor"\n` +
      `• /goals — lihat semua target\n` +
      `• /tabung — tambah kontribusi ke goal\n` +
      `• /tabung 1 500000 — tabung ke goal #1\n\n` +
      `<b>💸 Hutang & Piutang:</b>\n` +
      `• "catat hutang ke Budi 2jt"\n` +
      `• "piutang dari Sari 1jt jatuh tempo 15 Jan"\n\n` +
      `<b>📦 Inventaris:</b>\n` +
      `• "stok kopi masuk 50kg"\n\n` +
      `<b>⌨️ Perintah:</b>\n` +
      `/status - Cek status akun & bisnis\n` +
      `/goals - Lihat semua target + progress\n` +
      `/tabung - Tambah tabungan ke goal\n` +
      `/laporan - Laporan keuangan\n` +
      `/pdf - Export laporan PDF\n` +
      `/budget - Status budget bulan ini\n` +
      `/switch - Ganti bisnis aktif`,
      'HTML'
    )
    return
  }

  // ── Handle /status command ─────────────────────────────────────────────────
  if (messageText === '/status') {
    let userRecord = senderTelegramId ? await findUserByTelegramId(senderTelegramId) : null
    if (userRecord) {
      const bizAccess = await getAccessibleBusinessForTelegram(userRecord.id)
      const roleLabel = bizAccess?.role === 'owner' ? 'Pemilik' : bizAccess?.role === 'admin' ? 'Admin' : 'Viewer'
      await sendTelegramMessage(
        chatId,
        `✅ <b>Akun terhubung</b>\n\n` +
        `👤 Nama: ${userRecord.name || '-'}\n` +
        `📧 Email: ${userRecord.email}\n` +
        `🏪 Bisnis aktif: ${bizAccess ? bizAccess.business.name : 'Belum ada'}\n` +
        `👔 Role: ${bizAccess ? roleLabel : '-'}\n` +
        `📱 Tipe akun: ${userRecord.accountType || 'personal'}`,
        'HTML'
      )
    } else {
      await sendTelegramMessage(
        chatId,
        '❌ Akun belum terhubung. Daftarkan nomor HP Telegram Anda di menu Pengaturan aplikasi KasAI.'
      )
    }
    return
  }

  // ── Handle /laporan & /laporan_minggu ──────────────────────────────────────
  if (messageText === '/laporan' || messageText === '/laporan_minggu') {
    const tempUser = senderTelegramId ? await findUserByTelegramId(senderTelegramId) : null
    if (!tempUser) {
      await sendTelegramMessage(chatId, '❌ Akun belum terhubung. Ketik /start untuk info.')
      return
    }
    const bizAccess = await getAccessibleBusinessForTelegram(tempUser.id)
    if (!bizAccess) {
      await sendTelegramMessage(chatId, '⚠️ Belum ada bisnis. Buat bisnis di aplikasi KasAI atau minta owner untuk mengundang Anda.')
      return
    }
    const biz = bizAccess.business
    const now = new Date()
    const isWeek = messageText === '/laporan_minggu'
    let startDate: Date, endDate: Date, periodLabel: string

    if (isWeek) {
      const day = now.getDay()
      startDate = new Date(now); startDate.setDate(now.getDate() - day); startDate.setHours(0,0,0,0)
      endDate = new Date(startDate); endDate.setDate(startDate.getDate() + 6); endDate.setHours(23,59,59)
      periodLabel = 'Minggu Ini'
    } else {
      startDate = new Date(now.getFullYear(), now.getMonth(), 1)
      endDate = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59)
      periodLabel = now.toLocaleDateString('id-ID', { month: 'long', year: 'numeric' })
    }

    const txns = await db.query.transaction.findMany({
      where: and(
        eq(transaction.businessId, biz.id),
        gte(transaction.createdAt, startDate),
        lte(transaction.createdAt, endDate)
      ),
      orderBy: (t, { desc }) => [desc(t.createdAt)],
    })

    const totalIncome = txns.filter(t => t.transaction_type === 'income').reduce((s, t) => s + parseFloat(t.amount), 0)
    const totalExpense = txns.filter(t => t.transaction_type === 'expense').reduce((s, t) => s + parseFloat(t.amount), 0)
    const net = totalIncome - totalExpense

    const byCategory: Record<string, number> = {}
    txns.filter(t => t.transaction_type === 'expense').forEach(t => {
      const cat = t.categoryId || 'other'
      byCategory[cat] = (byCategory[cat] || 0) + parseFloat(t.amount)
    })

    const topCats = Object.entries(byCategory).sort(([,a],[,b]) => b-a).slice(0, 4)

    let msg = `📊 <b>LAPORAN KEUANGAN</b>\n`
    msg += `🏪 ${escapeHtml(biz.name)} · ${periodLabel}\n\n`
    msg += `💰 <b>Ringkasan:</b>\n`
    msg += `• Pemasukan: <b>Rp ${totalIncome.toLocaleString('id-ID')}</b>\n`
    msg += `• Pengeluaran: <b>Rp ${totalExpense.toLocaleString('id-ID')}</b>\n`
    msg += `• ${net >= 0 ? '✅ Laba' : '❌ Rugi'}: <b>Rp ${Math.abs(net).toLocaleString('id-ID')}</b>\n`
    msg += `• Total transaksi: ${txns.length}\n`

    if (topCats.length > 0) {
      msg += `\n📂 <b>Pengeluaran terbesar:</b>\n`
      topCats.forEach(([cat, amt]) => {
        msg += `• ${CATEGORY_LABELS[cat] || cat}: Rp ${amt.toLocaleString('id-ID')}\n`
      })
    }

    if (txns.length > 0) {
      msg += `\n📋 <b>5 transaksi terakhir:</b>\n`
      txns.slice(0, 5).forEach(t => {
        const sign = t.transaction_type === 'income' ? '+' : '-'
        const date = new Date(t.createdAt).toLocaleDateString('id-ID', { day: 'numeric', month: 'short' })
        msg += `${sign}Rp ${parseFloat(t.amount).toLocaleString('id-ID')} — ${escapeHtml(t.description)} (${date})\n`
      })
    }

    msg += `\n<i>Lihat laporan lengkap di aplikasi KasAI</i>`
    await sendTelegramMessage(chatId, msg, 'HTML')
    return
  }

  // ── Handle /pdf & /pdf_minggu ──────────────────────────────────────────────
  if (messageText === '/pdf' || messageText === '/pdf_minggu' || messageText === '/pdf_semua') {
    const tempUser = senderTelegramId ? await findUserByTelegramId(senderTelegramId) : null
    if (!tempUser) {
      await sendTelegramMessage(chatId, '❌ Akun belum terhubung. Ketik /start untuk info.')
      return
    }
    const bizAccess = await getAccessibleBusinessForTelegram(tempUser.id)
    if (!bizAccess) {
      await sendTelegramMessage(chatId, '⚠️ Belum ada bisnis. Buat bisnis di aplikasi KasAI atau minta owner untuk mengundang Anda.')
      return
    }
    const biz = bizAccess.business

    const period: 'month' | 'week' | 'all' =
      messageText === '/pdf_minggu' ? 'week' :
      messageText === '/pdf_semua' ? 'all' : 'month'

    const periodLabel = period === 'week' ? 'Minggu Ini' : period === 'all' ? 'Semua Waktu' :
      new Date().toLocaleDateString('id-ID', { month: 'long', year: 'numeric' })

    await sendTelegramMessage(chatId, `⏳ Membuat laporan PDF <b>${periodLabel}</b>...`, 'HTML')

    try {
      const reportData = await buildReportData(bizAccess.ownerId, biz.id, biz.name, biz.type, period)
      const pdfBuffer = await generateReportPdf(reportData)

      const now = new Date()
      const dateStr = now.toISOString().slice(0, 10)
      const filename = `KasAI_${biz.name.replace(/\s+/g, '_')}_${period}_${dateStr}.pdf`

      const caption =
        `📄 <b>Laporan Keuangan ${periodLabel}</b>\n` +
        `🏪 ${escapeHtml(biz.name)}\n` +
        `📅 ${now.toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' })}\n\n` +
        `💰 Pemasukan: <b>Rp ${reportData.summary.totalIncome.toLocaleString('id-ID')}</b>\n` +
        `💸 Pengeluaran: <b>Rp ${reportData.summary.totalExpense.toLocaleString('id-ID')}</b>\n` +
        `${reportData.summary.netProfit >= 0 ? '✅' : '❌'} ${reportData.summary.netProfit >= 0 ? 'Laba' : 'Rugi'}: <b>Rp ${Math.abs(reportData.summary.netProfit).toLocaleString('id-ID')}</b>`

      await sendTelegramDocument(chatId, pdfBuffer, filename, caption)
    } catch (err) {
      console.error('[Telegram] PDF generation error:', err)
      await sendTelegramMessage(chatId, '❌ Gagal membuat PDF. Silakan coba lagi atau gunakan /laporan untuk ringkasan teks.')
    }
    return
  }

  // ── Handle /budget ─────────────────────────────────────────────────────────
  if (messageText === '/budget') {
    const tempUser = senderTelegramId ? await findUserByTelegramId(senderTelegramId) : null
    if (!tempUser) { await sendTelegramMessage(chatId, '❌ Akun belum terhubung.'); return }
    const bizAccess = await getAccessibleBusinessForTelegram(tempUser.id)
    if (!bizAccess) { await sendTelegramMessage(chatId, '⚠️ Belum ada bisnis.'); return }
    const tempBiz = bizAccess.business

    const budgets = await db.query.budget.findMany({ where: and(eq(budget.businessId, tempBiz.id), eq(budget.userId, bizAccess.ownerId)) })
    if (budgets.length === 0) {
      await sendTelegramMessage(chatId, '📋 Belum ada budget yang ditetapkan.\n\nAtur budget di menu <b>Goals &amp; Budget</b> di aplikasi KasAI.', 'HTML')
      return
    }

    const now = new Date()
    const startMonth = new Date(now.getFullYear(), now.getMonth(), 1)
    const txns = await db.query.transaction.findMany({
      where: and(eq(transaction.businessId, tempBiz.id), gte(transaction.createdAt, startMonth)),
    })

    const spentByCategory = buildSpendingByCategory(
      txns
        .filter(t => t.transaction_type === 'expense')
        .map(t => ({ categoryName: t.categoryName, categoryId: t.categoryId, amount: t.amount }))
    )

    const monthLabel = now.toLocaleDateString('id-ID', { month: 'long', year: 'numeric' })
    let msg = `🎯 <b>STATUS BUDGET — ${monthLabel}</b>\n\n`

    budgets.forEach(b => {
      const spent = spentByCategory[b.category] || 0
      const budgetAmt = parseFloat(b.amount)
      const pct = Math.round((spent / budgetAmt) * 100)
      const bar = '█'.repeat(Math.min(Math.floor(pct / 10), 10)) + '░'.repeat(Math.max(10 - Math.floor(pct / 10), 0))
      const icon = pct > 100 ? '🔴' : pct > 80 ? '🟡' : '🟢'
      const label = CATEGORY_LABELS[b.category] || b.category
      msg += `${icon} <b>${label}</b>\n`
      msg += `${bar} ${pct}%\n`
      msg += `Rp ${spent.toLocaleString('id-ID')} / Rp ${budgetAmt.toLocaleString('id-ID')}\n`
      if (pct > 100) msg += `⚠️ Melebihi budget Rp ${(spent - budgetAmt).toLocaleString('id-ID')}\n`
      else msg += `Sisa: Rp ${(budgetAmt - spent).toLocaleString('id-ID')}\n`
      msg += '\n'
    })

    await sendTelegramMessage(chatId, msg, 'HTML')
    return
  }

  // ── Handle /target & /goals (alias) ──────────────────────────────────────
  if (messageText === '/target' || messageText === '/goals') {
    const tempUser = senderTelegramId ? await findUserByTelegramId(senderTelegramId) : null
    if (!tempUser) { await sendTelegramMessage(chatId, '❌ Akun belum terhubung.'); return }
    const bizAccessTarget = await getAccessibleBusinessForTelegram(tempUser.id, tempUser.activeTelegramBusinessId)
    if (!bizAccessTarget) { await sendTelegramMessage(chatId, '⚠️ Belum ada bisnis.'); return }
    const tempBiz = bizAccessTarget.business

    const goals = await db.query.goal.findMany({
      where: and(eq(goal.businessId, tempBiz.id), eq(goal.userId, bizAccessTarget.ownerId)),
      orderBy: (g, { asc }) => [asc(g.completed), asc(g.createdAt)],
    })
    if (goals.length === 0) {
      await sendTelegramMessage(chatId,
        '🎯 Belum ada target keuangan.\n\nTambahkan target di aplikasi KasAI atau ketik:\n<code>buat target [nama] [jumlah]</code>\n\nContoh: <i>buat target motor 10 juta</i>',
        'HTML')
      return
    }

    let msg = `🎯 <b>TARGET KEUANGAN — ${escapeHtml(tempBiz.name)}</b>\n\n`
    const activeGoals = goals.filter(g => !g.completed)
    const doneGoals   = goals.filter(g => g.completed)

    activeGoals.forEach((g, idx) => {
      const pct = Math.min(Math.round((parseFloat(g.currentAmount) / parseFloat(g.targetAmount)) * 100), 100)
      const filled = Math.floor(pct / 10)
      const bar = '█'.repeat(filled) + '░'.repeat(10 - filled)
      const icon = pct >= 75 ? '🔥' : pct >= 50 ? '💪' : '🎯'
      const sisa = parseFloat(g.targetAmount) - parseFloat(g.currentAmount)
      msg += `${icon} <b>${escapeHtml(g.title)}</b>\n`
      msg += `${bar} ${pct}%\n`
      msg += `Terkumpul: Rp ${parseFloat(g.currentAmount).toLocaleString('id-ID')}\n`
      msg += `Target: Rp ${parseFloat(g.targetAmount).toLocaleString('id-ID')}\n`
      msg += `Sisa: Rp ${sisa.toLocaleString('id-ID')}\n`
      if (g.deadline) msg += `📅 Deadline: ${new Date(g.deadline).toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' })}\n`
      msg += `\n💡 Ketik: <code>tabung ${idx + 1} [jumlah]</code>\n\n`
    })

    if (doneGoals.length > 0) {
      msg += `✅ <b>Tercapai (${doneGoals.length}):</b> ${doneGoals.map(g => escapeHtml(g.title)).join(', ')}\n\n`
    }

    msg += `<i>Tambah kontribusi: "tabung 500rb ke motor" atau /tabung</i>`

    await sendTelegramMessage(chatId, msg, 'HTML')
    return
  }

  // ── Handle /tabung — Tambah kontribusi ke goal ─────────────────────────────
  // Format: /tabung  atau  tabung [nomor_goal] [jumlah]
  if (messageText === '/tabung' || messageText.startsWith('/tabung ')) {
    const tempUser = senderTelegramId ? await findUserByTelegramId(senderTelegramId) : null
    if (!tempUser) { await sendTelegramMessage(chatId, '❌ Akun belum terhubung.'); return }
    const bizAccessTabung = await getAccessibleBusinessForTelegram(tempUser.id, tempUser.activeTelegramBusinessId)
    if (!bizAccessTabung) { await sendTelegramMessage(chatId, '⚠️ Belum ada bisnis.'); return }

    const goals = await db.query.goal.findMany({
      where: and(
        eq(goal.businessId, bizAccessTabung.business.id),
        eq(goal.userId, bizAccessTabung.ownerId),
        eq(goal.completed, false),
      ),
      orderBy: (g, { asc }) => [asc(g.createdAt)],
    })

    if (goals.length === 0) {
      await sendTelegramMessage(chatId, '🎯 Belum ada target aktif. Buat dulu di aplikasi atau ketik "buat target [nama] [jumlah]".')
      return
    }

    // Parse argumen: /tabung [nomor] [jumlah]
    const args = messageText.replace('/tabung', '').trim().split(/\s+/).filter(Boolean)
    const goalIndex = args[0] && /^\d+$/.test(args[0]) ? parseInt(args[0]) - 1 : null
    const amountArg = args[goalIndex !== null ? 1 : 0]

    // Kalau tidak ada argumen lengkap — tampilkan daftar goal
    if (goalIndex === null || !amountArg) {
      let menu = `💰 <b>TABUNG KE GOAL MANA?</b>\n\n`
      goals.forEach((g, i) => {
        const pct = Math.min(Math.round((parseFloat(g.currentAmount) / parseFloat(g.targetAmount)) * 100), 100)
        const sisa = parseFloat(g.targetAmount) - parseFloat(g.currentAmount)
        menu += `${i + 1}. <b>${escapeHtml(g.title)}</b> (${pct}%) — sisa Rp ${sisa.toLocaleString('id-ID')}\n`
      })
      menu += `\nFormat: <code>/tabung [nomor] [jumlah]</code>\nContoh: <code>/tabung 1 500000</code> atau ketik "tabung 500rb ke motor"`
      await sendTelegramMessage(chatId, menu, 'HTML')
      return
    }

    const targetGoal = goals[goalIndex]
    if (!targetGoal) {
      await sendTelegramMessage(chatId, `❌ Goal nomor ${goalIndex + 1} tidak ditemukan.`)
      return
    }

    // Parse jumlah
    const amountMatch = amountArg.match(/^(\d+(?:[.,]\d+)?)(jt?|juta|rb|ribu|k)?$/i)
    if (!amountMatch) {
      await sendTelegramMessage(chatId, '❌ Format jumlah tidak valid. Contoh: 500000, 500rb, 1jt')
      return
    }
    let amount = parseFloat(amountMatch[1].replace(',', '.'))
    const unit = (amountMatch[2] || '').toLowerCase()
    if (unit === 'jt' || unit === 'juta' || unit === 'j') amount *= 1_000_000
    else if (unit === 'rb' || unit === 'ribu' || unit === 'k') amount *= 1_000

    if (amount <= 0) {
      await sendTelegramMessage(chatId, '❌ Jumlah harus lebih dari 0.')
      return
    }

    // Cek konfigurasi goalContributionAsExpense
    const featureCfg = await getFeatureConfig(bizAccessTabung.business.id).catch(() => null)
    const alsoAsExpense = featureCfg?.goalContributionAsExpense === true

    // Simpan kontribusi
    const newCurrent = parseFloat(targetGoal.currentAmount) + amount
    const newTarget  = parseFloat(targetGoal.targetAmount)
    const completed  = newCurrent >= newTarget
    const pctNew     = Math.min(Math.round((newCurrent / newTarget) * 100), 100)

    await db.update(goal).set({
      currentAmount: newCurrent.toString(),
      completed,
      updatedAt: new Date(),
    }).where(eq(goal.id, targetGoal.id))

    // Jika config goalContributionAsExpense = true, catat juga sebagai transaksi expense
    if (alsoAsExpense) {
      await db.insert(transaction).values({
        id: nanoid(),
        businessId: bizAccessTabung.business.id,
        userId: bizAccessTabung.ownerId,
        inputByUserId: tempUser.id,
        amount: amount.toString(),
        transaction_type: 'expense',
        description: `Tabungan: ${targetGoal.title}`,
        categoryName: 'Tabungan/Goal',
        source: 'telegram',
      })
    }

    const filled = Math.floor(pctNew / 10)
    const bar    = '█'.repeat(filled) + '░'.repeat(10 - filled)
    const sisa   = Math.max(0, newTarget - newCurrent)

    let reply = `✅ <b>Kontribusi berhasil!</b>\n\n`
    reply += `🎯 Goal: <b>${escapeHtml(targetGoal.title)}</b>\n`
    reply += `💰 Ditambahkan: Rp ${amount.toLocaleString('id-ID')}\n`
    reply += `${bar} ${pctNew}%\n`
    reply += `Terkumpul: Rp ${newCurrent.toLocaleString('id-ID')} / Rp ${newTarget.toLocaleString('id-ID')}\n`

    if (completed) {
      reply += `\n🎉 <b>SELAMAT! Target "${escapeHtml(targetGoal.title)}" tercapai!</b> 🎊`
    } else {
      reply += `Sisa: Rp ${sisa.toLocaleString('id-ID')}\n`
    }

    if (alsoAsExpense) {
      reply += `\n\n📊 <i>Kontribusi ini juga dicatat sebagai pengeluaran.</i>`
    }

    await sendTelegramMessage(chatId, reply, 'HTML')
    return
  }
  // Handle /switch (ganti bisnis aktif via Telegram)
  if (messageText === '/switch') {
    let tempUser = senderTelegramId ? await findUserByTelegramId(senderTelegramId) : null
    if (!tempUser) { await sendTelegramMessage(chatId, '❌ Akun belum terhubung. Ketik /start.'); return }

    const ownedBiz = await db.query.business.findMany({ where: eq(business.userId, tempUser.id) })
    const memberships = await db.query.businessMember.findMany({
      where: and(eq(businessMember.userId, tempUser.id), eq(businessMember.status, 'active'))
    })
    const memberBizIds = memberships.map(m => m.businessId)
    const memberBizList = memberBizIds.length > 0
      ? await db.query.business.findMany({ where: (b, { inArray }) => inArray(b.id, memberBizIds) })
      : []

    const allBiz = [
      ...ownedBiz.map(b => ({ ...b, role: 'owner' })),
      ...memberBizList.map(b => {
        const m = memberships.find(m => m.businessId === b.id)
        return { ...b, role: m?.role || 'admin' }
      }),
    ]

    if (allBiz.length <= 1) {
      await sendTelegramMessage(chatId, 'Anda hanya memiliki 1 bisnis. Tidak perlu switch.')
      return
    }

    const activeBizId = tempUser.activeTelegramBusinessId
    const list = allBiz.map((b, i) => {
      const isActive = b.id === activeBizId || (!activeBizId && i === 0)
      const roleLabel = b.role === 'owner' ? 'Pemilik' : b.role === 'admin' ? 'Admin' : 'Viewer'
      return `${i + 1}. ${isActive ? '✅ ' : ''}<b>${escapeHtml(b.name)}</b> (${roleLabel})`
    }).join('\n')

    await sendTelegramMessage(chatId,
      `🔄 <b>Ganti Bisnis Aktif</b>\n\n${list}\n\nBalas dengan nomor bisnis yang ingin diaktifkan.\nContoh ketik: <code>2</code>`,
      'HTML'
    )
    return
  }

  let userRecord = senderTelegramId
    ? await findUserByTelegramId(senderTelegramId)
    : null

  if (!userRecord && contactPhone) {
    userRecord = await findUserByPhoneNumber(contactPhone)
    if (userRecord && senderTelegramId) {
      await db
        .update(user)
        .set({ telegramId: senderTelegramId, updatedAt: new Date() })
        .where(eq(user.id, userRecord.id))
    }
  }

  if (!userRecord) {
    await sendTelegramMessage(
      chatId,
      `❌ Akun Anda belum terhubung.\n\n` +
      `Cara menghubungkan:\n` +
      `1. Buka aplikasi KasAI\n` +
      `2. Masuk ke <b>Pengaturan</b>\n` +
      `3. Isi kolom <b>Telegram ID</b> lalu klik Simpan\n` +
      `4. Ketuk /start untuk memulai\n\n` +
      `Ketik /start untuk info lebih lanjut.`,
      'HTML'
    )
    return
  }

  // Auto-save phone number jika user kirim kontak
  if (message.contact && !userRecord.phoneNumber) {
    await db.update(user).set({ phoneNumber: message.contact.phone_number, updatedAt: new Date() }).where(eq(user.id, userRecord.id))
  }

  // Auto-link telegramId jika belum ada
  if (senderTelegramId && !userRecord.telegramId) {
    await db.update(user).set({ telegramId: senderTelegramId, updatedAt: new Date() }).where(eq(user.id, userRecord.id))
  }

  // ── Deteksi input angka untuk /switch bisnis ───────────────────────────────
  if (typeof message.text === 'string' && /^\d+$/.test(messageText)) {
    const num = parseInt(messageText)
    // Cek apakah ada list bisnis yang bisa di-switch
    const ownedBizSw = await db.query.business.findMany({ where: eq(business.userId, userRecord.id) })
    const membershipsSw = await db.query.businessMember.findMany({
      where: and(eq(businessMember.userId, userRecord.id), eq(businessMember.status, 'active'))
    })
    const memberBizIdsSw = membershipsSw.map(m => m.businessId)
    const memberBizSw = memberBizIdsSw.length > 0
      ? await db.query.business.findMany({ where: (b, { inArray }) => inArray(b.id, memberBizIdsSw) })
      : []
    const allBizSw = [...ownedBizSw, ...memberBizSw]

    if (allBizSw.length > 1 && num >= 1 && num <= allBizSw.length) {
      const chosen = allBizSw[num - 1]
      await db.update(user)
        .set({ activeTelegramBusinessId: chosen.id, updatedAt: new Date() })
        .where(eq(user.id, userRecord.id))
      await sendTelegramMessage(
        chatId,
        `✅ Bisnis aktif diganti ke <b>${escapeHtml(chosen.name)}</b>\n\nSekarang semua transaksi akan dicatat ke bisnis ini.`,
        'HTML'
      )
      return
    }
    // Kalau bukan konteks switch, lanjut ke flow normal (angka mungkin nominal transaksi)
  }

  // Cari bisnis yang bisa diakses (dengan preferensi activeTelegramBusinessId)
  const bizAccess = await getAccessibleBusinessForTelegram(userRecord.id, userRecord.activeTelegramBusinessId)

  if (!bizAccess) {
    await sendTelegramMessage(
      chatId,
      'Akun Anda belum memiliki bisnis dan belum diundang ke bisnis manapun. Buat bisnis di aplikasi KasAI atau minta pemilik bisnis untuk mengundang Anda.'
    )
    return
  }

  const activeBusiness = bizAccess.business
  const activeBusinessOwnerId = bizAccess.ownerId
  const activeRole = bizAccess.role

  // ── Handle foto / struk ────────────────────────────────────────────────────
  if (message.photo && Array.isArray(message.photo) && message.photo.length > 0) {
    await sendTelegramMessage(chatId, '📷 Memproses foto struk...')

    // Ambil foto resolusi tertinggi (index terakhir)
    const photo = message.photo[message.photo.length - 1]
    const caption = message.caption || ''

    const fileData = await getTelegramFileBase64(photo.file_id)
    if (!fileData) {
      await sendTelegramMessage(chatId, '❌ Gagal mengunduh foto. Silakan coba lagi.')
      return
    }

    const imageDataUrl = `data:${fileData.mimeType};base64,${fileData.base64}`
    const extracted = await extractTransactionsFromImage(imageDataUrl, {
      accountType: userRecord.accountType || undefined,
      businessType: activeBusiness.type,
      businessName: activeBusiness.name,
      caption: caption || undefined,
    })

    if (extracted.length > 0) {
      // Jika ada caption, gunakan sebagai deskripsi override untuk transaksi pertama
      const created = []
      for (let i = 0; i < extracted.length; i++) {
        const item = extracted[i]
        const id = nanoid()
        // Gunakan caption sebagai deskripsi jika ada dan ini transaksi pertama
        const description = (i === 0 && caption) ? caption : item.description
        await db.insert(transaction).values({
          id,
          businessId: activeBusiness.id,
          userId: activeBusinessOwnerId,
          inputByUserId: userRecord.id,
          amount: item.amount.toString(),
          transaction_type: item.transactionType,
          description,
          categoryId: null,
          source: 'receipt_image',
          createdAt: new Date(),
          updatedAt: new Date(),
        })
        created.push({ ...item, description })
      }

      const summary = created
        .map((item) =>
          `${item.transactionType === 'income' ? '📈 Pemasukan' : '📉 Pengeluaran'}: <b>Rp ${Number(item.amount).toLocaleString('id-ID')}</b>\n   ${escapeHtml(item.description)}`
        )
        .join('\n')

      await sendTelegramMessage(
        chatId,
        `✅ Struk berhasil dibaca untuk <b>${escapeHtml(activeBusiness.name)}</b>:\n\n${summary}`,
        'HTML'
      )
    } else if (caption) {
      // Gemini tidak bisa baca foto, tapi ada caption — coba ekstrak dari caption
      const extractedFromCaption = await extractTransactionsFromText(caption, {
        accountType: userRecord.accountType || undefined,
        businessType: activeBusiness.type,
        businessName: activeBusiness.name,
      })
      if (extractedFromCaption.length > 0) {
        for (const item of extractedFromCaption) {
          await db.insert(transaction).values({
            id: nanoid(),
            businessId: activeBusiness.id,
            userId: activeBusinessOwnerId,
            inputByUserId: userRecord.id,
            amount: item.amount.toString(),
            transaction_type: item.transactionType,
            description: item.description,
            categoryId: null,
            source: 'receipt_image',
            createdAt: new Date(),
            updatedAt: new Date(),
          })
        }
        const summary = extractedFromCaption
          .map((item) =>
            `${item.transactionType === 'income' ? '📈 Pemasukan' : '📉 Pengeluaran'}: <b>Rp ${Number(item.amount).toLocaleString('id-ID')}</b>\n   ${escapeHtml(item.description)}`
          )
          .join('\n')
        await sendTelegramMessage(
          chatId,
          `✅ Transaksi dicatat dari keterangan foto:\n\n${summary}`,
          'HTML'
        )
      } else {
        // Caption ada tapi tidak ada nominal — minta user ketik nominal
        await sendTelegramMessage(
          chatId,
          `⚠️ Foto diterima dengan keterangan "<b>${escapeHtml(caption)}</b>" tapi nominal tidak terdeteksi.\n\nCoba ketik: <i>"${escapeHtml(caption)} [nominal]"</i>\nContoh: <i>"${escapeHtml(caption)} 750000"</i>`,
          'HTML'
        )
      }
    } else {
      await sendTelegramMessage(
        chatId,
        '⚠️ Tidak ada transaksi yang terdeteksi dari foto ini.\n\nTips:\n• Tambahkan keterangan saat kirim foto (contoh: "Bayar kos 750rb")\n• Atau ketik transaksinya sebagai teks'
      )
    }
    return
  }

  if (typeof message.text === 'string') {
    const text = message.text.trim()

    // Skip jika command (sudah dihandle di atas)
    if (text.startsWith('/')) {
      await sendTelegramMessage(chatId, 'Perintah tidak dikenal. Ketik /help untuk panduan.')
      return
    }

    const sessionKey = `telegram:${chatId}`

    // Pastikan session ada dengan konteks user
    getOrCreateSession(sessionKey, { userId: userRecord.id, businessId: activeBusiness.id })

    // ── Cek konfirmasi pending (ya/tidak) ─────────────────────────────────
    const confirmKw = new Set(['ya', 'yes', 'ok', 'oke', 'y', 'lanjut'])
    const cancelKw  = new Set(['tidak', 'no', 'n', 'batal', 'cancel', 'ga', 'gak', 'jangan'])
    const isConfirm = confirmKw.has(text.toLowerCase())
    const isCancel  = cancelKw.has(text.toLowerCase())

    if (isConfirm || isCancel) {
      const pendingAction = getPendingAction(sessionKey)

      if (pendingAction) {
        clearPendingAction(sessionKey)

        if (isCancel) {
          await sendTelegramMessage(chatId, '❌ Action dibatalkan.')
          return
        }

        // Handle special edit confirmation
        if ((pendingAction as any).type === 'edit_operation') {
          const { opId, editIntent } = (pendingAction as any).params
          const session = getOrCreateSession(sessionKey)
          const op = session.recentOperations.find(o => o.id === opId)
          if (!op) {
            await sendTelegramMessage(chatId, '❌ Operasi tidak ditemukan. Mungkin sudah terlalu lama.')
            return
          }
          const result = await executeEdit(op, editIntent)
          if (result.success && result.updatedData) {
            op.executedData = { ...op.executedData, ...result.updatedData }
          }
          await sendTelegramMessage(chatId, formatEditSuccessMessage(op, editIntent, result))
          return
        }

        // Execute confirmed action
        const result = await executeAIAction(pendingAction, {
          userId: activeBusinessOwnerId,
          businessId: activeBusiness.id,
        })

        if (!result.success) {
          await sendTelegramMessage(chatId, `❌ ${result.message}`)
          return
        }

        // Simpan ke recent operations untuk edit/undo
        const entityTypeMap: Record<string, any> = {
          create_transaction: 'transaction',
          create_goal: 'goal',
          update_goal: 'goal',
          create_payable: 'payable',
          create_receivable: 'receivable',
          create_inventory_item: 'inventory_item',
          adjust_inventory_stock: 'inventory_log',
        }
        const entityType = entityTypeMap[pendingAction.type]
        if (entityType && result.data?.id) {
          const p = pendingAction.params
          const currency = (n: number) => `Rp ${n?.toLocaleString('id-ID') || '0'}`
          const descMap: Record<string, string> = {
            create_transaction: `${p.transactionType === 'income' ? 'Pemasukan' : 'Pengeluaran'} ${currency(p.amount)} - ${p.description}`,
            create_goal: `Goal "${p.title}" target ${currency(p.targetAmount)}`,
            add_goal_contribution: `Kontribusi ${currency(p.amount)} ke goal`,
            create_payable: `Hutang ke ${p.contactName} ${currency(p.amount)}`,
            create_receivable: `Piutang dari ${p.contactName} ${currency(p.amount)}`,
            create_inventory_item: `Item inventaris "${p.name}"`,
          }
          addRecentOperation(sessionKey, {
            actionType: pendingAction.type,
            entityId: result.data.id,
            entityType,
            snapshot: {},
            executedData: { ...p, ...result.data },
            canEdit: true,
            canUndo: true,
            description: descMap[pendingAction.type] || pendingAction.type,
          })
        }

        await sendTelegramMessage(chatId, generateSuccessMessage(pendingAction, result.data))
        return
      }
      // Tidak ada pending — fall through ke AI/extract
    }

    // ── Cek intent edit/undo ──────────────────────────────────────────────
    const lastOp = getLastOperation(sessionKey)
    if (lastOp) {
      const editIntent = await parseEditIntent(text, lastOp)

      if (editIntent.type !== 'none' && editIntent.confidence >= 70) {
        if (editIntent.type === 'undo') {
          if (!lastOp.canUndo) {
            await sendTelegramMessage(chatId, `❌ Operasi "${lastOp.description}" tidak bisa dibatalkan.`)
            return
          }
          const result = await executeUndo(lastOp)
          if (result.success) {
            const session = getOrCreateSession(sessionKey)
            session.recentOperations = session.recentOperations.filter(op => op.id !== lastOp.id)
          }
          await sendTelegramMessage(chatId, result.message)
          return
        }

        if (editIntent.type === 'edit') {
          if (!lastOp.canEdit) {
            await sendTelegramMessage(chatId, `❌ Operasi "${lastOp.description}" tidak bisa diedit.`)
            return
          }
          // Minta konfirmasi edit
          const oldVal = getOldValueForDisplay(lastOp, editIntent.field)
          const newVal = formatValueForDisplay(editIntent.newValue, editIntent.field)
          const confirmMsg = [
            `✏️ <b>Konfirmasi Edit</b>`,
            `📌 Operasi: ${lastOp.description}`,
            oldVal ? `📌 Sebelum: ${oldVal}` : '',
            `✅ Sesudah: ${newVal}`,
            '',
            'Balas "ya" untuk konfirmasi atau "tidak" untuk batal.',
          ].filter(Boolean).join('\n')

          setPendingAction(sessionKey, {
            type: 'edit_operation' as any,
            params: { opId: lastOp.id, editIntent },
            confidence: editIntent.confidence,
            explanation: editIntent.reason,
          })
          await sendTelegramMessage(chatId, confirmMsg, 'HTML')
          return
        }
      }
    }

    // ── Coba parse sebagai action (goals, hutang, inventaris, dll) ────────
    // Load active goals untuk konteks AI
    const activeGoalsForContext = await db.query.goal.findMany({
      where: and(eq(goal.businessId, activeBusiness.id), eq(goal.userId, activeBusinessOwnerId), eq(goal.completed, false)),
    })

    const action = await parseUserIntent(text, {
      businessName: activeBusiness.name,
      accountType: userRecord.accountType || 'personal',
      activeGoals: activeGoalsForContext.map(g => ({ id: g.id, title: g.title })),
    })

    // Kalau bukan query dan confidence tinggi → tawari sebagai action
    if (
      action.type !== 'unknown' &&
      action.type !== 'query_data' &&
      action.type !== 'create_transaction' && // transaksi dihandle oleh extractor
      action.confidence >= 75
    ) {
      // Khusus add_goal_contribution: cek goalContributionAsExpense config
      if (action.type === 'add_goal_contribution') {
        const featureCfgGoal = await getFeatureConfig(activeBusiness.id).catch(() => null)
        const alsoAsExpense = featureCfgGoal?.goalContributionAsExpense === true

        // Cari goal yang cocok dari activeGoalsForContext
        let targetGoalId: string | undefined = action.params.goalId
        if (!targetGoalId && action.params.goalTitle) {
          const lower = action.params.goalTitle.toLowerCase()
          const matched = activeGoalsForContext.find(g => g.title.toLowerCase().includes(lower))
          targetGoalId = matched?.id
        }

        if (!targetGoalId && activeGoalsForContext.length === 1) {
          targetGoalId = activeGoalsForContext[0].id
        }

        if (!targetGoalId) {
          // Tampilkan list goals untuk dipilih
          let menu = `💰 <b>Tabung ke goal mana?</b>\n\n`
          activeGoalsForContext.forEach((g, i) => {
            const sisa = parseFloat(g.targetAmount) - parseFloat(g.currentAmount)
            menu += `${i + 1}. <b>${escapeHtml(g.title)}</b> — sisa Rp ${sisa.toLocaleString('id-ID')}\n`
          })
          menu += `\nKetik: <code>/tabung [nomor] [jumlah]</code>\nContoh: <code>/tabung 1 ${action.params.amount?.toLocaleString('id-ID') || '500000'}</code>`
          await sendTelegramMessage(chatId, menu, 'HTML')
          return
        }

        // Execute langsung tanpa confirm (kontribusi goal low-risk)
        const targetGoalRecord = activeGoalsForContext.find(g => g.id === targetGoalId)
        if (!targetGoalRecord) {
          await sendTelegramMessage(chatId, '❌ Goal tidak ditemukan.')
          return
        }

        const contrib = action.params.amount as number
        const newCurrent = parseFloat(targetGoalRecord.currentAmount) + contrib
        const newTarget = parseFloat(targetGoalRecord.targetAmount)
        const completed = newCurrent >= newTarget
        const pct = Math.min(Math.round((newCurrent / newTarget) * 100), 100)

        await db.update(goal).set({
          currentAmount: newCurrent.toString(),
          completed,
          updatedAt: new Date(),
        }).where(eq(goal.id, targetGoalId))

        if (alsoAsExpense) {
          await db.insert(transaction).values({
            id: nanoid(),
            businessId: activeBusiness.id,
            userId: activeBusinessOwnerId,
            inputByUserId: userRecord.id,
            amount: contrib.toString(),
            transaction_type: 'expense',
            description: `Tabungan: ${targetGoalRecord.title}`,
            categoryName: 'Tabungan/Goal',
            source: 'telegram',
          })
        }

        const bar = '█'.repeat(Math.floor(pct / 10)) + '░'.repeat(10 - Math.floor(pct / 10))
        const sisa = Math.max(0, newTarget - newCurrent)

        let reply = `✅ <b>Kontribusi berhasil!</b>\n\n`
        reply += `🎯 <b>${escapeHtml(targetGoalRecord.title)}</b>\n`
        reply += `💰 Ditambahkan: Rp ${contrib.toLocaleString('id-ID')}\n`
        reply += `${bar} ${pct}%\n`
        reply += `Terkumpul: Rp ${newCurrent.toLocaleString('id-ID')} / Rp ${newTarget.toLocaleString('id-ID')}\n`

        if (completed) {
          reply += `\n🎉 <b>SELAMAT! Target tercapai!</b> 🎊`
        } else {
          reply += `Sisa: Rp ${sisa.toLocaleString('id-ID')}\n`
          if (alsoAsExpense) reply += `\n📊 <i>Dicatat juga sebagai pengeluaran.</i>`
        }

        // Simpan ke conversation store
        addRecentOperation(sessionKey, {
          actionType: 'add_goal_contribution',
          entityId: targetGoalId,
          entityType: 'goal',
          snapshot: { currentAmount: targetGoalRecord.currentAmount },
          executedData: { goalId: targetGoalId, title: targetGoalRecord.title, amount: contrib },
          canEdit: false,
          canUndo: true,
          description: `Kontribusi Rp ${contrib.toLocaleString('id-ID')} ke goal "${targetGoalRecord.title}"`,
        })

        await sendTelegramMessage(chatId, reply, 'HTML')
        return
      }

      // Untuk action lain — minta konfirmasi dulu
      setPendingAction(sessionKey, action)
      await sendTelegramMessage(chatId, generateConfirmationMessage(action))
      return
    }

    // ── Extractor transaksi biasa ─────────────────────────────────────────
    const extracted = await extractTransactionsFromText(text, {
      accountType: userRecord.accountType || undefined,
      businessType: activeBusiness.type,
      businessName: activeBusiness.name,
    })

    if (extracted.length > 0) {
      const created = []
      for (const item of extracted) {
        const id = nanoid()
        await db.insert(transaction).values({
          id,
          businessId: activeBusiness.id,
          userId: activeBusinessOwnerId,
          inputByUserId: userRecord.id,
          amount: item.amount.toString(),
          transaction_type: item.transactionType,
          description: item.description,
          categoryId: null,
          categoryName: item.category !== 'other' ? item.category : null,
          source: 'telegram',
          createdAt: new Date(),
          updatedAt: new Date(),
        })
        created.push({ ...item, id })
      }

      const summary = created
        .map((item) =>
          `${item.transactionType === 'income' ? '📈 Pemasukan' : '📉 Pengeluaran'}: <b>Rp ${Number(item.amount).toLocaleString('id-ID')}</b>\n   ${escapeHtml(item.description)}`
        )
        .join('\n')

      await sendTelegramMessage(
        chatId,
        `✅ Transaksi dicatat untuk <b>${escapeHtml(activeBusiness.name)}</b>:\n\n${summary}\n\n<i>Ketik "batalkan yang tadi" jika salah input</i>`,
        'HTML'
      )

      // Simpan transaksi pertama ke recent operations untuk edit/undo
      if (created[0]) {
        const first = created[0]
        const currency = (n: number) => `Rp ${n?.toLocaleString('id-ID') || '0'}`
        addRecentOperation(sessionKey, {
          actionType: 'create_transaction',
          entityId: first.id,
          entityType: 'transaction',
          snapshot: {},
          executedData: {
            amount: first.amount.toString(),
            transaction_type: first.transactionType,
            description: first.description,
            categoryName: first.category,
          },
          canEdit: true,
          canUndo: true,
          description: `${first.transactionType === 'income' ? 'Pemasukan' : 'Pengeluaran'} ${currency(first.amount)} - ${first.description}`,
        })
      }

      // Budget alert
      const expenseItems = created.filter(item => item.transactionType === 'expense')
      if (expenseItems.length > 0) {
        try {
          const now = new Date()
          const startMonth = new Date(now.getFullYear(), now.getMonth(), 1)
          const [budgets, monthTxns] = await Promise.all([
            db.query.budget.findMany({ where: and(eq(budget.businessId, activeBusiness.id), eq(budget.userId, activeBusinessOwnerId)) }),
            db.query.transaction.findMany({
              where: and(eq(transaction.businessId, activeBusiness.id), gte(transaction.createdAt, startMonth)),
            }),
          ])

          if (budgets.length > 0) {
            const spentByCategory = buildSpendingByCategory(
              monthTxns
                .filter(t => t.transaction_type === 'expense')
                .map(t => ({ categoryName: t.categoryName, categoryId: t.categoryId, amount: t.amount }))
            )
            const alerts: string[] = []
            budgets.forEach(b => {
              const spent = spentByCategory[b.category] || 0
              const budgetAmt = parseFloat(b.amount)
              const pct = (spent / budgetAmt) * 100
              const label = CATEGORY_LABELS[b.category] || b.category
              if (pct > 100) alerts.push(`🔴 Budget <b>${label}</b> melebihi batas! (${Math.round(pct)}%)`)
              else if (pct > 80) alerts.push(`🟡 Budget <b>${label}</b> hampir habis (${Math.round(pct)}%)`)
            })
            if (alerts.length > 0) {
              await sendTelegramMessage(chatId, `⚠️ <b>Peringatan Budget:</b>\n${alerts.join('\n')}`, 'HTML')
            }
          }
        } catch { /* non-critical */ }
      }
      return
    }

    // ── Fallback: AI Chat ────────────────────────────────────────────────
    try {
      const allTxns = await db.query.transaction.findMany({
        where: eq(transaction.businessId, activeBusiness.id),
        orderBy: (t, { desc }) => [desc(t.createdAt)],
      })
      const now = new Date()
      const thisMonth = allTxns.filter((t) => {
        const d = new Date(t.createdAt)
        return d.getMonth() === now.getMonth() && d.getFullYear() === now.getFullYear()
      })
      const totalIncome  = allTxns.filter(t => t.transaction_type === 'income').reduce((s, t) => s + parseFloat(t.amount), 0)
      const totalExpense = allTxns.filter(t => t.transaction_type === 'expense').reduce((s, t) => s + parseFloat(t.amount), 0)
      const monthIncome  = thisMonth.filter(t => t.transaction_type === 'income').reduce((s, t) => s + parseFloat(t.amount), 0)
      const monthExpense = thisMonth.filter(t => t.transaction_type === 'expense').reduce((s, t) => s + parseFloat(t.amount), 0)
      const topExpenses  = allTxns.filter(t => t.transaction_type === 'expense')
        .sort((a, b) => parseFloat(b.amount) - parseFloat(a.amount)).slice(0, 3)
        .map(t => ({ desc: t.description, amount: parseFloat(t.amount) }))
      const recentTx = allTxns.slice(0, 5).map(t => ({
        type: t.transaction_type, desc: t.description, amount: parseFloat(t.amount),
        date: new Date(t.createdAt).toLocaleDateString('id-ID', { day: 'numeric', month: 'short' }),
      }))

      const aiResponse = await chatWithAI(
        [{ role: 'user', content: text }],
        {
          accountType: userRecord.accountType || 'personal',
          phoneNumber: userRecord.phoneNumber || undefined,
          businessType: activeBusiness.type,
          businessName: activeBusiness.name,
          aiPersona: userRecord.aiPersona || 'professional',
          financialSummary: { totalIncome, totalExpense, netProfit: totalIncome - totalExpense, txCount: allTxns.length, monthIncome, monthExpense, topExpenses, recentTx },
        }
      )
      await sendTelegramMessage(chatId, aiResponse || 'Maaf, saya tidak dapat memproses pesan ini.')
    } catch {
      await sendTelegramMessage(chatId, 'Maaf, terjadi kesalahan. Silakan coba lagi.')
    }
    return
  }

  await sendTelegramMessage(chatId, 'Silakan kirimkan pesan teks. Ketik /help untuk panduan.')
}

// ─── Display helpers ──────────────────────────────────────────────────────────
function getOldValueForDisplay(op: any, field?: string): string | null {
  if (!field || !op.executedData) return null
  const d = op.executedData
  const cur = (v: any) => `Rp ${parseFloat(String(v || 0)).toLocaleString('id-ID')}`
  if (field === 'amount') return cur(d.amount)
  if (field === 'targetAmount') return cur(d.targetAmount)
  if (field === 'description') return `"${d.description}"`
  if (field === 'transactionType') return d.transaction_type === 'income' ? 'Pemasukan' : 'Pengeluaran'
  if (field === 'contactName') return d.contactName || null
  return null
}

function formatValueForDisplay(value: any, field?: string): string {
  if (value === null || value === undefined) return 'N/A'
  if ((field === 'amount' || field === 'targetAmount') && typeof value === 'number')
    return `Rp ${value.toLocaleString('id-ID')}`
  if (field === 'transactionType') return value === 'income' ? 'Pemasukan' : 'Pengeluaran'
  return String(value)
}
