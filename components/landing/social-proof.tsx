export function LandingSocialProof() {
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
    { value: '10.000+', label: 'Transaksi Dicatat' },
    { value: '500+',    label: 'Pemilik Bisnis' },
    { value: '99.9%',   label: 'Uptime' },
    { value: '< 2 dtk', label: 'Respons AI' },
  ]

  return (
    <section className="relative py-20 overflow-hidden">
      {/* Top separator */}
      <div className="absolute top-0 left-0 right-0 h-px"
        style={{ background: 'linear-gradient(90deg, transparent, rgba(255,255,255,0.07) 30%, rgba(255,255,255,0.07) 70%, transparent)' }} />
      {/* Bottom separator */}
      <div className="absolute bottom-0 left-0 right-0 h-px"
        style={{ background: 'linear-gradient(90deg, transparent, rgba(255,255,255,0.07) 30%, rgba(255,255,255,0.07) 70%, transparent)' }} />

      <div className="max-w-6xl mx-auto px-6">
        {/* Stats row */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-6 mb-16">
          {stats.map((s) => (
            <div key={s.label} className="text-center">
              <p className="text-2xl sm:text-3xl font-black text-white tracking-tight mb-1"
                style={{
                  background: 'linear-gradient(135deg, #fff 0%, rgba(255,255,255,0.6) 100%)',
                  WebkitBackgroundClip: 'text',
                  WebkitTextFillColor: 'transparent',
                  backgroundClip: 'text',
                }}>
                {s.value}
              </p>
              <p className="text-xs text-white/35 font-medium">{s.label}</p>
            </div>
          ))}
        </div>

        {/* Divider */}
        <div className="h-px bg-white/[0.05] mb-10" />

        {/* Business types */}
        <p className="text-center text-[11px] font-semibold text-white/25 uppercase tracking-[0.15em] mb-7">
          Dipercaya oleh berbagai jenis usaha di Indonesia
        </p>
        <div className="flex flex-wrap justify-center gap-x-6 gap-y-3">
          {businesses.map((b) => (
            <div key={b.name}
              className="flex items-center gap-2 px-3 py-1.5 rounded-full border border-white/[0.06] bg-white/[0.02] text-white/35 hover:text-white/60 hover:border-white/[0.1] hover:bg-white/[0.04] transition-all duration-200 cursor-default">
              <span className="text-sm">{b.icon}</span>
              <span className="text-xs font-medium">{b.name}</span>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}
