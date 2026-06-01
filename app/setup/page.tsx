import { auth } from '@/lib/auth'
import { headers, cookies } from 'next/headers'
import { redirect } from 'next/navigation'
import { BusinessForm } from '@/components/business-form'
import Link from 'next/link'

export const metadata = {
  title: 'Tambah Bisnis — KasAI',
}
export const dynamic = 'force-dynamic'

export default async function SetupPage() {
  const h = await headers()
  const c = await cookies()
  const cookieString = c.getAll().map((ck) => `${ck.name}=${ck.value}`).join('; ')
  const reqHeaders = new Headers(h as any)
  if (cookieString) reqHeaders.set('cookie', cookieString)
  const session = await auth.api.getSession({ headers: reqHeaders })
  if (!session?.user) redirect('/sign-in')

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b border-border px-6 py-4 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-primary text-primary-foreground font-bold text-xs">K</div>
          <span className="font-bold text-foreground">KasAI</span>
        </div>
        <Link href="/dashboard" className="text-sm text-muted-foreground hover:text-foreground transition-colors">
          ← Kembali ke Dashboard
        </Link>
      </header>

      <div className="flex items-center justify-center px-6 py-16">
        <BusinessForm />
      </div>
    </div>
  )
}
