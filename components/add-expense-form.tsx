'use client'

import { useState, useRef, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { createTransaction } from '@/app/actions/transaction'
import { extractFromImage, extractFromMessage } from '@/app/actions/ai-chat'
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
  const [budgetAlerts, setBudgetAlerts] = useState<string[]>([])

  // Voice input state
  const [isRecording, setIsRecording] = useState(false)
  const [isProcessingVoice, setIsProcessingVoice] = useState(false)
  const [voiceTranscript, setVoiceTranscript] = useState<string | null>(null)
  const [voiceSuccess, setVoiceSuccess] = useState(false)
  const recognitionRef = useRef<any>(null)

  const startVoiceInput = useCallback(() => {
    const SpeechRecognition =
      (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition
    if (!SpeechRecognition) {
      setError('Browser Anda tidak mendukung input suara. Coba Chrome atau Edge.')
      return
    }

    const recognition = new SpeechRecognition()
    recognition.lang = 'id-ID'
    recognition.interimResults = false
    recognition.maxAlternatives = 1
    recognitionRef.current = recognition

    recognition.onstart = () => {
      setIsRecording(true)
      setError(null)
      setVoiceTranscript(null)
      setVoiceSuccess(false)
    }

    recognition.onresult = async (event: any) => {
      const transcript = event.results[0][0].transcript
      setVoiceTranscript(transcript)
      setIsRecording(false)
      setIsProcessingVoice(true)

      try {
        const results = await extractFromMessage(transcript)
        if (results.length > 0) {
          const first = results[0]
          setAmount(first.amount.toString())
          setDescription(first.description)
          // Tentukan tipe transaksi dari hasil AI
          // extractFromMessage mengembalikan expense/income via extractExpensesFromText
          // Kita cek dari deskripsi apakah ada kata kunci income
          const incomeKeywords = ['terima', 'masuk', 'penjualan', 'bayaran', 'pemasukan', 'pendapatan', 'income']
          const isIncome = incomeKeywords.some(k => transcript.toLowerCase().includes(k))
          setTransactionType(isIncome ? 'income' : 'expense')

          const matchedDb = categories.find(
            (c) => c.type === first.category || c.name.toLowerCase() === first.category?.toLowerCase()
          )
          if (matchedDb) {
            setCategoryValue(`db:${matchedDb.id}`)
          } else {
            const matchedDefault = DEFAULT_EXPENSE_CATEGORIES.find((c) => c.value === first.category)
            setCategoryValue(matchedDefault ? `default:${matchedDefault.value}` : '__none__')
          }
          setVoiceSuccess(true)
        } else {
          // Tidak ada transaksi terdeteksi — isi deskripsi saja biar user bisa edit manual
          setDescription(transcript)
          setError('AI tidak mendeteksi nominal. Silakan isi jumlah secara manual.')
        }
      } catch {
        setError('Gagal memproses suara. Silakan coba lagi.')
      } finally {
        setIsProcessingVoice(false)
      }
    }

    recognition.onerror = (event: any) => {
      setIsRecording(false)
      setIsProcessingVoice(false)
      if (event.error === 'not-allowed') {
        setError('Izin mikrofon ditolak. Aktifkan akses mikrofon di browser Anda.')
      } else if (event.error === 'no-speech') {
        setError('Tidak ada suara terdeteksi. Coba lagi.')
      } else {
        setError('Gagal merekam suara. Pastikan mikrofon aktif.')
      }
    }

    recognition.onend = () => {
      setIsRecording(false)
    }

    recognition.start()
  }, [categories])

  const stopVoiceInput = useCallback(() => {
    recognitionRef.current?.stop()
    setIsRecording(false)
  }, [])

  // Reset kategori saat ganti tipe transaksi
  const handleTypeChange = (type: 'expense' | 'income') => {
    setTransactionType(type)
    setCategoryValue('__none__')
    setVoiceSuccess(false)
    setVoiceTranscript(null)
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

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
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

      const result = await createTransaction(
        businessId,
        parsedAmount,
        description.trim(),
        categoryId,
        'manual',
        transactionType,
        [],
        finalNotes || undefined,
        undefined
      )

      // Tampilkan budget alert jika ada, sebelum redirect
      if (result.budgetAlerts && result.budgetAlerts.length > 0) {
        setBudgetAlerts(result.budgetAlerts)
        setLoading(false)
        // Redirect setelah 3 detik agar user sempat baca alert
        setTimeout(() => {
          router.push(`/dashboard/${businessId}`)
          router.refresh()
        }, 3500)
      } else {
        router.push(`/dashboard/${businessId}`)
        router.refresh()
      }
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

        {/* Voice input */}
        <div className={`rounded-xl border border-dashed p-5 transition-colors ${
          isRecording
            ? 'border-rose-400 bg-rose-50 dark:bg-rose-950/20'
            : voiceSuccess
            ? 'border-emerald-400 bg-emerald-50 dark:bg-emerald-950/20'
            : 'border-border bg-muted/30'
        }`}>
          <p className="text-sm font-medium text-foreground mb-3">🎙️ Input Suara (Opsional)</p>
          <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3">
            <div className="flex-1">
              {isRecording ? (
                <div className="flex items-center gap-2">
                  <span className="relative flex h-2.5 w-2.5">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-rose-400 opacity-75" />
                    <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-rose-500" />
                  </span>
                  <p className="text-sm text-rose-600 font-medium">Mendengarkan... Ucapkan transaksi Anda</p>
                </div>
              ) : isProcessingVoice ? (
                <p className="text-sm text-amber-600 font-medium">⏳ AI sedang memproses suara...</p>
              ) : voiceTranscript ? (
                <div>
                  <p className="text-xs text-muted-foreground mb-0.5">Hasil transkripsi:</p>
                  <p className="text-sm text-foreground italic">"{voiceTranscript}"</p>
                </div>
              ) : (
                <p className="text-xs text-muted-foreground leading-relaxed">
                  Ucapkan transaksi seperti <span className="font-medium">"beli bahan baku kopi 450 ribu"</span> atau <span className="font-medium">"terima pembayaran 1.2 juta"</span>
                </p>
              )}
            </div>
            <Button
              type="button"
              variant={isRecording ? 'destructive' : 'outline'}
              onClick={isRecording ? stopVoiceInput : startVoiceInput}
              disabled={isProcessingVoice}
              className={`shrink-0 gap-2 ${voiceSuccess && !isRecording ? 'border-emerald-400 text-emerald-700' : ''}`}
            >
              {isProcessingVoice ? (
                <>
                  <span className="animate-spin">⏳</span> Memproses...
                </>
              ) : isRecording ? (
                <>
                  <span className="h-2 w-2 rounded-sm bg-white inline-block" /> Stop
                </>
              ) : voiceSuccess ? (
                <>✓ Berhasil</>
              ) : (
                <>🎙️ Rekam Suara</>
              )}
            </Button>
          </div>
          {voiceSuccess && (
            <p className="text-xs text-emerald-600 mt-2 font-medium">✓ Data berhasil diekstrak dari suara — periksa dan sesuaikan jika perlu</p>
          )}
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

        {budgetAlerts.length > 0 && (
          <div className="rounded-xl border border-amber-300 bg-amber-50 dark:bg-amber-950/30 dark:border-amber-700 px-4 py-4">
            <div className="flex items-start gap-3">
              <span className="text-xl shrink-0">⚠️</span>
              <div>
                <p className="text-sm font-semibold text-amber-800 dark:text-amber-300 mb-2">
                  Transaksi tersimpan — Peringatan Budget:
                </p>
                <ul className="space-y-1">
                  {budgetAlerts.map((alert, i) => (
                    <li key={i} className="text-sm text-amber-700 dark:text-amber-400">• {alert}</li>
                  ))}
                </ul>
                <p className="text-xs text-amber-600 dark:text-amber-500 mt-2">Mengarahkan ke dashboard...</p>
              </div>
            </div>
          </div>
        )}

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
