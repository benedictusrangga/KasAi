'use server'

import { auth } from '@/lib/auth'
import { db } from '@/lib/db'
import { transaction, business, user, businessMember, budget } from '@/lib/db/schema'
import { and, eq, desc, gte, count, or } from 'drizzle-orm'
import { headers, cookies } from 'next/headers'
import { revalidatePath } from 'next/cache'
import { nanoid } from 'nanoid'
import { getPlan, isLimitReached } from '@/lib/plan-limits'
import { getBusinessAccess } from './members'

const CATEGORY_LABELS: Record<string, string> = {
  groceries: 'Bahan Makanan', transportation: 'Transportasi', utilities: 'Utilitas',
  entertainment: 'Hiburan', dining: 'Makan & Minum', shopping: 'Belanja',
  healthcare: 'Kesehatan', education: 'Pendidikan', office_supplies: 'Perlengkapan Kantor', other: 'Lainnya',
}

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

export async function createTransaction(
  businessId: string,
  amount: number,
  description: string,
  categoryId?: string,
  source: 'manual' | 'telegram' | 'voice_note' | 'receipt_image' | 'api' = 'manual',
  transactionType: 'expense' | 'income' = 'expense',
  tags?: string[],
  notes?: string,
  receiptUrl?: string,
  categoryName?: string
) {
  const userId = await getUserId()

  // Verifikasi akses (owner atau member admin) + ambil owner info sekaligus
  const access = await getBusinessAccess(businessId, userId)
  if (access.role === 'viewer') throw new Error('Viewer tidak dapat menambah transaksi')

  // Ambil bisnis + owner dalam 1 query
  const biz = await db.query.business.findFirst({
    where: eq(business.id, businessId),
    columns: { userId: true },
  })
  if (!biz) throw new Error('Business not found')
  const ownerId = biz.userId

  // Validasi amount
  if (isNaN(amount) || amount <= 0) throw new Error('Jumlah harus lebih dari 0')
  if (!description?.trim()) throw new Error('Deskripsi tidak boleh kosong')

  // Enforce plan limits — ambil owner user sekaligus
  const ownerUser = await db.query.user.findFirst({
    where: eq(user.id, ownerId),
    columns: { plan: true },
  })
  const plan = getPlan(ownerUser?.plan)

  if (plan.maxTxPerMonth !== Infinity) {
    const now = new Date()
    const startMonth = new Date(now.getFullYear(), now.getMonth(), 1)
    const [{ value: txCount }] = await db
      .select({ value: count() })
      .from(transaction)
      .where(and(eq(transaction.businessId, businessId), gte(transaction.createdAt, startMonth)))

    if (txCount >= plan.maxTxPerMonth) {
      throw new Error(
        `LIMIT_REACHED:Batas ${plan.maxTxPerMonth} transaksi/bulan untuk plan ${plan.name} sudah tercapai. Upgrade plan untuk transaksi lebih banyak.`
      )
    }
  }

  const id = nanoid()
  await db.insert(transaction).values({
    id,
    businessId,
    userId: ownerId,
    inputByUserId: userId,
    amount: amount.toFixed(2),
    transaction_type: transactionType,
    description: description.trim(),
    categoryId: categoryId && categoryId.length > 10 ? categoryId : undefined,
    categoryName: categoryName?.trim() || undefined,
    source,
    receipt_url: receiptUrl,
    tags: tags && tags.length > 0 ? tags : undefined,
    notes: notes?.trim() || undefined,
  })

  revalidatePath(`/dashboard/${businessId}`)
  revalidatePath(`/dashboard/${businessId}/transactions`)

  // ── Budget alert check (hanya untuk expense) ──────────────────────────────
  const budgetAlerts: string[] = []
  if (transactionType === 'expense') {
    try {
      const now = new Date()
      const startMonth = new Date(now.getFullYear(), now.getMonth(), 1)

      // Ambil semua budget milik owner untuk bisnis ini
      const budgets = await db.query.budget.findMany({
        where: and(eq(budget.businessId, businessId), eq(budget.userId, ownerId)),
      })

      if (budgets.length > 0) {
        // Hitung pengeluaran bulan ini per kategori
        const monthTxns = await db.query.transaction.findMany({
          where: and(
            eq(transaction.businessId, businessId),
            eq(transaction.transaction_type, 'expense'),
            gte(transaction.createdAt, startMonth)
          ),
        })

        const spentByCategory: Record<string, number> = {}
        monthTxns.forEach((t) => {
          const cat = t.categoryId || 'other'
          spentByCategory[cat] = (spentByCategory[cat] || 0) + parseFloat(t.amount)
        })

        for (const b of budgets) {
          const spent = spentByCategory[b.category] || 0
          const budgetAmt = parseFloat(b.amount)
          const pct = Math.round((spent / budgetAmt) * 100)
          const label = CATEGORY_LABELS[b.category] || b.category

          if (pct > 100) {
            budgetAlerts.push(
              `🔴 Budget ${label} melebihi batas! Terpakai Rp ${spent.toLocaleString('id-ID')} dari Rp ${budgetAmt.toLocaleString('id-ID')} (${pct}%)`
            )
          } else if (pct >= 80) {
            budgetAlerts.push(
              `🟡 Budget ${label} hampir habis — ${pct}% terpakai (Rp ${spent.toLocaleString('id-ID')} dari Rp ${budgetAmt.toLocaleString('id-ID')})`
            )
          }
        }
      }
    } catch {
      // Budget check gagal — tidak perlu crash, transaksi sudah tersimpan
    }
  }

  return { id, amount, description, budgetAlerts }
}

