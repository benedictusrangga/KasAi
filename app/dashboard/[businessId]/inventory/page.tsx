import { auth } from '@/lib/auth'
import { headers, cookies } from 'next/headers'
import { redirect } from 'next/navigation'
import { getBusiness } from '@/app/actions/business'
import { getInventoryItems, getInventoryLogs } from '@/app/actions/inventory'
import { InventoryPanel } from '@/components/inventory-panel'

export const metadata = { title: 'Inventaris — KasAI' }
export const dynamic = 'force-dynamic'

export default async function InventoryPage({ params }: { params: Promise<{ businessId: string }> }) {
  const { businessId } = await params
  const h = await headers()
  const c = await cookies()
  const cookieString = c.getAll().map((ck) => `${ck.name}=${ck.value}`).join('; ')
  const reqHeaders = new Headers(h as any)
  if (cookieString) reqHeaders.set('cookie', cookieString)
  const session = await auth.api.getSession({ headers: reqHeaders })
  if (!session?.user) redirect('/sign-in')

  try {
    const [business, items, logs] = await Promise.all([
      getBusiness(businessId),
      getInventoryItems(businessId).catch(() => []),
      getInventoryLogs(businessId).catch(() => []),
    ])

    return (
      <div className="p-6 lg:p-8">
        <div className="mb-6">
          <h1 className="text-2xl font-bold text-foreground tracking-tight">Inventaris</h1>
          <p className="text-sm text-muted-foreground mt-0.5">
            Kelola stok barang dan pantau pergerakan masuk/keluar
          </p>
        </div>
        <InventoryPanel
          businessId={businessId}
          items={items}
          logs={logs}
        />
      </div>
    )
  } catch {
    redirect('/dashboard')
  }
}
