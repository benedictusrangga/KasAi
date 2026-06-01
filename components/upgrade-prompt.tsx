'use client'

import Link from 'next/link'
import { Button } from '@/components/ui/button'

interface UpgradePromptProps {
  businessId: string
  txThisMonth: number
  maxTx: number
  variant?: 'banner' | 'block' | 'inline'
}

export function UpgradePrompt({ businessId, txThisMonth, maxTx, variant = 'banner' }: UpgradePromptProps) {
  const pct = Math.min(Math.round((txThisMonth / maxTx) * 100), 100)
  const isAtLimit = txThisMonth >= maxTx
  const isNearLimit = pct >= 80 && !isAtLimit

  if (!isAtLimit && !isNearLimit) return null

  if (variant === 'inline') {
    return (
      <div className={`rounded-lg px-4 py-3 border text-sm ${
        isAtLimit
          ? 'bg-destructive/10 border-destructive/20 text-destructive'
          : 'bg-amber-50 border-amber-200 text-amber-800'
      }`}>
        {isAtLimit ? (
          <>
            <span className="font-semibold">Batas transaksi bulan ini tercapai.</span>{' '}
            Upgrade ke Business untuk transaksi tak terbatas.{' '}
            <Link href={`/dashboard/${businessId}/settings`} className="underline font-medium">
              Upgrade sekarang →
            </Link>
          </>
        ) : (
          <>
            <span className="font-semibold">Hampir mencapai batas.</span>{' '}
            {txThisMonth}/{maxTx} transaksi bulan ini.{' '}
            <Link href={`/dashboard/${businessId}/settings`} className="underline font-medium">
              Upgrade →
            </Link>
          </>
        )}
      </div>
    )
  }

  if (variant === 'block') {
    return (
      <div className={`rounded-2xl border p-6 text-center ${
        isAtLimit
          ? 'bg-destructive/5 border-destructive/20'
          : 'bg-amber-50 border-amber-200'
      }`}>
        <div className="text-3xl mb-3">{isAtLimit ? '🚫' : '⚠️'}</div>
        <h3 className={`font-bold text-lg mb-2 ${isAtLimit ? 'text-destructive' : 'text-amber-800'}`}>
          {isAtLimit ? 'Batas Transaksi Tercapai' : 'Hampir Mencapai Batas'}
        </h3>
        <p className={`text-sm mb-2 ${isAtLimit ? 'text-destructive/80' : 'text-amber-700'}`}>
          {txThisMonth} dari {maxTx} transaksi bulan ini telah digunakan.
        </p>
        {/* Progress bar */}
        <div className="h-2 bg-white/60 rounded-full overflow-hidden mb-4 mx-auto max-w-xs">
          <div
            className={`h-full rounded-full transition-all ${isAtLimit ? 'bg-destructive' : 'bg-amber-500'}`}
            style={{ width: `${pct}%` }}
          />
        </div>
        {isAtLimit && (
          <p className="text-sm text-destructive/80 mb-4">
            Tidak bisa menambah transaksi baru bulan ini. Upgrade ke Business untuk transaksi tak terbatas.
          </p>
        )}
        <Link href={`/dashboard/${businessId}/settings`}>
          <Button className={isAtLimit ? '' : 'bg-amber-600 hover:bg-amber-700 text-white'}>
            🚀 Upgrade ke Business
          </Button>
        </Link>
      </div>
    )
  }

  // banner variant (default)
  return (
    <div className={`flex items-center justify-between gap-4 rounded-xl border px-5 py-3 ${
      isAtLimit
        ? 'bg-destructive/10 border-destructive/20'
        : 'bg-amber-50 border-amber-200'
    }`}>
      <div className="flex items-center gap-3 min-w-0">
        <span className="text-xl shrink-0">{isAtLimit ? '🚫' : '⚠️'}</span>
        <div className="min-w-0">
          <p className={`text-sm font-semibold ${isAtLimit ? 'text-destructive' : 'text-amber-800'}`}>
            {isAtLimit ? 'Batas transaksi bulan ini tercapai' : `${txThisMonth}/${maxTx} transaksi bulan ini`}
          </p>
          <p className={`text-xs ${isAtLimit ? 'text-destructive/70' : 'text-amber-700'}`}>
            {isAtLimit
              ? 'Upgrade ke Business untuk transaksi tak terbatas'
              : `Tersisa ${maxTx - txThisMonth} transaksi. Upgrade untuk unlimited.`}
          </p>
        </div>
      </div>
      <Link href={`/dashboard/${businessId}/settings`} className="shrink-0">
        <Button size="sm" variant={isAtLimit ? 'destructive' : 'outline'} className={!isAtLimit ? 'border-amber-300 text-amber-800 hover:bg-amber-100' : ''}>
          Upgrade →
        </Button>
      </Link>
    </div>
  )
}
