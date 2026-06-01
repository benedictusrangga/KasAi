import type { Metadata } from 'next'
import { Geist, Geist_Mono } from 'next/font/google'
import { Analytics } from '@vercel/analytics/next'
import './globals.css'

const geist = Geist({ subsets: ['latin'], variable: '--font-geist-sans' })
const geistMono = Geist_Mono({ subsets: ['latin'], variable: '--font-geist-mono' })

export const metadata: Metadata = {
  title: 'KasAI — Akuntansi Cerdas untuk UMKM Indonesia',
  description:
    'Catat transaksi lewat Telegram, foto struk, atau suara. AI kami memahami bisnis Anda dan memberikan laporan keuangan real-time.',
  keywords: ['akuntansi', 'UMKM', 'AI', 'keuangan', 'telegram', 'Indonesia'],
  openGraph: {
    title: 'KasAI — Akuntansi Cerdas untuk UMKM Indonesia',
    description: 'Catat transaksi lewat Telegram, foto struk, atau suara.',
    type: 'website',
  },
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="id" className={`${geist.variable} ${geistMono.variable}`}>
      <body className="font-sans antialiased">
        {children}
        {process.env.NODE_ENV === 'production' && <Analytics />}
      </body>
    </html>
  )
}
