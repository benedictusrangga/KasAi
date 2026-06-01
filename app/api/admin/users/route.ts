import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { user, business, transaction } from '@/lib/db/schema'
import { eq, desc, count, gte } from 'drizzle-orm'
import { getPlan } from '@/lib/plan-limits'

function checkAdmin(req: NextRequest) {
  const secret = process.env.ADMIN_SECRET
  return secret && req.headers.get('x-admin-secret') === secret
}

// GET /api/admin/users — list all users with stats
export async function GET(req: NextRequest) {
  if (!checkAdmin(req)) return new NextResponse('Unauthorized', { status: 401 })

  const users = await db.query.user.findMany({
    orderBy: [desc(user.createdAt)],
  })

  const businesses = await db.query.business.findMany()
  const bizByUser: Record<string, number> = {}
  businesses.forEach(b => { bizByUser[b.userId] = (bizByUser[b.userId] || 0) + 1 })

  const now = new Date()
  const startMonth = new Date(now.getFullYear(), now.getMonth(), 1)
  const allTxns = await db.query.transaction.findMany()

  const txByUser: Record<string, number> = {}
  const txThisMonthByUser: Record<string, number> = {}
  allTxns.forEach(t => {
    txByUser[t.userId] = (txByUser[t.userId] || 0) + 1
    if (new Date(t.createdAt) >= startMonth) {
      txThisMonthByUser[t.userId] = (txThisMonthByUser[t.userId] || 0) + 1
    }
  })

  const result = users.map(u => {
    const plan = getPlan(u.plan)
    const txThisMonth = txThisMonthByUser[u.id] || 0
    const usagePct = plan.maxTxPerMonth === Infinity
      ? 0
      : Math.min(Math.round((txThisMonth / plan.maxTxPerMonth) * 100), 100)

    return {
      id: u.id,
      name: u.name,
      email: u.email,
      accountType: u.accountType,
      plan: u.plan ?? 'free',
      planName: plan.name,
      planExpiresAt: u.planExpiresAt,
      phoneNumber: u.phoneNumber,
      telegramId: u.telegramId,
      emailVerified: u.emailVerified,
      createdAt: u.createdAt,
      businessCount: bizByUser[u.id] || 0,
      totalTransactions: txByUser[u.id] || 0,
      txThisMonth,
      txLimit: plan.maxTxPerMonth === Infinity ? null : plan.maxTxPerMonth,
      usagePct,
    }
  })

  return NextResponse.json(result)
}

// PATCH /api/admin/users — update user plan / accountType
export async function PATCH(req: NextRequest) {
  if (!checkAdmin(req)) return new NextResponse('Unauthorized', { status: 401 })

  const body = await req.json()
  const { userId, plan, accountType, planExpiresAt } = body

  if (!userId) return new NextResponse('Missing userId', { status: 400 })

  const updates: Record<string, any> = { updatedAt: new Date() }

  if (plan !== undefined) {
    const validPlans = [
      'free',
      'personal_starter', 'personal_pro', 'personal_max', 'personal_unlimited',
      'business_starter', 'business_pro', 'business_enterprise',
    ]
    if (!validPlans.includes(plan)) return new NextResponse('Invalid plan', { status: 400 })
    updates.plan = plan

    // Auto-set accountType based on plan category
    if (plan === 'free' || plan.startsWith('personal_')) {
      updates.accountType = 'personal'
    } else if (plan.startsWith('business_')) {
      updates.accountType = 'business'
    }
  }

  if (accountType !== undefined) {
    if (!['personal', 'business'].includes(accountType)) {
      return new NextResponse('Invalid accountType', { status: 400 })
    }
    updates.accountType = accountType
  }

  if (planExpiresAt !== undefined) {
    updates.planExpiresAt = planExpiresAt ? new Date(planExpiresAt) : null
  }

  await db.update(user).set(updates).where(eq(user.id, userId))

  return NextResponse.json({ success: true, userId, ...updates })
}

// DELETE /api/admin/users — delete a user
export async function DELETE(req: NextRequest) {
  if (!checkAdmin(req)) return new NextResponse('Unauthorized', { status: 401 })

  const { searchParams } = new URL(req.url)
  const userId = searchParams.get('userId')
  if (!userId) return new NextResponse('Missing userId', { status: 400 })

  await db.delete(user).where(eq(user.id, userId))
  return NextResponse.json({ success: true })
}
