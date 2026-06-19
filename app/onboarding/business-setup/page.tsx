'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { authClient } from '@/lib/auth-client'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { saveBusinessSetup, completeOnboarding } from '@/app/actions/onboarding'
import { initFeatureConfig } from '@/app/actions/features'

const BUSINESS_TYPES = [
  { id: 'cafe', name: 'Cafe / Resto', icon: '☕', desc: 'Minuman, makanan, dan layanan F&B' },
  { id: 'retail', name: 'Toko Retail', icon: '🛍️', desc: 'Penjualan produk fisik' },
  { id: 'laundry', name: 'Laundry', icon: '🧺', desc: 'Jasa cuci dan setrika' },
  { id: 'florist', name: 'Florist', icon: '🌸', desc: 'Bunga dan dekorasi' },
  { id: 'other', name: 'Bisnis Lainnya', icon: '🏪', desc: 'Jenis bisnis lainnya' },
]

const DEFAULT_PRODUCTS: Record<string, { name: string; unit: string }[]> = {
  cafe: [{ name: 'Kopi', unit: 'cup' }, { name: 'Teh', unit: 'cup' }, { name: 'Pastry', unit: 'pcs' }],
  retail: [{ name: 'Pakaian', unit: 'pcs' }, { name: 'Aksesoris', unit: 'pcs' }],
  laundry: [{ name: 'Cuci Baju', unit: 'pcs' }, { name: 'Dry Cleaning', unit: 'pcs' }],
  florist: [{ name: 'Buket', unit: 'pcs' }, { name: 'Rangkaian', unit: 'pcs' }],
  other: [],
}

const DEFAULT_FEATURE_SUGGESTIONS: Record<string, Record<string, boolean>> = {
  cafe: { enableInventory: true, enablePayables: true, enableReceivables: false },
  retail: { enableInventory: true, enablePayables: true, enableReceivables: true },
  laundry: { enableInventory: false, enablePayables: true, enableReceivables: true },
  florist: { enableInventory: true, enablePayables: true, enableReceivables: true },
  other: { enableInventory: false, enablePayables: true, enableReceivables: true },
}

const ALL_FEATURES = [
  { key: 'enableGoals', label: '🎯 Target & Goals', desc: 'Tabungan dan target keuangan', alwaysOn: false },
  { key: 'enableBudget', label: '💰 Budget Pengeluaran', desc: 'Batas pengeluaran per kategori dengan notifikasi', alwaysOn: false },
  { key: 'enablePayables', label: '💸 Hutang & Piutang', desc: 'Catat hutang dan tagihan dari/ke kontak', alwaysOn: false },
  { key: 'enableInventory', label: '📦 Inventaris Stok', desc: 'Kelola stok barang dan alert stok menipis', alwaysOn: false },
  { key: 'enableTelegram', label: '💬 Telegram Bot', desc: 'Catat transaksi lewat chat Telegram', alwaysOn: false },
  { key: 'enableTeam', label: '👥 Multi-User Tim', desc: 'Undang admin atau viewer untuk membantu', alwaysOn: false },
]

type FeatureState = {
  enableGoals: boolean
  enableBudget: boolean
  enablePayables: boolean
  enableInventory: boolean
  enableReceivables: boolean
  enableTelegram: boolean
  enableTeam: boolean
}

