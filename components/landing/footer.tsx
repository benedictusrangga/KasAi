'use client'

import Link from 'next/link'
import { KasAILogo } from '@/components/logo'
import { useTheme } from './theme-provider'

export function LandingFooter() {
  const { theme } = useTheme()
  const isDark = theme === 'dark'

  const sepColor = isDark ? 'rgba(255,255,255,0.07)' : 'rgba(0,0,0,0.07)'
  const textMuted = isDark ? 'rgba(255,255,255,0.3)' : 'rgba(0,0,0,0.35)'
  const textLink  = isDark ? 'rgba(255,255,255,0.35)' : 'rgba(0,0,0,0.4)'
  const textLinkHover = isDark ? 'rgba(255,255,255,0.7)' : 'rgba(0,0,0,0.7)'
  const headingColor = isDark ? 'rgba(255,255,255,0.25)' : 'rgba(0,0,0,0.3)'

  return (
    <footer className="relative overflow-hidden"
      style={{ background: isDark ? '#0a0a0a' : '#f5f5f5' }}>
      {/* Top separator */}
      <div className="h-px"
        style={{ background: `linear-gradient(90deg, transparent, ${sepColor} 30%, ${sepColor} 70%, transparent)` }} />

      <div className="max-w-6xl mx-auto px-6 py-16">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-10 mb-14">

          {/* Brand */}
          <div className="col-span-2 md:col-span-1">
            <div className="mb-5">
              <KasAILogo href="/" size="md" dark={isDark} />
            </div>
            <p className="text-sm leading-relaxed mb-6" style={{ color: textMuted }}>
              Keuangan bisnis, semudah kirim pesan. Dibuat untuk UMKM Indonesia.
            </p>
            <a
              href="https://t.me/Aiaccountingsbot"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 text-xs transition-colors duration-200 group"
              style={{ color: textLink }}
            >
              <span className="flex h-6 w-6 items-center justify-center rounded-lg transition-colors duration-200"
                style={{ background: 'rgba(42,171,238,0.12)', border: '1px solid rgba(42,171,238,0.2)' }}>
                <svg width="12" height="12" viewBox="0 0 24 24" fill="#2AABEE">
                  <path d="M12 0C5.373 0 0 5.373 0 12s5.373 12 12 12 12-5.373 12-12S18.627 0 12 0zm5.894 8.221l-1.97 9.28c-.145.658-.537.818-1.084.508l-3-2.21-1.447 1.394c-.16.16-.295.295-.605.295l.213-3.053 5.56-5.023c.242-.213-.054-.333-.373-.12l-6.871 4.326-2.962-.924c-.643-.204-.657-.643.136-.953l11.57-4.461c.537-.194 1.006.131.833.941z"/>
                </svg>
              </span>
              @Aiaccountingsbot
            </a>
          </div>

          {/* Product */}
          <div>
            <p className="text-[11px] font-bold uppercase tracking-[0.12em] mb-5" style={{ color: headingColor }}>Produk</p>
            <ul className="space-y-3.5">
              {[
                { label: 'Fitur',        href: '#fitur' },
                { label: 'Cara Kerja',   href: '#cara-kerja' },
                { label: 'AI Persona',   href: '#ai-persona' },
                { label: 'Harga',        href: '#harga' },
                { label: 'Telegram Bot', href: '#telegram' },
              ].map(item => (
                <li key={item.label}>
                  <a href={item.href}
                    className="text-sm transition-colors duration-200"
                    style={{ color: textLink }}>
                    {item.label}
                  </a>
                </li>
              ))}
            </ul>
          </div>

          {/* Akun */}
          <div>
            <p className="text-[11px] font-bold uppercase tracking-[0.12em] mb-5" style={{ color: headingColor }}>Akun</p>
            <ul className="space-y-3.5">
              {[
                { label: 'Daftar Gratis', href: '/sign-up' },
                { label: 'Masuk',         href: '/sign-in' },
                { label: 'Dashboard',     href: '/dashboard' },
              ].map(item => (
                <li key={item.label}>
                  <Link href={item.href}
                    className="text-sm transition-colors duration-200"
                    style={{ color: textLink }}>
                    {item.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Bisnis */}
          <div>
            <p className="text-[11px] font-bold uppercase tracking-[0.12em] mb-5" style={{ color: headingColor }}>Bisnis</p>
            <ul className="space-y-3.5">
              {['☕ Cafe & Kopi', '🌸 Florist', '🧺 Laundry', '🛍️ Toko Retail', '🍜 Warung Makan'].map(b => (
                <li key={b}>
                  <span className="text-sm" style={{ color: isDark ? 'rgba(255,255,255,0.25)' : 'rgba(0,0,0,0.3)' }}>{b}</span>
                </li>
              ))}
            </ul>
          </div>
        </div>

        {/* Bottom bar */}
        <div className="h-px mb-8"
          style={{ background: `linear-gradient(90deg, transparent, ${isDark ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.06)'} 30%, ${isDark ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.06)'} 70%, transparent)` }} />

        <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
          <p className="text-xs" style={{ color: isDark ? 'rgba(255,255,255,0.2)' : 'rgba(0,0,0,0.25)' }}>
            © 2025 KasAI. Dibuat dengan ❤️ untuk UMKM Indonesia.
          </p>
          <div className="flex items-center gap-5">
            <span className="text-xs"
              style={{
                backgroundImage: 'linear-gradient(90deg, rgba(139,92,246,0.8), rgba(99,102,241,0.8))',
                WebkitBackgroundClip: 'text',
                WebkitTextFillColor: 'transparent',
                backgroundClip: 'text',
              }}>
              Powered by Gemini AI
            </span>
            <div className="flex items-center gap-1.5">
              <span className="h-1.5 w-1.5 rounded-full bg-emerald-400 shadow-[0_0_4px_rgba(52,211,153,0.6)]" />
              <span className="text-xs" style={{ color: isDark ? 'rgba(255,255,255,0.2)' : 'rgba(0,0,0,0.25)' }}>
                All systems operational
              </span>
            </div>
          </div>
        </div>
      </div>
    </footer>
  )
}
