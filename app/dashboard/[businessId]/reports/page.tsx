import { auth } from '@/lib/auth'
import { headers, cookies } from 'next/headers'
import { redirect } from 'next/navigation'
import { getBusiness } from '@/app/actions/business'
import { getBusinessTransactions } from '@/app/actions/transaction'
import { PdfExport } from '@/components/pdf-export'
import { ReportsCharts } from '@/components/reports-charts'
import { ReportPeriodFilter } from '@/components/report-period-filter'

export const metadata = { title: 'Laporan Keuangan — KasAI' }
export const dynamic = 'force-dynamic'

const MONTH_NAMES = ['Jan', 'Feb', 'Mar', 'Apr', 'Mei', 'Jun', 'Jul', 'Agu', 'Sep', 'Okt', 'Nov', 'Des']
const MONTH_NAMES_FULL = ['Januari','Februari','Maret','April','Mei','Juni','Juli','Agustus','September','Oktober','November','Desember']

const SOURCE_LABELS: Record<string, string> = {
  manual: 'Manual', telegram: 'Telegram', voice_note: 'Suara', receipt_image: 'Struk', api: 'API',
}
const SOURCE_ICONS: Record<string, string> = {
  manual: '✍️', telegram: '💬', voice_note: '🎙️', receipt_image: '📷', api: '🔌',
}

