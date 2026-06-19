'use client'

import Link from 'next/link'
import { usePathname, useParams } from 'next/navigation'
import { authClient } from '@/lib/auth-client'
import { useState, useEffect } from 'react'
import { KasAILogo } from '@/components/logo'
import { useAppTheme } from '@/components/theme-provider'
import { getFeatureConfig } from '@/app/actions/features'

type NavItem = {
  label: string
  href: (id: string) => string
  icon: string
  exact: boolean
  featureKey?: string // fitur opsional yang perlu dicek
}

const BASE_NAV_ITEMS: NavItem[] = [
  { label: 'Dashboard',   href: (id) => `/dashboard/${id}`,              icon: 'grid',        exact: true  },
  { label: 'Transaksi',   href: (id) => `/dashboard/${id}/transactions`, icon: 'arrows',      exact: false },
  { label: 'Tambah',      href: (id) => `/dashboard/${id}/add-expense`,  icon: 'plus',        exact: false },
  { label: 'AI Chat',     href: (id) => `/dashboard/${id}/ai-chat`,      icon: 'sparkle',     exact: false },
  { label: 'Goals',       href: (id) => `/dashboard/${id}/goals`,        icon: 'target',      exact: false, featureKey: 'enableGoals' },
  { label: 'Hutang/Piutang', href: (id) => `/dashboard/${id}/payables`,  icon: 'debt',        exact: false, featureKey: 'enablePayables' },
  { label: 'Inventaris',  href: (id) => `/dashboard/${id}/inventory`,    icon: 'inventory',   exact: false, featureKey: 'enableInventory' },
  { label: 'Laporan',     href: (id) => `/dashboard/${id}/reports`,      icon: 'chart',       exact: false },
  { label: 'Pengaturan',  href: (id) => `/dashboard/${id}/settings`,     icon: 'settings',    exact: false },
]

function NavIcon({ name, active, isDark }: { name: string; active: boolean; isDark: boolean }) {
  const color = active ? '#fff' : isDark ? 'rgba(255,255,255,0.45)' : 'rgba(0,0,0,0.45)'
  const s = { stroke: color, strokeWidth: '1.6', strokeLinecap: 'round' as const, strokeLinejoin: 'round' as const, fill: 'none' }
  switch (name) {
    case 'grid':      return <svg width="16" height="16" viewBox="0 0 16 16"><rect x="1.5" y="1.5" width="5" height="5" rx="1" {...s}/><rect x="9.5" y="1.5" width="5" height="5" rx="1" {...s}/><rect x="1.5" y="9.5" width="5" height="5" rx="1" {...s}/><rect x="9.5" y="9.5" width="5" height="5" rx="1" {...s}/></svg>
    case 'arrows':    return <svg width="16" height="16" viewBox="0 0 16 16"><path d="M3 5h10M3 8h7M3 11h5" {...s}/></svg>
    case 'plus':      return <svg width="16" height="16" viewBox="0 0 16 16"><path d="M8 3v10M3 8h10" {...s}/></svg>
    case 'sparkle':   return <svg width="16" height="16" viewBox="0 0 16 16"><path d="M8 2l1.5 4.5L14 8l-4.5 1.5L8 14l-1.5-4.5L2 8l4.5-1.5z" {...s}/></svg>
    case 'target':    return <svg width="16" height="16" viewBox="0 0 16 16"><circle cx="8" cy="8" r="6" {...s}/><circle cx="8" cy="8" r="3" {...s}/><circle cx="8" cy="8" r="1" fill={color} stroke="none"/></svg>
    case 'debt':      return <svg width="16" height="16" viewBox="0 0 16 16"><path d="M2 4h12M2 8h8" {...s}/><path d="M10 10l3 2-3 2" {...s}/><path d="M13 12H8" {...s}/></svg>
    case 'inventory': return <svg width="16" height="16" viewBox="0 0 16 16"><rect x="2" y="2" width="12" height="4" rx="1" {...s}/><rect x="2" y="9" width="5" height="5" rx="1" {...s}/><path d="M10 11h4M12 9v4" {...s}/></svg>
    case 'chart':     return <svg width="16" height="16" viewBox="0 0 16 16"><path d="M2 12V8M6 12V5M10 12V7M14 12V3" {...s}/></svg>
    case 'settings':  return <svg width="16" height="16" viewBox="0 0 16 16"><circle cx="8" cy="8" r="2.5" {...s}/><path d="M8 1.5v1.2M8 13.3v1.2M1.5 8h1.2M13.3 8h1.2M3.4 3.4l.85.85M11.75 11.75l.85.85M3.4 12.6l.85-.85M11.75 4.25l.85-.85" {...s}/></svg>
    default:          return null
  }
}

