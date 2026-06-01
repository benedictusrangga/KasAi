import Link from 'next/link'

export function LandingHero() {
  return (
    <section className="relative min-h-screen flex items-center justify-center pt-20 overflow-hidden">

      {/* ── Background layers ── */}
      <div className="absolute inset-0 -z-10 overflow-hidden">
        {/* Deep radial glow */}
        <div className="absolute top-[40%] left-1/2 -translate-x-1/2 -translate-y-1/2 w-[900px] h-[700px] rounded-full opacity-60"
          style={{ background: 'radial-gradient(ellipse, rgba(99,102,241,0.12) 0%, rgba(139,92,246,0.06) 40%, transparent 70%)' }} />
        {/* Secondary accent */}
        <div className="absolute top-[20%] right-[15%] w-[400px] h-[400px] rounded-full opacity-40"
          style={{ background: 'radial-gradient(ellipse, rgba(59,130,246,0.08) 0%, transparent 70%)' }} />
        {/* Bottom fade */}
        <div className="absolute bottom-0 left-0 right-0 h-64"
          style={{ background: 'linear-gradient(to top, #0a0a0a, transparent)' }} />
        {/* Subtle grid */}
        <div className="absolute inset-0 opacity-[0.025]"
          style={{
            backgroundImage: `linear-gradient(rgba(255,255,255,1) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,1) 1px, transparent 1px)`,
            backgroundSize: '72px 72px',
          }} />
        {/* Dot grid overlay */}
        <div className="absolute inset-0 opacity-[0.04]"
          style={{
            backgroundImage: `radial-gradient(circle, rgba(255,255,255,0.8) 1px, transparent 1px)`,
            backgroundSize: '36px 36px',
          }} />
      </div>

      <div className="max-w-6xl mx-auto px-6 text-center">

        {/* Eyebrow badge */}
        <div className="inline-flex items-center gap-2.5 rounded-full border border-white/[0.1] bg-white/[0.04] px-4 py-2 mb-10 backdrop-blur-sm">
          <span className="flex h-1.5 w-1.5 rounded-full bg-emerald-400 shadow-[0_0_6px_rgba(52,211,153,0.8)]" style={{ animation: 'pulse 2s cubic-bezier(0.4,0,0.6,1) infinite' }} />
          <span className="text-xs font-medium text-white/60 tracking-wide">Didukung Gemini 2.5 Flash</span>
          <span className="h-3 w-px bg-white/[0.12]" />
          <span className="text-xs font-medium text-white/60 tracking-wide">Tersedia di Telegram</span>
        </div>

        {/* Headline */}
        <h1 className="mx-auto max-w-4xl text-5xl sm:text-6xl lg:text-[72px] font-bold leading-[1.04] tracking-[-0.03em] mb-7">
          <span className="text-white">Keuangan bisnis,</span>
          <br />
          <span
            className="relative inline-block"
            style={{
              background: 'linear-gradient(90deg, #a78bfa 0%, #818cf8 35%, #60a5fa 70%, #34d399 100%)',
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent',
              backgroundClip: 'text',
            }}
          >
            semudah kirim pesan.
          </span>
        </h1>

        {/* Subheadline */}
        <p className="mx-auto max-w-2xl text-lg sm:text-xl text-white/45 leading-relaxed mb-10 tracking-[-0.01em]">
          Cukup chat ke bot Telegram — AI langsung mencatat transaksi,
          mengkategorikan pengeluaran, dan menyajikan laporan keuangan bisnis
          Anda secara real-time. Tidak perlu spreadsheet, tidak perlu akuntan.
        </p>

        {/* CTA buttons */}
        <div className="flex flex-col sm:flex-row items-center justify-center gap-3 mb-5">
          <Link
            href="/sign-up"
            className="group relative inline-flex items-center gap-2 overflow-hidden rounded-xl px-6 py-3.5 text-sm font-semibold text-white transition-all duration-200 hover:scale-[1.02] active:scale-[0.98]"
            style={{
              background: 'linear-gradient(135deg, #7C3AED 0%, #6366F1 55%, #3B82F6 100%)',
              boxShadow: '0 0 0 1px rgba(139,92,246,0.35), 0 8px 32px rgba(99,102,241,0.4)',
            }}
          >
            {/* Shimmer */}
            <span className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-500"
              style={{ background: 'linear-gradient(105deg, transparent 35%, rgba(255,255,255,0.1) 50%, transparent 65%)' }} />
            <span className="relative">Mulai Gratis — Tidak Perlu Kartu Kredit</span>
            <svg className="relative group-hover:translate-x-0.5 transition-transform duration-200" width="15" height="15" viewBox="0 0 15 15" fill="none">
              <path d="M3 7.5h9M8 3.5l4 4-4 4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
          </Link>
          <Link
            href="#fitur"
            className="inline-flex items-center gap-2 rounded-xl border border-white/[0.1] bg-white/[0.04] px-6 py-3.5 text-sm font-medium text-white/65 hover:text-white hover:bg-white/[0.08] hover:border-white/[0.15] transition-all duration-200 backdrop-blur-sm"
          >
            Lihat Fitur
          </Link>
        </div>

        <p className="text-xs text-white/25 tracking-wide">Setup dalam 2 menit · 50 transaksi gratis setiap bulan</p>

        {/* ── Dashboard mockup ── */}
        <div className="relative mx-auto mt-20 max-w-5xl">
          {/* Glow behind */}
          <div className="absolute -inset-8 -z-10 rounded-3xl opacity-60"
            style={{ background: 'radial-gradient(ellipse at 50% 0%, rgba(99,102,241,0.25) 0%, transparent 70%)' }} />

          {/* Outer ring */}
          <div className="rounded-[20px] p-px"
            style={{ background: 'linear-gradient(180deg, rgba(255,255,255,0.1) 0%, rgba(255,255,255,0.03) 100%)' }}>
            <div className="rounded-[19px] overflow-hidden bg-[#0f0f0f] shadow-[0_32px_80px_rgba(0,0,0,0.8)]">

              {/* Browser chrome */}
              <div className="flex items-center gap-2 border-b border-white/[0.05] bg-[#0d0d0d] px-4 py-3">
                <div className="flex gap-1.5">
                  <div className="h-2.5 w-2.5 rounded-full bg-[#ff5f57]" />
                  <div className="h-2.5 w-2.5 rounded-full bg-[#febc2e]" />
                  <div className="h-2.5 w-2.5 rounded-full bg-[#28c840]" />
                </div>
                <div className="flex-1 mx-4">
                  <div className="mx-auto max-w-xs rounded-md bg-white/[0.05] px-3 py-1 text-[11px] text-white/25 text-center font-mono">
                    app.kasai.id/dashboard
                  </div>
                </div>
                <div className="flex gap-1.5 opacity-30">
                  <div className="h-2.5 w-2.5 rounded-sm bg-white/40" />
                  <div className="h-2.5 w-2.5 rounded-sm bg-white/40" />
                </div>
              </div>

              {/* Dashboard content */}
              <div className="p-4 sm:p-5">
                {/* KPI row */}
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 sm:gap-3 mb-3 sm:mb-4">
                  {[
                    { label: 'Pemasukan',   value: 'Rp 24,8 jt', change: '+18%', up: true,  color: 'text-emerald-400' },
                    { label: 'Pengeluaran', value: 'Rp 11,2 jt', change: '-5%',  up: false, color: 'text-rose-400' },
                    { label: 'Laba Bersih', value: 'Rp 13,6 jt', change: '+31%', up: true,  color: 'text-emerald-400' },
                    { label: 'Transaksi',   value: '247',         change: '+12%', up: true,  color: 'text-emerald-400' },
                  ].map((kpi) => (
                    <div key={kpi.label}
                      className="rounded-xl border border-white/[0.05] p-3"
                      style={{ background: 'linear-gradient(135deg, rgba(255,255,255,0.04) 0%, rgba(255,255,255,0.02) 100%)' }}>
                      <p className="text-[10px] sm:text-[11px] text-white/35 mb-1.5 font-medium">{kpi.label}</p>
                      <p className="text-sm sm:text-base font-bold text-white leading-tight tracking-tight">{kpi.value}</p>
                      <p className={`text-[10px] sm:text-[11px] mt-1.5 font-semibold ${kpi.color}`}>
                        {kpi.change} <span className="text-white/25 font-normal">bulan ini</span>
                      </p>
                    </div>
                  ))}
                </div>

                {/* Chart + transactions */}
                <div className="flex flex-col sm:grid sm:grid-cols-5 gap-2 sm:gap-3">
                  {/* Bar chart */}
                  <div className="sm:col-span-3 rounded-xl border border-white/[0.05] p-3 sm:p-4"
                    style={{ background: 'linear-gradient(135deg, rgba(255,255,255,0.03) 0%, rgba(255,255,255,0.015) 100%)' }}>
                    <div className="flex items-center justify-between mb-3">
                      <p className="text-[10px] font-semibold text-white/40 uppercase tracking-wider">Tren 6 Bulan</p>
                      <div className="flex gap-3 text-[10px] text-white/35">
                        <span className="flex items-center gap-1.5">
                          <span className="h-1.5 w-1.5 rounded-full bg-violet-500 inline-block" />Masuk
                        </span>
                        <span className="flex items-center gap-1.5">
                          <span className="h-1.5 w-1.5 rounded-full bg-rose-500 inline-block" />Keluar
                        </span>
                      </div>
                    </div>
                    <div className="flex items-end gap-1.5 h-14 sm:h-20">
                      {[
                        { in: 55, out: 35 }, { in: 70, out: 45 }, { in: 45, out: 60 },
                        { in: 80, out: 40 }, { in: 65, out: 50 }, { in: 90, out: 42 },
                      ].map((bar, i) => (
                        <div key={i} className="flex-1 flex items-end gap-0.5">
                          <div className="flex-1 rounded-t-sm" style={{ height: `${bar.in}%`, background: 'linear-gradient(to top, #7C3AED, #818cf8)' }} />
                          <div className="flex-1 rounded-t-sm" style={{ height: `${bar.out}%`, background: 'linear-gradient(to top, #be123c, #fb7185)' }} />
                        </div>
                      ))}
                    </div>
                    <div className="flex justify-between mt-2">
                      {['Jan', 'Feb', 'Mar', 'Apr', 'Mei', 'Jun'].map(m => (
                        <span key={m} className="text-[9px] text-white/20 flex-1 text-center">{m}</span>
                      ))}
                    </div>
                  </div>

                  {/* Recent transactions */}
                  <div className="sm:col-span-2 rounded-xl border border-white/[0.05] p-3 sm:p-4"
                    style={{ background: 'linear-gradient(135deg, rgba(255,255,255,0.03) 0%, rgba(255,255,255,0.015) 100%)' }}>
                    <p className="text-[10px] font-semibold text-white/40 uppercase tracking-wider mb-3">Terbaru</p>
                    <div className="space-y-2 sm:space-y-2.5">
                      {[
                        { desc: 'Bahan baku kopi', amt: '-450rb', src: '💬', color: 'text-rose-400' },
                        { desc: 'Penjualan pagi',  amt: '+1.2jt', src: '✍️', color: 'text-emerald-400' },
                        { desc: 'Bayar listrik',   amt: '-320rb', src: '📷', color: 'text-rose-400' },
                        { desc: 'Catering order',  amt: '+850rb', src: '💬', color: 'text-emerald-400' },
                      ].map((t, i) => (
                        <div key={i} className="flex items-center justify-between gap-2">
                          <div className="flex items-center gap-1.5 min-w-0">
                            <span className="text-xs shrink-0 opacity-70">{t.src}</span>
                            <span className="text-[11px] text-white/50 truncate">{t.desc}</span>
                          </div>
                          <span className={`text-[11px] font-bold shrink-0 ${t.color}`}>{t.amt}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Floating Telegram notification */}
          <div className="hidden lg:flex absolute -right-8 top-10 items-center gap-3 rounded-2xl border border-white/[0.08] bg-[#0f0f0f]/95 backdrop-blur-xl px-4 py-3 shadow-[0_16px_48px_rgba(0,0,0,0.6),inset_0_1px_0_rgba(255,255,255,0.05)] pointer-events-none">
            <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl"
              style={{ background: 'linear-gradient(135deg, #2AABEE, #229ED9)' }}>
              <svg width="15" height="15" viewBox="0 0 24 24" fill="white">
                <path d="M12 0C5.373 0 0 5.373 0 12s5.373 12 12 12 12-5.373 12-12S18.627 0 12 0zm5.894 8.221l-1.97 9.28c-.145.658-.537.818-1.084.508l-3-2.21-1.447 1.394c-.16.16-.295.295-.605.295l.213-3.053 5.56-5.023c.242-.213-.054-.333-.373-.12l-6.871 4.326-2.962-.924c-.643-.204-.657-.643.136-.953l11.57-4.461c.537-.194 1.006.131.833.941z"/>
              </svg>
            </div>
            <div>
              <p className="text-xs font-semibold text-white">Transaksi dicatat ✓</p>
              <p className="text-[11px] text-white/40">beli bahan baku 450rb</p>
            </div>
          </div>

          {/* Floating AI badge */}
          <div className="hidden lg:flex absolute -left-8 bottom-10 items-center gap-2.5 rounded-2xl border border-white/[0.08] bg-[#0f0f0f]/95 backdrop-blur-xl px-4 py-3 shadow-[0_16px_48px_rgba(0,0,0,0.6),inset_0_1px_0_rgba(255,255,255,0.05)] pointer-events-none">
            <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg"
              style={{ background: 'linear-gradient(135deg, #7C3AED, #6366F1)' }}>
              <span className="text-white text-sm leading-none">✦</span>
            </div>
            <div>
              <p className="text-xs font-semibold text-white">AI Insight</p>
              <p className="text-[11px] text-white/40">Laba naik 31% bulan ini 🎉</p>
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}
