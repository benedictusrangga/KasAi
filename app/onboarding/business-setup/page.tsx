'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { authClient } from '@/lib/auth-client'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { saveBusinessSetup, completeOnboarding } from '@/app/actions/onboarding'

const BUSINESS_TYPES = [
  { id: 'cafe', name: 'Cafe / Resto', icon: '☕', desc: 'Minuman, makanan, dan layanan F&B' },
  { id: 'retail', name: 'Toko Retail', icon: '🛍️', desc: 'Penjualan produk fisik' },
  { id: 'laundry', name: 'Laundry', icon: '🧺', desc: 'Jasa cuci dan setrika' },
  { id: 'florist', name: 'Florist', icon: '🌸', desc: 'Bunga dan dekorasi' },
  { id: 'other', name: 'Bisnis Lainnya', icon: '🏪', desc: 'Jenis bisnis lainnya' },
]

const DEFAULT_PRODUCTS: Record<string, { name: string; unit: string }[]> = {
  cafe: [{ name: 'Kopi', unit: 'cup' }, { name: 'Teh', unit: 'cup' }, { name: 'Pastry', unit: 'pcs' }, { name: 'Sandwich', unit: 'pcs' }],
  retail: [{ name: 'Pakaian', unit: 'pcs' }, { name: 'Aksesoris', unit: 'pcs' }, { name: 'Sepatu', unit: 'pcs' }],
  laundry: [{ name: 'Cuci Baju', unit: 'pcs' }, { name: 'Cuci Celana', unit: 'pcs' }, { name: 'Dry Cleaning', unit: 'pcs' }],
  florist: [{ name: 'Mawar', unit: 'tangkai' }, { name: 'Buket', unit: 'pcs' }, { name: 'Rangkaian', unit: 'pcs' }],
  other: [],
}

