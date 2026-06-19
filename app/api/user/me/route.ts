import { auth } from '@/lib/auth'
import { db } from '@/lib/db'
import { user } from '@/lib/db/schema'
import { eq } from 'drizzle-orm'
import { headers } from 'next/headers'
import { NextResponse } from 'next/server'
import { enforceAndGetPlan } from '@/lib/plan-enforcement'

export const dynamic = 'force-dynamic'

export async function GET() {
  try {
    const h = await headers()
    const session = await auth.api.getSession({ headers: h })
    if (!session?.user) {
      return NextResponse.json({ accountType: null }, { status: 401 })
    }

    const currentUser = await db.query.user.findFirst({
      where: eq(user.id, session.user.id),
      columns: { id: true, accountType: true, name: true, plan: true, planExpiresAt: true },
    })

    // Enforce plan expiry setiap kali client load dashboard
    // Ini memastikan plan di-downgrade tepat waktu tanpa perlu cron
    const activePlan = await enforceAndGetPlan(session.user.id)

    return NextResponse.json({
      id: currentUser?.id,
      name: currentUser?.name,
      accountType: currentUser?.accountType || 'personal',
      plan: activePlan,
      planExpiresAt: currentUser?.planExpiresAt ?? null,
    })
  } catch {
    return NextResponse.json({ accountType: null }, { status: 500 })
  }
}
