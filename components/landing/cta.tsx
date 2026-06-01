import Link from 'next/link'

export function LandingCta() {
  return (
    <section className="py-32 relative overflow-hidden">
      <div className="max-w-6xl mx-auto px-6">
        <div className="relative rounded-3xl overflow-hidden">
          {/* Background gradient */}
          <div className="absolute inset-0 bg-gradient-to-br from-violet-600/30 via-indigo-600/20 to-cyan-600/10" />
          <div className="absolute inset-0 border border-white/[0.08] rounded-3xl" />

          {/* Grid pattern */}
          <div
            className="absolute inset-0 opacity-[0.04]"
            style={{
              backgroundImage: `linear-gradient(rgba(255,255,255,0.8) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.8) 1px, transparent 1px)`,
              backgroundSize: '40px 40px',
            }}
          />

          {/* Glow orbs */}
          <div className="absolute -top-20 -right-20 w-80 h-80 bg-violet-500/20 rounded-full blur-3xl" />
          <div className="absolute -bottom-20 -left-20 w-80 h-80 bg-indigo-500/15 rounded-full blur-3xl" />

          <div className="relative px-8 py-20 text-center">
            <div className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/[0.06] px-4 py-1.5 mb-8">
              <span className="flex h-1.5 w-1.5 rounded-full bg-emerald-400 animate-pulse" />
              <span className="text-xs font-medium text-white/70">50 transaksi gratis setiap bulan</span>
            </div>

            <h2 className="text-4xl sm:text-5xl lg:text-6xl font-bold text-white mb-6 leading-tight">
              Mulai kelola keuangan
              <br />
              bisnis Anda hari ini.
            </h2>

            <p className="text-lg text-white/50 max-w-xl mx-auto mb-10">
              Bergabung dengan ribuan pemilik UMKM Indonesia yang sudah menggunakan KasAI untuk mencatat, menganalisis, dan mengembangkan bisnis mereka.
            </p>

            <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
              <Link
                href="/sign-up"
                className="group inline-flex items-center gap-2 rounded-xl bg-white px-7 py-4 text-base font-semibold text-[#0a0a0a] hover:bg-white/90 transition-all shadow-[0_8px_32px_rgba(255,255,255,0.15)]"
              >
                Mulai Gratis — Tidak Perlu Kartu Kredit
                <svg className="group-hover:translate-x-0.5 transition-transform" width="16" height="16" viewBox="0 0 16 16" fill="none">
                  <path d="M3 8h10M9 4l4 4-4 4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
              </Link>
              <a
                href="https://t.me/Aiaccountingsbot"
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 rounded-xl border border-white/15 bg-white/[0.06] px-7 py-4 text-base font-medium text-white hover:bg-white/[0.1] transition-all backdrop-blur-sm"
              >
                <svg width="18" height="18" viewBox="0 0 24 24" fill="#2AABEE">
                  <path d="M12 0C5.373 0 0 5.373 0 12s5.373 12 12 12 12-5.373 12-12S18.627 0 12 0zm5.894 8.221l-1.97 9.28c-.145.658-.537.818-1.084.508l-3-2.21-1.447 1.394c-.16.16-.295.295-.605.295l.213-3.053 5.56-5.023c.242-.213-.054-.333-.373-.12l-6.871 4.326-2.962-.924c-.643-.204-.657-.643.136-.953l11.57-4.461c.537-.194 1.006.131.833.941z"/>
                </svg>
                Coba via Telegram
              </a>
            </div>

            <p className="mt-6 text-xs text-white/30">
              Setup dalam 2 menit · Tidak ada kontrak · Batalkan kapan saja
            </p>
          </div>
        </div>
      </div>
    </section>
  )
}
