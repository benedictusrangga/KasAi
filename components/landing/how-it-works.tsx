'use client'

import { useTheme } from './theme-provider'

export function LandingHowItWorks() {
  const { theme } = useTheme()
  const isDark = theme === 'dark'

  const steps = [
    {
      number: '01',
      title: 'Daftar & Setup Bisnis',
      desc: 'Buat akun gratis dalam 2 menit. Pilih tipe bisnis Anda — cafe, laundry, retail, atau keuangan personal. AI akan menyesuaikan kategori dan saran secara otomatis.',
      detail: 'Tidak perlu kartu kredit',
      gradient: 'linear-gradient(135deg, #7C3AED, #6366F1)',
      glow: 'rgba(124,58,237,0.3)',
    },
    {
      number: '02',
      title: 'Hubungkan Telegram',
      desc: 'Buka Pengaturan → masukkan Telegram ID Anda (dapatkan dari @userinfobot). Bot langsung mengenali Anda dan siap menerima transaksi. Satu kali setup, selamanya aktif.',
      detail: 'Setup < 1 menit',
      gradient: 'linear-gradient(135deg, #0EA5E9, #2AABEE)',
      glow: 'rgba(14,165,233,0.3)',
    },
    {
      number: '03',
      title: 'Catat Transaksi',
      desc: 'Kirim pesan ke bot, foto struk, rekam suara, atau input manual di dashboard. AI mencatat, mengkategorikan, dan mengkonfirmasi setiap transaksi secara real-time.',
      detail: 'Bahasa natural Indonesia',
      gradient: 'linear-gradient(135deg, #10B981, #34D399)',
      glow: 'rgba(16,185,129,0.3)',
    },
    {
      number: '04',
      title: 'Analisis & Laporan',
      desc: 'Lihat dashboard real-time, tanya AI tentang keuangan bisnis Anda, dan export laporan PDF profesional langsung dari Telegram kapan saja.',
      detail: 'Laporan PDF instan',
      gradient: 'linear-gradient(135deg, #F59E0B, #FBBF24)',
      glow: 'rgba(245,158,11,0.3)',
    },
  ]

  return (
    <section id="cara-kerja" className="py-32 relative overflow-hidden"
      style={{ background: isDark ? '#0a0a0a' : '#f5f5f5' }}>
      {/* Subtle bg stripe */}
      <div className="absolute inset-0 -z-10"
        style={{
          background: isDark
            ? 'linear-gradient(180deg, transparent 0%, rgba(255,255,255,0.008) 50%, transparent 100%)'
            : 'linear-gradient(180deg, transparent 0%, rgba(0,0,0,0.015) 50%, transparent 100%)',
        }} />

      <div className="max-w-6xl mx-auto px-6">
        {/* Header */}
        <div className="text-center mb-20">
          <p className="text-[11px] font-bold text-violet-500 uppercase tracking-[0.15em] mb-4">Cara Kerja</p>
          <h2 className="text-4xl sm:text-5xl font-bold tracking-tight mb-5"
            style={{ color: isDark ? '#ffffff' : '#0a0a0a' }}>
            Dari daftar hingga laporan
            <br />
            <span style={{ color: isDark ? 'rgba(255,255,255,0.3)' : 'rgba(0,0,0,0.25)' }}>dalam hitungan menit.</span>
          </h2>
          <p className="max-w-lg mx-auto"
            style={{ color: isDark ? 'rgba(255,255,255,0.45)' : 'rgba(0,0,0,0.5)' }}>
            Empat langkah sederhana untuk mulai mengelola keuangan bisnis Anda dengan AI.
          </p>
        </div>

        {/* Steps */}
        <div className="relative">


          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
            {steps.map((step) => (
              <div key={step.number} className="group relative flex flex-col">
                {/* Step number circle */}
                <div className="relative mb-6 flex justify-center lg:justify-start">
                  <div
                    className="relative flex h-[52px] w-[52px] items-center justify-center rounded-2xl text-white font-black text-sm shadow-lg transition-transform duration-300 group-hover:scale-110"
                    style={{ background: step.gradient, boxShadow: `0 8px 24px ${step.glow}` }}
                  >
                    {step.number}
                    <div className="hidden lg:block absolute -bottom-[calc(24px+1px)] left-1/2 -translate-x-1/2 h-2 w-2 rounded-full"
                      style={{ background: step.gradient, boxShadow: `0 0 8px ${step.glow}` }} />
                  </div>
                </div>

                {/* Card */}
                <div
                  className="flex-1 rounded-2xl p-6 transition-all duration-300 group-hover:-translate-y-0.5"
                  style={{
                    background: isDark
                      ? 'linear-gradient(135deg, rgba(255,255,255,0.04) 0%, rgba(255,255,255,0.02) 100%)'
                      : 'linear-gradient(135deg, rgba(255,255,255,0.9) 0%, rgba(255,255,255,0.7) 100%)',
                    border: isDark ? '1px solid rgba(255,255,255,0.07)' : '1px solid rgba(0,0,0,0.07)',
                    boxShadow: isDark ? 'none' : '0 2px 12px rgba(0,0,0,0.04)',
                  }}
                >
                  <h3 className="text-base font-bold mb-3 tracking-tight"
                    style={{ color: isDark ? '#ffffff' : '#0a0a0a' }}>
                    {step.title}
                  </h3>
                  <p className="text-sm leading-relaxed mb-5"
                    style={{ color: isDark ? 'rgba(255,255,255,0.4)' : 'rgba(0,0,0,0.5)' }}>
                    {step.desc}
                  </p>
                  <div className="flex items-center gap-2">
                    <span className="h-1.5 w-1.5 rounded-full bg-emerald-400 shadow-[0_0_6px_rgba(52,211,153,0.6)]" />
                    <span className="text-xs text-emerald-500 font-semibold">{step.detail}</span>
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
