import { auth } from '@/lib/auth'
import { getUserBusinesses, getCurrentUser } from '@/app/actions/business'
import { getBusinessTransactions } from '@/app/actions/transaction'
import { getGoals, getBudgets } from '@/app/actions/goals'
import { headers, cookies } from 'next/headers'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import { Button } from '@/components/ui/button'

export const metadata = { title: 'Dashboard — KasAI' }
export const dynamic = 'force-dynamic'

const BUSINESS_ICONS: Record<string, string>  = { florist: '🌸', laundry: '🧺', cafe: '☕', retail: '🛍️', other: '🏪' }
const BUSINESS_LABELS: Record<string, string> = { florist: 'Florist', laundry: 'Laundry', cafe: 'Cafe / Resto', retail: 'Toko Retail', other: 'Bisnis Lainnya' }
const MONTH_NAMES = ['Jan','Feb','Mar','Apr','Mei','Jun','Jul','Agu','Sep','Okt','Nov','Des']

export default async function DashboardPage() {
  const h = await headers(); const c = await cookies()
  const cookieString = c.getAll().map((ck) => `${ck.name}=${ck.value}`).join('; ')
  const reqHeaders = new Headers(h as any)
  if (cookieString) reqHeaders.set('cookie', cookieString)
  const session = await auth.api.getSession({ headers: reqHeaders })
  if (!session?.user) redirect('/sign-in')

  const [businesses, currentUser] = await Promise.all([getUserBusinesses(), getCurrentUser()])
  const isPersonal = currentUser.accountType === 'personal'
  const ownedBusinesses = businesses.filter((b: any) => b._isOwner)
  const canAddBusiness = !isPersonal || ownedBusinesses.length === 0

  if (isPersonal && ownedBusinesses.length === 1 && businesses.length === 1) redirect(`/dashboard/${businesses[0].id}`)

  const allData = await Promise.all(businesses.map(async (biz) => {
    const txns = await getBusinessTransactions(biz.id)
    const income  = txns.filter((t) => t.transaction_type === 'income').reduce((s, t) => s + parseFloat(t.amount), 0)
    const expense = txns.filter((t) => t.transaction_type === 'expense').reduce((s, t) => s + parseFloat(t.amount), 0)
    return { biz, txns, income, expense }
  }))

  const totalIncome  = allData.reduce((s, d) => s + d.income, 0)
  const totalExpense = allData.reduce((s, d) => s + d.expense, 0)
  const totalTxns    = allData.reduce((s, d) => s + d.txns.length, 0)
  const totalNet     = totalIncome - totalExpense

  const now = new Date()
  const monthlyConsolidated: Record<string, { income: number; expense: number }> = {}
  for (let i = 5; i >= 0; i--) {
    const d = new Date(now.getFullYear(), now.getMonth() - i, 1)
    monthlyConsolidated[`${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}`] = { income: 0, expense: 0 }
  }
  allData.forEach(({ txns }) => txns.forEach((t) => {
    const d = new Date(t.createdAt)
    const key = `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}`
    if (monthlyConsolidated[key]) {
      if (t.transaction_type === 'income') monthlyConsolidated[key].income += parseFloat(t.amount)
      else monthlyConsolidated[key].expense += parseFloat(t.amount)
    }
  }))
  const monthlyEntries = Object.entries(monthlyConsolidated)
  const maxMonthlyVal  = Math.max(...monthlyEntries.flatMap(([,v]) => [v.income, v.expense]), 1)
  const thisMonthKey   = `${now.getFullYear()}-${String(now.getMonth()+1).padStart(2,'0')}`
  const thisMonthData  = monthlyConsolidated[thisMonthKey] || { income: 0, expense: 0 }

  const goalsData = await Promise.all(ownedBusinesses.map(async (biz) => {
    const [goals, budgets] = await Promise.all([getGoals(biz.id).catch(()=>[]), getBudgets(biz.id).catch(()=>[])])
    return { biz, goals, budgets }
  }))
  const allActiveGoals = goalsData.flatMap(({ biz, goals }) => goals.filter((g)=>!g.completed).map((g)=>({...g, bizName: biz.name})))

  const budgetAlertItems: { label: string; pct: number; status: 'over'|'near' }[] = []
  goalsData.forEach(({ biz, budgets }) => {
    const bizData = allData.find((d) => d.biz.id === biz.id)
    if (!bizData) return
    const monthTxns = bizData.txns.filter((t) => { const d = new Date(t.createdAt); return t.transaction_type==='expense' && d.getMonth()===now.getMonth() && d.getFullYear()===now.getFullYear() })
    const spentByCategory: Record<string,number> = {}
    monthTxns.forEach((t) => { const cat = t.categoryId||'other'; spentByCategory[cat]=(spentByCategory[cat]||0)+parseFloat(t.amount) })
    budgets.forEach((b) => {
      const spent = spentByCategory[b.category]||0; const budgetAmt = parseFloat(b.amount); const pct = Math.round((spent/budgetAmt)*100)
      if (pct>100) budgetAlertItems.push({ label: `${biz.name} · ${b.category}`, pct, status: 'over' })
      else if (pct>=80) budgetAlertItems.push({ label: `${biz.name} · ${b.category}`, pct, status: 'near' })
    })
  })

  return (
    <div className="p-6 lg:p-8 space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <p className="text-xs text-muted-foreground mb-1">Selamat datang kembali 👋</p>
          <h1 className="text-2xl font-bold text-foreground tracking-tight">Semua Bisnis</h1>
          <p className="text-sm text-muted-foreground mt-0.5">
            Ringkasan keuangan seluruh bisnis Anda
            {isPersonal && <span className="ml-2 inline-flex items-center rounded-full bg-muted px-2 py-0.5 text-xs font-medium text-muted-foreground">Personal</span>}
          </p>
        </div>
        {canAddBusiness ? (
          <Link href="/setup"><Button size="sm" className="gap-1.5 shrink-0">
            <svg width="13" height="13" viewBox="0 0 13 13" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><path d="M6.5 2v9M2 6.5h9"/></svg>
            Tambah Bisnis
          </Button></Link>
        ) : (
          <div className="rounded-xl border border-amber-500/20 bg-amber-500/5 px-4 py-2.5 text-sm max-w-xs">
            <p className="font-medium text-amber-600 dark:text-amber-400 mb-0.5 text-xs">Batas akun personal</p>
            <p className="text-xs text-muted-foreground">
              Akun personal hanya 1 bisnis.{' '}
              <Link href={`/dashboard/${allData[0]?.biz.id}/settings`} className="text-violet-500 font-medium hover:underline">Upgrade</Link>
            </p>
          </div>
        )}
      </div>

      {/* Global KPI */}
      {businesses.length > 0 && (
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          {[
            { label: 'Total Pemasukan',  value: totalIncome,  color: 'text-emerald-500', dot: 'bg-emerald-500', sub: 'Semua bisnis' },
            { label: 'Total Pengeluaran',value: totalExpense, color: 'text-rose-500',    dot: 'bg-rose-500',    sub: 'Semua bisnis' },
            { label: 'Laba Bersih',      value: totalNet,     color: totalNet>=0?'text-violet-500':'text-rose-500', dot: totalNet>=0?'bg-violet-500':'bg-rose-500', sub: totalNet>=0?'↑ Positif':'↓ Negatif' },
            { label: 'Total Transaksi',  value: null,         color: 'text-foreground',  dot: 'bg-blue-500',    sub: `${businesses.length} bisnis aktif`, count: totalTxns },
          ].map((kpi) => (
            <div key={kpi.label} className="rounded-2xl border border-border bg-card p-4 lg:p-5">
              <div className="flex items-center gap-1.5 mb-3">
                <div className={`h-1.5 w-1.5 rounded-full ${kpi.dot}`} />
                <p className="text-xs font-medium text-muted-foreground">{kpi.label}</p>
              </div>
              <p className={`text-xl lg:text-2xl font-bold tracking-tight ${kpi.color}`}>
                {kpi.count !== undefined ? kpi.count : `Rp ${Math.abs(kpi.value!).toLocaleString('id-ID')}`}
              </p>
              <p className="text-xs text-muted-foreground mt-1">{kpi.sub}</p>
            </div>
          ))}
        </div>
      )}

      {/* Consolidated chart — hanya jika >1 bisnis */}
      {businesses.length > 1 && (
        <div className="grid lg:grid-cols-3 gap-5">
          <div className="lg:col-span-2 rounded-2xl border border-border bg-card p-5">
            <div className="flex items-center justify-between mb-1">
              <h2 className="text-sm font-semibold text-foreground">Tren Konsolidasi 6 Bulan</h2>
              <span className="text-xs text-muted-foreground bg-muted px-2 py-0.5 rounded-full">Semua bisnis</span>
            </div>
            <p className="text-xs text-muted-foreground mb-5">Pemasukan vs pengeluaran gabungan</p>
            <div className="space-y-3">
              {monthlyEntries.map(([key, val]) => {
                const [year, month] = key.split('-')
                const label = `${MONTH_NAMES[parseInt(month)-1]} ${year}`
                const net = val.income - val.expense
                return (
                  <div key={key}>
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-xs text-muted-foreground w-16">{label}</span>
                      <span className={`text-xs font-semibold ${net>=0?'text-emerald-500':'text-rose-500'}`}>
                        {net>=0?'+':''}Rp {(net/1000).toFixed(0)}k
                      </span>
                    </div>
                    <div className="space-y-1">
                      {[{val:val.income,color:'bg-emerald-500',label:'Rp '+(val.income/1000).toFixed(0)+'k',textColor:'text-emerald-500'},
                        {val:val.expense,color:'bg-rose-400',label:'Rp '+(val.expense/1000).toFixed(0)+'k',textColor:'text-rose-500'}].map((bar,i)=>(
                        <div key={i} className="flex items-center gap-2">
                          <span className={`text-[10px] ${bar.textColor} w-14 text-right shrink-0`}>{bar.label}</span>
                          <div className="flex-1 h-1.5 bg-muted rounded-full overflow-hidden">
                            <div className={`h-full ${bar.color} rounded-full transition-all`} style={{width:`${(bar.val/maxMonthlyVal)*100}%`}}/>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )
              })}
            </div>
          </div>

          <div className="space-y-4">
            <div className="rounded-2xl border border-border bg-card p-4">
              <p className="text-xs font-semibold text-muted-foreground mb-3 uppercase tracking-wider">
                {MONTH_NAMES[now.getMonth()]} {now.getFullYear()}
              </p>
              <div className="space-y-2">
                {[
                  { label: 'Pemasukan',  value: thisMonthData.income,  color: 'text-emerald-500' },
                  { label: 'Pengeluaran',value: thisMonthData.expense, color: 'text-rose-500' },
                ].map((r) => (
                  <div key={r.label} className="flex justify-between items-center">
                    <span className="text-xs text-muted-foreground">{r.label}</span>
                    <span className={`text-sm font-semibold ${r.color}`}>Rp {r.value.toLocaleString('id-ID')}</span>
                  </div>
                ))}
                <div className="h-px bg-border my-1" />
                <div className="flex justify-between items-center">
                  <span className="text-xs font-medium text-foreground">Laba Bersih</span>
                  <span className={`text-sm font-bold ${(thisMonthData.income-thisMonthData.expense)>=0?'text-violet-500':'text-rose-500'}`}>
                    Rp {(thisMonthData.income-thisMonthData.expense).toLocaleString('id-ID')}
                  </span>
                </div>
              </div>
            </div>

            {budgetAlertItems.length > 0 && (
              <div className="rounded-2xl border border-amber-500/20 bg-amber-500/5 p-4">
                <p className="text-xs font-semibold text-amber-600 dark:text-amber-400 mb-3 uppercase tracking-wider">⚠️ Budget Alert</p>
                <div className="space-y-2">
                  {budgetAlertItems.slice(0,4).map((item,i) => (
                    <div key={i} className="flex items-center gap-2">
                      <span className={`h-1.5 w-1.5 rounded-full shrink-0 ${item.status==='over'?'bg-rose-500':'bg-amber-500'}`}/>
                      <p className="text-xs text-muted-foreground truncate flex-1">{item.label}</p>
                      <span className={`text-xs font-semibold shrink-0 ${item.status==='over'?'text-rose-500':'text-amber-500'}`}>{item.pct}%</span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {allActiveGoals.length > 0 && (
              <div className="rounded-2xl border border-border bg-card p-4">
                <p className="text-xs font-semibold text-muted-foreground mb-3 uppercase tracking-wider">🎯 Target Aktif</p>
                <div className="space-y-3">
                  {allActiveGoals.slice(0,3).map((g) => {
                    const pct = Math.min(Math.round((parseFloat(g.currentAmount)/parseFloat(g.targetAmount))*100),100)
                    return (
                      <div key={g.id}>
                        <div className="flex justify-between items-center mb-1">
                          <div className="min-w-0">
                            <p className="text-xs font-medium text-foreground truncate">{g.title}</p>
                            <p className="text-[10px] text-muted-foreground">{g.bizName}</p>
                          </div>
                          <span className="text-xs font-semibold text-violet-500 shrink-0 ml-2">{pct}%</span>
                        </div>
                        <div className="h-1.5 bg-muted rounded-full overflow-hidden">
                          <div className="h-full rounded-full transition-all" style={{width:`${pct}%`,background:'linear-gradient(90deg,#7C3AED,#6366F1)'}}/>
                        </div>
                      </div>
                    )
                  })}
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Business list */}
      {businesses.length === 0 ? (
        <div className="rounded-2xl border-2 border-dashed border-border p-16 text-center">
          <div className="text-5xl mb-4">🏪</div>
          <h2 className="text-xl font-semibold text-foreground mb-2">Belum ada bisnis</h2>
          <p className="text-sm text-muted-foreground mb-6 max-w-sm mx-auto">Buat bisnis pertama Anda untuk mulai mencatat transaksi.</p>
          <Link href="/setup"><Button size="lg">Buat Bisnis Pertama</Button></Link>
        </div>
      ) : (
        <div className="grid gap-4 lg:grid-cols-2">
          {allData.map(({ biz, txns, income, expense }) => {
            const net = income - expense
            const recent = txns.slice(0, 3)
            return (
              <div key={biz.id} className="rounded-2xl border border-border bg-card overflow-hidden hover:border-violet-500/30 hover:shadow-lg hover:shadow-violet-500/5 transition-all duration-200">
                <div className="flex items-center justify-between px-5 py-4 border-b border-border">
                  <div className="flex items-center gap-3">
                    <div className="flex h-10 w-10 items-center justify-center rounded-xl text-xl" style={{background:'linear-gradient(135deg,rgba(124,58,237,0.1),rgba(99,102,241,0.08))'}}>
                      {BUSINESS_ICONS[biz.type]||'🏪'}
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <h2 className="font-semibold text-foreground text-sm">{biz.name}</h2>
                        {(biz as any)._role && (biz as any)._role !== 'owner' && (
                          <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-blue-500/10 text-blue-500 font-medium border border-blue-500/20">
                            {(biz as any)._role === 'admin' ? 'Admin' : 'Viewer'}
                          </span>
                        )}
                      </div>
                      <p className="text-xs text-muted-foreground">{BUSINESS_LABELS[biz.type]||biz.type}</p>
                    </div>
                  </div>
                  <Link href={`/dashboard/${biz.id}`}><Button size="sm" variant="outline" className="text-xs h-7">Buka →</Button></Link>
                </div>

                <div className="grid grid-cols-3 divide-x divide-border">
                  {[
                    { label: 'Pemasukan',  value: income,  color: 'text-emerald-500' },
                    { label: 'Pengeluaran',value: expense, color: 'text-rose-500' },
                    { label: 'Laba',       value: net,     color: net>=0?'text-violet-500':'text-rose-500' },
                  ].map((s) => (
                    <div key={s.label} className="px-4 py-3">
                      <p className="text-[10px] text-muted-foreground mb-0.5">{s.label}</p>
                      <p className={`text-xs font-semibold ${s.color}`}>Rp {s.value.toLocaleString('id-ID')}</p>
                    </div>
                  ))}
                </div>

                <div className="px-5 py-3">
                  <p className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground mb-2">Terbaru</p>
                  {recent.length === 0 ? (
                    <p className="text-xs text-muted-foreground py-1">Belum ada transaksi.</p>
                  ) : (
                    <div className="space-y-1.5">
                      {recent.map((txn) => (
                        <div key={txn.id} className="flex items-center justify-between">
                          <div className="flex items-center gap-2 min-w-0">
                            <span className={`text-xs shrink-0 ${txn.transaction_type==='income'?'text-emerald-500':'text-rose-500'}`}>{txn.transaction_type==='income'?'↑':'↓'}</span>
                            <p className="text-xs text-foreground truncate">{txn.description}</p>
                          </div>
                          <p className={`text-xs font-medium shrink-0 ml-2 ${txn.transaction_type==='income'?'text-emerald-500':'text-rose-500'}`}>
                            {txn.transaction_type==='income'?'+':'-'}Rp {parseFloat(txn.amount).toLocaleString('id-ID')}
                          </p>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                <div className="flex gap-2 px-5 pb-4">
                  {[
                    { href: `/dashboard/${biz.id}/add-expense`, label: '+ Transaksi' },
                    { href: `/dashboard/${biz.id}/reports`,     label: 'Laporan' },
                    { href: `/dashboard/${biz.id}/ai-chat`,     label: 'AI Chat' },
                  ].map((a) => (
                    <Link key={a.href} href={a.href} className="flex-1">
                      <Button variant="outline" size="sm" className="w-full text-xs h-7">{a.label}</Button>
                    </Link>
                  ))}
                </div>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}

const BUSINESS_ICONS: Record<string, string> = {
  florist: '🌸',
  laundry: '🧺',
  cafe: '☕',
  retail: '🛍️',
  other: '🏪',
}

const BUSINESS_LABELS: Record<string, string> = {
  florist: 'Florist',
  laundry: 'Laundry',
  cafe: 'Cafe / Resto',
  retail: 'Toko Retail',
  other: 'Bisnis Lainnya',
}

export default async function DashboardPage() {
  const h = await headers()
  const c = await cookies()
  const cookieString = c.getAll().map((ck) => `${ck.name}=${ck.value}`).join('; ')
  const reqHeaders = new Headers(h as any)
  if (cookieString) reqHeaders.set('cookie', cookieString)
  const session = await auth.api.getSession({ headers: reqHeaders })
  if (!session?.user) redirect('/sign-in')

  const [businesses, currentUser] = await Promise.all([
    getUserBusinesses(),
    getCurrentUser(),
  ])

  const isPersonal = currentUser.accountType === 'personal'
  // Bisnis yang dimiliki (bukan member)
  const ownedBusinesses = businesses.filter((b: any) => b._isOwner)
  const canAddBusiness = !isPersonal || ownedBusinesses.length === 0

  // Personal dengan 1 bisnis (owned) → langsung ke dashboard bisnis
  if (isPersonal && ownedBusinesses.length === 1 && businesses.length === 1) {
    redirect(`/dashboard/${businesses[0].id}`)
  }

  // Aggregate totals across all businesses
  const allData = await Promise.all(
    businesses.map(async (biz) => {
      const txns = await getBusinessTransactions(biz.id)
      const income = txns.filter((t) => t.transaction_type === 'income').reduce((s, t) => s + parseFloat(t.amount), 0)
      const expense = txns.filter((t) => t.transaction_type === 'expense').reduce((s, t) => s + parseFloat(t.amount), 0)
      return { biz, txns, income, expense }
    })
  )

  const totalIncome = allData.reduce((s, d) => s + d.income, 0)
  const totalExpense = allData.reduce((s, d) => s + d.expense, 0)
  const totalTxns = allData.reduce((s, d) => s + d.txns.length, 0)
  const totalNet = totalIncome - totalExpense

  // Konsolidasi: monthly trend 6 bulan terakhir (gabungan semua bisnis)
  const now = new Date()
  const monthlyConsolidated: Record<string, { income: number; expense: number }> = {}
  const MONTH_NAMES = ['Jan', 'Feb', 'Mar', 'Apr', 'Mei', 'Jun', 'Jul', 'Agu', 'Sep', 'Okt', 'Nov', 'Des']
  for (let i = 5; i >= 0; i--) {
    const d = new Date(now.getFullYear(), now.getMonth() - i, 1)
    const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`
    monthlyConsolidated[key] = { income: 0, expense: 0 }
  }
  allData.forEach(({ txns }) => {
    txns.forEach((t) => {
      const d = new Date(t.createdAt)
      const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`
      if (monthlyConsolidated[key]) {
        if (t.transaction_type === 'income') monthlyConsolidated[key].income += parseFloat(t.amount)
        else monthlyConsolidated[key].expense += parseFloat(t.amount)
      }
    })
  })
  const monthlyEntries = Object.entries(monthlyConsolidated)
  const maxMonthlyVal = Math.max(...monthlyEntries.flatMap(([, v]) => [v.income, v.expense]), 1)

  // Bulan ini konsolidasi
  const thisMonthKey = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`
  const thisMonthData = monthlyConsolidated[thisMonthKey] || { income: 0, expense: 0 }

  // Goals & budget konsolidasi (semua bisnis owned)
  const goalsData = await Promise.all(
    ownedBusinesses.map(async (biz) => {
      const [goals, budgets] = await Promise.all([
        getGoals(biz.id).catch(() => []),
        getBudgets(biz.id).catch(() => []),
      ])
      return { biz, goals, budgets }
    })
  )
  const allActiveGoals = goalsData.flatMap(({ biz, goals }) =>
    goals.filter((g) => !g.completed).map((g) => ({ ...g, bizName: biz.name }))
  )
  const allBudgets = goalsData.flatMap(({ biz, budgets }) =>
    budgets.map((b) => ({ ...b, bizName: biz.name }))
  )

  // Hitung pengeluaran bulan ini per bisnis per kategori untuk budget check
  const budgetAlertItems: { label: string; pct: number; status: 'over' | 'near' }[] = []
  goalsData.forEach(({ biz, budgets }) => {
    const bizData = allData.find((d) => d.biz.id === biz.id)
    if (!bizData) return
    const monthTxns = bizData.txns.filter((t) => {
      const d = new Date(t.createdAt)
      return t.transaction_type === 'expense' &&
        d.getMonth() === now.getMonth() && d.getFullYear() === now.getFullYear()
    })
    const spentByCategory: Record<string, number> = {}
    monthTxns.forEach((t) => {
      const cat = t.categoryId || 'other'
      spentByCategory[cat] = (spentByCategory[cat] || 0) + parseFloat(t.amount)
    })
    budgets.forEach((b) => {
      const spent = spentByCategory[b.category] || 0
      const budgetAmt = parseFloat(b.amount)
      const pct = Math.round((spent / budgetAmt) * 100)
      if (pct > 100) budgetAlertItems.push({ label: `${biz.name} · ${b.category}`, pct, status: 'over' })
      else if (pct >= 80) budgetAlertItems.push({ label: `${biz.name} · ${b.category}`, pct, status: 'near' })
    })
  })

  return (
    <div className="p-8">
      {/* Header */}
      <div className="mb-8 flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
        <div>
          <p className="text-sm text-muted-foreground mb-1">
            Selamat datang kembali 👋
          </p>
          <h1 className="text-3xl font-bold text-foreground">Semua Bisnis</h1>
          <p className="text-muted-foreground mt-1">
            Ringkasan keuangan seluruh bisnis Anda
            {isPersonal && (
              <span className="ml-2 inline-flex items-center rounded-full bg-muted px-2 py-0.5 text-xs font-medium text-muted-foreground">
                Akun Personal
              </span>
            )}
          </p>
        </div>
        {canAddBusiness ? (
          <Link href="/setup">
            <Button className="shrink-0">+ Tambah Bisnis</Button>
          </Link>
        ) : (
          <div className="rounded-xl border border-amber-200 bg-amber-50 px-4 py-2.5 text-sm text-amber-800 max-w-xs">
            <p className="font-medium mb-0.5">Batas akun personal</p>
            <p className="text-xs text-amber-700">
              Akun personal hanya dapat memiliki 1 bisnis.{' '}
              <Link href={`/dashboard/${allData[0]?.biz.id}/settings`} className="underline font-medium">
                Upgrade ke Bisnis
              </Link>{' '}
              untuk menambah lebih banyak.
            </p>
          </div>
        )}
      </div>

      {/* Global summary cards */}
      {businesses.length > 0 && (
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-8">
          <div className="rounded-2xl border border-border bg-card p-5">
            <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-2">Total Pemasukan</p>
            <p className="text-2xl font-bold text-emerald-600">Rp {totalIncome.toLocaleString('id-ID')}</p>
            <p className="text-xs text-muted-foreground mt-1">Semua bisnis</p>
          </div>
          <div className="rounded-2xl border border-border bg-card p-5">
            <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-2">Total Pengeluaran</p>
            <p className="text-2xl font-bold text-rose-500">Rp {totalExpense.toLocaleString('id-ID')}</p>
            <p className="text-xs text-muted-foreground mt-1">Semua bisnis</p>
          </div>
          <div className="rounded-2xl border border-border bg-card p-5">
            <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-2">Laba Bersih</p>
            <p className={`text-2xl font-bold ${totalNet >= 0 ? 'text-primary' : 'text-rose-500'}`}>
              Rp {totalNet.toLocaleString('id-ID')}
            </p>
            <p className={`text-xs mt-1 ${totalNet >= 0 ? 'text-emerald-600' : 'text-rose-500'}`}>
              {totalNet >= 0 ? '↑ Positif' : '↓ Negatif'}
            </p>
          </div>
          <div className="rounded-2xl border border-border bg-card p-5">
            <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-2">Total Transaksi</p>
            <p className="text-2xl font-bold text-foreground">{totalTxns}</p>
            <p className="text-xs text-muted-foreground mt-1">{businesses.length} bisnis aktif</p>
          </div>
        </div>
      )}

      {/* Consolidated report — hanya tampil jika ada lebih dari 1 bisnis */}
      {businesses.length > 1 && (
        <div className="mb-8 grid lg:grid-cols-3 gap-5">
          {/* Monthly trend chart */}
          <div className="lg:col-span-2 rounded-2xl border border-border bg-card p-6">
            <div className="flex items-center justify-between mb-1">
              <h2 className="font-semibold text-foreground">Tren Konsolidasi 6 Bulan</h2>
              <span className="text-xs text-muted-foreground bg-muted px-2 py-1 rounded-full">Semua bisnis</span>
            </div>
            <p className="text-xs text-muted-foreground mb-5">Pemasukan vs pengeluaran gabungan</p>
            <div className="space-y-3">
              {monthlyEntries.map(([key, val]) => {
                const [year, month] = key.split('-')
                const label = `${MONTH_NAMES[parseInt(month) - 1]} ${year}`
                const net = val.income - val.expense
                return (
                  <div key={key}>
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-xs text-muted-foreground w-16">{label}</span>
                      <span className={`text-xs font-semibold ${net >= 0 ? 'text-emerald-600' : 'text-rose-500'}`}>
                        {net >= 0 ? '+' : ''}Rp {(net / 1000).toFixed(0)}k
                      </span>
                    </div>
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <span className="text-[10px] text-emerald-600 w-14 text-right shrink-0">
                          Rp {(val.income / 1000).toFixed(0)}k
                        </span>
                        <div className="flex-1 h-2 bg-muted rounded-full overflow-hidden">
                          <div
                            className="h-full bg-emerald-500 rounded-full transition-all"
                            style={{ width: `${(val.income / maxMonthlyVal) * 100}%` }}
                          />
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="text-[10px] text-rose-500 w-14 text-right shrink-0">
                          Rp {(val.expense / 1000).toFixed(0)}k
                        </span>
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

          {/* Right column: bulan ini + goals + budget alerts */}
          <div className="space-y-4">
            {/* Bulan ini */}
            <div className="rounded-2xl border border-border bg-card p-5">
              <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-3">
                {MONTH_NAMES[now.getMonth()]} {now.getFullYear()} — Semua Bisnis
              </p>
              <div className="space-y-2">
                <div className="flex justify-between items-center">
                  <span className="text-sm text-muted-foreground">Pemasukan</span>
                  <span className="text-sm font-semibold text-emerald-600">
                    Rp {thisMonthData.income.toLocaleString('id-ID')}
                  </span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm text-muted-foreground">Pengeluaran</span>
                  <span className="text-sm font-semibold text-rose-500">
                    Rp {thisMonthData.expense.toLocaleString('id-ID')}
                  </span>
                </div>
                <div className="h-px bg-border my-1" />
                <div className="flex justify-between items-center">
                  <span className="text-sm font-medium text-foreground">Laba Bersih</span>
                  <span className={`text-sm font-bold ${(thisMonthData.income - thisMonthData.expense) >= 0 ? 'text-primary' : 'text-rose-500'}`}>
                    Rp {(thisMonthData.income - thisMonthData.expense).toLocaleString('id-ID')}
                  </span>
                </div>
              </div>
            </div>

            {/* Budget alerts konsolidasi */}
            {budgetAlertItems.length > 0 && (
              <div className="rounded-2xl border border-amber-200 bg-amber-50 dark:bg-amber-950/20 dark:border-amber-800 p-5">
                <p className="text-xs font-semibold uppercase tracking-wider text-amber-700 dark:text-amber-400 mb-3">
                  ⚠️ Peringatan Budget
                </p>
                <div className="space-y-2">
                  {budgetAlertItems.slice(0, 4).map((item, i) => (
                    <div key={i} className="flex items-center gap-2">
                      <span className="text-sm shrink-0">{item.status === 'over' ? '🔴' : '🟡'}</span>
                      <div className="flex-1 min-w-0">
                        <p className="text-xs text-amber-800 dark:text-amber-300 truncate">{item.label}</p>
                        <div className="h-1.5 bg-amber-200 dark:bg-amber-900 rounded-full mt-1 overflow-hidden">
                          <div
                            className={`h-full rounded-full ${item.status === 'over' ? 'bg-rose-500' : 'bg-amber-400'}`}
                            style={{ width: `${Math.min(item.pct, 100)}%` }}
                          />
                        </div>
                      </div>
                      <span className="text-xs font-semibold text-amber-700 dark:text-amber-400 shrink-0">{item.pct}%</span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Active goals konsolidasi */}
            {allActiveGoals.length > 0 && (
              <div className="rounded-2xl border border-border bg-card p-5">
                <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-3">
                  🎯 Target Aktif
                </p>
                <div className="space-y-3">
                  {allActiveGoals.slice(0, 3).map((g) => {
                    const pct = Math.min(
                      Math.round((parseFloat(g.currentAmount) / parseFloat(g.targetAmount)) * 100),
                      100
                    )
                    return (
                      <div key={g.id}>
                        <div className="flex justify-between items-center mb-1">
                          <div className="min-w-0">
                            <p className="text-xs font-medium text-foreground truncate">{g.title}</p>
                            <p className="text-[10px] text-muted-foreground">{g.bizName}</p>
                          </div>
                          <span className="text-xs font-semibold text-primary shrink-0 ml-2">{pct}%</span>
                        </div>
                        <div className="h-1.5 bg-muted rounded-full overflow-hidden">
                          <div
                            className="h-full bg-primary rounded-full transition-all"
                            style={{ width: `${pct}%` }}
                          />
                        </div>
                      </div>
                    )
                  })}
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Business list */}
      {businesses.length === 0 ? (
        <div className="rounded-2xl border-2 border-dashed border-border p-16 text-center">
          <div className="text-5xl mb-4">🏪</div>
          <h2 className="text-xl font-semibold text-foreground mb-2">Belum ada bisnis</h2>
          <p className="text-muted-foreground mb-6 max-w-sm mx-auto">
            Buat bisnis pertama Anda untuk mulai mencatat transaksi dan melihat laporan keuangan.
          </p>
          <Link href="/setup">
            <Button size="lg">Buat Bisnis Pertama</Button>
          </Link>
        </div>
      ) : (
        <div className="grid gap-5 lg:grid-cols-2">
          {allData.map(({ biz, txns, income, expense }) => {
            const net = income - expense
            const recent = txns.slice(0, 3)
            return (
              <div key={biz.id} className="rounded-2xl border border-border bg-card overflow-hidden hover:border-primary/40 hover:shadow-lg hover:shadow-primary/5 transition-all duration-200">
                {/* Card header */}
                <div className="flex items-center justify-between px-6 py-4 border-b border-border">
                  <div className="flex items-center gap-3">
                    <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary/10 text-xl">
                      {BUSINESS_ICONS[biz.type] || '🏪'}
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <h2 className="font-semibold text-foreground">{biz.name}</h2>
                        {(biz as any)._role && (biz as any)._role !== 'owner' && (
                          <span className="text-xs px-2 py-0.5 rounded-full bg-blue-100 text-blue-700 font-medium">
                            {(biz as any)._role === 'admin' ? 'Admin' : 'Viewer'}
                          </span>
                        )}
                      </div>
                      <p className="text-xs text-muted-foreground">{BUSINESS_LABELS[biz.type] || biz.type}</p>
                    </div>
                  </div>
                  <Link href={`/dashboard/${biz.id}`}>
                    <Button size="sm" variant="outline">Buka →</Button>
                  </Link>
                </div>

                {/* Stats */}
                <div className="grid grid-cols-3 divide-x divide-border">
                  <div className="px-4 py-3">
                    <p className="text-xs text-muted-foreground mb-0.5">Pemasukan</p>
                    <p className="text-sm font-semibold text-emerald-600">
                      Rp {income.toLocaleString('id-ID')}
                    </p>
                  </div>
                  <div className="px-4 py-3">
                    <p className="text-xs text-muted-foreground mb-0.5">Pengeluaran</p>
                    <p className="text-sm font-semibold text-rose-500">
                      Rp {expense.toLocaleString('id-ID')}
                    </p>
                  </div>
                  <div className="px-4 py-3">
                    <p className="text-xs text-muted-foreground mb-0.5">Laba Bersih</p>
                    <p className={`text-sm font-semibold ${net >= 0 ? 'text-primary' : 'text-rose-500'}`}>
                      Rp {net.toLocaleString('id-ID')}
                    </p>
                  </div>
                </div>

                {/* Recent transactions */}
                <div className="px-6 py-4">
                  <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-3">
                    Transaksi Terbaru
                  </p>
                  {recent.length === 0 ? (
                    <p className="text-sm text-muted-foreground py-2">Belum ada transaksi.</p>
                  ) : (
                    <div className="space-y-2">
                      {recent.map((txn) => (
                        <div key={txn.id} className="flex items-center justify-between">
                          <div className="flex items-center gap-2 min-w-0">
                            <span className="text-xs">{txn.transaction_type === 'income' ? '↑' : '↓'}</span>
                            <p className="text-sm text-foreground truncate">{txn.description}</p>
                          </div>
                          <p className={`text-sm font-medium shrink-0 ml-2 ${txn.transaction_type === 'income' ? 'text-emerald-600' : 'text-rose-500'}`}>
                            {txn.transaction_type === 'income' ? '+' : '-'}Rp {parseFloat(txn.amount).toLocaleString('id-ID')}
                          </p>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                {/* Quick actions */}
                <div className="flex gap-2 px-6 pb-4">
                  <Link href={`/dashboard/${biz.id}/add-expense`} className="flex-1">
                    <Button variant="outline" size="sm" className="w-full text-xs">+ Transaksi</Button>
                  </Link>
                  <Link href={`/dashboard/${biz.id}/reports`} className="flex-1">
                    <Button variant="outline" size="sm" className="w-full text-xs">Laporan</Button>
                  </Link>
                  <Link href={`/dashboard/${biz.id}/ai-chat`} className="flex-1">
                    <Button variant="outline" size="sm" className="w-full text-xs">AI Chat</Button>
                  </Link>
                </div>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
