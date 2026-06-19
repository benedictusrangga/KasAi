import { Suspense } from 'react'
import { SetPasswordForm } from './set-password-form'

export const metadata = {
  title: 'Atur Password — KasAI',
}

export default function SetPasswordPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-[#0a0a0a] flex items-center justify-center">
        <div className="text-white/40 text-sm">Memuat...</div>
      </div>
    }>
      <SetPasswordForm />
    </Suspense>
  )
}
