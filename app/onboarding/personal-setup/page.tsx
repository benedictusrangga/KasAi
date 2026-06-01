'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { authClient } from '@/lib/auth-client'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { savePersonalDetails, completeOnboarding } from '@/app/actions/onboarding'

export default function PersonalSetupPage() {
  const router = useRouter()
  const [checking, setChecking] = useState(true)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [formData, setFormData] = useState({
    name: '',
    currency: 'IDR',
    timezone: 'Asia/Jakarta',
  })

  useEffect(() => {
    authClient.getSession().then(({ data }) => {
      if (!data?.session) router.replace('/sign-in')
      else {
        setFormData((prev) => ({ ...prev, name: data.user?.name || '' }))
        setChecking(false)
      }
    })
  }, [router])

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    if (!formData.name.trim()) { setError('Nama diperlukan.'); return }
    setIsLoading(true)
    setError(null)
    try {
      const { businessId } = await savePersonalDetails(formData.name, formData.currency, formData.timezone)
      await completeOnboarding()
      // Personal langsung ke dashboard bisnis mereka
      router.push(`/dashboard/${businessId}`)
    } catch (err) {
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

      <div className="container mx-auto px-6 py-16 max-w-lg">
        {/* Progress */}
        <div className="flex items-center gap-2 mb-10">
          <div className="flex h-7 w-7 items-center justify-center rounded-full bg-primary/30 text-primary text-xs font-bold">✓</div>
          <div className="h-0.5 flex-1 bg-primary" />
          <div className="flex h-7 w-7 items-center justify-center rounded-full bg-primary text-primary-foreground text-xs font-bold">2</div>
          <div className="h-0.5 flex-1 bg-border" />
          <div className="flex h-7 w-7 items-center justify-center rounded-full bg-muted text-muted-foreground text-xs font-bold">3</div>
        </div>

        <div className="mb-8">
          <h1 className="text-3xl font-bold text-foreground mb-2">Setup Akun Personal</h1>
          <p className="text-muted-foreground">Lengkapi informasi dasar untuk memulai</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-5">
          <div className="space-y-1.5">
            <Label htmlFor="name">Nama Lengkap *</Label>
            <Input
              id="name"
              placeholder="Budi Santoso"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              required
              className="h-11"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <Label htmlFor="currency">Mata Uang</Label>
              <select
                id="currency"
                value={formData.currency}
                onChange={(e) => setFormData({ ...formData, currency: e.target.value })}
                className="w-full h-11 px-3 border border-input rounded-lg bg-background text-foreground text-sm focus:outline-none focus:ring-2 focus:ring-ring"
              >
                {['IDR', 'USD', 'EUR', 'SGD', 'MYR'].map((c) => (
                  <option key={c} value={c}>{c}</option>
                ))}
              </select>
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="timezone">Zona Waktu</Label>
              <select
                id="timezone"
                value={formData.timezone}
                onChange={(e) => setFormData({ ...formData, timezone: e.target.value })}
                className="w-full h-11 px-3 border border-input rounded-lg bg-background text-foreground text-sm focus:outline-none focus:ring-2 focus:ring-ring"
              >
                {['Asia/Jakarta', 'Asia/Makassar', 'Asia/Jayapura', 'Asia/Singapore', 'UTC'].map((tz) => (
                  <option key={tz} value={tz}>{tz}</option>
                ))}
              </select>
            </div>
          </div>

          {error && (
            <div className="rounded-lg bg-destructive/10 border border-destructive/20 px-4 py-3">
              <p className="text-sm text-destructive">{error}</p>
            </div>
          )}

          <Button type="submit" disabled={isLoading} className="w-full h-11 font-semibold">
            {isLoading ? 'Menyiapkan akun...' : 'Selesai & Mulai →'}
          </Button>
        </form>
      </div>
    </div>
  )
}
