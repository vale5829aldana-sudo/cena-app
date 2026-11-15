'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { cn } from '@/components/ui'

const NAV = [
  { href: '/admin', label: 'Resumen' },
  { href: '/admin/asistentes', label: 'Asistentes' },
  { href: '/admin/menu', label: 'Menú' },
  { href: '/admin/config', label: 'Configuración' },
  { href: '/admin/reportes', label: 'Reportes' },
]

export function AdminNav() {
  const pathname = usePathname()
  return (
    <nav className="flex flex-wrap gap-1">
      {NAV.map((item) => {
        const active =
          item.href === '/admin' ? pathname === '/admin' : pathname.startsWith(item.href)
        return (
          <Link
            key={item.href}
            href={item.href}
            className={cn(
              'rounded-lg px-3 py-1.5 text-sm font-medium transition-colors',
              active
                ? 'bg-amber-600 text-white'
                : 'text-zinc-600 hover:bg-zinc-100 dark:text-zinc-300 dark:hover:bg-zinc-800',
            )}
          >
            {item.label}
          </Link>
        )
      })}
    </nav>
  )
}
