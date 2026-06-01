import { auth } from '@/lib/auth'
import { headers, cookies } from 'next/headers'
import { redirect } from 'next/navigation'
import { LandingNav } from '@/components/landing/nav'
import { LandingHero } from '@/components/landing/hero'
import { LandingSocialProof } from '@/components/landing/social-proof'
import { LandingFeatures } from '@/components/landing/features'
import { LandingTelegram } from '@/components/landing/telegram'
import { LandingHowItWorks } from '@/components/landing/how-it-works'
import { LandingPricing } from '@/components/landing/pricing'
import { LandingCta } from '@/components/landing/cta'
import { LandingFooter } from '@/components/landing/footer'

export const metadata = {
  title: 'KasAI — Keuangan Bisnis, Semudah Kirim Pesan',
  description:
    'Catat transaksi lewat Telegram, foto struk, atau suara. AI kami memahami bisnis Anda dan memberikan laporan keuangan real-time. Gratis untuk mulai.',
}
export const dynamic = 'force-dynamic'

export default async function LandingPage() {
  const h = await headers()
  const c = await cookies()
  const cookieString = c.getAll().map((ck) => `${ck.name}=${ck.value}`).join('; ')
  const reqHeaders = new Headers(h as any)
  if (cookieString) reqHeaders.set('cookie', cookieString)
  const session = await auth.api.getSession({ headers: reqHeaders })
  if (session?.user) redirect('/dashboard')

  return (
    <div className="min-h-screen bg-[#0a0a0a] text-white overflow-x-hidden">
      <LandingNav />
      <LandingHero />
      <LandingSocialProof />
      <LandingFeatures />
      <LandingTelegram />
      <LandingHowItWorks />
      <LandingPricing />
      <LandingCta />
      <LandingFooter />
    </div>
  )
}
