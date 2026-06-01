'use client'

import Link from 'next/link'
import { useState } from 'react'
import { PLAN_GROUPS } from '@/lib/plan-limits'

export function LandingPricing() {
  const [selectedPlan, setSelectedPlan] = useState<string>('free')

  const allPlans = [
    { ...PLAN_GROUPS.free[0], group: 'free' },
    ...PLAN_GROUPS.personal.map(p => ({ ...p, group: 'personal' })),
    ...PLAN_GROUPS.business.map(p => ({ ...p, group: 'business' })),
  ]

  const selected = allPlans.find(p => p.id === selectedPlan)

  return (
    <section id="harga" className="py-32 relative overflow-hidden">
      {/* Background */}
      <div className="absolute inset-0 -z-10">
        <div className="absolute top-0 left-0 right-0 h-px"
          style={{ background: 'linear-gradient(90deg, transparent, rgba(255,255,255,0.07) 30%, rgba(255,255,255,0.07) 70%, transparent)' }} />
        <div className="absolute bottom-0 left-0 right-0 h-px"
          style={{ background: 'linear-gradient(90deg, transparent, rgba(255,255,255,0.07) 30%, rgba(255,255,255,0.07) 70%, transparent)' }} />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[600px] rounded-full opacity-30"
          style={{ background: 'radial-gradient(ellipse, rgba(99,102,241,0.08) 0%, transparent 70%)' }} />
      </div>

      <div className="max-w-6xl mx-auto px-6">
        {/* Header */}
        <div className="text-center mb-16">
          <p className="text-[11px] font-bold text-violet-400 uppercase tracking-[0.15em] mb-4">Harga</p>
          <h2 className="text-4xl sm:text-5xl font-bold text-white tracking-tight mb-5">
            Bayar sesuai kebutuhan.
            <br />
            <span className="text-white/30">Tidak ada kejutan.</span>
          </h2>
          <p className="text-white/45 max-w-xl mx-auto">
            Mulai gratis, upgrade kapan saja. Semua plan sudah termasuk Telegram bot, scan struk AI, dan laporan real-time.
          </p>
        </div>

        {/* ── FREE plan ── */}
        <div className="mb-12">
          <PlanCard
            plan={PLAN_GROUPS.free[0]}
            isSelected={selectedPlan === PLAN_GROUPS.free[0].id}
            onSelect={setSelectedPlan}
            variant="free"
          />
        </div>

        {/* ── PERSONAL plans ── */}
        <div className="mb-12">
          <SectionDivider label="Personal" sub="1 bisnis · Semua fitur personal" />
          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {PLAN_GROUPS.personal.map((plan) => (
              <PlanCard
                key={plan.id}
                plan={plan}
                isSelected={selectedPlan === plan.id}
                onSelect={setSelectedPlan}
                variant="personal"
              />
            ))}
          </div>
        </div>

        {/* ── BUSINESS plans ── */}
        <div>
          <SectionDivider label="Business" sub="Multi-bisnis · Dashboard konsolidasi" />
          <div className="grid sm:grid-cols-3 gap-5 max-w-4xl mx-auto">
            {PLAN_GROUPS.business.map((plan) => (
              <PlanCard
                key={plan.id}
                plan={plan}
                isSelected={selectedPlan === plan.id}
                onSelect={setSelectedPlan}
                variant="business"
              />
            ))}
          </div>
        </div>

        {/* Selected plan summary */}
        {selected && (
          <div
            className="mt-12 rounded-2xl p-6 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-5 transition-all duration-300"
            style={{
              background: 'linear-gradient(135deg, rgba(124,58,237,0.12) 0%, rgba(99,102,241,0.08) 100%)',
              border: '1px solid rgba(139,92,246,0.25)',
            }}
          >
            <div className="flex items-center gap-4">
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl"
                style={{ background: 'linear-gradient(135deg, #7C3AED, #6366F1)', boxShadow: '0 4px 16px rgba(99,102,241,0.35)' }}>
                <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
                  <path d="M2 8l4 4 8-8" stroke="white" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
              </div>
              <div>
                <p className="text-sm font-bold text-white">
                  Plan dipilih: <span className="text-violet-300">{selected.name}</span>
                </p>
                <p className="text-xs text-white/40 mt-0.5">
                  {selected.priceLabel}{selected.period ? ` ${selected.period}` : ''} · {selected.desc}
                </p>
              </div>
            </div>
            <Link
              href="/sign-up"
              className="shrink-0 inline-flex items-center gap-2 rounded-xl px-5 py-2.5 text-sm font-semibold text-white transition-all duration-200 hover:scale-[1.02] active:scale-[0.98]"
              style={{
                background: 'linear-gradient(135deg, #7C3AED 0%, #6366F1 60%, #3B82F6 100%)',
                boxShadow: '0 0 0 1px rgba(139,92,246,0.35), 0 4px 16px rgba(99,102,241,0.3)',
              }}
            >
              Mulai dengan {selected.name}
              <svg width="13" height="13" viewBox="0 0 13 13" fill="none">
                <path d="M2.5 6.5h8M7 3l3.5 3.5L7 10" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
            </Link>
          </div>
        )}

        <p className="text-center text-xs text-white/20 mt-8 tracking-wide">
          Semua harga dalam Rupiah · Tidak ada kontrak · Batalkan kapan saja · Upgrade/downgrade instan
        </p>
      </div>
    </section>
  )
}

/* ── Sub-components ── */

