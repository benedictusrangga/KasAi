export function LandingHowItWorks() {
  const steps = [
    {
      number: '01',
      title: 'Daftar & Setup Bisnis',
      desc: 'Buat akun gratis dalam 2 menit. Pilih tipe bisnis Anda — cafe, laundry, retail, atau keuangan personal. AI akan menyesuaikan kategori dan saran secara otomatis.',
      detail: 'Tidak perlu kartu kredit',
      color: 'from-violet-500 to-indigo-500',
    },
    {
      number: '02',
      title: 'Hubungkan Telegram',
      desc: 'Masukkan Telegram ID Anda di Settings. Bot langsung mengenali Anda dan siap menerima transaksi. Satu kali setup, selamanya aktif.',
      detail: 'Setup < 1 menit',
      color: 'from-cyan-500 to-blue-500',
    },
    {
      number: '03',
      title: 'Catat Transaksi',
      desc: 'Kirim pesan ke bot, foto struk, atau input manual di dashboard. AI mencatat, mengkategorikan, dan mengkonfirmasi setiap transaksi secara real-time.',
      detail: 'Bahasa natural Indonesia',
      color: 'from-emerald-500 to-teal-500',
    },
    {
      number: '04',
      title: 'Analisis & Laporan',
      desc: 'Lihat dashboard real-time, tanya AI tentang keuangan bisnis Anda, dan export laporan PDF profesional langsung dari Telegram kapan saja.',
      detail: 'Laporan PDF instan',
      color: 'from-amber-500 to-orange-500',
    },
  ]

  return (
    <section id="cara-kerja" className="py-32 relative">
      <div className="absolute inset-0 -z-10">
        <div className="absolute inset-0 bg-gradient-to-b from-transparent via-white/[0.01] to-transparent" />
      </div>

      <div className="max-w-6xl mx-auto px-6">
        <div className="text-center mb-20">
          <p className="text-xs font-semibold text-violet-400 uppercase tracking-widest mb-4">Cara Kerja</p>
          <h2 className="text-4xl sm:text-5xl font-bold text-white mb-5">
            Dari daftar hingga laporan
            <br />
            <span className="text-white/40">dalam hitungan menit.</span>
          </h2>
        </div>

        <div className="relative">
          {/* Connecting line */}
          <div className="absolute left-[28px] top-10 bottom-10 w-px bg-gradient-to-b from-violet-500/50 via-cyan-500/30 to-amber-500/50 hidden lg:block" />

          <div className="space-y-6 lg:space-y-0 lg:grid lg:grid-cols-4 lg:gap-6">
            {steps.map((step, i) => (
              <div key={step.number} className="relative group">
                {/* Connector dot for desktop */}
                <div className={`hidden lg:flex absolute -left-[calc(50%+28px)] top-10 h-3 w-3 rounded-full bg-gradient-to-br ${step.color} shadow-lg`} />

                <div className="rounded-2xl border border-white/[0.08] bg-white/[0.03] p-6 hover:border-white/[0.15] hover:bg-white/[0.05] transition-all duration-300 h-full">
                  {/* Step number */}
                  <div className={`inline-flex items-center justify-center h-10 w-10 rounded-xl bg-gradient-to-br ${step.color} mb-5 text-white font-black text-sm shadow-lg`}>
                    {step.number}
                  </div>

                  <h3 className="text-base font-bold text-white mb-3">{step.title}</h3>
                  <p className="text-sm text-white/45 leading-relaxed mb-4">{step.desc}</p>

                  <div className="flex items-center gap-1.5">
                    <span className="h-1 w-1 rounded-full bg-emerald-400" />
                    <span className="text-xs text-emerald-400 font-medium">{step.detail}</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  )
}
