import { NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { verification, user, account } from '@/lib/db/schema'
import { eq } from 'drizzle-orm'
import crypto from 'crypto'

function hashPassword(password: string) {
  const salt = crypto.randomBytes(16).toString('hex')
  const derived = crypto.scryptSync(password, salt, 64)
  return `${salt}:${derived.toString('hex')}`
}

export async function POST(req: Request) {
  const body = await req.json()
  const { token, password } = body
  if (!token || !password) return new NextResponse('Missing token or password', { status: 400 })

  const rows = await db.select().from(verification).where(eq(verification.value, token)).limit(1)
  if (!rows || rows.length === 0) return new NextResponse('Invalid or expired token', { status: 400 })
  const row = rows[0]
  if (new Date(row.expiresAt) < new Date()) {
    return new NextResponse('Token expired', { status: 400 })
  }

  const identifier = row.identifier
  const users = await db.select().from(user).where(eq(user.email, identifier)).limit(1)
  if (!users || users.length === 0) return new NextResponse('User not found', { status: 404 })
  const foundUser = users[0]

  // find account for user
  const accounts = await db.select().from(account).where(eq(account.userId, foundUser.id)).limit(1)
  if (!accounts || accounts.length === 0) return new NextResponse('Account not found', { status: 404 })

  const hashed = hashPassword(password)
  await db
    .update(account)
    .set({
      password: hashed,
      provider: 'credentials',
      providerAccountId: foundUser.id,
      accountId: foundUser.id,
      providerId: 'credential',
    })
    .where(eq(account.userId, foundUser.id))

  // mark email verified
  await db.update(user).set({ emailVerified: true }).where(eq(user.id, foundUser.id))

  // remove verification record
  await db.delete(verification).where(eq(verification.id, row.id))

  return NextResponse.json({ success: true })
}
