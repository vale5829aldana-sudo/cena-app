import type {
  ButtonHTMLAttributes,
  InputHTMLAttributes,
  ReactNode,
  SelectHTMLAttributes,
  TextareaHTMLAttributes,
} from 'react'

export function cn(...classes: Array<string | false | null | undefined>) {
  return classes.filter(Boolean).join(' ')
}

/* ---------------------------------------------------------------- Tipografía */

/** Etiqueta pequeña en mayúsculas con tracking amplio, para anteponer títulos. */
export function Eyebrow({
  children,
  className,
}: {
  children: ReactNode
  className?: string
}) {
  return (
    <p
      className={cn(
        'text-[11px] font-semibold uppercase tracking-[0.32em] text-gold-500',
        className,
      )}
    >
      {children}
    </p>
  )
}

/* --------------------------------------------------------------- Superficies */

export function Card({
  children,
  className,
}: {
  children: ReactNode
  className?: string
}) {
  return (
    <div
      className={cn(
        'rounded-2xl border border-ivory/10 bg-night-900/60 p-5 shadow-luxe backdrop-blur-sm',
        className,
      )}
    >
      {children}
    </div>
  )
}

export function PageHeader({
  title,
  subtitle,
  eyebrow,
  action,
}: {
  title: string
  subtitle?: string
  eyebrow?: string
  action?: ReactNode
}) {
  return (
    <div className="mb-7 flex flex-wrap items-end justify-between gap-4">
      <div>
        {eyebrow ? <Eyebrow className="mb-2">{eyebrow}</Eyebrow> : null}
        <h1 className="font-display text-3xl leading-tight tracking-tight text-ivory sm:text-4xl">
          {title}
        </h1>
        {subtitle ? (
          <p className="mt-2 max-w-2xl text-sm text-pearl">{subtitle}</p>
        ) : null}
      </div>
      {action}
    </div>
  )
}

/** Separador fino en marfil translúcido. */
export function Divider({ className }: { className?: string }) {
  return <div className={cn('h-px w-full bg-ivory/10', className)} />
}

/* ------------------------------------------------------------------ Acciones */

type ButtonProps = ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: 'primary' | 'secondary' | 'outline' | 'danger' | 'ghost'
  size?: 'sm' | 'md' | 'lg'
}

export function Button({
  variant = 'primary',
  size = 'md',
  className,
  ...props
}: ButtonProps) {
  const variants: Record<string, string> = {
    primary:
      'bg-bombay-600 text-ivory hover:bg-bombay-500 shadow-[0_14px_34px_-16px_rgba(200,16,46,0.9)] disabled:bg-bombay-700/60 disabled:shadow-none',
    secondary:
      'border border-gold-500/45 text-gold-400 hover:border-gold-400 hover:bg-gold-500/10 disabled:opacity-50',
    outline:
      'border border-ivory/20 text-ivory hover:border-ivory/45 hover:bg-ivory/5 disabled:opacity-50',
    danger:
      'border border-bombay-600/60 text-bombay-400 hover:border-bombay-500 hover:bg-bombay-600/15 disabled:opacity-50',
    ghost:
      'text-pearl hover:text-ivory hover:bg-ivory/5 disabled:opacity-50',
  }
  const sizes: Record<string, string> = {
    sm: 'px-3.5 py-2 text-xs',
    md: 'px-5 py-2.5 text-sm',
    lg: 'px-7 py-3 text-sm',
  }
  return (
    <button
      {...props}
      className={cn(
        'inline-flex items-center justify-center gap-2 rounded-full font-medium tracking-wide transition-all duration-300 ease-out disabled:cursor-not-allowed',
        variants[variant],
        sizes[size],
        className,
      )}
    />
  )
}

/* ------------------------------------------------------------------ Campos */

const fieldBase =
  'w-full rounded-xl border border-ivory/15 bg-night-950/50 px-3.5 py-2.5 text-base text-ivory placeholder:text-pearl/40 outline-none transition-colors duration-200 focus:border-gold-500/70 focus:bg-night-950/80 focus:ring-2 focus:ring-gold-500/15 sm:text-sm'

export function Input({ className, ...props }: InputHTMLAttributes<HTMLInputElement>) {
  return <input {...props} className={cn(fieldBase, className)} />
}

export function Textarea({
  className,
  ...props
}: TextareaHTMLAttributes<HTMLTextAreaElement>) {
  return <textarea {...props} className={cn(fieldBase, 'resize-y', className)} />
}

export function Select({
  className,
  children,
  ...props
}: SelectHTMLAttributes<HTMLSelectElement>) {
  return (
    <div className="relative">
      <select
        {...props}
        className={cn(fieldBase, 'cursor-pointer appearance-none pr-10', className)}
      >
        {children}
      </select>
      <svg
        aria-hidden
        viewBox="0 0 20 20"
        className="pointer-events-none absolute right-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-pearl/70"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.5"
      >
        <path d="m6 8 4 4 4-4" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
    </div>
  )
}

export function Label({ children }: { children: ReactNode }) {
  return (
    <label className="mb-1.5 block text-[11px] font-semibold uppercase tracking-[0.18em] text-pearl/80">
      {children}
    </label>
  )
}

export function Checkbox({
  label,
  ...props
}: InputHTMLAttributes<HTMLInputElement> & { label: string }) {
  return (
    <label className="inline-flex cursor-pointer items-center gap-2.5 text-sm text-pearl transition-colors hover:text-ivory">
      <input
        type="checkbox"
        {...props}
        className="h-4 w-4 cursor-pointer rounded border-ivory/25 bg-night-950/60 text-gold-500 accent-gold-500 focus:ring-2 focus:ring-gold-500/25"
      />
      {label}
    </label>
  )
}

/* ------------------------------------------------------------------ Estados */

export function Badge({
  children,
  tone = 'pearl',
}: {
  children: ReactNode
  tone?: 'pearl' | 'green' | 'emerald' | 'amber' | 'gold' | 'red' | 'blue' | 'midnight'
}) {
  const tones: Record<string, string> = {
    pearl: 'bg-ivory/5 text-pearl ring-ivory/15',
    green: 'bg-emerald-500/10 text-emerald-300 ring-emerald-400/25',
    emerald: 'bg-emerald-500/10 text-emerald-300 ring-emerald-400/25',
    amber: 'bg-gold-500/10 text-gold-400 ring-gold-500/25',
    gold: 'bg-gold-500/10 text-gold-400 ring-gold-500/25',
    red: 'bg-bombay-600/15 text-bombay-400 ring-bombay-600/35',
    blue: 'bg-midnight/25 text-[#a3bde8] ring-midnight/50',
    midnight: 'bg-midnight/25 text-[#a3bde8] ring-midnight/50',
  }
  return (
    <span
      className={cn(
        'inline-flex items-center rounded-full px-2.5 py-0.5 text-[11px] font-medium tracking-wide ring-1 ring-inset',
        tones[tone],
      )}
    >
      {children}
    </span>
  )
}
