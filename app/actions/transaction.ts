'use server'

import { auth } from '@/lib/auth'
import { db } from '@/lib/db'
import { transaction, business, user, businessMember } from '@/lib/db/schema'
import { and, eq, desc, gte, count, or } from 'drizzle-orm'
import { headers, cookies } from 'next/headers'
import { revalidatePath } from 'next/cache'
import { nanoid } from 'nanoid'
import { getPlan, isLimitReached } from '@/lib/plan-limits'
import { getBusinessAccess } from './members'

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

/**
 * Ambil userId owner dari sebuah bisnis.
 * Dipakai untuk plan limit counting — limit selalu dihitung dari owner.
 */
async function getBusinessOwnerId(businessId: string): Promise<string> {
  const biz = await db.query.business.findFirst({
    where: eq(business.id, businessId),
  })
  if (!biz) throw new Error('Business not found')
  return biz.userId
}

export async function createTransaction(
  businessId: string,
  amount: number,
  description: string,
  categoryId?: string,
  source: 'manual' | 'telegram' | 'voice_note' | 'receipt_image' | 'api' = 'manual',
  transactionType: 'expense' | 'income' = 'expense',
  tags?: string[],
  notes?: string,
  receiptUrl?: string
) {
  const userId = await getUserId()

  // Verifikasi akses (owner atau member admin)
  const access = await getBusinessAccess(businessId, userId)
  if (access.role === 'viewer') throw new Error('Viewer tidak dapat menambah transaksi')

  // Owner ID untuk plan limit counting
  const ownerId = await getBusinessOwnerId(businessId)

  // Validasi amount
  if (isNaN(amount) || amount <= 0) throw new Error('Jumlah harus lebih dari 0')
  if (!description?.trim()) throw new Error('Deskripsi tidak boleh kosong')

  // Enforce plan limits (berdasarkan plan owner)
  const ownerUser = await db.query.user.findFirst({ where: eq(user.id, ownerId) })
  const plan = getPlan(ownerUser?.plan)

  if (plan.maxTxPerMonth !== Infinity) {
    const now = new Date()
    const startMonth = new Date(now.getFullYear(), now.getMonth(), 1)
    const [{ value: txCount }] = await db
      .select({ value: count() })
      .from(transaction)
      .where(and(eq(transaction.businessId, businessId), gte(transaction.createdAt, startMonth)))

    if (txCount >= plan.maxTxPerMonth) {
      throw new Error(
        `LIMIT_REACHED:Batas ${plan.maxTxPerMonth} transaksi/bulan untuk plan ${plan.name} sudah tercapai. Upgrade plan untuk transaksi lebih banyak.`
      )
    }
  }

  const id = nanoid()
  await db.insert(transaction).values({
    id,
    businessId,
    userId: ownerId,          // selalu owner untuk konsistensi data & plan limit
    inputByUserId: userId,    // siapa yang benar-benar input (bisa admin)
    amount: amount.toFixed(2),
    transaction_type: transactionType,
    description: description.trim(),
    categoryId: categoryId && categoryId.length > 10 ? categoryId : undefined,
    source,
    receipt_url: receiptUrl,
    tags: tags && tags.length > 0 ? tags : undefined,
    notes: notes?.trim() || undefined,
  })

  revalidatePath(`/dashboard/${businessId}`)
  revalidatePath(`/dashboard/${businessId}/transactions`)
  return { id, amount, description }
}

export async function getTransactions(businessId: string) {
  const userId = await getUserId()
  // Verifikasi akses
  await getBusinessAccess(businessId, userId)

  return db.query.transaction.findMany({
    where: eq(transaction.businessId, businessId),
    orderBy: desc(transaction.createdAt),
  })
}

export async function getBusinessTransactions(businessId: string) {
  const userId = await getUserId()
  // Verifikasi akses
  await getBusinessAccess(businessId, userId)

  return db.query.transaction.findMany({
    where: eq(transaction.businessId, businessId),
    orderBy: desc(transaction.createdAt),
  })
}

export async function getTransaction(transactionId: string) {
  const userId = await getUserId()
  const txn = await db.query.transaction.findFirst({
    where: eq(transaction.id, transactionId),
  })
  if (!txn) throw new Error('Transaction not found')

  // Verifikasi akses ke bisnis
  await getBusinessAccess(txn.businessId, userId)
  return txn
}

export async function updateTransaction(
  transactionId: string,
  updates: {
    amount?: number
    description?: string
    categoryId?: string
    tags?: string[]
    notes?: string
  }
) {
  const userId = await getUserId()

  const txn = await db.query.transaction.findFirst({
    where: eq(transaction.id, transactionId),
  })
  if (!txn) throw new Error('Transaction not found')

  // Verifikasi akses — viewer tidak bisa edit
  const access = await getBusinessAccess(txn.businessId, userId)
  if (access.role === 'viewer') throw new Error('Viewer tidak dapat mengubah transaksi')

  await db
    .update(transaction)
    .set({
      ...updates,
      amount: updates.amount ? updates.amount.toString() : undefined,
      updatedAt: new Date(),
    })
    .where(eq(transaction.id, transactionId))

  revalidatePath('/')
  return { transactionId, ...updates }
}

export async function deleteTransaction(transactionId: string) {
  const userId = await getUserId()

  const txn = await db.query.transaction.findFirst({
    where: eq(transaction.id, transactionId),
  })
  if (!txn) throw new Error('Transaction not found')

  // Hanya owner yang bisa hapus transaksi
  const access = await getBusinessAccess(txn.businessId, userId)
  if (!access.isOwner) throw new Error('Hanya pemilik bisnis yang dapat menghapus transaksi')

  await db
    .delete(transaction)
    .where(eq(transaction.id, transactionId))

  revalidatePath('/')
  return { transactionId }
}

export async function getTransactionCountThisMonth(businessId: string): Promise<number> {
  const userId = await getUserId()
  await getBusinessAccess(businessId, userId)

  const now = new Date()
  const startMonth = new Date(now.getFullYear(), now.getMonth(), 1)
  const [{ value }] = await db
    .select({ value: count() })
    .from(transaction)
    .where(and(eq(transaction.businessId, businessId), gte(transaction.createdAt, startMonth)))
  return value
}
