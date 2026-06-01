'use server'

import { auth } from '@/lib/auth'
import { db } from '@/lib/db'
import { business, businessMember, user } from '@/lib/db/schema'
import { and, eq, count, ne } from 'drizzle-orm'
import { headers, cookies } from 'next/headers'
import { revalidatePath } from 'next/cache'
import { nanoid } from 'nanoid'
import { getPlan, canAddMember } from '@/lib/plan-limits'

async function getUserId() {
  const h = await headers()
  const c = await cookies()
  const cookieString = c.getAll().map((ck) => `${ck.name}=${ck.value}`).join('; ')
  const reqHeaders = new Headers(h as any)
  if (cookieString) reqHeaders.set('cookie', cookieString)
  const session = await auth.api.getSession({ headers: reqHeaders })
  if (!session?.user) throw new Error('Unauthorized')
  return session.user.id
}

/**
 * Cek apakah user punya akses ke bisnis (sebagai owner atau member aktif)
 * Return role jika punya akses, throw jika tidak
 */
export async function getBusinessAccess(
  businessId: string,
  userId: string
): Promise<{ role: 'owner' | 'admin' | 'viewer'; isOwner: boolean }> {
  // Cek apakah owner
  const biz = await db.query.business.findFirst({
    where: eq(business.id, businessId),
  })
  if (!biz) throw new Error('Business not found')

  if (biz.userId === userId) {
    return { role: 'owner', isOwner: true }
  }

  // Cek apakah member aktif
  const member = await db.query.businessMember.findFirst({
    where: and(
      eq(businessMember.businessId, businessId),
      eq(businessMember.userId, userId),
      eq(businessMember.status, 'active')
    ),
  })

  if (!member) throw new Error('Access denied')
  return { role: member.role as 'admin' | 'viewer', isOwner: false }
}

/**
 * Invite member baru ke bisnis
 */
export async function inviteMember(
  businessId: string,
  email: string,
  role: 'admin' | 'viewer' = 'admin'
) {
  const userId = await getUserId()

  // Hanya owner yang bisa invite
  const biz = await db.query.business.findFirst({
    where: and(eq(business.id, businessId), eq(business.userId, userId)),
  })
  if (!biz) throw new Error('Hanya pemilik bisnis yang dapat mengundang anggota')

  // Cek plan limit
  const currentUser = await db.query.user.findFirst({ where: eq(user.id, userId) })
  const plan = getPlan(currentUser?.plan)

  if (!plan.multiUser) {
    throw new Error(
      'UPGRADE_REQUIRED:Fitur multi-user hanya tersedia untuk plan Business Pro dan Enterprise. Upgrade plan Anda untuk mengundang anggota tim.'
    )
  }

  // Hitung member aktif + pending (tidak termasuk owner)
  const [{ value: memberCount }] = await db
    .select({ value: count() })
    .from(businessMember)
    .where(
      and(
        eq(businessMember.businessId, businessId),
        ne(businessMember.status, 'removed')
      )
    )

  if (!canAddMember(memberCount, currentUser?.plan)) {
    throw new Error(
      `LIMIT_REACHED:Batas ${plan.maxMembers} anggota untuk plan ${plan.name} sudah tercapai. Upgrade ke Business Enterprise untuk anggota tak terbatas.`
    )
  }

  // Cek apakah email sudah diundang / sudah jadi member
  const existing = await db.query.businessMember.findFirst({
    where: and(
      eq(businessMember.businessId, businessId),
      eq(businessMember.email, email.toLowerCase()),
      ne(businessMember.status, 'removed')
    ),
  })
  if (existing) {
    throw new Error('Email ini sudah diundang atau sudah menjadi anggota bisnis ini')
  }

  // Cek apakah email adalah owner sendiri
  if (currentUser?.email?.toLowerCase() === email.toLowerCase()) {
    throw new Error('Anda tidak dapat mengundang diri sendiri')
  }

  // Cek apakah user dengan email ini sudah ada di sistem
  const invitedUser = await db.query.user.findFirst({
    where: eq(user.email, email.toLowerCase()),
  })

  const inviteToken = nanoid(32)
  const id = nanoid()

  await db.insert(businessMember).values({
    id,
    businessId,
    userId: invitedUser?.id ?? null, // link langsung jika user sudah ada
    invitedByUserId: userId,
    email: email.toLowerCase(),
    role,
    status: invitedUser ? 'active' : 'pending', // langsung aktif jika user sudah ada
    inviteToken,
    invitedAt: new Date(),
    joinedAt: invitedUser ? new Date() : null,
  })

  revalidatePath(`/dashboard/${businessId}/settings`)

  return {
    id,
    email,
    role,
    inviteToken,
    alreadyRegistered: !!invitedUser,
    businessName: biz.name,
  }
}

/**
 * Accept invite via token (dipanggil saat user klik link invite)
 */
