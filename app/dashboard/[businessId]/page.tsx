import { auth } from '@/lib/auth'
import { headers, cookies } from 'next/headers'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import { getBusiness } from '@/app/actions/business'
import { getBusinessTransactions } from '@/app/actions/transaction'
import { Button } from '@/components/ui/button'

export const generateStaticParams = async () => []
export const dynamic = 'force-dynamic'

export const metadata = {
  title: 'Dashboard Bisnis — KasAI',
}

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

export default async function BusinessDashboardPage({
  params,
}: {
  params: Promise<{ businessId: string }>
}) {
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

    const totalExpenses = transactions
      .filter((t) => t.transaction_type === 'expense')
      .reduce((s, t) => s + parseFloat(t.amount), 0)
    const totalIncome = transactions
      .filter((t) => t.transaction_type === 'income')
      .reduce((s, t) => s + parseFloat(t.amount), 0)
    const netProfit = totalIncome - totalExpenses

    // This month
    const now = new Date()
    const thisMonth = transactions.filter((t) => {
      const d = new Date(t.createdAt)
      return d.getMonth() === now.getMonth() && d.getFullYear() === now.getFullYear()
    })
    const monthIncome = thisMonth.filter((t) => t.transaction_type === 'income').reduce((s, t) => s + parseFloat(t.amount), 0)
    const monthExpense = thisMonth.filter((t) => t.transaction_type === 'expense').reduce((s, t) => s + parseFloat(t.amount), 0)

    // Source breakdown
    const sourceCount = transactions.reduce((acc, t) => {
      acc[t.source] = (acc[t.source] || 0) + 1
      return acc
    }, {} as Record<string, number>)

    const recent = transactions.slice(0, 8)

    return (
      <div className="p-8">
        {/* Header */}
        <div className="mb-8 flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
          <div>
            <p className="text-sm text-muted-foreground mb-1">
              <Link href="/dashboard" className="hover:text-foreground transition-colors">Semua Bisnis</Link>
              {' / '}
              <span className="text-foreground">{business.name}</span>
            </p>
            <h1 className="text-3xl font-bold text-foreground">{business.name}</h1>
            <p className="text-muted-foreground mt-1 capitalize">{business.type} · {transactions.length} transaksi total</p>
          </div>
          <div className="flex gap-2 flex-wrap">
            <Link href={`/dashboard/${businessId}/add-expense`}>
              <Button>+ Tambah Transaksi</Button>
            </Link>
            <Link href={`/dashboard/${businessId}/ai-chat`}>
              <Button variant="outline">✦ AI Chat</Button>
            </Link>
          </div>
        </div>

        {/* KPI Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          <div className="rounded-2xl border border-border bg-card p-5">
            <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-2">Total Pemasukan</p>
            <p className="text-2xl font-bold text-emerald-600">
              Rp {totalIncome.toLocaleString('id-ID')}
            </p>
            <p className="text-xs text-muted-foreground mt-1">
              {transactions.filter((t) => t.transaction_type === 'income').length} transaksi
            </p>
          </div>
          <div className="rounded-2xl border border-border bg-card p-5">
            <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-2">Total Pengeluaran</p>
            <p className="text-2xl font-bold text-rose-500">
              Rp {totalExpenses.toLocaleString('id-ID')}
            </p>
            <p className="text-xs text-muted-foreground mt-1">
              {transactions.filter((t) => t.transaction_type === 'expense').length} transaksi
            </p>
          </div>
          <div className="rounded-2xl border border-border bg-card p-5">
            <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-2">Laba Bersih</p>
            <p className={`text-2xl font-bold ${netProfit >= 0 ? 'text-primary' : 'text-rose-500'}`}>
              Rp {netProfit.toLocaleString('id-ID')}
            </p>
            <p className={`text-xs mt-1 ${netProfit >= 0 ? 'text-emerald-600' : 'text-rose-500'}`}>
              {netProfit >= 0 ? '↑ Positif' : '↓ Negatif'}
            </p>
          </div>
          <div className="rounded-2xl border border-border bg-card p-5">
            <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-2">Bulan Ini</p>
            <p className={`text-2xl font-bold ${(monthIncome - monthExpense) >= 0 ? 'text-primary' : 'text-rose-500'}`}>
              Rp {(monthIncome - monthExpense).toLocaleString('id-ID')}
            </p>
            <p className="text-xs text-muted-foreground mt-1">
              {thisMonth.length} transaksi bulan ini
            </p>
          </div>
        </div>

        <div className="grid lg:grid-cols-3 gap-6">
          {/* Recent Transactions */}
          <div className="lg:col-span-2 rounded-2xl border border-border bg-card overflow-hidden">
            <div className="flex items-center justify-between px-6 py-4 border-b border-border">
              <h2 className="font-semibold text-foreground">Transaksi Terbaru</h2>
              <Link href={`/dashboard/${businessId}/transactions`}>
                <Button variant="ghost" size="sm" className="text-xs">Lihat Semua →</Button>
              </Link>
            </div>
            {recent.length === 0 ? (
              <div className="p-12 text-center">
                <p className="text-muted-foreground mb-4">Belum ada transaksi.</p>
                <Link href={`/dashboard/${businessId}/add-expense`}>
                  <Button size="sm">Tambah Transaksi Pertama</Button>
                </Link>
              </div>
            ) : (
              <div className="divide-y divide-border">
                {recent.map((txn) => (
                  <div key={txn.id} className="flex items-center justify-between px-6 py-3.5 hover:bg-muted/30 transition-colors">
                    <div className="flex items-center gap-3 min-w-0">
                      <div className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-xs ${
                        txn.transaction_type === 'income'
                          ? 'bg-emerald-100 text-emerald-700'
                          : 'bg-rose-100 text-rose-700'
                      }`}>
                        {txn.transaction_type === 'income' ? '↑' : '↓'}
                      </div>
                      <div className="min-w-0">
                        <p className="text-sm font-medium text-foreground truncate">{txn.description}</p>
                        <p className="text-xs text-muted-foreground">
                          {SOURCE_ICONS[txn.source]} {SOURCE_LABELS[txn.source]} ·{' '}
                          {new Date(txn.createdAt).toLocaleDateString('id-ID', { day: 'numeric', month: 'short' })}
                        </p>
                      </div>
                    </div>
                    <p className={`text-sm font-semibold shrink-0 ml-3 ${
                      txn.transaction_type === 'income' ? 'text-emerald-600' : 'text-rose-500'
                    }`}>
                      {txn.transaction_type === 'income' ? '+' : '-'}Rp {parseFloat(txn.amount).toLocaleString('id-ID')}
                    </p>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Right column */}
          <div className="space-y-5">
            {/* Quick actions */}
            <div className="rounded-2xl border border-border bg-card p-5">
              <h3 className="font-semibold text-foreground mb-4">Aksi Cepat</h3>
              <div className="space-y-2">
                <Link href={`/dashboard/${businessId}/add-expense`} className="block">
                  <Button variant="outline" className="w-full justify-start gap-3 h-10">
                    <span>➕</span> Tambah Transaksi
                  </Button>
                </Link>
                <Link href={`/dashboard/${businessId}/ai-chat`} className="block">
                  <Button variant="outline" className="w-full justify-start gap-3 h-10">
                    <span>✦</span> Tanya AI
                  </Button>
                </Link>
                <Link href={`/dashboard/${businessId}/reports`} className="block">
                  <Button variant="outline" className="w-full justify-start gap-3 h-10">
                    <span>📊</span> Lihat Laporan
                  </Button>
                </Link>
                <Link href={`/dashboard/${businessId}/settings`} className="block">
                  <Button variant="outline" className="w-full justify-start gap-3 h-10">
                    <span>⚙️</span> Pengaturan
                  </Button>
                </Link>
              </div>
            </div>

            {/* Source breakdown */}
            {Object.keys(sourceCount).length > 0 && (
              <div className="rounded-2xl border border-border bg-card p-5">
                <h3 className="font-semibold text-foreground mb-4">Sumber Transaksi</h3>
                <div className="space-y-3">
                  {Object.entries(sourceCount)
                    .sort(([, a], [, b]) => b - a)
                    .map(([source, count]) => (
                      <div key={source} className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <span className="text-sm">{SOURCE_ICONS[source] || '📝'}</span>
                          <span className="text-sm text-foreground">{SOURCE_LABELS[source] || source}</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <div className="h-1.5 rounded-full bg-primary/20 w-16">
                            <div
                              className="h-1.5 rounded-full bg-primary"
                              style={{ width: `${(count / transactions.length) * 100}%` }}
                            />
                          </div>
                          <span className="text-xs text-muted-foreground w-6 text-right">{count}</span>
                        </div>
                      </div>
                    ))}
                </div>
              </div>
            )}

            {/* Telegram tip */}
            <div className="rounded-2xl border border-primary/20 bg-primary/5 p-5">
              <div className="flex items-start gap-3">
                <span className="text-2xl">💬</span>
                <div>
                  <p className="text-sm font-semibold text-foreground mb-1">Catat via Telegram</p>
                  <p className="text-xs text-muted-foreground leading-relaxed">
                    Daftarkan nomor HP di Pengaturan, lalu chat ke{' '}
                    <a href="https://t.me/Aiaccountingsbot" target="_blank" rel="noopener noreferrer" className="text-primary font-medium hover:underline">
                      @Aiaccountingsbot
                    </a>{' '}
                    — transaksi langsung tercatat tanpa buka aplikasi.
                  </p>
                  <Link href={`/dashboard/${businessId}/settings`}>
                    <Button variant="link" size="sm" className="px-0 h-auto mt-2 text-xs text-primary">
                      Setup sekarang →
                    </Button>
                  </Link>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    )
  } catch (err) {
    console.error('[BusinessDashboardPage] error:', err)
    redirect('/dashboard')
  }
}
