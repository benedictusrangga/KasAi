'use client'

import Link from 'next/link'
import { usePathname, useParams, useRouter } from 'next/navigation'
import { authClient } from '@/lib/auth-client'
import { useState } from 'react'

const NAV_ITEMS = [
  { label: 'Dashboard', href: (id: string) => `/dashboard/${id}`, icon: '▦', exact: true },
  { label: 'Transaksi', href: (id: string) => `/dashboard/${id}/transactions`, icon: '↕', exact: false },
  { label: 'Tambah', href: (id: string) => `/dashboard/${id}/add-expense`, icon: '+', exact: false },
  { label: 'AI Chat', href: (id: string) => `/dashboard/${id}/ai-chat`, icon: '✦', exact: false },
  { label: 'Laporan', href: (id: string) => `/dashboard/${id}/reports`, icon: '◈', exact: false },
  { label: 'Pengaturan', href: (id: string) => `/dashboard/${id}/settings`, icon: '⚙', exact: false },
]

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname()
  const params = useParams()
  const router = useRouter()
  const businessId = params.businessId as string | undefined
  const [signingOut, setSigningOut] = useState(false)

  const isActive = (item: typeof NAV_ITEMS[0]) => {
    if (!businessId) return false
    const href = item.href(businessId)
    return item.exact ? pathname === href : pathname.startsWith(href)
  }

  const handleSignOut = async () => {
    setSigningOut(true)
    try {
      await authClient.signOut()
    } finally {
      // Hard redirect ke landing page — clear semua state
      window.location.href = '/'
    }
  }

  return (
    <div className="flex h-screen bg-background overflow-hidden">
      {/* Sidebar */}
      <aside className="flex w-60 flex-col border-r border-border bg-sidebar">
        {/* Logo */}
        <div className="flex h-16 items-center gap-2.5 border-b border-sidebar-border px-5">
          <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-primary text-primary-foreground font-bold text-xs">
            K
          </div>
          <span className="text-base font-bold text-sidebar-foreground">KasAI</span>
        </div>

        {/* My Businesses link */}
        <div className="px-3 pt-4 pb-2">
          <Link
            href="/dashboard"
            className={`flex items-center gap-3 rounded-lg px-3 py-2 text-sm transition-colors ${
              pathname === '/dashboard'
                ? 'bg-sidebar-primary text-sidebar-primary-foreground font-medium'
                : 'text-sidebar-foreground hover:bg-sidebar-accent hover:text-sidebar-accent-foreground'
            }`}
          >
            <span className="text-base">🏠</span>
            <span>Semua Bisnis</span>
          </Link>
        </div>

        {/* Business nav items */}
        {businessId && (
          <div className="px-3 pb-2">
            <p className="px-3 py-1.5 text-xs font-semibold uppercase tracking-wider text-sidebar-foreground/50">
              Bisnis Aktif
            </p>
            <nav className="space-y-0.5">
              {NAV_ITEMS.map((item) => {
                const href = item.href(businessId)
                const active = isActive(item)
                return (
                  <Link
                    key={href}
                    href={href}
                    className={`flex items-center gap-3 rounded-lg px-3 py-2 text-sm transition-colors ${
                      active
                        ? 'bg-sidebar-primary text-sidebar-primary-foreground font-medium'
                        : 'text-sidebar-foreground hover:bg-sidebar-accent hover:text-sidebar-accent-foreground'
                    }`}
                  >
                    <span className="w-4 text-center text-base leading-none">{item.icon}</span>
                    <span>{item.label}</span>
                  </Link>
                )
              })}
            </nav>
          </div>
        )}

        {/* Spacer */}
        <div className="flex-1" />

        {/* Bottom actions */}
        <div className="border-t border-sidebar-border p-3 space-y-0.5">
          <Link
            href="/"
            className="flex items-center gap-3 rounded-lg px-3 py-2 text-sm text-sidebar-foreground hover:bg-sidebar-accent transition-colors"
          >
            <span className="text-base">←</span>
            <span>Beranda</span>
          </Link>
          <button
            onClick={handleSignOut}
            disabled={signingOut}
            className="flex w-full items-center gap-3 rounded-lg px-3 py-2 text-sm text-sidebar-foreground hover:bg-sidebar-accent transition-colors"
          >
            <span className="text-base">⏻</span>
            <span>{signingOut ? 'Keluar...' : 'Keluar'}</span>
          </button>
        </div>
      </aside>

      {/* Main content */}
      <main className="flex-1 overflow-auto">
        {children}
      </main>
    </div>
  )
}
