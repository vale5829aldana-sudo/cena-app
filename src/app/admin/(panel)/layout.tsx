import Link from 'next/link'
import { requireAdmin } from '@/lib/auth'
import { Button } from '@/components/ui'
import { logout } from '../actions'
import { AdminNav } from './admin-nav'

export const dynamic = 'force-dynamic'

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const session = await requireAdmin()

  return (
    <div className="min-h-screen">
      <header className="border-b border-zinc-200 bg-white print:hidden dark:border-zinc-800 dark:bg-zinc-900">
        <div className="mx-auto flex w-full max-w-6xl flex-wrap items-center justify-between gap-3 px-4 py-3 sm:px-6">
          <div className="flex items-center gap-3">
            <Link href="/" className="text-lg font-bold tracking-tight">
              🍽️ Cena App
            </Link>
            <span className="hidden rounded-full bg-zinc-100 px-2 py-0.5 text-xs text-zinc-500 sm:inline dark:bg-zinc-800 dark:text-zinc-400">
              Panel admin
            </span>
          </div>
          <div className="flex items-center gap-3">
            <span className="hidden text-xs text-zinc-500 sm:inline">
              {session.username}
            </span>
            <form action={logout}>
              <Button variant="ghost" size="sm" type="submit">
                Salir
              </Button>
            </form>
          </div>
        </div>
        <div className="mx-auto w-full max-w-6xl px-4 pb-3 sm:px-6">
          <AdminNav />
        </div>
      </header>
      <main className="mx-auto w-full max-w-6xl px-4 py-6 sm:px-6">{children}</main>
    </div>
  )
}
