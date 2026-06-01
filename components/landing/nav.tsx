'use client'

import Link from 'next/link'
import { useState, useEffect, useRef } from 'react'
import { KasAILogo } from '@/components/logo'

const NAV_LINKS = [
  { label: 'Fitur',      href: '#fitur' },
  { label: 'Cara Kerja', href: '#cara-kerja' },
  { label: 'Telegram',   href: '#telegram' },
  { label: 'Harga',      href: '#harga' },
]

/** Clamp a value between min and max */
const clamp = (v: number, min: number, max: number) => Math.min(Math.max(v, min), max)

/** Ease-out cubic — makes the interpolation feel iOS-like (fast start, gentle settle) */
const easeOut = (t: number) => 1 - Math.pow(1 - t, 3)

export function LandingNav() {
  // progress: 0 = top of page (floating pill), 1 = scrolled (full-width bar)
  const [progress, setProgress]     = useState(0)
  const [mobileOpen, setMobileOpen] = useState(false)
  const [activeHash, setActiveHash] = useState('')
  const mobileRef                   = useRef<HTMLDivElement>(null)
  const rafRef                       = useRef<number | null>(null)

  /* ── Continuous scroll progress (0→1 over first 80px of scroll) ── */
  useEffect(() => {
    const SCROLL_RANGE = 80 // px over which transition completes

    const onScroll = () => {
      if (rafRef.current) cancelAnimationFrame(rafRef.current)
      rafRef.current = requestAnimationFrame(() => {
        const raw = clamp(window.scrollY / SCROLL_RANGE, 0, 1)
        setProgress(easeOut(raw))
      })
    }

    window.addEventListener('scroll', onScroll, { passive: true })
    return () => {
      window.removeEventListener('scroll', onScroll)
      if (rafRef.current) cancelAnimationFrame(rafRef.current)
    }
  }, [])

  /* ── Active section via IntersectionObserver ── */
  useEffect(() => {
    const ids = NAV_LINKS.map((l) => l.href.slice(1))
    const observers: IntersectionObserver[] = []
    ids.forEach((id) => {
      const el = document.getElementById(id)
      if (!el) return
      const obs = new IntersectionObserver(
        ([entry]) => { if (entry.isIntersecting) setActiveHash('#' + id) },
        { rootMargin: '-40% 0px -55% 0px' }
      )
      obs.observe(el)
      observers.push(obs)
    })
    return () => observers.forEach((o) => o.disconnect())
  }, [])

  /* ── Close mobile on outside click ── */
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

  /* ── Interpolated style values ── */
  const p = progress // 0 → 1

  // Outer header padding-top: 12px → 0px
  const headerPaddingTop = `${12 * (1 - p)}px`

  // Horizontal margin: collapses from ~24px to 0
  const sideMargin = `${24 * (1 - p)}px`

  // Border radius: 16px → 0px
  const borderRadius = `${16 * (1 - p)}px`

  // Background opacity: near-transparent → 85% opaque dark
  const bgOpacity = 0.03 + 0.82 * p
  const bgColor = `rgba(8,8,8,${bgOpacity})`

  // Border opacity: subtle → slightly more visible, then fades to bottom-only
  const borderOpacity = 0.08 + 0.04 * p

  // Backdrop blur: always on (handled by CSS class)

  // Nav pill width: auto (compact) → calc(100% - 520px)
  // We interpolate via a CSS custom property trick using inline style
  // At p=0: pill is auto-width (shrink-0)
  // At p=1: pill fills center with 260px reserved each side
  const navPillWidth = p > 0.01
    ? `calc(${p * 100}% - ${520 * p + (1 - p) * 0}px)`
    : 'auto'

  // Shadow: none → subtle bottom shadow
  const shadowOpacity = 0.04 * p
  const boxShadow = p > 0.01
    ? `0 1px 0 rgba(255,255,255,${shadowOpacity}), 0 ${8 * p}px ${32 * p}px rgba(0,0,0,${0.4 * p})`
    : `0 ${8}px ${32}px rgba(0,0,0,0.4), inset 0 1px 0 rgba(255,255,255,0.06)`

  const isScrolled = p > 0.5

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
        style={{ paddingTop: headerPaddingTop }}
      >
        {/* ── Main bar ── */}
        <div
          className="backdrop-blur-2xl"
          style={{
            marginLeft:   sideMargin,
            marginRight:  sideMargin,
            borderRadius: borderRadius,
            background:    bgColor,
            borderTop:    `1px solid rgba(255,255,255,${borderOpacity})`,
            borderRight:  `1px solid rgba(255,255,255,${borderOpacity * (1 - p)})`,
            borderBottom: `1px solid rgba(255,255,255,${Math.max(borderOpacity, 0.07)})`,
            borderLeft:   `1px solid rgba(255,255,255,${borderOpacity * (1 - p)})`,
            boxShadow:    boxShadow,
            transition:   'none', // driven by rAF, no CSS transition needed
          }}
        >
          {/* Inner content — constrained width when fully scrolled */}
          <div
            className="relative flex h-[60px] items-center"
            style={{
              maxWidth: isScrolled ? '1152px' : 'none',
              margin:   isScrolled ? '0 auto' : undefined,
              paddingLeft:  `${20 + 20 * p}px`,
              paddingRight: `${20 + 20 * p}px`,
            }}
          >
            {/* Logo */}
            <div className="flex items-center shrink-0 z-10">
              <KasAILogo href="/" size="md" dark={true} />
            </div>

            {/* Nav pill — absolute centered, width grows from center */}
            <nav
              className="hidden md:flex items-center gap-0.5 rounded-xl px-1.5 py-1 absolute left-1/2 -translate-x-1/2 overflow-hidden"
              style={{
                width:      navPillWidth,
                maxWidth:   '680px',
                minWidth:   'max-content',
                background: `rgba(255,255,255,${0.04 - 0.01 * p})`,
                border:     `1px solid rgba(255,255,255,${0.07 + 0.03 * p})`,
                // No CSS transition — driven by rAF above
              }}
            >
              {NAV_LINKS.map((item) => {
                const isActive = activeHash === item.href
                return (
                  <a
                    key={item.href}
                    href={item.href}
                    className={`relative py-1.5 text-[13px] font-medium rounded-lg text-center whitespace-nowrap transition-colors duration-200 ${
                      p > 0.5 ? 'flex-1' : 'px-4'
                    } ${
                      isActive
                        ? 'text-white bg-white/[0.1]'
                        : 'text-white/50 hover:text-white/90 hover:bg-white/[0.06]'
                    }`}
                  >
                    {isActive && (
                      <span className="absolute inset-0 rounded-lg ring-1 ring-white/[0.12]" />
                    )}
                    {item.label}
                  </a>
                )
              })}
            </nav>

            {/* Spacer */}
            <div className="flex-1" />

            {/* Desktop CTA */}
            <div className="hidden md:flex items-center gap-2 shrink-0 z-10">
              <Link
                href="/sign-in"
                className="px-4 py-2 text-[13px] font-medium text-white/50 hover:text-white/90 transition-colors duration-200 rounded-lg hover:bg-white/[0.05]"
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
            <button
              aria-label="Toggle menu"
              aria-expanded={mobileOpen}
              onClick={() => setMobileOpen((v) => !v)}
              className="md:hidden flex h-9 w-9 items-center justify-center rounded-xl border border-white/[0.08] bg-white/[0.04] text-white/60 hover:text-white hover:bg-white/[0.08] transition-all duration-200"
            >
              <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
                {mobileOpen ? (
                  <path d="M3 3l10 10M13 3L3 13" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round"/>
                ) : (
                  <>
                    <path d="M2 4.5h12" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round"/>
                    <path d="M2 8h8"    stroke="currentColor" strokeWidth="1.6" strokeLinecap="round"/>
                    <path d="M2 11.5h12" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round"/>
                  </>
                )}
              </svg>
            </button>
          </div>
        </div>

        {/* ── Mobile dropdown ── */}
        {mobileOpen && (
          <div className="mobile-menu-animate md:hidden mx-4 mt-2 rounded-2xl border border-white/[0.08] bg-[#0d0d0d]/95 backdrop-blur-2xl shadow-[0_16px_48px_rgba(0,0,0,0.6),inset_0_1px_0_rgba(255,255,255,0.06)] overflow-hidden">
            <div className="p-3 space-y-0.5">
              {NAV_LINKS.map((item) => (
                <a
                  key={item.href}
                  href={item.href}
                  onClick={() => setMobileOpen(false)}
                  className="flex items-center justify-between px-4 py-3 text-sm text-white/60 hover:text-white rounded-xl hover:bg-white/[0.06] transition-all duration-150 group"
                >
                  <span>{item.label}</span>
                  <svg className="opacity-0 group-hover:opacity-40 -translate-x-1 group-hover:translate-x-0 transition-all duration-200" width="12" height="12" viewBox="0 0 12 12" fill="none">
                    <path d="M2 6h8M6 2l4 4-4 4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                  </svg>
                </a>
              ))}
            </div>
            <div className="mx-3 h-px bg-white/[0.06]" />
            <div className="p-3 flex flex-col gap-2">
              <Link
                href="/sign-in"
                onClick={() => setMobileOpen(false)}
                className="block text-center py-2.5 text-sm font-medium text-white/60 hover:text-white border border-white/[0.08] rounded-xl hover:bg-white/[0.05] transition-all duration-150"
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
