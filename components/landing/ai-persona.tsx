'use client'

import { useState } from 'react'
import Link from 'next/link'
import { useTheme } from './theme-provider'

const PERSONAS = [
  {
    id: 'professional',
    emoji: '💼',
    name: 'Profesional',
    tagline: 'Formal & Objektif',
    color: '#3B82F6',
    glow: 'rgba(59,130,246,0.2)',
    border: 'rgba(59,130,246,0.25)',
    bg: 'rgba(59,130,246,0.06)',
    preview: '"Pengeluaran bulan ini Rp 2,3 juta, naik 18% dari bulan lalu. Kategori tertinggi: transportasi (Rp 450.000). Rekomendasi: tinjau ulang anggaran transportasi untuk efisiensi."',
  },
  {
    id: 'sahabat',
    emoji: '🌸',
    name: 'Sahabat',
    tagline: 'Hangat & Supportif',
    color: '#EC4899',
    glow: 'rgba(236,72,153,0.2)',
    border: 'rgba(236,72,153,0.25)',
    bg: 'rgba(236,72,153,0.06)',
    preview: '"Hei, kamu sudah berusaha keras bulan ini! 🌸 Pengeluaran naik sedikit, tapi tenang — kita cari cara bareng supaya bulan depan lebih hemat ya. Mau mulai dari mana?"',
  },
  {
    id: 'coach',
    emoji: '🔥',
    name: 'Coach',
    tagline: 'Tegas & Motivatif',
    color: '#F97316',
    glow: 'rgba(249,115,22,0.2)',
    border: 'rgba(249,115,22,0.25)',
    bg: 'rgba(249,115,22,0.06)',
    preview: '"Pengeluaran naik 18%. Ini tidak bisa dibiarkan. Mulai besok, potong transportasi 30% dan PATUHI itu. Tidak ada alasan — kamu bisa lebih baik dari ini. Action sekarang."',
  },
  {
    id: 'santai',
    emoji: '😄',
    name: 'Santai',
    tagline: 'Casual & Humoris',
    color: '#10B981',
    glow: 'rgba(16,185,129,0.2)',
    border: 'rgba(16,185,129,0.25)',
    bg: 'rgba(16,185,129,0.06)',
    preview: '"Wkwk bro, pengeluaran bulan ini lumayan juga 😅 Tapi santai, masih bisa dibenerin kok! Mau gue kasih tips hemat yang ga bikin sengsara? Yuk gas!"',
  },
]

