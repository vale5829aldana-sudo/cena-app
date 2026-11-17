import { requireAdmin } from '@/lib/auth'
import { Button } from '@/components/ui'
import { BrandLockup } from '@/components/brand'
import { logout } from '../actions'
import { AdminNav } from './admin-nav'

export const dynamic = 'force-dynamic'

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const session = await requireAdmin()

  return (
    <div className="min-h-screen">
      <header className="sticky top-0 z-30 border-b border-ivory/10 bg-night-950/80 backdrop-blur-md print:hidden">
        <div className="mx-auto flex w-full max-w-6xl flex-wrap items-center justify-between gap-3 px-4 py-3 sm:px-6">
          <BrandLockup href="/" subtitle="Panel admin" />
          <div className="flex items-center gap-3">
            <span className="hidden text-xs uppercase tracking-[0.2em] text-pearl sm:inline">
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
      <main className="mx-auto w-full max-w-6xl px-4 py-8 sm:px-6">{children}</main>
    </div>
  )
}
