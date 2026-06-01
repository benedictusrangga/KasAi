import { auth } from '@/lib/auth'
import { headers, cookies } from 'next/headers'
import { redirect } from 'next/navigation'
import { getBusiness, getBusinessCategories, getBusinessProducts, getCurrentUser } from '@/app/actions/business'
import { SettingsPanel } from '@/components/settings-panel'

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
    const [business, categories, products, user] = await Promise.all([
      getBusiness(businessId),
      getBusinessCategories(businessId),
      getBusinessProducts(businessId),
      getCurrentUser(),
    ])

    return (
      <div className="p-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-foreground">Pengaturan</h1>
          <p className="text-muted-foreground mt-1">
            Kelola profil, bisnis, kategori, dan integrasi Telegram
          </p>
        </div>
        <SettingsPanel business={business} user={user} categories={categories} products={products} />
      </div>
    )
  } catch (err) {
    console.error('[SettingsPage] error:', err)
    redirect('/dashboard')
  }
}
