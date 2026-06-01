import Link from 'next/link'
import { PLAN_GROUPS } from '@/lib/plan-limits'

export function LandingPricing() {
  return (
    <section id="harga" className="py-32 relative overflow-hidden">
      {/* Background */}
      <div className="absolute inset-0 -z-10">
        <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-white/10 to-transparent" />
        <div className="absolute bottom-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-white/10 to-transparent" />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[700px] h-[500px] bg-violet-600/5 rounded-full blur-[120px]" />
      </div>

      <div className="max-w-6xl mx-auto px-6">
        {/* Header */}
        <div className="text-center mb-16">
          <p className="text-xs font-semibold text-violet-400 uppercase tracking-widest mb-4">Harga</p>
          <h2 className="text-4xl sm:text-5xl font-bold text-white mb-5">
            Bayar sesuai kebutuhan.
            <br />
            <span className="text-white/40">Tidak ada kejutan.</span>
          </h2>
          <p className="text-white/50 max-w-xl mx-auto">
            Mulai gratis, upgrade kapan saja. Semua plan sudah termasuk Telegram bot, scan struk AI, dan laporan real-time.
          </p>
        </div>

        {/* FREE plan — centered, minimal */}
        <div className="max-w-sm mx-auto mb-16">
          <div className="relative rounded-2xl border border-white/[0.08] bg-white/[0.03] p-8 text-center">
            <div className="inline-flex items-center gap-1.5 rounded-full border border-white/10 bg-white/[0.04] px-3 py-1 text-xs text-white/50 mb-5">
              Mulai dari sini
            </div>
            <h3 className="text-2xl font-bold text-white mb-1">Free</h3>
            <div className="flex items-baseline justify-center gap-1 mb-1">
              <span className="text-5xl font-black text-white">Rp 0</span>
            </div>
            <p className="text-sm text-white/40 mb-6">Selamanya gratis</p>
            <ul className="text-sm text-left space-y-2.5 mb-8">
              {PLAN_GROUPS.free[0].features.map(f => (
                <li key={f} className="flex items-center gap-3 text-white/60">
                  <span className="flex h-4 w-4 shrink-0 items-center justify-center rounded-full bg-white/[0.08] text-white/50 text-[10px]">✓</span>
                  {f}
                </li>
              ))}
            </ul>
            <Link href="/sign-up" className="block w-full rounded-xl border border-white/10 bg-white/[0.06] py-3 text-sm font-semibold text-white hover:bg-white/[0.1] transition-all">
              Mulai Gratis
            </Link>
          </div>
        </div>

        {/* PERSONAL plans */}
        <div className="mb-16">
          <div className="flex items-center gap-4 mb-8">
            <div className="h-px flex-1 bg-white/[0.06]" />
            <div className="text-center">
              <p className="text-xs font-semibold text-white/40 uppercase tracking-widest">Personal</p>
              <p className="text-xs text-white/25 mt-0.5">1 bisnis · Semua fitur personal</p>
            </div>
            <div className="h-px flex-1 bg-white/[0.06]" />
          </div>

          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {PLAN_GROUPS.personal.map((plan) => {
              const isBestValue = plan.badge === 'Best Value'
              const isPopular = plan.badge === 'Populer'
              return (
                <div
                  key={plan.id}
                  className={`relative rounded-2xl p-6 flex flex-col transition-all duration-300 ${
                    isBestValue
                      ? 'bg-gradient-to-b from-violet-600/30 to-indigo-600/20 border border-violet-500/40 shadow-[0_0_40px_rgba(139,92,246,0.15)]'
                      : isPopular
                      ? 'border border-white/[0.12] bg-white/[0.05]'
                      : 'border border-white/[0.06] bg-white/[0.03] hover:border-white/[0.12] hover:bg-white/[0.05]'
                  }`}
                >
                  {plan.badge && (
                    <div className={`absolute -top-3 left-1/2 -translate-x-1/2 px-3 py-1 rounded-full text-xs font-semibold ${
                      isBestValue
                        ? 'bg-amber-400 text-amber-900'
                        : 'bg-violet-500/20 text-violet-300 border border-violet-500/30'
                    }`}>
                      {plan.badge}
                    </div>
                  )}

                  <div className="mb-5">
                    <p className="text-xs font-semibold text-white/40 uppercase tracking-wider mb-2">
                      {plan.name.replace('Personal ', '')}
                    </p>
                    <div className="flex items-baseline gap-1">
                      <span className={`text-2xl font-black ${isBestValue ? 'text-white' : 'text-white'}`}>
                        {plan.priceLabel}
                      </span>
                      <span className="text-xs text-white/40">{plan.period}</span>
                    </div>
                    <p className="text-xs text-white/35 mt-1">{plan.desc}</p>
                  </div>

                  <ul className="space-y-2 mb-6 flex-1">
                    {plan.features.map(f => (
                      <li key={f} className="flex items-start gap-2.5 text-xs text-white/55">
                        <span className={`mt-0.5 shrink-0 ${isBestValue ? 'text-violet-300' : 'text-white/30'}`}>✓</span>
                        {f}
                      </li>
                    ))}
                  </ul>

                  <Link
                    href="/sign-up"
                    className={`block w-full rounded-xl py-2.5 text-sm font-semibold text-center transition-all ${
                      isBestValue
                        ? 'bg-white text-[#0a0a0a] hover:bg-white/90'
                        : 'border border-white/10 bg-white/[0.06] text-white hover:bg-white/[0.1]'
                    }`}
                  >
                    {plan.cta}
                  </Link>
                </div>
              )
            })}
          </div>
        </div>

        {/* BUSINESS plans */}
        <div>
          <div className="flex items-center gap-4 mb-8">
            <div className="h-px flex-1 bg-white/[0.06]" />
            <div className="text-center">
              <p className="text-xs font-semibold text-white/40 uppercase tracking-widest">Business</p>
              <p className="text-xs text-white/25 mt-0.5">Multi-bisnis · Dashboard konsolidasi</p>
            </div>
            <div className="h-px flex-1 bg-white/[0.06]" />
          </div>

          <div className="grid sm:grid-cols-3 gap-5 max-w-4xl mx-auto">
            {PLAN_GROUPS.business.map((plan) => {
              const isHighlight = plan.highlight
              return (
                <div
                  key={plan.id}
                  className={`relative rounded-2xl p-7 flex flex-col transition-all duration-300 ${
                    isHighlight
                      ? 'bg-gradient-to-b from-violet-600/25 to-indigo-600/15 border border-violet-500/40 shadow-[0_0_50px_rgba(139,92,246,0.12)]'
                      : 'border border-white/[0.06] bg-white/[0.03] hover:border-white/[0.12] hover:bg-white/[0.05]'
                  }`}
                >
                  {plan.badge && (
                    <div className="absolute -top-3 left-1/2 -translate-x-1/2 px-3 py-1 rounded-full text-xs font-semibold bg-amber-400 text-amber-900">
                      {plan.badge}
                    </div>
                  )}

                  <div className="mb-6">
                    <p className="text-xs font-semibold text-white/40 uppercase tracking-wider mb-2">
                      {plan.name.replace('Business ', '')}
                    </p>
                    <div className="flex items-baseline gap-1 mb-1">
                      <span className="text-3xl font-black text-white">{plan.priceLabel}</span>
                      <span className="text-sm text-white/40">{plan.period}</span>
                    </div>
                    <p className="text-xs text-white/35">{plan.desc}</p>
                  </div>

                  <ul className="space-y-2.5 mb-7 flex-1">
                    {plan.features.map(f => (
                      <li key={f} className="flex items-start gap-2.5 text-sm text-white/55">
                        <span className={`mt-0.5 shrink-0 text-xs ${isHighlight ? 'text-violet-300' : 'text-white/30'}`}>✓</span>
                        {f}
                      </li>
                    ))}
                  </ul>

                  <Link
                    href="/sign-up"
                    className={`block w-full rounded-xl py-3 text-sm font-semibold text-center transition-all ${
                      isHighlight
                        ? 'bg-white text-[#0a0a0a] hover:bg-white/90'
                        : 'border border-white/10 bg-white/[0.06] text-white hover:bg-white/[0.1]'
                    }`}
                  >
                    {plan.cta}
                  </Link>
                </div>
              )
            })}
          </div>
        </div>

        {/* Bottom note */}
        <p className="text-center text-xs text-white/25 mt-12">
          Semua harga dalam Rupiah · Tidak ada kontrak · Batalkan kapan saja · Upgrade/downgrade instan
        </p>
      </div>
    </section>
  )
}
