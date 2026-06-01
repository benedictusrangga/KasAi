import { AuthForm } from '@/components/auth-form'

export const metadata = {
  title: 'Daftar Gratis — KasAI',
  description: 'Buat akun KasAI gratis dan mulai kelola keuangan bisnis Anda',
}

export default function SignUpPage() {
  return <AuthForm mode="sign-up" />
}
