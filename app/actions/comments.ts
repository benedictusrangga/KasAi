'use server'

import { auth } from '@/lib/auth'
import { db } from '@/lib/db'
import { transactionComment, business, businessMember, user, transaction } from '@/lib/db/schema'
import { and, eq, desc, ne } from 'drizzle-orm'
import { headers, cookies } from 'next/headers'
import { revalidatePath } from 'next/cache'
import { nanoid } from 'nanoid'
import { getBusinessAccess } from './members'

const TELEGRAM_BOT_TOKEN = process.env.TELEGRAM_BOT_TOKEN

async function getUserId() {
  const h = await headers()
  const c = await cookies()
  const cookieString = c.getAll().map((ck) => `${ck.name}=${ck.value}`).join('; ')
  const reqHeaders = new Headers(h as any)
  if (cookieString) reqHeaders.set('cookie', cookieString)
  const session = await auth.api.getSession({ headers: reqHeaders })
  if (!session?.user) throw new Error('Unauthorized')
  return session.user.id
}

async function sendTelegramMessage(chatId: number, text: string) {
  if (!TELEGRAM_BOT_TOKEN) return
  try {
    await fetch(`https://api.telegram.org/bot${TELEGRAM_BOT_TOKEN}/sendMessage`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        chat_id: chatId,
        text,
        parse_mode: 'HTML',
        disable_web_page_preview: true,
      }),
    })
  } catch {
    // Jangan crash jika Telegram gagal
    console.error('[Comments] Gagal kirim notifikasi Telegram ke chatId:', chatId)
  }
}

/**
 * Kirim notifikasi Telegram ke semua member bisnis (kecuali si pembuat komentar)
 */
async function notifyMembersViaTelegram(
  businessId: string,
  commentAuthorId: string,
  authorName: string,
  businessName: string,
  commentContent: string,
  transactionDesc?: string | null
) {
  try {
    // Ambil owner bisnis
    const biz = await db.query.business.findFirst({
      where: eq(business.id, businessId),
    })
    if (!biz) return

    // Kumpulkan semua user yang perlu dinotifikasi (owner + member aktif)
    const memberRows = await db.query.businessMember.findMany({
      where: and(
        eq(businessMember.businessId, businessId),
        eq(businessMember.status, 'active'),
        ne(businessMember.userId, commentAuthorId)
      ),
      with: {
        user: { columns: { id: true, telegramId: true, name: true } },
      },
    })

    // Kumpulkan telegramId yang perlu dinotifikasi
    const telegramIds: number[] = []

    // Owner — notifikasi jika bukan si pembuat komentar
    if (biz.userId !== commentAuthorId) {
      const ownerUser = await db.query.user.findFirst({
        where: eq(user.id, biz.userId),
        columns: { telegramId: true },
      })
      if (ownerUser?.telegramId) {
        telegramIds.push(parseInt(ownerUser.telegramId, 10))
      }
    }

    // Member aktif
    for (const m of memberRows) {
      if (m.user?.telegramId && m.userId !== commentAuthorId) {
        const tid = parseInt(m.user.telegramId, 10)
        if (!isNaN(tid) && !telegramIds.includes(tid)) {
          telegramIds.push(tid)
        }
      }
    }

    if (telegramIds.length === 0) return

    const txInfo = transactionDesc
      ? `\n📋 Transaksi: <b>${transactionDesc}</b>`
      : ''

    const msg =
      `💬 <b>Komentar Baru — ${businessName}</b>\n\n` +
      `👤 Dari: <b>${authorName}</b>${txInfo}\n\n` +
      `"${commentContent}"\n\n` +
      `<i>Balas komentar di aplikasi KasAI</i>`

    // Kirim ke semua penerima secara paralel
    await Promise.allSettled(telegramIds.map((tid) => sendTelegramMessage(tid, msg)))
  } catch (err) {
    console.error('[Comments] notifyMembersViaTelegram error:', err)
  }
}

/**
 * Tambah komentar baru (per transaksi atau per bisnis secara umum)
 */
