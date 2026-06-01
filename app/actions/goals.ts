'use server'

import { auth } from '@/lib/auth'
import { db } from '@/lib/db'
import { goal, budget, transaction } from '@/lib/db/schema'
import { and, eq } from 'drizzle-orm'
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
  deadline?: Date
}) {
  const userId = await getUserId()
  const id = nanoid()

  // Hitung total income yang sudah ada sebagai starting point
  const existingIncome = await db.query.transaction.findMany({
    where: and(
      eq(transaction.businessId, data.businessId),
      eq(transaction.userId, userId),
    ),
  })
  // Goals dimulai dari 0 — user tentukan sendiri progress awalnya
  await db.insert(goal).values({
    id,
    userId,
    businessId: data.businessId,
    title: data.title,
    description: data.description,
    targetAmount: data.targetAmount.toString(),
    currentAmount: '0',
    deadline: data.deadline,
  })
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

  revalidatePath('/')
  return { goalId, completed }
}

export async function deleteGoal(goalId: string) {
  const userId = await getUserId()
  await db.delete(goal).where(and(eq(goal.id, goalId), eq(goal.userId, userId)))
  revalidatePath('/')
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
  await db.delete(budget).where(and(eq(budget.id, budgetId), eq(budget.userId, userId)))
  revalidatePath('/')
  return { budgetId }
}
