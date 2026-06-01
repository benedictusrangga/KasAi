import { AuthForm } from '@/components/auth-form'

export const metadata = {
  title: 'Masuk — KasAI',
  description: 'Masuk ke akun KasAI Anda',
}

export default function SignInPage() {
  return <AuthForm mode="sign-in" />
}