export async function getTransactions(businessId: string) {
  const userId = await getUserId()
  // Verifikasi akses
  await getBusinessAccess(businessId, userId)

  return db.query.transaction.findMany({
    where: eq(transaction.businessId, businessId),
    orderBy: desc(transaction.createdAt),
  })
}

export async function getBusinessTransactions(businessId: string) {
  const userId = await getUserId()
  // Verifikasi akses
  await getBusinessAccess(businessId, userId)

  return db.query.transaction.findMany({
    where: eq(transaction.businessId, businessId),
    orderBy: desc(transaction.createdAt),
  })
}

export async function getTransaction(transactionId: string) {
  const userId = await getUserId()
  const txn = await db.query.transaction.findFirst({
    where: eq(transaction.id, transactionId),
  })
  if (!txn) throw new Error('Transaction not found')

  // Verifikasi akses ke bisnis
  await getBusinessAccess(txn.businessId, userId)
  return txn
}

export async function updateTransaction(
  transactionId: string,
  updates: {
    amount?: number
    description?: string
    categoryId?: string
    tags?: string[]
    notes?: string
  }
) {
  const userId = await getUserId()

  const txn = await db.query.transaction.findFirst({
    where: eq(transaction.id, transactionId),
  })
  if (!txn) throw new Error('Transaction not found')

  // Verifikasi akses — viewer tidak bisa edit
  const access = await getBusinessAccess(txn.businessId, userId)
  if (access.role === 'viewer') throw new Error('Viewer tidak dapat mengubah transaksi')

  await db
    .update(transaction)
    .set({
      ...updates,
      amount: updates.amount ? updates.amount.toString() : undefined,
      updatedAt: new Date(),
    })
    .where(eq(transaction.id, transactionId))

  revalidatePath('/')
  return { transactionId, ...updates }
}

export async function deleteTransaction(transactionId: string) {
  const userId = await getUserId()

  const txn = await db.query.transaction.findFirst({
    where: eq(transaction.id, transactionId),
  })
  if (!txn) throw new Error('Transaction not found')

  // Hanya owner yang bisa hapus transaksi
  const access = await getBusinessAccess(txn.businessId, userId)
  if (!access.isOwner) throw new Error('Hanya pemilik bisnis yang dapat menghapus transaksi')

  await db
    .delete(transaction)
    .where(eq(transaction.id, transactionId))

  revalidatePath('/')
  return { transactionId }
}

export async function getTransactionCountThisMonth(businessId: string): Promise<number> {
  const userId = await getUserId()
  await getBusinessAccess(businessId, userId)

  const now = new Date()
  const startMonth = new Date(now.getFullYear(), now.getMonth(), 1)
  const [{ value }] = await db
    .select({ value: count() })
    .from(transaction)
    .where(and(eq(transaction.businessId, businessId), gte(transaction.createdAt, startMonth)))
  return value
}
