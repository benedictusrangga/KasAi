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

const clamp  = (v: number, lo: number, hi: number) => Math.min(Math.max(v, lo), hi)

/** Map raw scroll into a 0→1 progress within a specific scroll window */
const phase  = (scroll: number, start: number, end: number) =>
  clamp((scroll - start) / (end - start), 0, 1)

/** iOS-style spring ease: fast start, very gentle settle */
const spring = (t: number) => 1 - Math.pow(1 - t, 4)

/** Lerp for smooth damping between frames */
const lerp   = (a: number, b: number, t: number) => a + (b - a) * t

export function LandingNav() {
  // Raw scroll value — updated every rAF
  const scrollRef   = useRef(0)
  // Smoothed progress values — lerped toward target each frame
  const p1Ref       = useRef(0) // container shape
  const p2Ref       = useRef(0) // pill nav width
  const p3Ref       = useRef(0) // logo + CTA position
  const rafRef      = useRef<number | null>(null)

  // React state — only updated when values change meaningfully (avoids excess renders)
  const [p1, setP1] = useState(0)
  const [p2, setP2] = useState(0)
  const [p3, setP3] = useState(0)

  const [mobileOpen, setMobileOpen] = useState(false)
  const [activeHash, setActiveHash] = useState('')
  const mobileRef = useRef<HTMLDivElement>(null)

  /* ── Animation loop ── */
  useEffect(() => {
    const LERP_SPEED = 0.12 // lower = smoother/slower, higher = snappier

    const tick = () => {
      const scroll = scrollRef.current

      // Target values — each phase has its own scroll window
      const t1 = spring(phase(scroll,  0,  60))  // container: 0–60px
      const t2 = spring(phase(scroll, 15,  80))  // pill nav:  15–80px
      const t3 = spring(phase(scroll, 30, 100))  // logo/CTA:  30–100px

      // Lerp current toward target — this is what makes it feel "springy"
      p1Ref.current = lerp(p1Ref.current, t1, LERP_SPEED)
      p2Ref.current = lerp(p2Ref.current, t2, LERP_SPEED)
      p3Ref.current = lerp(p3Ref.current, t3, LERP_SPEED)

      // Only trigger re-render if values changed meaningfully
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

  /* ── Active section ── */
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

  /* ── Derived style values ── */

  // Phase 1 — container shape & background
  const paddingTop    = 12 * (1 - p1)                          // 12px → 0
  const sideMargin    = 24 * (1 - p1)                          // 24px → 0
  const borderRadius  = 16 * (1 - p1)                          // 16px → 0
  const bgOpacity     = 0.03 + 0.82 * p1                       // near-transparent → dark
  const borderSide    = 0.08 * (1 - p1)                        // side borders fade out
  const borderBottom  = 0.08 + 0.02 * p1                       // bottom border stays

  // Phase 2 — pill nav width (grows from center)
  const navWidth      = p2 > 0.005
    ? `calc(${p2 * 100}% - ${520 * p2 + 0 * (1 - p2)}px)`
    : 'auto'
  const navBg         = `rgba(255,255,255,${0.04 - 0.01 * p2})`
  const navBorder     = `rgba(255,255,255,${0.07 + 0.04 * p2})`

  // Phase 3 — logo & CTA move outward (padding increases)
  const innerPadding  = 20 + 20 * p3                           // 20px → 40px

  // Shadow builds with p1
  const shadow = p1 > 0.01
    ? `0 ${8 * p1}px ${32 * p1}px rgba(0,0,0,${0.5 * p1})`
    : '0 8px 32px rgba(0,0,0,0.4), inset 0 1px 0 rgba(255,255,255,0.06)'

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
        {/* ── Main bar ── */}
        <div
          className="backdrop-blur-2xl"
          style={{
            marginLeft:   `${sideMargin}px`,
            marginRight:  `${sideMargin}px`,
            borderRadius: `${borderRadius}px`,
            background:   `rgba(8,8,8,${bgOpacity})`,
            borderTop:    `1px solid rgba(255,255,255,${borderSide})`,
            borderLeft:   `1px solid rgba(255,255,255,${borderSide})`,
            borderRight:  `1px solid rgba(255,255,255,${borderSide})`,
            borderBottom: `1px solid rgba(255,255,255,${borderBottom})`,
            boxShadow:    shadow,
          }}
        >
          <div
            className="relative flex h-[60px] items-center"
            style={{
              maxWidth:     '1152px',
              margin:       '0 auto',
              paddingLeft:  `${innerPadding}px`,
              paddingRight: `${innerPadding}px`,
            }}
          >
            {/* Logo — moves left as p3 increases */}
            <div className="flex items-center shrink-0 z-10">
              <KasAILogo href="/" size="md" dark={true} />
            </div>

            {/* Nav pill — absolute centered, width driven by p2 */}
            <nav
              className="hidden md:flex items-center gap-0.5 rounded-xl px-1.5 py-1 absolute left-1/2 -translate-x-1/2 overflow-hidden"
              style={{
                width:     navWidth,
                maxWidth:  '680px',
                minWidth:  'max-content',
                background: navBg,
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
                    className={`relative py-1.5 text-[13px] font-medium rounded-lg text-center whitespace-nowrap transition-colors duration-150 ${
                      p2 > 0.5 ? 'flex-1' : 'px-4'
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

            {/* CTA — moves right as p3 increases */}
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
                    <path d="M2 4.5h12"  stroke="currentColor" strokeWidth="1.6" strokeLinecap="round"/>
                    <path d="M2 8h8"     stroke="currentColor" strokeWidth="1.6" strokeLinecap="round"/>
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
