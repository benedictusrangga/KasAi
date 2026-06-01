'use client'

import { useState, useEffect, useTransition } from 'react'
import {
  inviteMember,
  getBusinessMembers,
  updateMemberRole,
  removeMember,
  resendInvite,
} from '@/app/actions/members'
import { getPlan } from '@/lib/plan-limits'

interface Member {
  id: string
  email: string
  role: string
  status: string
  inviteToken: string | null
  invitedAt: Date
  joinedAt: Date | null
  user: {
    id: string
    name: string | null
    email: string
    image: string | null
    telegramId: string | null
  } | null
}

interface MembersPanelProps {
  businessId: string
  businessName: string
  isOwner: boolean
  ownerPlan: string
}

export default function MembersPanel({
  businessId,
  businessName,
  isOwner,
  ownerPlan,
}: MembersPanelProps) {
  const [members, setMembers] = useState<Member[]>([])
  const [loading, setLoading] = useState(true)
  const [inviteEmail, setInviteEmail] = useState('')
  const [inviteRole, setInviteRole] = useState<'admin' | 'viewer'>('admin')
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')
  const [isPending, startTransition] = useTransition()

  const plan = getPlan(ownerPlan)
  const maxMembers = plan.maxMembers
  const activeMembers = members.filter((m) => m.status !== 'removed')

  useEffect(() => {
    getBusinessMembers(businessId)
      .then((data) => setMembers(data as Member[]))
      .catch(() => setMembers([]))
      .finally(() => setLoading(false))
  }, [businessId])

  function handleInvite(e: React.FormEvent) {
    e.preventDefault()
    setError('')
    setSuccess('')

    startTransition(async () => {
      try {
        const result = await inviteMember(businessId, inviteEmail, inviteRole)
        setSuccess(
          result.alreadyRegistered
            ? `✅ ${inviteEmail} langsung ditambahkan sebagai ${inviteRole === 'admin' ? 'Admin' : 'Viewer'}.`
            : `✅ Undangan dikirim ke ${inviteEmail}. Bagikan link berikut: ${window.location.origin}/invite/${result.inviteToken}`
        )
        setInviteEmail('')
        // Refresh list
        const updated = await getBusinessMembers(businessId)
        setMembers(updated as Member[])
      } catch (err: any) {
        const msg: string = err.message || 'Gagal mengirim undangan'
        if (msg.startsWith('UPGRADE_REQUIRED:')) {
          setError(msg.replace('UPGRADE_REQUIRED:', ''))
        } else if (msg.startsWith('LIMIT_REACHED:')) {
          setError(msg.replace('LIMIT_REACHED:', ''))
        } else {
          setError(msg)
        }
      }
    })
  }

  async function handleRoleChange(memberId: string, newRole: 'admin' | 'viewer') {
    try {
      await updateMemberRole(memberId, newRole)
      setMembers((prev) =>
        prev.map((m) => (m.id === memberId ? { ...m, role: newRole } : m))
      )
    } catch (err: any) {
      setError(err.message)
    }
  }

  async function handleRemove(memberId: string) {
    if (!confirm('Hapus anggota ini dari bisnis?')) return
    try {
      await removeMember(memberId)
      setMembers((prev) => prev.filter((m) => m.id !== memberId))
    } catch (err: any) {
      setError(err.message)
    }
  }

  async function handleResend(memberId: string) {
    try {
      const result = await resendInvite(memberId)
      setSuccess(
        `✅ Link undangan baru: ${window.location.origin}/invite/${result.inviteToken}`
      )
    } catch (err: any) {
      setError(err.message)
    }
  }

  const roleLabel = (role: string) => {
    if (role === 'owner') return { label: 'Pemilik', color: 'bg-purple-100 text-purple-700' }
    if (role === 'admin') return { label: 'Admin', color: 'bg-blue-100 text-blue-700' }
    return { label: 'Viewer', color: 'bg-gray-100 text-gray-600' }
  }

  const statusLabel = (status: string) => {
    if (status === 'active') return { label: 'Aktif', color: 'text-green-600' }
    if (status === 'pending') return { label: 'Menunggu', color: 'text-yellow-600' }
    return { label: 'Dihapus', color: 'text-red-500' }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600" />
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h3 className="text-lg font-semibold text-gray-900">Anggota Tim</h3>
        <p className="text-sm text-gray-500 mt-1">
          {businessName} ·{' '}
          {maxMembers === Infinity
            ? `${activeMembers.length} anggota (tak terbatas)`
            : `${activeMembers.length} / ${maxMembers} anggota`}
        </p>
      </div>

      {/* Invite form — hanya owner */}
      {isOwner && plan.multiUser && (
        <form onSubmit={handleInvite} className="bg-gray-50 rounded-xl p-4 space-y-3">
          <p className="text-sm font-medium text-gray-700">Undang Anggota Baru</p>
          <div className="flex gap-2">
            <input
              type="email"
              value={inviteEmail}
              onChange={(e) => setInviteEmail(e.target.value)}
              placeholder="email@contoh.com"
              required
              className="flex-1 px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
            <select
              value={inviteRole}
              onChange={(e) => setInviteRole(e.target.value as 'admin' | 'viewer')}
              className="px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="admin">Admin</option>
              <option value="viewer">Viewer</option>
            </select>
            <button
              type="submit"
              disabled={isPending}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700 disabled:opacity-50 transition-colors"
            >
              {isPending ? '...' : 'Undang'}
            </button>
          </div>
          <div className="text-xs text-gray-500 space-y-0.5">
            <p>• <strong>Admin</strong>: bisa input transaksi via dashboard & Telegram</p>
            <p>• <strong>Viewer</strong>: hanya bisa lihat laporan (khusus Enterprise)</p>
          </div>
        </form>
      )}

      {!plan.multiUser && isOwner && (
        <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 text-sm text-amber-800">
          <p className="font-medium mb-1">🔒 Fitur Multi-User</p>
          <p>Upgrade ke <strong>Business Pro</strong> untuk mengundang hingga 3 admin, atau <strong>Business Enterprise</strong> untuk anggota tak terbatas.</p>
        </div>
      )}

      {/* Error / Success */}
      {error && (
        <div className="bg-red-50 border border-red-200 rounded-xl p-3 text-sm text-red-700">
          {error}
        </div>
      )}
      {success && (
        <div className="bg-green-50 border border-green-200 rounded-xl p-3 text-sm text-green-700 break-all">
          {success}
        </div>
      )}

      {/* Member list */}
      <div className="space-y-2">
        {activeMembers.length === 0 ? (
          <p className="text-sm text-gray-500 text-center py-4">
            Belum ada anggota. Undang admin atau viewer untuk berkolaborasi.
          </p>
        ) : (
          activeMembers.map((member) => {
            const rl = roleLabel(member.role)
            const sl = statusLabel(member.status)
            const displayName = member.user?.name || member.email
            const hasTelegram = !!member.user?.telegramId

            return (
              <div
                key={member.id}
                className="flex items-center justify-between bg-white border border-gray-100 rounded-xl px-4 py-3"
              >
                <div className="flex items-center gap-3 min-w-0">
                  {/* Avatar */}
                  <div className="w-9 h-9 rounded-full bg-gradient-to-br from-blue-400 to-purple-500 flex items-center justify-center text-white text-sm font-bold flex-shrink-0">
                    {displayName.charAt(0).toUpperCase()}
                  </div>
                  <div className="min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="text-sm font-medium text-gray-900 truncate">
                        {displayName}
                      </span>
                      <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${rl.color}`}>
                        {rl.label}
                      </span>
                      {hasTelegram && (
                        <span className="text-xs px-2 py-0.5 rounded-full bg-sky-100 text-sky-700">
                          📱 Telegram
                        </span>
                      )}
                    </div>
                    <div className="flex items-center gap-2 mt-0.5">
                      <span className="text-xs text-gray-400 truncate">{member.email}</span>
                      <span className={`text-xs font-medium ${sl.color}`}>· {sl.label}</span>
                    </div>
                  </div>
                </div>

                {/* Actions — hanya owner */}
                {isOwner && member.role !== 'owner' && (
                  <div className="flex items-center gap-2 flex-shrink-0 ml-2">
                    {member.status === 'pending' && (
                      <button
                        onClick={() => handleResend(member.id)}
                        className="text-xs text-blue-600 hover:underline"
                      >
                        Kirim ulang
                      </button>
                    )}
                    {member.status === 'active' && (
                      <select
                        value={member.role}
                        onChange={(e) => handleRoleChange(member.id, e.target.value as 'admin' | 'viewer')}
                        className="text-xs border border-gray-200 rounded-lg px-2 py-1 focus:outline-none"
                      >
                        <option value="admin">Admin</option>
                        <option value="viewer">Viewer</option>
                      </select>
                    )}
                    <button
                      onClick={() => handleRemove(member.id)}
                      className="text-xs text-red-500 hover:text-red-700 hover:underline"
                    >
                      Hapus
                    </button>
                  </div>
                )}
              </div>
            )
          })
        )}
      </div>
    </div>
  )
}
