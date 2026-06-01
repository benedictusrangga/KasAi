'use server'

import { auth } from '@/lib/auth'
import { db } from '@/lib/db'
import { transaction, business, user } from '@/lib/db/schema'
import { and, eq, desc, gte, count } from 'drizzle-orm'
import { headers, cookies } from 'next/headers'
import { revalidatePath } from 'next/cache'
import { nanoid } from 'nanoid'
import { getPlan, isLimitReached } from '@/lib/plan-limits'

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

  // Verifikasi bisnis milik user ini
  const biz = await db.query.business.findFirst({
    where: and(eq(business.id, businessId), eq(business.userId, userId)),
  })
  if (!biz) throw new Error('Business not found or access denied')

  // Validasi amount
  if (isNaN(amount) || amount <= 0) throw new Error('Jumlah harus lebih dari 0')
  if (!description?.trim()) throw new Error('Deskripsi tidak boleh kosong')

  // Enforce plan limits
  const currentUser = await db.query.user.findFirst({ where: eq(user.id, userId) })
  const plan = getPlan(currentUser?.plan)

  if (plan.maxTxPerMonth !== Infinity) {
    const now = new Date()
    const startMonth = new Date(now.getFullYear(), now.getMonth(), 1)
    const [{ value: txCount }] = await db
      .select({ value: count() })
      .from(transaction)
      .where(and(eq(transaction.userId, userId), gte(transaction.createdAt, startMonth)))

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
    userId,
    amount: amount.toFixed(2),
    transaction_type: transactionType,
    description: description.trim(),
    // categoryId hanya disimpan jika berupa UUID valid (bukan enum string)
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
  return db.query.transaction.findMany({
    where: and(
      eq(transaction.businessId, businessId),
      eq(transaction.userId, userId)
    ),
    orderBy: desc(transaction.createdAt),
  })
}

export async function getBusinessTransactions(businessId: string) {
  const userId = await getUserId()
  return db.query.transaction.findMany({
    where: and(
      eq(transaction.businessId, businessId),
      eq(transaction.userId, userId)
    ),
    orderBy: desc(transaction.createdAt),
  })
}

export async function getTransaction(transactionId: string) {
  const userId = await getUserId()
  const txn = await db.query.transaction.findFirst({
    where: and(eq(transaction.id, transactionId), eq(transaction.userId, userId)),
  })
  if (!txn) throw new Error('Transaction not found')
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
    where: and(eq(transaction.id, transactionId), eq(transaction.userId, userId)),
  })
  if (!txn) throw new Error('Transaction not found')

  await db
    .update(transaction)
    .set({
      ...updates,
      amount: updates.amount ? updates.amount.toString() : undefined,
      updatedAt: new Date(),
    })
    .where(and(eq(transaction.id, transactionId), eq(transaction.userId, userId)))

  revalidatePath('/')
  return { transactionId, ...updates }
}

export async function deleteTransaction(transactionId: string) {
  const userId = await getUserId()

  await db
    .delete(transaction)
    .where(and(eq(transaction.id, transactionId), eq(transaction.userId, userId)))

  revalidatePath('/')
  return { transactionId }
}

export async function getTransactionCountThisMonth(businessId: string): Promise<number> {
  const userId = await getUserId()
  const now = new Date()
  const startMonth = new Date(now.getFullYear(), now.getMonth(), 1)
  const [{ value }] = await db
    .select({ value: count() })
    .from(transaction)
    .where(and(eq(transaction.userId, userId), gte(transaction.createdAt, startMonth)))
  return value
}