function SectionDivider({ label, sub }: { label: string; sub: string }) {
  return (
    <div className="flex items-center gap-4 mb-6">
      <div className="h-px flex-1" style={{ background: 'rgba(255,255,255,0.05)' }} />
      <div className="text-center">
        <p className="text-[11px] font-bold text-white/35 uppercase tracking-[0.12em]">{label}</p>
        <p className="text-[11px] text-white/20 mt-0.5">{sub}</p>
      </div>
      <div className="h-px flex-1" style={{ background: 'rgba(255,255,255,0.05)' }} />
    </div>
  )
}

type PlanCardProps = {
  plan: (typeof PLAN_GROUPS.free)[0] | (typeof PLAN_GROUPS.personal)[0] | (typeof PLAN_GROUPS.business)[0]
  isSelected: boolean
  onSelect: (id: string) => void
  variant: 'free' | 'personal' | 'business'
}

function PlanCard({ plan, isSelected, onSelect, variant }: PlanCardProps) {
  const isBestValue = (plan as any).badge === 'Best Value'
  const isHighlight = (plan as any).highlight === true
  const isPremium   = isBestValue || isHighlight

  const baseStyle = isPremium
    ? {
        background: isSelected
          ? 'linear-gradient(135deg, rgba(124,58,237,0.35) 0%, rgba(99,102,241,0.25) 100%)'
          : 'linear-gradient(135deg, rgba(124,58,237,0.2) 0%, rgba(99,102,241,0.12) 100%)',
        border: isSelected
          ? '1px solid rgba(139,92,246,0.6)'
          : '1px solid rgba(139,92,246,0.3)',
        boxShadow: isSelected
          ? '0 0 0 3px rgba(139,92,246,0.2), 0 0 40px rgba(139,92,246,0.2)'
          : '0 0 30px rgba(139,92,246,0.1)',
      }
    : {
        background: isSelected
          ? 'linear-gradient(135deg, rgba(255,255,255,0.08) 0%, rgba(255,255,255,0.04) 100%)'
          : 'linear-gradient(135deg, rgba(255,255,255,0.03) 0%, rgba(255,255,255,0.015) 100%)',
        border: isSelected
          ? '1px solid rgba(255,255,255,0.2)'
          : '1px solid rgba(255,255,255,0.06)',
        boxShadow: isSelected
          ? '0 0 0 3px rgba(255,255,255,0.06)'
          : 'none',
      }

  const isFree = variant === 'free'
  const isBusiness = variant === 'business'

  return (
    <div
      onClick={() => onSelect(plan.id)}
      className={`relative rounded-2xl flex flex-col cursor-pointer transition-all duration-200 select-none
        ${isFree ? 'max-w-sm mx-auto w-full' : ''}
        ${isSelected ? '-translate-y-1' : 'hover:-translate-y-0.5'}
      `}
      style={{ ...baseStyle, padding: isBusiness ? '28px' : '24px' }}
    >
      {/* Selected checkmark */}
      {isSelected && (
        <div className="absolute top-3 right-3 flex h-5 w-5 items-center justify-center rounded-full"
          style={{ background: isPremium ? 'rgba(139,92,246,0.8)' : 'rgba(255,255,255,0.15)' }}>
          <svg width="10" height="10" viewBox="0 0 10 10" fill="none">
            <path d="M1.5 5l2.5 2.5 4.5-4.5" stroke="white" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
        </div>
      )}

      {/* Badge */}
      {(plan as any).badge && (
        <div className={`absolute -top-3 left-1/2 -translate-x-1/2 px-3 py-1 rounded-full text-[11px] font-bold ${
          isBestValue ? 'bg-amber-400 text-amber-900' : 'text-violet-300 border border-violet-500/30'
        }`}
        style={!(plan as any).badge?.includes('Best') ? { background: 'rgba(139,92,246,0.2)' } : {}}>
          {(plan as any).badge}
        </div>
      )}

      {/* Plan name + price */}
      <div className={isBusiness ? 'mb-6' : 'mb-5'}>
        <p className="text-[11px] font-bold text-white/35 uppercase tracking-wider mb-2">
          {plan.name.replace('Personal ', '').replace('Business ', '')}
        </p>
        <div className="flex items-baseline gap-1">
          <span className={`font-black text-white tracking-tight ${isBusiness ? 'text-3xl' : 'text-2xl'}`}>
            {plan.priceLabel}
          </span>
          {(plan as any).period && (
            <span className={`text-white/35 ${isBusiness ? 'text-sm' : 'text-xs'}`}>{(plan as any).period}</span>
          )}
        </div>
        <p className="text-xs text-white/30 mt-1">{plan.desc}</p>
      </div>

      {/* Features */}
      <ul className={`space-y-2 flex-1 ${isBusiness ? 'mb-7' : 'mb-6'}`}>
        {plan.features.map(f => (
          <li key={f} className={`flex items-start gap-2 text-white/50 ${isBusiness ? 'text-sm' : 'text-xs'}`}>
            <span className={`mt-0.5 shrink-0 font-bold ${isPremium ? 'text-violet-400' : 'text-white/25'}`}>✓</span>
            {f}
          </li>
        ))}
      </ul>

      {/* CTA */}
      <div
        className={`w-full rounded-xl text-sm font-semibold text-center py-2.5 transition-all duration-200 pointer-events-none
          ${isSelected
            ? isPremium
              ? 'text-[#0a0a0a]'
              : 'text-white'
            : 'text-white'
          }
        `}
        style={isSelected
          ? isPremium
            ? { background: 'white' }
            : { background: 'rgba(255,255,255,0.12)', border: '1px solid rgba(255,255,255,0.15)' }
          : { background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.08)' }
        }
      >
        {isSelected ? `✓ ${plan.cta}` : plan.cta}
      </div>
    </div>
  )
}
