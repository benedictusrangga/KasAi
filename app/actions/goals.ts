'use server'

import { auth } from '@/lib/auth'
import { db } from '@/lib/db'
import { goal, budget, transaction } from '@/lib/db/schema'
import { and, eq, gte, sum } from 'drizzle-orm'
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

// ─── Goals ────────────────────────────────────────────────────────────────────

export async function getGoals(businessId: string) {
  const userId = await getUserId()
  return db.query.goal.findMany({
    where: and(eq(goal.userId, userId), eq(goal.businessId, businessId)),
    orderBy: (g, { asc }) => [asc(g.createdAt)],
  })
}

export async function createGoal(data: {
  businessId: string
  title: string
  description?: string
  targetAmount: number
  startAmount?: number // berapa yang sudah ada sekarang (opsional, user bisa isi manual)
  deadline?: Date
  autoTrackIncome?: boolean // apakah otomatis akumulasi dari income?
}) {
  const userId = await getUserId()
  const id = nanoid()

  const startAmount = data.startAmount ?? 0

  await db.insert(goal).values({
    id,
    userId,
    businessId: data.businessId,
    title: data.title,
    description: data.description,
    targetAmount: data.targetAmount.toString(),
    currentAmount: startAmount.toString(),
    deadline: data.deadline,
    completed: startAmount >= data.targetAmount,
  })
  revalidatePath(`/dashboard/${data.businessId}/goals`)
  revalidatePath(`/dashboard/${data.businessId}`)
  return { id }
}

export async function updateGoalProgress(goalId: string, currentAmount: number) {
  const userId = await getUserId()
  const existing = await db.query.goal.findFirst({
    where: and(eq(goal.id, goalId), eq(goal.userId, userId)),
  })
  if (!existing) throw new Error('Goal not found')

  const completed = currentAmount >= parseFloat(existing.targetAmount)
  await db.update(goal)
    .set({ currentAmount: currentAmount.toString(), completed, updatedAt: new Date() })
    .where(and(eq(goal.id, goalId), eq(goal.userId, userId)))

  revalidatePath(`/dashboard/${existing.businessId}/goals`)
  revalidatePath(`/dashboard/${existing.businessId}`)
  return { goalId, completed }
}

export async function addGoalContribution(
  goalId: string,
  amount: number,
  note?: string,
  options?: {
    alsoRecordAsExpense?: boolean  // override config, kalau user set manual
    businessId?: string            // diperlukan kalau alsoRecordAsExpense = true
    userId?: string
  }
) {
  const userId = await getUserId()
  const existing = await db.query.goal.findFirst({
    where: and(eq(goal.id, goalId), eq(goal.userId, userId)),
  })
  if (!existing) throw new Error('Goal not found')
  if (existing.completed) throw new Error('Target sudah tercapai')

  const newAmount = parseFloat(existing.currentAmount) + amount
  const completed = newAmount >= parseFloat(existing.targetAmount)

  await db.update(goal)
    .set({ currentAmount: newAmount.toString(), completed, updatedAt: new Date() })
    .where(and(eq(goal.id, goalId), eq(goal.userId, userId)))

  // Jika diset untuk juga catat sebagai pengeluaran
  const bizId = options?.businessId || existing.businessId
  let transactionId: string | undefined

  if (options?.alsoRecordAsExpense && bizId) {
    const txId = nanoid()
    await db.insert(transaction).values({
      id: txId,
      businessId: bizId,
      userId,
      inputByUserId: userId,
      amount: amount.toString(),
      transaction_type: 'expense',
      description: note || `Tabungan: ${existing.title}`,
      categoryName: 'Tabungan/Goal',
      source: 'manual',
    })
    transactionId = txId
  }

  revalidatePath(`/dashboard/${bizId}/goals`)
  if (bizId) revalidatePath(`/dashboard/${bizId}`)
  return { goalId, completed, newAmount, transactionId }
}

export async function deleteGoal(goalId: string) {
  const userId = await getUserId()
  const existing = await db.query.goal.findFirst({
    where: and(eq(goal.id, goalId), eq(goal.userId, userId)),
  })
  if (!existing) throw new Error('Goal not found')

  await db.delete(goal).where(and(eq(goal.id, goalId), eq(goal.userId, userId)))
  revalidatePath(`/dashboard/${existing.businessId}/goals`)
  return { goalId }
}

// ─── Budgets ──────────────────────────────────────────────────────────────────

export async function getBudgets(businessId: string) {
  const userId = await getUserId()
  return db.query.budget.findMany({
    where: and(eq(budget.userId, userId), eq(budget.businessId, businessId)),
    orderBy: (b, { asc }) => [asc(b.category)],
  })
}

export async function upsertBudget(data: {
  businessId: string
  category: string
  amount: number
  period?: 'monthly' | 'weekly'
}) {
  const userId = await getUserId()

  const existing = await db.query.budget.findFirst({
    where: and(
      eq(budget.userId, userId),
      eq(budget.businessId, data.businessId),
      eq(budget.category, data.category)
    ),
  })

  if (existing) {
    await db.update(budget)
      .set({ amount: data.amount.toString(), period: data.period || 'monthly', updatedAt: new Date() })
      .where(eq(budget.id, existing.id))
    return { id: existing.id }
  } else {
    const id = nanoid()
    await db.insert(budget).values({
      id,
      userId,
      businessId: data.businessId,
      category: data.category,
      amount: data.amount.toString(),
      period: data.period || 'monthly',
    })
    return { id }
  }
}

export async function deleteBudget(budgetId: string) {
  const userId = await getUserId()
  const existing = await db.query.budget.findFirst({
    where: and(eq(budget.id, budgetId), eq(budget.userId, userId)),
  })
  if (!existing) throw new Error('Budget not found')
  await db.delete(budget).where(and(eq(budget.id, budgetId), eq(budget.userId, userId)))
  revalidatePath(`/dashboard/${existing.businessId}/goals`)
  return { budgetId }
}
