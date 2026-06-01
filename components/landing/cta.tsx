'use client'

import Link from 'next/link'
import { useTheme } from './theme-provider'

export function LandingCta() {
  const { theme } = useTheme()
  const isDark = theme === 'dark'

  return (
    <section className="py-32 relative overflow-hidden"
      style={{ background: isDark ? '#0a0a0a' : '#fafafa' }}>
      <div className="max-w-6xl mx-auto px-6">
        <div className="relative rounded-3xl overflow-hidden">

          {/* Background layers */}
          <div className="absolute inset-0"
            style={{
              background: isDark
                ? 'linear-gradient(135deg, rgba(124,58,237,0.25) 0%, rgba(99,102,241,0.15) 50%, rgba(59,130,246,0.1) 100%)'
                : 'linear-gradient(135deg, rgba(124,58,237,0.1) 0%, rgba(99,102,241,0.07) 50%, rgba(59,130,246,0.05) 100%)',
            }} />

          {/* Grid */}
          <div className="absolute inset-0"
            style={{
              backgroundImage: isDark
                ? `linear-gradient(rgba(255,255,255,1) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,1) 1px, transparent 1px)`
                : `linear-gradient(rgba(0,0,0,1) 1px, transparent 1px), linear-gradient(90deg, rgba(0,0,0,1) 1px, transparent 1px)`,
              backgroundSize: '48px 48px',
              opacity: isDark ? 0.035 : 0.04,
            }} />

          {/* Border */}
          <div className="absolute inset-0 rounded-3xl"
            style={{ border: isDark ? '1px solid rgba(255,255,255,0.08)' : '1px solid rgba(0,0,0,0.08)' }} />

          {/* Glow orbs */}
          <div className="absolute -top-24 -right-24 w-96 h-96 rounded-full blur-3xl"
            style={{ background: isDark ? 'rgba(139,92,246,0.18)' : 'rgba(139,92,246,0.1)' }} />
          <div className="absolute -bottom-24 -left-24 w-96 h-96 rounded-full blur-3xl"
            style={{ background: isDark ? 'rgba(99,102,241,0.12)' : 'rgba(99,102,241,0.07)' }} />

          <div className="relative px-8 py-24 text-center">
            {/* Badge */}
            <div className="inline-flex items-center gap-2 rounded-full px-4 py-2 mb-10 backdrop-blur-sm"
              style={{
                border: isDark ? '1px solid rgba(255,255,255,0.1)' : '1px solid rgba(0,0,0,0.08)',
                background: isDark ? 'rgba(255,255,255,0.06)' : 'rgba(255,255,255,0.7)',
              }}>
              <span className="flex h-1.5 w-1.5 rounded-full bg-emerald-400 shadow-[0_0_6px_rgba(52,211,153,0.8)]"
                style={{ animation: 'pulse 2s cubic-bezier(0.4,0,0.6,1) infinite' }} />
              <span className="text-xs font-medium"
                style={{ color: isDark ? 'rgba(255,255,255,0.65)' : 'rgba(0,0,0,0.55)' }}>
                50 transaksi gratis setiap bulan
              </span>
            </div>

            <h2 className="text-4xl sm:text-5xl lg:text-6xl font-bold mb-6 leading-[1.05] tracking-tight"
              style={{ color: isDark ? '#ffffff' : '#0a0a0a' }}>
              Mulai kelola keuangan
              <br />
              bisnis Anda hari ini.
            </h2>

            <p className="text-lg max-w-xl mx-auto mb-12 leading-relaxed"
              style={{ color: isDark ? 'rgba(255,255,255,0.45)' : 'rgba(0,0,0,0.5)' }}>
              Bergabung dengan ribuan pemilik UMKM Indonesia yang sudah menggunakan KasAI untuk mencatat, menganalisis, dan mengembangkan bisnis mereka.
            </p>

            <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
              <Link
                href="/sign-up"
                className="group relative inline-flex items-center gap-2 overflow-hidden rounded-xl px-7 py-4 text-sm font-bold transition-all duration-200 hover:scale-[1.02] active:scale-[0.98]"
                style={isDark
                  ? {
                      background: '#ffffff',
                      color: '#0a0a0a',
                      boxShadow: '0 8px 32px rgba(255,255,255,0.15), 0 0 0 1px rgba(255,255,255,0.2)',
                    }
                  : {
                      background: '#0a0a0a',
                      color: '#ffffff',
                      boxShadow: '0 8px 32px rgba(0,0,0,0.15), 0 0 0 1px rgba(0,0,0,0.1)',
                    }
                }
              >
                <span className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-300"
                  style={{ background: isDark
                    ? 'linear-gradient(105deg, transparent 35%, rgba(0,0,0,0.04) 50%, transparent 65%)'
                    : 'linear-gradient(105deg, transparent 35%, rgba(255,255,255,0.08) 50%, transparent 65%)' }} />
                <span className="relative">Mulai Gratis — Tidak Perlu Kartu Kredit</span>
                <svg className="relative group-hover:translate-x-0.5 transition-transform duration-200" width="15" height="15" viewBox="0 0 15 15" fill="none">
                  <path d="M3 7.5h9M8 3.5l4 4-4 4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
              </Link>
              <a
                href="https://t.me/Aiaccountingsbot"
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2.5 rounded-xl px-7 py-4 text-sm font-semibold transition-all duration-200 backdrop-blur-sm"
                style={{
                  border: isDark ? '1px solid rgba(255,255,255,0.12)' : '1px solid rgba(0,0,0,0.1)',
                  background: isDark ? 'rgba(255,255,255,0.06)' : 'rgba(255,255,255,0.7)',
                  color: isDark ? '#ffffff' : '#0a0a0a',
                }}
              >
                <svg width="17" height="17" viewBox="0 0 24 24" fill="#2AABEE">
                  <path d="M12 0C5.373 0 0 5.373 0 12s5.373 12 12 12 12-5.373 12-12S18.627 0 12 0zm5.894 8.221l-1.97 9.28c-.145.658-.537.818-1.084.508l-3-2.21-1.447 1.394c-.16.16-.295.295-.605.295l.213-3.053 5.56-5.023c.242-.213-.054-.333-.373-.12l-6.871 4.326-2.962-.924c-.643-.204-.657-.643.136-.953l11.57-4.461c.537-.194 1.006.131.833.941z"/>
                </svg>
                Coba via Telegram
              </a>
            </div>

            <p className="mt-8 text-xs tracking-wide"
              style={{ color: isDark ? 'rgba(255,255,255,0.25)' : 'rgba(0,0,0,0.3)' }}>
              Setup dalam 2 menit · Tidak ada kontrak · Batalkan kapan saja
            </p>
          </div>
        </div>
      </div>
    </section>
  )
}
