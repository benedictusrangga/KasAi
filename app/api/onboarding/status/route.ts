import { NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { db } from '@/lib/db'
import { onboardingProgress } from '@/lib/db/schema'
import { eq } from 'drizzle-orm'

export async function GET(req: Request) {
  try {
    const session = await auth.api.getSession({ headers: req.headers as any })
    if (!session?.user?.id) return NextResponse.json({ needsSetup: false })

    const rows = await db.select().from(onboardingProgress).where(eq(onboardingProgress.userId, session.user.id)).limit(1)
    const needsSetup = !rows || rows.length === 0 || rows[0].completed === false
    return NextResponse.json({ needsSetup })
  } catch (err) {
    return NextResponse.json({ needsSetup: false })
  }
}
