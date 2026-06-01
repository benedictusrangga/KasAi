'use client'

import Link from 'next/link'
import { useState, useEffect, useRef } from 'react'
import { KasAILogo } from '@/components/logo'
import { useTheme } from './theme-provider'
import { ThemeToggle } from './theme-toggle'

const NAV_LINKS = [
  { label: 'Fitur',      href: '#fitur' },
  { label: 'Telegram',   href: '#telegram' },
  { label: 'AI Persona', href: '#ai-persona' },
  { label: 'Cara Kerja', href: '#cara-kerja' },
  { label: 'Harga',      href: '#harga' },
]

const clamp  = (v: number, lo: number, hi: number) => Math.min(Math.max(v, lo), hi)
const phase  = (scroll: number, start: number, end: number) =>
  clamp((scroll - start) / (end - start), 0, 1)
const spring = (t: number) => 1 - Math.pow(1 - t, 4)
const lerp   = (a: number, b: number, t: number) => a + (b - a) * t

export function LandingNav() {
  const { theme } = useTheme()
  const isDark = theme === 'dark'

  const scrollRef   = useRef(0)
  const p1Ref       = useRef(0)
  const p2Ref       = useRef(0)
  const p3Ref       = useRef(0)
  const rafRef      = useRef<number | null>(null)

  const [p1, setP1] = useState(0)
  const [p2, setP2] = useState(0)
  const [p3, setP3] = useState(0)

  const [mobileOpen, setMobileOpen] = useState(false)
  const [activeHash, setActiveHash] = useState('')
  const mobileRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const LERP_SPEED = 0.12
    const tick = () => {
      const scroll = scrollRef.current
      const t1 = spring(phase(scroll,  0,  60))
      const t2 = spring(phase(scroll, 15,  80))
      const t3 = spring(phase(scroll, 30, 100))
      p1Ref.current = lerp(p1Ref.current, t1, LERP_SPEED)
      p2Ref.current = lerp(p2Ref.current, t2, LERP_SPEED)
      p3Ref.current = lerp(p3Ref.current, t3, LERP_SPEED)
      const THRESHOLD = 0.001
      setP1(prev => Math.abs(prev - p1Ref.current) > THRESHOLD ? p1Ref.current : prev)
      setP2(prev => Math.abs(prev - p2Ref.current) > THRESHOLD ? p2Ref.current : prev)
      setP3(prev => Math.abs(prev - p3Ref.current) > THRESHOLD ? p3Ref.current : prev)
      rafRef.current = requestAnimationFrame(tick)
    }
    const onScroll = () => { scrollRef.current = window.scrollY }
    window.addEventListener('scroll', onScroll, { passive: true })
    rafRef.current = requestAnimationFrame(tick)
    return () => {
      window.removeEventListener('scroll', onScroll)
      if (rafRef.current) cancelAnimationFrame(rafRef.current)
    }
  }, [])

  useEffect(() => {
    const ids = NAV_LINKS.map((l) => l.href.slice(1))

    const getActiveId = () => {
      // Ambil posisi semua section
      const sections = ids
        .map((id) => {
          const el = document.getElementById(id)
          if (!el) return null
          return { id, top: el.getBoundingClientRect().top }
        })
        .filter(Boolean) as { id: string; top: number }[]

      if (sections.length === 0) return

      // Section aktif = yang top-nya paling dekat ke 0 (atau sudah lewat atas) tapi belum terlalu jauh ke bawah
      // Ambil section terakhir yang top-nya <= 30% viewport height
      const threshold = window.innerHeight * 0.3
      let active = sections[0].id

      for (const s of sections) {
        if (s.top <= threshold) {
          active = s.id
        }
      }

      setActiveHash('#' + active)
    }

    window.addEventListener('scroll', getActiveId, { passive: true })
    // Delay sedikit agar DOM sudah render sempurna
    const timer = setTimeout(getActiveId, 100)
    return () => {
      window.removeEventListener('scroll', getActiveId)
      clearTimeout(timer)
    }
  }, [])

  useEffect(() => {
    if (!mobileOpen) return
    const handler = (e: MouseEvent) => {
      if (mobileRef.current && !mobileRef.current.contains(e.target as Node)) {
        setMobileOpen(false)
      }
    }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [mobileOpen])

  const paddingTop    = 12 * (1 - p1)
  const sideMargin    = 24 * (1 - p1)
  const borderRadius  = 16 * (1 - p1)
  const bgOpacity     = isDark ? (0.03 + 0.82 * p1) : (0.4 + 0.55 * p1)
  const borderSide    = isDark ? (0.08 * (1 - p1)) : (0.12 * (1 - p1))
  const borderBottom  = isDark ? (0.08 + 0.02 * p1) : (0.12 + 0.03 * p1)

  const navWidth = p2 > 0.005
    ? `calc(${p2 * 100}% - ${520 * p2 + 0 * (1 - p2)}px)`
    : 'auto'

  const navBg     = isDark
    ? `rgba(255,255,255,${0.04 - 0.01 * p2})`
    : `rgba(0,0,0,${0.03 - 0.01 * p2})`
  const navBorder = isDark
    ? `rgba(255,255,255,${0.07 + 0.04 * p2})`
    : `rgba(0,0,0,${0.08 + 0.04 * p2})`

  const innerPadding = 20 + 20 * p3

  // Logo dan CTA pakai padding minimal — selalu nempel ke tepi
  const edgePadding = 16

  const bgColor = isDark
    ? `rgba(8,8,8,${bgOpacity})`
    : `rgba(255,255,255,${bgOpacity})`

  const borderColorSide   = isDark
    ? `rgba(255,255,255,${borderSide})`
    : `rgba(0,0,0,${borderSide})`
  const borderColorBottom = isDark
    ? `rgba(255,255,255,${borderBottom})`
    : `rgba(0,0,0,${borderBottom})`

  const shadow = isDark
    ? (p1 > 0.01
        ? `0 ${8 * p1}px ${32 * p1}px rgba(0,0,0,${0.5 * p1})`
        : '0 8px 32px rgba(0,0,0,0.4), inset 0 1px 0 rgba(255,255,255,0.06)')
    : (p1 > 0.01
        ? `0 ${8 * p1}px ${32 * p1}px rgba(0,0,0,${0.08 * p1})`
        : '0 2px 16px rgba(0,0,0,0.06)')

  const textColor       = isDark ? 'rgba(255,255,255,0.5)'  : 'rgba(0,0,0,0.5)'
  const activeTextColor = isDark ? 'text-white'             : 'text-black'
  const activeBg        = isDark ? 'bg-white/[0.1]'         : 'bg-black/[0.07]'
  const hoverBg         = isDark ? 'hover:bg-white/[0.06]'  : 'hover:bg-black/[0.05]'

  return (
    <>
      <style>{`
        @keyframes mobile-menu-in {
          from { opacity: 0; transform: translateY(-6px); }
          to   { opacity: 1; transform: translateY(0); }
        }
        .mobile-menu-animate { animation: mobile-menu-in 0.25s cubic-bezier(0.16,1,0.3,1) both; }
      `}</style>

      <header
        ref={mobileRef}
        className="fixed top-0 left-0 right-0 z-50"
        style={{ paddingTop: `${paddingTop}px` }}
      >
        <div
          className="backdrop-blur-2xl"
          style={{
            marginLeft:   `${sideMargin}px`,
            marginRight:  `${sideMargin}px`,
            borderRadius: `${borderRadius}px`,
            background:   bgColor,
            borderTop:    `1px solid ${borderColorSide}`,
            borderLeft:   `1px solid ${borderColorSide}`,
            borderRight:  `1px solid ${borderColorSide}`,
            borderBottom: `1px solid ${borderColorBottom}`,
            boxShadow:    shadow,
          }}
        >
          <div
            className="relative flex h-[60px] items-center"
            style={{
              maxWidth:     '1152px',
              margin:       '0 auto',
              paddingLeft:  `${edgePadding}px`,
              paddingRight: `${edgePadding}px`,
            }}
          >
            {/* Logo — nempel kiri */}
            <div className="flex items-center shrink-0 z-10">
              <KasAILogo href="/" size="md" dark={isDark} />
            </div>

            {/* Nav pill — absolute centered, melebar saat scroll via p2 */}
            <nav
              className="hidden md:flex items-center gap-0.5 rounded-xl px-1.5 py-1 absolute left-1/2 -translate-x-1/2"
              style={{
                /* Selalu pakai max-content sebagai minimum, melebar saat scroll */
                minWidth:     'max-content',
                width:        p2 > 0.005 ? `${320 + 160 * p2}px` : 'max-content',
                maxWidth:     '480px',
                background:   navBg,
                borderTop:    `1px solid ${navBorder}`,
                borderLeft:   `1px solid ${navBorder}`,
                borderRight:  `1px solid ${navBorder}`,
                borderBottom: `1px solid ${navBorder}`,
              }}
            >
              {NAV_LINKS.map((item) => {
                const isActive = activeHash === item.href
                return (
                  <a
                    key={item.href}
                    href={item.href}
                    className={`relative py-1.5 px-4 text-[13px] font-medium rounded-lg text-center whitespace-nowrap transition-colors duration-150 ${
                      p2 > 0.3 ? 'flex-1' : ''
                    } ${
                      isActive
                        ? `${activeTextColor} ${activeBg}`
                        : `${hoverBg}`
                    }`}
                    style={{ color: isActive ? undefined : textColor }}
                  >
                    {isActive && (
                      <span className={`absolute inset-0 rounded-lg ring-1 ${isDark ? 'ring-white/[0.12]' : 'ring-black/[0.1]'}`} />
                    )}
                    {item.label}
                  </a>
                )
              })}
            </nav>

            <div className="flex-1" />

            {/* CTA — nempel kanan */}
            <div className="hidden md:flex items-center gap-2 shrink-0 z-10">
              <ThemeToggle />
              <Link
                href="/sign-in"
                className={`px-4 py-2 text-[13px] font-medium transition-colors duration-200 rounded-lg ${
                  isDark
                    ? 'text-white/50 hover:text-white/90 hover:bg-white/[0.05]'
                    : 'text-black/50 hover:text-black/80 hover:bg-black/[0.05]'
                }`}
              >
                Masuk
              </Link>
              <Link
                href="/sign-up"
                className="group relative inline-flex items-center gap-1.5 overflow-hidden rounded-xl px-4 py-2 text-[13px] font-semibold text-white transition-all duration-200 hover:scale-[1.02] active:scale-[0.98]"
                style={{
                  background: 'linear-gradient(135deg, #7C3AED 0%, #6366F1 60%, #3B82F6 100%)',
                  boxShadow:  '0 0 0 1px rgba(139,92,246,0.4), 0 4px 16px rgba(99,102,241,0.35)',
                }}
              >
                <span
                  className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-300"
                  style={{ background: 'linear-gradient(105deg, transparent 40%, rgba(255,255,255,0.12) 50%, transparent 60%)' }}
                />
                <span className="relative">Mulai Gratis</span>
                <svg className="relative group-hover:translate-x-0.5 transition-transform duration-200" width="13" height="13" viewBox="0 0 13 13" fill="none">
                  <path d="M2.5 6.5h8M7 3l3.5 3.5L7 10" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
              </Link>
            </div>

            {/* Mobile hamburger */}
            <div className="md:hidden flex items-center gap-2">
              <ThemeToggle />
              <button
                aria-label="Toggle menu"
                aria-expanded={mobileOpen}
                onClick={() => setMobileOpen((v) => !v)}
                className={`flex h-9 w-9 items-center justify-center rounded-xl transition-all duration-200 ${
                  isDark
                    ? 'border border-white/[0.08] bg-white/[0.04] text-white/60 hover:text-white hover:bg-white/[0.08]'
                    : 'border border-black/[0.08] bg-black/[0.04] text-black/50 hover:text-black hover:bg-black/[0.08]'
                }`}
              >
                <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
                  {mobileOpen ? (
                    <path d="M3 3l10 10M13 3L3 13" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round"/>
                  ) : (
                    <>
                      <path d="M2 4.5h12"  stroke="currentColor" strokeWidth="1.6" strokeLinecap="round"/>
                      <path d="M2 8h8"     stroke="currentColor" strokeWidth="1.6" strokeLinecap="round"/>
                      <path d="M2 11.5h12" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round"/>
                    </>
                  )}
                </svg>
              </button>
            </div>
          </div>
        </div>

        {/* Mobile dropdown */}
        {mobileOpen && (
          <div
            className={`mobile-menu-animate md:hidden mx-4 mt-2 rounded-2xl overflow-hidden backdrop-blur-2xl ${
              isDark
                ? 'border border-white/[0.08] bg-[#0d0d0d]/95 shadow-[0_16px_48px_rgba(0,0,0,0.6),inset_0_1px_0_rgba(255,255,255,0.06)]'
                : 'border border-black/[0.08] bg-white/95 shadow-[0_16px_48px_rgba(0,0,0,0.12),inset_0_1px_0_rgba(255,255,255,0.8)]'
            }`}
          >
            <div className="p-3 space-y-0.5">
              {NAV_LINKS.map((item) => (
                <a
                  key={item.href}
                  href={item.href}
                  onClick={() => setMobileOpen(false)}
                  className={`flex items-center justify-between px-4 py-3 text-sm rounded-xl transition-all duration-150 group ${
                    isDark
                      ? 'text-white/60 hover:text-white hover:bg-white/[0.06]'
                      : 'text-black/55 hover:text-black hover:bg-black/[0.05]'
                  }`}
                >
                  <span>{item.label}</span>
                  <svg className={`opacity-0 group-hover:opacity-40 -translate-x-1 group-hover:translate-x-0 transition-all duration-200`} width="12" height="12" viewBox="0 0 12 12" fill="none">
                    <path d="M2 6h8M6 2l4 4-4 4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                  </svg>
                </a>
              ))}
            </div>
            <div className={`mx-3 h-px ${isDark ? 'bg-white/[0.06]' : 'bg-black/[0.06]'}`} />
            <div className="p-3 flex flex-col gap-2">
              <Link
                href="/sign-in"
                onClick={() => setMobileOpen(false)}
                className={`block text-center py-2.5 text-sm font-medium rounded-xl transition-all duration-150 ${
                  isDark
                    ? 'text-white/60 hover:text-white border border-white/[0.08] hover:bg-white/[0.05]'
                    : 'text-black/55 hover:text-black border border-black/[0.08] hover:bg-black/[0.04]'
                }`}
              >
                Masuk
              </Link>
              <Link
                href="/sign-up"
                onClick={() => setMobileOpen(false)}
                className="block text-center py-2.5 text-sm font-semibold text-white rounded-xl transition-all duration-150 active:scale-[0.98]"
                style={{
                  background: 'linear-gradient(135deg, #7C3AED 0%, #6366F1 60%, #3B82F6 100%)',
                  boxShadow:  '0 4px 16px rgba(99,102,241,0.35)',
                }}
              >
                Mulai Gratis →
              </Link>
            </div>
          </div>
        )}
      </header>
    </>
  )
}
