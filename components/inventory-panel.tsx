'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import {
  createInventoryItem,
  adjustInventoryStock,
  updateInventoryItem,
  deleteInventoryItem,
} from '@/app/actions/inventory'

type Item = {
  id: string
  name: string
  sku?: string | null
  unit: string
  currentStock: string
  minStock?: string | null
  buyPrice?: string | null
  sellPrice?: string | null
  description?: string | null
}

type Log = {
  id: string
  itemId: string
  type: string
  quantity: string
  note?: string | null
  createdAt: Date
}

type Props = {
  businessId: string
  items: Item[]
  logs: Log[]
}

function StockAdjustModal({
  item,
  onClose,
}: {
  item: Item
  onClose: () => void
}) {
  const router = useRouter()
  const [type, setType] = useState<'in' | 'out' | 'adjustment'>('in')
  const [quantity, setQuantity] = useState('')
  const [note, setNote] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    const qty = parseFloat(quantity)
    if (!qty || qty <= 0) { setError('Jumlah harus lebih dari 0'); return }

    setLoading(true)
    setError(null)
    try {
      await adjustInventoryStock({ itemId: item.id, type, quantity: qty, note: note.trim() || undefined })
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
        <h3 className="font-bold text-foreground mb-1">📦 Kelola Stok</h3>
        <p className="text-sm text-muted-foreground mb-4">
          {item.name} — Stok saat ini: <strong>{parseFloat(item.currentStock).toLocaleString('id-ID')} {item.unit}</strong>
        </p>
        <div className="flex gap-1 rounded-xl border border-border bg-muted p-1 mb-4">
          {(['in', 'out', 'adjustment'] as const).map((t) => (
            <button
              key={t}
              type="button"
              onClick={() => setType(t)}
              className={`flex-1 rounded-lg py-1.5 text-xs font-medium transition-all ${
                type === t ? 'bg-primary text-white shadow-sm' : 'text-muted-foreground hover:text-foreground'
              }`}
            >
              {t === 'in' ? '📥 Masuk' : t === 'out' ? '📤 Keluar' : '✏️ Koreksi'}
            </button>
          ))}
        </div>
        <form onSubmit={handleSubmit} className="space-y-3">
          <div className="space-y-1.5">
            <Label>
              {type === 'adjustment' ? 'Set stok ke' : 'Jumlah'} ({item.unit})
            </Label>
            <Input
              type="number"
              placeholder="0"
              value={quantity}
              onChange={(e) => setQuantity(e.target.value)}
              className="h-10"
            />
            {type === 'adjustment' && (
              <p className="text-xs text-muted-foreground">Stok akan diset ke angka ini (bukan ditambah/kurang)</p>
            )}
          </div>
          <div className="space-y-1.5">
            <Label>Catatan (Opsional)</Label>
            <Input
              placeholder="Contoh: Restock dari supplier"
              value={note}
              onChange={(e) => setNote(e.target.value)}
              className="h-10"
            />
          </div>
          {error && <p className="text-sm text-destructive">{error}</p>}
          <div className="flex gap-2">
            <Button type="submit" disabled={loading} size="sm" className="flex-1">
              {loading ? 'Menyimpan...' : 'Konfirmasi'}
            </Button>
            <Button type="button" variant="outline" size="sm" onClick={onClose}>Batal</Button>
          </div>
        </form>
      </div>
    </div>
  )
}

