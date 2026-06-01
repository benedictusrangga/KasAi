import { auth } from '@/lib/auth'
import { headers, cookies } from 'next/headers'
import { redirect } from 'next/navigation'
import { getBusiness } from '@/app/actions/business'
import { getBusinessTransactions } from '@/app/actions/transaction'
import { PdfExport } from '@/components/pdf-export'
import { ReportsCharts } from '@/components/reports-charts'

export const metadata = { title: 'Laporan Keuangan — KasAI' }
export const dynamic = 'force-dynamic'

const MONTH_NAMES = ['Jan', 'Feb', 'Mar', 'Apr', 'Mei', 'Jun', 'Jul', 'Agu', 'Sep', 'Okt', 'Nov', 'Des']

const SOURCE_LABELS: Record<string, string> = {
  manual: 'Manual',
  telegram: 'Telegram',
  voice_note: 'Suara',
  receipt_image: 'Struk',
  api: 'API',
}

const SOURCE_ICONS: Record<string, string> = {
  manual: '✍️',
  telegram: '💬',
  voice_note: '🎙️',
  receipt_image: '📷',
  api: '🔌',
}

export default async function ReportsPage({ params }: { params: Promise<{ businessId: string }> }) {
  const { businessId } = await params
  const h = await headers()
  const c = await cookies()
  const cookieString = c.getAll().map((ck) => `${ck.name}=${ck.value}`).join('; ')
  const reqHeaders = new Headers(h as any)
  if (cookieString) reqHeaders.set('cookie', cookieString)
  const session = await auth.api.getSession({ headers: reqHeaders })
  if (!session?.user) redirect('/sign-in')

  try {
    const business = await getBusiness(businessId)
    const transactions = await getBusinessTransactions(businessId)

    const totalIncome = transactions.filter((t) => t.transaction_type === 'income').reduce((s, t) => s + parseFloat(t.amount), 0)
    const totalExpense = transactions.filter((t) => t.transaction_type === 'expense').reduce((s, t) => s + parseFloat(t.amount), 0)
    const netProfit = totalIncome - totalExpense
    const profitMargin = totalIncome > 0 ? ((netProfit / totalIncome) * 100).toFixed(1) : '0'

    // Monthly data (last 6 months)
    const monthlyData: Record<string, { income: number; expense: number }> = {}
    const now = new Date()
    for (let i = 5; i >= 0; i--) {
      const d = new Date(now.getFullYear(), now.getMonth() - i, 1)
      const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`
      monthlyData[key] = { income: 0, expense: 0 }
    }
    transactions.forEach((t) => {
      const d = new Date(t.createdAt)
      const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`
      if (monthlyData[key]) {
        if (t.transaction_type === 'income') monthlyData[key].income += parseFloat(t.amount)
        else monthlyData[key].expense += parseFloat(t.amount)
      }
    })

    const monthlyEntries = Object.entries(monthlyData)

    // Category breakdown
    const categoryData: Record<string, number> = {}
    transactions.filter((t) => t.transaction_type === 'expense').forEach((t) => {
      const cat = t.categoryId || 'Lainnya'
      categoryData[cat] = (categoryData[cat] || 0) + parseFloat(t.amount)
    })
    const topCategories = Object.entries(categoryData).sort(([, a], [, b]) => b - a).slice(0, 6)

    // Source breakdown
    const sourceData: Record<string, number> = {}
    transactions.forEach((t) => {
      sourceData[t.source] = (sourceData[t.source] || 0) + 1
    })

    return (
      <div className="p-6 lg:p-8">
        {/* Header */}
        <div className="mb-6 flex items-start justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-foreground tracking-tight">Laporan Keuangan</h1>
            <p className="text-sm text-muted-foreground mt-0.5">{business.name} · Semua waktu</p>
          </div>
          <PdfExport businessId={businessId} businessName={business.name} />
        </div>

        {/* KPI Cards */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 mb-6">
          {[
            { label: 'Total Pemasukan', value: `Rp ${totalIncome.toLocaleString('id-ID')}`, color: 'text-emerald-500', dot: 'bg-emerald-500', sub: `${transactions.filter((t) => t.transaction_type === 'income').length} transaksi` },
            { label: 'Total Pengeluaran', value: `Rp ${totalExpense.toLocaleString('id-ID')}`, color: 'text-rose-500', dot: 'bg-rose-500', sub: `${transactions.filter((t) => t.transaction_type === 'expense').length} transaksi` },
            { label: 'Laba Bersih', value: `Rp ${netProfit.toLocaleString('id-ID')}`, color: netProfit >= 0 ? 'text-violet-500' : 'text-rose-500', dot: netProfit >= 0 ? 'bg-violet-500' : 'bg-rose-500', sub: netProfit >= 0 ? '↑ Positif' : '↓ Negatif' },
            { label: 'Margin Laba', value: `${profitMargin}%`, color: parseFloat(profitMargin) >= 20 ? 'text-emerald-500' : 'text-amber-500', dot: parseFloat(profitMargin) >= 20 ? 'bg-emerald-500' : 'bg-amber-500', sub: `dari ${transactions.length} transaksi` },
          ].map((kpi) => (
            <div key={kpi.label} className="rounded-2xl border border-border bg-card p-4 lg:p-5">
              <div className="flex items-center gap-1.5 mb-3">
                <div className={`h-1.5 w-1.5 rounded-full ${kpi.dot}`} />
                <p className="text-xs font-medium text-muted-foreground">{kpi.label}</p>
              </div>
              <p className={`text-xl font-bold tracking-tight ${kpi.color}`}>{kpi.value}</p>
              <p className="text-xs text-muted-foreground mt-1">{kpi.sub}</p>
            </div>
          ))}
        </div>

        <div className="grid lg:grid-cols-2 gap-6 mb-6">
          {/* Monthly chart */}
          <ReportsCharts
            monthlyData={monthlyEntries.map(([key, val]) => {
              const [, month] = key.split('-')
              return { month: MONTH_NAMES[parseInt(month) - 1], income: val.income, expense: val.expense }
            })}
            categoryData={topCategories.map(([cat, amount]) => ({
              name: cat,
              value: amount,
              percentage: totalExpense > 0 ? Math.round((amount / totalExpense) * 100) : 0,
            }))}
          />
        </div>

        {/* Source breakdown */}
        <div className="rounded-2xl border border-border bg-card p-6">
          <h2 className="font-semibold text-foreground mb-1">Sumber Pencatatan</h2>
          <p className="text-xs text-muted-foreground mb-6">Dari mana transaksi dicatat</p>
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-4">
            {Object.entries(sourceData).map(([source, count]) => (
              <div key={source} className="rounded-xl border border-border bg-muted/30 p-4 text-center">
                <div className="text-2xl mb-2">{SOURCE_ICONS[source] || '📝'}</div>
                <p className="text-2xl font-bold text-foreground">{count}</p>
                <p className="text-xs text-muted-foreground mt-1">{SOURCE_LABELS[source] || source}</p>
                <p className="text-xs text-muted-foreground">
                  {transactions.length > 0 ? ((count / transactions.length) * 100).toFixed(0) : 0}%
                </p>
              </div>
            ))}
            {Object.keys(sourceData).length === 0 && (
              <div className="col-span-5 text-center py-8 text-muted-foreground text-sm">
                Belum ada data transaksi.
              </div>
            )}
          </div>
        </div>
      </div>
    )
  } catch (err) {
    console.error('[ReportsPage] error:', err)
    redirect('/dashboard')
  }
}
