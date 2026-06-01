'use client'

import { IncomeExpenseBarChart, CategoryPieChart } from '@/components/dashboard-chart'
import type { MonthlyDataPoint, CategoryDataPoint } from '@/components/dashboard-chart'

interface ReportsChartsProps {
  monthlyData: MonthlyDataPoint[]
  categoryData: CategoryDataPoint[]
}

export function ReportsCharts({ monthlyData, categoryData }: ReportsChartsProps) {
  return (
    <>
      {/* Monthly bar chart */}
      <div className="rounded-2xl border border-border bg-card p-6">
        <h2 className="font-semibold text-foreground mb-1">Tren 6 Bulan Terakhir</h2>
        <p className="text-xs text-muted-foreground mb-5">Pemasukan vs Pengeluaran per bulan</p>
        <IncomeExpenseBarChart data={monthlyData} />
        <div className="flex gap-4 mt-4 pt-4 border-t border-border">
          <div className="flex items-center gap-1.5">
            <div className="h-2.5 w-2.5 rounded-sm bg-emerald-500" />
            <span className="text-xs text-muted-foreground">Pemasukan</span>
          </div>
          <div className="flex items-center gap-1.5">
            <div className="h-2.5 w-2.5 rounded-sm bg-rose-500" />
            <span className="text-xs text-muted-foreground">Pengeluaran</span>
          </div>
        </div>
      </div>

      {/* Category pie chart */}
      <div className="rounded-2xl border border-border bg-card p-6">
        <h2 className="font-semibold text-foreground mb-1">Kategori Pengeluaran</h2>
        <p className="text-xs text-muted-foreground mb-5">Distribusi pengeluaran per kategori</p>
        <CategoryPieChart data={categoryData} />
        {categoryData.length > 0 && (
          <div className="mt-4 pt-4 border-t border-border space-y-2.5">
            {categoryData.map((cat, i) => (
              <div key={cat.name} className="flex items-center justify-between gap-3">
                <div className="flex items-center gap-2 min-w-0">
                  <div
                    className="h-2 w-2 rounded-full shrink-0"
                    style={{
                      background: [
                        '#7C3AED', '#6366F1', '#3B82F6', '#10b981', '#f59e0b', '#f43f5e',
                      ][i % 6],
                    }}
                  />
                  <span className="text-sm text-foreground truncate capitalize">{cat.name}</span>
                </div>
                <div className="flex items-center gap-3 shrink-0">
                  <div className="w-20 h-1.5 bg-muted rounded-full overflow-hidden">
                    <div
                      className="h-full rounded-full bg-primary"
                      style={{ width: `${cat.percentage}%` }}
                    />
                  </div>
                  <span className="text-xs text-muted-foreground w-8 text-right">{cat.percentage}%</span>
                  <span className="text-sm font-medium text-foreground w-28 text-right">
                    Rp {cat.value.toLocaleString('id-ID')}
                  </span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </>
  )
}
