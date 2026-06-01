'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { acceptInvite } from '@/app/actions/members'
import { useSession } from '@/lib/auth-client'
import Link from 'next/link'

export default function AcceptInvitePage({ params }: { params: { token: string } }) {
  const router = useRouter()
  const { data: session, isPending } = useSession()
  const [status, setStatus] = useState<'loading' | 'success' | 'error' | 'unauthenticated'>('loading')
  const [message, setMessage] = useState('')

  useEffect(() => {
    if (isPending) return

    if (!session?.user) {
      setStatus('unauthenticated')
      return
    }

    acceptInvite(params.token)
      .then((result) => {
        setStatus('success')
        setTimeout(() => {
          router.push(`/dashboard/${result.businessId}`)
        }, 2000)
      })
      .catch((err) => {
        setStatus('error')
        setMessage(err.message || 'Terjadi kesalahan')
      })
  }, [session, isPending, params.token, router])

  if (isPending || status === 'loading') {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <div className="text-4xl mb-4">⏳</div>
          <p className="text-muted-foreground text-sm">Memproses undangan...</p>
        </div>
      </div>
    )
  }

  if (status === 'unauthenticated') {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center px-4">
        <div className="rounded-2xl border border-border bg-card p-8 max-w-md w-full text-center shadow-lg">
          <div className="text-5xl mb-4">🔐</div>
          <h1 className="text-xl font-bold text-foreground mb-2">Login Diperlukan</h1>
          <p className="text-muted-foreground text-sm mb-6">
            Anda perlu login terlebih dahulu untuk menerima undangan ini.
          </p>
          <Link
            href={`/sign-in?redirect=/invite/${params.token}`}
            className="block w-full rounded-xl bg-primary text-primary-foreground py-3 text-sm font-semibold hover:bg-primary/90 transition-colors text-center"
          >
            Login Sekarang
          </Link>
          <p className="text-sm text-muted-foreground mt-4">
            Belum punya akun?{' '}
            <Link
              href={`/sign-up?redirect=/invite/${params.token}`}
              className="text-primary font-medium hover:underline"
            >
              Daftar gratis
            </Link>
          </p>
        </div>
      </div>
    )
  }

  if (status === 'success') {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center px-4">
        <div className="rounded-2xl border border-border bg-card p-8 max-w-md w-full text-center shadow-lg">
          <div className="text-5xl mb-4">🎉</div>
          <h1 className="text-xl font-bold text-foreground mb-2">Undangan Diterima!</h1>
          <p className="text-muted-foreground text-sm">
            Anda berhasil bergabung ke bisnis. Mengarahkan ke dashboard...
          </p>
          <div className="mt-4 flex justify-center">
            <div className="h-1.5 w-24 bg-muted rounded-full overflow-hidden">
              <div className="h-full bg-primary rounded-full animate-pulse" style={{ width: '60%' }} />
            </div>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-background flex items-center justify-center px-4">
      <div className="rounded-2xl border border-border bg-card p-8 max-w-md w-full text-center shadow-lg">
        <div className="text-5xl mb-4">❌</div>
        <h1 className="text-xl font-bold text-foreground mb-2">Undangan Tidak Valid</h1>
        <p className="text-muted-foreground text-sm mb-6">{message || 'Link undangan sudah kadaluarsa atau tidak ditemukan.'}</p>
        <Link
          href="/dashboard"
          className="block w-full rounded-xl bg-primary text-primary-foreground py-3 text-sm font-semibold hover:bg-primary/90 transition-colors text-center"
        >
          Ke Dashboard
        </Link>
      </div>
    </div>
  )
}
