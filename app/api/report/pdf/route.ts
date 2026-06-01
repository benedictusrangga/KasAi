import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { db } from '@/lib/db'
import { transaction, business, goal, budget } from '@/lib/db/schema'
import { and, eq, gte, lte } from 'drizzle-orm'

export const dynamic = 'force-dynamic'

const CATEGORY_LABELS: Record<string, string> = {
  groceries: 'Bahan Makanan', transportation: 'Transportasi', utilities: 'Utilitas',
  entertainment: 'Hiburan', dining: 'Makan & Minum', shopping: 'Belanja',
  healthcare: 'Kesehatan', education: 'Pendidikan', office_supplies: 'Perlengkapan Kantor', other: 'Lainnya',
}

// Generate plain-text report (for Telegram) or JSON (for PDF client-side)
export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url)
  const businessId = searchParams.get('businessId')
  const period = searchParams.get('period') || 'month' // month | all
  const format = searchParams.get('format') || 'json' // json | text

  if (!businessId) return NextResponse.json({ error: 'businessId required' }, { status: 400 })

  const session = await auth.api.getSession({ headers: req.headers as any })
  if (!session?.user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const userId = session.user.id

  // Date range
  const now = new Date()
  let startDate: Date | undefined
  let endDate: Date | undefined
  let periodLabel = 'Semua Waktu'

  if (period === 'month') {
    startDate = new Date(now.getFullYear(), now.getMonth(), 1)
    endDate = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59)
    periodLabel = now.toLocaleDateString('id-ID', { month: 'long', year: 'numeric' })
  } else if (period === 'week') {
    const day = now.getDay()
    startDate = new Date(now)
    startDate.setDate(now.getDate() - day)
    startDate.setHours(0, 0, 0, 0)
    endDate = new Date(startDate)
    endDate.setDate(startDate.getDate() + 6)
    endDate.setHours(23, 59, 59)
    periodLabel = `Minggu ini`
  }

  const [biz, txns, goals, budgets] = await Promise.all([
    db.query.business.findFirst({ where: and(eq(business.id, businessId), eq(business.userId, userId)) }),
    db.query.transaction.findMany({
      where: and(
        eq(transaction.businessId, businessId),
        eq(transaction.userId, userId),
        ...(startDate ? [gte(transaction.createdAt, startDate)] : []),
        ...(endDate ? [lte(transaction.createdAt, endDate)] : []),
      ),
      orderBy: (t, { desc }) => [desc(t.createdAt)],
    }),
    db.query.goal.findMany({ where: and(eq(goal.businessId, businessId), eq(goal.userId, userId)) }),
    db.query.budget.findMany({ where: and(eq(budget.businessId, businessId), eq(budget.userId, userId)) }),
  ])

  if (!biz) return NextResponse.json({ error: 'Business not found' }, { status: 404 })

  const totalIncome = txns.filter(t => t.transaction_type === 'income').reduce((s, t) => s + parseFloat(t.amount), 0)
  const totalExpense = txns.filter(t => t.transaction_type === 'expense').reduce((s, t) => s + parseFloat(t.amount), 0)
  const netProfit = totalIncome - totalExpense

  // Category breakdown
  const byCategory: Record<string, number> = {}
  txns.filter(t => t.transaction_type === 'expense').forEach(t => {
    const cat = t.categoryId || 'other'
    byCategory[cat] = (byCategory[cat] || 0) + parseFloat(t.amount)
  })

  // Budget status
  const budgetStatus = budgets.map(b => ({
    category: CATEGORY_LABELS[b.category] || b.category,
    budget: parseFloat(b.amount),
    spent: byCategory[b.category] || 0,
    percentage: Math.round(((byCategory[b.category] || 0) / parseFloat(b.amount)) * 100),
    status: ((byCategory[b.category] || 0) / parseFloat(b.amount)) > 1 ? 'MELEBIHI' :
            ((byCategory[b.category] || 0) / parseFloat(b.amount)) > 0.8 ? 'HAMPIR HABIS' : 'AMAN',
  }))

  if (format === 'text') {
    // Plain text for Telegram
    const lines = [
      `📊 *LAPORAN KEUANGAN*`,
      `🏪 ${biz.name}`,
      `📅 Periode: ${periodLabel}`,
      ``,
      `💰 *RINGKASAN*`,
      `• Pemasukan: Rp ${totalIncome.toLocaleString('id-ID')}`,
      `• Pengeluaran: Rp ${totalExpense.toLocaleString('id-ID')}`,
      `• ${netProfit >= 0 ? '✅ Laba' : '❌ Rugi'}: Rp ${Math.abs(netProfit).toLocaleString('id-ID')}`,
      `• Total transaksi: ${txns.length}`,
      ``,
    ]

    if (Object.keys(byCategory).length > 0) {
      lines.push(`📂 *PENGELUARAN PER KATEGORI*`)
      Object.entries(byCategory)
        .sort(([, a], [, b]) => b - a)
        .slice(0, 5)
        .forEach(([cat, amount]) => {
          lines.push(`• ${CATEGORY_LABELS[cat] || cat}: Rp ${amount.toLocaleString('id-ID')}`)
        })
      lines.push(``)
    }

    if (budgetStatus.length > 0) {
      lines.push(`🎯 *STATUS BUDGET*`)
      budgetStatus.forEach(b => {
        const icon = b.status === 'MELEBIHI' ? '🔴' : b.status === 'HAMPIR HABIS' ? '🟡' : '🟢'
        lines.push(`${icon} ${b.category}: ${b.percentage}% (Rp ${b.spent.toLocaleString('id-ID')} / Rp ${b.budget.toLocaleString('id-ID')})`)
      })
      lines.push(``)
    }

    const activeGoals = goals.filter(g => !g.completed)
    if (activeGoals.length > 0) {
      lines.push(`🎯 *TARGET AKTIF*`)
      activeGoals.forEach(g => {
        const pct = Math.round((parseFloat(g.currentAmount) / parseFloat(g.targetAmount)) * 100)
        const bar = '█'.repeat(Math.floor(pct / 10)) + '░'.repeat(10 - Math.floor(pct / 10))
        lines.push(`• ${g.title}: ${bar} ${pct}%`)
      })
      lines.push(``)
    }

    if (txns.length > 0) {
      lines.push(`📋 *5 TRANSAKSI TERAKHIR*`)
      txns.slice(0, 5).forEach(t => {
        const sign = t.transaction_type === 'income' ? '+' : '-'
        const date = new Date(t.createdAt).toLocaleDateString('id-ID', { day: 'numeric', month: 'short' })
        lines.push(`${sign}Rp ${parseFloat(t.amount).toLocaleString('id-ID')} — ${t.description} (${date})`)
      })
    }

    lines.push(``, `_Dibuat oleh KasAI · ${new Date().toLocaleDateString('id-ID')}_`)

    return NextResponse.json({ text: lines.join('\n'), format: 'text' })
  }

  // JSON for client-side PDF generation
  return NextResponse.json({
    business: { name: biz.name, type: biz.type },
    period: periodLabel,
    generatedAt: new Date().toISOString(),
    summary: { totalIncome, totalExpense, netProfit, txCount: txns.length },
    transactions: txns.map(t => ({
      date: new Date(t.createdAt).toLocaleDateString('id-ID'),
      description: t.description,
      type: t.transaction_type,
      amount: parseFloat(t.amount),
      category: CATEGORY_LABELS[t.categoryId || 'other'] || 'Lainnya',
      source: t.source,
    })),
    byCategory: Object.entries(byCategory).map(([cat, amount]) => ({
      category: CATEGORY_LABELS[cat] || cat,
      amount,
      percentage: totalExpense > 0 ? Math.round((amount / totalExpense) * 100) : 0,
    })).sort((a, b) => b.amount - a.amount),
    budgetStatus,
    goals: goals.map(g => ({
      title: g.title,
      target: parseFloat(g.targetAmount),
      current: parseFloat(g.currentAmount),
      percentage: Math.round((parseFloat(g.currentAmount) / parseFloat(g.targetAmount)) * 100),
      completed: g.completed,
      deadline: g.deadline ? new Date(g.deadline).toLocaleDateString('id-ID') : null,
    })),
  })
}
