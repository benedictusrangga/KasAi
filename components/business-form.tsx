'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { createBusiness } from '@/app/actions/business'
import { completeOnboarding } from '@/app/actions/onboarding'
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

const BUSINESS_TYPES = [
  { value: 'cafe', label: '☕ Cafe / Resto' },
  { value: 'retail', label: '🛍️ Toko Retail' },
  { value: 'laundry', label: '🧺 Laundry' },
  { value: 'florist', label: '🌸 Florist' },
  { value: 'other', label: '🏪 Bisnis Lainnya' },
]

export function BusinessForm() {
  const router = useRouter()
  const [name, setName] = useState('')
  const [type, setType] = useState<'florist' | 'laundry' | 'cafe' | 'retail' | 'other'>('cafe')
  const [description, setDescription] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)
    setLoading(true)
    try {
      const { id } = await createBusiness(name, type, description)
      await completeOnboarding()
      router.push(`/dashboard/${id}`)
      router.refresh()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Gagal membuat bisnis. Coba lagi.')
      setLoading(false)
    }
  }

  return (
    <div className="w-full max-w-lg">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-foreground mb-2">Tambah Bisnis Baru</h1>
        <p className="text-muted-foreground">Buat bisnis baru untuk mulai mencatat transaksi</p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-5">
        <div className="space-y-1.5">
          <Label htmlFor="name">Nama Bisnis *</Label>
          <Input
            id="name"
            placeholder="Contoh: Kopi Nusantara, Laundry Bersih"
            value={name}
            onChange={(e) => setName(e.target.value)}
            required
            className="h-11"
          />
        </div>

        <div className="space-y-1.5">
          <Label htmlFor="type">Jenis Bisnis *</Label>
          <Select value={type} onValueChange={(v) => setType(v as any)}>
            <SelectTrigger id="type" className="h-11">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {BUSINESS_TYPES.map((bt) => (
                <SelectItem key={bt.value} value={bt.value}>{bt.label}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-1.5">
          <Label htmlFor="description">Deskripsi (Opsional)</Label>
          <Input
            id="description"
            placeholder="Deskripsi singkat bisnis Anda"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            className="h-11"
          />
        </div>

        {error && (
          <div className="rounded-lg bg-destructive/10 border border-destructive/20 px-4 py-3">
            <p className="text-sm text-destructive">{error}</p>
          </div>
        )}

        <Button type="submit" disabled={loading} className="w-full h-11 font-semibold">
          {loading ? 'Membuat bisnis...' : 'Buat Bisnis →'}
        </Button>
      </form>
    </div>
  )
}
