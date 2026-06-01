'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { acceptInvite } from '@/app/actions/members'
import { useSession } from '@/lib/auth-client'

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
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4" />
          <p className="text-gray-600">Memproses undangan...</p>
        </div>
      </div>
    )
  }

  if (status === 'unauthenticated') {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="bg-white rounded-2xl shadow-lg p-8 max-w-md w-full mx-4 text-center">
          <div className="text-4xl mb-4">🔐</div>
          <h1 className="text-xl font-bold text-gray-900 mb-2">Login Diperlukan</h1>
          <p className="text-gray-600 mb-6">
            Anda perlu login terlebih dahulu untuk menerima undangan ini.
          </p>
          <button
            onClick={() => router.push(`/sign-in?redirect=/invite/${params.token}`)}
            className="w-full bg-blue-600 text-white py-3 rounded-xl font-semibold hover:bg-blue-700 transition-colors"
          >
            Login Sekarang
          </button>
          <p className="text-sm text-gray-500 mt-3">
            Belum punya akun?{' '}
            <button
              onClick={() => router.push(`/sign-up?redirect=/invite/${params.token}`)}
              className="text-blue-600 hover:underline"
            >
              Daftar gratis
            </button>
          </p>
        </div>
      </div>
    )
  }

  if (status === 'success') {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="bg-white rounded-2xl shadow-lg p-8 max-w-md w-full mx-4 text-center">
          <div className="text-5xl mb-4">🎉</div>
          <h1 className="text-xl font-bold text-gray-900 mb-2">Undangan Diterima!</h1>
          <p className="text-gray-600">Anda berhasil bergabung ke bisnis. Mengarahkan ke dashboard...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="bg-white rounded-2xl shadow-lg p-8 max-w-md w-full mx-4 text-center">
        <div className="text-5xl mb-4">❌</div>
        <h1 className="text-xl font-bold text-gray-900 mb-2">Undangan Tidak Valid</h1>
        <p className="text-gray-600 mb-6">{message}</p>
        <button
          onClick={() => router.push('/dashboard')}
          className="w-full bg-blue-600 text-white py-3 rounded-xl font-semibold hover:bg-blue-700 transition-colors"
        >
          Ke Dashboard
        </button>
      </div>
    </div>
  )
}
