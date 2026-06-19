'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import {
  createPayable,
  updatePayablePayment,
  deletePayable,
  createReceivable,
  updateReceivablePayment,
  deleteReceivable,
} from '@/app/actions/payables'

type DebtItem = {
  id: string
  contactName: string
  contactPhone?: string | null
  amount: string
  paidAmount: string
  description: string
  dueDate?: Date | null
  status: string
  notes?: string | null
  createdAt: Date
}

type Props = {
  businessId: string
  payables: DebtItem[]
  receivables: DebtItem[]
}

function statusBadge(status: string) {
  if (status === 'paid') return <Badge className="bg-emerald-100 text-emerald-700 border-emerald-200">✓ Lunas</Badge>
  if (status === 'partial') return <Badge className="bg-amber-100 text-amber-700 border-amber-200">◑ Sebagian</Badge>
  return <Badge className="bg-rose-100 text-rose-700 border-rose-200">✗ Belum Bayar</Badge>
}

function isDueSoon(dueDate: Date | null | undefined): boolean {
  if (!dueDate) return false
  const diff = new Date(dueDate).getTime() - Date.now()
  return diff > 0 && diff < 3 * 24 * 60 * 60 * 1000 // 3 hari
}

function isOverdue(dueDate: Date | null | undefined): boolean {
  if (!dueDate) return false
  return new Date(dueDate).getTime() < Date.now()
}

function DebtForm({
  type,
  businessId,
  onDone,
}: {
  type: 'payable' | 'receivable'
  businessId: string
  onDone: () => void
}) {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [form, setForm] = useState({
    contactName: '',
    contactPhone: '',
    amount: '',
    description: '',
    dueDate: '',
    notes: '',
  })

  const label = type === 'payable' ? 'Hutang' : 'Piutang'
  const contactLabel = type === 'payable' ? 'Nama Kreditur (siapa yang Anda hutangi)' : 'Nama Debitur (siapa yang berhutang ke Anda)'

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!form.contactName.trim()) { setError('Nama kontak diperlukan'); return }
    const amount = parseFloat(form.amount)
    if (!amount || amount <= 0) { setError('Jumlah harus lebih dari 0'); return }
    if (!form.description.trim()) { setError('Keterangan diperlukan'); return }

    setLoading(true)
    setError(null)
    try {
      const data = {
        businessId,
        contactName: form.contactName.trim(),
        contactPhone: form.contactPhone.trim() || undefined,
        amount,
        description: form.description.trim(),
        dueDate: form.dueDate ? new Date(form.dueDate) : undefined,
        notes: form.notes.trim() || undefined,
      }
      if (type === 'payable') await createPayable(data)
      else await createReceivable(data)
      router.refresh()
      onDone()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Gagal menyimpan')
    } finally {
      setLoading(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="space-y-1.5">
        <Label>{contactLabel} *</Label>
        <Input
          placeholder={type === 'payable' ? 'Contoh: Supplier Pak Budi' : 'Contoh: Customer Bu Sari'}
          value={form.contactName}
          onChange={(e) => setForm({ ...form, contactName: e.target.value })}
          className="h-10"
        />
      </div>
      <div className="grid grid-cols-2 gap-3">
        <div className="space-y-1.5">
          <Label>No. HP (Opsional)</Label>
          <Input
            placeholder="+62812..."
            value={form.contactPhone}
            onChange={(e) => setForm({ ...form, contactPhone: e.target.value })}
            className="h-10"
          />
        </div>
        <div className="space-y-1.5">
          <Label>Jumlah (Rp) *</Label>
          <Input
            type="number"
            placeholder="500000"
            value={form.amount}
            onChange={(e) => setForm({ ...form, amount: e.target.value })}
            className="h-10"
          />
        </div>
      </div>
      <div className="space-y-1.5">
        <Label>Keterangan *</Label>
        <Input
          placeholder={type === 'payable' ? 'Contoh: Pembelian bahan baku Maret' : 'Contoh: Penjualan kredit ke warung Pak RT'}
          value={form.description}
          onChange={(e) => setForm({ ...form, description: e.target.value })}
          className="h-10"
        />
      </div>
      <div className="grid grid-cols-2 gap-3">
        <div className="space-y-1.5">
          <Label>Jatuh Tempo (Opsional)</Label>
          <Input
            type="date"
            value={form.dueDate}
            onChange={(e) => setForm({ ...form, dueDate: e.target.value })}
            className="h-10"
          />
        </div>
        <div className="space-y-1.5">
          <Label>Catatan (Opsional)</Label>
          <Input
            placeholder="Info tambahan..."
            value={form.notes}
            onChange={(e) => setForm({ ...form, notes: e.target.value })}
            className="h-10"
          />
        </div>
      </div>
      {error && <p className="text-sm text-destructive">{error}</p>}
      <div className="flex gap-2">
        <Button type="submit" disabled={loading} size="sm">
          {loading ? 'Menyimpan...' : `Tambah ${label}`}
        </Button>
        <Button type="button" variant="outline" size="sm" onClick={onDone}>
          Batal
        </Button>
      </div>
    </form>
  )
}

