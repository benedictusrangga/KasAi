import { auth } from '@/lib/auth'
import { headers, cookies } from 'next/headers'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import { getBusiness } from '@/app/actions/business'
import { getBusinessTransactions } from '@/app/actions/transaction'
import { getGoals, getBudgets } from '@/app/actions/goals'
import { Button } from '@/components/ui/button'

export const generateStaticParams = async () => []
export const dynamic = 'force-dynamic'
export const metadata = { title: 'Dashboard Bisnis — KasAI' }

const SOURCE_LABELS: Record<string, string> = { manual: 'Manual', telegram: 'Telegram', voice_note: 'Suara', receipt_image: 'Struk', api: 'API' }
const SOURCE_ICONS: Record<string, string>  = { manual: '✍️', telegram: '💬', voice_note: '🎙️', receipt_image: '📷', api: '🔌' }

export default async function BusinessDashboardPage({ params }: { params: Promise<{ businessId: string }> }) {
  const { businessId } = await params
  const h = await headers(); const c = await cookies()
  const cookieString = c.getAll().map((ck) => `${ck.name}=${ck.value}`).join('; ')
  const reqHeaders = new Headers(h as any)
  if (cookieString) reqHeaders.set('cookie', cookieString)
  const session = await auth.api.getSession({ headers: reqHeaders })
  if (!session?.user) redirect('/sign-in')

  try {
    const [business, transactions, goals, budgets] = await Promise.all([
      getBusiness(businessId),
      getBusinessTransactions(businessId),
      getGoals(businessId).catch(() => []),
      getBudgets(businessId).catch(() => []),
    ])

    const totalExpenses = transactions.filter((t) => t.transaction_type === 'expense').reduce((s, t) => s + parseFloat(t.amount), 0)
    const totalIncome   = transactions.filter((t) => t.transaction_type === 'income').reduce((s, t) => s + parseFloat(t.amount), 0)
    const netProfit     = totalIncome - totalExpenses

    const now = new Date()
    const thisMonth = transactions.filter((t) => {
      const d = new Date(t.createdAt)
      return d.getMonth() === now.getMonth() && d.getFullYear() === now.getFullYear()
    })
    const monthIncome  = thisMonth.filter((t) => t.transaction_type === 'income').reduce((s, t) => s + parseFloat(t.amount), 0)
    const monthExpense = thisMonth.filter((t) => t.transaction_type === 'expense').reduce((s, t) => s + parseFloat(t.amount), 0)

    const sourceCount = transactions.reduce((acc, t) => { acc[t.source] = (acc[t.source] || 0) + 1; return acc }, {} as Record<string, number>)
    const recent = transactions.slice(0, 8)

    const activeGoals = goals.filter((g) => !g.completed)
    const startMonth  = new Date(now.getFullYear(), now.getMonth(), 1)
    const spentByCategory: Record<string, number> = {}
    transactions.filter((t) => t.transaction_type === 'expense' && new Date(t.createdAt) >= startMonth)
      .forEach((t) => { const cat = t.categoryId || 'other'; spentByCategory[cat] = (spentByCategory[cat] || 0) + parseFloat(t.amount) })
    const overBudget = budgets.filter((b) => (spentByCategory[b.category] || 0) > parseFloat(b.amount))
    const nearBudget = budgets.filter((b) => { const pct = (spentByCategory[b.category] || 0) / parseFloat(b.amount); return pct > 0.8 && pct <= 1 })

    return (
      <div className="p-6 lg:p-8 space-y-6">
        {/* Header */}
        <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
          <div>
            <p className="text-xs text-muted-foreground mb-1">
              <Link href="/dashboard" className="hover:text-foreground transition-colors">Semua Bisnis</Link>
              <span className="mx-1.5 opacity-40">/</span>
              <span className="text-foreground">{business.name}</span>
            </p>
            <h1 className="text-2xl font-bold text-foreground tracking-tight">{business.name}</h1>
            <p className="text-sm text-muted-foreground mt-0.5 capitalize">{business.type} · {transactions.length} transaksi</p>
          </div>
          <div className="flex gap-2 flex-wrap">
            <Link href={`/dashboard/${businessId}/add-expense`}>
              <Button size="sm" className="gap-1.5">
                <svg width="13" height="13" viewBox="0 0 13 13" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><path d="M6.5 2v9M2 6.5h9"/></svg>
                Tambah
              </Button>
            </Link>
            <Link href={`/dashboard/${businessId}/ai-chat`}>
              <Button size="sm" variant="outline" className="gap-1.5">✦ AI Chat</Button>
            </Link>
          </div>
        </div>

        {/* KPI Cards */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
          {[
            { label: 'Total Pemasukan',  value: totalIncome,   color: 'text-emerald-500', sub: `${transactions.filter(t=>t.transaction_type==='income').length} transaksi`,  dot: 'bg-emerald-500' },
            { label: 'Total Pengeluaran',value: totalExpenses, color: 'text-rose-500',    sub: `${transactions.filter(t=>t.transaction_type==='expense').length} transaksi`, dot: 'bg-rose-500' },
            { label: 'Laba Bersih',      value: netProfit,     color: netProfit>=0?'text-violet-500':'text-rose-500', sub: netProfit>=0?'↑ Positif':'↓ Negatif', dot: netProfit>=0?'bg-violet-500':'bg-rose-500' },
            { label: 'Bulan Ini',        value: monthIncome-monthExpense, color: (monthIncome-monthExpense)>=0?'text-blue-500':'text-rose-500', sub: `${thisMonth.length} transaksi`, dot: (monthIncome-monthExpense)>=0?'bg-blue-500':'bg-rose-500' },
          ].map((kpi) => (
            <div key={kpi.label} className="rounded-2xl border border-border bg-card p-4 lg:p-5">
              <div className="flex items-center gap-1.5 mb-3">
                <div className={`h-1.5 w-1.5 rounded-full ${kpi.dot}`} />
                <p className="text-xs font-medium text-muted-foreground">{kpi.label}</p>
              </div>
              <p className={`text-xl lg:text-2xl font-bold tracking-tight ${kpi.color}`}>
                Rp {Math.abs(kpi.value).toLocaleString('id-ID')}
              </p>
              <p className="text-xs text-muted-foreground mt-1">{kpi.sub}</p>
            </div>
          ))}
        </div>

        <div className="grid lg:grid-cols-3 gap-5">
          {/* Recent Transactions */}
          <div className="lg:col-span-2 rounded-2xl border border-border bg-card overflow-hidden">
            <div className="flex items-center justify-between px-5 py-4 border-b border-border">
              <h2 className="font-semibold text-foreground text-sm">Transaksi Terbaru</h2>
              <Link href={`/dashboard/${businessId}/transactions`}>
                <Button variant="ghost" size="sm" className="text-xs h-7 px-2">Lihat Semua →</Button>
              </Link>
            </div>
            {recent.length === 0 ? (
              <div className="p-12 text-center">
                <div className="text-4xl mb-3">📭</div>
                <p className="text-sm text-muted-foreground mb-4">Belum ada transaksi.</p>
                <Link href={`/dashboard/${businessId}/add-expense`}><Button size="sm">Tambah Pertama</Button></Link>
              </div>
            ) : (
              <div className="divide-y divide-border">
                {recent.map((txn) => (
                  <div key={txn.id} className="flex items-center justify-between px-5 py-3 hover:bg-muted/30 transition-colors">
                    <div className="flex items-center gap-3 min-w-0">
                      <div className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-xl text-xs font-bold ${
                        txn.transaction_type === 'income' ? 'bg-emerald-500/10 text-emerald-500' : 'bg-rose-500/10 text-rose-500'
                      }`}>
                        {txn.transaction_type === 'income' ? '↑' : '↓'}
                      </div>
                      <div className="min-w-0">
                        <p className="text-sm font-medium text-foreground truncate">{txn.description}</p>
                        <p className="text-xs text-muted-foreground">
                          {SOURCE_ICONS[txn.source]} {SOURCE_LABELS[txn.source]} · {new Date(txn.createdAt).toLocaleDateString('id-ID', { day: 'numeric', month: 'short' })}
                        </p>
                      </div>
                    </div>
                    <p className={`text-sm font-semibold shrink-0 ml-3 ${txn.transaction_type === 'income' ? 'text-emerald-500' : 'text-rose-500'}`}>
                      {txn.transaction_type === 'income' ? '+' : '-'}Rp {parseFloat(txn.amount).toLocaleString('id-ID')}
                    </p>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Right column */}
          <div className="space-y-4">
            {/* Quick actions */}
            <div className="rounded-2xl border border-border bg-card p-4">
              <h3 className="text-sm font-semibold text-foreground mb-3">Aksi Cepat</h3>
              <div className="grid grid-cols-2 gap-2">
                {[
                  { href: `/dashboard/${businessId}/add-expense`, icon: '➕', label: 'Transaksi' },
                  { href: `/dashboard/${businessId}/ai-chat`,     icon: '✦',  label: 'AI Chat' },
                  { href: `/dashboard/${businessId}/goals`,       icon: '🎯', label: 'Goals' },
                  { href: `/dashboard/${businessId}/reports`,     icon: '📊', label: 'Laporan' },
                ].map((a) => (
                  <Link key={a.href} href={a.href}>
                    <div className="flex flex-col items-center gap-1.5 rounded-xl border border-border bg-muted/30 p-3 text-center hover:bg-muted/60 hover:border-primary/30 transition-all cursor-pointer">
                      <span className="text-lg">{a.icon}</span>
                      <span className="text-xs font-medium text-foreground">{a.label}</span>
                    </div>
                  </Link>
                ))}
              </div>
            </div>

            {/* Goals & Budget alerts */}
            {(activeGoals.length > 0 || overBudget.length > 0 || nearBudget.length > 0) && (
              <div className="rounded-2xl border border-border bg-card p-4">
                <div className="flex items-center justify-between mb-3">
                  <h3 className="text-sm font-semibold text-foreground">Goals & Budget</h3>
                  <Link href={`/dashboard/${businessId}/goals`}>
                    <Button variant="ghost" size="sm" className="text-xs h-6 px-2">Kelola →</Button>
                  </Link>
                </div>
                <div className="space-y-2">
                  {overBudget.map((b) => (
                    <div key={b.id} className="flex items-center gap-2 text-xs">
                      <span className="h-1.5 w-1.5 rounded-full bg-rose-500 shrink-0" />
                      <span className="text-rose-500 font-medium truncate">Budget {b.category} melebihi batas</span>
                    </div>
                  ))}
                  {nearBudget.map((b) => (
                    <div key={b.id} className="flex items-center gap-2 text-xs">
                      <span className="h-1.5 w-1.5 rounded-full bg-amber-500 shrink-0" />
                      <span className="text-amber-500 font-medium truncate">Budget {b.category} hampir habis</span>
                    </div>
                  ))}
                  {activeGoals.slice(0, 2).map((g) => {
                    const pct = Math.min(Math.round((parseFloat(g.currentAmount) / parseFloat(g.targetAmount)) * 100), 100)
                    return (
                      <div key={g.id}>
                        <div className="flex justify-between text-xs mb-1">
                          <span className="text-foreground truncate max-w-[130px]">🎯 {g.title}</span>
                          <span className="text-muted-foreground shrink-0">{pct}%</span>
                        </div>
                        <div className="h-1.5 bg-muted rounded-full overflow-hidden">
                          <div className="h-full rounded-full transition-all" style={{ width: `${pct}%`, background: 'linear-gradient(90deg, #7C3AED, #6366F1)' }} />
                        </div>
                      </div>
                    )
                  })}
                </div>
              </div>
            )}

            {/* Source breakdown */}
            {Object.keys(sourceCount).length > 0 && (
              <div className="rounded-2xl border border-border bg-card p-4">
                <h3 className="text-sm font-semibold text-foreground mb-3">Sumber Transaksi</h3>
                <div className="space-y-2.5">
                  {Object.entries(sourceCount).sort(([,a],[,b]) => b-a).map(([source, count]) => (
                    <div key={source} className="flex items-center justify-between gap-2">
                      <div className="flex items-center gap-2 min-w-0">
                        <span className="text-sm shrink-0">{SOURCE_ICONS[source] || '📝'}</span>
                        <span className="text-xs text-foreground truncate">{SOURCE_LABELS[source] || source}</span>
                      </div>
                      <div className="flex items-center gap-2 shrink-0">
                        <div className="h-1 rounded-full bg-muted w-12 overflow-hidden">
                          <div className="h-full rounded-full bg-primary" style={{ width: `${(count/transactions.length)*100}%` }} />
                        </div>
                        <span className="text-xs text-muted-foreground w-4 text-right">{count}</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Telegram tip */}
            <div className="rounded-2xl p-4" style={{ background: 'linear-gradient(135deg, rgba(124,58,237,0.08) 0%, rgba(99,102,241,0.05) 100%)', border: '1px solid rgba(124,58,237,0.15)' }}>
              <div className="flex items-start gap-3">
                <span className="text-xl shrink-0">💬</span>
                <div>
                  <p className="text-sm font-semibold text-foreground mb-1">Catat via Telegram</p>
                  <p className="text-xs text-muted-foreground leading-relaxed mb-2">
                    Chat ke <a href="https://t.me/Aiaccountingsbot" target="_blank" rel="noopener noreferrer" className="text-violet-500 font-medium hover:underline">@Aiaccountingsbot</a> — transaksi langsung tercatat.
                  </p>
                  <Link href={`/dashboard/${businessId}/settings`}>
                    <Button variant="link" size="sm" className="px-0 h-auto text-xs text-violet-500">Setup →</Button>
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
    const [business, transactions, goals, budgets] = await Promise.all([
      getBusiness(businessId),
      getBusinessTransactions(businessId),
      getGoals(businessId).catch(() => []),
      getBudgets(businessId).catch(() => []),
    ])

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

    // Goals & Budget summary
    const activeGoals = goals.filter(g => !g.completed)
    const now2 = new Date()
    const startMonth = new Date(now2.getFullYear(), now2.getMonth(), 1)
    const monthExpenseTxns = transactions.filter(t => {
      const d = new Date(t.createdAt)
      return t.transaction_type === 'expense' && d >= startMonth
    })
    const spentByCategory: Record<string, number> = {}
    monthExpenseTxns.forEach(t => {
      const cat = t.categoryId || 'other'
      spentByCategory[cat] = (spentByCategory[cat] || 0) + parseFloat(t.amount)
    })
    const overBudget = budgets.filter(b => (spentByCategory[b.category] || 0) > parseFloat(b.amount))
    const nearBudget = budgets.filter(b => {
      const pct = (spentByCategory[b.category] || 0) / parseFloat(b.amount)
      return pct > 0.8 && pct <= 1
    })

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
                <Link href={`/dashboard/${businessId}/goals`} className="block">
                  <Button variant="outline" className="w-full justify-start gap-3 h-10">
                    <span>🎯</span> Goals & Budget
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

            {/* Goals & Budget summary */}
            {(activeGoals.length > 0 || overBudget.length > 0 || nearBudget.length > 0) && (
              <div className="rounded-2xl border border-border bg-card p-5">
                <div className="flex items-center justify-between mb-3">
                  <h3 className="font-semibold text-foreground">Goals & Budget</h3>
                  <Link href={`/dashboard/${businessId}/goals`}>
                    <Button variant="ghost" size="sm" className="text-xs h-7">Kelola →</Button>
                  </Link>
                </div>
                <div className="space-y-2">
                  {overBudget.map(b => (
                    <div key={b.id} className="flex items-center gap-2 text-xs">
                      <span>🔴</span>
                      <span className="text-rose-600 font-medium">Budget {b.category} melebihi batas</span>
                    </div>
                  ))}
                  {nearBudget.map(b => (
                    <div key={b.id} className="flex items-center gap-2 text-xs">
                      <span>🟡</span>
                      <span className="text-amber-600 font-medium">Budget {b.category} hampir habis</span>
                    </div>
                  ))}
                  {activeGoals.slice(0, 2).map(g => {
                    const pct = Math.min(Math.round((parseFloat(g.currentAmount) / parseFloat(g.targetAmount)) * 100), 100)
                    return (
                      <div key={g.id}>
                        <div className="flex justify-between text-xs mb-0.5">
                          <span className="text-foreground truncate max-w-[140px]">🎯 {g.title}</span>
                          <span className="text-muted-foreground shrink-0">{pct}%</span>
                        </div>
                        <div className="h-1.5 bg-muted rounded-full overflow-hidden">
                          <div className="h-full bg-primary rounded-full" style={{ width: `${pct}%` }} />
                        </div>
                      </div>
                    )
                  })}
                </div>
              </div>
            )}

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