export function LandingAiPersona() {
  const { theme } = useTheme()
  const isDark = theme === 'dark'
  const [active, setActive] = useState('professional')

  const current = PERSONAS.find((p) => p.id === active) ?? PERSONAS[0]

  return (
    <section id="ai-persona" className="py-32 relative overflow-hidden"
      style={{ background: isDark ? '#0a0a0a' : '#f5f5f5' }}>

      {/* Background glow */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[700px] h-[500px] -z-10 pointer-events-none"
        style={{
          background: `radial-gradient(ellipse, ${current.glow} 0%, transparent 70%)`,
          transition: 'background 0.5s ease',
        }} />

      <div className="max-w-6xl mx-auto px-6">
        {/* Header */}
        <div className="max-w-2xl mb-16">
          <p className="text-[11px] font-bold text-violet-500 uppercase tracking-[0.15em] mb-4">AI Persona</p>
          <h2 className="text-4xl sm:text-5xl font-bold leading-[1.1] tracking-tight mb-5"
            style={{ color: isDark ? '#ffffff' : '#0a0a0a' }}>
            AI yang bicara
            <br />
            <span style={{
              backgroundImage: 'linear-gradient(90deg, #a78bfa 0%, #818cf8 40%, #60a5fa 80%)',
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent',
              backgroundClip: 'text',
            }}>
              sesuai gaya Anda.
            </span>
          </h2>
          <p className="text-lg leading-relaxed"
            style={{ color: isDark ? 'rgba(255,255,255,0.45)' : 'rgba(0,0,0,0.5)' }}>
            Pilih kepribadian AI yang paling cocok — dari konsultan formal hingga teman ngobrol santai.
            Berlaku di dashboard dan bot Telegram. Ganti kapan saja.
          </p>
        </div>

        <div className="grid lg:grid-cols-2 gap-12 items-start">
          {/* Left: persona cards */}
          <div className="space-y-3">
            {PERSONAS.map((p) => {
              const isActive = active === p.id
              return (
                <button
                  key={p.id}
                  onClick={() => setActive(p.id)}
                  className="w-full text-left rounded-2xl p-5 transition-all duration-300 hover:-translate-y-0.5"
                  style={{
                    background: isActive ? p.bg : isDark ? 'rgba(255,255,255,0.02)' : 'rgba(0,0,0,0.02)',
                    border: `1px solid ${isActive ? p.border : isDark ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.07)'}`,
                    boxShadow: isActive ? `0 8px 32px ${p.glow}` : 'none',
                  }}
                >
                  <div className="flex items-center gap-4">
                    {/* Emoji icon */}
                    <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl text-2xl transition-transform duration-200"
                      style={{
                        background: isActive ? p.bg : isDark ? 'rgba(255,255,255,0.04)' : 'rgba(0,0,0,0.04)',
                        border: `1px solid ${isActive ? p.border : isDark ? 'rgba(255,255,255,0.07)' : 'rgba(0,0,0,0.07)'}`,
                        transform: isActive ? 'scale(1.05)' : 'scale(1)',
                      }}>
                      {p.emoji}
                    </div>

                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-0.5">
                        <p className="font-bold text-sm" style={{ color: isActive ? p.color : isDark ? '#ffffff' : '#0a0a0a' }}>
                          {p.name}
                        </p>
                        {isActive && (
                          <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full"
                            style={{ background: p.bg, color: p.color, border: `1px solid ${p.border}` }}>
                            Aktif
                          </span>
                        )}
                      </div>
                      <p className="text-xs" style={{ color: isDark ? 'rgba(255,255,255,0.4)' : 'rgba(0,0,0,0.45)' }}>
                        {p.tagline}
                      </p>
                    </div>

                    {/* Arrow */}
                    <svg
                      width="16" height="16" viewBox="0 0 16 16" fill="none"
                      className="shrink-0 transition-transform duration-200"
                      style={{
                        transform: isActive ? 'translateX(2px)' : 'translateX(0)',
                        color: isActive ? p.color : isDark ? 'rgba(255,255,255,0.2)' : 'rgba(0,0,0,0.2)',
                      }}
                    >
                      <path d="M6 3l5 5-5 5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                    </svg>
                  </div>
                </button>
              )
            })}
          </div>

          {/* Right: live preview */}
          <div className="lg:sticky lg:top-24">
            {/* Chat preview card */}
            <div className="rounded-3xl p-px transition-all duration-500"
              style={{
                background: `linear-gradient(135deg, ${current.border} 0%, ${isDark ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.06)'} 100%)`,
                boxShadow: `0 24px 64px ${current.glow}`,
              }}>
              <div className="rounded-[23px] overflow-hidden"
                style={{ background: isDark ? '#0f0f0f' : '#ffffff' }}>

                {/* Chat header */}
                <div className="flex items-center gap-3 px-5 py-4"
                  style={{
                    background: isDark ? '#0d0d0d' : '#f8f8f8',
                    borderBottom: isDark ? '1px solid rgba(255,255,255,0.05)' : '1px solid rgba(0,0,0,0.07)',
                  }}>
                  <div className="flex h-9 w-9 items-center justify-center rounded-xl text-lg"
                    style={{ background: current.bg, border: `1px solid ${current.border}` }}>
                    {current.emoji}
                  </div>
                  <div>
                    <p className="text-sm font-semibold" style={{ color: isDark ? '#ffffff' : '#0a0a0a' }}>
                      AI {current.name}
                    </p>
                    <p className="text-xs" style={{ color: current.color }}>● Online</p>
                  </div>
                </div>

                {/* Messages */}
                <div className="p-5 space-y-4 min-h-[220px]">
                  {/* User message */}
                  <div className="flex justify-end">
                    <div className="max-w-[80%] rounded-2xl rounded-tr-sm px-4 py-2.5"
                      style={{ background: 'linear-gradient(135deg, #7C3AED, #6366F1)' }}>
                      <p className="text-xs text-white leading-relaxed">
                        Gimana kondisi keuangan bisnis saya bulan ini?
                      </p>
                    </div>
                  </div>

                  {/* AI response — animated on persona change */}
                  <div className="flex justify-start">
                    <div className="flex gap-3 max-w-[90%]">
                      <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-xl text-base mt-0.5"
                        style={{ background: current.bg, border: `1px solid ${current.border}` }}>
                        {current.emoji}
                      </div>
                      <div className="rounded-2xl rounded-tl-sm px-4 py-3 transition-all duration-300"
                        style={{
                          background: isDark ? 'rgba(255,255,255,0.04)' : 'rgba(0,0,0,0.03)',
                          border: isDark ? '1px solid rgba(255,255,255,0.07)' : '1px solid rgba(0,0,0,0.07)',
                        }}>
                        <p className="text-xs leading-relaxed" style={{ color: isDark ? 'rgba(255,255,255,0.8)' : 'rgba(0,0,0,0.75)' }}>
                          {current.preview}
                        </p>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Input bar */}
                <div className="flex items-center gap-2 px-4 py-3"
                  style={{
                    background: isDark ? '#0d0d0d' : '#f8f8f8',
                    borderTop: isDark ? '1px solid rgba(255,255,255,0.05)' : '1px solid rgba(0,0,0,0.07)',
                  }}>
                  <div className="flex-1 rounded-xl px-3 py-2 text-xs"
                    style={{
                      background: isDark ? 'rgba(255,255,255,0.04)' : 'rgba(0,0,0,0.04)',
                      border: isDark ? '1px solid rgba(255,255,255,0.07)' : '1px solid rgba(0,0,0,0.07)',
                      color: isDark ? 'rgba(255,255,255,0.2)' : 'rgba(0,0,0,0.25)',
                    }}>
                    Tanya AI...
                  </div>
                  <div className="flex h-8 w-8 items-center justify-center rounded-xl transition-all duration-300"
                    style={{ background: `linear-gradient(135deg, ${current.color}, ${current.color}cc)` }}>
                    <svg width="13" height="13" viewBox="0 0 13 13" fill="none">
                      <path d="M2 6.5h9M6.5 2l4.5 4.5L6.5 11" stroke="white" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                    </svg>
                  </div>
                </div>
              </div>
            </div>

            {/* CTA */}
            <div className="mt-6 text-center">
              <p className="text-xs mb-3" style={{ color: isDark ? 'rgba(255,255,255,0.3)' : 'rgba(0,0,0,0.35)' }}>
                Pilih persona favorit Anda di Pengaturan → AI Persona
              </p>
              <Link
                href="/sign-up"
                className="inline-flex items-center gap-2 rounded-xl px-5 py-2.5 text-sm font-semibold text-white transition-all duration-200 hover:scale-[1.02] active:scale-[0.98]"
                style={{
                  background: 'linear-gradient(135deg, #7C3AED 0%, #6366F1 60%, #3B82F6 100%)',
                  boxShadow: '0 4px 16px rgba(99,102,241,0.35)',
                }}
              >
                Coba Gratis Sekarang →
              </Link>
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}
