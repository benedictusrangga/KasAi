import { auth } from '@/lib/auth'
import { headers, cookies } from 'next/headers'
import { redirect } from 'next/navigation'
import { getBusiness } from '@/app/actions/business'
import { getBusinessTransactions } from '@/app/actions/transaction'
import { PdfExport } from '@/components/pdf-export'

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
    const maxMonthlyVal = Math.max(...monthlyEntries.flatMap(([, v]) => [v.income, v.expense]), 1)

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
      <div className="p-8">
        {/* Header */}
        <div className="mb-8 flex items-start justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold text-foreground">Laporan Keuangan</h1>
            <p className="text-muted-foreground mt-1">{business.name} · Semua waktu</p>
          </div>
          <PdfExport businessId={businessId} businessName={business.name} />
        </div>

        {/* KPI Cards */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          {[
            { label: 'Total Pemasukan', value: `Rp ${totalIncome.toLocaleString('id-ID')}`, color: 'text-emerald-600', sub: `${transactions.filter((t) => t.transaction_type === 'income').length} transaksi` },
            { label: 'Total Pengeluaran', value: `Rp ${totalExpense.toLocaleString('id-ID')}`, color: 'text-rose-500', sub: `${transactions.filter((t) => t.transaction_type === 'expense').length} transaksi` },
            { label: 'Laba Bersih', value: `Rp ${netProfit.toLocaleString('id-ID')}`, color: netProfit >= 0 ? 'text-primary' : 'text-rose-500', sub: netProfit >= 0 ? '↑ Positif' : '↓ Negatif' },
            { label: 'Margin Laba', value: `${profitMargin}%`, color: parseFloat(profitMargin) >= 20 ? 'text-emerald-600' : 'text-amber-500', sub: `dari ${transactions.length} transaksi` },
          ].map((kpi) => (
            <div key={kpi.label} className="rounded-2xl border border-border bg-card p-5">
              <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-2">{kpi.label}</p>
              <p className={`text-xl font-bold ${kpi.color}`}>{kpi.value}</p>
              <p className="text-xs text-muted-foreground mt-1">{kpi.sub}</p>
            </div>
          ))}
        </div>

        <div className="grid lg:grid-cols-2 gap-6 mb-6">
          {/* Monthly chart */}
          <div className="rounded-2xl border border-border bg-card p-6">
            <h2 className="font-semibold text-foreground mb-1">Tren 6 Bulan Terakhir</h2>
            <p className="text-xs text-muted-foreground mb-6">Pemasukan vs Pengeluaran per bulan</p>
            <div className="space-y-4">
              {monthlyEntries.map(([key, val]) => {
                const [year, month] = key.split('-')
                const label = `${MONTH_NAMES[parseInt(month) - 1]} ${year}`
                return (
                  <div key={key}>
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-xs text-muted-foreground">{label}</span>
                      <span className={`text-xs font-medium ${(val.income - val.expense) >= 0 ? 'text-emerald-600' : 'text-rose-500'}`}>
                        {(val.income - val.expense) >= 0 ? '+' : ''}Rp {(val.income - val.expense).toLocaleString('id-ID')}
                      </span>
                    </div>
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <span className="text-xs text-emerald-600 w-16 text-right">Rp {(val.income / 1000).toFixed(0)}k</span>
                        <div className="flex-1 h-2 bg-muted rounded-full overflow-hidden">
                          <div
                            className="h-full bg-emerald-500 rounded-full transition-all"
                            style={{ width: `${(val.income / maxMonthlyVal) * 100}%` }}
                          />
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="text-xs text-rose-500 w-16 text-right">Rp {(val.expense / 1000).toFixed(0)}k</span>
                        <div className="flex-1 h-2 bg-muted rounded-full overflow-hidden">
                          <div
                            className="h-full bg-rose-400 rounded-full transition-all"
                            style={{ width: `${(val.expense / maxMonthlyVal) * 100}%` }}
                          />
                        </div>
                      </div>
                    </div>
                  </div>
                )
              })}
            </div>
            <div className="flex gap-4 mt-4 pt-4 border-t border-border">
              <div className="flex items-center gap-1.5">
                <div className="h-2 w-4 rounded-full bg-emerald-500" />
                <span className="text-xs text-muted-foreground">Pemasukan</span>
              </div>
              <div className="flex items-center gap-1.5">
                <div className="h-2 w-4 rounded-full bg-rose-400" />
                <span className="text-xs text-muted-foreground">Pengeluaran</span>
              </div>
            </div>
          </div>

          {/* Category breakdown */}
          <div className="rounded-2xl border border-border bg-card p-6">
            <h2 className="font-semibold text-foreground mb-1">Kategori Pengeluaran</h2>
            <p className="text-xs text-muted-foreground mb-6">Top kategori berdasarkan jumlah</p>
            {topCategories.length === 0 ? (
              <p className="text-sm text-muted-foreground text-center py-8">Belum ada data kategori.</p>
            ) : (
              <div className="space-y-4">
                {topCategories.map(([cat, amount]) => (
                  <div key={cat}>
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-sm text-foreground capitalize">{cat}</span>
                      <span className="text-sm font-medium text-foreground">
                        Rp {amount.toLocaleString('id-ID')}
                      </span>
                    </div>
                    <div className="h-2 bg-muted rounded-full overflow-hidden">
                      <div
                        className="h-full bg-primary rounded-full transition-all"
                        style={{ width: `${totalExpense > 0 ? (amount / totalExpense) * 100 : 0}%` }}
                      />
                    </div>
                    <p className="text-xs text-muted-foreground mt-0.5">
                      {totalExpense > 0 ? ((amount / totalExpense) * 100).toFixed(1) : 0}% dari total pengeluaran
                    </p>
                  </div>
                ))}
              </div>
            )}
          </div>
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
