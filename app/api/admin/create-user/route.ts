import { NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { user, account, verification, onboardingProgress } from '@/lib/db/schema'
import { nanoid } from 'nanoid'

export async function POST(req: Request) {
  const adminSecret = process.env.ADMIN_SECRET
  if (!adminSecret || req.headers.get('x-admin-secret') !== adminSecret) {
    return new NextResponse('Unauthorized', { status: 401 })
  }

  const body = await req.json()
  const { email, name, accountType } = body
  if (!email) return new NextResponse('Missing email', { status: 400 })

  // create user
  const userId = nanoid()
  await db.insert(user).values({
    id: userId,
    email: email.toLowerCase(),
    name: name ?? null,
    emailVerified: false,
    createdAt: new Date(),
    updatedAt: new Date(),
    accountType: accountType || 'personal',
  })

  // create account row (credentials/admin provider)
  const accountId = nanoid()
  await db.insert(account).values({
    id: accountId,
    userId,
    type: 'credentials',
    provider: 'credentials',
    providerAccountId: userId,
    accountId: userId,
    providerId: 'credential',
    createdAt: new Date(),
    updatedAt: new Date(),
  })

  // create onboarding progress placeholder
  const progressId = nanoid()
  await db.insert(onboardingProgress).values({
    id: progressId,
    userId,
    step: 'welcome',
    completed: false,
    data: null,
    createdAt: new Date(),
    updatedAt: new Date(),
  })

  // create a verification token (invite) so user can set password
  const token = nanoid(32)
  const verificationId = nanoid()
  const expiresAt = new Date(Date.now() + 1000 * 60 * 60 * 24 * 7) // 7 days
  await db.insert(verification).values({
    id: verificationId,
    identifier: email.toLowerCase(),
    value: token,
    expiresAt,
    createdAt: new Date(),
    updatedAt: new Date(),
  })

  // return invite link (frontend should email this to the user in production)
  const base = process.env.BETTER_AUTH_URL ?? `http://localhost:3000`
  const inviteLink = `${base}/set-password?token=${token}`

  return NextResponse.json({ id: userId, inviteLink }, { status: 201 })
}
