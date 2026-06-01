'use client'

import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Cell,
  PieChart,
  Pie,
  Legend,
} from 'recharts'
import { useAppTheme } from '@/components/theme-provider'

// ── Types ──────────────────────────────────────────────────────────────────────

export interface MonthlyDataPoint {
  month: string
  income: number
  expense: number
}

export interface CategoryDataPoint {
  name: string
  value: number
  percentage: number
}

// ── Helpers ────────────────────────────────────────────────────────────────────

function formatRupiah(value: number): string {
  if (value >= 1_000_000) return `${(value / 1_000_000).toFixed(1)}jt`
  if (value >= 1_000) return `${(value / 1_000).toFixed(0)}rb`
  return value.toString()
}

// ── Custom Tooltip ─────────────────────────────────────────────────────────────

function BarTooltip({ active, payload, label }: any) {
  if (!active || !payload?.length) return null
  const income = payload.find((p: any) => p.dataKey === 'income')?.value ?? 0
  const expense = payload.find((p: any) => p.dataKey === 'expense')?.value ?? 0
  const net = income - expense
  return (
    <div className="rounded-xl border border-border bg-card shadow-lg px-4 py-3 text-sm min-w-[180px]">
      <p className="font-semibold text-foreground mb-2">{label}</p>
      <div className="space-y-1">
        <div className="flex justify-between gap-4">
          <span className="text-emerald-600">Pemasukan</span>
          <span className="font-medium text-foreground">Rp {income.toLocaleString('id-ID')}</span>
        </div>
        <div className="flex justify-between gap-4">
          <span className="text-rose-500">Pengeluaran</span>
          <span className="font-medium text-foreground">Rp {expense.toLocaleString('id-ID')}</span>
        </div>
        <div className="h-px bg-border my-1" />
        <div className="flex justify-between gap-4">
          <span className={net >= 0 ? 'text-violet-500' : 'text-rose-500'}>
            {net >= 0 ? 'Laba' : 'Rugi'}
          </span>
          <span className={`font-bold ${net >= 0 ? 'text-violet-500' : 'text-rose-500'}`}>
            Rp {Math.abs(net).toLocaleString('id-ID')}
          </span>
        </div>
      </div>
    </div>
  )
}

function PieTooltip({ active, payload }: any) {
  if (!active || !payload?.length) return null
  const d = payload[0]
  return (
    <div className="rounded-xl border border-border bg-card shadow-lg px-4 py-3 text-sm">
      <p className="font-semibold text-foreground mb-1 capitalize">{d.name}</p>
      <p className="text-foreground">Rp {d.value.toLocaleString('id-ID')}</p>
      <p className="text-muted-foreground text-xs">{d.payload.percentage}% dari total</p>
    </div>
  )
}

// ── Bar Chart: Income vs Expense ───────────────────────────────────────────────

export function IncomeExpenseBarChart({ data }: { data: MonthlyDataPoint[] }) {
  const { isDark } = useAppTheme()
  const gridColor = isDark ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.06)'
  const axisColor = isDark ? 'rgba(255,255,255,0.3)' : 'rgba(0,0,0,0.35)'

  const hasData = data.some((d) => d.income > 0 || d.expense > 0)

  if (!hasData) {
    return (
      <div className="flex flex-col items-center justify-center h-[220px] text-center">
        <div className="text-3xl mb-2">📊</div>
        <p className="text-sm text-muted-foreground">Belum ada data transaksi.</p>
        <p className="text-xs text-muted-foreground mt-1">Tambahkan transaksi untuk melihat grafik.</p>
      </div>
    )
  }

  return (
    <ResponsiveContainer width="100%" height={220}>
      <BarChart data={data} barCategoryGap="30%" barGap={3}>
        <CartesianGrid vertical={false} stroke={gridColor} />
        <XAxis
          dataKey="month"
          tick={{ fontSize: 11, fill: axisColor }}
          axisLine={false}
          tickLine={false}
        />
        <YAxis
          tickFormatter={formatRupiah}
          tick={{ fontSize: 10, fill: axisColor }}
          axisLine={false}
          tickLine={false}
          width={42}
        />
        <Tooltip content={<BarTooltip />} cursor={{ fill: isDark ? 'rgba(255,255,255,0.03)' : 'rgba(0,0,0,0.03)', radius: 6 }} />
        <Bar dataKey="income" name="Pemasukan" fill="#10b981" radius={[4, 4, 0, 0]} maxBarSize={32} />
        <Bar dataKey="expense" name="Pengeluaran" fill="#f43f5e" radius={[4, 4, 0, 0]} maxBarSize={32} />
      </BarChart>
    </ResponsiveContainer>
  )
}

// ── Pie Chart: Category Breakdown ─────────────────────────────────────────────

const PIE_COLORS = [
  '#7C3AED', '#6366F1', '#3B82F6', '#10b981', '#f59e0b',
  '#f43f5e', '#ec4899', '#14b8a6', '#8b5cf6', '#06b6d4',
]

export function CategoryPieChart({ data }: { data: CategoryDataPoint[] }) {
  const { isDark } = useAppTheme()

  if (!data.length) {
    return (
      <div className="flex flex-col items-center justify-center h-[220px] text-center">
        <div className="text-3xl mb-2">🗂️</div>
        <p className="text-sm text-muted-foreground">Belum ada data kategori.</p>
        <p className="text-xs text-muted-foreground mt-1">Catat pengeluaran untuk melihat breakdown.</p>
      </div>
    )
  }

  return (
    <ResponsiveContainer width="100%" height={220}>
      <PieChart>
        <Pie
          data={data}
          cx="50%"
          cy="50%"
          innerRadius={55}
          outerRadius={85}
          paddingAngle={2}
          dataKey="value"
        >
          {data.map((_, index) => (
            <Cell key={`cell-${index}`} fill={PIE_COLORS[index % PIE_COLORS.length]} />
          ))}
        </Pie>
        <Tooltip content={<PieTooltip />} />
        <Legend
          formatter={(value) => (
            <span style={{ fontSize: 11, color: isDark ? 'rgba(255,255,255,0.55)' : 'rgba(0,0,0,0.55)' }}>
              {value}
            </span>
          )}
          iconSize={8}
          iconType="circle"
        />
      </PieChart>
    </ResponsiveContainer>
  )
}

// ── Net Profit Line Indicator ──────────────────────────────────────────────────

export function MonthlyNetBadges({ data }: { data: MonthlyDataPoint[] }) {
  return (
    <div className="flex gap-2 flex-wrap mt-3">
      {data.map((d) => {
        const net = d.income - d.expense
        if (net === 0 && d.income === 0) return null
        return (
          <div
            key={d.month}
            className={`flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-medium ${
              net >= 0
                ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-400'
                : 'bg-rose-100 text-rose-700 dark:bg-rose-950/40 dark:text-rose-400'
            }`}
          >
            <span>{d.month}</span>
            <span>{net >= 0 ? '↑' : '↓'} {formatRupiah(Math.abs(net))}</span>
          </div>
        )
      })}
    </div>
  )
}