export async function acceptInvite(token: string) {
  const userId = await getUserId()

  const currentUser = await db.query.user.findFirst({ where: eq(user.id, userId) })
  if (!currentUser) throw new Error('User not found')

  const invite = await db.query.businessMember.findFirst({
    where: and(
      eq(businessMember.inviteToken, token),
      eq(businessMember.status, 'pending')
    ),
  })

  if (!invite) throw new Error('Undangan tidak ditemukan atau sudah kadaluarsa')

  // Validasi email cocok
  if (invite.email !== currentUser.email?.toLowerCase()) {
    throw new Error('Undangan ini bukan untuk akun Anda')
  }

  await db
    .update(businessMember)
    .set({
      userId,
      status: 'active',
      joinedAt: new Date(),
      inviteToken: null, // hapus token setelah dipakai
      updatedAt: new Date(),
    })
    .where(eq(businessMember.id, invite.id))

  revalidatePath('/dashboard')
  return { businessId: invite.businessId }
}

/**
 * Ambil semua member bisnis (hanya owner yang bisa lihat)
 */
export async function getBusinessMembers(businessId: string) {
  const userId = await getUserId()

  // Verifikasi akses (owner atau member)
  await getBusinessAccess(businessId, userId)

  const members = await db.query.businessMember.findMany({
    where: and(
      eq(businessMember.businessId, businessId),
      ne(businessMember.status, 'removed')
    ),
    with: {
      user: {
        columns: { id: true, name: true, email: true, image: true, telegramId: true },
      },
    },
    orderBy: (m, { asc }) => [asc(m.invitedAt)],
  })

  return members
}

/**
 * Update role member
 */
export async function updateMemberRole(
  memberId: string,
  newRole: 'admin' | 'viewer'
) {
  const userId = await getUserId()

  const member = await db.query.businessMember.findFirst({
    where: eq(businessMember.id, memberId),
  })
  if (!member) throw new Error('Member tidak ditemukan')

  // Hanya owner yang bisa update role
  const biz = await db.query.business.findFirst({
    where: and(eq(business.id, member.businessId), eq(business.userId, userId)),
  })
  if (!biz) throw new Error('Hanya pemilik bisnis yang dapat mengubah role anggota')

  await db
    .update(businessMember)
    .set({ role: newRole, updatedAt: new Date() })
    .where(eq(businessMember.id, memberId))

  revalidatePath(`/dashboard/${member.businessId}/settings`)
  return { memberId, newRole }
}

/**
 * Remove member dari bisnis
 */
export async function removeMember(memberId: string) {
  const userId = await getUserId()

  const member = await db.query.businessMember.findFirst({
    where: eq(businessMember.id, memberId),
  })
  if (!member) throw new Error('Member tidak ditemukan')

  // Owner bisa remove siapa saja, member bisa remove diri sendiri
  const biz = await db.query.business.findFirst({
    where: eq(business.id, member.businessId),
  })
  const isOwner = biz?.userId === userId
  const isSelf = member.userId === userId

  if (!isOwner && !isSelf) {
    throw new Error('Tidak memiliki izin untuk menghapus anggota ini')
  }

  await db
    .update(businessMember)
    .set({ status: 'removed', updatedAt: new Date() })
    .where(eq(businessMember.id, memberId))

  revalidatePath(`/dashboard/${member.businessId}/settings`)
  return { memberId, businessId: member.businessId }
}

/**
 * Ambil semua bisnis yang bisa diakses user (sebagai owner ATAU member aktif)
 */
export async function getAccessibleBusinesses() {
  const userId = await getUserId()

  // Bisnis yang dimiliki
  const ownedBusinesses = await db.query.business.findMany({
    where: eq(business.userId, userId),
  })

  // Bisnis yang jadi member aktif
  const memberships = await db.query.businessMember.findMany({
    where: and(
      eq(businessMember.userId, userId),
      eq(businessMember.status, 'active')
    ),
    with: {
      business: true,
    },
  })

  const memberBusinesses = memberships.map((m) => ({
    ...m.business,
    _memberRole: m.role,
    _isOwner: false,
  }))

  const owned = ownedBusinesses.map((b) => ({
    ...b,
    _memberRole: 'owner' as const,
    _isOwner: true,
  }))

  return [...owned, ...memberBusinesses]
}

/**
 * Resend invite (generate token baru)
 */
export async function resendInvite(memberId: string) {
  const userId = await getUserId()

  const member = await db.query.businessMember.findFirst({
    where: and(eq(businessMember.id, memberId), eq(businessMember.status, 'pending')),
  })
  if (!member) throw new Error('Undangan tidak ditemukan atau sudah diterima')

  // Hanya owner yang bisa resend
  const biz = await db.query.business.findFirst({
    where: and(eq(business.id, member.businessId), eq(business.userId, userId)),
  })
  if (!biz) throw new Error('Hanya pemilik bisnis yang dapat mengirim ulang undangan')

  const newToken = nanoid(32)
  await db
    .update(businessMember)
    .set({ inviteToken: newToken, invitedAt: new Date(), updatedAt: new Date() })
    .where(eq(businessMember.id, memberId))

  return { memberId, inviteToken: newToken, businessName: biz.name, email: member.email }
}
