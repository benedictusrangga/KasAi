'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { authClient } from '@/lib/auth-client'
import Link from 'next/link'

export default function AccountTypePage() {
  const router = useRouter()
  const [checking, setChecking] = useState(true)

  useEffect(() => {
    authClient.getSession().then(({ data }) => {
      if (!data?.session) router.replace('/sign-in')
      else setChecking(false)
    })
  }, [router])

  if (checking) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <div className="text-3xl mb-3">⏳</div>
          <p className="text-muted-foreground text-sm">Memuat...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b border-border px-6 py-4 flex items-center gap-2">
        <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-primary text-primary-foreground font-bold text-xs">K</div>
        <span className="font-bold text-foreground">KasAI</span>
      </header>

      <div className="container mx-auto px-6 py-16 max-w-3xl">
        {/* Progress */}
        <div className="flex items-center gap-2 mb-10">
          <div className="flex h-7 w-7 items-center justify-center rounded-full bg-primary text-primary-foreground text-xs font-bold">1</div>
          <div className="h-0.5 flex-1 bg-border" />
          <div className="flex h-7 w-7 items-center justify-center rounded-full bg-muted text-muted-foreground text-xs font-bold">2</div>
          <div className="h-0.5 flex-1 bg-border" />
          <div className="flex h-7 w-7 items-center justify-center rounded-full bg-muted text-muted-foreground text-xs font-bold">3</div>
        </div>

        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold text-foreground mb-3">
            Apa kebutuhan akuntansi Anda?
          </h1>
          <p className="text-lg text-muted-foreground">
            Pilih tipe akun yang sesuai — kami akan menyesuaikan pengalaman untuk Anda
          </p>
        </div>

        <div className="grid md:grid-cols-2 gap-6">
          {/* Personal */}
          <Link href="/onboarding/personal-setup">
            <div className="group relative rounded-2xl border-2 border-border bg-card p-8 cursor-pointer hover:border-primary hover:shadow-xl hover:shadow-primary/10 transition-all duration-200">
              <div className="text-5xl mb-5">👤</div>
              <h3 className="text-2xl font-bold text-foreground mb-2">Personal</h3>
              <p className="text-muted-foreground text-sm mb-6">
                Lacak pengeluaran pribadi, kelola budget, dan dapatkan insight keuangan personal.
              </p>
              <ul className="space-y-2 mb-6">
                {['Tracking pengeluaran harian', 'Budget & target tabungan', 'Laporan keuangan personal', 'AI advisor keuangan'].map((f) => (
                  <li key={f} className="flex items-center gap-2 text-sm text-foreground">
                    <span className="text-primary text-xs">✓</span> {f}
                  </li>
                ))}
              </ul>
              <div className="flex items-center justify-between">
                <span className="text-sm font-semibold text-primary">Pilih Personal →</span>
              </div>
            </div>
          </Link>

          {/* Business */}
          <Link href="/onboarding/business-setup">
            <div className="group relative rounded-2xl border-2 border-primary bg-primary/5 p-8 cursor-pointer hover:bg-primary/10 hover:shadow-xl hover:shadow-primary/10 transition-all duration-200">
              <div className="absolute -top-3 left-6">
                <span className="bg-primary text-primary-foreground text-xs font-semibold px-3 py-1 rounded-full">
                  Paling Populer
                </span>
              </div>
              <div className="text-5xl mb-5">🏪</div>
              <h3 className="text-2xl font-bold text-foreground mb-2">Bisnis</h3>
              <p className="text-muted-foreground text-sm mb-6">
                Kelola keuangan bisnis UMKM Anda dengan fitur lengkap dan integrasi Telegram.
              </p>
              <ul className="space-y-2 mb-6">
                {['Catat transaksi via Telegram', 'Scan struk otomatis (AI OCR)', 'Laporan laba rugi real-time', 'Manajemen produk & kategori', 'Multi-bisnis dalam 1 akun'].map((f) => (
                  <li key={f} className="flex items-center gap-2 text-sm text-foreground">
                    <span className="text-primary text-xs">✓</span> {f}
                  </li>
                ))}
              </ul>
              <div className="flex items-center justify-between">
                <span className="text-sm font-semibold text-primary">Pilih Bisnis →</span>
              </div>
            </div>
          </Link>
        </div>
      </div>
    </div>
  )
}
