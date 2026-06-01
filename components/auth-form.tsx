'use client'

import { useState } from 'react'
import Link from 'next/link'
import { authClient } from '@/lib/auth-client'
import { KasAILogo } from '@/components/logo'

export function AuthForm({ mode }: { mode: 'sign-in' | 'sign-up' }) {
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
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
            window.location.href = '/onboarding/account-type'
            return
          }
        }
      } catch {
        // fallback
      }

      window.location.href = '/dashboard'
    } catch {
      setError('Terjadi kesalahan tak terduga.')
      setLoading(false)
    }
  }

  const features = [
    { icon: '💬', text: 'Catat transaksi via Telegram' },
    { icon: '📷', text: 'Scan struk dengan AI' },
    { icon: '📊', text: 'Laporan keuangan real-time' },
    { icon: '📄', text: 'Export PDF langsung dari chat' },
  ]

  return (
    <div className="min-h-screen bg-[#0a0a0a] flex">
      {/* ── LEFT PANEL — branding ── */}
      <div className="hidden lg:flex lg:w-[52%] relative flex-col justify-between p-14 overflow-hidden">
        {/* Background */}
        <div className="absolute inset-0">
          <div className="absolute inset-0 bg-gradient-to-br from-violet-950/80 via-[#0a0a0a] to-indigo-950/60" />
          <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-violet-500/30 to-transparent" />
          <div className="absolute bottom-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-indigo-500/20 to-transparent" />
          {/* Grid */}
          <div
            className="absolute inset-0 opacity-[0.025]"
            style={{
              backgroundImage: `linear-gradient(rgba(255,255,255,0.6) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.6) 1px, transparent 1px)`,
              backgroundSize: '50px 50px',
            }}
          />
          {/* Glow orbs */}
          <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-violet-600/10 rounded-full blur-[100px]" />
          <div className="absolute bottom-1/4 right-1/4 w-64 h-64 bg-indigo-600/10 rounded-full blur-[80px]" />
        </div>

        {/* Content */}
        <div className="relative">
          <KasAILogo href="/" size="md" dark={true} />
        </div>

        <div className="relative space-y-10">
          {/* Headline */}
          <div>
            <h2 className="text-4xl font-bold text-white leading-tight mb-3">
              {isSignUp
                ? 'Mulai kelola keuangan bisnis lebih cerdas.'
                : 'Selamat datang kembali.'}
            </h2>
            <p className="text-white/45 text-base leading-relaxed">
              {isSignUp
                ? 'Bergabung dengan ribuan pemilik UMKM Indonesia yang sudah menggunakan KasAI.'
                : 'Bisnis Anda menunggu. Masuk dan lihat laporan keuangan terbaru Anda.'}
            </p>
          </div>

          {/* Feature list */}
          <div className="space-y-3">
            {features.map((f) => (
              <div key={f.text} className="flex items-center gap-3">
                <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-white/[0.06] border border-white/[0.08] text-sm">
                  {f.icon}
                </div>
                <span className="text-sm text-white/60">{f.text}</span>
              </div>
            ))}
          </div>

          {/* Testimonial */}
          <div className="rounded-2xl border border-white/[0.08] bg-white/[0.03] p-5 backdrop-blur-sm">
            <div className="flex gap-1 mb-3">
              {[...Array(5)].map((_, i) => (
                <svg key={i} width="14" height="14" viewBox="0 0 14 14" fill="#fbbf24">
                  <path d="M7 1l1.8 3.6L13 5.3l-3 2.9.7 4.1L7 10.4l-3.7 1.9.7-4.1-3-2.9 4.2-.7z"/>
                </svg>
              ))}
            </div>
            <p className="text-sm text-white/70 leading-relaxed mb-4">
              "Sekarang saya bisa tahu laba harian cafe saya hanya dari chat Telegram. Tidak perlu buka laptop sama sekali."
            </p>
            <div className="flex items-center gap-3">
              <div className="h-8 w-8 rounded-full bg-gradient-to-br from-violet-500 to-indigo-600 flex items-center justify-center text-white text-xs font-bold">
                B
              </div>
              <div>
                <p className="text-xs font-semibold text-white">Budi Santoso</p>
                <p className="text-xs text-white/40">Pemilik Kopi Nusantara, Jakarta</p>
              </div>
            </div>
          </div>
        </div>

        {/* Stats */}
        <div className="relative flex gap-8">
          {[
            { value: '2.400+', label: 'UMKM Aktif' },
            { value: '18rb+', label: 'Transaksi/Hari' },
            { value: '3 jam', label: 'Hemat/Hari' },
          ].map((s) => (
            <div key={s.label}>
              <p className="text-xl font-bold text-white">{s.value}</p>
              <p className="text-xs text-white/35 mt-0.5">{s.label}</p>
            </div>
          ))}
        </div>
      </div>

      {/* ── RIGHT PANEL — form ── */}
      <div className="flex-1 flex items-center justify-center px-6 py-12 relative">
        {/* Subtle right panel bg */}
        <div className="absolute inset-0 bg-[#0d0d0d]" />
        <div className="absolute top-0 left-0 bottom-0 w-px bg-gradient-to-b from-transparent via-white/[0.06] to-transparent" />

        <div className="relative w-full max-w-[380px]">
          {/* Mobile logo */}
          <div className="flex justify-center mb-10 lg:hidden">
            <KasAILogo href="/" size="md" dark={true} />
          </div>

          {/* Form header */}
          <div className="mb-8">
            <h1 className="text-2xl font-bold text-white mb-2">
              {isSignUp ? 'Buat akun gratis' : 'Masuk ke KasAI'}
            </h1>
            <p className="text-sm text-white/45">
              {isSignUp
                ? 'Tidak perlu kartu kredit · Setup dalam 2 menit'
                : 'Masukkan email dan password Anda'}
            </p>
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit} className="space-y-4">
            {isSignUp && (
              <div className="space-y-1.5">
                <label className="text-xs font-medium text-white/60 uppercase tracking-wider">
                  Nama Lengkap
                </label>
                <input
                  type="text"
                  placeholder="Budi Santoso"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  required
                  autoComplete="name"
                  className="w-full h-11 rounded-xl border border-white/[0.1] bg-white/[0.05] px-4 text-sm text-white placeholder-white/25 focus:outline-none focus:border-violet-500/60 focus:bg-white/[0.07] transition-all"
                />
              </div>
            )}

            <div className="space-y-1.5">
              <label className="text-xs font-medium text-white/60 uppercase tracking-wider">
                Email
              </label>
              <input
                type="email"
                placeholder="budi@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                autoComplete="email"
                className="w-full h-11 rounded-xl border border-white/[0.1] bg-white/[0.05] px-4 text-sm text-white placeholder-white/25 focus:outline-none focus:border-violet-500/60 focus:bg-white/[0.07] transition-all"
              />
            </div>

            <div className="space-y-1.5">
              <div className="flex items-center justify-between">
                <label className="text-xs font-medium text-white/60 uppercase tracking-wider">
                  Password
                </label>
                {!isSignUp && (
                  <Link href="/sign-up" className="text-xs text-violet-400 hover:text-violet-300 transition-colors">
                    Lupa password?
                  </Link>
                )}
              </div>
              <div className="relative">
                <input
                  type={showPassword ? 'text' : 'password'}
                  placeholder={isSignUp ? 'Minimal 8 karakter' : '••••••••'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  minLength={8}
                  autoComplete={isSignUp ? 'new-password' : 'current-password'}
                  className="w-full h-11 rounded-xl border border-white/[0.1] bg-white/[0.05] px-4 pr-11 text-sm text-white placeholder-white/25 focus:outline-none focus:border-violet-500/60 focus:bg-white/[0.07] transition-all"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-white/30 hover:text-white/60 transition-colors"
                >
                  {showPassword ? (
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                      <path d="M17.94 17.94A10.07 10.07 0 0112 20c-7 0-11-8-11-8a18.45 18.45 0 015.06-5.94M9.9 4.24A9.12 9.12 0 0112 4c7 0 11 8 11 8a18.5 18.5 0 01-2.16 3.19m-6.72-1.07a3 3 0 11-4.24-4.24M1 1l22 22" strokeLinecap="round" strokeLinejoin="round"/>
                    </svg>
                  ) : (
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                      <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" strokeLinecap="round" strokeLinejoin="round"/>
                      <circle cx="12" cy="12" r="3" strokeLinecap="round" strokeLinejoin="round"/>
                    </svg>
                  )}
                </button>
              </div>
            </div>

            {/* Error */}
            {error && (
              <div className="rounded-xl border border-red-500/20 bg-red-500/10 px-4 py-3 flex items-start gap-2.5">
                <svg className="shrink-0 mt-0.5" width="14" height="14" viewBox="0 0 14 14" fill="none">
                  <circle cx="7" cy="7" r="6" stroke="#f87171" strokeWidth="1.2"/>
                  <path d="M7 4v3.5M7 9.5v.5" stroke="#f87171" strokeWidth="1.2" strokeLinecap="round"/>
                </svg>
                <p className="text-sm text-red-400">{error}</p>
              </div>
            )}

            {/* Submit */}
            <button
              type="submit"
              disabled={loading}
              className="w-full h-11 rounded-xl bg-white text-[#0a0a0a] text-sm font-semibold hover:bg-white/90 disabled:opacity-50 disabled:cursor-not-allowed transition-all shadow-[0_4px_20px_rgba(255,255,255,0.1)] flex items-center justify-center gap-2 mt-2"
            >
              {loading ? (
                <>
                  <svg className="animate-spin" width="16" height="16" viewBox="0 0 24 24" fill="none">
                    <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="2" strokeOpacity="0.25"/>
                    <path d="M12 2a10 10 0 0110 10" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
                  </svg>
                  Memproses...
                </>
              ) : isSignUp ? (
                <>
                  Buat Akun Gratis
                  <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
                    <path d="M3 7h8M7 3l4 4-4 4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                  </svg>
                </>
              ) : (
                'Masuk'
              )}
            </button>
          </form>

          {/* Terms */}
          {isSignUp && (
            <p className="text-xs text-white/25 text-center mt-4 leading-relaxed">
              Dengan mendaftar, Anda menyetujui{' '}
              <span className="text-white/40 hover:text-white/60 cursor-pointer transition-colors">Syarat & Ketentuan</span>
              {' '}dan{' '}
              <span className="text-white/40 hover:text-white/60 cursor-pointer transition-colors">Kebijakan Privasi</span>
              {' '}kami.
            </p>
          )}

          {/* Divider */}
          <div className="flex items-center gap-4 my-6">
            <div className="flex-1 h-px bg-white/[0.06]" />
            <span className="text-xs text-white/25">atau</span>
            <div className="flex-1 h-px bg-white/[0.06]" />
          </div>

          {/* Switch mode */}
          <p className="text-sm text-white/40 text-center">
            {isSignUp ? 'Sudah punya akun?' : 'Belum punya akun?'}{' '}
            <Link
              href={isSignUp ? '/sign-in' : '/sign-up'}
              className="text-violet-400 font-medium hover:text-violet-300 transition-colors"
            >
              {isSignUp ? 'Masuk' : 'Daftar gratis →'}
            </Link>
          </p>

          {/* Back to home */}
          <div className="mt-8 text-center">
            <Link
              href="/"
              className="inline-flex items-center gap-1.5 text-xs text-white/25 hover:text-white/50 transition-colors"
            >
              <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
                <path d="M8 6H4M6 4L4 6l2 2" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
              Kembali ke beranda
            </Link>
          </div>
        </div>
      </div>
    </div>
  )
}
