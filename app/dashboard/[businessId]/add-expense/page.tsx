import { auth } from '@/lib/auth'
import { headers, cookies } from 'next/headers'
import { redirect } from 'next/navigation'
import { getBusiness, getBusinessCategories, getCurrentUser } from '@/app/actions/business'
import { AddExpenseForm } from '@/components/add-expense-form'

export const metadata = { title: 'Tambah Transaksi — KasAI' }
export const dynamic = 'force-dynamic'

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
    const [, categories, currentUser] = await Promise.all([
      getBusiness(businessId),
      getBusinessCategories(businessId).catch(() => []),
      getCurrentUser(),
    ])

    return (
      <div className="p-6 lg:p-8 flex justify-center">
        <AddExpenseForm
          businessId={businessId}
          categories={categories}
          accountType={currentUser.accountType ?? 'business'}
        />
      </div>
    )
  } catch (err) {
    console.error('[AddExpensePage] error:', err)
    redirect('/dashboard')
  }
}
