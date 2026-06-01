import type { Metadata } from 'next'
import { Geist, Geist_Mono } from 'next/font/google'
import { Analytics } from '@vercel/analytics/next'
import { ThemeProvider } from '@/components/theme-provider'
import './globals.css'

const geist = Geist({ subsets: ['latin'], variable: '--font-geist-sans' })
const geistMono = Geist_Mono({ subsets: ['latin'], variable: '--font-geist-mono' })

export const metadata: Metadata = {
  title: 'KasAI — Keuangan Bisnis, Semudah Kirim Pesan',
  description:
    'Catat transaksi lewat Telegram, foto struk, atau suara. AI kami memahami bisnis Anda dan memberikan laporan keuangan real-time. Gratis untuk mulai.',
  keywords: ['keuangan bisnis', 'UMKM', 'AI', 'pembukuan', 'telegram', 'Indonesia', 'kas'],
  openGraph: {
    title: 'KasAI — Keuangan Bisnis, Semudah Kirim Pesan',
    description: 'Catat transaksi lewat Telegram, foto struk, atau suara. Laporan keuangan real-time untuk bisnis Anda.',
    type: 'website',
  },
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="id" className={`${geist.variable} ${geistMono.variable} dark`}>
      <body className="font-sans antialiased">
        <ThemeProvider>
          {children}
        </ThemeProvider>
        {process.env.NODE_ENV === 'production' && <Analytics />}
      </body>
    </html>
  )
}
