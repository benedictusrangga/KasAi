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

// Kategori default untuk pengeluaran (label saja, tidak disimpan sebagai FK)
const DEFAULT_EXPENSE_CATEGORIES = [
  { value: 'groceries', label: '🛒 Bahan Makanan' },
  { value: 'transportation', label: '🚗 Transportasi' },
  { value: 'utilities', label: '💡 Utilitas (Listrik, Air, dll)' },
  { value: 'entertainment', label: '🎬 Hiburan' },
  { value: 'dining', label: '🍽️ Makan & Minum' },
  { value: 'shopping', label: '🛍️ Belanja' },
  { value: 'healthcare', label: '🏥 Kesehatan' },
  { value: 'education', label: '📚 Pendidikan' },
  { value: 'office_supplies', label: '📎 Perlengkapan Kantor' },
  { value: 'other', label: '📦 Lainnya' },
]

// Kategori default untuk pemasukan
const DEFAULT_INCOME_CATEGORIES = [
  { value: 'sales', label: '💰 Penjualan' },
  { value: 'service', label: '🔧 Jasa / Layanan' },
  { value: 'investment', label: '📈 Investasi' },
  { value: 'refund', label: '↩️ Pengembalian Dana' },
  { value: 'other_income', label: '📦 Pemasukan Lainnya' },
]

type DbCategory = {
  id: string
  name: string
  type: string
  icon?: string | null
}

interface AddExpenseFormProps {
  businessId: string
  categories?: DbCategory[]
}

