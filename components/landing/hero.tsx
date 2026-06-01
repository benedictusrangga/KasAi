import Link from 'next/link'

export function LandingHero() {
  return (
    <section className="relative min-h-screen flex items-center justify-center pt-16 overflow-hidden">
      {/* Background effects */}
      <div className="absolute inset-0 -z-10">
        {/* Radial gradient center glow */}
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[600px] rounded-full bg-violet-600/10 blur-[120px]" />
        <div className="absolute top-1/3 left-1/3 w-[400px] h-[400px] rounded-full bg-indigo-600/8 blur-[100px]" />
        {/* Grid pattern */}
        <div
          className="absolute inset-0 opacity-[0.03]"
          style={{
            backgroundImage: `linear-gradient(rgba(255,255,255,0.5) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.5) 1px, transparent 1px)`,
            backgroundSize: '60px 60px',
          }}
        />
        {/* Noise texture overlay */}
        <div className="absolute inset-0 opacity-[0.015]" style={{
          backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noise'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noise)'/%3E%3C/svg%3E")`,
        }} />
      </div>

      <div className="max-w-6xl mx-auto px-6 text-center">
        {/* Eyebrow badge */}
        <div className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/[0.04] px-4 py-1.5 mb-8 backdrop-blur-sm">
          <span className="flex h-1.5 w-1.5 rounded-full bg-emerald-400 animate-pulse" />
          <span className="text-xs font-medium text-white/70 tracking-wide">Didukung Gemini 2.5 Flash · Tersedia di Telegram</span>
        </div>

        {/* Headline */}
        <h1 className="mx-auto max-w-4xl text-5xl sm:text-6xl lg:text-7xl font-bold leading-[1.05] tracking-tight mb-6">
          <span className="text-white">Keuangan bisnis,</span>
          <br />
          <span className="bg-gradient-to-r from-violet-400 via-indigo-400 to-cyan-400 bg-clip-text text-transparent">
            semudah kirim pesan.
          </span>
        </h1>

        {/* Subheadline */}
        <p className="mx-auto max-w-2xl text-lg sm:text-xl text-white/50 leading-relaxed mb-10">
          Cukup chat ke bot Telegram — AI langsung mencatat transaksi, mengkategorikan pengeluaran,
          dan menyajikan laporan keuangan bisnis Anda secara real-time.
          Tidak perlu spreadsheet, tidak perlu akuntan.
        </p>

        {/* CTA buttons */}
        <div className="flex flex-col sm:flex-row items-center justify-center gap-3 mb-6">
          <Link
            href="/sign-up"
            className="group inline-flex items-center gap-2 rounded-xl bg-white px-6 py-3.5 text-sm font-semibold text-[#0a0a0a] hover:bg-white/90 transition-all duration-150 shadow-[0_0_0_1px_rgba(255,255,255,0.15),0_8px_32px_rgba(139,92,246,0.25)]"
          >
            Mulai Gratis — Tidak Perlu Kartu Kredit
            <svg className="group-hover:translate-x-0.5 transition-transform" width="16" height="16" viewBox="0 0 16 16" fill="none">
              <path d="M3 8h10M9 4l4 4-4 4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
          </Link>
          <Link
            href="#fitur"
            className="inline-flex items-center gap-2 rounded-xl border border-white/10 bg-white/[0.04] px-6 py-3.5 text-sm font-medium text-white/70 hover:text-white hover:bg-white/[0.08] transition-all duration-150 backdrop-blur-sm"
          >
            Lihat Fitur
          </Link>
        </div>

        <p className="text-xs text-white/30">Setup dalam 2 menit · 50 transaksi gratis setiap bulan</p>

        {/* Dashboard mockup */}
        <div className="relative mx-auto mt-16 max-w-5xl">
          {/* Glow behind mockup */}
          <div className="absolute -inset-4 bg-gradient-to-b from-violet-600/20 to-transparent rounded-3xl blur-2xl -z-10" />

          <div className="rounded-2xl border border-white/[0.08] bg-[#111111] shadow-2xl overflow-hidden">
            {/* Browser chrome */}
            <div className="flex items-center gap-2 border-b border-white/[0.06] bg-[#0f0f0f] px-4 py-3">
              <div className="flex gap-1.5">
                <div className="h-3 w-3 rounded-full bg-[#ff5f57]" />
                <div className="h-3 w-3 rounded-full bg-[#febc2e]" />
                <div className="h-3 w-3 rounded-full bg-[#28c840]" />
              </div>
              <div className="flex-1 mx-4">
                <div className="mx-auto max-w-xs rounded-md bg-white/[0.06] px-3 py-1 text-xs text-white/30 text-center">
                  app.kasai.id/dashboard
                </div>
              </div>
            </div>

            {/* Dashboard content */}
            <div className="p-5">
              {/* KPI row — 4 cards, no overflow */}
              <div className="grid grid-cols-4 gap-3 mb-4">
                {[
                  { label: 'Pemasukan',    value: 'Rp 24,8 jt', change: '+18%', up: true },
                  { label: 'Pengeluaran',  value: 'Rp 11,2 jt', change: '-5%',  up: false },
                  { label: 'Laba Bersih',  value: 'Rp 13,6 jt', change: '+31%', up: true },
                  { label: 'Transaksi',    value: '247',         change: '+12%', up: true },
                ].map((kpi) => (
                  <div key={kpi.label} className="rounded-xl bg-white/[0.04] border border-white/[0.06] p-3.5">
                    <p className="text-[11px] text-white/40 mb-1 truncate">{kpi.label}</p>
                    <p className="text-base font-bold text-white leading-tight">{kpi.value}</p>
                    <p className={`text-[11px] mt-1 font-medium ${kpi.up ? 'text-emerald-400' : 'text-rose-400'}`}>
                      {kpi.change} bulan ini
                    </p>
                  </div>
                ))}
              </div>

              {/* Chart + transactions row */}
              <div className="grid grid-cols-5 gap-3">
                {/* Mini bar chart */}
                <div className="col-span-3 rounded-xl bg-white/[0.04] border border-white/[0.06] p-4">
                  <div className="flex items-center justify-between mb-3">
                    <p className="text-[11px] font-semibold text-white/50 uppercase tracking-wider">Tren 6 Bulan</p>
                    <div className="flex gap-3 text-[11px] text-white/40">
                      <span className="flex items-center gap-1">
                        <span className="h-2 w-2 rounded-full bg-violet-500 inline-block" />Masuk
                      </span>
                      <span className="flex items-center gap-1">
                        <span className="h-2 w-2 rounded-full bg-rose-500 inline-block" />Keluar
                      </span>
                    </div>
                  </div>
                  <div className="flex items-end gap-2 h-16">
                    {[
                      { in: 55, out: 35 }, { in: 70, out: 45 }, { in: 45, out: 60 },
                      { in: 80, out: 40 }, { in: 65, out: 50 }, { in: 90, out: 42 },
                    ].map((bar, i) => (
                      <div key={i} className="flex-1 flex items-end gap-0.5">
                        <div className="flex-1 rounded-t bg-violet-500/70" style={{ height: `${bar.in}%` }} />
                        <div className="flex-1 rounded-t bg-rose-500/50" style={{ height: `${bar.out}%` }} />
                      </div>
                    ))}
                  </div>
                  <div className="flex justify-between mt-2">
                    {['Jan', 'Feb', 'Mar', 'Apr', 'Mei', 'Jun'].map(m => (
                      <span key={m} className="text-[10px] text-white/25 flex-1 text-center">{m}</span>
                    ))}
                  </div>
                </div>

                {/* Recent transactions */}
                <div className="col-span-2 rounded-xl bg-white/[0.04] border border-white/[0.06] p-4">
                  <p className="text-[11px] font-semibold text-white/50 uppercase tracking-wider mb-3">Terbaru</p>
                  <div className="space-y-2">
                    {[
                      { desc: 'Bahan baku kopi', amt: '-450rb', src: '💬', color: 'text-rose-400' },
                      { desc: 'Penjualan pagi',  amt: '+1.2jt', src: '✍️', color: 'text-emerald-400' },
                      { desc: 'Bayar listrik',   amt: '-320rb', src: '📷', color: 'text-rose-400' },
                      { desc: 'Catering order',  amt: '+850rb', src: '💬', color: 'text-emerald-400' },
                    ].map((t, i) => (
                      <div key={i} className="flex items-center justify-between gap-2">
                        <div className="flex items-center gap-1.5 min-w-0">
                          <span className="text-xs shrink-0">{t.src}</span>
                          <span className="text-[11px] text-white/55 truncate">{t.desc}</span>
                        </div>
                        <span className={`text-[11px] font-semibold shrink-0 ${t.color}`}>{t.amt}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Floating Telegram notification — positioned below the mockup on mobile, beside on desktop */}
          <div className="hidden lg:flex absolute -right-6 top-12 items-center gap-3 rounded-2xl border border-white/[0.08] bg-[#111111]/95 backdrop-blur-xl px-4 py-3 shadow-2xl pointer-events-none">
            <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl" style={{ background: 'linear-gradient(135deg, #2AABEE, #229ED9)' }}>
              <svg width="16" height="16" viewBox="0 0 24 24" fill="white">
                <path d="M12 0C5.373 0 0 5.373 0 12s5.373 12 12 12 12-5.373 12-12S18.627 0 12 0zm5.894 8.221l-1.97 9.28c-.145.658-.537.818-1.084.508l-3-2.21-1.447 1.394c-.16.16-.295.295-.605.295l.213-3.053 5.56-5.023c.242-.213-.054-.333-.373-.12l-6.871 4.326-2.962-.924c-.643-.204-.657-.643.136-.953l11.57-4.461c.537-.194 1.006.131.833.941z"/>
              </svg>
            </div>
            <div>
              <p className="text-xs font-semibold text-white">Transaksi dicatat</p>
              <p className="text-[11px] text-white/50">beli bahan baku 450rb ✓</p>
            </div>
          </div>

          {/* Floating AI badge */}
          <div className="hidden lg:flex absolute -left-6 bottom-12 items-center gap-2.5 rounded-2xl border border-white/[0.08] bg-[#111111]/95 backdrop-blur-xl px-4 py-3 shadow-2xl pointer-events-none">
            <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-gradient-to-br from-violet-500 to-indigo-600">
              <span className="text-white text-sm">✦</span>
            </div>
            <div>
              <p className="text-xs font-semibold text-white">AI Insight</p>
              <p className="text-[11px] text-white/50">Laba naik 31% bulan ini 🎉</p>
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}
