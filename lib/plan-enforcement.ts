/**
 * Plan expiry enforcement.
 *
 * planExpiresAt = null → plan aktif selamanya (manual/admin grant)
 * planExpiresAt = date → plan aktif sampai tanggal tersebut
 *
 * Dipanggil dari server actions yang butuh plan checking,
 * dan dari API route /api/user/me agar client selalu dapat status terbaru.
 */

import { db } from '@/lib/db'
import { user } from '@/lib/db/schema'
import { eq } from 'drizzle-orm'

/**
 * Cek apakah plan user sudah expired. Jika ya, downgrade ke 'free' di DB.
 * Return plan yang aktif setelah pengecekan.
 */
export async function enforceAndGetPlan(userId: string): Promise<string> {
  const currentUser = await db.query.user.findFirst({
    where: eq(user.id, userId),
    columns: { plan: true, planExpiresAt: true },
  })

  if (!currentUser) return 'free'

  const plan = currentUser.plan ?? 'free'
  const expiresAt = currentUser.planExpiresAt

  // Tidak ada expiry → plan aktif permanen
  if (!expiresAt) return plan

  // Plan sudah expired → downgrade ke free
  if (new Date(expiresAt) < new Date()) {
    await db.update(user).set({
      plan: 'free',
      planExpiresAt: null,
      updatedAt: new Date(),
    }).where(eq(user.id, userId))

    console.info(`[plan-enforcement] User ${userId} plan expired, downgraded to free`)
    return 'free'
  }

  return plan
}

/**
 * Cek apakah plan user masih aktif (belum expired).
 * Tidak melakukan DB write — hanya read + check.
 */
export function isPlanActive(planExpiresAt: Date | null | undefined): boolean {
  if (!planExpiresAt) return true // null = permanen
  return new Date(planExpiresAt) >= new Date()
}
