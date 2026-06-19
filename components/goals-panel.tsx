'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  createGoal,
  deleteGoal,
  addGoalContribution,
  upsertBudget,
  deleteBudget,
} from '@/app/actions/goals'

type Goal = {
  id: string
  title: string
  description?: string | null
  targetAmount: string
  currentAmount: string
  deadline?: Date | null
  completed: boolean
}

type Budget = {
  id: string
  category: string
  amount: string
  period: string
}

type Props = {
  businessId: string
  businessName: string
  goals: Goal[]
  budgets: Budget[]
  spendingByCategory: Record<string, number>
  customCategories?: { id: string; name: string; type: string }[]
  goalContributionAsExpense?: boolean  // dari feature config
}

function ContributeModal({
  goal,
  businessId,
  goalContributionAsExpense = false,
  onClose,
}: {
  goal: Goal
  businessId: string
  goalContributionAsExpense?: boolean
  onClose: () => void
}) {
  const router = useRouter()
  const [amount, setAmount] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const remaining = parseFloat(goal.targetAmount) - parseFloat(goal.currentAmount)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    const amt = parseFloat(amount)
    if (!amt || amt <= 0) { setError('Jumlah harus lebih dari 0'); return }
    setLoading(true)
    setError(null)
    try {
      await addGoalContribution(goal.id, amt, undefined, {
        alsoRecordAsExpense: goalContributionAsExpense,
        businessId,
      })
      router.refresh()
      onClose()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Gagal')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
      <div className="bg-card border border-border rounded-2xl p-6 max-w-sm w-full shadow-2xl">
        <h3 className="font-bold text-foreground mb-1">🎯 Tambah Kontribusi</h3>
        <p className="text-sm text-muted-foreground mb-4">{goal.title}</p>

        {goalContributionAsExpense && (
          <div className="rounded-xl border border-amber-200 bg-amber-50 dark:bg-amber-950/20 p-3 mb-4 text-xs text-amber-700 dark:text-amber-300">
            📊 Kontribusi ini juga akan dicatat sebagai <strong>pengeluaran</strong> di laporan keuangan.
          </div>
        )}

        <div className="rounded-xl bg-muted/50 p-3 mb-4 text-sm space-y-1.5">
          <div className="flex justify-between">
            <span className="text-muted-foreground">Target</span>
            <span className="font-semibold">Rp {parseFloat(goal.targetAmount).toLocaleString('id-ID')}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-muted-foreground">Sudah terkumpul</span>
            <span className="font-semibold text-emerald-600">Rp {parseFloat(goal.currentAmount).toLocaleString('id-ID')}</span>
          </div>
          <div className="flex justify-between border-t border-border pt-1.5">
            <span className="font-medium">Sisa</span>
            <span className="font-bold text-primary">Rp {remaining.toLocaleString('id-ID')}</span>
          </div>
        </div>
        <form onSubmit={handleSubmit} className="space-y-3">
          <div className="space-y-1.5">
            <Label>Jumlah yang ditambahkan (Rp)</Label>
            <Input
              type="number"
              placeholder={remaining.toString()}
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              className="h-10"
            />
            <button
              type="button"
              onClick={() => setAmount(remaining.toString())}
              className="text-xs text-primary hover:underline"
            >
              Langsung capai target (Rp {remaining.toLocaleString('id-ID')})
            </button>
          </div>
          {error && <p className="text-sm text-destructive">{error}</p>}
          <div className="flex gap-2">
            <Button type="submit" disabled={loading} size="sm" className="flex-1">
              {loading ? 'Menyimpan...' : '+ Tambah'}
            </Button>
            <Button type="button" variant="outline" size="sm" onClick={onClose}>Batal</Button>
          </div>
        </form>
      </div>
    </div>
  )
}

