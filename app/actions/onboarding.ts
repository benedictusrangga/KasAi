'use server'

import { auth } from '@/lib/auth'
import { db } from '@/lib/db'
import { user, onboardingProgress, business, businessProducts } from '@/lib/db/schema'
import { and, eq } from 'drizzle-orm'
import { headers, cookies } from 'next/headers'
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

export async function saveAccountType(accountType: 'personal' | 'business') {
  const userId = await getUserId()
  await db.update(user).set({ accountType }).where(eq(user.id, userId))
}

export async function savePersonalDetails(
  name: string,
  currency: string,
  timezone: string
) {
  const userId = await getUserId()
  await db.update(user).set({ name, currency, timezone, accountType: 'personal' }).where(eq(user.id, userId))

  // Cek apakah sudah ada bisnis
  const existing = await db.query.business.findFirst({
    where: eq(business.userId, userId),
  })

  if (existing) {
    return { businessId: existing.id }
  }

  // Buat bisnis personal default
  const businessId = nanoid()
  await db.insert(business).values({
    id: businessId,
    userId,
    name: `${name}'s Personal Finance`,
    type: 'other',
    description: 'Personal finance tracking',
    createdAt: new Date(),
    updatedAt: new Date(),
  })

  return { businessId }
}

export async function saveBusinessSetup(data: {
  businessName: string
  businessType: string
  currency: string
  timezone: string
  categories?: string[]
  products?: { name: string; unit?: string }[]
}) {
  const userId = await getUserId()

  // Update user
  await db
    .update(user)
    .set({
      name: data.businessName,
      currency: data.currency,
      timezone: data.timezone,
      accountType: 'business',
    })
    .where(eq(user.id, userId))

  // Create business
  const businessId = nanoid()
  await db.insert(business).values({
    id: businessId,
    userId,
    name: data.businessName,
    type: data.businessType as any,
    createdAt: new Date(),
    updatedAt: new Date(),
  })

  // Add products if provided
  if (data.products && data.products.length > 0) {
    await db.insert(businessProducts).values(
      data.products.map((p) => ({
        id: nanoid(),
        businessId,
        name: p.name,
        unit: p.unit || 'pcs',
        createdAt: new Date(),
        updatedAt: new Date(),
      }))
    )
  }

  return businessId
}

export async function completeOnboarding() {
  const userId = await getUserId()

  // Check if a progress row already exists
  const existing = await db
    .select()
    .from(onboardingProgress)
    .where(eq(onboardingProgress.userId, userId))
    .limit(1)

  if (existing.length > 0) {
    await db
      .update(onboardingProgress)
      .set({ completed: true, updatedAt: new Date() })
      .where(eq(onboardingProgress.userId, userId))
  } else {
    await db.insert(onboardingProgress).values({
      id: nanoid(),
      userId,
      step: 'completed',
      completed: true,
      data: null,
      createdAt: new Date(),
      updatedAt: new Date(),
    })
  }
}

export async function getOnboardingStatus() {
  const userId = await getUserId()
  const progress = await db
    .select()
    .from(onboardingProgress)
    .where(eq(onboardingProgress.userId, userId))
    .limit(1)

  const userRecord = await db.select().from(user).where(eq(user.id, userId)).limit(1)

  return {
    completed: progress.length > 0 && progress[0].completed,
    accountType: userRecord[0]?.accountType || 'personal',
    user: userRecord[0],
  }
}
