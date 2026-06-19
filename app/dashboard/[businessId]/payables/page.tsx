import { auth } from '@/lib/auth'
import { headers, cookies } from 'next/headers'
import { redirect } from 'next/navigation'
import { getBusiness } from '@/app/actions/business'
import { getPayables, getReceivables } from '@/app/actions/payables'
import { PayablesPanel } from '@/components/payables-panel'

export const metadata = { title: 'Hutang & Piutang — KasAI' }
export const dynamic = 'force-dynamic'

export default async function PayablesPage({ params }: { params: Promise<{ businessId: string }> }) {
  const { businessId } = await params
  const h = await headers()
  const c = await cookies()
  const cookieString = c.getAll().map((ck) => `${ck.name}=${ck.value}`).join('; ')
  const reqHeaders = new Headers(h as any)
  if (cookieString) reqHeaders.set('cookie', cookieString)
  const session = await auth.api.getSession({ headers: reqHeaders })
  if (!session?.user) redirect('/sign-in')

  try {
    const [business, payables, receivables] = await Promise.all([
      getBusiness(businessId),
      getPayables(businessId).catch(() => []),
      getReceivables(businessId).catch(() => []),
    ])

    return (
      <div className="p-6 lg:p-8">
        <div className="mb-6">
          <h1 className="text-2xl font-bold text-foreground tracking-tight">Hutang & Piutang</h1>
          <p className="text-sm text-muted-foreground mt-0.5">
            Catat siapa yang berhutang kepada Anda dan kepada siapa Anda berhutang
          </p>
        </div>
        <PayablesPanel
          businessId={businessId}
          payables={payables}
          receivables={receivables}
        />
      </div>
    )
  } catch {
    redirect('/dashboard')
  }
}
