'use client'

import { useTheme } from './theme-provider'

export function LandingFeatures() {
  const { theme } = useTheme()
  const isDark = theme === 'dark'

  const features = [
    {
      id: 'telegram',
      span: 'lg:col-span-2',
      accent: { bg: 'rgba(139,92,246,0.08)', border: 'rgba(139,92,246,0.2)', text: '#a78bfa', glow: 'rgba(139,92,246,0.12)' },
      accentLight: { bg: 'rgba(139,92,246,0.06)', border: 'rgba(139,92,246,0.18)', text: '#7C3AED', glow: 'rgba(139,92,246,0.08)' },
      badge: 'Paling Populer',
      icon: (color: string) => (
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
          <path d="M21 15a2 2 0 01-2 2H7l-4 4V5a2 2 0 012-2h14a2 2 0 012 2z" stroke={color} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
        </svg>
      ),
      title: 'Catat Transaksi via Telegram',
      desc: 'Kirim pesan seperti "beli gula 50rb" atau "terima bayaran 1.2jt" — AI langsung mencatat, mengkategorikan, dan mengkonfirmasi. Tidak perlu buka aplikasi sama sekali.',
      tags: ['Bahasa natural Indonesia', 'Konfirmasi instan', 'Pemasukan & pengeluaran', 'Foto struk otomatis'],
    },
    {
      id: 'scan',
      span: '',
      accent: { bg: 'rgba(6,182,212,0.07)', border: 'rgba(6,182,212,0.18)', text: '#67e8f9', glow: 'rgba(6,182,212,0.1)' },
      accentLight: { bg: 'rgba(6,182,212,0.06)', border: 'rgba(6,182,212,0.15)', text: '#0891b2', glow: 'rgba(6,182,212,0.07)' },
      icon: (color: string) => (
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
          <path d="M23 19a2 2 0 01-2 2H3a2 2 0 01-2-2V8a2 2 0 012-2h4l2-3h6l2 3h4a2 2 0 012 2z" stroke={color} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
          <circle cx="12" cy="13" r="4" stroke={color} strokeWidth="1.5"/>
        </svg>
      ),
      title: 'Scan Struk dengan AI',
      desc: 'Foto struk belanja atau bukti transfer — Gemini AI membaca dan mengekstrak semua detail transaksi secara akurat dalam hitungan detik.',
    },
    {
      id: 'advisor',
      span: '',
      accent: { bg: 'rgba(16,185,129,0.07)', border: 'rgba(16,185,129,0.18)', text: '#6ee7b7', glow: 'rgba(16,185,129,0.1)' },
      accentLight: { bg: 'rgba(16,185,129,0.06)', border: 'rgba(16,185,129,0.15)', text: '#059669', glow: 'rgba(16,185,129,0.07)' },
      icon: (color: string) => (
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
          <path d="M12 2a10 10 0 110 20A10 10 0 0112 2z" stroke={color} strokeWidth="1.5"/>
          <path d="M12 8v4l3 3" stroke={color} strokeWidth="1.5" strokeLinecap="round"/>
        </svg>
      ),
      title: 'AI Financial Advisor',
      desc: 'Tanya langsung: "Bulan ini saya boros di mana?" atau "Kapan bisnis saya paling ramai?" — AI menjawab berdasarkan data nyata Anda.',
    },
    {
      id: 'report',
      span: '',
      accent: { bg: 'rgba(245,158,11,0.07)', border: 'rgba(245,158,11,0.18)', text: '#fcd34d', glow: 'rgba(245,158,11,0.1)' },
      accentLight: { bg: 'rgba(245,158,11,0.06)', border: 'rgba(245,158,11,0.15)', text: '#d97706', glow: 'rgba(245,158,11,0.07)' },
      icon: (color: string) => (
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
          <path d="M18 20V10M12 20V4M6 20v-6" stroke={color} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
        </svg>
      ),
      title: 'Laporan Real-time',
      desc: 'Dashboard dengan grafik pemasukan, pengeluaran, laba bersih, dan breakdown per kategori. Export PDF langsung dari Telegram.',
    },
    {
      id: 'multi',
      span: '',
      accent: { bg: 'rgba(239,68,68,0.07)', border: 'rgba(239,68,68,0.18)', text: '#fca5a5', glow: 'rgba(239,68,68,0.1)' },
      accentLight: { bg: 'rgba(239,68,68,0.06)', border: 'rgba(239,68,68,0.15)', text: '#dc2626', glow: 'rgba(239,68,68,0.07)' },
      icon: (color: string) => (
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
          <path d="M3 9l9-7 9 7v11a2 2 0 01-2 2H5a2 2 0 01-2-2z" stroke={color} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
          <path d="M9 22V12h6v10" stroke={color} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
        </svg>
      ),
      title: 'Multi-Bisnis',
      desc: 'Kelola beberapa bisnis dari satu akun. Setiap bisnis punya dashboard, laporan, kategori, dan produk sendiri yang terpisah.',
    },
    {
      id: 'team',
      span: 'lg:col-span-2',
      badge: 'Business Pro & Enterprise',
      accent: { bg: 'rgba(16,185,129,0.08)', border: 'rgba(16,185,129,0.22)', text: '#6ee7b7', glow: 'rgba(16,185,129,0.12)' },
      accentLight: { bg: 'rgba(16,185,129,0.06)', border: 'rgba(16,185,129,0.18)', text: '#059669', glow: 'rgba(16,185,129,0.08)' },
      icon: (color: string) => (
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
          <circle cx="9" cy="7" r="4" stroke={color} strokeWidth="1.5"/>
          <path d="M3 21v-2a4 4 0 014-4h4a4 4 0 014 4v2" stroke={color} strokeWidth="1.5" strokeLinecap="round"/>
          <path d="M16 3.13a4 4 0 010 7.75" stroke={color} strokeWidth="1.5" strokeLinecap="round"/>
          <path d="M21 21v-2a4 4 0 00-3-3.87" stroke={color} strokeWidth="1.5" strokeLinecap="round"/>
        </svg>
      ),
      title: 'Tim Kolaborasi — Admin & Owner',
      desc: 'Pemilik bisnis undang kasir atau admin sebagai anggota tim. Admin catat transaksi via Telegram atau dashboard — semua data langsung masuk ke bisnis owner secara real-time. Owner pantau laporan gabungan semua admin dari satu dashboard.',
      tags: ['Audit trail per anggota', 'Filter transaksi by admin', 'Telegram bot untuk admin', 'Max 3 admin (Pro) · Unlimited (Enterprise)'],
    },
    {
      id: 'goals',
      span: '',
      accent: { bg: 'rgba(59,130,246,0.07)', border: 'rgba(59,130,246,0.18)', text: '#93c5fd', glow: 'rgba(59,130,246,0.1)' },
      accentLight: { bg: 'rgba(59,130,246,0.06)', border: 'rgba(59,130,246,0.15)', text: '#2563eb', glow: 'rgba(59,130,246,0.07)' },
      icon: (color: string) => (
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
          <circle cx="12" cy="12" r="10" stroke={color} strokeWidth="1.5"/>
          <circle cx="12" cy="12" r="6" stroke={color} strokeWidth="1.5"/>
          <circle cx="12" cy="12" r="2" fill={color}/>
        </svg>
      ),
      title: 'Goals & Budget',
      desc: 'Tetapkan target keuangan dan batas anggaran per kategori. Dapat notifikasi otomatis via Telegram saat budget hampir habis.',
    },
    {
      id: 'pdf',
      span: '',
      accent: { bg: 'rgba(168,85,247,0.07)', border: 'rgba(168,85,247,0.18)', text: '#c4b5fd', glow: 'rgba(168,85,247,0.1)' },
      accentLight: { bg: 'rgba(168,85,247,0.06)', border: 'rgba(168,85,247,0.15)', text: '#9333ea', glow: 'rgba(168,85,247,0.07)' },
      icon: (color: string) => (
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
          <path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z" stroke={color} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
          <path d="M14 2v6h6M16 13H8M16 17H8M10 9H8" stroke={color} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
        </svg>
      ),
      title: 'Export PDF Profesional',
      desc: 'Generate laporan keuangan PDF langsung dari Telegram dengan perintah /pdf. Dikirim langsung ke chat Anda.',
    },
    {
      id: 'security',
      span: '',
      accent: { bg: 'rgba(20,184,166,0.07)', border: 'rgba(20,184,166,0.18)', text: '#5eead4', glow: 'rgba(20,184,166,0.1)' },
      accentLight: { bg: 'rgba(20,184,166,0.06)', border: 'rgba(20,184,166,0.15)', text: '#0d9488', glow: 'rgba(20,184,166,0.07)' },
      icon: (color: string) => (
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
          <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" stroke={color} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
        </svg>
      ),
      title: 'Aman & Terenkripsi',
      desc: 'Data disimpan di database terenkripsi. Autentikasi modern, session aman, dan tidak ada data yang pernah dibagikan ke pihak ketiga.',
    },
    {
      id: 'category',
      span: '',
      accent: { bg: 'rgba(249,115,22,0.07)', border: 'rgba(249,115,22,0.18)', text: '#fdba74', glow: 'rgba(249,115,22,0.1)' },
      accentLight: { bg: 'rgba(249,115,22,0.06)', border: 'rgba(249,115,22,0.15)', text: '#ea580c', glow: 'rgba(249,115,22,0.07)' },
      icon: (color: string) => (
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
          <path d="M20.59 13.41l-7.17 7.17a2 2 0 01-2.83 0L2 12V2h10l8.59 8.59a2 2 0 010 2.82z" stroke={color} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
          <circle cx="7" cy="7" r="1.5" fill={color}/>
        </svg>
      ),
      title: 'Kategori & Produk Kustom',
      desc: 'Buat kategori pengeluaran dan daftar produk sesuai jenis bisnis Anda. AI akan otomatis menggunakan kategori yang Anda buat.',
    },
  ]

  return (
    <section id="fitur" className="py-32 relative overflow-hidden"
      style={{ background: isDark ? '#0a0a0a' : '#fafafa' }}>
      {/* Background glow */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[700px] h-[500px] -z-10"
        style={{
          background: isDark
            ? 'radial-gradient(ellipse, rgba(99,102,241,0.08) 0%, transparent 70%)'
            : 'radial-gradient(ellipse, rgba(99,102,241,0.05) 0%, transparent 70%)',
          opacity: isDark ? 0.4 : 0.6,
        }} />

      <div className="max-w-6xl mx-auto px-6">
        {/* Section header */}
        <div className="max-w-2xl mb-20">
          <p className="text-[11px] font-bold text-violet-500 uppercase tracking-[0.15em] mb-4">Fitur Unggulan</p>
          <h2 className="text-4xl sm:text-5xl font-bold leading-[1.1] tracking-tight mb-5"
            style={{ color: isDark ? '#ffffff' : '#0a0a0a' }}>
            Satu platform untuk semua
            <br />
            kebutuhan keuangan bisnis Anda
          </h2>
          <p className="text-lg leading-relaxed"
            style={{ color: isDark ? 'rgba(255,255,255,0.45)' : 'rgba(0,0,0,0.5)' }}>
            Dari pencatatan otomatis hingga analisis AI — KasAI menggantikan spreadsheet, buku kas, dan akuntan manual sekaligus.
          </p>
        </div>

        {/* Bento grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
          {features.map((f) => {
            const a = isDark ? f.accent : f.accentLight
            return (
              <div
                key={f.id}
                className={`group relative rounded-2xl p-7 overflow-hidden transition-all duration-300 hover:-translate-y-0.5 ${f.span}`}
                style={{
                  background: `linear-gradient(135deg, ${a.bg} 0%, ${isDark ? 'rgba(255,255,255,0.02)' : 'rgba(0,0,0,0.01)'} 100%)`,
                  border: `1px solid ${a.border}`,
                }}
              >
                {/* Corner glow */}
                <div className="absolute top-0 right-0 w-48 h-48 rounded-full -z-10 opacity-0 group-hover:opacity-100 transition-opacity duration-500"
                  style={{ background: `radial-gradient(circle at top right, ${a.glow}, transparent 70%)` }} />

                {/* Icon + badge row */}
                <div className="flex items-center justify-between mb-5">
                  <div className="flex h-10 w-10 items-center justify-center rounded-xl"
                    style={{ background: a.bg, border: `1px solid ${a.border}` }}>
                    {f.icon(a.text)}
                  </div>
                  {f.badge && (
                    <span className="text-[10px] font-bold uppercase tracking-wider px-2.5 py-1 rounded-full"
                      style={{ background: a.bg, color: a.text, border: `1px solid ${a.border}` }}>
                      {f.badge}
                    </span>
                  )}
                </div>

                <h3 className="text-base font-bold mb-2.5 tracking-tight"
                  style={{ color: isDark ? '#ffffff' : '#0a0a0a' }}>
                  {f.title}
                </h3>
                <p className="text-sm leading-relaxed mb-4"
                  style={{ color: isDark ? 'rgba(255,255,255,0.45)' : 'rgba(0,0,0,0.5)' }}>
                  {f.desc}
                </p>

                {f.tags && (
                  <div className="flex flex-wrap gap-1.5">
                    {f.tags.map(tag => (
                      <span key={tag} className="text-[11px] px-2.5 py-1 rounded-full"
                        style={{
                          background: isDark ? 'rgba(255,255,255,0.04)' : 'rgba(0,0,0,0.04)',
                          border: isDark ? '1px solid rgba(255,255,255,0.07)' : '1px solid rgba(0,0,0,0.07)',
                          color: isDark ? 'rgba(255,255,255,0.4)' : 'rgba(0,0,0,0.45)',
                        }}>
                        {tag}
                      </span>
                    ))}
                  </div>
                )}
              </div>
            )
          })}
        </div>
      </div>
    </section>
  )
}
