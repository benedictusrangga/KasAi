import { db } from '@/lib/db'
import { business, transaction, user, goal, budget } from '@/lib/db/schema'
import { and, eq, gte, lte } from 'drizzle-orm'
import { nanoid } from 'nanoid'
import { extractTransactionsFromText, extractTransactionsFromImage, chatWithAI } from '@/lib/gemini'

const TELEGRAM_BOT_TOKEN = process.env.TELEGRAM_BOT_TOKEN

const CATEGORY_LABELS: Record<string, string> = {
  groceries: 'Bahan Makanan', transportation: 'Transportasi', utilities: 'Utilitas',
  entertainment: 'Hiburan', dining: 'Makan & Minum', shopping: 'Belanja',
  healthcare: 'Kesehatan', education: 'Pendidikan', office_supplies: 'Perlengkapan Kantor', other: 'Lainnya',
}

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
  await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  })
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
      `<b>📝 Mencatat transaksi:</b>\n` +
      `• "beli gula 50rb" → pengeluaran Rp 50.000\n` +
      `• "terima bayaran 1.5jt" → pemasukan Rp 1.500.000\n` +
      `• Kirim foto struk/bukti transfer → AI baca otomatis\n\n` +
      `<b>📊 Tanya AI:</b>\n` +
      `• "berapa laba bulan ini?"\n` +
      `• "status budget hiburan saya"\n` +
      `• "progress target saya"\n\n` +
      `<b>⌨️ Perintah:</b>\n` +
      `/start - Mulai & info bot\n` +
      `/help - Panduan penggunaan\n` +
      `/status - Cek status akun\n` +
      `/laporan - Laporan keuangan bulan ini\n` +
      `/laporan_minggu - Laporan minggu ini\n` +
      `/budget - Cek status budget bulan ini\n` +
      `/target - Cek progress semua target`,
      'HTML'
    )
    return
  }

  // ── Handle /status command ─────────────────────────────────────────────────
  if (messageText === '/status') {
    let userRecord = senderTelegramId ? await findUserByTelegramId(senderTelegramId) : null
    if (userRecord) {
      const businesses = await db.query.business.findMany({ where: eq(business.userId, userRecord.id) })
      await sendTelegramMessage(
        chatId,
        `✅ <b>Akun terhubung</b>\n\n` +
        `👤 Nama: ${userRecord.name || '-'}\n` +
        `📧 Email: ${userRecord.email}\n` +
        `🏪 Bisnis aktif: ${businesses.length > 0 ? businesses[0].name : 'Belum ada'}\n` +
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
    const tempBusinesses = await db.query.business.findMany({ where: eq(business.userId, tempUser.id) })
    if (tempBusinesses.length === 0) {
      await sendTelegramMessage(chatId, '⚠️ Belum ada bisnis. Buat bisnis di aplikasi KasAI.')
      return
    }
    const biz = tempBusinesses[0]
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
        eq(transaction.userId, tempUser.id),
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

  // ── Handle /budget ─────────────────────────────────────────────────────────
  if (messageText === '/budget') {
    const tempUser = senderTelegramId ? await findUserByTelegramId(senderTelegramId) : null
    if (!tempUser) { await sendTelegramMessage(chatId, '❌ Akun belum terhubung.'); return }
    const tempBiz = (await db.query.business.findMany({ where: eq(business.userId, tempUser.id) }))[0]
    if (!tempBiz) { await sendTelegramMessage(chatId, '⚠️ Belum ada bisnis.'); return }

    const budgets = await db.query.budget.findMany({ where: and(eq(budget.businessId, tempBiz.id), eq(budget.userId, tempUser.id)) })
    if (budgets.length === 0) {
      await sendTelegramMessage(chatId, '📋 Belum ada budget yang ditetapkan.\n\nAtur budget di menu <b>Goals &amp; Budget</b> di aplikasi KasAI.', 'HTML')
      return
    }

    const now = new Date()
    const startMonth = new Date(now.getFullYear(), now.getMonth(), 1)
    const txns = await db.query.transaction.findMany({
      where: and(eq(transaction.businessId, tempBiz.id), eq(transaction.userId, tempUser.id), gte(transaction.createdAt, startMonth)),
    })

    const spentByCategory: Record<string, number> = {}
    txns.filter(t => t.transaction_type === 'expense').forEach(t => {
      const cat = t.categoryId || 'other'
      spentByCategory[cat] = (spentByCategory[cat] || 0) + parseFloat(t.amount)
    })

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

  // ── Handle /target ─────────────────────────────────────────────────────────
  if (messageText === '/target') {
    const tempUser = senderTelegramId ? await findUserByTelegramId(senderTelegramId) : null
    if (!tempUser) { await sendTelegramMessage(chatId, '❌ Akun belum terhubung.'); return }
    const tempBiz = (await db.query.business.findMany({ where: eq(business.userId, tempUser.id) }))[0]
    if (!tempBiz) { await sendTelegramMessage(chatId, '⚠️ Belum ada bisnis.'); return }

    const goals = await db.query.goal.findMany({ where: and(eq(goal.businessId, tempBiz.id), eq(goal.userId, tempUser.id)) })
    if (goals.length === 0) {
      await sendTelegramMessage(chatId, '🎯 Belum ada target keuangan.\n\nTambahkan target di menu <b>Goals &amp; Budget</b> di aplikasi KasAI.', 'HTML')
      return
    }

    let msg = `🎯 <b>PROGRESS TARGET KEUANGAN</b>\n\n`
    goals.forEach(g => {
      const pct = Math.min(Math.round((parseFloat(g.currentAmount) / parseFloat(g.targetAmount)) * 100), 100)
      const bar = '█'.repeat(Math.floor(pct / 10)) + '░'.repeat(10 - Math.floor(pct / 10))
      const icon = g.completed ? '✅' : pct >= 75 ? '🔥' : pct >= 50 ? '💪' : '🎯'
      msg += `${icon} <b>${escapeHtml(g.title)}</b>\n`
      msg += `${bar} ${pct}%\n`
      msg += `Rp ${parseFloat(g.currentAmount).toLocaleString('id-ID')} / Rp ${parseFloat(g.targetAmount).toLocaleString('id-ID')}\n`
      if (g.deadline) msg += `📅 Deadline: ${new Date(g.deadline).toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' })}\n`
      if (g.completed) msg += `🎉 Target tercapai!\n`
      msg += '\n'
    })

    await sendTelegramMessage(chatId, msg, 'HTML')
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
      `3. Isi kolom <b>Nomor HP</b> dengan nomor Telegram Anda\n` +
      `4. Klik Simpan, lalu coba kirim pesan lagi\n\n` +
      `Ketik /start untuk info lebih lanjut.`,
      'HTML'
    )
    return
  }

  // Auto-save phone number jika user kirim kontak
  if (message.contact && !userRecord.phoneNumber) {
    await db
      .update(user)
      .set({ phoneNumber: message.contact.phone_number, updatedAt: new Date() })
      .where(eq(user.id, userRecord.id))
  }

  // Auto-link telegramId jika belum ada
  if (senderTelegramId && !userRecord.telegramId) {
    await db
      .update(user)
      .set({ telegramId: senderTelegramId, updatedAt: new Date() })
      .where(eq(user.id, userRecord.id))
  }

  const businesses = await db.query.business.findMany({
    where: eq(business.userId, userRecord.id),
  })

  if (businesses.length === 0) {
    await sendTelegramMessage(
      chatId,
      '⚠️ Akun Anda belum memiliki bisnis. Silakan buat bisnis terlebih dahulu di aplikasi KasAI.'
    )
    return
  }

  const activeBusiness = businesses[0]

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
          userId: userRecord.id,
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
            userId: userRecord.id,
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
          userId: userRecord.id,
          amount: item.amount.toString(),
          transaction_type: item.transactionType,
          description: item.description,
          categoryId: null,
          source: 'telegram',
          createdAt: new Date(),
          updatedAt: new Date(),
        })
        created.push(item)
      }

      const summary = created
        .map((item) =>
          `${item.transactionType === 'income' ? '📈 Pemasukan' : '📉 Pengeluaran'}: <b>Rp ${Number(item.amount).toLocaleString('id-ID')}</b>\n   ${escapeHtml(item.description)}`
        )
        .join('\n')

      await sendTelegramMessage(
        chatId,
        `✅ Transaksi dicatat untuk <b>${escapeHtml(activeBusiness.name)}</b>:\n\n${summary}`,
        'HTML'
      )

      // ── Budget alert setelah transaksi expense ─────────────────────────────
      const expenseItems = created.filter(item => item.transactionType === 'expense')
      if (expenseItems.length > 0) {
        const now = new Date()
        const startMonth = new Date(now.getFullYear(), now.getMonth(), 1)
        const [budgets, monthTxns] = await Promise.all([
          db.query.budget.findMany({ where: and(eq(budget.businessId, activeBusiness.id), eq(budget.userId, userRecord.id)) }),
          db.query.transaction.findMany({
            where: and(eq(transaction.businessId, activeBusiness.id), eq(transaction.userId, userRecord.id), gte(transaction.createdAt, startMonth)),
          }),
        ])

        if (budgets.length > 0) {
          const spentByCategory: Record<string, number> = {}
          monthTxns.filter(t => t.transaction_type === 'expense').forEach(t => {
            const cat = t.categoryId || 'other'
            spentByCategory[cat] = (spentByCategory[cat] || 0) + parseFloat(t.amount)
          })

          const alerts: string[] = []
          budgets.forEach(b => {
            const spent = spentByCategory[b.category] || 0
            const budgetAmt = parseFloat(b.amount)
            const pct = (spent / budgetAmt) * 100
            const label = CATEGORY_LABELS[b.category] || b.category
            if (pct > 100) {
              alerts.push(`🔴 Budget <b>${label}</b> melebihi batas! (${Math.round(pct)}% — Rp ${spent.toLocaleString('id-ID')} dari Rp ${budgetAmt.toLocaleString('id-ID')})`)
            } else if (pct > 80) {
              alerts.push(`🟡 Budget <b>${label}</b> hampir habis (${Math.round(pct)}% — sisa Rp ${(budgetAmt - spent).toLocaleString('id-ID')})`)
            }
          })

          if (alerts.length > 0) {
            await sendTelegramMessage(chatId, `⚠️ <b>Peringatan Budget:</b>\n\n${alerts.join('\n')}`, 'HTML')
          }
        }
      }
      return
    }

    // Fallback ke AI chat — inject data keuangan real
    try {
      // Ambil ringkasan keuangan (hemat token: hanya agregat, bukan semua transaksi)
      const allTxns = await db.query.transaction.findMany({
        where: eq(transaction.businessId, activeBusiness.id),
        orderBy: (t, { desc }) => [desc(t.createdAt)],
      })

      const now = new Date()
      const thisMonth = allTxns.filter((t) => {
        const d = new Date(t.createdAt)
        return d.getMonth() === now.getMonth() && d.getFullYear() === now.getFullYear()
      })

      const totalIncome = allTxns.filter((t) => t.transaction_type === 'income').reduce((s, t) => s + parseFloat(t.amount), 0)
      const totalExpense = allTxns.filter((t) => t.transaction_type === 'expense').reduce((s, t) => s + parseFloat(t.amount), 0)
      const monthIncome = thisMonth.filter((t) => t.transaction_type === 'income').reduce((s, t) => s + parseFloat(t.amount), 0)
      const monthExpense = thisMonth.filter((t) => t.transaction_type === 'expense').reduce((s, t) => s + parseFloat(t.amount), 0)

      // Top 3 pengeluaran terbesar
      const topExpenses = allTxns
        .filter((t) => t.transaction_type === 'expense')
        .sort((a, b) => parseFloat(b.amount) - parseFloat(a.amount))
        .slice(0, 3)
        .map((t) => ({ desc: t.description, amount: parseFloat(t.amount) }))

      // 5 transaksi terakhir
      const recentTx = allTxns.slice(0, 5).map((t) => ({
        type: t.transaction_type,
        desc: t.description,
        amount: parseFloat(t.amount),
        date: new Date(t.createdAt).toLocaleDateString('id-ID', { day: 'numeric', month: 'short' }),
      }))

      const aiResponse = await chatWithAI(
        [{ role: 'user', content: text }],
        {
          accountType: userRecord.accountType || 'personal',
          phoneNumber: userRecord.phoneNumber || undefined,
          businessType: activeBusiness.type,
          businessName: activeBusiness.name,
          financialSummary: {
            totalIncome,
            totalExpense,
            netProfit: totalIncome - totalExpense,
            txCount: allTxns.length,
            monthIncome,
            monthExpense,
            topExpenses,
            recentTx,
          },
        }
      )
      await sendTelegramMessage(chatId, aiResponse || 'Maaf, saya tidak dapat memproses pesan ini.')
    } catch {
      await sendTelegramMessage(chatId, 'Maaf, terjadi kesalahan. Silakan coba lagi.')
    }
    return
  }

  await sendTelegramMessage(
    chatId,
    'Silakan kirimkan pesan teks untuk mencatat transaksi atau menanyakan laporan keuangan.\n\nKetik /help untuk panduan.'
  )
}
