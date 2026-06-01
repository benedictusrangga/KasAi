import { auth } from '@/lib/auth'
import { headers, cookies } from 'next/headers'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'

export const metadata = {
  title: 'KasAI — Akuntansi Cerdas untuk UMKM Indonesia',
  description:
    'Catat transaksi lewat Telegram, foto struk, atau suara. AI kami memahami bisnis Anda dan memberikan laporan keuangan real-time.',
}

export default async function LandingPage() {
  const h = await headers()
  const c = await cookies()
  const cookieString = c.getAll().map((ck) => `${ck.name}=${ck.value}`).join('; ')
  const reqHeaders = new Headers(h as any)
  if (cookieString) reqHeaders.set('cookie', cookieString)
  const session = await auth.api.getSession({ headers: reqHeaders })
  if (session?.user) redirect('/dashboard')

  return (
    <div className="min-h-screen bg-background">
      {/* Navbar */}
      <header className="sticky top-0 z-50 border-b border-border/60 bg-background/80 backdrop-blur-md">
        <div className="container mx-auto flex h-16 items-center justify-between px-6">
          <div className="flex items-center gap-2">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary text-primary-foreground font-bold text-sm">
              K
            </div>
            <span className="text-lg font-bold text-foreground">KasAI</span>
          </div>
          <nav className="hidden md:flex items-center gap-8 text-sm text-muted-foreground">
            <a href="#fitur" className="hover:text-foreground transition-colors">Fitur</a>
            <a href="#cara-kerja" className="hover:text-foreground transition-colors">Cara Kerja</a>
            <a href="#harga" className="hover:text-foreground transition-colors">Harga</a>
          </nav>
          <div className="flex items-center gap-3">
            <Link href="/sign-in">
              <Button variant="ghost" size="sm">Masuk</Button>
            </Link>
            <Link href="/sign-up">
              <Button size="sm">Coba Gratis</Button>
            </Link>
          </div>
        </div>
      </header>

      {/* Hero */}
      <section className="relative overflow-hidden pt-20 pb-32">
        {/* Background gradient */}
        <div className="pointer-events-none absolute inset-0 -z-10">
          <div className="absolute left-1/2 top-0 h-[600px] w-[900px] -translate-x-1/2 rounded-full bg-primary/5 blur-3xl" />
        </div>

        <div className="container mx-auto px-6 text-center">
          <Badge variant="secondary" className="mb-6 px-4 py-1.5 text-sm font-medium">
            🚀 Didukung Gemini AI · Tersedia di Telegram
          </Badge>

          <h1 className="mx-auto max-w-4xl text-5xl font-bold leading-tight tracking-tight text-foreground md:text-6xl lg:text-7xl">
            Akuntansi UMKM{' '}
            <span className="text-primary">Semudah Chat</span>{' '}
            di Telegram
          </h1>

          <p className="mx-auto mt-6 max-w-2xl text-lg text-muted-foreground md:text-xl">
            Cukup kirim pesan ke bot Telegram kami — AI langsung mencatat transaksi,
            mengkategorikan pengeluaran, dan menyajikan laporan keuangan bisnis Anda secara real-time.
          </p>

          <div className="mt-10 flex flex-col items-center gap-4 sm:flex-row sm:justify-center">
            <Link href="/sign-up">
              <Button size="lg" className="h-12 px-8 text-base font-semibold shadow-lg shadow-primary/25">
                Mulai Gratis Sekarang
              </Button>
            </Link>
            <Link href="/sign-in">
              <Button variant="outline" size="lg" className="h-12 px-8 text-base">
                Sudah punya akun? Masuk
              </Button>
            </Link>
          </div>

          <p className="mt-4 text-sm text-muted-foreground">
            Tidak perlu kartu kredit · Setup dalam 2 menit
          </p>

          {/* Mock UI Preview */}
          <div className="mx-auto mt-16 max-w-4xl">
            <div className="rounded-2xl border border-border bg-card shadow-2xl shadow-primary/10 overflow-hidden">
              {/* Window chrome */}
              <div className="flex items-center gap-2 border-b border-border bg-muted/50 px-4 py-3">
                <div className="h-3 w-3 rounded-full bg-rose-400" />
                <div className="h-3 w-3 rounded-full bg-amber-400" />
                <div className="h-3 w-3 rounded-full bg-emerald-400" />
                <span className="ml-3 text-xs text-muted-foreground">kasai.app/dashboard</span>
              </div>
              {/* Dashboard preview */}
              <div className="grid grid-cols-3 gap-4 p-6">
                <div className="rounded-xl border border-border bg-background p-4">
                  <p className="text-xs text-muted-foreground mb-1">Total Pemasukan</p>
                  <p className="text-2xl font-bold text-emerald-600">Rp 12,4 jt</p>
                  <p className="text-xs text-emerald-600 mt-1">↑ 18% bulan ini</p>
                </div>
                <div className="rounded-xl border border-border bg-background p-4">
                  <p className="text-xs text-muted-foreground mb-1">Total Pengeluaran</p>
                  <p className="text-2xl font-bold text-rose-500">Rp 7,2 jt</p>
                  <p className="text-xs text-muted-foreground mt-1">↓ 5% dari bulan lalu</p>
                </div>
                <div className="rounded-xl border border-border bg-background p-4">
                  <p className="text-xs text-muted-foreground mb-1">Laba Bersih</p>
                  <p className="text-2xl font-bold text-primary">Rp 5,2 jt</p>
                  <p className="text-xs text-primary mt-1">↑ 42% pertumbuhan</p>
                </div>
              </div>
              <div className="px-6 pb-6">
                <div className="rounded-xl border border-border bg-background p-4">
                  <p className="text-xs font-semibold text-muted-foreground mb-3">TRANSAKSI TERBARU</p>
                  {[
                    { desc: 'Beli bahan baku kopi', amount: '-Rp 450.000', type: 'expense', source: '📱 Telegram', time: '2 menit lalu' },
                    { desc: 'Penjualan kopi pagi', amount: '+Rp 1.200.000', type: 'income', source: '✍️ Manual', time: '1 jam lalu' },
                    { desc: 'Bayar listrik', amount: '-Rp 320.000', type: 'expense', source: '📷 Struk', time: '3 jam lalu' },
                  ].map((t, i) => (
                    <div key={i} className="flex items-center justify-between py-2 border-b border-border last:border-0">
                      <div>
                        <p className="text-sm font-medium text-foreground">{t.desc}</p>
                        <p className="text-xs text-muted-foreground">{t.source} · {t.time}</p>
                      </div>
                      <span className={`text-sm font-semibold ${t.type === 'income' ? 'text-emerald-600' : 'text-rose-500'}`}>
                        {t.amount}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Social Proof */}
      <section className="border-y border-border bg-muted/30 py-10">
        <div className="container mx-auto px-6">
          <p className="text-center text-sm text-muted-foreground mb-6">
            Dipercaya oleh pemilik UMKM di seluruh Indonesia
          </p>
          <div className="flex flex-wrap justify-center gap-8 text-muted-foreground">
            {['☕ Cafe & Resto', '🌸 Florist', '🧺 Laundry', '🛍️ Toko Retail', '🏪 Warung'].map((b) => (
              <span key={b} className="text-sm font-medium">{b}</span>
            ))}
          </div>
        </div>
      </section>

      {/* Features */}
      <section id="fitur" className="py-24">
        <div className="container mx-auto px-6">
          <div className="text-center mb-16">
            <Badge variant="secondary" className="mb-4">Fitur Unggulan</Badge>
            <h2 className="text-4xl font-bold text-foreground mb-4">
              Semua yang Anda butuhkan, dalam satu platform
            </h2>
            <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
              Dirancang khusus untuk UMKM Indonesia yang ingin kelola keuangan dengan mudah tanpa perlu jadi akuntan.
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[
              {
                icon: '💬',
                title: 'Catat via Telegram',
                desc: 'Kirim pesan seperti "beli gula 50rb" — AI langsung mencatat dan mengkategorikan otomatis. Tidak perlu buka aplikasi.',
                badge: 'Paling Populer',
              },
              {
                icon: '📷',
                title: 'Scan Struk Otomatis',
                desc: 'Foto struk belanja, AI membaca dan mengekstrak semua item transaksi secara akurat menggunakan OCR berbasis Gemini.',
                badge: null,
              },
              {
                icon: '🤖',
                title: 'AI Financial Advisor',
                desc: 'Tanya langsung ke AI: "Bulan ini saya boros di mana?" atau "Bagaimana tren penjualan saya?" — jawaban instan.',
                badge: null,
              },
              {
                icon: '📊',
                title: 'Laporan Real-time',
                desc: 'Dashboard dengan grafik pemasukan, pengeluaran, laba bersih, dan breakdown per kategori yang selalu up-to-date.',
                badge: null,
              },
              {
                icon: '🏪',
                title: 'Multi-Bisnis',
                desc: 'Kelola beberapa bisnis sekaligus dari satu akun. Setiap bisnis punya dashboard, laporan, dan produk sendiri.',
                badge: null,
              },
              {
                icon: '🔒',
                title: 'Aman & Terpercaya',
                desc: 'Data Anda dienkripsi dan disimpan aman. Autentikasi modern dengan Better Auth, tidak ada data yang bocor.',
                badge: null,
              },
            ].map((f) => (
              <div key={f.title} className="relative rounded-2xl border border-border bg-card p-6 hover:border-primary/50 hover:shadow-lg hover:shadow-primary/5 transition-all duration-200">
                {f.badge && (
                  <Badge className="absolute -top-3 left-4 text-xs">{f.badge}</Badge>
                )}
                <div className="text-3xl mb-4">{f.icon}</div>
                <h3 className="text-lg font-semibold text-foreground mb-2">{f.title}</h3>
                <p className="text-sm text-muted-foreground leading-relaxed">{f.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* How it works */}
      <section id="cara-kerja" className="py-24 bg-muted/30">
        <div className="container mx-auto px-6">
          <div className="text-center mb-16">
            <Badge variant="secondary" className="mb-4">Cara Kerja</Badge>
            <h2 className="text-4xl font-bold text-foreground mb-4">
              Mulai dalam 3 langkah mudah
            </h2>
          </div>

          <div className="grid md:grid-cols-3 gap-8 max-w-4xl mx-auto">
            {[
              {
                step: '01',
                title: 'Daftar & Pilih Tipe Bisnis',
                desc: 'Buat akun gratis, pilih apakah Anda punya bisnis (cafe, laundry, florist, dll) atau ingin tracking keuangan personal.',
              },
              {
                step: '02',
                title: 'Hubungkan Telegram',
                desc: 'Daftarkan nomor HP Anda di Settings. Bot Telegram kami akan langsung mengenali Anda dan siap menerima laporan transaksi.',
              },
              {
                step: '03',
                title: 'Mulai Catat & Analisis',
                desc: 'Kirim transaksi via Telegram, foto struk, atau input manual. Lihat laporan keuangan real-time di dashboard.',
              },
            ].map((s) => (
              <div key={s.step} className="text-center">
                <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-primary text-primary-foreground text-xl font-bold">
                  {s.step}
                </div>
                <h3 className="text-lg font-semibold text-foreground mb-2">{s.title}</h3>
                <p className="text-sm text-muted-foreground leading-relaxed">{s.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Telegram Demo */}
      <section className="py-24">
        <div className="container mx-auto px-6">
          <div className="grid md:grid-cols-2 gap-12 items-center max-w-5xl mx-auto">
            <div>
              <Badge variant="secondary" className="mb-4">Telegram Integration</Badge>
              <h2 className="text-4xl font-bold text-foreground mb-4">
                Catat transaksi tanpa buka aplikasi
              </h2>
              <p className="text-muted-foreground mb-6 leading-relaxed">
                AI kami memahami bahasa natural Indonesia. Cukup kirim pesan seperti yang Anda biasa tulis ke teman — tidak perlu format khusus.
              </p>
              <ul className="space-y-3">
                {[
                  'AI mengenali Anda dari nomor HP Telegram',
                  'Otomatis tahu konteks bisnis Anda',
                  'Mendukung pemasukan dan pengeluaran',
                  'Konfirmasi langsung di chat',
                ].map((item) => (
                  <li key={item} className="flex items-center gap-3 text-sm text-foreground">
                    <span className="flex h-5 w-5 items-center justify-center rounded-full bg-primary/10 text-primary text-xs">✓</span>
                    {item}
                  </li>
                ))}
              </ul>
            </div>

            {/* Telegram chat mockup */}
            <div className="rounded-2xl border border-border bg-card shadow-xl overflow-hidden">
              <div className="bg-primary px-4 py-3 flex items-center gap-3">
                <div className="h-8 w-8 rounded-full bg-primary-foreground/20 flex items-center justify-center text-primary-foreground text-sm font-bold">A</div>
                <div>
                  <p className="text-primary-foreground text-sm font-semibold">@Aiaccountingsbot</p>
                  <p className="text-primary-foreground/70 text-xs">online</p>
                </div>
              </div>
              <div className="p-4 space-y-3 bg-muted/20 min-h-[280px]">
                <div className="flex justify-end">
                  <div className="bg-primary text-primary-foreground rounded-2xl rounded-tr-sm px-4 py-2 max-w-[75%] text-sm">
                    beli bahan baku kopi 450rb
                  </div>
                </div>
                <div className="flex justify-start">
                  <div className="bg-card border border-border rounded-2xl rounded-tl-sm px-4 py-2 max-w-[80%] text-sm text-foreground">
                    ✅ Transaksi dicatat untuk <strong>Kopi Nusantara</strong>:<br />
                    Pengeluaran: Rp 450.000 - bahan baku kopi
                  </div>
                </div>
                <div className="flex justify-end">
                  <div className="bg-primary text-primary-foreground rounded-2xl rounded-tr-sm px-4 py-2 max-w-[75%] text-sm">
                    terima kasih dari pelanggan 1.2jt
                  </div>
                </div>
                <div className="flex justify-start">
                  <div className="bg-card border border-border rounded-2xl rounded-tl-sm px-4 py-2 max-w-[80%] text-sm text-foreground">
                    ✅ Transaksi dicatat untuk <strong>Kopi Nusantara</strong>:<br />
                    Pemasukan: Rp 1.200.000 - penjualan
                  </div>
                </div>
                <div className="flex justify-end">
                  <div className="bg-primary text-primary-foreground rounded-2xl rounded-tr-sm px-4 py-2 max-w-[75%] text-sm">
                    berapa laba saya bulan ini?
                  </div>
                </div>
                <div className="flex justify-start">
                  <div className="bg-card border border-border rounded-2xl rounded-tl-sm px-4 py-2 max-w-[80%] text-sm text-foreground">
                    📊 Laba bersih bulan ini: <strong>Rp 5.200.000</strong><br />
                    Pemasukan: Rp 12.4jt · Pengeluaran: Rp 7.2jt
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Pricing */}
      <section id="harga" className="py-24 bg-muted/30">
        <div className="container mx-auto px-6">
          <div className="text-center mb-16">
            <Badge variant="secondary" className="mb-4">Harga</Badge>
            <h2 className="text-4xl font-bold text-foreground mb-4">
              Mulai gratis, upgrade kapan saja
            </h2>
            <p className="text-muted-foreground">Tidak ada biaya tersembunyi. Batalkan kapan saja.</p>
          </div>

          <div className="grid md:grid-cols-3 gap-6 max-w-5xl mx-auto">
            {[
              {
                name: 'Gratis',
                price: 'Rp 0',
                period: '/bulan',
                desc: 'Untuk UMKM yang baru mulai',
                features: ['1 bisnis', '50 transaksi/bulan', 'Telegram bot', 'Laporan dasar', 'AI chat terbatas'],
                cta: 'Mulai Gratis',
                highlight: false,
              },
              {
                name: 'Pro',
                price: 'Rp 99.000',
                period: '/bulan',
                desc: 'Untuk bisnis yang berkembang',
                features: ['5 bisnis', 'Transaksi tak terbatas', 'Telegram bot prioritas', 'Laporan lengkap', 'AI chat tak terbatas', 'Scan struk OCR', 'Export Excel/PDF'],
                cta: 'Coba 14 Hari Gratis',
                highlight: true,
              },
              {
                name: 'Enterprise',
                price: 'Custom',
                period: '',
                desc: 'Untuk jaringan bisnis besar',
                features: ['Bisnis tak terbatas', 'Multi-user & tim', 'API access', 'Dedicated support', 'Custom integrasi', 'SLA 99.9%'],
                cta: 'Hubungi Kami',
                highlight: false,
              },
            ].map((plan) => (
              <div
                key={plan.name}
                className={`relative rounded-2xl border p-6 ${
                  plan.highlight
                    ? 'border-primary bg-primary text-primary-foreground shadow-xl shadow-primary/20'
                    : 'border-border bg-card'
                }`}
              >
                {plan.highlight && (
                  <Badge className="absolute -top-3 left-1/2 -translate-x-1/2 bg-amber-400 text-amber-900 border-0">
                    Paling Populer
                  </Badge>
                )}
                <div className="mb-6">
                  <p className={`text-sm font-medium mb-1 ${plan.highlight ? 'text-primary-foreground/80' : 'text-muted-foreground'}`}>
                    {plan.name}
                  </p>
                  <div className="flex items-baseline gap-1">
                    <span className="text-3xl font-bold">{plan.price}</span>
                    <span className={`text-sm ${plan.highlight ? 'text-primary-foreground/70' : 'text-muted-foreground'}`}>
                      {plan.period}
                    </span>
                  </div>
                  <p className={`text-sm mt-1 ${plan.highlight ? 'text-primary-foreground/70' : 'text-muted-foreground'}`}>
                    {plan.desc}
                  </p>
                </div>
                <ul className="space-y-2 mb-6">
                  {plan.features.map((f) => (
                    <li key={f} className={`flex items-center gap-2 text-sm ${plan.highlight ? 'text-primary-foreground' : 'text-foreground'}`}>
                      <span className={`text-xs ${plan.highlight ? 'text-primary-foreground' : 'text-primary'}`}>✓</span>
                      {f}
                    </li>
                  ))}
                </ul>
                <Link href="/sign-up">
                  <Button
                    className={`w-full ${plan.highlight ? 'bg-primary-foreground text-primary hover:bg-primary-foreground/90' : ''}`}
                    variant={plan.highlight ? 'secondary' : 'outline'}
                  >
                    {plan.cta}
                  </Button>
                </Link>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-24">
        <div className="container mx-auto px-6">
          <div className="mx-auto max-w-3xl rounded-3xl bg-primary p-12 text-center text-primary-foreground shadow-2xl shadow-primary/30">
            <h2 className="text-4xl font-bold mb-4">
              Siap kelola keuangan bisnis lebih cerdas?
            </h2>
            <p className="text-primary-foreground/80 mb-8 text-lg">
              Bergabung dengan ribuan UMKM Indonesia yang sudah menggunakan KasAI.
              Gratis selamanya untuk paket dasar.
            </p>
            <Link href="/sign-up">
              <Button size="lg" className="h-12 px-10 text-base font-semibold bg-primary-foreground text-primary hover:bg-primary-foreground/90">
                Mulai Gratis Sekarang →
              </Button>
            </Link>
            <p className="mt-4 text-sm text-primary-foreground/60">
              Tidak perlu kartu kredit · Setup 2 menit · Batalkan kapan saja
            </p>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-border py-12">
        <div className="container mx-auto px-6">
          <div className="flex flex-col md:flex-row items-center justify-between gap-4">
            <div className="flex items-center gap-2">
              <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-primary text-primary-foreground font-bold text-xs">K</div>
              <span className="font-bold text-foreground">KasAI</span>
              <span className="text-muted-foreground text-sm">— Akuntansi Cerdas untuk UMKM Indonesia</span>
            </div>
            <p className="text-sm text-muted-foreground">
              © 2025 KasAI. Dibuat dengan ❤️ untuk UMKM Indonesia.
            </p>
          </div>
        </div>
      </footer>
    </div>
  )
}
