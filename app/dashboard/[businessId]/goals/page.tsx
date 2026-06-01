import { auth } from '@/lib/auth'
import { headers, cookies } from 'next/headers'
import { redirect } from 'next/navigation'
import { getBusiness } from '@/app/actions/business'
import { getGoals, getBudgets } from '@/app/actions/goals'
import { getBusinessTransactions } from '@/app/actions/transaction'
import { GoalsPanel } from '@/components/goals-panel'

export const metadata = { title: 'Goals & Budget — KasAI' }
export const dynamic = 'force-dynamic'

export default async function GoalsPage({ params }: { params: Promise<{ businessId: string }> }) {
  const { businessId } = await params
  const h = await headers()
  const c = await cookies()
  const cookieString = c.getAll().map((ck) => `${ck.name}=${ck.value}`).join('; ')
  const reqHeaders = new Headers(h as any)
  if (cookieString) reqHeaders.set('cookie', cookieString)
  const session = await auth.api.getSession({ headers: reqHeaders })
  if (!session?.user) redirect('/sign-in')

  try {
    const [business, goals, budgets, transactions] = await Promise.all([
      getBusiness(businessId),
      getGoals(businessId).catch(() => []),
      getBudgets(businessId).catch(() => []),
      getBusinessTransactions(businessId).catch(() => []),
    ])

    // Hitung pengeluaran per kategori bulan ini
    const now = new Date()
    const thisMonthTxns = transactions.filter((t) => {
      const d = new Date(t.createdAt)
      return d.getMonth() === now.getMonth() && d.getFullYear() === now.getFullYear()
    })

    const spendingByCategory: Record<string, number> = {}
    thisMonthTxns
      .filter((t) => t.transaction_type === 'expense')
      .forEach((t) => {
        const cat = t.categoryId || 'other'
        spendingByCategory[cat] = (spendingByCategory[cat] || 0) + parseFloat(t.amount)
      })

    return (
      <div className="p-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-foreground">Goals & Budget</h1>
          <p className="text-muted-foreground mt-1">
            Tetapkan target keuangan dan batas pengeluaran — AI akan membantu Anda mencapainya
          </p>
        </div>
        <GoalsPanel
          businessId={businessId}
          businessName={business.name}
          goals={goals}
          budgets={budgets}
          spendingByCategory={spendingByCategory}
        />
      </div>
    )
  } catch (err) {
    console.error('[GoalsPage] error:', err)
    redirect('/dashboard')
  }
}
