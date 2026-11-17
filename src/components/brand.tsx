import Link from 'next/link'
import { cn } from '@/components/ui'

/** Monograma: un diamante dorado, guiño a Bombay. */
export function BrandMark({ className }: { className?: string }) {
  return (
    <span
      className={cn(
        'inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-full border border-gold-500/40 bg-night-900/70',
        className,
      )}
    >
      <svg
        viewBox="0 0 24 24"
        className="h-4 w-4 text-gold-500"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.4"
        aria-hidden
      >
        <path d="M12 3l4.6 6.6L12 21l-4.6-11.4z" strokeLinejoin="round" />
        <path d="M7.4 9.6h9.2" strokeLinecap="round" />
      </svg>
    </span>
  )
}

export function Wordmark({ className }: { className?: string }) {
  return (
    <span
      className={cn(
        'font-display uppercase tracking-[0.28em] text-ivory',
        className,
      )}
    >
      Bombay <span className="text-gold-500">Rooftop</span>
    </span>
  )
}

/** Marca completa: monograma + palabra, opcionalmente enlazada. */
export function BrandLockup({
  href,
  subtitle,
  className,
}: {
  href?: string
  subtitle?: string
  className?: string
}) {
  const inner = (
    <span className="flex items-center gap-3">
      <BrandMark />
      <span className="flex flex-col leading-none">
        <Wordmark className="text-sm" />
        {subtitle ? (
          <span className="mt-1 text-[10px] uppercase tracking-[0.3em] text-pearl/70">
            {subtitle}
          </span>
        ) : null}
      </span>
    </span>
  )

  if (href) {
    return (
      <Link href={href} className={cn('inline-flex', className)}>
        {inner}
      </Link>
    )
  }
  return <span className={cn('inline-flex', className)}>{inner}</span>
}

export function SiteFooter({ className }: { className?: string }) {
  return (
    <footer
      className={cn(
        'mt-16 border-t border-ivory/10 py-8 text-center text-xs text-pearl/70',
        className,
      )}
    >
      <p className="font-display uppercase tracking-[0.3em] text-pearl">
        Bombay Rooftop
      </p>
      <p className="mt-2">Bogotá · Cocina de fusión latino-india</p>
    </footer>
  )
}