export default async function ReportsPage({
  params,
  searchParams,
}: {
  params: Promise<{ businessId: string }>
  searchParams: Promise<{ month?: string; year?: string; range?: string }>
}) {
  const { businessId } = await params
  const sp = await searchParams
  const h = await headers()
  const c = await cookies()
  const cookieString = c.getAll().map((ck) => `${ck.name}=${ck.value}`).join('; ')
  const reqHeaders = new Headers(h as any)
  if (cookieString) reqHeaders.set('cookie', cookieString)
  const session = await auth.api.getSession({ headers: reqHeaders })
  if (!session?.user) redirect('/sign-in')

  try {
    const business = await getBusiness(businessId)
    const allTransactions = await getBusinessTransactions(businessId)

    const now = new Date()
    const selectedYear = sp.year ? parseInt(sp.year) : now.getFullYear()
    const selectedMonth = sp.month ? parseInt(sp.month) : null // null = semua bulan
    const range = sp.range || (selectedMonth !== null ? 'month' : 'year')

    // Filter transaksi berdasarkan periode yang dipilih
    let transactions = allTransactions
    let periodLabel = 'Semua Waktu'
    let startDate: Date | null = null
    let endDate: Date | null = null

    if (range === 'month' && selectedMonth !== null) {
      startDate = new Date(selectedYear, selectedMonth - 1, 1)
      endDate = new Date(selectedYear, selectedMonth, 0, 23, 59, 59)
      periodLabel = `${MONTH_NAMES_FULL[selectedMonth - 1]} ${selectedYear}`
      transactions = allTransactions.filter((t) => {
        const d = new Date(t.createdAt)
        return d >= startDate! && d <= endDate!
      })
    } else if (range === 'year') {
      startDate = new Date(selectedYear, 0, 1)
      endDate = new Date(selectedYear, 11, 31, 23, 59, 59)
      periodLabel = `Tahun ${selectedYear}`
      transactions = allTransactions.filter((t) => {
        const d = new Date(t.createdAt)
        return d.getFullYear() === selectedYear
      })
    }

    const totalIncome = transactions.filter((t) => t.transaction_type === 'income').reduce((s, t) => s + parseFloat(t.amount), 0)
    const totalExpense = transactions.filter((t) => t.transaction_type === 'expense').reduce((s, t) => s + parseFloat(t.amount), 0)
    const netProfit = totalIncome - totalExpense
    const profitMargin = totalIncome > 0 ? ((netProfit / totalIncome) * 100).toFixed(1) : '0'

    // Monthly data (6 bulan untuk month view, 12 bulan untuk year view)
    const monthlyData: Record<string, { income: number; expense: number }> = {}
    if (range === 'month' && selectedMonth !== null) {
      // View per bulan: tampilkan per minggu
      for (let w = 1; w <= 5; w++) {
        monthlyData[`W${w}`] = { income: 0, expense: 0 }
      }
      transactions.forEach((t) => {
        const d = new Date(t.createdAt)
        const week = Math.ceil(d.getDate() / 7)
        const key = `W${Math.min(week, 5)}`
        if (monthlyData[key]) {
          if (t.transaction_type === 'income') monthlyData[key].income += parseFloat(t.amount)
          else monthlyData[key].expense += parseFloat(t.amount)
        }
      })
    } else if (range === 'year') {
      // View per tahun: tampilkan 12 bulan
      for (let m = 0; m < 12; m++) {
        monthlyData[MONTH_NAMES[m]] = { income: 0, expense: 0 }
      }
      transactions.forEach((t) => {
        const d = new Date(t.createdAt)
        const key = MONTH_NAMES[d.getMonth()]
        if (monthlyData[key]) {
          if (t.transaction_type === 'income') monthlyData[key].income += parseFloat(t.amount)
          else monthlyData[key].expense += parseFloat(t.amount)
        }
      })
    } else {
      // All time: 12 bulan terakhir
      for (let i = 11; i >= 0; i--) {
        const d = new Date(now.getFullYear(), now.getMonth() - i, 1)
        const key = `${MONTH_NAMES[d.getMonth()]} ${d.getFullYear()}`
        monthlyData[key] = { income: 0, expense: 0 }
      }
      allTransactions.forEach((t) => {
        const d = new Date(t.createdAt)
        const monthsDiff = (now.getFullYear() - d.getFullYear()) * 12 + (now.getMonth() - d.getMonth())
        if (monthsDiff >= 0 && monthsDiff < 12) {
          const key = `${MONTH_NAMES[d.getMonth()]} ${d.getFullYear()}`
          if (monthlyData[key]) {
            if (t.transaction_type === 'income') monthlyData[key].income += parseFloat(t.amount)
            else monthlyData[key].expense += parseFloat(t.amount)
          }
        }
      })
    }
    const monthlyEntries = Object.entries(monthlyData)

    // Category breakdown
    const categoryData: Record<string, number> = {}
    transactions.filter((t) => t.transaction_type === 'expense').forEach((t) => {
      const cat = t.categoryName || t.categoryId || 'Lainnya'
      categoryData[cat] = (categoryData[cat] || 0) + parseFloat(t.amount)
    })
    const topCategories = Object.entries(categoryData).sort(([, a], [, b]) => b - a).slice(0, 6)

    // Source breakdown
    const sourceData: Record<string, number> = {}
    transactions.forEach((t) => {
      sourceData[t.source] = (sourceData[t.source] || 0) + 1
    })

    // Available years for filter (dari tahun transaksi pertama sampai sekarang)
    const availableYears: number[] = []
    if (allTransactions.length > 0) {
      const minYear = Math.min(...allTransactions.map((t) => new Date(t.createdAt).getFullYear()))
      for (let y = now.getFullYear(); y >= minYear; y--) availableYears.push(y)
    } else {
      availableYears.push(now.getFullYear())
    }

    return (
      <div className="p-6 lg:p-8">
        {/* Header */}
        <div className="mb-6 flex items-start justify-between gap-4 flex-wrap">
          <div>
            <h1 className="text-2xl font-bold text-foreground tracking-tight">Laporan Keuangan</h1>
            <p className="text-sm text-muted-foreground mt-0.5">{business.name} · {periodLabel}</p>
          </div>
          <PdfExport businessId={businessId} businessName={business.name} />
        </div>

        {/* Period Filter */}
        <ReportPeriodFilter
          businessId={businessId}
          selectedYear={selectedYear}
          selectedMonth={selectedMonth}
          range={range}
          availableYears={availableYears}
        />

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

        {transactions.length === 0 ? (
          <div className="rounded-2xl border-2 border-dashed border-border p-12 text-center">
            <div className="text-4xl mb-3">📭</div>
            <p className="text-foreground font-medium mb-1">Tidak ada transaksi di periode ini</p>
            <p className="text-sm text-muted-foreground">Coba pilih periode lain atau periksa kembali data transaksi Anda.</p>
          </div>
        ) : (
          <>
            <div className="grid lg:grid-cols-2 gap-6 mb-6">
              <ReportsCharts
                monthlyData={monthlyEntries.map(([key, val]) => ({
                  month: key,
                  income: val.income,
                  expense: val.expense,
                }))}
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
              <p className="text-xs text-muted-foreground mb-6">Dari mana transaksi dicatat pada periode ini</p>
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-4">
                {Object.entries(sourceData).map(([source, cnt]) => (
                  <div key={source} className="rounded-xl border border-border bg-muted/30 p-4 text-center">
                    <div className="text-2xl mb-2">{SOURCE_ICONS[source] || '📝'}</div>
                    <p className="text-2xl font-bold text-foreground">{cnt}</p>
                    <p className="text-xs text-muted-foreground mt-1">{SOURCE_LABELS[source] || source}</p>
                    <p className="text-xs text-muted-foreground">
                      {transactions.length > 0 ? ((cnt / transactions.length) * 100).toFixed(0) : 0}%
                    </p>
                  </div>
                ))}
              </div>
            </div>
          </>
        )}
      </div>
    )
  } catch (err) {
    console.error('[ReportsPage] error:', err)
    redirect('/dashboard')
  }
}