function ThemeToggleBtn() {
  const { isDark, toggle } = useAppTheme()
  return (
    <button
      onClick={toggle}
      aria-label="Toggle theme"
      className="flex h-8 w-8 items-center justify-center rounded-lg transition-all duration-200 hover:scale-105 active:scale-95"
      style={{
        background: isDark ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.06)',
        border: isDark ? '1px solid rgba(255,255,255,0.1)' : '1px solid rgba(0,0,0,0.1)',
        color: isDark ? 'rgba(255,255,255,0.5)' : 'rgba(0,0,0,0.5)',
      }}
    >
      {isDark ? (
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <circle cx="12" cy="12" r="5"/><line x1="12" y1="1" x2="12" y2="3"/><line x1="12" y1="21" x2="12" y2="23"/>
          <line x1="4.22" y1="4.22" x2="5.64" y2="5.64"/><line x1="18.36" y1="18.36" x2="19.78" y2="19.78"/>
          <line x1="1" y1="12" x2="3" y2="12"/><line x1="21" y1="12" x2="23" y2="12"/>
          <line x1="4.22" y1="19.78" x2="5.64" y2="18.36"/><line x1="18.36" y1="5.64" x2="19.78" y2="4.22"/>
        </svg>
      ) : (
        <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"/>
        </svg>
      )}
    </button>
  )
}

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname()
  const params = useParams()
  const businessId = params.businessId as string | undefined
  const [signingOut, setSigningOut] = useState(false)
  const [mobileOpen, setMobileOpen] = useState(false)
  const [featureConfig, setFeatureConfig] = useState<Record<string, boolean>>({})
  const { isDark } = useAppTheme()

  // Load feature config saat businessId berubah
  useEffect(() => {
    if (!businessId) return
    getFeatureConfig(businessId).then((config) => {
      setFeatureConfig(config as unknown as Record<string, boolean>)
    }).catch(() => {})
  }, [businessId])

  // Filter nav items berdasarkan feature config
  const navItems = BASE_NAV_ITEMS.filter((item) => {
    if (!item.featureKey) return true
    // Hutang dan piutang: tampilkan jika salah satunya aktif
    if (item.featureKey === 'enablePayables') {
      return featureConfig['enablePayables'] || featureConfig['enableReceivables']
    }
    return featureConfig[item.featureKey] !== false
  })

  const isActive = (item: NavItem) => {
    if (!businessId) return false
    const href = item.href(businessId)
    return item.exact ? pathname === href : pathname.startsWith(href)
  }

  const handleSignOut = async () => {
    setSigningOut(true)
    try { await authClient.signOut() } finally { window.location.href = '/' }
  }

  const sidebarBg    = isDark ? '#0d0d0d' : '#ffffff'
  const sidebarBorder = isDark ? 'rgba(255,255,255,0.07)' : 'rgba(0,0,0,0.08)'
  const textMuted    = isDark ? 'rgba(255,255,255,0.35)' : 'rgba(0,0,0,0.35)'
  const textNormal   = isDark ? 'rgba(255,255,255,0.6)'  : 'rgba(0,0,0,0.6)'
  const hoverBg      = isDark ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.04)'
  const activeBg     = 'linear-gradient(135deg, #7C3AED 0%, #6366F1 60%, #3B82F6 100%)'
  const mainBg       = isDark ? '#0a0a0a' : '#f5f5f7'

  return (
    <div className="flex h-screen overflow-hidden" style={{ background: mainBg }}>

      {/* ── Mobile overlay ── */}
      {mobileOpen && (
        <div
          className="fixed inset-0 z-40 lg:hidden"
          style={{ background: 'rgba(0,0,0,0.5)', backdropFilter: 'blur(4px)' }}
          onClick={() => setMobileOpen(false)}
        />
      )}

      {/* ── Sidebar ── */}
      <aside
        className={`fixed inset-y-0 left-0 z-50 flex w-[220px] flex-col transition-transform duration-300 lg:relative lg:translate-x-0 ${
          mobileOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
        style={{
          background: sidebarBg,
          borderRight: `1px solid ${sidebarBorder}`,
        }}
      >
        {/* Logo */}
        <div className="flex h-14 items-center justify-between px-4" style={{ borderBottom: `1px solid ${sidebarBorder}` }}>
          <KasAILogo href="/dashboard" size="sm" dark={isDark} />
          <ThemeToggleBtn />
        </div>

        {/* Semua Bisnis */}
        <div className="px-2 pt-3 pb-1">
          <Link
            href="/dashboard"
            onClick={() => setMobileOpen(false)}
            className="flex items-center gap-2.5 rounded-xl px-3 py-2 text-sm transition-all duration-150"
            style={{
              background: pathname === '/dashboard' ? hoverBg : 'transparent',
              color: pathname === '/dashboard' ? (isDark ? '#fff' : '#000') : textNormal,
            }}
          >
            <svg width="15" height="15" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round"
              style={{ color: pathname === '/dashboard' ? (isDark ? '#fff' : '#000') : textMuted }}>
              <path d="M2 6.5L8 2l6 4.5V14a1 1 0 01-1 1H3a1 1 0 01-1-1V6.5z"/>
              <path d="M6 15V9h4v6"/>
            </svg>
            <span>Semua Bisnis</span>
          </Link>
        </div>

        {/* Business nav */}
        {businessId && (
          <div className="px-2 pb-2 flex-1 overflow-y-auto">
            <p className="px-3 py-2 text-[10px] font-bold uppercase tracking-[0.12em]" style={{ color: textMuted }}>
              Bisnis Aktif
            </p>
            <nav className="space-y-0.5">
              {navItems.map((item) => {
                const href = item.href(businessId)
                const active = isActive(item)
                return (
                  <Link
                    key={href}
                    href={href}
                    onClick={() => setMobileOpen(false)}
                    className="flex items-center gap-2.5 rounded-xl px-3 py-2 text-sm transition-all duration-150"
                    style={{
                      background: active ? activeBg : 'transparent',
                      color: active ? '#fff' : textNormal,
                      boxShadow: active ? '0 4px 12px rgba(99,102,241,0.3)' : 'none',
                    }}
                    onMouseEnter={(e) => { if (!active) (e.currentTarget as HTMLElement).style.background = hoverBg }}
                    onMouseLeave={(e) => { if (!active) (e.currentTarget as HTMLElement).style.background = 'transparent' }}
                  >
                    <NavIcon name={item.icon} active={active} isDark={isDark} />
                    <span className="font-medium">{item.label}</span>
                  </Link>
                )
              })}
            </nav>
          </div>
        )}

        <div className="flex-1" />

        {/* Bottom */}
        <div className="px-2 pb-3 pt-2" style={{ borderTop: `1px solid ${sidebarBorder}` }}>
          <Link
            href="/"
            className="flex items-center gap-2.5 rounded-xl px-3 py-2 text-sm transition-all duration-150"
            style={{ color: textNormal }}
            onMouseEnter={(e) => { (e.currentTarget as HTMLElement).style.background = hoverBg }}
            onMouseLeave={(e) => { (e.currentTarget as HTMLElement).style.background = 'transparent' }}
          >
            <svg width="15" height="15" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" style={{ color: textMuted }}>
              <path d="M10 3L5 8l5 5"/>
            </svg>
            <span>Beranda</span>
          </Link>
          <button
            onClick={handleSignOut}
            disabled={signingOut}
            className="flex w-full items-center gap-2.5 rounded-xl px-3 py-2 text-sm transition-all duration-150"
            style={{ color: textNormal }}
            onMouseEnter={(e) => { (e.currentTarget as HTMLElement).style.background = hoverBg }}
            onMouseLeave={(e) => { (e.currentTarget as HTMLElement).style.background = 'transparent' }}
          >
            <svg width="15" height="15" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" style={{ color: textMuted }}>
              <path d="M6 3H3a1 1 0 00-1 1v8a1 1 0 001 1h3M10 11l3-3-3-3M15 8H6"/>
            </svg>
            <span>{signingOut ? 'Keluar...' : 'Keluar'}</span>
          </button>
        </div>
      </aside>

      {/* ── Main ── */}
      <div className="flex flex-1 flex-col overflow-hidden">
        {/* Mobile topbar */}
        <div
          className="flex h-14 items-center justify-between px-4 lg:hidden"
          style={{
            background: sidebarBg,
            borderBottom: `1px solid ${sidebarBorder}`,
          }}
        >
          <button
            onClick={() => setMobileOpen(true)}
            className="flex h-9 w-9 items-center justify-center rounded-xl"
            style={{ background: hoverBg, border: `1px solid ${sidebarBorder}` }}
          >
            <svg width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round"
              style={{ color: textNormal }}>
              <path d="M2 4h12M2 8h8M2 12h12"/>
            </svg>
          </button>
          <KasAILogo href="/dashboard" size="sm" dark={isDark} />
          <ThemeToggleBtn />
        </div>

        <main className="flex-1 overflow-auto">
          {children}
        </main>
      </div>
    </div>
  )
}