export async function addComment(
  businessId: string,
  content: string,
  transactionId?: string
) {
  const userId = await getUserId()

  // Verifikasi akses ke bisnis
  await getBusinessAccess(businessId, userId)

  if (!content?.trim()) throw new Error('Komentar tidak boleh kosong')
  if (content.trim().length > 1000) throw new Error('Komentar maksimal 1000 karakter')

  // Jika ada transactionId, pastikan transaksi milik bisnis ini
  if (transactionId) {
    const txn = await db.query.transaction.findFirst({
      where: and(eq(transaction.id, transactionId), eq(transaction.businessId, businessId)),
    })
    if (!txn) throw new Error('Transaksi tidak ditemukan')
  }

  const id = nanoid()
  await db.insert(transactionComment).values({
    id,
    businessId,
    transactionId: transactionId ?? null,
    userId,
    content: content.trim(),
    createdAt: new Date(),
    updatedAt: new Date(),
  })

  revalidatePath(`/dashboard/${businessId}/transactions`)
  revalidatePath(`/dashboard/${businessId}`)

  // Ambil info untuk notifikasi
  try {
    const [authorUser, biz, txn] = await Promise.all([
      db.query.user.findFirst({
        where: eq(user.id, userId),
        columns: { name: true, email: true },
      }),
      db.query.business.findFirst({
        where: eq(business.id, businessId),
        columns: { name: true },
      }),
      transactionId
        ? db.query.transaction.findFirst({
            where: eq(transaction.id, transactionId),
            columns: { description: true },
          })
        : Promise.resolve(null),
    ])

    const authorName = authorUser?.name || authorUser?.email || 'Seseorang'
    const businessName = biz?.name || 'Bisnis'

    await notifyMembersViaTelegram(
      businessId,
      userId,
      authorName,
      businessName,
      content.trim(),
      txn?.description ?? null
    )
  } catch {
    // Notifikasi gagal tidak boleh crash action utama
  }

  return { id, content: content.trim() }
}

/**
 * Ambil komentar untuk sebuah transaksi
 */
export async function getTransactionComments(businessId: string, transactionId: string) {
  const userId = await getUserId()
  await getBusinessAccess(businessId, userId)

  return db.query.transactionComment.findMany({
    where: and(
      eq(transactionComment.businessId, businessId),
      eq(transactionComment.transactionId, transactionId)
    ),
    with: {
      user: { columns: { id: true, name: true, email: true, image: true } },
    },
    orderBy: [desc(transactionComment.createdAt)],
  })
}

/**
 * Ambil semua komentar bisnis (general, tidak terikat transaksi)
 */
export async function getBusinessComments(businessId: string) {
  const userId = await getUserId()
  await getBusinessAccess(businessId, userId)

  return db.query.transactionComment.findMany({
    where: eq(transactionComment.businessId, businessId),
    with: {
      user: { columns: { id: true, name: true, email: true, image: true } },
      transaction: { columns: { id: true, description: true, amount: true, transaction_type: true } },
    },
    orderBy: [desc(transactionComment.createdAt)],
  })
}

/**
 * Ambil info user saat ini dan role-nya di bisnis tertentu
 * Dipakai oleh client component untuk menentukan permission
 */
export async function getCurrentUserInfo(businessId: string) {
  const userId = await getUserId()
  const access = await getBusinessAccess(businessId, userId)
  const currentUser = await db.query.user.findFirst({
    where: eq(user.id, userId),
    columns: { id: true, name: true, email: true },
  })
  return {
    userId,
    name: currentUser?.name || currentUser?.email || 'Pengguna',
    isOwner: access.isOwner,
    role: access.role,
  }
}

/**
 * Hapus komentar (hanya pembuat atau owner bisnis)
 */
export async function deleteComment(businessId: string, commentId: string) {
  const userId = await getUserId()

  const comment = await db.query.transactionComment.findFirst({
    where: and(
      eq(transactionComment.id, commentId),
      eq(transactionComment.businessId, businessId)
    ),
  })
  if (!comment) throw new Error('Komentar tidak ditemukan')

  // Cek apakah owner bisnis atau pembuat komentar
  const biz = await db.query.business.findFirst({
    where: eq(business.id, businessId),
  })
  const isOwner = biz?.userId === userId
  const isAuthor = comment.userId === userId

  if (!isOwner && !isAuthor) {
    throw new Error('Tidak memiliki izin untuk menghapus komentar ini')
  }

  await db
    .delete(transactionComment)
    .where(eq(transactionComment.id, commentId))

  revalidatePath(`/dashboard/${businessId}/transactions`)
  revalidatePath(`/dashboard/${businessId}`)

  return { commentId }
}
