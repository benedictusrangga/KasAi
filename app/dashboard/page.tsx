import { auth } from '@/lib/auth'
import { getUserBusinesses, getCurrentUser } from '@/app/actions/business'
import { getBusinessTransactions } from '@/app/actions/transaction'
import { headers, cookies } from 'next/headers'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'

export const metadata = {
  title: 'Dashboard — KasAI',
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
  const canAddBusiness = !isPersonal || businesses.length === 0

  // Personal dengan 1 bisnis → langsung ke dashboard bisnis
  if (isPersonal && businesses.length === 1) {
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
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-8">
          <div className="rounded-2xl border border-border bg-card p-5">
            <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-2">Total Pemasukan</p>
            <p className="text-2xl font-bold text-emerald-600">
              Rp {totalIncome.toLocaleString('id-ID')}
            </p>
            <p className="text-xs text-muted-foreground mt-1">Semua bisnis</p>
          </div>
          <div className="rounded-2xl border border-border bg-card p-5">
            <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-2">Total Pengeluaran</p>
            <p className="text-2xl font-bold text-rose-500">
              Rp {totalExpense.toLocaleString('id-ID')}
            </p>
            <p className="text-xs text-muted-foreground mt-1">Semua bisnis</p>
          </div>
          <div className="rounded-2xl border border-border bg-card p-5">
            <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-2">Total Transaksi</p>
            <p className="text-2xl font-bold text-foreground">{totalTxns}</p>
            <p className="text-xs text-muted-foreground mt-1">Semua bisnis</p>
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
                      <h2 className="font-semibold text-foreground">{biz.name}</h2>
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
