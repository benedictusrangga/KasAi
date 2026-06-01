'use server'

import { auth } from '@/lib/auth'
import { db } from '@/lib/db'
import { transaction } from '@/lib/db/schema'
import { and, eq, desc } from 'drizzle-orm'
import { headers, cookies } from 'next/headers'
import { revalidatePath } from 'next/cache'
import { nanoid } from 'nanoid'

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

  const id = nanoid()
  await db.insert(transaction).values({
    id,
    businessId,
    userId,
    amount: amount.toString(),
    transaction_type: transactionType,
    description,
    categoryId,
    source,
    receipt_url: receiptUrl,
    tags,
    notes,
  })

  revalidatePath('/')
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