export default function BusinessSetupPage() {
  const router = useRouter()
  const [checking, setChecking] = useState(true)
  const [isLoading, setIsLoading] = useState(false)
  const [step, setStep] = useState(1)
  const [error, setError] = useState<string | null>(null)
  const [formData, setFormData] = useState({
    businessName: '',
    businessType: '',
    currency: 'IDR',
    timezone: 'Asia/Jakarta',
    products: [] as { name: string; unit: string }[],
  })

  useEffect(() => {
    authClient.getSession().then(({ data }) => {
      if (!data?.session) router.replace('/sign-in')
      else setChecking(false)
    })
  }, [router])

  const handleTypeSelect = (typeId: string) => {
    setFormData({
      ...formData,
      businessType: typeId,
      products: (DEFAULT_PRODUCTS[typeId] || []).map((p) => ({ ...p })),
    })
    setStep(2)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!formData.businessName.trim()) { setError('Nama bisnis diperlukan.'); return }
    setIsLoading(true)
    setError(null)
    try {
      const businessId = await saveBusinessSetup({
        businessName: formData.businessName,
        businessType: formData.businessType,
        currency: formData.currency,
        timezone: formData.timezone,
        products: formData.products,
      })
      await completeOnboarding()
      // Langsung ke dashboard bisnis yang baru dibuat
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

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b border-border px-6 py-4 flex items-center gap-2">
        <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-primary text-primary-foreground font-bold text-xs">K</div>
        <span className="font-bold text-foreground">KasAI</span>
      </header>

      <div className="container mx-auto px-6 py-16 max-w-2xl">
        {/* Progress */}
        <div className="flex items-center gap-2 mb-10">
          <div className="flex h-7 w-7 items-center justify-center rounded-full bg-primary/30 text-primary text-xs font-bold">✓</div>
          <div className="h-0.5 flex-1 bg-primary" />
          <div className="flex h-7 w-7 items-center justify-center rounded-full bg-primary text-primary-foreground text-xs font-bold">2</div>
          <div className="h-0.5 flex-1 bg-border" />
          <div className="flex h-7 w-7 items-center justify-center rounded-full bg-muted text-muted-foreground text-xs font-bold">3</div>
        </div>

        {step === 1 ? (
          <>
            <div className="mb-8">
              <h1 className="text-3xl font-bold text-foreground mb-2">Jenis bisnis apa yang Anda jalankan?</h1>
              <p className="text-muted-foreground">Kami akan menyesuaikan produk dan kategori default untuk bisnis Anda</p>
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
        ) : (
          <>
            <div className="mb-8">
              <button onClick={() => setStep(1)} className="text-sm text-primary hover:underline mb-4 block">
                ← Ganti jenis bisnis
              </button>
              <div className="flex items-center gap-3 mb-2">
                <span className="text-3xl">{BUSINESS_TYPES.find((t) => t.id === formData.businessType)?.icon}</span>
                <h1 className="text-3xl font-bold text-foreground">
                  Setup {BUSINESS_TYPES.find((t) => t.id === formData.businessType)?.name}
                </h1>
              </div>
              <p className="text-muted-foreground">Lengkapi detail bisnis Anda</p>
            </div>

            <form onSubmit={handleSubmit} className="space-y-5">
              <div className="space-y-1.5">
                <Label htmlFor="bizName">Nama Bisnis *</Label>
                <Input
                  id="bizName"
                  placeholder="Contoh: Kopi Nusantara, Laundry Bersih, dll."
                  value={formData.businessName}
                  onChange={(e) => setFormData({ ...formData, businessName: e.target.value })}
                  required
                  className="h-11"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <Label>Mata Uang</Label>
                  <select
                    value={formData.currency}
                    onChange={(e) => setFormData({ ...formData, currency: e.target.value })}
                    className="w-full h-11 px-3 border border-input rounded-lg bg-background text-foreground text-sm focus:outline-none focus:ring-2 focus:ring-ring"
                  >
                    {['IDR', 'USD', 'EUR', 'SGD', 'MYR'].map((c) => <option key={c} value={c}>{c}</option>)}
                  </select>
                </div>
                <div className="space-y-1.5">
                  <Label>Zona Waktu</Label>
                  <select
                    value={formData.timezone}
                    onChange={(e) => setFormData({ ...formData, timezone: e.target.value })}
                    className="w-full h-11 px-3 border border-input rounded-lg bg-background text-foreground text-sm focus:outline-none focus:ring-2 focus:ring-ring"
                  >
                    {['Asia/Jakarta', 'Asia/Makassar', 'Asia/Jayapura', 'Asia/Singapore', 'UTC'].map((tz) => <option key={tz} value={tz}>{tz}</option>)}
                  </select>
                </div>
              </div>

              {formData.products.length > 0 && (
                <div className="space-y-2">
                  <Label>Produk / Layanan Default</Label>
                  <p className="text-xs text-muted-foreground">Produk ini akan ditambahkan otomatis. Anda bisa mengubahnya nanti di Pengaturan.</p>
                  <div className="flex flex-wrap gap-2 mt-2">
                    {formData.products.map((p, i) => (
                      <div key={i} className="flex items-center gap-1.5 rounded-lg border border-border bg-muted px-3 py-1.5 text-sm">
                        <span>{p.name}</span>
                        <span className="text-muted-foreground text-xs">({p.unit})</span>
                        <button
                          type="button"
                          onClick={() => setFormData({ ...formData, products: formData.products.filter((_, idx) => idx !== i) })}
                          className="text-muted-foreground hover:text-destructive ml-1 text-xs"
                        >
                          ×
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {error && (
                <div className="rounded-lg bg-destructive/10 border border-destructive/20 px-4 py-3">
                  <p className="text-sm text-destructive">{error}</p>
                </div>
              )}

              <Button type="submit" disabled={isLoading} className="w-full h-11 font-semibold">
                {isLoading ? 'Menyiapkan bisnis...' : 'Selesai & Mulai →'}
              </Button>
            </form>
          </>
        )}
      </div>
    </div>
  )
}
