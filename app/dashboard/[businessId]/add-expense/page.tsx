import { auth } from '@/lib/auth'
import { headers, cookies } from 'next/headers'
import { redirect } from 'next/navigation'
import { getBusiness } from '@/app/actions/business'
import { AddExpenseForm } from '@/components/add-expense-form'

export const metadata = { title: 'Tambah Transaksi — KasAI' }

export default async function AddExpensePage({ params }: { params: Promise<{ businessId: string }> }) {
  const { businessId } = await params
  const h = await headers()
  const c = await cookies()
  const cookieString = c.getAll().map((ck) => `${ck.name}=${ck.value}`).join('; ')
  const reqHeaders = new Headers(h as any)
  if (cookieString) reqHeaders.set('cookie', cookieString)
  const session = await auth.api.getSession({ headers: reqHeaders })
  if (!session?.user) redirect('/sign-in')

  try {
    await getBusiness(businessId)
    return (
      <div className="p-8 flex justify-center">
        <AddExpenseForm businessId={businessId} />
      </div>
    )
  } catch (err) {
    console.error('[AddExpensePage] error:', err)
    redirect('/dashboard')
  }
}
