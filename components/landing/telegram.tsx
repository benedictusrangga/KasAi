'use client'

import { useTheme } from './theme-provider'

export function LandingTelegram() {
  const { theme } = useTheme()
  const isDark = theme === 'dark'

  const TG_BLUE = '#2AABEE'
  const TG_DARK = '#229ED9'

  const messages = [
    { from: 'user', text: 'beli bahan baku kopi 450rb', time: '09:14' },
    { from: 'bot',  text: '✅ Dicatat untuk Kopi Nusantara\n📉 Pengeluaran: Rp 450.000\n📂 Kategori: Bahan Baku', time: '09:14' },
    { from: 'user', text: 'terima pembayaran catering 1.8jt', time: '11:32' },
    { from: 'bot',  text: '✅ Dicatat untuk Kopi Nusantara\n📈 Pemasukan: Rp 1.800.000\n📂 Kategori: Penjualan', time: '11:32' },
    { from: 'user', text: '/pdf', time: '17:00' },
    { from: 'bot',  isPdf: true, time: '17:00' },
  ]

  return (
    <section id="telegram" className="py-32 relative overflow-hidden"
      style={{ background: isDark ? '#0a0a0a' : '#fafafa' }}>
      {/* Background glow */}
      <div className="absolute top-1/2 left-1/4 -translate-y-1/2 w-[600px] h-[600px] rounded-full -z-10"
        style={{
          background: `radial-gradient(ellipse, ${TG_BLUE}10 0%, transparent 70%)`,
          opacity: isDark ? 0.3 : 0.2,
        }} />

      <div className="max-w-6xl mx-auto px-6">
        <div className="grid lg:grid-cols-2 gap-16 items-center">

          {/* Left: copy */}
          <div>
            <div className="inline-flex items-center gap-2 rounded-full px-3.5 py-1.5 mb-7 text-xs font-bold"
              style={{ background: `${TG_BLUE}12`, color: TG_BLUE, border: `1px solid ${TG_BLUE}25` }}>
              <svg width="13" height="13" viewBox="0 0 24 24" fill={TG_BLUE}>
                <path d="M12 0C5.373 0 0 5.373 0 12s5.373 12 12 12 12-5.373 12-12S18.627 0 12 0zm5.894 8.221l-1.97 9.28c-.145.658-.537.818-1.084.508l-3-2.21-1.447 1.394c-.16.16-.295.295-.605.295l.213-3.053 5.56-5.023c.242-.213-.054-.333-.373-.12l-6.871 4.326-2.962-.924c-.643-.204-.657-.643.136-.953l11.57-4.461c.537-.194 1.006.131.833.941z"/>
              </svg>
              Telegram Integration
            </div>

            <h2 className="text-4xl sm:text-5xl font-bold leading-[1.1] tracking-tight mb-6"
              style={{ color: isDark ? '#ffffff' : '#0a0a0a' }}>
              Catat transaksi
              <br />
              <span style={{
                backgroundImage: `linear-gradient(90deg, ${TG_BLUE}, ${TG_DARK})`,
                WebkitBackgroundClip: 'text',
                WebkitTextFillColor: 'transparent',
                backgroundClip: 'text',
              }}>langsung dari Telegram.</span>
            </h2>

            <p className="text-lg leading-relaxed mb-10"
              style={{ color: isDark ? 'rgba(255,255,255,0.45)' : 'rgba(0,0,0,0.5)' }}>
              Bot Telegram kami memahami bahasa natural Indonesia. Cukup kirim pesan seperti yang Anda tulis ke teman — tidak ada format khusus, tidak ada perintah rumit.
            </p>

            <div className="space-y-5 mb-10">
              {[
                { icon: '🎯', title: 'Kenali Anda Otomatis', desc: 'Bot mengenali Anda dari Telegram ID — tidak perlu login setiap saat.' },
                { icon: '🧠', title: 'Pahami Konteks Bisnis', desc: 'AI tahu jenis bisnis Anda dan mengkategorikan transaksi secara tepat.' },
                { icon: '📄', title: 'Kirim Laporan PDF', desc: 'Ketik /pdf dan laporan keuangan dikirim langsung ke chat Anda.' },
                { icon: '🔔', title: 'Notifikasi Budget', desc: 'Dapat peringatan otomatis saat pengeluaran mendekati batas budget.' },
              ].map((item) => (
                <div key={item.title} className="flex items-start gap-4 group">
                  <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl text-base transition-transform duration-200 group-hover:scale-110"
                    style={{ background: `${TG_BLUE}10`, border: `1px solid ${TG_BLUE}20` }}>
                    {item.icon}
                  </div>
                  <div>
                    <p className="text-sm font-semibold mb-0.5"
                      style={{ color: isDark ? '#ffffff' : '#0a0a0a' }}>
                      {item.title}
                    </p>
                    <p className="text-sm" style={{ color: isDark ? 'rgba(255,255,255,0.4)' : 'rgba(0,0,0,0.5)' }}>
                      {item.desc}
                    </p>
                  </div>
                </div>
              ))}
            </div>

            <a
              href="https://t.me/Aiaccountingsbot"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2.5 rounded-xl px-5 py-3 text-sm font-semibold text-white transition-all duration-200 hover:scale-[1.02] active:scale-[0.98]"
              style={{
                background: `linear-gradient(135deg, ${TG_BLUE}, ${TG_DARK})`,
                boxShadow: `0 8px 24px ${TG_BLUE}30`,
              }}
            >
              <svg width="17" height="17" viewBox="0 0 24 24" fill="white">
                <path d="M12 0C5.373 0 0 5.373 0 12s5.373 12 12 12 12-5.373 12-12S18.627 0 12 0zm5.894 8.221l-1.97 9.28c-.145.658-.537.818-1.084.508l-3-2.21-1.447 1.394c-.16.16-.295.295-.605.295l.213-3.053 5.56-5.023c.242-.213-.054-.333-.373-.12l-6.871 4.326-2.962-.924c-.643-.204-.657-.643.136-.953l11.57-4.461c.537-.194 1.006.131.833.941z"/>
              </svg>
              Coba @Aiaccountingsbot
            </a>
          </div>

          {/* Right: Telegram mockup */}
          <div className="relative flex justify-center lg:justify-end">
            <div className="relative w-full max-w-[340px]">
              {/* Glow */}
              <div className="absolute -inset-8 rounded-3xl blur-3xl -z-10"
                style={{ background: `radial-gradient(ellipse, ${TG_BLUE}20 0%, transparent 70%)`, opacity: isDark ? 0.4 : 0.25 }} />

              {/* Phone frame */}
              <div className="rounded-3xl p-px shadow-2xl"
                style={{ background: `linear-gradient(180deg, ${TG_BLUE}30 0%, ${isDark ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.08)'} 100%)` }}>
                <div className="rounded-[23px] overflow-hidden"
                  style={{ background: isDark ? '#17212B' : '#eef2f5' }}>

                  {/* Header */}
                  <div className="px-4 py-3 flex items-center gap-3"
                    style={{
                      background: isDark ? '#232E3C' : '#dce3ea',
                      borderBottom: isDark ? '1px solid rgba(255,255,255,0.04)' : '1px solid rgba(0,0,0,0.06)',
                    }}>
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" className="opacity-50">
                      <path d="M19 12H5M12 5l-7 7 7 7" stroke={isDark ? 'white' : '#333'} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                    </svg>
                    <div className="flex h-9 w-9 items-center justify-center rounded-full text-white text-sm font-bold"
                      style={{ background: `linear-gradient(135deg, ${TG_BLUE}, ${TG_DARK})` }}>
                      K
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-semibold leading-tight"
                        style={{ color: isDark ? '#ffffff' : '#0a0a0a' }}>
                        @Aiaccountingsbot
                      </p>
                      <p className="text-xs font-medium" style={{ color: TG_BLUE }}>online</p>
                    </div>
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" className="opacity-30">
                      <circle cx="12" cy="5" r="1.5" fill={isDark ? 'white' : '#333'}/>
                      <circle cx="12" cy="12" r="1.5" fill={isDark ? 'white' : '#333'}/>
                      <circle cx="12" cy="19" r="1.5" fill={isDark ? 'white' : '#333'}/>
                    </svg>
                  </div>

                  {/* Messages */}
                  <div className="px-3 py-4 space-y-2"
                    style={{ background: isDark ? '#17212B' : '#eef2f5', minHeight: '380px' }}>
                    <div className="flex justify-center mb-3">
                      <span className="text-[11px] px-3 py-1 rounded-full"
                        style={{
                          background: isDark ? 'rgba(255,255,255,0.04)' : 'rgba(0,0,0,0.06)',
                          color: isDark ? 'rgba(255,255,255,0.35)' : 'rgba(0,0,0,0.4)',
                        }}>
                        Hari ini
                      </span>
                    </div>

                    {messages.map((msg, i) => (
                      <div key={i} className={`flex ${msg.from === 'user' ? 'justify-end' : 'justify-start'}`}>
                        {(msg as any).isPdf ? (
                          <div className="max-w-[82%] rounded-2xl rounded-tl-sm px-3 py-2.5 flex items-center gap-3"
                            style={{
                              background: isDark ? '#232E3C' : '#dce3ea',
                              border: isDark ? '1px solid rgba(255,255,255,0.06)' : '1px solid rgba(0,0,0,0.07)',
                            }}>
                            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl"
                              style={{ background: '#E53935' }}>
                              <span className="text-white text-[10px] font-black">PDF</span>
                            </div>
                            <div>
                              <p className="text-xs font-semibold"
                                style={{ color: isDark ? '#ffffff' : '#0a0a0a' }}>
                                Laporan_Juni_2026.pdf
                              </p>
                              <p className="text-[11px]"
                                style={{ color: isDark ? 'rgba(255,255,255,0.35)' : 'rgba(0,0,0,0.4)' }}>
                                142 KB · Tap untuk buka
                              </p>
                            </div>
                          </div>
                        ) : (
                          <div
                            className={`max-w-[82%] rounded-2xl px-3 py-2 ${msg.from === 'user' ? 'rounded-tr-sm' : 'rounded-tl-sm'}`}
                            style={{
                              background: msg.from === 'user'
                                ? TG_BLUE
                                : isDark ? '#232E3C' : '#ffffff',
                              border: msg.from === 'bot'
                                ? isDark ? '1px solid rgba(255,255,255,0.05)' : '1px solid rgba(0,0,0,0.07)'
                                : 'none',
                            }}
                          >
                            <p className="text-xs leading-relaxed whitespace-pre-line"
                              style={{ color: msg.from === 'user' ? '#ffffff' : isDark ? '#ffffff' : '#0a0a0a' }}>
                              {msg.text}
                            </p>
                            <p className="text-[10px] mt-1 text-right"
                              style={{ color: msg.from === 'user' ? 'rgba(255,255,255,0.55)' : isDark ? 'rgba(255,255,255,0.25)' : 'rgba(0,0,0,0.3)' }}>
                              {msg.time}
                              {msg.from === 'user' && <span className="ml-1" style={{ color: '#4FC3F7' }}>✓✓</span>}
                            </p>
                          </div>
                        )}
                      </div>
                    ))}
                  </div>

                  {/* Input bar */}
                  <div className="px-3 py-2.5 flex items-center gap-2"
                    style={{
                      background: isDark ? '#232E3C' : '#dce3ea',
                      borderTop: isDark ? '1px solid rgba(255,255,255,0.04)' : '1px solid rgba(0,0,0,0.06)',
                    }}>
                    <div className="flex-1 rounded-full px-4 py-2 text-xs"
                      style={{
                        background: isDark ? '#17212B' : '#eef2f5',
                        color: isDark ? 'rgba(255,255,255,0.25)' : 'rgba(0,0,0,0.3)',
                      }}>
                      Ketik pesan...
                    </div>
                    <div className="flex h-8 w-8 items-center justify-center rounded-full"
                      style={{ background: TG_BLUE }}>
                      <svg width="13" height="13" viewBox="0 0 24 24" fill="white">
                        <path d="M22 2L11 13M22 2L15 22l-4-9-9-4 20-7z"/>
                      </svg>
                    </div>
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
