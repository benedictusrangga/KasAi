'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { createGoal, deleteGoal, upsertBudget, deleteBudget } from '@/app/actions/goals'

const CATEGORY_LABELS: Record<string, string> = {
  groceries: 'Bahan Makanan',
  transportation: 'Transportasi',
  utilities: 'Utilitas',
  entertainment: 'Hiburan',
  dining: 'Makan & Minum',
  shopping: 'Belanja',
  healthcare: 'Kesehatan',
  education: 'Pendidikan',
  office_supplies: 'Perlengkapan Kantor',
  other: 'Lainnya',
}

const CATEGORIES = Object.entries(CATEGORY_LABELS)

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

export function GoalsPanel({
  businessId,
  businessName,
  goals,
  budgets,
  spendingByCategory,
}: {
  businessId: string
  businessName: string
  goals: Goal[]
  budgets: Budget[]
  spendingByCategory: Record<string, number>
}) {
  const router = useRouter()
  const [activeTab, setActiveTab] = useState<'goals' | 'budget'>('goals')
  const [isSaving, setIsSaving] = useState(false)
  const [status, setStatus] = useState<{ type: 'success' | 'error'; msg: string } | null>(null)

  // Goal form
  const [newGoal, setNewGoal] = useState({ title: '', description: '', targetAmount: '', deadline: '' })

  // Budget form
  const [budgetValues, setBudgetValues] = useState<Record<string, string>>(
    Object.fromEntries(budgets.map((b) => [b.category, b.amount]))
  )

  const showStatus = (type: 'success' | 'error', msg: string) => {
    setStatus({ type, msg })
    setTimeout(() => setStatus(null), 3000)
  }

  const handleCreateGoal = async () => {
    if (!newGoal.title.trim() || !newGoal.targetAmount) {
      showStatus('error', 'Judul dan target wajib diisi.')
      return
    }
    setIsSaving(true)
    try {
      await createGoal({
        businessId,
        title: newGoal.title,
        description: newGoal.description || undefined,
        targetAmount: parseFloat(newGoal.targetAmount),
        deadline: newGoal.deadline ? new Date(newGoal.deadline) : undefined,
      })
      setNewGoal({ title: '', description: '', targetAmount: '', deadline: '' })
      showStatus('success', 'Goal berhasil ditambahkan.')
      router.refresh()
    } catch {
      showStatus('error', 'Gagal menambahkan goal.')
    } finally {
      setIsSaving(false)
    }
  }

  const handleDeleteGoal = async (goalId: string) => {
    if (!confirm('Hapus goal ini?')) return
    setIsSaving(true)
    try {
      await deleteGoal(goalId)
      showStatus('success', 'Goal dihapus.')
      router.refresh()
    } catch {
      showStatus('error', 'Gagal menghapus goal.')
    } finally {
      setIsSaving(false)
    }
  }

  const handleSaveBudget = async (category: string) => {
    const amount = parseFloat(budgetValues[category] || '0')
    if (!amount || amount <= 0) {
      showStatus('error', 'Masukkan jumlah budget yang valid.')
      return
    }
    setIsSaving(true)
    try {
      await upsertBudget({ businessId, category, amount })
      showStatus('success', `Budget ${CATEGORY_LABELS[category]} disimpan.`)
      router.refresh()
    } catch {
      showStatus('error', 'Gagal menyimpan budget.')
    } finally {
      setIsSaving(false)
    }
  }

  const handleDeleteBudget = async (budgetId: string) => {
    setIsSaving(true)
    try {
      await deleteBudget(budgetId)
      showStatus('success', 'Budget dihapus.')
      router.refresh()
    } catch {
      showStatus('error', 'Gagal menghapus budget.')
    } finally {
      setIsSaving(false)
    }
  }

  return (
    <div>
      {/* Status toast */}
      {status && (
        <div className={`fixed top-4 right-4 z-50 rounded-xl border px-5 py-3 text-sm font-medium shadow-lg ${
          status.type === 'success'
            ? 'border-emerald-200 bg-emerald-50 text-emerald-800'
            : 'border-destructive/20 bg-destructive/10 text-destructive'
        }`}>
          {status.type === 'success' ? '✓ ' : '✕ '}{status.msg}
        </div>
      )}

      {/* Tabs */}
      <div className="flex gap-1 border-b border-border mb-8">
        {[
          { id: 'goals', label: '🎯 Target Keuangan' },
          { id: 'budget', label: '💰 Budget Bulanan' },
        ].map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id as any)}
            className={`px-4 py-2.5 text-sm font-medium whitespace-nowrap transition-colors border-b-2 -mb-px ${
              activeTab === tab.id
                ? 'border-primary text-primary'
                : 'border-transparent text-muted-foreground hover:text-foreground'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Goals Tab */}
      {activeTab === 'goals' && (
        <div className="space-y-6">
          {/* Add goal form */}
          <div className="rounded-2xl border border-border bg-card p-6">
            <h3 className="font-semibold text-foreground mb-4">Tambah Target Baru</h3>
            <div className="grid sm:grid-cols-2 gap-4 mb-4">
              <div className="space-y-1.5">
                <Label>Judul Target *</Label>
                <Input
                  placeholder="Contoh: Beli mesin kopi baru"
                  value={newGoal.title}
                  onChange={(e) => setNewGoal({ ...newGoal, title: e.target.value })}
                  className="h-10"
                />
              </div>
              <div className="space-y-1.5">
                <Label>Target Jumlah (Rp) *</Label>
                <Input
                  type="number"
                  placeholder="5000000"
                  value={newGoal.targetAmount}
                  onChange={(e) => setNewGoal({ ...newGoal, targetAmount: e.target.value })}
                  className="h-10"
                />
              </div>
              <div className="space-y-1.5">
                <Label>Deskripsi (opsional)</Label>
                <Input
                  placeholder="Kenapa target ini penting?"
                  value={newGoal.description}
                  onChange={(e) => setNewGoal({ ...newGoal, description: e.target.value })}
                  className="h-10"
                />
              </div>
              <div className="space-y-1.5">
                <Label>Deadline (opsional)</Label>
                <Input
                  type="date"
                  value={newGoal.deadline}
                  onChange={(e) => setNewGoal({ ...newGoal, deadline: e.target.value })}
                  className="h-10"
                />
              </div>
            </div>
            <Button onClick={handleCreateGoal} disabled={isSaving} size="sm">
              + Tambah Target
            </Button>
          </div>

          {/* Goals list */}
          {goals.length === 0 ? (
            <div className="rounded-2xl border-2 border-dashed border-border p-12 text-center">
              <div className="text-4xl mb-3">🎯</div>
              <p className="text-foreground font-medium mb-1">Belum ada target keuangan</p>
              <p className="text-muted-foreground text-sm">
                Tambahkan target di atas — AI akan membantu Anda mencapainya
              </p>
            </div>
          ) : (
            <div className="grid sm:grid-cols-2 gap-4">
              {goals.map((g) => {
                const progress = Math.min((parseFloat(g.currentAmount) / parseFloat(g.targetAmount)) * 100, 100)
                const remaining = parseFloat(g.targetAmount) - parseFloat(g.currentAmount)
                return (
                  <div key={g.id} className={`rounded-2xl border bg-card p-5 ${g.completed ? 'border-emerald-200 bg-emerald-50/30' : 'border-border'}`}>
                    <div className="flex items-start justify-between mb-3">
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="text-lg">{g.completed ? '✅' : '🎯'}</span>
                          <h4 className="font-semibold text-foreground">{g.title}</h4>
                        </div>
                        {g.description && (
                          <p className="text-xs text-muted-foreground mt-0.5 ml-7">{g.description}</p>
                        )}
                      </div>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleDeleteGoal(g.id)}
                        className="text-destructive hover:text-destructive h-7 text-xs shrink-0"
                      >
                        Hapus
                      </Button>
                    </div>

                    {/* Progress bar */}
                    <div className="mb-2">
                      <div className="flex justify-between text-xs text-muted-foreground mb-1">
                        <span>Rp {parseFloat(g.currentAmount).toLocaleString('id-ID')}</span>
                        <span>Rp {parseFloat(g.targetAmount).toLocaleString('id-ID')}</span>
                      </div>
                      <div className="h-2 bg-muted rounded-full overflow-hidden">
                        <div
                          className={`h-full rounded-full transition-all ${g.completed ? 'bg-emerald-500' : 'bg-primary'}`}
                          style={{ width: `${progress}%` }}
                        />
                      </div>
                      <div className="flex justify-between mt-1">
                        <span className="text-xs font-medium text-primary">{progress.toFixed(0)}%</span>
                        {!g.completed && (
                          <span className="text-xs text-muted-foreground">
                            Kurang Rp {remaining.toLocaleString('id-ID')}
                          </span>
                        )}
                      </div>
                    </div>

                    {g.deadline && (
                      <p className="text-xs text-muted-foreground">
                        📅 Deadline: {new Date(g.deadline).toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' })}
                      </p>
                    )}
                  </div>
                )
              })}
            </div>
          )}
        </div>
      )}

      {/* Budget Tab */}
      {activeTab === 'budget' && (
        <div className="space-y-6">
          <div className="rounded-2xl border border-primary/20 bg-primary/5 p-4">
            <p className="text-sm text-foreground">
              💡 <strong>Cara kerja budget:</strong> Tetapkan batas pengeluaran per kategori setiap bulan.
              AI akan memperingatkan Anda jika mendekati atau melebihi budget.
            </p>
          </div>

          <div className="rounded-2xl border border-border bg-card overflow-hidden">
            <div className="px-6 py-4 border-b border-border">
              <h3 className="font-semibold text-foreground">Budget per Kategori (Bulanan)</h3>
              <p className="text-xs text-muted-foreground mt-0.5">Kosongkan untuk tidak ada batas</p>
            </div>
            <div className="divide-y divide-border">
              {CATEGORIES.map(([catKey, catLabel]) => {
                const existingBudget = budgets.find((b) => b.category === catKey)
                const spent = spendingByCategory[catKey] || 0
                const budgetAmount = parseFloat(budgetValues[catKey] || existingBudget?.amount || '0')
                const percentage = budgetAmount > 0 ? (spent / budgetAmount) * 100 : 0
                const isOver = percentage > 100
                const isWarning = percentage > 80 && !isOver

                return (
                  <div key={catKey} className="px-6 py-4">
                    <div className="flex items-center gap-4">
                      <div className="flex-1">
                        <div className="flex items-center justify-between mb-1">
                          <span className="text-sm font-medium text-foreground">{catLabel}</span>
                          <div className="flex items-center gap-2">
                            {isOver && <span className="text-xs text-rose-500 font-medium">⚠️ Melebihi budget</span>}
                            {isWarning && <span className="text-xs text-amber-500 font-medium">⚡ Hampir habis</span>}
                            <span className="text-xs text-muted-foreground">
                              Bulan ini: Rp {spent.toLocaleString('id-ID')}
                            </span>
                          </div>
                        </div>
                        {budgetAmount > 0 && (
                          <div className="h-1.5 bg-muted rounded-full overflow-hidden mb-2">
                            <div
                              className={`h-full rounded-full transition-all ${isOver ? 'bg-rose-500' : isWarning ? 'bg-amber-400' : 'bg-emerald-500'}`}
                              style={{ width: `${Math.min(percentage, 100)}%` }}
                            />
                          </div>
                        )}
                      </div>
                      <div className="flex items-center gap-2 shrink-0">
                        <div className="relative">
                          <span className="absolute left-3 top-1/2 -translate-y-1/2 text-xs text-muted-foreground">Rp</span>
                          <Input
                            type="number"
                            placeholder="0"
                            value={budgetValues[catKey] || ''}
                            onChange={(e) => setBudgetValues({ ...budgetValues, [catKey]: e.target.value })}
                            className="h-9 w-36 pl-8 text-sm"
                          />
                        </div>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => handleSaveBudget(catKey)}
                          disabled={isSaving}
                          className="h-9 text-xs"
                        >
                          Simpan
                        </Button>
                        {existingBudget && (
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => handleDeleteBudget(existingBudget.id)}
                            disabled={isSaving}
                            className="h-9 text-xs text-destructive hover:text-destructive"
                          >
                            ×
                          </Button>
                        )}
                      </div>
                    </div>
                  </div>
                )
              })}
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
