'use client'

import { useRouter } from 'next/navigation'

const MONTH_NAMES_FULL = [
  'Januari','Februari','Maret','April','Mei','Juni',
  'Juli','Agustus','September','Oktober','November','Desember'
]

type Props = {
  businessId: string
  selectedYear: number
  selectedMonth: number | null
  range: string
  availableYears: number[]
}

export function ReportPeriodFilter({ businessId, selectedYear, selectedMonth, range, availableYears }: Props) {
  const router = useRouter()

  const navigate = (params: { year?: number; month?: number | null; range?: string }) => {
    const newYear = params.year ?? selectedYear
    const newMonth = params.month !== undefined ? params.month : selectedMonth
    const newRange = params.range ?? range

    const sp = new URLSearchParams()
    sp.set('year', newYear.toString())
    sp.set('range', newRange)
    if (newMonth !== null && newMonth !== undefined) sp.set('month', newMonth.toString())

    router.push(`/dashboard/${businessId}/reports?${sp.toString()}`)
  }

  const now = new Date()
  const currentYear = now.getFullYear()
  const currentMonth = now.getMonth() + 1

  return (
    <div className="rounded-2xl border border-border bg-card p-4 mb-6">
      <div className="flex flex-wrap gap-3 items-center">
        {/* Range selector */}
        <div className="flex gap-1 rounded-xl border border-border bg-muted p-1">
          {[
            { key: 'month', label: 'Per Bulan' },
            { key: 'year', label: 'Per Tahun' },
            { key: 'all', label: 'Semua' },
          ].map((r) => (
            <button
              key={r.key}
              onClick={() => {
                if (r.key === 'month') navigate({ range: 'month', month: currentMonth, year: currentYear })
                else if (r.key === 'year') navigate({ range: 'year', month: null, year: currentYear })
                else navigate({ range: 'all', month: null })
              }}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
                range === r.key
                  ? 'bg-primary text-white shadow-sm'
                  : 'text-muted-foreground hover:text-foreground'
              }`}
            >
              {r.label}
            </button>
          ))}
        </div>

        {/* Year selector */}
        {range !== 'all' && (
          <select
            value={selectedYear}
            onChange={(e) => navigate({ year: parseInt(e.target.value) })}
            className="px-3 py-1.5 rounded-xl text-xs border border-border bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-primary h-9"
          >
            {availableYears.map((y) => (
              <option key={y} value={y}>{y}</option>
            ))}
          </select>
        )}

        {/* Month selector (only for month range) */}
        {range === 'month' && (
          <div className="flex flex-wrap gap-1">
            {MONTH_NAMES_FULL.map((name, idx) => {
              const m = idx + 1
              const isCurrent = m === selectedMonth
              return (
                <button
                  key={m}
                  onClick={() => navigate({ month: m, range: 'month' })}
                  className={`px-2.5 py-1 rounded-lg text-xs font-medium transition-all ${
                    isCurrent
                      ? 'bg-primary text-white shadow-sm'
                      : 'bg-muted text-muted-foreground hover:bg-accent hover:text-accent-foreground'
                  }`}
                >
                  {name.slice(0, 3)}
                </button>
              )
            })}
          </div>
        )}

        {/* Quick shortcuts */}
        <div className="ml-auto flex gap-1.5">
          <button
            onClick={() => navigate({ range: 'month', month: currentMonth, year: currentYear })}
            className="text-xs text-primary hover:underline"
          >
            Bulan ini
          </button>
          <span className="text-muted-foreground text-xs">·</span>
          <button
            onClick={() => {
              const prevMonth = currentMonth === 1 ? 12 : currentMonth - 1
              const prevYear = currentMonth === 1 ? currentYear - 1 : currentYear
              navigate({ range: 'month', month: prevMonth, year: prevYear })
            }}
            className="text-xs text-primary hover:underline"
          >
            Bulan lalu
          </button>
          <span className="text-muted-foreground text-xs">·</span>
          <button
            onClick={() => navigate({ range: 'year', year: currentYear, month: null })}
            className="text-xs text-primary hover:underline"
          >
            Tahun ini
          </button>
        </div>
      </div>
    </div>
  )
}
