'use server'

import { db } from '@/lib/db'
import { userFeatureConfig } from '@/lib/db/schema'
import { eq } from 'drizzle-orm'
import { revalidatePath } from 'next/cache'
import { nanoid } from 'nanoid'
import type { FeatureConfig } from '@/lib/feature-config'
import { getDefaultFeatureConfig } from '@/lib/feature-config'
import { getSessionUserId } from '@/lib/session'

const getUserId = getSessionUserId

export async function getFeatureConfig(businessId: string): Promise<FeatureConfig> {
  const existing = await db.query.userFeatureConfig.findFirst({
    where: eq(userFeatureConfig.businessId, businessId),
  })

  if (!existing) {
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
