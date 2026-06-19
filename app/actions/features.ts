'use server'

import { auth } from '@/lib/auth'
import { db } from '@/lib/db'
import { userFeatureConfig } from '@/lib/db/schema'
import { eq } from 'drizzle-orm'
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

export type FeatureConfig = {
  enableInventory: boolean
  enablePayables: boolean
  enableReceivables: boolean
  enableBudget: boolean
  enableGoals: boolean
  enableTelegram: boolean
  enableTeam: boolean
  goalContributionAsExpense: boolean
}

// Default config berdasarkan accountType
export function getDefaultFeatureConfig(accountType: 'personal' | 'business'): FeatureConfig {
  if (accountType === 'personal') {
    return {
      enableInventory: false,
      enablePayables: false,
      enableReceivables: false,
      enableBudget: true,
      enableGoals: true,
      enableTelegram: true,
      enableTeam: false,
      goalContributionAsExpense: false,
    }
  }
  return {
    enableInventory: false, // opt-in, tidak semua bisnis butuh
    enablePayables: true,
    enableReceivables: true,
    enableBudget: true,
    enableGoals: true,
    enableTelegram: true,
    enableTeam: false,      // opt-in
    goalContributionAsExpense: false,
  }
}

export async function getFeatureConfig(businessId: string): Promise<FeatureConfig> {
  const existing = await db.query.userFeatureConfig.findFirst({
    where: eq(userFeatureConfig.businessId, businessId),
  })

  if (!existing) {
    // Return default kalau belum dikonfigurasi
    return getDefaultFeatureConfig('business')
  }

  return {
    enableInventory: existing.enableInventory,
    enablePayables: existing.enablePayables,
    enableReceivables: existing.enableReceivables,
    enableBudget: existing.enableBudget,
    enableGoals: existing.enableGoals,
    enableTelegram: existing.enableTelegram,
    enableTeam: existing.enableTeam,
    goalContributionAsExpense: existing.goalContributionAsExpense ?? false,
  }
}

export async function saveFeatureConfig(businessId: string, config: Partial<FeatureConfig>) {
  const userId = await getUserId()

  const existing = await db.query.userFeatureConfig.findFirst({
    where: eq(userFeatureConfig.businessId, businessId),
  })

  if (existing) {
    await db.update(userFeatureConfig)
      .set({ ...config, updatedAt: new Date() })
      .where(eq(userFeatureConfig.businessId, businessId))
  } else {
    const defaults = getDefaultFeatureConfig('business')
    await db.insert(userFeatureConfig).values({
      id: nanoid(),
      businessId,
      userId,
      ...defaults,
      ...config,
    })
  }

  revalidatePath(`/dashboard/${businessId}`)
  revalidatePath(`/dashboard/${businessId}/settings`)
  return { businessId }
}

export async function initFeatureConfig(
  businessId: string,
  accountType: 'personal' | 'business',
  customConfig?: Partial<FeatureConfig>
) {
  const userId = await getUserId()
  const defaults = getDefaultFeatureConfig(accountType)
  const config = { ...defaults, ...customConfig }

  // Upsert
  const existing = await db.query.userFeatureConfig.findFirst({
    where: eq(userFeatureConfig.businessId, businessId),
  })

  if (existing) {
    await db.update(userFeatureConfig)
      .set({ ...config, updatedAt: new Date() })
      .where(eq(userFeatureConfig.businessId, businessId))
  } else {
    await db.insert(userFeatureConfig).values({
      id: nanoid(),
      businessId,
      userId,
      ...config,
    })
  }

  return config
}
