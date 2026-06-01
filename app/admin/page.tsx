'use client'

import { useEffect, useState, useMemo } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { PLANS, PLAN_GROUPS, type PlanId } from '@/lib/plan-limits'
import { KasAILogo } from '@/components/logo'

type UserRow = {
  id: string
  name: string | null
  email: string
  accountType: string | null
  plan: string
  planName: string
  planExpiresAt: string | null
  phoneNumber: string | null
  telegramId: string | null
  emailVerified: boolean
  createdAt: string
  businessCount: number
  totalTransactions: number
  txThisMonth: number
  txLimit: number | null
  usagePct: number
}

const PLAN_OPTIONS = [
  { value: 'free',                  label: 'Free',                  group: 'Free' },
  { value: 'personal_starter',      label: 'Personal Starter',      group: 'Personal' },
  { value: 'personal_pro',          label: 'Personal Pro',          group: 'Personal' },
  { value: 'personal_max',          label: 'Personal Max',          group: 'Personal' },
  { value: 'personal_unlimited',    label: 'Personal Unlimited',    group: 'Personal' },
  { value: 'business_starter',      label: 'Business Starter',      group: 'Business' },
  { value: 'business_pro',          label: 'Business Pro',          group: 'Business' },
  { value: 'business_enterprise',   label: 'Business Enterprise',   group: 'Business' },
]

function planBadgeColor(plan: string) {
  if (plan === 'free') return 'bg-gray-100 text-gray-600 border-gray-200'
  if (plan.startsWith('personal_')) return 'bg-blue-50 text-blue-700 border-blue-200'
  return 'bg-purple-50 text-purple-700 border-purple-200'
}

function usageBadgeColor(pct: number) {
  if (pct >= 100) return 'text-red-600'
  if (pct >= 80) return 'text-amber-600'
  return 'text-emerald-600'
}

