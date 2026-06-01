'use client'

import { useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { authClient } from '@/lib/auth-client'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'

export function AuthForm({ mode }: { mode: 'sign-in' | 'sign-up' }) {
  const router = useRouter()
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)

  const isSignUp = mode === 'sign-up'

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)
    setLoading(true)

    try {
      const { error } = isSignUp
        ? await authClient.signUp.email({ email, password, name })
        : await authClient.signIn.email({ email, password })

      if (error) {
        setError(error.message ?? 'Terjadi kesalahan. Coba lagi.')
        setLoading(false)
        return
      }

      try {
        const res = await fetch('/api/onboarding/status')
        if (res.ok) {
          const data = await res.json()
          if (data?.needsSetup) {
            router.push('/onboarding/account-type')
            return
          }
        }
      } catch {
        // fallback
      }

      router.push('/dashboard')
      router.refresh()
    } catch {
      setError('Terjadi kesalahan tak terduga.')
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-background flex">
      {/* Left panel — branding */}
      <div className="hidden lg:flex lg:w-1/2 bg-primary flex-col justify-between p-12">
        <div className="flex items-center gap-2">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary-foreground/20 text-primary-foreground font-bold text-sm">
            K
          </div>
          <span className="text-xl font-bold text-primary-foreground">KasAI</span>
        </div>

        <div>
          <blockquote className="text-primary-foreground/90 text-xl font-medium leading-relaxed mb-6">
            "Sekarang saya bisa tahu laba harian cafe saya hanya dari chat Telegram. Tidak perlu buka laptop sama sekali."
          </blockquote>
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-full bg-primary-foreground/20 flex items-center justify-center text-primary-foreground font-bold">
              B
            </div>
            <div>
              <p className="text-primary-foreground font-semibold text-sm">Budi Santoso</p>
              <p className="text-primary-foreground/70 text-xs">Pemilik Kopi Nusantara, Jakarta</p>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-3 gap-4">
          {[
            { label: 'UMKM Aktif', value: '2.400+' },
            { label: 'Transaksi/Hari', value: '18.000+' },
            { label: 'Hemat Waktu', value: '3 jam/hari' },
          ].map((s) => (
            <div key={s.label}>
              <p className="text-2xl font-bold text-primary-foreground">{s.value}</p>
              <p className="text-xs text-primary-foreground/70 mt-1">{s.label}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Right panel — form */}
      <div className="flex-1 flex items-center justify-center px-6 py-12">
        <div className="w-full max-w-sm">
          {/* Mobile logo */}
          <div className="flex items-center gap-2 mb-8 lg:hidden">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary text-primary-foreground font-bold text-sm">K</div>
            <span className="text-xl font-bold text-foreground">KasAI</span>
          </div>

          <div className="mb-8">
            <h1 className="text-2xl font-bold text-foreground">
              {isSignUp ? 'Buat akun baru' : 'Selamat datang kembali'}
            </h1>
            <p className="text-sm text-muted-foreground mt-1">
              {isSignUp
                ? 'Daftar gratis dan mulai kelola keuangan bisnis Anda'
                : 'Masuk ke akun KasAI Anda'}
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            {isSignUp && (
              <div className="space-y-1.5">
                <Label htmlFor="name">Nama Lengkap</Label>
                <Input
                  id="name"
                  placeholder="Budi Santoso"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  required
                  autoComplete="name"
                  className="h-11"
                />
              </div>
            )}
            <div className="space-y-1.5">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                placeholder="budi@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                autoComplete="email"
                className="h-11"
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="password">Password</Label>
              <Input
                id="password"
                type="password"
                placeholder="Minimal 8 karakter"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                minLength={8}
                autoComplete={isSignUp ? 'new-password' : 'current-password'}
                className="h-11"
              />
            </div>

            {error && (
              <div className="rounded-lg bg-destructive/10 border border-destructive/20 px-4 py-3">
                <p className="text-sm text-destructive">{error}</p>
              </div>
            )}

            <Button type="submit" disabled={loading} className="w-full h-11 font-semibold">
              {loading
                ? 'Memproses...'
                : isSignUp
                  ? 'Buat Akun Gratis'
                  : 'Masuk'}
            </Button>
          </form>

          {isSignUp && (
            <p className="text-xs text-muted-foreground text-center mt-4">
              Dengan mendaftar, Anda menyetujui Syarat & Ketentuan dan Kebijakan Privasi kami.
            </p>
          )}

          <p className="text-sm text-muted-foreground text-center mt-6">
            {isSignUp ? 'Sudah punya akun? ' : 'Belum punya akun? '}
            <Link
              href={isSignUp ? '/sign-in' : '/sign-up'}
              className="text-primary font-medium hover:underline underline-offset-4"
            >
              {isSignUp ? 'Masuk' : 'Daftar gratis'}
            </Link>
          </p>
        </div>
      </div>
    </div>
  )
}
