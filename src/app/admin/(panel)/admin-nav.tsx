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
    <nav className="flex flex-wrap gap-1.5">
      {NAV.map((item) => {
        const active =
          item.href === '/admin' ? pathname === '/admin' : pathname.startsWith(item.href)
        return (
          <Link
            key={item.href}
            href={item.href}
            className={cn(
              'rounded-full border px-3.5 py-1.5 text-xs font-medium tracking-wide transition-all duration-300',
              active
                ? 'border-gold-500/50 bg-gold-500/10 text-gold-400'
                : 'border-transparent text-pearl hover:border-ivory/15 hover:bg-ivory/5 hover:text-ivory',
            )}
          >
            {item.label}
          </Link>
        )
      })}
    </nav>
  )
}
