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

  return (
    <section className="py-16 border-y border-white/[0.06]">
      <div className="max-w-6xl mx-auto px-6">
        <p className="text-center text-xs font-medium text-white/30 uppercase tracking-widest mb-8">
          Dipercaya oleh berbagai jenis usaha di Indonesia
        </p>
        <div className="flex flex-wrap justify-center gap-x-8 gap-y-4">
          {businesses.map((b) => (
            <div key={b.name} className="flex items-center gap-2 text-white/40 hover:text-white/70 transition-colors">
              <span className="text-base">{b.icon}</span>
              <span className="text-sm font-medium">{b.name}</span>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}