export function GoalsPanel({
  businessId,
  businessName,
  goals: initialGoals,
  budgets: initialBudgets,
  spendingByCategory,
  customCategories = [],
  goalContributionAsExpense = false,
}: Props) {
  const router = useRouter()
  const [activeTab, setActiveTab] = useState<'goals' | 'budget'>('goals')
  const [isSaving, setIsSaving] = useState(false)
  const [status, setStatus] = useState<{ type: 'success' | 'error'; msg: string } | null>(null)
  const [goals, setGoals] = useState(initialGoals)
  const [budgets, setBudgets] = useState(initialBudgets)
  const [showGoalForm, setShowGoalForm] = useState(false)
  const [contributingGoal, setContributingGoal] = useState<Goal | null>(null)

  // Goal form state
  const [newGoal, setNewGoal] = useState({
    title: '',
    description: '',
    targetAmount: '',
    startAmount: '',
    deadline: '',
  })

  // Budget form
  const [newBudget, setNewBudget] = useState({ category: '', customCategory: '', amount: '', period: 'monthly' })

  const showStatus = (type: 'success' | 'error', msg: string) => {
    setStatus({ type, msg })
    setTimeout(() => setStatus(null), 3500)
  }

  const handleCreateGoal = async () => {
    if (!newGoal.title.trim()) { showStatus('error', 'Judul target wajib diisi'); return }
    const target = parseFloat(newGoal.targetAmount)
    if (!target || target <= 0) { showStatus('error', 'Target jumlah wajib diisi'); return }

    setIsSaving(true)
    try {
      const result = await createGoal({
        businessId,
        title: newGoal.title.trim(),
        description: newGoal.description.trim() || undefined,
        targetAmount: target,
        startAmount: parseFloat(newGoal.startAmount) || 0,
        deadline: newGoal.deadline ? new Date(newGoal.deadline) : undefined,
      })
      setGoals([...goals, {
        id: result.id,
        title: newGoal.title.trim(),
        description: newGoal.description.trim() || null,
        targetAmount: target.toString(),
        currentAmount: (parseFloat(newGoal.startAmount) || 0).toString(),
        deadline: newGoal.deadline ? new Date(newGoal.deadline) : null,
        completed: (parseFloat(newGoal.startAmount) || 0) >= target,
      }])
      setNewGoal({ title: '', description: '', targetAmount: '', startAmount: '', deadline: '' })
      setShowGoalForm(false)
      showStatus('success', 'Target berhasil dibuat!')
      router.refresh()
    } catch (err) {
      showStatus('error', err instanceof Error ? err.message : 'Gagal')
    } finally {
      setIsSaving(false)
    }
  }

  const handleDeleteGoal = async (goalId: string) => {
    if (!confirm('Hapus target ini?')) return
    setIsSaving(true)
    try {
      await deleteGoal(goalId)
      setGoals(goals.filter((g) => g.id !== goalId))
      showStatus('success', 'Target dihapus.')
      router.refresh()
    } catch {
      showStatus('error', 'Gagal menghapus.')
    } finally {
      setIsSaving(false)
    }
  }

  const handleUpsertBudget = async () => {
    const category = newBudget.category === '__custom__' ? newBudget.customCategory.trim() : newBudget.category
    if (!category) { showStatus('error', 'Pilih atau masukkan kategori'); return }
    const amount = parseFloat(newBudget.amount)
    if (!amount || amount <= 0) { showStatus('error', 'Jumlah budget harus lebih dari 0'); return }

    setIsSaving(true)
    try {
      const result = await upsertBudget({
        businessId,
        category,
        amount,
        period: newBudget.period as 'monthly',
      })
      const existing = budgets.findIndex((b) => b.category === category)
      if (existing >= 0) {
        const updated = [...budgets]
        updated[existing] = { ...updated[existing], amount: amount.toString() }
        setBudgets(updated)
      } else {
        setBudgets([...budgets, { id: result.id, category, amount: amount.toString(), period: newBudget.period }])
      }
      setNewBudget({ category: '', customCategory: '', amount: '', period: 'monthly' })
      showStatus('success', 'Budget disimpan!')
      router.refresh()
    } catch (err) {
      showStatus('error', err instanceof Error ? err.message : 'Gagal')
    } finally {
      setIsSaving(false)
    }
  }

  const handleDeleteBudget = async (budgetId: string) => {
    if (!confirm('Hapus budget ini?')) return
    setIsSaving(true)
    try {
      await deleteBudget(budgetId)
      setBudgets(budgets.filter((b) => b.id !== budgetId))
      showStatus('success', 'Budget dihapus.')
      router.refresh()
    } catch {
      showStatus('error', 'Gagal menghapus.')
    } finally {
      setIsSaving(false)
    }
  }

  // Semua kategori: dari DB + input custom yang ada di budget
  const allBudgetCategories = [
    ...customCategories.map((c) => ({ value: c.id, label: c.name })),
    { value: 'groceries', label: '🛒 Bahan Makanan' },
    { value: 'transportation', label: '🚗 Transportasi' },
    { value: 'utilities', label: '💡 Utilitas' },
    { value: 'entertainment', label: '🎬 Hiburan' },
    { value: 'dining', label: '🍽️ Makan & Minum' },
    { value: 'shopping', label: '🛍️ Belanja' },
    { value: 'healthcare', label: '🏥 Kesehatan' },
    { value: 'education', label: '📚 Pendidikan' },
    { value: 'office_supplies', label: '📎 Perlengkapan Kantor' },
    { value: 'other', label: '📦 Lainnya' },
    { value: '__custom__', label: '✏️ Kategori Kustom...' },
  ]

  const activeGoals = goals.filter((g) => !g.completed)
  const completedGoals = goals.filter((g) => g.completed)

  return (
    <div>
      {/* Status toast */}
      {status && (
        <div className={`fixed top-4 right-4 z-50 rounded-xl border px-5 py-3 text-sm font-medium shadow-lg ${
          status.type === 'success'
            ? 'border-emerald-200 bg-emerald-50 text-emerald-800 dark:bg-emerald-950/50 dark:border-emerald-800 dark:text-emerald-300'
            : 'border-destructive/20 bg-destructive/10 text-destructive'
        }`}>
          {status.type === 'success' ? '✓ ' : '✕ '}{status.msg}
        </div>
      )}

      {/* Tabs */}
      <div className="flex gap-1 rounded-xl border border-border bg-muted p-1 mb-6 max-w-xs">
        <button
          onClick={() => setActiveTab('goals')}
          className={`flex-1 rounded-lg py-2.5 text-sm font-medium transition-all ${
            activeTab === 'goals' ? 'bg-primary text-white shadow-sm' : 'text-muted-foreground hover:text-foreground'
          }`}
        >
          🎯 Target
        </button>
        <button
          onClick={() => setActiveTab('budget')}
          className={`flex-1 rounded-lg py-2.5 text-sm font-medium transition-all ${
            activeTab === 'budget' ? 'bg-primary text-white shadow-sm' : 'text-muted-foreground hover:text-foreground'
          }`}
        >
          💰 Budget
        </button>
      </div>

      {/* ── GOALS TAB ───────────────────────────────────────────────────────── */}
      {activeTab === 'goals' && (
        <div className="space-y-6">
          {/* Tombol tambah */}
          {!showGoalForm && (
            <Button size="sm" onClick={() => setShowGoalForm(true)}>+ Tambah Target</Button>
          )}

          {/* Form tambah target */}
          {showGoalForm && (
            <div className="rounded-2xl border border-primary/20 bg-primary/5 p-5">
              <h3 className="font-semibold text-foreground mb-1">🎯 Target Baru</h3>
              <p className="text-xs text-muted-foreground mb-4">
                Tetapkan target keuangan — misal tabungan beli motor, modal usaha baru, dll.
              </p>
              <div className="space-y-4">
                <div className="space-y-1.5">
                  <Label>Nama Target *</Label>
                  <Input
                    placeholder="Contoh: Tabungan Motor, Modal Renovasi Toko, Dana Darurat"
                    value={newGoal.title}
                    onChange={(e) => setNewGoal({ ...newGoal, title: e.target.value })}
                    className="h-10"
                  />
                </div>
                <div className="space-y-1.5">
                  <Label>Keterangan (Opsional)</Label>
                  <Input
                    placeholder="Untuk apa target ini?"
                    value={newGoal.description}
                    onChange={(e) => setNewGoal({ ...newGoal, description: e.target.value })}
                    className="h-10"
                  />
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1.5">
                    <Label>Jumlah Target (Rp) *</Label>
                    <Input
                      type="number"
                      placeholder="5000000"
                      value={newGoal.targetAmount}
                      onChange={(e) => setNewGoal({ ...newGoal, targetAmount: e.target.value })}
                      className="h-10"
                    />
                  </div>
                  <div className="space-y-1.5">
                    <Label>Sudah terkumpul (Rp)</Label>
                    <Input
                      type="number"
                      placeholder="0"
                      value={newGoal.startAmount}
                      onChange={(e) => setNewGoal({ ...newGoal, startAmount: e.target.value })}
                      className="h-10"
                    />
                    <p className="text-xs text-muted-foreground">Berapa yang sudah ada sekarang?</p>
                  </div>
                </div>
                <div className="space-y-1.5">
                  <Label>Deadline (Opsional)</Label>
                  <Input
                    type="date"
                    value={newGoal.deadline}
                    onChange={(e) => setNewGoal({ ...newGoal, deadline: e.target.value })}
                    className="h-10 max-w-xs"
                  />
                </div>
                <div className="flex gap-2">
                  <Button size="sm" onClick={handleCreateGoal} disabled={isSaving}>
                    {isSaving ? 'Menyimpan...' : 'Buat Target'}
                  </Button>
                  <Button size="sm" variant="outline" onClick={() => setShowGoalForm(false)}>Batal</Button>
                </div>
              </div>
            </div>
          )}

          {/* Active goals */}
          {activeGoals.length > 0 && (
            <div className="space-y-3">
              <h3 className="text-sm font-semibold text-foreground uppercase tracking-wider">Target Aktif ({activeGoals.length})</h3>
              {activeGoals.map((g) => {
                const pct = Math.min(
                  Math.round((parseFloat(g.currentAmount) / parseFloat(g.targetAmount)) * 100),
                  100
                )
                const remaining = parseFloat(g.targetAmount) - parseFloat(g.currentAmount)
                const isNearDeadline = g.deadline && (new Date(g.deadline).getTime() - Date.now()) < 7 * 24 * 60 * 60 * 1000

                return (
                  <div key={g.id} className="rounded-2xl border border-border bg-card p-5">
                    <div className="flex items-start justify-between gap-3 mb-3">
                      <div className="min-w-0 flex-1">
                        <p className="font-semibold text-foreground">{g.title}</p>
                        {g.description && <p className="text-xs text-muted-foreground mt-0.5">{g.description}</p>}
                        {g.deadline && (
                          <p className={`text-xs mt-1 ${isNearDeadline ? 'text-amber-600 font-medium' : 'text-muted-foreground'}`}>
                            {isNearDeadline && '⏰ '}Deadline: {new Date(g.deadline).toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' })}
                          </p>
                        )}
                      </div>
                      <div className="text-right shrink-0">
                        <p className="text-lg font-bold text-primary">{pct}%</p>
                        <p className="text-xs text-muted-foreground">tercapai</p>
                      </div>
                    </div>

                    {/* Progress bar */}
                    <div className="mb-3">
                      <div className="h-3 bg-muted rounded-full overflow-hidden mb-1.5">
                        <div
                          className={`h-full rounded-full transition-all ${
                            pct >= 100 ? 'bg-emerald-500' : pct >= 50 ? 'bg-primary' : 'bg-primary/60'
                          }`}
                          style={{ width: `${pct}%` }}
                        />
                      </div>
                      <div className="flex justify-between text-xs text-muted-foreground">
                        <span>Rp {parseFloat(g.currentAmount).toLocaleString('id-ID')} terkumpul</span>
                        <span>Target: Rp {parseFloat(g.targetAmount).toLocaleString('id-ID')}</span>
                      </div>
                      {remaining > 0 && (
                        <p className="text-xs text-muted-foreground mt-0.5">
                          Sisa: <span className="font-medium text-foreground">Rp {remaining.toLocaleString('id-ID')}</span>
                        </p>
                      )}
                    </div>

                    <div className="flex gap-2">
                      <Button
                        size="sm"
                        variant="outline"
                        className="text-xs h-8"
                        onClick={() => setContributingGoal(g)}
                      >
                        + Tambah Tabungan
                      </Button>
                      <Button
                        size="sm"
                        variant="ghost"
                        className="text-xs h-8 text-destructive hover:text-destructive"
                        onClick={() => handleDeleteGoal(g.id)}
                      >
                        Hapus
                      </Button>
                    </div>
                  </div>
                )
              })}
            </div>
          )}

          {/* Completed goals */}
          {completedGoals.length > 0 && (
            <div className="space-y-3">
              <h3 className="text-sm font-semibold text-emerald-600 uppercase tracking-wider">
                ✅ Target Tercapai ({completedGoals.length})
              </h3>
              {completedGoals.map((g) => (
                <div key={g.id} className="rounded-2xl border border-emerald-200 dark:border-emerald-800 bg-emerald-50 dark:bg-emerald-950/20 p-4 flex items-center justify-between">
                  <div>
                    <p className="font-semibold text-emerald-700 dark:text-emerald-400">{g.title}</p>
                    <p className="text-xs text-emerald-600 dark:text-emerald-500">
                      Rp {parseFloat(g.targetAmount).toLocaleString('id-ID')} · Selesai! 🎉
                    </p>
                  </div>
                  <Button
                    size="sm"
                    variant="ghost"
                    className="text-xs h-8 text-destructive hover:text-destructive"
                    onClick={() => handleDeleteGoal(g.id)}
                  >
                    Hapus
                  </Button>
                </div>
              ))}
            </div>
          )}

          {goals.length === 0 && !showGoalForm && (
            <div className="rounded-2xl border-2 border-dashed border-border p-12 text-center">
              <div className="text-4xl mb-3">🎯</div>
              <p className="text-foreground font-medium mb-1">Belum ada target keuangan</p>
              <p className="text-sm text-muted-foreground mb-4">
                Tetapkan target — tabungan, modal, dana darurat — dan pantau progressnya di sini.
              </p>
              <Button size="sm" onClick={() => setShowGoalForm(true)}>Buat Target Pertama</Button>
            </div>
          )}
        </div>
      )}

      {/* ── BUDGET TAB ───────────────────────────────────────────────────────── */}
      {activeTab === 'budget' && (
        <div className="space-y-6">
          {/* Info card */}
          <div className="rounded-2xl border border-border bg-card p-5">
            <h3 className="font-semibold text-foreground mb-1">Tambah / Edit Budget</h3>
            <p className="text-xs text-muted-foreground mb-4">
              Tetapkan batas pengeluaran per kategori. AI dan bot Telegram akan memperingatkan saat Anda mendekati batas.
            </p>
            <div className="grid sm:grid-cols-4 gap-3">
              <div className="space-y-1.5 sm:col-span-2">
                <Label>Kategori</Label>
                <select
                  value={newBudget.category}
                  onChange={(e) => setNewBudget({ ...newBudget, category: e.target.value })}
                  className="w-full h-10 px-3 border border-input rounded-lg bg-background text-foreground text-sm focus:outline-none focus:ring-2 focus:ring-ring"
                >
                  <option value="">Pilih kategori...</option>
                  {allBudgetCategories.map((c) => (
                    <option key={c.value} value={c.value}>{c.label}</option>
                  ))}
                </select>
              </div>
              {newBudget.category === '__custom__' && (
                <div className="space-y-1.5">
                  <Label>Nama Kategori</Label>
                  <Input
                    placeholder="Contoh: Bahan Baku"
                    value={newBudget.customCategory}
                    onChange={(e) => setNewBudget({ ...newBudget, customCategory: e.target.value })}
                    className="h-10"
                  />
                </div>
              )}
              <div className="space-y-1.5">
                <Label>Budget (Rp/bulan)</Label>
                <Input
                  type="number"
                  placeholder="500000"
                  value={newBudget.amount}
                  onChange={(e) => setNewBudget({ ...newBudget, amount: e.target.value })}
                  className="h-10"
                />
              </div>
              <div className="flex items-end">
                <Button size="sm" onClick={handleUpsertBudget} disabled={isSaving} className="h-10 w-full">
                  Simpan
                </Button>
              </div>
            </div>
          </div>

          {/* Budget list */}
          {budgets.length === 0 ? (
            <div className="rounded-2xl border-2 border-dashed border-border p-12 text-center">
              <div className="text-4xl mb-3">💰</div>
              <p className="text-foreground font-medium mb-1">Belum ada budget</p>
              <p className="text-sm text-muted-foreground">
                Tambahkan budget per kategori agar bisa memantau pengeluaran secara proaktif.
              </p>
            </div>
          ) : (
            <div className="space-y-3">
              <h3 className="text-sm font-semibold text-foreground uppercase tracking-wider">Budget Bulan Ini</h3>
              <div className="grid sm:grid-cols-2 gap-3">
                {budgets.map((b) => {
                  const spent = spendingByCategory[b.category] || 0
                  const budgetAmt = parseFloat(b.amount)
                  const pct = Math.round((spent / budgetAmt) * 100)
                  const isOver = pct > 100
                  const isNear = pct >= 80 && !isOver
                  const remaining = Math.max(budgetAmt - spent, 0)

                  return (
                    <div
                      key={b.id}
                      className={`rounded-2xl border p-4 ${
                        isOver
                          ? 'border-rose-200 bg-rose-50 dark:bg-rose-950/20 dark:border-rose-800'
                          : isNear
                          ? 'border-amber-200 bg-amber-50 dark:bg-amber-950/20 dark:border-amber-800'
                          : 'border-border bg-card'
                      }`}
                    >
                      <div className="flex items-start justify-between mb-3">
                        <div>
                          <p className="text-sm font-semibold text-foreground capitalize">{b.category}</p>
                          <p className="text-xs text-muted-foreground">Budget: Rp {budgetAmt.toLocaleString('id-ID')}/bln</p>
                        </div>
                        <div className="flex items-center gap-1.5">
                          <span className={`text-sm font-bold ${isOver ? 'text-destructive' : isNear ? 'text-amber-600' : 'text-foreground'}`}>
                            {pct}%
                          </span>
                          <Button
                            size="sm"
                            variant="ghost"
                            className="h-6 w-6 p-0 text-muted-foreground hover:text-destructive"
                            onClick={() => handleDeleteBudget(b.id)}
                          >
                            ×
                          </Button>
                        </div>
                      </div>
                      <div className="h-2.5 bg-muted rounded-full overflow-hidden mb-2">
                        <div
                          className={`h-full rounded-full transition-all ${
                            isOver ? 'bg-destructive' : isNear ? 'bg-amber-400' : 'bg-emerald-500'
                          }`}
                          style={{ width: `${Math.min(pct, 100)}%` }}
                        />
                      </div>
                      <div className="flex justify-between text-xs">
                        <span className={isOver ? 'text-destructive' : 'text-muted-foreground'}>
                          {isOver ? `⚠ Melebihi Rp ${(spent - budgetAmt).toLocaleString('id-ID')}` : `Terpakai Rp ${spent.toLocaleString('id-ID')}`}
                        </span>
                        <span className="text-muted-foreground">
                          {isOver ? '' : `Sisa Rp ${remaining.toLocaleString('id-ID')}`}
                        </span>
                      </div>
                    </div>
                  )
                })}
              </div>
            </div>
          )}
        </div>
      )}

      {/* Contribute modal */}
      {contributingGoal && (
        <ContributeModal
          goal={contributingGoal}
          businessId={businessId}
          goalContributionAsExpense={goalContributionAsExpense}
          onClose={() => { setContributingGoal(null); router.refresh() }}
        />
      )}
    </div>
  )
}
