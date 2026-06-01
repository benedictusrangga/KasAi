'use client'

import Link from 'next/link'
import { useState, useEffect } from 'react'
import { KasAILogo } from '@/components/logo'

export function LandingNav() {
  const [scrolled, setScrolled] = useState(false)
  const [mobileOpen, setMobileOpen] = useState(false)

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 20)
    window.addEventListener('scroll', onScroll)
    return () => window.removeEventListener('scroll', onScroll)
  }, [])

  return (
    <header
      className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${
        scrolled
          ? 'bg-[#0a0a0a]/90 backdrop-blur-xl border-b border-white/[0.06]'
          : 'bg-transparent'
      }`}
    >
      <div className="max-w-6xl mx-auto px-6 h-16 flex items-center justify-between">
        {/* Logo */}
        <KasAILogo href="/" size="md" dark={true} />

        {/* Desktop nav */}
        <nav className="hidden md:flex items-center gap-1">
          {[
            { label: 'Fitur', href: '#fitur' },
            { label: 'Cara Kerja', href: '#cara-kerja' },
            { label: 'Telegram', href: '#telegram' },
            { label: 'Harga', href: '#harga' },
          ].map((item) => (
            <a
              key={item.href}
              href={item.href}
              className="px-4 py-2 text-sm text-white/60 hover:text-white transition-colors rounded-lg hover:bg-white/[0.06]"
            >
              {item.label}
            </a>
          ))}
        </nav>

        {/* CTA */}
        <div className="hidden md:flex items-center gap-3">
          <Link
            href="/sign-in"
            className="text-sm text-white/60 hover:text-white transition-colors px-4 py-2"
          >
            Masuk
          </Link>
          <Link
            href="/sign-up"
            className="inline-flex items-center gap-1.5 rounded-lg bg-white px-4 py-2 text-sm font-semibold text-[#0a0a0a] hover:bg-white/90 transition-all duration-150 shadow-[0_0_0_1px_rgba(255,255,255,0.1)]"
          >
            Mulai Gratis
            <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
              <path d="M3 7h8M7 3l4 4-4 4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
          </Link>
        </div>

        {/* Mobile menu button */}
        <button
          className="md:hidden p-2 text-white/60 hover:text-white"
          onClick={() => setMobileOpen(!mobileOpen)}
        >
          <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
            {mobileOpen ? (
              <path d="M4 4l12 12M16 4L4 16" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
            ) : (
              <path d="M3 5h14M3 10h14M3 15h14" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
            )}
          </svg>
        </button>
      </div>

      {/* Mobile menu */}
      {mobileOpen && (
        <div className="md:hidden bg-[#0f0f0f] border-t border-white/[0.06] px-6 py-4 space-y-1">
          {[
            { label: 'Fitur', href: '#fitur' },
            { label: 'Cara Kerja', href: '#cara-kerja' },
            { label: 'Telegram', href: '#telegram' },
            { label: 'Harga', href: '#harga' },
          ].map((item) => (
            <a
              key={item.href}
              href={item.href}
              onClick={() => setMobileOpen(false)}
              className="block px-3 py-2.5 text-sm text-white/70 hover:text-white rounded-lg hover:bg-white/[0.06]"
            >
              {item.label}
            </a>
          ))}
          <div className="pt-3 flex flex-col gap-2">
            <Link href="/sign-in" className="block text-center py-2.5 text-sm text-white/60 border border-white/10 rounded-lg hover:bg-white/[0.06]">
              Masuk
            </Link>
            <Link href="/sign-up" className="block text-center py-2.5 text-sm font-semibold bg-white text-[#0a0a0a] rounded-lg">
              Mulai Gratis
            </Link>
          </div>
        </div>
      )}
    </header>
  )
}
