'use client'

import Link from 'next/link'
import { IncomeExpenseBarChart, CategoryPieChart, MonthlyNetBadges } from '@/components/dashboard-chart'
import type { MonthlyDataPoint, CategoryDataPoint } from '@/components/dashboard-chart'

interface DashboardChartsProps {
  monthlyData: MonthlyDataPoint[]
  categoryData: CategoryDataPoint[]
  businessId: string
}

export function DashboardCharts({ monthlyData, categoryData, businessId }: DashboardChartsProps) {
  return (
    <div className="grid lg:grid-cols-2 gap-5">
      {/* Bar chart: Income vs Expense */}
      <div className="rounded-2xl border border-border bg-card p-6">
        <div className="flex items-center justify-between mb-1">
          <h2 className="font-semibold text-foreground">Tren 6 Bulan Terakhir</h2>
          <Link
            href={`/dashboard/${businessId}/reports`}
            className="text-xs text-muted-foreground hover:text-foreground transition-colors"
          >
            Laporan lengkap →
          </Link>
        </div>
        <p className="text-xs text-muted-foreground mb-5">Pemasukan vs pengeluaran per bulan</p>

        <IncomeExpenseBarChart data={monthlyData} />

        {/* Legend */}
        <div className="flex gap-4 mt-3 pt-3 border-t border-border">
          <div className="flex items-center gap-1.5">
            <div className="h-2.5 w-2.5 rounded-sm bg-emerald-500" />
            <span className="text-xs text-muted-foreground">Pemasukan</span>
          </div>
          <div className="flex items-center gap-1.5">
            <div className="h-2.5 w-2.5 rounded-sm bg-rose-500" />
            <span className="text-xs text-muted-foreground">Pengeluaran</span>
          </div>
        </div>

        {/* Net badges per bulan */}
        <MonthlyNetBadges data={monthlyData} />
      </div>

      {/* Pie chart: Category breakdown */}
      <div className="rounded-2xl border border-border bg-card p-6">
        <div className="flex items-center justify-between mb-1">
          <h2 className="font-semibold text-foreground">Kategori Pengeluaran</h2>
          <Link
            href={`/dashboard/${businessId}/transactions`}
            className="text-xs text-muted-foreground hover:text-foreground transition-colors"
          >
            Lihat transaksi →
          </Link>
        </div>
        <p className="text-xs text-muted-foreground mb-5">Distribusi pengeluaran per kategori</p>

        <CategoryPieChart data={categoryData} />

        {/* Category list */}
        {categoryData.length > 0 && (
          <div className="mt-3 pt-3 border-t border-border space-y-2">
            {categoryData.slice(0, 3).map((cat, i) => (
              <div key={cat.name} className="flex items-center justify-between">
                <div className="flex items-center gap-2 min-w-0">
                  <div
                    className="h-2 w-2 rounded-full shrink-0"
                    style={{
                      background: [
                        '#7C3AED', '#6366F1', '#3B82F6', '#10b981', '#f59e0b', '#f43f5e',
                      ][i % 6],
                    }}
                  />
                  <span className="text-xs text-foreground truncate">{cat.name}</span>
                </div>
                <div className="flex items-center gap-2 shrink-0">
                  <span className="text-xs text-muted-foreground">{cat.percentage}%</span>
                  <span className="text-xs font-medium text-foreground">
                    Rp {cat.value.toLocaleString('id-ID')}
                  </span>
                </div>
              </div>
            ))}
            {categoryData.length > 3 && (
              <p className="text-xs text-muted-foreground pt-1">
                +{categoryData.length - 3} kategori lainnya
              </p>
            )}
          </div>
        )}
      </div>
    </div>
  )
}
