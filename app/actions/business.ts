'use server'

import { auth } from '@/lib/auth'
import { db } from '@/lib/db'
import { business, category, businessProducts, user, businessMember } from '@/lib/db/schema'
import { and, eq } from 'drizzle-orm'
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

export async function createBusiness(
  name: string,
  type: 'florist' | 'laundry' | 'cafe' | 'retail' | 'other',
  description?: string
) {
  const userId = await getUserId()

  // Cek accountType — personal hanya boleh 1 bisnis
  const currentUser = await db.query.user.findFirst({ where: eq(user.id, userId) })
  if (currentUser?.accountType === 'personal') {
    const existing = await db.query.business.findMany({ where: eq(business.userId, userId) })
    if (existing.length >= 1) {
      throw new Error('Akun personal hanya dapat memiliki 1 bisnis. Upgrade ke akun bisnis untuk menambah lebih banyak.')
    }
  }

  const id = nanoid()
  await db.insert(business).values({
    id,
    userId,
    name,
    type,
    description,
  })

  await db
    .update(user)
    .set({ updatedAt: new Date() })
    .where(eq(user.id, userId))

  revalidatePath('/')
  return { id, name, type }
}

export async function getUserBusinesses() {
  const userId = await getUserId()

  // Bisnis yang dimiliki
  const ownedBusinesses = await db.query.business.findMany({
    where: eq(business.userId, userId),
  })

  // Bisnis yang jadi member aktif
  const memberships = await db.query.businessMember.findMany({
    where: and(
      eq(businessMember.userId, userId),
      eq(businessMember.status, 'active')
    ),
  })

  // Ambil bisnis dari membership
  const memberBusinessIds = memberships.map((m) => m.businessId)
  const memberBusinesses = memberBusinessIds.length > 0
    ? await db.query.business.findMany({
        where: (b, { inArray }) => inArray(b.id, memberBusinessIds),
      })
    : []

  // Gabungkan, tandai role
  const owned = ownedBusinesses.map((b) => ({ ...b, _role: 'owner' as const, _isOwner: true }))
  const member = memberBusinesses.map((b) => {
    const membership = memberships.find((m) => m.businessId === b.id)
    return { ...b, _role: (membership?.role ?? 'admin') as 'admin' | 'viewer', _isOwner: false }
  })

  return [...owned, ...member]
}

export async function getBusiness(businessId: string) {
  const userId = await getUserId()

  const biz = await db.query.business.findFirst({
    where: eq(business.id, businessId),
  })
  if (!biz) throw new Error('Business not found')

  // Cek akses: owner atau member aktif
  if (biz.userId !== userId) {
    const member = await db.query.businessMember.findFirst({
      where: and(
        eq(businessMember.businessId, businessId),
        eq(businessMember.userId, userId),
        eq(businessMember.status, 'active')
      ),
    })
    if (!member) throw new Error('Access denied')
  }

  return biz
}

export async function getCurrentUser() {
  const userId = await getUserId()
  const currentUser = await db.query.user.findFirst({
    where: eq(user.id, userId),
  })
  if (!currentUser) throw new Error('User not found')
  return currentUser
}

export async function updateBusiness(
  businessId: string,
  updates: { name?: string; description?: string; logo_url?: string; type?: 'florist' | 'laundry' | 'cafe' | 'retail' | 'other' }
) {
  const userId = await getUserId()

  await db
    .update(business)
    .set({ ...updates, updatedAt: new Date() })
    .where(and(eq(business.id, businessId), eq(business.userId, userId)))

  revalidatePath('/')
  return { businessId, ...updates }
}

export async function updateUserProfile(
  updates: {
    name?: string
    phoneNumber?: string
    accountType?: 'personal' | 'business'
    currency?: string
    timezone?: string
    telegramId?: string
  }
) {
  const userId = await getUserId()

  await db
    .update(user)
    .set({ ...updates, updatedAt: new Date() })
    .where(eq(user.id, userId))

  revalidatePath('/')
  return { userId, ...updates }
}

export async function getBusinessCategories(businessId: string) {
  const userId = await getUserId()
  await getBusiness(businessId)

  return db.query.category.findMany({
    where: eq(category.businessId, businessId),
    orderBy: [category.createdAt],
  })
}

export async function createCategory(
  businessId: string,
  name: string,
  type: string,
  description?: string,
  icon?: string
) {
  const userId = await getUserId()
  await getBusiness(businessId)

  const id = nanoid()
  await db.insert(category).values({
    id,
    businessId,
    name,
    type: type as any,
    description,
    icon,
  })

  revalidatePath(`/dashboard/${businessId}`)
  return { id, name, type }
}

export async function updateCategory(
  categoryId: string,
  updates: {
    name?: string
    type?: 'groceries' | 'transportation' | 'utilities' | 'entertainment' | 'dining' | 'shopping' | 'healthcare' | 'education' | 'office_supplies' | 'other'
    description?: string
    icon?: string
  }
) {
  const userId = await getUserId()
  const existing = await db.query.category.findFirst({
    where: and(eq(category.id, categoryId))
  })
  if (!existing) throw new Error('Category not found')

  await db
    .update(category)
    .set({ ...updates, updatedAt: new Date() })
    .where(eq(category.id, categoryId))

  revalidatePath('/')
  return { categoryId, ...updates }
}

export async function deleteCategory(categoryId: string) {
  const userId = await getUserId()
  await db
    .delete(category)
    .where(eq(category.id, categoryId))

  revalidatePath('/')
  return { categoryId }
}

export async function getBusinessProducts(businessId: string) {
  const userId = await getUserId()
  await getBusiness(businessId)

  return db.query.businessProducts.findMany({
    where: eq(businessProducts.businessId, businessId),
    orderBy: [businessProducts.createdAt],
  })
}

export async function createProduct(
  businessId: string,
  name: string,
  unit?: string,
  price?: number,
  description?: string
) {
  const userId = await getUserId()
  await getBusiness(businessId)

  const id = nanoid()
  await db.insert(businessProducts).values({
    id,
    businessId,
    name,
    unit: unit || 'pcs',
    price: price?.toString(),
    description,
  })

  revalidatePath(`/dashboard/${businessId}`)
  return { id, name, unit, price, description }
}

export async function updateProduct(
  productId: string,
  updates: {
    name?: string
    unit?: string
    price?: number
    description?: string
  }
) {
  const userId = await getUserId()
  const existing = await db.query.businessProducts.findFirst({
    where: eq(businessProducts.id, productId),
  })
  if (!existing) throw new Error('Product not found')

  await db
    .update(businessProducts)
    .set({
      ...updates,
      price: updates.price ? updates.price.toString() : undefined,
      updatedAt: new Date(),
    })
    .where(eq(businessProducts.id, productId))

  revalidatePath('/')
  return { productId, ...updates }
}

export async function deleteProduct(productId: string) {
  const userId = await getUserId()
  await db
    .delete(businessProducts)
    .where(eq(businessProducts.id, productId))

  revalidatePath('/')
  return { productId }
}

export async function deleteBusiness(businessId: string) {
  const userId = await getUserId()

  await db
    .delete(business)
    .where(and(eq(business.id, businessId), eq(business.userId, userId)))

  revalidatePath('/')
  return { businessId }
}