export default function AdminPage() {
  const [secret, setSecret] = useState('')
  const [authed, setAuthed] = useState(false)
  const [users, setUsers] = useState<UserRow[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [search, setSearch] = useState('')
  const [filterPlan, setFilterPlan] = useState('all')
  const [sortBy, setSortBy] = useState<'createdAt' | 'txThisMonth' | 'totalTransactions'>('createdAt')
  const [editingUser, setEditingUser] = useState<UserRow | null>(null)
  const [editPlan, setEditPlan] = useState('')
  const [editExpiry, setEditExpiry] = useState('')
  const [saving, setSaving] = useState(false)
  const [deleting, setDeleting] = useState<string | null>(null)
  const [createForm, setCreateForm] = useState({ email: '', name: '', plan: 'free' })
  const [creating, setCreating] = useState(false)
  const [inviteLink, setInviteLink] = useState('')
  const [activeTab, setActiveTab] = useState<'users' | 'stats'>('users')

  const fetchUsers = async (s: string) => {
    setLoading(true)
    setError('')
    try {
      const res = await fetch('/api/admin/users', { headers: { 'x-admin-secret': s } })
      if (!res.ok) throw new Error('Unauthorized')
      setUsers(await res.json())
      setAuthed(true)
    } catch {
      setError('Secret salah atau tidak bisa terhubung.')
      setAuthed(false)
    } finally {
      setLoading(false)
    }
  }

  const handleSavePlan = async () => {
    if (!editingUser) return
    setSaving(true)
    try {
      const res = await fetch('/api/admin/users', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json', 'x-admin-secret': secret },
        body: JSON.stringify({
          userId: editingUser.id,
          plan: editPlan,
          planExpiresAt: editExpiry || null,
        }),
      })
      if (!res.ok) throw new Error()
      const plan = PLANS[editPlan as PlanId]
      setUsers(prev => prev.map(u =>
        u.id === editingUser.id
          ? { ...u, plan: editPlan, planName: plan?.name ?? editPlan, planExpiresAt: editExpiry || null }
          : u
      ))
      setEditingUser(null)
    } catch {
      alert('Gagal menyimpan perubahan.')
    } finally {
      setSaving(false)
    }
  }

  const handleDelete = async (u: UserRow) => {
    if (!confirm(`Hapus user ${u.email}?\n\nSemua data bisnis dan transaksi akan terhapus permanen.`)) return
    setDeleting(u.id)
    try {
      const res = await fetch(`/api/admin/users?userId=${u.id}`, {
        method: 'DELETE',
        headers: { 'x-admin-secret': secret },
      })
      if (!res.ok) throw new Error()
      setUsers(prev => prev.filter(x => x.id !== u.id))
    } catch {
      alert('Gagal menghapus user.')
    } finally {
      setDeleting(null)
    }
  }

  const handleCreateUser = async (e: React.FormEvent) => {
    e.preventDefault()
    setCreating(true)
    setInviteLink('')
    try {
      const accountType = createForm.plan.startsWith('business_') ? 'business' : 'personal'
      const res = await fetch('/api/admin/create-user', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'x-admin-secret': secret },
        body: JSON.stringify({ ...createForm, accountType }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || 'Gagal')
      setInviteLink(data.inviteLink)
      setCreateForm({ email: '', name: '', plan: 'free' })
      fetchUsers(secret)
    } catch (err: any) {
      alert(err.message || 'Gagal membuat user.')
    } finally {
      setCreating(false)
    }
  }

  const filtered = useMemo(() => {
    let list = users.filter(u => {
      const matchSearch =
        u.email.toLowerCase().includes(search.toLowerCase()) ||
        (u.name || '').toLowerCase().includes(search.toLowerCase())
      const matchPlan = filterPlan === 'all' || u.plan === filterPlan ||
        (filterPlan === 'personal' && u.plan.startsWith('personal_')) ||
        (filterPlan === 'business' && u.plan.startsWith('business_'))
      return matchSearch && matchPlan
    })
    list = [...list].sort((a, b) => {
      if (sortBy === 'txThisMonth') return b.txThisMonth - a.txThisMonth
      if (sortBy === 'totalTransactions') return b.totalTransactions - a.totalTransactions
      return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
    })
    return list
  }, [users, search, filterPlan, sortBy])

  const stats = useMemo(() => ({
    total: users.length,
    free: users.filter(u => u.plan === 'free').length,
    personal: users.filter(u => u.plan.startsWith('personal_')).length,
    business: users.filter(u => u.plan.startsWith('business_')).length,
    withTelegram: users.filter(u => u.telegramId).length,
    totalTx: users.reduce((s, u) => s + u.totalTransactions, 0),
    txThisMonth: users.reduce((s, u) => s + u.txThisMonth, 0),
    atLimit: users.filter(u => u.usagePct >= 100).length,
    nearLimit: users.filter(u => u.usagePct >= 80 && u.usagePct < 100).length,
    estimatedMRR: users.reduce((s, u) => {
      const plan = PLANS[u.plan as PlanId]
      return s + (plan?.price ?? 0)
    }, 0),
  }), [users])

  if (!authed) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 to-slate-800 flex items-center justify-center p-6">
        <div className="w-full max-w-sm bg-white rounded-2xl shadow-2xl p-8">
          <div className="text-center mb-8">
            <div className="flex justify-center mb-4">
              <KasAILogo href="/" size="lg" dark={false} />
            </div>
            <h1 className="text-2xl font-bold text-gray-900">KasAI Admin</h1>
            <p className="text-gray-500 text-sm mt-1">Masukkan admin secret untuk lanjut</p>
          </div>
          <form onSubmit={e => { e.preventDefault(); fetchUsers(secret) }} className="space-y-4">
            <Input
              type="password"
              placeholder="Admin secret..."
              value={secret}
              onChange={e => setSecret(e.target.value)}
              className="h-11"
              autoFocus
            />
            {error && (
              <div className="rounded-lg bg-red-50 border border-red-200 px-4 py-2.5 text-sm text-red-700">
                {error}
              </div>
            )}
            <Button type="submit" className="w-full h-11 text-base" disabled={loading || !secret}>
              {loading ? 'Memuat...' : 'Masuk ke Admin Panel'}
            </Button>
          </form>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="sticky top-0 z-20 bg-white border-b border-gray-200 shadow-sm">
        <div className="max-w-7xl mx-auto flex h-14 items-center justify-between px-6">
          <div className="flex items-center gap-3">
            <KasAILogo href="/" size="sm" dark={false} />
            <span className="text-gray-300">|</span>
            <span className="text-sm font-medium text-gray-600">Admin Panel</span>
          </div>
          <div className="flex items-center gap-2">
            <Button variant="ghost" size="sm" onClick={() => fetchUsers(secret)} disabled={loading} className="text-gray-600">
              {loading ? '⏳' : '↻'} Refresh
            </Button>
            <Button variant="outline" size="sm" onClick={() => { setAuthed(false); setSecret('') }}>
              Keluar
            </Button>
          </div>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-6 py-8">

        {/* Stats overview */}
        <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-5 gap-4 mb-8">
          {[
            { label: 'Total User', value: stats.total, sub: 'terdaftar', color: 'text-gray-900', bg: 'bg-white' },
            { label: 'Free', value: stats.free, sub: 'pengguna', color: 'text-gray-600', bg: 'bg-white' },
            { label: 'Personal', value: stats.personal, sub: 'berbayar', color: 'text-blue-600', bg: 'bg-blue-50' },
            { label: 'Business', value: stats.business, sub: 'berbayar', color: 'text-purple-600', bg: 'bg-purple-50' },
            { label: 'Est. MRR', value: `Rp ${(stats.estimatedMRR / 1000).toFixed(0)}k`, sub: '/bulan', color: 'text-emerald-600', bg: 'bg-emerald-50' },
          ].map(s => (
            <div key={s.label} className={`rounded-xl border border-gray-200 ${s.bg} p-4`}>
              <p className="text-xs text-gray-500 mb-1">{s.label}</p>
              <p className={`text-2xl font-bold ${s.color}`}>{s.value}</p>
              <p className="text-xs text-gray-400 mt-0.5">{s.sub}</p>
            </div>
          ))}
        </div>

        {/* Alert: users at limit */}
        {stats.atLimit > 0 && (
          <div className="mb-6 rounded-xl bg-red-50 border border-red-200 px-5 py-3 flex items-center gap-3">
            <span className="text-xl">🚨</span>
            <p className="text-sm text-red-700">
              <span className="font-semibold">{stats.atLimit} user</span> sudah mencapai batas transaksi bulan ini.
              {stats.nearLimit > 0 && ` ${stats.nearLimit} user lainnya hampir mencapai batas.`}
            </p>
          </div>
        )}

        <div className="grid lg:grid-cols-3 gap-8">

          {/* ── USER LIST ── */}
          <div className="lg:col-span-2 space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-bold text-gray-900">Daftar User</h2>
              <span className="text-sm text-gray-500">{filtered.length} dari {users.length}</span>
            </div>

            {/* Filters */}
            <div className="flex flex-wrap gap-2">
              <Input
                placeholder="Cari email atau nama..."
                value={search}
                onChange={e => setSearch(e.target.value)}
                className="max-w-[220px] h-9 text-sm"
              />
              <select
                value={filterPlan}
                onChange={e => setFilterPlan(e.target.value)}
                className="h-9 px-3 text-sm border border-gray-200 rounded-lg bg-white text-gray-700 focus:outline-none focus:ring-2 focus:ring-primary/30"
              >
                <option value="all">Semua Plan</option>
                <option value="free">Free</option>
                <option value="personal">Personal (semua)</option>
                <option value="business">Business (semua)</option>
                {PLAN_OPTIONS.map(p => (
                  <option key={p.value} value={p.value}>{p.label}</option>
                ))}
              </select>
              <select
                value={sortBy}
                onChange={e => setSortBy(e.target.value as any)}
                className="h-9 px-3 text-sm border border-gray-200 rounded-lg bg-white text-gray-700 focus:outline-none focus:ring-2 focus:ring-primary/30"
              >
                <option value="createdAt">Terbaru daftar</option>
                <option value="txThisMonth">Transaksi bulan ini</option>
                <option value="totalTransactions">Total transaksi</option>
              </select>
            </div>

            {/* Table */}
            <div className="rounded-xl border border-gray-200 bg-white overflow-hidden shadow-sm">
              {filtered.length === 0 ? (
                <div className="p-12 text-center text-gray-400 text-sm">Tidak ada user ditemukan.</div>
              ) : (
                <div className="divide-y divide-gray-100">
                  {filtered.map(u => (
                    <div key={u.id} className="p-4 hover:bg-gray-50 transition-colors">
                      <div className="flex items-start justify-between gap-3">
                        <div className="min-w-0 flex-1">
                          {/* Name + badges */}
                          <div className="flex items-center gap-2 flex-wrap mb-1">
                            <p className="font-semibold text-gray-900 text-sm truncate">
                              {u.name || '(Tanpa nama)'}
                            </p>
                            <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium border ${planBadgeColor(u.plan)}`}>
                              {u.planName}
                            </span>
                            {u.telegramId && (
                              <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-emerald-50 text-emerald-700 border border-emerald-200">
                                💬 Telegram
                              </span>
                            )}
                            {!u.emailVerified && (
                              <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-amber-50 text-amber-700 border border-amber-200">
                                ⚠ Unverified
                              </span>
                            )}
                          </div>

                          <p className="text-xs text-gray-500 mb-2">{u.email}</p>

                          {/* Usage bar */}
                          {u.txLimit !== null && (
                            <div className="mb-2">
                              <div className="flex justify-between text-xs mb-1">
                                <span className="text-gray-500">Transaksi bulan ini</span>
                                <span className={`font-medium ${usageBadgeColor(u.usagePct)}`}>
                                  {u.txThisMonth} / {u.txLimit} ({u.usagePct}%)
                                </span>
                              </div>
                              <div className="h-1.5 bg-gray-100 rounded-full overflow-hidden">
                                <div
                                  className={`h-full rounded-full transition-all ${
                                    u.usagePct >= 100 ? 'bg-red-500' :
                                    u.usagePct >= 80 ? 'bg-amber-400' : 'bg-emerald-500'
                                  }`}
                                  style={{ width: `${u.usagePct}%` }}
                                />
                              </div>
                            </div>
                          )}

                          {/* Meta */}
                          <div className="flex flex-wrap gap-3 text-xs text-gray-400">
                            <span>🏪 {u.businessCount} bisnis</span>
                            <span>📊 {u.totalTransactions} total tx</span>
                            {u.txLimit === null && (
                              <span className="text-emerald-600">∞ unlimited</span>
                            )}
                            <span>🗓 {new Date(u.createdAt).toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' })}</span>
                            {u.planExpiresAt && (
                              <span className="text-amber-600">
                                ⏰ Exp: {new Date(u.planExpiresAt).toLocaleDateString('id-ID')}
                              </span>
                            )}
                          </div>
                        </div>

                        {/* Actions */}
                        <div className="flex gap-1.5 shrink-0">
                          <Button
                            size="sm"
                            variant="outline"
                            className="h-7 text-xs px-2.5"
                            onClick={() => {
                              setEditingUser(u)
                              setEditPlan(u.plan)
                              setEditExpiry(u.planExpiresAt ? u.planExpiresAt.slice(0, 10) : '')
                            }}
                          >
                            ✏️ Edit Plan
                          </Button>
                          <Button
                            size="sm"
                            variant="outline"
                            className="h-7 text-xs px-2 text-red-500 border-red-200 hover:bg-red-50"
                            onClick={() => handleDelete(u)}
                            disabled={deleting === u.id}
                          >
                            {deleting === u.id ? '...' : '🗑'}
                          </Button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* ── RIGHT PANEL ── */}
          <div className="space-y-6">

            {/* Edit plan modal (inline) */}
            {editingUser && (
              <div className="rounded-xl border-2 border-primary/30 bg-white p-5 shadow-lg">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="font-bold text-gray-900">✏️ Edit Plan User</h3>
                  <button onClick={() => setEditingUser(null)} className="text-gray-400 hover:text-gray-600 text-lg leading-none">×</button>
                </div>
                <p className="text-sm text-gray-600 mb-4 truncate">
                  <span className="font-medium">{editingUser.name || editingUser.email}</span>
                </p>
                <div className="space-y-3">
                  <div>
                    <label className="text-xs text-gray-500 mb-1 block">Plan</label>
                    <select
                      value={editPlan}
                      onChange={e => setEditPlan(e.target.value)}
                      className="w-full h-9 px-3 text-sm border border-gray-200 rounded-lg bg-white focus:outline-none focus:ring-2 focus:ring-primary/30"
                    >
                      {PLAN_OPTIONS.map(p => (
                        <option key={p.value} value={p.value}>{p.group} — {p.label}</option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="text-xs text-gray-500 mb-1 block">Berlaku sampai (opsional)</label>
                    <Input
                      type="date"
                      value={editExpiry}
                      onChange={e => setEditExpiry(e.target.value)}
                      className="h-9 text-sm"
                    />
                    <p className="text-xs text-gray-400 mt-1">Kosongkan = tidak ada batas waktu</p>
                  </div>
                  <div className="flex gap-2 pt-1">
                    <Button onClick={handleSavePlan} disabled={saving} className="flex-1 h-9 text-sm">
                      {saving ? 'Menyimpan...' : 'Simpan'}
                    </Button>
                    <Button variant="outline" onClick={() => setEditingUser(null)} className="h-9 text-sm px-4">
                      Batal
                    </Button>
                  </div>
                </div>
              </div>
            )}

            {/* Create user */}
            <div className="rounded-xl border border-gray-200 bg-white p-5 shadow-sm">
              <h3 className="font-bold text-gray-900 mb-4">➕ Buat User Baru</h3>
              <form onSubmit={handleCreateUser} className="space-y-3">
                <div>
                  <label className="text-xs text-gray-500 mb-1 block">Email *</label>
                  <Input
                    type="email"
                    placeholder="user@email.com"
                    value={createForm.email}
                    onChange={e => setCreateForm(p => ({ ...p, email: e.target.value }))}
                    required
                    className="h-9 text-sm"
                  />
                </div>
                <div>
                  <label className="text-xs text-gray-500 mb-1 block">Nama</label>
                  <Input
                    placeholder="Nama lengkap"
                    value={createForm.name}
                    onChange={e => setCreateForm(p => ({ ...p, name: e.target.value }))}
                    className="h-9 text-sm"
                  />
                </div>
                <div>
                  <label className="text-xs text-gray-500 mb-1 block">Plan</label>
                  <select
                    value={createForm.plan}
                    onChange={e => setCreateForm(p => ({ ...p, plan: e.target.value }))}
                    className="w-full h-9 px-3 text-sm border border-gray-200 rounded-lg bg-white focus:outline-none focus:ring-2 focus:ring-primary/30"
                  >
                    {PLAN_OPTIONS.map(p => (
                      <option key={p.value} value={p.value}>{p.group} — {p.label}</option>
                    ))}
                  </select>
                </div>
                <Button type="submit" className="w-full h-9 text-sm" disabled={creating}>
                  {creating ? 'Membuat...' : 'Buat & Generate Invite Link'}
                </Button>
              </form>

              {inviteLink && (
                <div className="mt-4 rounded-lg bg-emerald-50 border border-emerald-200 p-3">
                  <p className="text-xs font-semibold text-emerald-800 mb-2">✅ User berhasil dibuat!</p>
                  <p className="text-xs text-emerald-700 mb-2">Kirim link ini ke user untuk set password:</p>
                  <div className="flex gap-2">
                    <input
                      readOnly
                      value={inviteLink}
                      className="flex-1 text-xs bg-white border border-emerald-200 rounded px-2 py-1.5 text-emerald-900 truncate"
                    />
                    <button
                      onClick={() => { navigator.clipboard.writeText(inviteLink) }}
                      className="text-xs bg-emerald-600 text-white px-3 py-1.5 rounded hover:bg-emerald-700 shrink-0"
                    >
                      Copy
                    </button>
                  </div>
                </div>
              )}
            </div>

            {/* Plan reference */}
            <div className="rounded-xl border border-gray-200 bg-white p-5 shadow-sm">
              <h3 className="font-bold text-gray-900 mb-4">📋 Referensi Plan</h3>
              <div className="space-y-2 text-xs">
                {PLAN_OPTIONS.map(p => {
                  const plan = PLANS[p.value as PlanId]
                  return (
                    <div key={p.value} className={`rounded-lg px-3 py-2 border ${planBadgeColor(p.value)}`}>
                      <div className="flex justify-between items-center">
                        <span className="font-semibold">{plan.name}</span>
                        <span className="font-medium">{plan.priceLabel}{plan.period}</span>
                      </div>
                      <div className="text-gray-500 mt-0.5">
                        {plan.maxTxPerMonth === Infinity ? '∞ tx' : `${plan.maxTxPerMonth} tx`} ·{' '}
                        {plan.maxBusinesses === Infinity ? '∞ bisnis' : `${plan.maxBusinesses} bisnis`}
                      </div>
                    </div>
                  )
                })}
              </div>
            </div>

          </div>
        </div>
      </div>
    </div>
  )
}