function AddItemForm({ businessId, onDone }: { businessId: string; onDone: () => void }) {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [form, setForm] = useState({
    name: '', sku: '', unit: 'pcs', currentStock: '', minStock: '',
    buyPrice: '', sellPrice: '', description: '',
  })

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!form.name.trim()) { setError('Nama barang diperlukan'); return }
    setLoading(true)
    setError(null)
    try {
      await createInventoryItem({
        businessId,
        name: form.name.trim(),
        sku: form.sku.trim() || undefined,
        unit: form.unit || 'pcs',
        currentStock: parseFloat(form.currentStock) || 0,
        minStock: parseFloat(form.minStock) || 0,
        buyPrice: parseFloat(form.buyPrice) || undefined,
        sellPrice: parseFloat(form.sellPrice) || undefined,
        description: form.description.trim() || undefined,
      })
      router.refresh()
      onDone()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Gagal')
    } finally {
      setLoading(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="grid grid-cols-2 gap-3">
        <div className="space-y-1.5 col-span-2 sm:col-span-1">
          <Label>Nama Barang *</Label>
          <Input placeholder="Contoh: Kopi Arabika" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} className="h-10" />
        </div>
        <div className="space-y-1.5">
          <Label>SKU / Kode (Opsional)</Label>
          <Input placeholder="KOPI-001" value={form.sku} onChange={(e) => setForm({ ...form, sku: e.target.value })} className="h-10" />
        </div>
      </div>
      <div className="grid grid-cols-3 gap-3">
        <div className="space-y-1.5">
          <Label>Satuan</Label>
          <Input placeholder="pcs, kg, liter" value={form.unit} onChange={(e) => setForm({ ...form, unit: e.target.value })} className="h-10" />
        </div>
        <div className="space-y-1.5">
          <Label>Stok Awal</Label>
          <Input type="number" placeholder="0" value={form.currentStock} onChange={(e) => setForm({ ...form, currentStock: e.target.value })} className="h-10" />
        </div>
        <div className="space-y-1.5">
          <Label>Stok Minimum</Label>
          <Input type="number" placeholder="5" value={form.minStock} onChange={(e) => setForm({ ...form, minStock: e.target.value })} className="h-10" />
        </div>
      </div>
      <div className="grid grid-cols-2 gap-3">
        <div className="space-y-1.5">
          <Label>Harga Beli (Rp)</Label>
          <Input type="number" placeholder="50000" value={form.buyPrice} onChange={(e) => setForm({ ...form, buyPrice: e.target.value })} className="h-10" />
        </div>
        <div className="space-y-1.5">
          <Label>Harga Jual (Rp)</Label>
          <Input type="number" placeholder="75000" value={form.sellPrice} onChange={(e) => setForm({ ...form, sellPrice: e.target.value })} className="h-10" />
        </div>
      </div>
      {error && <p className="text-sm text-destructive">{error}</p>}
      <div className="flex gap-2">
        <Button type="submit" disabled={loading} size="sm">
          {loading ? 'Menyimpan...' : '+ Tambah Barang'}
        </Button>
        <Button type="button" variant="outline" size="sm" onClick={onDone}>Batal</Button>
      </div>
    </form>
  )
}

