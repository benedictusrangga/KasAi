'use server'

import { auth } from '@/lib/auth'
import { db } from '@/lib/db'
import { inventoryItem, inventoryLog } from '@/lib/db/schema'
import { and, eq, desc } from 'drizzle-orm'
import { headers, cookies } from 'next/headers'
import { revalidatePath } from 'next/cache'
import { nanoid } from 'nanoid'
import { getBusinessAccess } from './members'

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

export async function getInventoryItems(businessId: string) {
  const userId = await getUserId()
  await getBusinessAccess(businessId, userId)
  return db.query.inventoryItem.findMany({
    where: eq(inventoryItem.businessId, businessId),
    orderBy: inventoryItem.name,
  })
}

export async function getInventoryLogs(businessId: string, itemId?: string) {
  const userId = await getUserId()
  await getBusinessAccess(businessId, userId)

  const conditions = itemId
    ? and(eq(inventoryLog.businessId, businessId), eq(inventoryLog.itemId, itemId))
    : eq(inventoryLog.businessId, businessId)

  return db.query.inventoryLog.findMany({
    where: conditions,
    orderBy: desc(inventoryLog.createdAt),
  })
}

export async function createInventoryItem(data: {
  businessId: string
  name: string
  sku?: string
  unit?: string
  currentStock?: number
  minStock?: number
  buyPrice?: number
  sellPrice?: number
  description?: string
}) {
  const userId = await getUserId()
  const access = await getBusinessAccess(data.businessId, userId)
  if (access.role === 'viewer') throw new Error('Viewer tidak bisa menambah item')

  const id = nanoid()
  await db.insert(inventoryItem).values({
    id,
    businessId: data.businessId,
    userId,
    name: data.name,
    sku: data.sku,
    unit: data.unit || 'pcs',
    currentStock: (data.currentStock ?? 0).toString(),
    minStock: (data.minStock ?? 0).toString(),
    buyPrice: data.buyPrice?.toString(),
    sellPrice: data.sellPrice?.toString(),
    description: data.description,
  })
  revalidatePath(`/dashboard/${data.businessId}/inventory`)
  return { id }
}

export async function updateInventoryItem(itemId: string, updates: {
  name?: string
  sku?: string
  unit?: string
  minStock?: number
  buyPrice?: number
  sellPrice?: number
  description?: string
}) {
  const userId = await getUserId()
  const existing = await db.query.inventoryItem.findFirst({ where: eq(inventoryItem.id, itemId) })
  if (!existing) throw new Error('Item tidak ditemukan')
  await getBusinessAccess(existing.businessId, userId)

  await db.update(inventoryItem).set({
    ...updates,
    minStock: updates.minStock?.toString(),
    buyPrice: updates.buyPrice?.toString(),
    sellPrice: updates.sellPrice?.toString(),
    updatedAt: new Date(),
  }).where(eq(inventoryItem.id, itemId))

  revalidatePath(`/dashboard/${existing.businessId}/inventory`)
  return { itemId }
}

export async function adjustInventoryStock(data: {
  itemId: string
  type: 'in' | 'out' | 'adjustment'
  quantity: number
  note?: string
  transactionId?: string
}) {
  const userId = await getUserId()
  const existing = await db.query.inventoryItem.findFirst({ where: eq(inventoryItem.id, data.itemId) })
  if (!existing) throw new Error('Item tidak ditemukan')
  const access = await getBusinessAccess(existing.businessId, userId)
  if (access.role === 'viewer') throw new Error('Viewer tidak bisa mengubah stok')

  // Hitung stok baru
  const currentStock = parseFloat(existing.currentStock)
  let newStock: number
  if (data.type === 'in') newStock = currentStock + data.quantity
  else if (data.type === 'out') newStock = Math.max(0, currentStock - data.quantity)
  else newStock = data.quantity // adjustment = set langsung

  // Update stok
  await db.update(inventoryItem).set({
    currentStock: newStock.toString(),
    updatedAt: new Date(),
  }).where(eq(inventoryItem.id, data.itemId))

  // Catat log
  const logId = nanoid()
  await db.insert(inventoryLog).values({
    id: logId,
    businessId: existing.businessId,
    itemId: data.itemId,
    userId,
    type: data.type,
    quantity: data.quantity.toString(),
    note: data.note,
    transactionId: data.transactionId,
  })

  revalidatePath(`/dashboard/${existing.businessId}/inventory`)
  return { itemId: data.itemId, newStock, logId }
}

export async function deleteInventoryItem(itemId: string) {
  const userId = await getUserId()
  const existing = await db.query.inventoryItem.findFirst({ where: eq(inventoryItem.id, itemId) })
  if (!existing) throw new Error('Item tidak ditemukan')
  const access = await getBusinessAccess(existing.businessId, userId)
  if (!access.isOwner) throw new Error('Hanya owner yang bisa menghapus')

  await db.delete(inventoryItem).where(eq(inventoryItem.id, itemId))
  revalidatePath(`/dashboard/${existing.businessId}/inventory`)
  return { itemId }
}
