export function LandingFeatures() {
  return (
    <section id="fitur" className="py-32 relative">
      {/* Subtle background */}
      <div className="absolute inset-0 -z-10">
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[400px] bg-indigo-600/5 rounded-full blur-[100px]" />
      </div>

      <div className="max-w-6xl mx-auto px-6">
        {/* Section header */}
        <div className="max-w-2xl mb-20">
          <p className="text-xs font-semibold text-violet-400 uppercase tracking-widest mb-4">Fitur Unggulan</p>
          <h2 className="text-4xl sm:text-5xl font-bold text-white leading-tight mb-5">
            Satu platform untuk semua kebutuhan keuangan bisnis Anda
          </h2>
          <p className="text-lg text-white/50 leading-relaxed">
            Dari pencatatan otomatis hingga analisis AI — KasAI menggantikan spreadsheet, buku kas, dan akuntan manual sekaligus.
          </p>
        </div>

        {/* Feature grid — bento style */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">

          {/* Feature 1 — Large: Telegram */}
          <div className="lg:col-span-2 group relative rounded-2xl border border-white/[0.08] bg-white/[0.03] p-8 overflow-hidden hover:border-white/[0.15] hover:bg-white/[0.05] transition-all duration-300">
            <div className="absolute top-0 right-0 w-64 h-64 bg-violet-600/10 rounded-full blur-3xl -z-10 group-hover:bg-violet-600/15 transition-all" />
            <div className="flex items-center gap-3 mb-5">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-violet-500/15 border border-violet-500/20">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
                  <path d="M21 15a2 2 0 01-2 2H7l-4 4V5a2 2 0 012-2h14a2 2 0 012 2z" stroke="#a78bfa" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
              </div>
              <span className="text-xs font-semibold text-violet-400 uppercase tracking-wider">Paling Populer</span>
            </div>
            <h3 className="text-xl font-bold text-white mb-3">Catat Transaksi via Telegram</h3>
            <p className="text-white/50 text-sm leading-relaxed mb-6">
              Kirim pesan seperti <span className="text-white/80 font-medium">"beli gula 50rb"</span> atau <span className="text-white/80 font-medium">"terima bayaran 1.2jt"</span> — AI langsung mencatat, mengkategorikan, dan mengkonfirmasi. Tidak perlu buka aplikasi sama sekali.
            </p>
            <div className="flex flex-wrap gap-2">
              {['Bahasa natural Indonesia', 'Konfirmasi instan', 'Pemasukan & pengeluaran', 'Foto struk otomatis'].map(tag => (
                <span key={tag} className="text-xs px-3 py-1 rounded-full bg-white/[0.06] text-white/50 border border-white/[0.08]">{tag}</span>
              ))}
            </div>
          </div>

          {/* Feature 2 — Scan Struk */}
          <div className="group relative rounded-2xl border border-white/[0.08] bg-white/[0.03] p-8 overflow-hidden hover:border-white/[0.15] hover:bg-white/[0.05] transition-all duration-300">
            <div className="absolute bottom-0 right-0 w-40 h-40 bg-cyan-600/10 rounded-full blur-3xl -z-10" />
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-cyan-500/15 border border-cyan-500/20 mb-5">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
                <path d="M23 19a2 2 0 01-2 2H3a2 2 0 01-2-2V8a2 2 0 012-2h4l2-3h6l2 3h4a2 2 0 012 2z" stroke="#67e8f9" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                <circle cx="12" cy="13" r="4" stroke="#67e8f9" strokeWidth="1.5"/>
              </svg>
            </div>
            <h3 className="text-lg font-bold text-white mb-2">Scan Struk dengan AI</h3>
            <p className="text-white/50 text-sm leading-relaxed">
              Foto struk belanja atau bukti transfer — Gemini AI membaca dan mengekstrak semua detail transaksi secara akurat dalam hitungan detik.
            </p>
          </div>

          {/* Feature 3 — AI Advisor */}
          <div className="group relative rounded-2xl border border-white/[0.08] bg-white/[0.03] p-8 overflow-hidden hover:border-white/[0.15] hover:bg-white/[0.05] transition-all duration-300">
            <div className="absolute top-0 left-0 w-40 h-40 bg-emerald-600/8 rounded-full blur-3xl -z-10" />
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-500/15 border border-emerald-500/20 mb-5">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
                <path d="M12 2a10 10 0 110 20A10 10 0 0112 2z" stroke="#6ee7b7" strokeWidth="1.5"/>
                <path d="M12 8v4l3 3" stroke="#6ee7b7" strokeWidth="1.5" strokeLinecap="round"/>
              </svg>
            </div>
            <h3 className="text-lg font-bold text-white mb-2">AI Financial Advisor</h3>
            <p className="text-white/50 text-sm leading-relaxed">
              Tanya langsung: <span className="text-white/70">"Bulan ini saya boros di mana?"</span> atau <span className="text-white/70">"Kapan bisnis saya paling ramai?"</span> — AI menjawab berdasarkan data nyata Anda.
            </p>
          </div>

          {/* Feature 4 — Laporan Real-time */}
          <div className="group relative rounded-2xl border border-white/[0.08] bg-white/[0.03] p-8 overflow-hidden hover:border-white/[0.15] hover:bg-white/[0.05] transition-all duration-300">
            <div className="absolute bottom-0 left-0 w-40 h-40 bg-amber-600/8 rounded-full blur-3xl -z-10" />
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-amber-500/15 border border-amber-500/20 mb-5">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
                <path d="M18 20V10M12 20V4M6 20v-6" stroke="#fcd34d" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
            </div>
            <h3 className="text-lg font-bold text-white mb-2">Laporan Real-time</h3>
            <p className="text-white/50 text-sm leading-relaxed">
              Dashboard dengan grafik pemasukan, pengeluaran, laba bersih, dan breakdown per kategori. Export PDF langsung dari Telegram.
            </p>
          </div>

          {/* Feature 5 — Multi-bisnis */}
          <div className="group relative rounded-2xl border border-white/[0.08] bg-white/[0.03] p-8 overflow-hidden hover:border-white/[0.15] hover:bg-white/[0.05] transition-all duration-300">
            <div className="absolute top-0 right-0 w-40 h-40 bg-rose-600/8 rounded-full blur-3xl -z-10" />
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-rose-500/15 border border-rose-500/20 mb-5">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
                <path d="M3 9l9-7 9 7v11a2 2 0 01-2 2H5a2 2 0 01-2-2z" stroke="#fca5a5" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                <path d="M9 22V12h6v10" stroke="#fca5a5" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
            </div>
            <h3 className="text-lg font-bold text-white mb-2">Multi-Bisnis</h3>
            <p className="text-white/50 text-sm leading-relaxed">
              Kelola beberapa bisnis dari satu akun. Setiap bisnis punya dashboard, laporan, kategori, dan produk sendiri yang terpisah.
            </p>
          </div>

          {/* Feature 6 — Goals & Budget */}
          <div className="group relative rounded-2xl border border-white/[0.08] bg-white/[0.03] p-8 overflow-hidden hover:border-white/[0.15] hover:bg-white/[0.05] transition-all duration-300">
            <div className="absolute bottom-0 right-0 w-40 h-40 bg-blue-600/8 rounded-full blur-3xl -z-10" />
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-blue-500/15 border border-blue-500/20 mb-5">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
                <circle cx="12" cy="12" r="10" stroke="#93c5fd" strokeWidth="1.5"/>
                <circle cx="12" cy="12" r="6" stroke="#93c5fd" strokeWidth="1.5"/>
                <circle cx="12" cy="12" r="2" fill="#93c5fd"/>
              </svg>
            </div>
            <h3 className="text-lg font-bold text-white mb-2">Goals & Budget</h3>
            <p className="text-white/50 text-sm leading-relaxed">
              Tetapkan target keuangan dan batas anggaran per kategori. Dapat notifikasi otomatis via Telegram saat budget hampir habis.
            </p>
          </div>

          {/* Feature 7 — PDF Export */}
          <div className="group relative rounded-2xl border border-white/[0.08] bg-white/[0.03] p-8 overflow-hidden hover:border-white/[0.15] hover:bg-white/[0.05] transition-all duration-300">
            <div className="absolute top-0 left-0 w-40 h-40 bg-purple-600/8 rounded-full blur-3xl -z-10" />
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-purple-500/15 border border-purple-500/20 mb-5">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
                <path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z" stroke="#c4b5fd" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                <path d="M14 2v6h6M16 13H8M16 17H8M10 9H8" stroke="#c4b5fd" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
            </div>
            <h3 className="text-lg font-bold text-white mb-2">Export PDF Profesional</h3>
            <p className="text-white/50 text-sm leading-relaxed">
              Generate laporan keuangan PDF langsung dari Telegram dengan perintah <span className="text-white/70 font-mono text-xs">/pdf</span>. Dikirim langsung ke chat Anda.
            </p>
          </div>

          {/* Feature 8 — Keamanan */}
          <div className="group relative rounded-2xl border border-white/[0.08] bg-white/[0.03] p-8 overflow-hidden hover:border-white/[0.15] hover:bg-white/[0.05] transition-all duration-300">
            <div className="absolute bottom-0 left-0 w-40 h-40 bg-teal-600/8 rounded-full blur-3xl -z-10" />
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-teal-500/15 border border-teal-500/20 mb-5">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
                <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" stroke="#5eead4" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
            </div>
            <h3 className="text-lg font-bold text-white mb-2">Aman & Terenkripsi</h3>
            <p className="text-white/50 text-sm leading-relaxed">
              Data disimpan di database terenkripsi. Autentikasi modern, session aman, dan tidak ada data yang pernah dibagikan ke pihak ketiga.
            </p>
          </div>

          {/* Feature 9 — Kategori Kustom */}
          <div className="group relative rounded-2xl border border-white/[0.08] bg-white/[0.03] p-8 overflow-hidden hover:border-white/[0.15] hover:bg-white/[0.05] transition-all duration-300">
            <div className="absolute top-0 right-0 w-40 h-40 bg-orange-600/8 rounded-full blur-3xl -z-10" />
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-orange-500/15 border border-orange-500/20 mb-5">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
                <path d="M20.59 13.41l-7.17 7.17a2 2 0 01-2.83 0L2 12V2h10l8.59 8.59a2 2 0 010 2.82z" stroke="#fdba74" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                <circle cx="7" cy="7" r="1.5" fill="#fdba74"/>
              </svg>
            </div>
            <h3 className="text-lg font-bold text-white mb-2">Kategori & Produk Kustom</h3>
            <p className="text-white/50 text-sm leading-relaxed">
              Buat kategori pengeluaran dan daftar produk sesuai jenis bisnis Anda. AI akan otomatis menggunakan kategori yang Anda buat.
            </p>
          </div>

        </div>
      </div>
    </section>
  )
}