export function InventoryPanel({ businessId, items: initialItems, logs }: Props) {
  const router = useRouter()
  const [items, setItems] = useState(initialItems)
  const [showForm, setShowForm] = useState(false)
  const [adjustingItem, setAdjustingItem] = useState<Item | null>(null)
  const [activeTab, setActiveTab] = useState<'items' | 'logs'>('items')
  const [search, setSearch] = useState('')

  const handleDelete = async (itemId: string) => {
    if (!confirm('Hapus barang ini? Riwayat log juga akan terhapus.')) return
    try {
      await deleteInventoryItem(itemId)
      setItems(items.filter((i) => i.id !== itemId))
      router.refresh()
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Gagal menghapus')
    }
  }

  const lowStockItems = items.filter((i) => {
    const min = parseFloat(i.minStock || '0')
    return min > 0 && parseFloat(i.currentStock) <= min
  })

  const filteredItems = items.filter((i) =>
    i.name.toLowerCase().includes(search.toLowerCase()) ||
    (i.sku || '').toLowerCase().includes(search.toLowerCase())
  )

  return (
    <div>
      {/* Alert stok menipis */}
      {lowStockItems.length > 0 && (
        <div className="rounded-2xl border border-amber-200 bg-amber-50 dark:bg-amber-950/20 dark:border-amber-800 p-4 mb-5">
          <p className="text-sm font-semibold text-amber-800 dark:text-amber-300 mb-2">
            ⚠️ {lowStockItems.length} barang hampir habis / stok minimum
          </p>
          <div className="flex flex-wrap gap-2">
            {lowStockItems.map((i) => (
              <span key={i.id} className="text-xs bg-amber-100 dark:bg-amber-900 text-amber-700 dark:text-amber-300 px-2 py-1 rounded-lg">
                {i.name} — sisa {parseFloat(i.currentStock).toLocaleString('id-ID')} {i.unit}
              </span>
            ))}
          </div>
        </div>
      )}

      {/* Summary */}
      <div className="grid grid-cols-3 gap-3 mb-6">
        <div className="rounded-xl bg-muted/50 border border-border p-3 text-center">
          <p className="text-xs text-muted-foreground mb-1">Total Jenis Barang</p>
          <p className="text-xl font-bold text-foreground">{items.length}</p>
        </div>
        <div className="rounded-xl bg-amber-50 dark:bg-amber-950/20 border border-amber-200 dark:border-amber-800 p-3 text-center">
          <p className="text-xs text-amber-600 mb-1">Stok Menipis</p>
          <p className="text-xl font-bold text-amber-600">{lowStockItems.length}</p>
        </div>
        <div className="rounded-xl bg-muted/50 border border-border p-3 text-center">
          <p className="text-xs text-muted-foreground mb-1">Pergerakan Stok</p>
          <p className="text-xl font-bold text-foreground">{logs.length}</p>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 rounded-xl border border-border bg-muted p-1 mb-5 max-w-xs">
        <button
          onClick={() => setActiveTab('items')}
          className={`flex-1 rounded-lg py-2 text-sm font-medium transition-all ${activeTab === 'items' ? 'bg-primary text-white shadow-sm' : 'text-muted-foreground hover:text-foreground'}`}
        >
          📦 Barang
        </button>
        <button
          onClick={() => setActiveTab('logs')}
          className={`flex-1 rounded-lg py-2 text-sm font-medium transition-all ${activeTab === 'logs' ? 'bg-primary text-white shadow-sm' : 'text-muted-foreground hover:text-foreground'}`}
        >
          📋 Riwayat
        </button>
      </div>

      {activeTab === 'items' && (
        <>
          <div className="flex gap-3 mb-4 flex-wrap">
            <Input
              placeholder="Cari barang..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="max-w-xs h-9 text-sm"
            />
            {!showForm && (
              <Button size="sm" onClick={() => setShowForm(true)}>+ Tambah Barang</Button>
            )}
          </div>

          {showForm && (
            <div className="rounded-2xl border border-border bg-card p-5 mb-5">
              <h3 className="font-semibold text-foreground mb-4">Tambah Barang Baru</h3>
              <AddItemForm businessId={businessId} onDone={() => { setShowForm(false); router.refresh() }} />
            </div>
          )}

          {filteredItems.length === 0 ? (
            <div className="rounded-2xl border-2 border-dashed border-border p-12 text-center">
              <div className="text-4xl mb-3">📦</div>
              <p className="text-muted-foreground text-sm">
                {items.length === 0 ? 'Belum ada barang di inventaris. Tambahkan barang pertama Anda.' : 'Tidak ada barang yang cocok.'}
              </p>
            </div>
          ) : (
            <div className="rounded-2xl border border-border bg-card overflow-hidden divide-y divide-border">
              {filteredItems.map((item) => {
                const stock = parseFloat(item.currentStock)
                const minStock = parseFloat(item.minStock || '0')
                const isLow = minStock > 0 && stock <= minStock
                const hasMargin = item.buyPrice && item.sellPrice
                const margin = hasMargin
                  ? parseFloat(item.sellPrice!) - parseFloat(item.buyPrice!)
                  : null

                return (
                  <div key={item.id} className="flex items-center justify-between px-5 py-4 hover:bg-muted/30 transition-colors">
                    <div className="flex items-center gap-3 min-w-0">
                      <div className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-xl text-sm font-bold ${
                        isLow ? 'bg-amber-100 text-amber-700' : 'bg-primary/10 text-primary'
                      }`}>
                        {isLow ? '⚠' : '📦'}
                      </div>
                      <div className="min-w-0">
                        <div className="flex items-center gap-2">
                          <p className="text-sm font-semibold text-foreground">{item.name}</p>
                          {item.sku && <span className="text-xs text-muted-foreground">({item.sku})</span>}
                          {isLow && (
                            <span className="text-xs bg-amber-100 dark:bg-amber-900 text-amber-700 dark:text-amber-300 px-1.5 py-0.5 rounded-md font-medium">
                              Stok menipis
                            </span>
                          )}
                        </div>
                        <div className="flex items-center gap-3 text-xs text-muted-foreground mt-0.5">
                          <span>Stok: <strong className={isLow ? 'text-amber-600' : 'text-foreground'}>{stock.toLocaleString('id-ID')} {item.unit}</strong></span>
                          {minStock > 0 && <span>Min: {minStock.toLocaleString('id-ID')}</span>}
                          {item.sellPrice && <span>Jual: Rp {parseFloat(item.sellPrice).toLocaleString('id-ID')}</span>}
                          {margin !== null && <span className="text-emerald-600">Margin: Rp {margin.toLocaleString('id-ID')}</span>}
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center gap-2 shrink-0 ml-3">
                      <Button
                        size="sm"
                        variant="outline"
                        className="text-xs h-8"
                        onClick={() => setAdjustingItem(item)}
                      >
                        Kelola Stok
                      </Button>
                      <Button
                        size="sm"
                        variant="ghost"
                        className="text-xs h-8 text-destructive hover:text-destructive"
                        onClick={() => handleDelete(item.id)}
                      >
                        Hapus
                      </Button>
                    </div>
                  </div>
                )
              })}
            </div>
          )}
        </>
      )}

      {activeTab === 'logs' && (
        <div>
          {logs.length === 0 ? (
            <div className="rounded-2xl border-2 border-dashed border-border p-12 text-center">
              <div className="text-4xl mb-3">📋</div>
              <p className="text-muted-foreground text-sm">Belum ada riwayat pergerakan stok.</p>
            </div>
          ) : (
            <div className="rounded-2xl border border-border bg-card overflow-hidden divide-y divide-border">
              {logs.slice(0, 50).map((log) => {
                const item = items.find((i) => i.id === log.itemId)
                return (
                  <div key={log.id} className="flex items-center justify-between px-5 py-3 hover:bg-muted/30">
                    <div className="flex items-center gap-3 min-w-0">
                      <span className="text-lg shrink-0">
                        {log.type === 'in' ? '📥' : log.type === 'out' ? '📤' : '✏️'}
                      </span>
                      <div className="min-w-0">
                        <p className="text-sm font-medium text-foreground truncate">
                          {item?.name || 'Barang dihapus'}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          {log.type === 'in' ? 'Masuk' : log.type === 'out' ? 'Keluar' : 'Koreksi'} ·{' '}
                          {new Date(log.createdAt).toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' })}
                          {log.note && ` · ${log.note}`}
                        </p>
                      </div>
                    </div>
                    <span className={`text-sm font-semibold shrink-0 ml-3 ${
                      log.type === 'in' ? 'text-emerald-600' : log.type === 'out' ? 'text-rose-500' : 'text-muted-foreground'
                    }`}>
                      {log.type === 'in' ? '+' : log.type === 'out' ? '-' : '='}{parseFloat(log.quantity).toLocaleString('id-ID')} {item?.unit || ''}
                    </span>
                  </div>
                )
              })}
            </div>
          )}
        </div>
      )}

      {adjustingItem && (
        <StockAdjustModal item={adjustingItem} onClose={() => { setAdjustingItem(null); router.refresh() }} />
      )}
    </div>
  )
}
