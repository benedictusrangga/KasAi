import { auth } from '@/lib/auth'
import { headers, cookies } from 'next/headers'
import { redirect } from 'next/navigation'
import { getBusiness, getBusinessCategories, getBusinessProducts, getCurrentUser } from '@/app/actions/business'
import { getTransactionCountThisMonth } from '@/app/actions/transaction'
import { getBusinessAccess } from '@/app/actions/members'
import { SettingsPanel } from '@/components/settings-panel'
import MembersPanel from '@/components/members-panel'

export const metadata = { title: 'Pengaturan — KasAI' }
export const dynamic = 'force-dynamic'

export default async function SettingsPage({ params }: { params: Promise<{ businessId: string }> }) {
  const { businessId } = await params
  const h = await headers()
  const c = await cookies()
  const cookieString = c.getAll().map((ck) => `${ck.name}=${ck.value}`).join('; ')
  const reqHeaders = new Headers(h as any)
  if (cookieString) reqHeaders.set('cookie', cookieString)
  const session = await auth.api.getSession({ headers: reqHeaders })
  if (!session?.user) redirect('/sign-in')

  try {
    const [biz, categories, products, user, txThisMonth, access] = await Promise.all([
      getBusiness(businessId),
      getBusinessCategories(businessId),
      getBusinessProducts(businessId),
      getCurrentUser(),
      getTransactionCountThisMonth(businessId).catch(() => 0),
      getBusinessAccess(businessId, session.user.id),
    ])

    return (
      <div className="p-6 lg:p-8 space-y-8">
        <div>
          <h1 className="text-2xl font-bold text-foreground tracking-tight">Pengaturan</h1>
          <p className="text-sm text-muted-foreground mt-0.5">
            Kelola profil, bisnis, kategori, integrasi Telegram, dan plan
          </p>
        </div>

        <SettingsPanel
          business={biz}
          user={user}
          categories={categories}
          products={products}
          txThisMonth={txThisMonth}
        />

        {/* Multi-user section — tampil untuk semua (owner lihat full, member lihat info) */}
        <div className="rounded-2xl border border-border bg-card p-6">
          <MembersPanel
            businessId={businessId}
            businessName={biz.name}
            isOwner={access.isOwner}
            ownerPlan={user.plan ?? 'free'}
          />
        </div>
      </div>
    )
  } catch (err) {
    console.error('[SettingsPage] error:', err)
    redirect('/dashboard')
  }
}
