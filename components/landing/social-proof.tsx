'use client'

import { useTheme } from './theme-provider'

export function LandingSocialProof() {
  const { theme } = useTheme()
  const isDark = theme === 'dark'

  const businesses = [
    { icon: '☕', name: 'Cafe & Kopi' },
    { icon: '🌸', name: 'Florist' },
    { icon: '🧺', name: 'Laundry' },
    { icon: '🛍️', name: 'Toko Retail' },
    { icon: '🍜', name: 'Warung Makan' },
    { icon: '💇', name: 'Salon & Spa' },
    { icon: '🏗️', name: 'Kontraktor' },
    { icon: '📦', name: 'Dropshipper' },
  ]

  const stats = [
    { value: 'Beta',    label: 'Early Access' },
    { value: 'Gratis',  label: 'Mulai Sekarang' },
    { value: '99.9%',   label: 'Uptime' },
    { value: '< 2 dtk', label: 'Respons AI' },
  ]

  const sepColor = isDark ? 'rgba(255,255,255,0.07)' : 'rgba(0,0,0,0.07)'

  return (
    <section className="relative py-20 overflow-hidden"
      style={{ background: isDark ? '#0a0a0a' : '#fafafa' }}>
      {/* Top separator */}
      <div className="absolute top-0 left-0 right-0 h-px"
        style={{ background: `linear-gradient(90deg, transparent, ${sepColor} 30%, ${sepColor} 70%, transparent)` }} />
      {/* Bottom separator */}
      <div className="absolute bottom-0 left-0 right-0 h-px"
        style={{ background: `linear-gradient(90deg, transparent, ${sepColor} 30%, ${sepColor} 70%, transparent)` }} />

      <div className="max-w-6xl mx-auto px-6">
        {/* Stats row */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-6 mb-16">
          {stats.map((s) => (
            <div key={s.label} className="text-center">
              <p className="text-2xl sm:text-3xl font-black tracking-tight mb-1"
                style={{
                  backgroundImage: isDark
                    ? 'linear-gradient(135deg, #fff 0%, rgba(255,255,255,0.6) 100%)'
                    : 'linear-gradient(135deg, #0a0a0a 0%, rgba(0,0,0,0.6) 100%)',
                  WebkitBackgroundClip: 'text',
                  WebkitTextFillColor: 'transparent',
                  backgroundClip: 'text',
                }}>
                {s.value}
              </p>
              <p className="text-xs font-medium"
                style={{ color: isDark ? 'rgba(255,255,255,0.35)' : 'rgba(0,0,0,0.4)' }}>
                {s.label}
              </p>
            </div>
          ))}
        </div>

        {/* Divider */}
        <div className="h-px mb-10"
          style={{ background: isDark ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.06)' }} />

        {/* Business types */}
        <p className="text-center text-[11px] font-semibold uppercase tracking-[0.15em] mb-7"
          style={{ color: isDark ? 'rgba(255,255,255,0.25)' : 'rgba(0,0,0,0.3)' }}>
          Dipercaya oleh berbagai jenis usaha di Indonesia
        </p>
        <div className="flex flex-wrap justify-center gap-x-6 gap-y-3">
          {businesses.map((b) => (
            <div key={b.name}
              className="flex items-center gap-2 px-3 py-1.5 rounded-full cursor-default transition-all duration-200"
              style={{
                border: isDark ? '1px solid rgba(255,255,255,0.06)' : '1px solid rgba(0,0,0,0.07)',
                background: isDark ? 'rgba(255,255,255,0.02)' : 'rgba(0,0,0,0.02)',
                color: isDark ? 'rgba(255,255,255,0.35)' : 'rgba(0,0,0,0.45)',
              }}>
              <span className="text-sm">{b.icon}</span>
              <span className="text-xs font-medium">{b.name}</span>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}
