'use client'

import { useState, useEffect } from 'react'
import { useSearchParams, useRouter } from 'next/navigation'
import { authClient } from '@/lib/auth-client'
import { KasAILogo } from '@/components/logo'
import Link from 'next/link'

export function SetPasswordForm() {
  const searchParams = useSearchParams()
  const router = useRouter()
  const token = searchParams?.get('token') ?? ''

  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState(false)
  const [successEmail, setSuccessEmail] = useState<string | null>(null)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)

    if (password.length < 8) {
      setError('Password minimal 8 karakter.')
      return
    }
    if (password !== confirmPassword) {
      setError('Password tidak cocok. Periksa kembali.')
      return
    }

    setLoading(true)
    try {
      const res = await fetch('/api/auth/set-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ token, password }),
      })

      if (!res.ok) {
        const msg = await res.text().catch(() => 'Gagal mengatur password.')
        setError(msg || 'Gagal mengatur password.')
        setLoading(false)
        return
      }

      const data = await res.json().catch(() => ({}))
      setSuccessEmail(data.email ?? null)
      setSuccess(true)

      // Auto-login setelah set password berhasil
      if (data.email) {
        await authClient.signIn.email({ email: data.email, password }).catch(() => {})
      }

      setTimeout(() => router.push('/dashboard'), 2000)
    } catch {
      setError('Terjadi kesalahan. Coba lagi.')
      setLoading(false)
    }
  }

  // ── Password strength ──────────────────────────────────────────────────────
  const strength = password.length === 0 ? 0
    : password.length >= 12 ? 4
    : password.length >= 10 ? 3
    : password.length >= 8 ? 2
    : 1
  const strengthColors = ['', 'bg-red-500', 'bg-amber-500', 'bg-yellow-400', 'bg-emerald-500']

  // ── Success ────────────────────────────────────────────────────────────────
  if (success) {
    return (
      <div className="min-h-screen bg-[#0a0a0a] flex items-center justify-center px-6">
        <div className="w-full max-w-sm text-center">
          <div className="flex justify-center mb-8">
            <KasAILogo href="/" size="md" dark={true} />
          </div>
          <div className="rounded-2xl border border-white/[0.08] bg-white/[0.03] p-8">
            <div className="text-4xl mb-4">🎉</div>
            <h1 className="text-xl font-bold text-white mb-2">Password Berhasil Diatur!</h1>
            <p className="text-sm text-white/45 mb-4">
              {successEmail ? `Akun ${successEmail} siap digunakan.` : 'Akun Anda siap digunakan.'}{' '}
              Mengarahkan ke dashboard...
            </p>
            <div className="h-1.5 w-full bg-white/10 rounded-full overflow-hidden">
              <div className="h-full bg-violet-500 rounded-full animate-pulse" style={{ width: '70%' }} />
            </div>
          </div>
        </div>
      </div>
    )
  }

  // ── No token ───────────────────────────────────────────────────────────────
  if (!token) {
    return (
      <div className="min-h-screen bg-[#0a0a0a] flex items-center justify-center px-6">
        <div className="w-full max-w-sm text-center">
          <div className="flex justify-center mb-8">
            <KasAILogo href="/" size="md" dark={true} />
          </div>
          <div className="rounded-2xl border border-red-500/20 bg-red-500/10 p-8">
            <div className="text-4xl mb-4">❌</div>
            <h1 className="text-xl font-bold text-white mb-2">Link Tidak Valid</h1>
            <p className="text-sm text-white/45 mb-6">
              Link undangan tidak ditemukan atau sudah kadaluarsa. Minta admin untuk kirim ulang undangan.
            </p>
            <Link
              href="/sign-in"
              className="block w-full rounded-xl bg-white text-[#0a0a0a] text-sm font-semibold py-2.5 hover:bg-white/90 transition-all text-center"
            >
              Kembali ke Login
            </Link>
          </div>
        </div>
      </div>
    )
  }

  // ── Form ───────────────────────────────────────────────────────────────────
  return (
    <div className="min-h-screen bg-[#0a0a0a] flex items-center justify-center px-6">
      <div className="w-full max-w-sm">
        <div className="flex justify-center mb-10">
          <KasAILogo href="/" size="md" dark={true} />
        </div>

        <div className="mb-8 text-center">
          <h1 className="text-2xl font-bold text-white mb-2">Atur Password Anda</h1>
          <p className="text-sm text-white/45">
            Buat password untuk mengakses akun KasAI yang telah dibuat untuk Anda.
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Password */}
          <div className="space-y-1.5">
            <label className="text-xs font-medium text-white/60 uppercase tracking-wider">
              Password Baru
            </label>
            <div className="relative">
              <input
                type={showPassword ? 'text' : 'password'}
                placeholder="Minimal 8 karakter"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                minLength={8}
                autoComplete="new-password"
                className="w-full h-11 rounded-xl border border-white/[0.1] bg-white/[0.05] px-4 pr-11 text-sm text-white placeholder-white/25 focus:outline-none focus:border-violet-500/60 focus:bg-white/[0.07] transition-all"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-white/30 hover:text-white/60 transition-colors"
              >
                {showPassword ? (
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M17.94 17.94A10.07 10.07 0 0112 20c-7 0-11-8-11-8a18.45 18.45 0 015.06-5.94M9.9 4.24A9.12 9.12 0 0112 4c7 0 11 8 11 8a18.5 18.5 0 01-2.16 3.19m-6.72-1.07a3 3 0 11-4.24-4.24M1 1l22 22"/>
                  </svg>
                ) : (
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/>
                    <circle cx="12" cy="12" r="3"/>
                  </svg>
                )}
              </button>
            </div>

            {/* Strength bar */}
            {password.length > 0 && (
              <div className="flex gap-1 mt-1.5">
                {[1, 2, 3, 4].map((level) => (
                  <div
                    key={level}
                    className={`h-1 flex-1 rounded-full transition-all ${
                      level <= strength ? strengthColors[strength] : 'bg-white/10'
                    }`}
                  />
                ))}
              </div>
            )}
          </div>

          {/* Confirm */}
          <div className="space-y-1.5">
            <label className="text-xs font-medium text-white/60 uppercase tracking-wider">
              Konfirmasi Password
            </label>
            <input
              type={showPassword ? 'text' : 'password'}
              placeholder="Ulangi password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              required
              autoComplete="new-password"
              className={`w-full h-11 rounded-xl border bg-white/[0.05] px-4 text-sm text-white placeholder-white/25 focus:outline-none transition-all ${
                confirmPassword && confirmPassword !== password
                  ? 'border-red-500/50 focus:border-red-500/70'
                  : confirmPassword && confirmPassword === password
                  ? 'border-emerald-500/50 focus:border-emerald-500/70'
                  : 'border-white/[0.1] focus:border-violet-500/60 focus:bg-white/[0.07]'
              }`}
            />
            {confirmPassword && confirmPassword === password && (
              <p className="text-xs text-emerald-400">✓ Password cocok</p>
            )}
            {confirmPassword && confirmPassword !== password && (
              <p className="text-xs text-red-400">✗ Password tidak cocok</p>
            )}
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

          <button
            type="submit"
            disabled={loading || !password || !confirmPassword || password !== confirmPassword}
            className="w-full h-11 rounded-xl bg-white text-[#0a0a0a] text-sm font-semibold hover:bg-white/90 disabled:opacity-40 disabled:cursor-not-allowed transition-all mt-2 flex items-center justify-center gap-2"
          >
            {loading ? (
              <>
                <svg className="animate-spin" width="16" height="16" viewBox="0 0 24 24" fill="none">
                  <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="2" strokeOpacity="0.25"/>
                  <path d="M12 2a10 10 0 0110 10" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
                </svg>
                Menyimpan...
              </>
            ) : (
              <>
                Atur Password & Masuk
                <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
                  <path d="M3 7h8M7 3l4 4-4 4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
              </>
            )}
          </button>
        </form>

        <p className="text-xs text-white/25 text-center mt-6">
          Sudah punya password?{' '}
          <Link href="/sign-in" className="text-violet-400 hover:text-violet-300 transition-colors">
            Login langsung
          </Link>
        </p>
      </div>
    </div>
  )
}