export default function BusinessSetupPage() {
  const router = useRouter()
  const [checking, setChecking] = useState(true)
  const [isLoading, setIsLoading] = useState(false)
  const [step, setStep] = useState(1)
  const [error, setError] = useState<string | null>(null)
  const [businessName, setBusinessName] = useState('')
  const [businessType, setBusinessType] = useState('')
  const [currency, setCurrency] = useState('IDR')
  const [timezone, setTimezone] = useState('Asia/Jakarta')
  const [products, setProducts] = useState<{ name: string; unit: string }[]>([])
  const [features, setFeatures] = useState<FeatureState>({
    enableGoals: true,
    enableBudget: true,
    enablePayables: true,
    enableInventory: false,
    enableReceivables: true,
    enableTelegram: true,
    enableTeam: false,
  })

  useEffect(() => {
    authClient.getSession().then(({ data }) => {
      if (!data?.session) router.replace('/sign-in')
      else setChecking(false)
    })
  }, [router])

  const handleTypeSelect = (typeId: string) => {
    setBusinessType(typeId)
    setProducts((DEFAULT_PRODUCTS[typeId] || []).map((p) => ({ ...p })))
    const suggestions = DEFAULT_FEATURE_SUGGESTIONS[typeId] || {}
    setFeatures((prev) => ({ ...prev, ...suggestions }))
    setStep(2)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!businessName.trim()) { setError('Nama bisnis diperlukan.'); return }
    setIsLoading(true)
    setError(null)
    try {
      const businessId = await saveBusinessSetup({
        businessName,
        businessType,
        currency,
        timezone,
        products,
      })
      await initFeatureConfig(businessId, 'business', features)
      await completeOnboarding()
      router.push(`/dashboard/${businessId}`)
    } catch {
      setError('Terjadi kesalahan. Silakan coba lagi.')
      setIsLoading(false)
    }
  }

  if (checking) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <p className="text-muted-foreground text-sm">Memuat...</p>
      </div>
    )
  }

  const selectedType = BUSINESS_TYPES.find((t) => t.id === businessType)

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b border-border px-6 py-4 flex items-center gap-2">
        <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-primary text-primary-foreground font-bold text-xs">K</div>
        <span className="font-bold text-foreground">KasAI</span>
      </header>

      <div className="container mx-auto px-6 py-12 max-w-2xl">
        {/* Progress indicator */}
        <div className="flex items-center gap-2 mb-10">
          {[1, 2, 3].map((s, idx) => (
            <>
              <div
                key={s}
                className={`flex h-7 w-7 items-center justify-center rounded-full text-xs font-bold transition-all ${
                  step > s
                    ? 'bg-primary/20 text-primary'
                    : step === s
                    ? 'bg-primary text-primary-foreground'
                    : 'bg-muted text-muted-foreground'
                }`}
              >
                {step > s ? '✓' : s}
              </div>
              {idx < 2 && (
                <div className={`h-0.5 flex-1 transition-colors ${step > s ? 'bg-primary' : 'bg-border'}`} />
              )}
            </>
          ))}
        </div>

        {/* ── Step 1: Jenis bisnis ── */}
        {step === 1 && (
          <>
            <div className="mb-8">
              <h1 className="text-3xl font-bold text-foreground mb-2">Jenis bisnis apa yang Anda jalankan?</h1>
              <p className="text-muted-foreground">Kami akan menyesuaikan kategori, produk, dan fitur secara otomatis</p>
            </div>
            <div className="grid sm:grid-cols-2 gap-4">
              {BUSINESS_TYPES.map((type) => (
                <button
                  key={type.id}
                  onClick={() => handleTypeSelect(type.id)}
                  className="text-left rounded-2xl border-2 border-border bg-card p-6 hover:border-primary hover:shadow-lg hover:shadow-primary/10 transition-all duration-200 group"
                >
                  <div className="text-4xl mb-3">{type.icon}</div>
                  <h3 className="font-semibold text-foreground mb-1">{type.name}</h3>
                  <p className="text-xs text-muted-foreground">{type.desc}</p>
                </button>
              ))}
            </div>
          </>
        )}

        {/* ── Step 2: Detail bisnis ── */}
        {step === 2 && (
          <>
            <div className="mb-8">
              <button onClick={() => setStep(1)} className="text-sm text-primary hover:underline mb-4 block">
                ← Ganti jenis bisnis
              </button>
              <div className="flex items-center gap-3 mb-2">
                <span className="text-3xl">{selectedType?.icon}</span>
                <h1 className="text-3xl font-bold text-foreground">Setup {selectedType?.name}</h1>
              </div>
              <p className="text-muted-foreground">Lengkapi detail bisnis Anda</p>
            </div>

            <div className="space-y-5">
              <div className="space-y-1.5">
                <Label htmlFor="bizName">Nama Bisnis *</Label>
                <Input
                  id="bizName"
                  placeholder="Contoh: Kopi Nusantara, Warung Bersih, dll."
                  value={businessName}
                  onChange={(e) => setBusinessName(e.target.value)}
                  className="h-11"
                  autoFocus
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <Label>Mata Uang</Label>
                  <select
                    value={currency}
                    onChange={(e) => setCurrency(e.target.value)}
                    className="w-full h-11 px-3 border border-input rounded-lg bg-background text-foreground text-sm focus:outline-none focus:ring-2 focus:ring-ring"
                  >
                    {['IDR', 'USD', 'EUR', 'SGD', 'MYR'].map((c) => <option key={c} value={c}>{c}</option>)}
                  </select>
                </div>
                <div className="space-y-1.5">
                  <Label>Zona Waktu</Label>
                  <select
                    value={timezone}
                    onChange={(e) => setTimezone(e.target.value)}
                    className="w-full h-11 px-3 border border-input rounded-lg bg-background text-foreground text-sm focus:outline-none focus:ring-2 focus:ring-ring"
                  >
                    {['Asia/Jakarta', 'Asia/Makassar', 'Asia/Jayapura', 'Asia/Singapore', 'UTC'].map((tz) => <option key={tz} value={tz}>{tz}</option>)}
                  </select>
                </div>
              </div>

              {products.length > 0 && (
                <div className="rounded-xl border border-border bg-muted/30 p-4">
                  <p className="text-sm font-medium text-foreground mb-2">Produk/layanan yang akan dibuat otomatis:</p>
                  <div className="flex flex-wrap gap-2">
                    {products.map((p, i) => (
                      <div key={i} className="flex items-center gap-1 text-xs border border-border bg-card rounded-lg px-2.5 py-1">
                        <span>{p.name}</span>
                        <span className="text-muted-foreground">({p.unit})</span>
                        <button
                          type="button"
                          onClick={() => setProducts(products.filter((_, idx) => idx !== i))}
                          className="text-muted-foreground hover:text-destructive ml-1"
                        >×</button>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              <Button
                onClick={() => {
                  if (!businessName.trim()) { setError('Nama bisnis diperlukan'); return }
                  setError(null)
                  setStep(3)
                }}
                className="w-full h-11 font-semibold"
              >
                Lanjutkan → Pilih Fitur
              </Button>
              {error && <p className="text-sm text-destructive text-center">{error}</p>}
            </div>
          </>
        )}

        {/* ── Step 3: Pilih fitur ── */}
        {step === 3 && (
          <form onSubmit={handleSubmit}>
            <div className="mb-8">
              <button type="button" onClick={() => setStep(2)} className="text-sm text-primary hover:underline mb-4 block">
                ← Kembali
              </button>
              <h1 className="text-3xl font-bold text-foreground mb-2">Fitur apa yang Anda butuhkan?</h1>
              <p className="text-muted-foreground">
                Kami sudah memilihkan fitur yang umum untuk <strong>{selectedType?.name}</strong>.
                Aktifkan atau matikan sesuai kebutuhan — bisa diubah kapan saja.
              </p>
            </div>

            <div className="space-y-3 mb-6">
              {ALL_FEATURES.map((feat) => {
                const isOn = features[feat.key as keyof FeatureState]
                return (
                  <div
                    key={feat.key}
                    className={`rounded-xl border-2 p-4 flex items-center justify-between gap-4 cursor-pointer transition-all ${
                      isOn ? 'border-primary/40 bg-primary/5' : 'border-border bg-card'
                    }`}
                    onClick={() => setFeatures({ ...features, [feat.key]: !isOn })}
                  >
                    <div>
                      <p className="text-sm font-semibold text-foreground">{feat.label}</p>
                      <p className="text-xs text-muted-foreground">{feat.desc}</p>
                    </div>
                    <div className={`shrink-0 h-6 w-11 rounded-full transition-colors flex items-center px-0.5 ${isOn ? 'bg-primary' : 'bg-muted'}`}>
                      <div className={`h-5 w-5 rounded-full bg-white shadow transition-transform ${isOn ? 'translate-x-5' : 'translate-x-0'}`} />
                    </div>
                  </div>
                )
              })}
            </div>

            <div className="rounded-xl border border-amber-200 bg-amber-50 dark:bg-amber-950/20 p-4 mb-5 text-sm text-amber-800 dark:text-amber-300">
              💡 Semua fitur ini gratis dan bisa diubah kapan saja di <strong>Pengaturan → Fitur Aktif</strong>
            </div>

            {error && (
              <div className="rounded-lg bg-destructive/10 border border-destructive/20 px-4 py-3 mb-4">
                <p className="text-sm text-destructive">{error}</p>
              </div>
            )}

            <Button type="submit" disabled={isLoading} className="w-full h-11 font-semibold text-base">
              {isLoading ? '⏳ Menyiapkan bisnis Anda...' : '🚀 Selesai & Mulai KasAI →'}
            </Button>
          </form>
        )}
      </div>
    </div>
  )
}
