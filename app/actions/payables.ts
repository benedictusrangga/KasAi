'use server'

import { db } from '@/lib/db'
import { payable, receivable } from '@/lib/db/schema'
import { eq, desc } from 'drizzle-orm'
import { revalidatePath } from 'next/cache'
import { nanoid } from 'nanoid'
import { getBusinessAccess } from './members'
import { getSessionUserId } from '@/lib/session'

const getUserId = getSessionUserId

// ─── HUTANG (Payable — kita berhutang ke orang lain) ─────────────────────────

export async function getPayables(businessId: string) {
  const userId = await getUserId()
  await getBusinessAccess(businessId, userId)
  return db.query.payable.findMany({
    where: eq(payable.businessId, businessId),
    orderBy: desc(payable.createdAt),
  })
}

export async function createPayable(data: {
  businessId: string
  contactName: string
  contactPhone?: string
  amount: number
  description: string
  dueDate?: Date
  notes?: string
}) {
  const userId = await getUserId()
  const access = await getBusinessAccess(data.businessId, userId)
  if (access.role === 'viewer') throw new Error('Viewer tidak bisa menambah hutang')

  const id = nanoid()
  await db.insert(payable).values({
    id,
    businessId: data.businessId,
    userId,
    contactName: data.contactName,
    contactPhone: data.contactPhone,
    amount: data.amount.toString(),
    paidAmount: '0',
    description: data.description,
    dueDate: data.dueDate,
    status: 'unpaid',
    notes: data.notes,
  })
  revalidatePath(`/dashboard/${data.businessId}/payables`)
  return { id }
}

export async function updatePayablePayment(payableId: string, paidAmount: number) {
  const userId = await getUserId()
  const existing = await db.query.payable.findFirst({ where: eq(payable.id, payableId) })
  if (!existing) throw new Error('Hutang tidak ditemukan')
  await getBusinessAccess(existing.businessId, userId)

  const totalAmount = parseFloat(existing.amount)
  const newPaid = Math.min(paidAmount, totalAmount)
  const status = newPaid >= totalAmount ? 'paid' : newPaid > 0 ? 'partial' : 'unpaid'

  await db.update(payable)
    .set({ paidAmount: newPaid.toString(), status, updatedAt: new Date() })
    .where(eq(payable.id, payableId))

  revalidatePath(`/dashboard/${existing.businessId}/payables`)
  return { payableId, status }
}

export async function deletePayable(payableId: string) {
  const userId = await getUserId()
  const existing = await db.query.payable.findFirst({ where: eq(payable.id, payableId) })
  if (!existing) throw new Error('Hutang tidak ditemukan')
  const access = await getBusinessAccess(existing.businessId, userId)
  if (!access.isOwner) throw new Error('Hanya owner yang bisa menghapus')

  await db.delete(payable).where(eq(payable.id, payableId))
  revalidatePath(`/dashboard/${existing.businessId}/payables`)
  return { payableId }
}

// ─── PIUTANG (Receivable — orang lain berhutang ke kita) ─────────────────────

export async function getReceivables(businessId: string) {
  const userId = await getUserId()
  await getBusinessAccess(businessId, userId)
  return db.query.receivable.findMany({
    where: eq(receivable.businessId, businessId),
    orderBy: desc(receivable.createdAt),
  })
}

export async function createReceivable(data: {
  businessId: string
  contactName: string
  contactPhone?: string
  amount: number
  description: string
  dueDate?: Date
  notes?: string
}) {
  const userId = await getUserId()
  const access = await getBusinessAccess(data.businessId, userId)
  if (access.role === 'viewer') throw new Error('Viewer tidak bisa menambah piutang')

  const id = nanoid()
  await db.insert(receivable).values({
    id,
    businessId: data.businessId,
    userId,
    contactName: data.contactName,
    contactPhone: data.contactPhone,
    amount: data.amount.toString(),
    paidAmount: '0',
    description: data.description,
    dueDate: data.dueDate,
    status: 'unpaid',
    notes: data.notes,
  })
  revalidatePath(`/dashboard/${data.businessId}/receivables`)
  return { id }
}

export async function updateReceivablePayment(receivableId: string, paidAmount: number) {
  const userId = await getUserId()
  const existing = await db.query.receivable.findFirst({ where: eq(receivable.id, receivableId) })
  if (!existing) throw new Error('Piutang tidak ditemukan')
  await getBusinessAccess(existing.businessId, userId)

  const totalAmount = parseFloat(existing.amount)
  const newPaid = Math.min(paidAmount, totalAmount)
  const status = newPaid >= totalAmount ? 'paid' : newPaid > 0 ? 'partial' : 'unpaid'

  await db.update(receivable)
    .set({ paidAmount: newPaid.toString(), status, updatedAt: new Date() })
    .where(eq(receivable.id, receivableId))

  revalidatePath(`/dashboard/${existing.businessId}/receivables`)
  return { receivableId, status }
}

export async function deleteReceivable(receivableId: string) {
  const userId = await getUserId()
  const existing = await db.query.receivable.findFirst({ where: eq(receivable.id, receivableId) })
  if (!existing) throw new Error('Piutang tidak ditemukan')
  const access = await getBusinessAccess(existing.businessId, userId)
  if (!access.isOwner) throw new Error('Hanya owner yang bisa menghapus')

  await db.delete(receivable).where(eq(receivable.id, receivableId))
  revalidatePath(`/dashboard/${existing.businessId}/receivables`)
  return { receivableId }
}
