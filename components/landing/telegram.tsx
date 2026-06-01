export function LandingTelegram() {
  // Telegram brand colors
  const TG_BLUE = '#2AABEE'
  const TG_DARK_BLUE = '#229ED9'

  const messages = [
    {
      from: 'user',
      text: 'beli bahan baku kopi 450rb',
      time: '09:14',
    },
    {
      from: 'bot',
      text: '✅ Dicatat untuk Kopi Nusantara\n📉 Pengeluaran: Rp 450.000\n📂 Kategori: Bahan Baku',
      time: '09:14',
    },
    {
      from: 'user',
      text: 'terima pembayaran catering 1.8jt',
      time: '11:32',
    },
    {
      from: 'bot',
      text: '✅ Dicatat untuk Kopi Nusantara\n📈 Pemasukan: Rp 1.800.000\n📂 Kategori: Penjualan',
      time: '11:32',
    },
    {
      from: 'user',
      text: '/pdf',
      time: '17:00',
    },
    {
      from: 'bot',
      text: '⏳ Membuat laporan PDF Juni 2026...',
      time: '17:00',
      isLoading: true,
    },
    {
      from: 'bot',
      isPdf: true,
      time: '17:00',
    },
  ]

  return (
    <section id="telegram" className="py-32 relative overflow-hidden">
      {/* Background */}
      <div className="absolute inset-0 -z-10">
        <div className="absolute top-1/2 left-1/4 -translate-y-1/2 w-[500px] h-[500px] rounded-full blur-[120px]"
          style={{ background: `${TG_BLUE}08` }} />
      </div>

      <div className="max-w-6xl mx-auto px-6">
        <div className="grid lg:grid-cols-2 gap-16 items-center">

          {/* Left: copy */}
          <div>
            <div className="inline-flex items-center gap-2 rounded-full px-3 py-1.5 mb-6 text-xs font-semibold"
              style={{ background: `${TG_BLUE}15`, color: TG_BLUE, border: `1px solid ${TG_BLUE}30` }}>
              <svg width="14" height="14" viewBox="0 0 24 24" fill={TG_BLUE}>
                <path d="M12 0C5.373 0 0 5.373 0 12s5.373 12 12 12 12-5.373 12-12S18.627 0 12 0zm5.894 8.221l-1.97 9.28c-.145.658-.537.818-1.084.508l-3-2.21-1.447 1.394c-.16.16-.295.295-.605.295l.213-3.053 5.56-5.023c.242-.213-.054-.333-.373-.12l-6.871 4.326-2.962-.924c-.643-.204-.657-.643.136-.953l11.57-4.461c.537-.194 1.006.131.833.941z"/>
              </svg>
              Telegram Integration
            </div>

            <h2 className="text-4xl sm:text-5xl font-bold text-white leading-tight mb-6">
              Catat transaksi tanpa
              <br />
              <span style={{ color: TG_BLUE }}>buka aplikasi.</span>
            </h2>

            <p className="text-white/50 text-lg leading-relaxed mb-8">
              Bot Telegram kami memahami bahasa natural Indonesia. Cukup kirim pesan seperti yang Anda tulis ke teman — tidak ada format khusus, tidak ada perintah rumit.
            </p>

            <div className="space-y-4 mb-10">
              {[
                { icon: '🎯', title: 'Kenali Anda Otomatis', desc: 'Bot mengenali Anda dari Telegram ID — tidak perlu login setiap saat.' },
                { icon: '🧠', title: 'Pahami Konteks Bisnis', desc: 'AI tahu jenis bisnis Anda dan mengkategorikan transaksi secara tepat.' },
                { icon: '📄', title: 'Kirim Laporan PDF', desc: 'Ketik /pdf dan laporan keuangan dikirim langsung ke chat Anda.' },
                { icon: '🔔', title: 'Notifikasi Budget', desc: 'Dapat peringatan otomatis saat pengeluaran mendekati batas budget.' },
              ].map((item) => (
                <div key={item.title} className="flex items-start gap-4">
                  <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl text-base"
                    style={{ background: `${TG_BLUE}12`, border: `1px solid ${TG_BLUE}20` }}>
                    {item.icon}
                  </div>
                  <div>
                    <p className="text-sm font-semibold text-white mb-0.5">{item.title}</p>
                    <p className="text-sm text-white/45">{item.desc}</p>
                  </div>
                </div>
              ))}
            </div>

            <a
              href="https://t.me/Aiaccountingsbot"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2.5 rounded-xl px-5 py-3 text-sm font-semibold text-white transition-all duration-150 hover:opacity-90"
              style={{ background: `linear-gradient(135deg, ${TG_BLUE}, ${TG_DARK_BLUE})`, boxShadow: `0 8px 24px ${TG_BLUE}30` }}
            >
              <svg width="18" height="18" viewBox="0 0 24 24" fill="white">
                <path d="M12 0C5.373 0 0 5.373 0 12s5.373 12 12 12 12-5.373 12-12S18.627 0 12 0zm5.894 8.221l-1.97 9.28c-.145.658-.537.818-1.084.508l-3-2.21-1.447 1.394c-.16.16-.295.295-.605.295l.213-3.053 5.56-5.023c.242-.213-.054-.333-.373-.12l-6.871 4.326-2.962-.924c-.643-.204-.657-.643.136-.953l11.57-4.461c.537-.194 1.006.131.833.941z"/>
              </svg>
              Coba @Aiaccountingsbot
            </a>
          </div>

          {/* Right: Telegram mockup */}
          <div className="relative">
            {/* Phone frame */}
            <div className="relative mx-auto max-w-[340px]">
              {/* Glow */}
              <div className="absolute -inset-6 rounded-3xl blur-2xl -z-10"
                style={{ background: `${TG_BLUE}12` }} />

              <div className="rounded-3xl overflow-hidden shadow-2xl border border-white/[0.08]"
                style={{ background: '#17212B' }}>

                {/* Telegram header */}
                <div className="px-4 py-3 flex items-center gap-3"
                  style={{ background: '#232E3C', borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
                  {/* Back arrow */}
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" className="opacity-60">
                    <path d="M19 12H5M12 5l-7 7 7 7" stroke="white" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                  </svg>
                  {/* Bot avatar */}
                  <div className="flex h-9 w-9 items-center justify-center rounded-full text-white text-sm font-bold"
                    style={{ background: `linear-gradient(135deg, ${TG_BLUE}, ${TG_DARK_BLUE})` }}>
                    K
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold text-white leading-tight">@Aiaccountingsbot</p>
                    <p className="text-xs" style={{ color: TG_BLUE }}>online</p>
                  </div>
                  {/* Menu dots */}
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" className="opacity-40">
                    <circle cx="12" cy="5" r="1.5" fill="white"/>
                    <circle cx="12" cy="12" r="1.5" fill="white"/>
                    <circle cx="12" cy="19" r="1.5" fill="white"/>
                  </svg>
                </div>

                {/* Messages */}
                <div className="px-3 py-4 space-y-2 min-h-[420px]" style={{ background: '#17212B' }}>
                  {/* Date separator */}
                  <div className="flex justify-center mb-3">
                    <span className="text-[11px] px-3 py-1 rounded-full text-white/40"
                      style={{ background: 'rgba(255,255,255,0.05)' }}>
                      Hari ini
                    </span>
                  </div>

                  {messages.map((msg, i) => (
                    <div key={i} className={`flex ${msg.from === 'user' ? 'justify-end' : 'justify-start'}`}>
                      {msg.isPdf ? (
                        // PDF file message
                        <div className="max-w-[80%] rounded-2xl rounded-tl-sm px-3 py-2.5 flex items-center gap-3"
                          style={{ background: '#232E3C', border: '1px solid rgba(255,255,255,0.06)' }}>
                          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl"
                            style={{ background: '#E53935' }}>
                            <span className="text-white text-xs font-bold">PDF</span>
                          </div>
                          <div>
                            <p className="text-xs font-semibold text-white">Laporan_Juni_2026.pdf</p>
                            <p className="text-[11px] text-white/40">142 KB · Tap untuk buka</p>
                          </div>
                        </div>
                      ) : (
                        <div
                          className={`max-w-[80%] rounded-2xl px-3 py-2 ${
                            msg.from === 'user'
                              ? 'rounded-tr-sm'
                              : 'rounded-tl-sm'
                          }`}
                          style={{
                            background: msg.from === 'user'
                              ? TG_BLUE
                              : '#232E3C',
                            border: msg.from === 'bot' ? '1px solid rgba(255,255,255,0.06)' : 'none',
                          }}
                        >
                          <p className="text-xs text-white leading-relaxed whitespace-pre-line">
                            {msg.text}
                          </p>
                          <p className={`text-[10px] mt-1 text-right ${
                            msg.from === 'user' ? 'text-white/60' : 'text-white/30'
                          }`}>
                            {msg.time}
                            {msg.from === 'user' && (
                              <span className="ml-1" style={{ color: '#4FC3F7' }}>✓✓</span>
                            )}
                          </p>
                        </div>
                      )}
                    </div>
                  ))}
                </div>

                {/* Input bar */}
                <div className="px-3 py-2.5 flex items-center gap-2"
                  style={{ background: '#232E3C', borderTop: '1px solid rgba(255,255,255,0.05)' }}>
                  <div className="flex-1 rounded-full px-4 py-2 text-xs text-white/30"
                    style={{ background: '#17212B' }}>
                    Ketik pesan...
                  </div>
                  <div className="flex h-8 w-8 items-center justify-center rounded-full"
                    style={{ background: TG_BLUE }}>
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="white">
                      <path d="M22 2L11 13M22 2L15 22l-4-9-9-4 20-7z"/>
                    </svg>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}