function PaymentModal({
  item,
  type,
  onClose,
}: {
  item: DebtItem
  type: 'payable' | 'receivable'
  onClose: () => void
}) {
  const router = useRouter()
  const [amount, setAmount] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const remaining = parseFloat(item.amount) - parseFloat(item.paidAmount)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    const pay = parseFloat(amount)
    if (!pay || pay <= 0) { setError('Jumlah harus lebih dari 0'); return }
    if (pay > remaining) { setError(`Maksimal Rp ${remaining.toLocaleString('id-ID')}`); return }

    setLoading(true)
    setError(null)
    try {
      const newPaid = parseFloat(item.paidAmount) + pay
      if (type === 'payable') await updatePayablePayment(item.id, newPaid)
      else await updateReceivablePayment(item.id, newPaid)
      router.refresh()
      onClose()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Gagal')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
      <div className="bg-card border border-border rounded-2xl p-6 max-w-sm w-full shadow-2xl">
        <h3 className="font-bold text-foreground mb-1">
          {type === 'payable' ? '💸 Bayar Hutang' : '💰 Terima Pembayaran'}
        </h3>
        <p className="text-sm text-muted-foreground mb-4">
          {item.description} — <span className="font-medium text-foreground">{item.contactName}</span>
        </p>
        <div className="rounded-xl bg-muted/50 p-3 mb-4 text-sm">
          <div className="flex justify-between">
            <span className="text-muted-foreground">Total</span>
            <span className="font-semibold">Rp {parseFloat(item.amount).toLocaleString('id-ID')}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-muted-foreground">Sudah dibayar</span>
            <span className="font-semibold text-emerald-600">Rp {parseFloat(item.paidAmount).toLocaleString('id-ID')}</span>
          </div>
          <div className="flex justify-between border-t border-border mt-2 pt-2">
            <span className="font-medium">Sisa</span>
            <span className="font-bold text-rose-500">Rp {remaining.toLocaleString('id-ID')}</span>
          </div>
        </div>
        <form onSubmit={handleSubmit} className="space-y-3">
          <div className="space-y-1.5">
            <Label>Jumlah yang dibayar (Rp)</Label>
            <Input
              type="number"
              placeholder={remaining.toString()}
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              className="h-10"
            />
            <button
              type="button"
              onClick={() => setAmount(remaining.toString())}
              className="text-xs text-primary hover:underline"
            >
              Bayar penuh (Rp {remaining.toLocaleString('id-ID')})
            </button>
          </div>
          {error && <p className="text-sm text-destructive">{error}</p>}
          <div className="flex gap-2">
            <Button type="submit" disabled={loading} size="sm" className="flex-1">
              {loading ? 'Menyimpan...' : 'Konfirmasi'}
            </Button>
            <Button type="button" variant="outline" size="sm" onClick={onClose}>
              Batal
            </Button>
          </div>
        </form>
      </div>
    </div>
  )
}

