'use client'

import { use, useState, useEffect } from 'react'
import { getTransactions } from '@/app/actions/transaction'
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

const CATEGORY_LABELS: Record<string, string> = {
  groceries: 'Bahan Makanan',
  transportation: 'Transportasi',
  utilities: 'Utilitas',
  entertainment: 'Hiburan',
  dining: 'Makan & Minum',
  shopping: 'Belanja',
  healthcare: 'Kesehatan',
  education: 'Pendidikan',
  office_supplies: 'Perlengkapan Kantor',
  other: 'Lainnya',
}

export default function TransactionsPage({ params }: { params: Promise<{ businessId: string }> }) {
  const { businessId } = use(params)
  const [transactions, setTransactions] = useState<any[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [filterType, setFilterType] = useState('all')

  useEffect(() => {
    getTransactions(businessId)
      .then(setTransactions)
      .catch(console.error)
      .finally(() => setIsLoading(false))
  }, [businessId])

  const filtered = transactions.filter((t) => {
    const matchSearch =
      t.description?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      t.notes?.toLowerCase().includes(searchTerm.toLowerCase())
    const matchType = filterType === 'all' || t.transaction_type === filterType
    return matchSearch && matchType
  })

  const totalIncome = filtered.filter((t) => t.transaction_type === 'income').reduce((s, t) => s + parseFloat(t.amount), 0)
  const totalExpense = filtered.filter((t) => t.transaction_type === 'expense').reduce((s, t) => s + parseFloat(t.amount), 0)

  return (
    <div className="p-8">
      {/* Header */}
      <div className="mb-8 flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Transaksi</h1>
          <p className="text-muted-foreground mt-1">
            Semua pemasukan dan pengeluaran bisnis Anda
          </p>
        </div>
        <Link href={`/dashboard/${businessId}/add-expense`}>
          <Button>+ Tambah Transaksi</Button>
        </Link>
      </div>

      {/* Summary */}
      {!isLoading && transactions.length > 0 && (
        <div className="grid grid-cols-3 gap-4 mb-6">
          <div className="rounded-xl border border-border bg-card px-4 py-3">
            <p className="text-xs text-muted-foreground">Pemasukan (filter)</p>
            <p className="text-lg font-bold text-emerald-600">Rp {totalIncome.toLocaleString('id-ID')}</p>
          </div>
          <div className="rounded-xl border border-border bg-card px-4 py-3">
            <p className="text-xs text-muted-foreground">Pengeluaran (filter)</p>
            <p className="text-lg font-bold text-rose-500">Rp {totalExpense.toLocaleString('id-ID')}</p>
          </div>
          <div className="rounded-xl border border-border bg-card px-4 py-3">
            <p className="text-xs text-muted-foreground">Ditampilkan</p>
            <p className="text-lg font-bold text-foreground">{filtered.length} transaksi</p>
          </div>
        </div>
      )}

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-3 mb-6">
        <Input
          placeholder="Cari transaksi..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="max-w-xs"
        />
        <div className="flex gap-2">
          {(['all', 'income', 'expense'] as const).map((type) => (
            <button
              key={type}
              onClick={() => setFilterType(type)}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                filterType === type
                  ? 'bg-primary text-primary-foreground'
                  : 'bg-muted text-muted-foreground hover:bg-accent hover:text-accent-foreground'
              }`}
            >
              {type === 'all' ? 'Semua' : type === 'income' ? 'Pemasukan' : 'Pengeluaran'}
            </button>
          ))}
        </div>
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
            {searchTerm || filterType !== 'all' ? 'Coba ubah filter pencarian.' : 'Mulai catat transaksi pertama Anda.'}
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
            {filtered.map((txn) => (
              <div key={txn.id} className="flex items-center justify-between px-6 py-4 hover:bg-muted/30 transition-colors">
                <div className="flex items-center gap-4 min-w-0">
                  <div className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-sm ${
                    txn.transaction_type === 'income'
                      ? 'bg-emerald-100 text-emerald-700'
                      : 'bg-rose-100 text-rose-700'
                  }`}>
                    {txn.transaction_type === 'income' ? '↑' : '↓'}
                  </div>
                  <div className="min-w-0">
                    <p className="text-sm font-medium text-foreground truncate">{txn.description}</p>
                    <div className="flex items-center gap-2 mt-0.5">
                      <span className="text-xs text-muted-foreground">
                        {SOURCE_ICONS[txn.source]} {new Date(txn.createdAt).toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' })}
                      </span>
                      {txn.categoryId && (
                        <Badge variant="secondary" className="text-xs py-0 h-4">
                          {CATEGORY_LABELS[txn.categoryId] || txn.categoryId}
                        </Badge>
                      )}
                    </div>
                    {txn.notes && (
                      <p className="text-xs text-muted-foreground mt-0.5 truncate">{txn.notes}</p>
                    )}
                  </div>
                </div>
                <p className={`text-sm font-semibold shrink-0 ml-4 ${
                  txn.transaction_type === 'income' ? 'text-emerald-600' : 'text-rose-500'
                }`}>
                  {txn.transaction_type === 'income' ? '+' : '-'}Rp {parseFloat(txn.amount).toLocaleString('id-ID')}
                </p>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
