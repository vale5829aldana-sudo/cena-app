import Link from 'next/link'
import { redirect } from 'next/navigation'
import { getAdminSession } from '@/lib/auth'
import { LoginForm } from './login-form'

export const dynamic = 'force-dynamic'

export default async function AdminLoginPage() {
  const session = await getAdminSession()
  if (session) redirect('/admin')

  return (
    <main className="flex min-h-screen flex-col items-center justify-center gap-4 px-6 py-16">
      <LoginForm />
      <Link href="/" className="text-sm text-zinc-500 hover:underline">
        ← Volver al inicio
      </Link>
    </main>
  )
}
