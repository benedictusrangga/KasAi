import Link from 'next/link'
import { KasAILogo } from '@/components/logo'

export function LandingFooter() {
  return (
    <footer className="border-t border-white/[0.06] py-16">
      <div className="max-w-6xl mx-auto px-6">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-10 mb-14">
          {/* Brand */}
          <div className="col-span-2 md:col-span-1">
            <div className="mb-4">
              <KasAILogo href="/" size="md" dark={true} />
            </div>
            <p className="text-sm text-white/35 leading-relaxed mb-5">
              Keuangan bisnis, semudah kirim pesan. Dibuat untuk UMKM Indonesia.
            </p>
            <a
              href="https://t.me/Aiaccountingsbot"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 text-xs text-white/40 hover:text-white/70 transition-colors"
            >
              <svg width="14" height="14" viewBox="0 0 24 24" fill="#2AABEE">
                <path d="M12 0C5.373 0 0 5.373 0 12s5.373 12 12 12 12-5.373 12-12S18.627 0 12 0zm5.894 8.221l-1.97 9.28c-.145.658-.537.818-1.084.508l-3-2.21-1.447 1.394c-.16.16-.295.295-.605.295l.213-3.053 5.56-5.023c.242-.213-.054-.333-.373-.12l-6.871 4.326-2.962-.924c-.643-.204-.657-.643.136-.953l11.57-4.461c.537-.194 1.006.131.833.941z"/>
              </svg>
              @Aiaccountingsbot
            </a>
          </div>

          {/* Product */}
          <div>
            <p className="text-xs font-semibold text-white/30 uppercase tracking-widest mb-4">Produk</p>
            <ul className="space-y-3">
              {[
                { label: 'Fitur', href: '#fitur' },
                { label: 'Cara Kerja', href: '#cara-kerja' },
                { label: 'Harga', href: '#harga' },
                { label: 'Telegram Bot', href: '#telegram' },
              ].map(item => (
                <li key={item.label}>
                  <a href={item.href} className="text-sm text-white/40 hover:text-white/70 transition-colors">
                    {item.label}
                  </a>
                </li>
              ))}
            </ul>
          </div>

          {/* Akun */}
          <div>
            <p className="text-xs font-semibold text-white/30 uppercase tracking-widest mb-4">Akun</p>
            <ul className="space-y-3">
              {[
                { label: 'Daftar Gratis', href: '/sign-up' },
                { label: 'Masuk', href: '/sign-in' },
                { label: 'Dashboard', href: '/dashboard' },
              ].map(item => (
                <li key={item.label}>
                  <Link href={item.href} className="text-sm text-white/40 hover:text-white/70 transition-colors">
                    {item.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Bisnis */}
          <div>
            <p className="text-xs font-semibold text-white/30 uppercase tracking-widest mb-4">Bisnis</p>
            <ul className="space-y-3">
              {[
                '☕ Cafe & Kopi',
                '🌸 Florist',
                '🧺 Laundry',
                '🛍️ Toko Retail',
                '🍜 Warung Makan',
              ].map(b => (
                <li key={b}>
                  <span className="text-sm text-white/30">{b}</span>
                </li>
              ))}
            </ul>
          </div>
        </div>

        {/* Bottom bar */}
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4 pt-8 border-t border-white/[0.06]">
          <p className="text-xs text-white/25">
            © 2025 KasAI. Dibuat dengan ❤️ untuk UMKM Indonesia.
          </p>
          <div className="flex items-center gap-6">
            <span className="text-xs text-white/20">Powered by Gemini AI</span>
            <div className="flex items-center gap-1.5">
              <span className="h-1.5 w-1.5 rounded-full bg-emerald-400" />
              <span className="text-xs text-white/25">All systems operational</span>
            </div>
          </div>
        </div>
      </div>
    </footer>
  )
}