function DebtList({
  items,
  type,
  businessId,
  onPay,
  onDelete,
}: {
  items: DebtItem[]
  type: 'payable' | 'receivable'
  businessId: string
  onPay: (item: DebtItem) => void
  onDelete: (id: string) => void
}) {
  const emptyMsg = type === 'payable'
    ? 'Tidak ada hutang tercatat. Bagus!'
    : 'Tidak ada piutang tercatat.'

  if (items.length === 0) {
    return (
      <div className="rounded-2xl border-2 border-dashed border-border p-10 text-center">
        <div className="text-4xl mb-3">{type === 'payable' ? '✅' : '📬'}</div>
        <p className="text-muted-foreground text-sm">{emptyMsg}</p>
      </div>
    )
  }

  const totalAmount = items.reduce((s, i) => s + parseFloat(i.amount), 0)
  const totalPaid = items.reduce((s, i) => s + parseFloat(i.paidAmount), 0)
  const totalRemaining = totalAmount - totalPaid

  return (
    <div className="space-y-4">
      {/* Summary */}
      <div className="grid grid-cols-3 gap-3">
        <div className="rounded-xl bg-muted/50 border border-border p-3 text-center">
          <p className="text-xs text-muted-foreground mb-1">Total</p>
          <p className="text-sm font-bold text-foreground">Rp {totalAmount.toLocaleString('id-ID')}</p>
        </div>
        <div className="rounded-xl bg-emerald-50 dark:bg-emerald-950/20 border border-emerald-200 dark:border-emerald-800 p-3 text-center">
          <p className="text-xs text-emerald-600 mb-1">Terbayar</p>
          <p className="text-sm font-bold text-emerald-600">Rp {totalPaid.toLocaleString('id-ID')}</p>
        </div>
        <div className="rounded-xl bg-rose-50 dark:bg-rose-950/20 border border-rose-200 dark:border-rose-800 p-3 text-center">
          <p className="text-xs text-rose-500 mb-1">Sisa</p>
          <p className="text-sm font-bold text-rose-500">Rp {totalRemaining.toLocaleString('id-ID')}</p>
        </div>
      </div>

      {/* List */}
      <div className="rounded-2xl border border-border bg-card overflow-hidden divide-y divide-border">
        {items.map((item) => {
          const remaining = parseFloat(item.amount) - parseFloat(item.paidAmount)
          const pct = Math.round((parseFloat(item.paidAmount) / parseFloat(item.amount)) * 100)
          const overdue = isOverdue(item.dueDate) && item.status !== 'paid'
          const dueSoon = isDueSoon(item.dueDate) && item.status !== 'paid'

          return (
            <div key={item.id} className="p-4">
              <div className="flex items-start justify-between gap-3 mb-3">
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2 flex-wrap mb-1">
                    <span className="font-semibold text-foreground text-sm">{item.contactName}</span>
                    {statusBadge(item.status)}
                    {overdue && (
                      <span className="text-xs font-medium text-destructive bg-destructive/10 px-2 py-0.5 rounded-full">
                        ⚠ Terlambat
                      </span>
                    )}
                    {dueSoon && !overdue && (
                      <span className="text-xs font-medium text-amber-600 bg-amber-50 dark:bg-amber-950/30 px-2 py-0.5 rounded-full">
                        ⏰ Segera jatuh tempo
                      </span>
                    )}
                  </div>
                  <p className="text-sm text-muted-foreground truncate">{item.description}</p>
                  {item.dueDate && (
                    <p className={`text-xs mt-0.5 ${overdue ? 'text-destructive' : 'text-muted-foreground'}`}>
                      Jatuh tempo: {new Date(item.dueDate).toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' })}
                    </p>
                  )}
                  {item.contactPhone && (
                    <p className="text-xs text-muted-foreground mt-0.5">📞 {item.contactPhone}</p>
                  )}
                </div>
                <div className="text-right shrink-0">
                  <p className="text-base font-bold text-foreground">Rp {parseFloat(item.amount).toLocaleString('id-ID')}</p>
                  {remaining > 0 && (
                    <p className="text-xs text-rose-500 font-medium">Sisa Rp {remaining.toLocaleString('id-ID')}</p>
                  )}
                </div>
              </div>

              {/* Progress bar */}
              {item.status !== 'paid' && (
                <div className="mb-3">
                  <div className="flex justify-between text-xs text-muted-foreground mb-1">
                    <span>Terbayar {pct}%</span>
                    <span>Rp {parseFloat(item.paidAmount).toLocaleString('id-ID')} dari Rp {parseFloat(item.amount).toLocaleString('id-ID')}</span>
                  </div>
                  <div className="h-2 bg-muted rounded-full overflow-hidden">
                    <div
                      className="h-full bg-emerald-500 rounded-full transition-all"
                      style={{ width: `${pct}%` }}
                    />
                  </div>
                </div>
              )}

              {/* Actions */}
              <div className="flex gap-2">
                {item.status !== 'paid' && (
                  <Button
                    size="sm"
                    variant="outline"
                    className="text-xs h-8"
                    onClick={() => onPay(item)}
                  >
                    {type === 'payable' ? '💸 Bayar' : '💰 Terima Bayaran'}
                  </Button>
                )}
                <Button
                  size="sm"
                  variant="ghost"
                  className="text-xs h-8 text-destructive hover:text-destructive"
                  onClick={() => onDelete(item.id)}
                >
                  Hapus
                </Button>
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}

export function PayablesPanel({ businessId, payables: initialPayables, receivables: initialReceivables }: Props) {
  const router = useRouter()
  const [activeTab, setActiveTab] = useState<'receivables' | 'payables'>('receivables')
  const [showForm, setShowForm] = useState(false)
  const [payingItem, setPayingItem] = useState<{ item: DebtItem; type: 'payable' | 'receivable' } | null>(null)
  const [payables, setPayables] = useState(initialPayables)
  const [receivables, setReceivables] = useState(initialReceivables)

  const handleDelete = async (id: string, type: 'payable' | 'receivable') => {
    if (!confirm('Hapus data ini?')) return
    try {
      if (type === 'payable') {
        await deletePayable(id)
        setPayables(payables.filter((p) => p.id !== id))
      } else {
        await deleteReceivable(id)
        setReceivables(receivables.filter((r) => r.id !== id))
      }
      router.refresh()
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Gagal menghapus')
    }
  }

  // Summary stats
  const totalReceivable = receivables.filter(r => r.status !== 'paid').reduce((s, r) => s + parseFloat(r.amount) - parseFloat(r.paidAmount), 0)
  const totalPayable = payables.filter(p => p.status !== 'paid').reduce((s, p) => s + parseFloat(p.amount) - parseFloat(p.paidAmount), 0)
  const overdueReceivables = receivables.filter(r => isOverdue(r.dueDate) && r.status !== 'paid').length
  const overduePayables = payables.filter(p => isOverdue(p.dueDate) && p.status !== 'paid').length

  return (
    <div>
      {/* Overview cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-6">
        <div className="rounded-2xl border border-emerald-200 dark:border-emerald-800 bg-emerald-50 dark:bg-emerald-950/20 p-4">
          <p className="text-xs text-emerald-700 dark:text-emerald-400 font-medium mb-1">💰 Piutang Aktif</p>
          <p className="text-xl font-bold text-emerald-700 dark:text-emerald-400">Rp {totalReceivable.toLocaleString('id-ID')}</p>
          <p className="text-xs text-emerald-600 mt-0.5">{receivables.filter(r => r.status !== 'paid').length} tagihan aktif</p>
        </div>
        <div className="rounded-2xl border border-rose-200 dark:border-rose-800 bg-rose-50 dark:bg-rose-950/20 p-4">
          <p className="text-xs text-rose-600 dark:text-rose-400 font-medium mb-1">💸 Hutang Aktif</p>
          <p className="text-xl font-bold text-rose-600 dark:text-rose-400">Rp {totalPayable.toLocaleString('id-ID')}</p>
          <p className="text-xs text-rose-500 mt-0.5">{payables.filter(p => p.status !== 'paid').length} tagihan aktif</p>
        </div>
        <div className="rounded-2xl border border-border bg-card p-4">
          <p className="text-xs text-muted-foreground font-medium mb-1">⚠ Piutang Terlambat</p>
          <p className="text-xl font-bold text-destructive">{overdueReceivables}</p>
          <p className="text-xs text-muted-foreground mt-0.5">tagihan</p>
        </div>
        <div className="rounded-2xl border border-border bg-card p-4">
          <p className="text-xs text-muted-foreground font-medium mb-1">⚠ Hutang Terlambat</p>
          <p className="text-xl font-bold text-destructive">{overduePayables}</p>
          <p className="text-xs text-muted-foreground mt-0.5">tagihan</p>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 rounded-xl border border-border bg-muted p-1 mb-6 max-w-xs">
        <button
          onClick={() => { setActiveTab('receivables'); setShowForm(false) }}
          className={`flex-1 rounded-lg py-2 text-sm font-medium transition-all ${
            activeTab === 'receivables' ? 'bg-emerald-500 text-white shadow-sm' : 'text-muted-foreground hover:text-foreground'
          }`}
        >
          💰 Piutang
        </button>
        <button
          onClick={() => { setActiveTab('payables'); setShowForm(false) }}
          className={`flex-1 rounded-lg py-2 text-sm font-medium transition-all ${
            activeTab === 'payables' ? 'bg-rose-500 text-white shadow-sm' : 'text-muted-foreground hover:text-foreground'
          }`}
        >
          💸 Hutang
        </button>
      </div>

      {/* Add form toggle */}
      {!showForm && (
        <div className="mb-5">
          <Button
            size="sm"
            onClick={() => setShowForm(true)}
            className={activeTab === 'receivables' ? 'bg-emerald-600 hover:bg-emerald-700' : 'bg-rose-500 hover:bg-rose-600'}
          >
            + Tambah {activeTab === 'receivables' ? 'Piutang' : 'Hutang'}
          </Button>
        </div>
      )}

      {showForm && (
        <div className="rounded-2xl border border-border bg-card p-5 mb-6">
          <h3 className="font-semibold text-foreground mb-4">
            {activeTab === 'receivables' ? '💰 Tambah Piutang Baru' : '💸 Tambah Hutang Baru'}
          </h3>
          <DebtForm
            type={activeTab === 'receivables' ? 'receivable' : 'payable'}
            businessId={businessId}
            onDone={() => { setShowForm(false); router.refresh() }}
          />
        </div>
      )}

      {/* List */}
      {activeTab === 'receivables' ? (
        <DebtList
          items={receivables}
          type="receivable"
          businessId={businessId}
          onPay={(item) => setPayingItem({ item, type: 'receivable' })}
          onDelete={(id) => handleDelete(id, 'receivable')}
        />
      ) : (
        <DebtList
          items={payables}
          type="payable"
          businessId={businessId}
          onPay={(item) => setPayingItem({ item, type: 'payable' })}
          onDelete={(id) => handleDelete(id, 'payable')}
        />
      )}

      {/* Payment modal */}
      {payingItem && (
        <PaymentModal
          item={payingItem.item}
          type={payingItem.type}
          onClose={() => { setPayingItem(null); router.refresh() }}
        />
      )}
    </div>
  )
}
