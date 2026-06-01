import { db } from '@/lib/db'
import { business, transaction, user } from '@/lib/db/schema'
import { eq } from 'drizzle-orm'
import { nanoid } from 'nanoid'
import { extractTransactionsFromText, extractTransactionsFromImage, chatWithAI } from '@/lib/gemini'

const TELEGRAM_BOT_TOKEN = process.env.TELEGRAM_BOT_TOKEN

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
      `<b>Mencatat transaksi:</b>\n` +
      `• "beli gula 50rb" → pengeluaran Rp 50.000\n` +
      `• "terima bayaran 1.5jt" → pemasukan Rp 1.500.000\n` +
      `• "bayar listrik 320000" → pengeluaran Rp 320.000\n\n` +
      `<b>Tanya laporan:</b>\n` +
      `• "berapa laba bulan ini?"\n` +
      `• "pengeluaran terbesar apa?"\n` +
      `• "ringkasan keuangan minggu ini"\n\n` +
      `<b>Perintah:</b>\n` +
      `/start - Mulai & info bot\n` +
      `/help - Panduan penggunaan\n` +
      `/status - Cek status akun`,
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

  // ── Identify user ──────────────────────────────────────────────────────────
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
          source: 'receipt_image',
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
        `✅ Struk berhasil dibaca untuk <b>${escapeHtml(activeBusiness.name)}</b>:\n\n${summary}`,
        'HTML'
      )
    } else {
      // Jika tidak ada transaksi terdeteksi, coba pakai caption sebagai konteks
      if (caption) {
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
          await sendTelegramMessage(chatId, `✅ Transaksi dari caption dicatat: ${caption}`)
          return
        }
      }
      await sendTelegramMessage(
        chatId,
        '⚠️ Tidak ada transaksi yang terdeteksi dari foto ini.\n\nCoba kirim foto yang lebih jelas, atau ketik transaksinya sebagai teks.'
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
      return
    }

    // Fallback ke AI chat
    try {
      const aiResponse = await chatWithAI(
        [{ role: 'user', content: text }],
        {
          accountType: userRecord.accountType || undefined,
          phoneNumber: userRecord.phoneNumber || undefined,
          businessType: activeBusiness.type,
          businessName: activeBusiness.name,
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
