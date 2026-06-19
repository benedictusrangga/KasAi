/**
 * Set password untuk user yang diundang admin.
 *
 * PERBAIKAN KRITIS: Versi lama memakai crypto.scryptSync dengan keylen=64
 * tapi salt di-generate sebagai 16-byte hex (32 char) — identik dengan
 * format Better Auth. Masalah sebelumnya adalah kolom accountId/providerId
 * yang tidak diisi dengan benar, bukan masalah hash.
 *
 * Better Auth menggunakan format:  "salt_hex:derived_hex"
 *   - salt   : 16 random bytes → 32 hex chars
 *   - derived: scrypt(password, salt, 64, {N:16384,r:8,p:1}) → 128 hex chars
 *   - total  : 161 chars (32 + ':' + 128)
 *
 * Diverifikasi dengan menjalankan Better Auth hashPassword() dan
 * membandingkan format output — identik dengan implementasi di bawah.
 */

import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { verification, user, account } from '@/lib/db/schema'
import { eq } from 'drizzle-orm'
import { nanoid } from 'nanoid'
import crypto from 'node:crypto'

/**
 * Hash password dengan format yang identik dengan Better Auth.
 * Better Auth menggunakan @better-auth/utils/password yang memakai
 * node:crypto scrypt dengan parameter default:
 *   N=16384, r=8, p=1, keylen=64
 * Output format: "salt_hex:derived_hex"
 */
function hashPasswordBetterAuth(password: string): Promise<string> {
  return new Promise((resolve, reject) => {
    const salt = crypto.randomBytes(16).toString('hex') // 32 hex chars
    crypto.scrypt(password, salt, 64, { N: 16384, r: 8, p: 1 }, (err, derived) => {
      if (err) return reject(err)
      resolve(`${salt}:${derived.toString('hex')}`) // 32 + ':' + 128 = 161 chars
    })
  })
}

export async function POST(req: NextRequest) {
  let body: { token?: string; password?: string }
  try {
    body = await req.json()
  } catch {
    return new NextResponse('Invalid JSON', { status: 400 })
  }

  const { token, password } = body

  if (!token || !password) {
    return new NextResponse('Missing token or password', { status: 400 })
  }
  if (password.length < 8) {
    return new NextResponse('Password minimal 8 karakter', { status: 400 })
  }

  // ── 1. Validasi token ────────────────────────────────────────────────────
  const rows = await db
    .select()
    .from(verification)
    .where(eq(verification.value, token))
    .limit(1)

  if (!rows || rows.length === 0) {
    return new NextResponse('Token tidak valid atau sudah digunakan', { status: 400 })
  }

  const row = rows[0]
  if (new Date(row.expiresAt) < new Date()) {
    await db.delete(verification).where(eq(verification.id, row.id))
    return new NextResponse(
      'Token sudah kadaluarsa. Minta admin kirim ulang link undangan.',
      { status: 400 }
    )
  }

  // ── 2. Cari user berdasarkan identifier (email) ──────────────────────────
  const users = await db
    .select()
    .from(user)
    .where(eq(user.email, row.identifier))
    .limit(1)

  if (!users || users.length === 0) {
    return new NextResponse('User tidak ditemukan', { status: 404 })
  }

  const foundUser = users[0]

  // ── 3. Hash password dengan format Better Auth ───────────────────────────
  const hashed = await hashPasswordBetterAuth(password)

  // ── 4. Upsert account row ────────────────────────────────────────────────
  // Better Auth membaca account row dengan provider='credential' dan
  // accountId = userId untuk proses signIn.email().
  const accounts = await db
    .select()
    .from(account)
    .where(eq(account.userId, foundUser.id))
    .limit(1)

  if (accounts.length > 0) {
    await db
      .update(account)
      .set({
        password: hashed,
        // Field-field ini wajib benar agar Better Auth bisa verifikasi saat login
        provider: 'credential',
        providerId: 'credential',
        accountId: foundUser.id,
        providerAccountId: foundUser.id,
        updatedAt: new Date(),
      })
      .where(eq(account.userId, foundUser.id))
  } else {
    // Edge case: row tidak ada, buat baru
    await db.insert(account).values({
      id: nanoid(),
      userId: foundUser.id,
      type: 'email',
      provider: 'credential',
      providerId: 'credential',
      accountId: foundUser.id,
      providerAccountId: foundUser.id,
      password: hashed,
      createdAt: new Date(),
      updatedAt: new Date(),
    })
  }

  // ── 5. Mark email verified ───────────────────────────────────────────────
  await db
    .update(user)
    .set({ emailVerified: true, updatedAt: new Date() })
    .where(eq(user.id, foundUser.id))

  // ── 6. Hapus token — one-time use ────────────────────────────────────────
  await db.delete(verification).where(eq(verification.id, row.id))

  return NextResponse.json({ success: true, email: foundUser.email })
}
