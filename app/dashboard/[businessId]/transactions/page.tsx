'use client'

import { use, useState, useEffect } from 'react'
import { getTransactions } from '@/app/actions/transaction'
import { getBusinessCategories } from '@/app/actions/business'
import { getBusinessMembers } from '@/app/actions/members'
import { getCurrentUserInfo } from '@/app/actions/comments'
import TransactionComments from '@/components/transaction-comments'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'

const SOURCE_ICONS: Record<string, string> = {
  manual: '✍️',
  telegram: '💬',
  voice_note: '🎙️',
  receipt_image: '📷',
  api: '🔌',
}

type Category = {
  id: string
  name: string
  type: string
  icon?: string | null
}

export default function TransactionsPage({ params }: { params: Promise<{ businessId: string }> }) {
  const { businessId } = use(params)
  const [transactions, setTransactions] = useState<any[]>([])
  const [categories, setCategories] = useState<Category[]>([])
  const [memberMap, setMemberMap] = useState<Record<string, string>>({})
  const [currentUserId, setCurrentUserId] = useState<string>('')
  const [isOwner, setIsOwner] = useState(false)
  const [isLoading, setIsLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [filterType, setFilterType] = useState('all')
  const [filterMember, setFilterMember] = useState('all')

  useEffect(() => {
    Promise.all([
      getTransactions(businessId),
      getBusinessCategories(businessId).catch(() => []),
      getBusinessMembers(businessId).catch(() => []),
      getCurrentUserInfo(businessId).catch(() => null),
    ])
      .then(([txns, cats, members, userInfo]) => {
        setTransactions(txns)
        setCategories(cats)
        // Build map: userId → display name
        const map: Record<string, string> = {}
        members.forEach((m: any) => {
          if (m.userId) {
            map[m.userId] = m.user?.name || m.email
          }
        })
        setMemberMap(map)
        if (userInfo) {
          setCurrentUserId(userInfo.userId)
          setIsOwner(userInfo.isOwner)
        }
      })
      .catch(console.error)
      .finally(() => setIsLoading(false))
  }, [businessId])

  // Map categoryId (UUID) → nama kategori
  const categoryMap = categories.reduce<Record<string, string>>((acc, cat) => {
    acc[cat.id] = cat.icon ? `${cat.icon} ${cat.name}` : cat.name
    return acc
  }, {})

  // Unique inputters for filter dropdown
  const uniqueInputters = Array.from(
    new Set(transactions.map((t) => t.inputByUserId).filter(Boolean))
  )

  const filtered = transactions.filter((t) => {
    const matchSearch =
      t.description?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      t.notes?.toLowerCase().includes(searchTerm.toLowerCase())
    const matchType = filterType === 'all' || t.transaction_type === filterType
    const matchMember = filterMember === 'all' || t.inputByUserId === filterMember
    return matchSearch && matchType && matchMember
  })

  const totalIncome = filtered
    .filter((t) => t.transaction_type === 'income')
    .reduce((s, t) => s + parseFloat(t.amount), 0)
  const totalExpense = filtered
    .filter((t) => t.transaction_type === 'expense')
    .reduce((s, t) => s + parseFloat(t.amount), 0)

  return (
    <div className="p-6 lg:p-8">
      {/* Header */}
      <div className="mb-6 flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground tracking-tight">Transaksi</h1>
          <p className="text-sm text-muted-foreground mt-0.5">
            Semua pemasukan dan pengeluaran bisnis Anda
          </p>
        </div>
        <Link href={`/dashboard/${businessId}/add-expense`}>
          <Button size="sm" className="gap-1.5">
            <svg width="13" height="13" viewBox="0 0 13 13" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><path d="M6.5 2v9M2 6.5h9"/></svg>
            Tambah Transaksi
          </Button>
        </Link>
      </div>

      {/* Summary */}
      {!isLoading && transactions.length > 0 && (
        <div className="grid grid-cols-3 gap-3 mb-5">
          {[
            { label: 'Pemasukan (filter)', value: totalIncome,  color: 'text-emerald-500', dot: 'bg-emerald-500' },
            { label: 'Pengeluaran (filter)',value: totalExpense, color: 'text-rose-500',    dot: 'bg-rose-500' },
            { label: 'Ditampilkan',         value: null,        color: 'text-foreground',  dot: 'bg-blue-500', count: filtered.length },
          ].map((s) => (
            <div key={s.label} className="rounded-2xl border border-border bg-card px-4 py-3">
              <div className="flex items-center gap-1.5 mb-1.5">
                <div className={`h-1.5 w-1.5 rounded-full ${s.dot}`} />
                <p className="text-xs text-muted-foreground">{s.label}</p>
              </div>
              <p className={`text-base font-bold ${s.color}`}>
                {s.count !== undefined ? `${s.count} transaksi` : `Rp ${s.value!.toLocaleString('id-ID')}`}
              </p>
            </div>
          ))}
        </div>
      )}

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-2 mb-5 flex-wrap">
        <Input
          placeholder="Cari transaksi..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="max-w-xs h-9 text-sm"
        />
        <div className="flex gap-1.5 flex-wrap">
          {(['all', 'income', 'expense'] as const).map((type) => (
            <button
              key={type}
              onClick={() => setFilterType(type)}
              className={`px-3 py-1.5 rounded-xl text-xs font-medium transition-all duration-150 ${
                filterType === type
                  ? 'text-white shadow-sm'
                  : 'bg-muted text-muted-foreground hover:bg-accent hover:text-accent-foreground'
              }`}
              style={filterType === type ? { background: 'linear-gradient(135deg, #7C3AED, #6366F1)' } : {}}
            >
              {type === 'all' ? 'Semua' : type === 'income' ? 'Pemasukan' : 'Pengeluaran'}
            </button>
          ))}
        </div>
        {uniqueInputters.length > 1 && (
          <select
            value={filterMember}
            onChange={(e) => setFilterMember(e.target.value)}
            className="px-3 py-1.5 rounded-xl text-xs border border-border bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-primary h-9"
          >
            <option value="all">Semua anggota</option>
            {uniqueInputters.map((uid) => (
              <option key={uid} value={uid}>{memberMap[uid] || uid}</option>
            ))}
          </select>
        )}
      </div>

      {/* List */}
      {isLoading ? (
        <div className="rounded-2xl border border-border bg-card p-12 text-center">
          <div className="text-2xl mb-2">⏳</div>
          <p className="text-muted-foreground">Memuat transaksi...</p>
        </div>
      ) : filtered.length === 0 ? (
        <div className="rounded-2xl border-2 border-dashed border-border p-12 text-center">
          <div className="text-4xl mb-3">📭</div>
          <p className="text-foreground font-medium mb-1">Tidak ada transaksi</p>
          <p className="text-muted-foreground text-sm mb-4">
            {searchTerm || filterType !== 'all'
              ? 'Coba ubah filter pencarian.'
              : 'Mulai catat transaksi pertama Anda.'}
          </p>
          {!searchTerm && filterType === 'all' && (
            <Link href={`/dashboard/${businessId}/add-expense`}>
              <Button size="sm">Tambah Transaksi</Button>
            </Link>
          )}
        </div>
      ) : (
        <div className="rounded-2xl border border-border bg-card overflow-hidden">
          <div className="divide-y divide-border">
            {filtered.map((txn) => {
              const inputterName = txn.inputByUserId
                ? memberMap[txn.inputByUserId] || null
                : null

              return (
                <div
                  key={txn.id}
                  className="flex items-center justify-between px-6 py-4 hover:bg-muted/30 transition-colors"
                >
                  <div className="flex items-center gap-4 min-w-0">
                    <div
                      className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-sm ${
                        txn.transaction_type === 'income'
                          ? 'bg-emerald-100 text-emerald-700'
                          : 'bg-rose-100 text-rose-700'
                      }`}
                    >
                      {txn.transaction_type === 'income' ? '↑' : '↓'}
                    </div>
                    <div className="min-w-0">
                      <p className="text-sm font-medium text-foreground truncate">
                        {txn.description}
                      </p>
                      <div className="flex items-center gap-2 mt-0.5 flex-wrap">
                        <span className="text-xs text-muted-foreground">
                          {SOURCE_ICONS[txn.source]}{' '}
                          {new Date(txn.createdAt).toLocaleDateString('id-ID', {
                            day: 'numeric',
                            month: 'short',
                            year: 'numeric',
                          })}
                        </span>
                        {txn.categoryId && categoryMap[txn.categoryId] && (
                          <Badge variant="secondary" className="text-xs py-0 h-4">
                            {categoryMap[txn.categoryId]}
                          </Badge>
                        )}
                        {/* Badge "dicatat oleh" jika ada member yang input */}
                        {inputterName && (
                          <Badge variant="outline" className="text-xs py-0 h-4 text-blue-600 border-blue-200">
                            👤 {inputterName}
                          </Badge>
                        )}
                      </div>
                      {txn.notes && (
                        <p className="text-xs text-muted-foreground mt-0.5 truncate">
                          {txn.notes}
                        </p>
                      )}
                      {/* Komentar per transaksi */}
                      {currentUserId && (
                        <TransactionComments
                          businessId={businessId}
                          transactionId={txn.id}
                          transactionDesc={txn.description}
                          currentUserId={currentUserId}
                          isOwner={isOwner}
                        />
                      )}
                    </div>
                  </div>
                  <p
                    className={`text-sm font-semibold shrink-0 ml-4 ${
                      txn.transaction_type === 'income' ? 'text-emerald-600' : 'text-rose-500'
                    }`}
                  >
                    {txn.transaction_type === 'income' ? '+' : '-'}Rp{' '}
                    {parseFloat(txn.amount).toLocaleString('id-ID')}
                  </p>
                </div>
              )
            })}
          </div>
        </div>
      )}
    </div>
  )
}