export function AddExpenseForm({ businessId, categories = [] }: AddExpenseFormProps) {
  const router = useRouter()
  const [transactionType, setTransactionType] = useState<'expense' | 'income'>('expense')
  const [amount, setAmount] = useState('')
  const [description, setDescription] = useState('')
  // '__none__' berarti tidak ada kategori dipilih (simpan sebagai null/undefined)
  const [categoryValue, setCategoryValue] = useState('__none__')
  const [notes, setNotes] = useState('')
  const [receiptPreview, setReceiptPreview] = useState<string | null>(null)
  const [receiptFileName, setReceiptFileName] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)
  const [scanning, setScanning] = useState(false)
  const [scanSuccess, setScanSuccess] = useState(false)

  // Reset kategori saat ganti tipe transaksi
  const handleTypeChange = (type: 'expense' | 'income') => {
    setTransactionType(type)
    setCategoryValue('__none__')
  }

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
        setTransactionType('expense')
        // Coba cocokkan kategori dari hasil scan dengan kategori DB atau default
        const matchedDb = categories.find(
          (c) => c.type === first.category || c.name.toLowerCase() === first.category?.toLowerCase()
        )
        if (matchedDb) {
          setCategoryValue(`db:${matchedDb.id}`)
        } else {
          const matchedDefault = DEFAULT_EXPENSE_CATEGORIES.find((c) => c.value === first.category)
          setCategoryValue(matchedDefault ? `default:${matchedDefault.value}` : '__none__')
        }
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

    const parsedAmount = parseFloat(amount)
    if (!amount || isNaN(parsedAmount) || parsedAmount <= 0) {
      setError('Masukkan jumlah yang valid (lebih dari 0).')
      return
    }
    if (!description.trim()) {
      setError('Masukkan deskripsi transaksi.')
      return
    }

    setLoading(true)
    try {
      // Tentukan categoryId yang valid (hanya ID dari DB, bukan enum string)
      let categoryId: string | undefined = undefined
      if (categoryValue.startsWith('db:')) {
        categoryId = categoryValue.replace('db:', '')
      }
      // Kalau 'default:xxx' atau '__none__', simpan sebagai undefined (null di DB)
      // Nama kategori default disimpan di notes jika perlu, tapi tidak sebagai FK

      // Kalau kategori default dipilih, tambahkan ke notes sebagai konteks
      let finalNotes = notes.trim()
      if (categoryValue.startsWith('default:')) {
        const defaultKey = categoryValue.replace('default:', '')
        const allDefaults = [...DEFAULT_EXPENSE_CATEGORIES, ...DEFAULT_INCOME_CATEGORIES]
        const defaultCat = allDefaults.find((c) => c.value === defaultKey)
        if (defaultCat && !finalNotes) {
          finalNotes = `Kategori: ${defaultCat.label.replace(/^[^\s]+\s/, '')}`
        }
      }

      await createTransaction(
        businessId,
        parsedAmount,
        description.trim(),
        categoryId,
        'manual',
        transactionType,
        [],
        finalNotes || undefined,
        undefined // receipt URL — tidak simpan base64 ke DB
      )
      router.push(`/dashboard/${businessId}`)
      router.refresh()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Gagal menyimpan transaksi. Silakan coba lagi.')
      setLoading(false)
    }
  }

  // Bangun daftar opsi kategori
  // Prioritas: kategori dari DB bisnis → kategori default
  const dbCategories = categories.filter((c) => {
    if (transactionType === 'expense') {
      return ['groceries', 'transportation', 'utilities', 'entertainment', 'dining',
        'shopping', 'healthcare', 'education', 'office_supplies', 'other'].includes(c.type)
    }
    return true // untuk income, tampilkan semua kategori DB
  })

  const hasDbCategories = dbCategories.length > 0
  const defaultCategories = transactionType === 'expense'
    ? DEFAULT_EXPENSE_CATEGORIES
    : DEFAULT_INCOME_CATEGORIES

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
          onClick={() => handleTypeChange('expense')}
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
          onClick={() => handleTypeChange('income')}
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
              min="1"
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
            placeholder={
              transactionType === 'expense'
                ? 'Contoh: Beli bahan baku kopi, Bayar listrik, dll.'
                : 'Contoh: Penjualan hari ini, Pembayaran jasa, dll.'
            }
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            required
            className="h-11"
          />
        </div>

        {/* Category */}
        <div className="space-y-1.5">
          <Label htmlFor="category">
            Kategori
            <span className="text-muted-foreground font-normal ml-1">(opsional)</span>
          </Label>
          <Select value={categoryValue} onValueChange={setCategoryValue}>
            <SelectTrigger id="category" className="h-11">
              <SelectValue placeholder="Pilih kategori..." />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="__none__">— Tanpa Kategori —</SelectItem>

              {/* Kategori dari DB bisnis (jika ada) */}
              {hasDbCategories && (
                <>
                  <div className="px-2 py-1.5 text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                    Kategori Bisnis Anda
                  </div>
                  {dbCategories.map((cat) => (
                    <SelectItem key={cat.id} value={`db:${cat.id}`}>
                      {cat.icon ? `${cat.icon} ` : ''}{cat.name}
                    </SelectItem>
                  ))}
                  <div className="px-2 py-1.5 text-xs font-semibold text-muted-foreground uppercase tracking-wider border-t mt-1 pt-2">
                    Kategori Umum
                  </div>
                </>
              )}

              {/* Kategori default */}
              {defaultCategories.map((cat) => (
                <SelectItem key={cat.value} value={`default:${cat.value}`}>
                  {cat.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          {!hasDbCategories && (
            <p className="text-xs text-muted-foreground">
              Buat kategori kustom di{' '}
              <a href={`/dashboard/${businessId}/settings`} className="text-primary hover:underline">
                Pengaturan Bisnis
              </a>
            </p>
          )}
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
          <Button
            type="submit"
            disabled={loading}
            className={`flex-1 h-11 font-semibold ${
              transactionType === 'income'
                ? 'bg-emerald-600 hover:bg-emerald-700 text-white'
                : ''
            }`}
          >
            {loading
              ? 'Menyimpan...'
              : `Simpan ${transactionType === 'expense' ? 'Pengeluaran' : 'Pemasukan'}`}
          </Button>
          <Button
            type="button"
            variant="outline"
            onClick={() => router.back()}
            disabled={loading}
            className="h-11 px-6"
          >
            Batal
          </Button>
        </div>
      </form>
    </div>
  )
}
