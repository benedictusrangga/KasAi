'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { createTransaction } from '@/app/actions/transaction'
import { extractFromImage } from '@/app/actions/ai-chat'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'

const CATEGORIES = [
  { value: 'groceries', label: 'Bahan Makanan' },
  { value: 'transportation', label: 'Transportasi' },
  { value: 'utilities', label: 'Utilitas (Listrik, Air, dll)' },
  { value: 'entertainment', label: 'Hiburan' },
  { value: 'dining', label: 'Makan & Minum' },
  { value: 'shopping', label: 'Belanja' },
  { value: 'healthcare', label: 'Kesehatan' },
  { value: 'education', label: 'Pendidikan' },
  { value: 'office_supplies', label: 'Perlengkapan Kantor' },
  { value: 'other', label: 'Lainnya' },
]

export function AddExpenseForm({ businessId }: { businessId: string }) {
  const router = useRouter()
  const [transactionType, setTransactionType] = useState<'expense' | 'income'>('expense')
  const [amount, setAmount] = useState('')
  const [description, setDescription] = useState('')
  const [category, setCategory] = useState('other')
  const [notes, setNotes] = useState('')
  const [receiptPreview, setReceiptPreview] = useState<string | null>(null)
  const [receiptFileName, setReceiptFileName] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)
  const [scanning, setScanning] = useState(false)
  const [scanSuccess, setScanSuccess] = useState(false)

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    setReceiptFileName(file.name)
    setScanSuccess(false)
    const reader = new FileReader()
    reader.onload = () => {
      if (typeof reader.result === 'string') setReceiptPreview(reader.result)
    }
    reader.readAsDataURL(file)
  }

  const handleScanReceipt = async () => {
    if (!receiptPreview) return
    setScanning(true)
    setError(null)
    try {
      const results = await extractFromImage(receiptPreview)
      if (results.length === 0) {
        setError('Tidak ada transaksi terdeteksi pada struk. Coba foto yang lebih jelas.')
      } else {
        const first = results[0]
        setAmount(first.amount.toString())
        setDescription(first.description)
        setCategory(CATEGORIES.some((c) => c.value === first.category) ? first.category : 'other')
        setTransactionType('expense')
        setScanSuccess(true)
      }
    } catch {
      setError('Gagal memindai struk. Silakan coba lagi.')
    } finally {
      setScanning(false)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)
    if (!amount || parseFloat(amount) <= 0) {
      setError('Masukkan jumlah yang valid.')
      return
    }
    if (!description.trim()) {
      setError('Masukkan deskripsi transaksi.')
      return
    }
    setLoading(true)
    try {
      await createTransaction(
        businessId,
        parseFloat(amount),
        description,
        category,
        'manual',
        transactionType,
        [],
        notes,
        receiptPreview || undefined
      )
      router.push(`/dashboard/${businessId}`)
      router.refresh()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Gagal menyimpan transaksi.')
      setLoading(false)
    }
  }

  return (
    <div className="w-full max-w-2xl">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-foreground">Tambah Transaksi</h1>
        <p className="text-muted-foreground mt-1">Catat pemasukan atau pengeluaran bisnis Anda</p>
      </div>

      {/* Type toggle */}
      <div className="flex rounded-xl border border-border bg-muted p-1 mb-6">
        <button
          type="button"
          onClick={() => setTransactionType('expense')}
          className={`flex-1 rounded-lg py-2.5 text-sm font-medium transition-all ${
            transactionType === 'expense'
              ? 'bg-rose-500 text-white shadow-sm'
              : 'text-muted-foreground hover:text-foreground'
          }`}
        >
          ↓ Pengeluaran
        </button>
        <button
          type="button"
          onClick={() => setTransactionType('income')}
          className={`flex-1 rounded-lg py-2.5 text-sm font-medium transition-all ${
            transactionType === 'income'
              ? 'bg-emerald-500 text-white shadow-sm'
              : 'text-muted-foreground hover:text-foreground'
          }`}
        >
          ↑ Pemasukan
        </button>
      </div>

      <form onSubmit={handleSubmit} className="space-y-5">
        {/* Amount */}
        <div className="space-y-1.5">
          <Label htmlFor="amount">Jumlah (Rp) *</Label>
          <div className="relative">
            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-sm text-muted-foreground font-medium">Rp</span>
            <Input
              id="amount"
              type="number"
              placeholder="0"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              required
              min="0"
              step="1"
              className="pl-10 h-12 text-lg font-semibold"
            />
          </div>
        </div>

        {/* Description */}
        <div className="space-y-1.5">
          <Label htmlFor="description">Deskripsi *</Label>
          <Input
            id="description"
            placeholder="Contoh: Beli bahan baku kopi, Bayar listrik, dll."
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            required
            className="h-11"
          />
        </div>

        {/* Category */}
        <div className="space-y-1.5">
          <Label htmlFor="category">Kategori</Label>
          <Select value={category} onValueChange={setCategory}>
            <SelectTrigger id="category" className="h-11">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {CATEGORIES.map((cat) => (
                <SelectItem key={cat.value} value={cat.value}>{cat.label}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* Notes */}
        <div className="space-y-1.5">
          <Label htmlFor="notes">Catatan (Opsional)</Label>
          <Input
            id="notes"
            placeholder="Informasi tambahan tentang transaksi ini"
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            className="h-11"
          />
        </div>

        {/* Receipt upload */}
        <div className="rounded-xl border border-dashed border-border bg-muted/30 p-5">
          <p className="text-sm font-medium text-foreground mb-3">📷 Scan Struk (Opsional)</p>
          <div className="flex flex-col sm:flex-row gap-3">
            <div className="flex-1">
              <input
                id="receipt"
                type="file"
                accept="image/*"
                onChange={handleFileChange}
                className="block w-full text-sm text-muted-foreground file:mr-3 file:rounded-lg file:border-0 file:bg-primary file:px-3 file:py-1.5 file:text-xs file:font-medium file:text-primary-foreground hover:file:bg-primary/90 cursor-pointer"
              />
              {receiptFileName && (
                <p className="text-xs text-muted-foreground mt-1.5">📎 {receiptFileName}</p>
              )}
            </div>
            <Button
              type="button"
              variant="outline"
              onClick={handleScanReceipt}
              disabled={scanning || !receiptPreview}
              className="shrink-0"
            >
              {scanning ? 'Memindai...' : scanSuccess ? '✓ Berhasil' : 'Scan AI'}
            </Button>
          </div>
          {scanSuccess && (
            <p className="text-xs text-emerald-600 mt-2">✓ Data berhasil diekstrak dari struk</p>
          )}
        </div>

        {error && (
          <div className="rounded-lg bg-destructive/10 border border-destructive/20 px-4 py-3">
            <p className="text-sm text-destructive">{error}</p>
          </div>
        )}

        <div className="flex gap-3 pt-2">
          <Button type="submit" disabled={loading} className="flex-1 h-11 font-semibold">
            {loading ? 'Menyimpan...' : `Simpan ${transactionType === 'expense' ? 'Pengeluaran' : 'Pemasukan'}`}
          </Button>
          <Button
            type="button"
            variant="outline"
            onClick={() => router.back()}
            className="h-11 px-6"
          >
            Batal
          </Button>
        </div>
      </form>
    </div>
  )
}
