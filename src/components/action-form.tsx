'use client'

import { useActionState, useEffect, useRef } from 'react'
import { useFormStatus } from 'react-dom'
import type { ButtonHTMLAttributes, ReactNode } from 'react'
import type { ActionFn } from '@/lib/action-state'
import { Button, cn } from './ui'

/**
 * Formulario conectado a una Server Action que devuelve `ActionState`.
 * Muestra el error o el mensaje de éxito. Usa `SubmitButton` para el estado pendiente.
 */
export function ActionForm({
  action,
  children,
  className,
  resetOnSuccess = false,
  encType,
}: {
  action: ActionFn
  children: ReactNode
  className?: string
  resetOnSuccess?: boolean
  encType?: 'multipart/form-data'
}) {
  const [state, formAction] = useActionState(action, null)
  const ref = useRef<HTMLFormElement>(null)

  useEffect(() => {
    if (resetOnSuccess && state?.ok) ref.current?.reset()
  }, [state, resetOnSuccess])

  return (
    <form ref={ref} action={formAction} className={className} encType={encType}>
      {children}
      {state?.error ? (
        <p className="mt-2 rounded-lg border border-bombay-600/30 bg-bombay-600/10 px-2.5 py-1.5 text-xs text-bombay-400">
          {state.error}
        </p>
      ) : null}
      {state?.ok && state.message ? (
        <p className="mt-2 rounded-lg border border-emerald-400/25 bg-emerald-500/10 px-2.5 py-1.5 text-xs text-emerald-300">
          {state.message}
        </p>
      ) : null}
    </form>
  )
}

type ButtonProps = ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: 'primary' | 'secondary' | 'outline' | 'danger' | 'ghost'
  size?: 'sm' | 'md' | 'lg'
  pendingLabel?: string
}

/** Botón de envío que se deshabilita y cambia su texto mientras la acción corre. */
export function SubmitButton({
  children,
  pendingLabel,
  variant,
  size,
  className,
  disabled,
  ...props
}: ButtonProps) {
  const { pending } = useFormStatus()
  return (
    <Button
      {...props}
      type="submit"
      variant={variant}
      size={size}
      className={className}
      disabled={pending || disabled}
    >
      {pending && pendingLabel ? pendingLabel : children}
    </Button>
  )
}

/** Botón de envío con confirmación previa (para acciones destructivas). */
export function ConfirmButton({
  message,
  children,
  className,
  disabled,
}: {
  message: string
  children: ReactNode
  className?: string
  disabled?: boolean
}) {
  const { pending } = useFormStatus()
  return (
    <button
      type="submit"
      disabled={pending || disabled}
      onClick={(event) => {
        if (!confirm(message)) event.preventDefault()
      }}
      className={cn(
        'inline-flex items-center justify-center gap-2 rounded-full border border-transparent px-3.5 py-2 text-xs font-medium tracking-wide transition-all duration-300 disabled:cursor-not-allowed disabled:opacity-60',
        className,
      )}
    >
      {children}
    </button>
  )
}

/** Botón que imprime la página actual (reporte para cocina). */
export function PrintButton({
  children = 'Imprimir',
  className,
}: {
  children?: ReactNode
  className?: string
}) {
  return (
    <button
      type="button"
      onClick={() => window.print()}
      className={cn(
        'inline-flex items-center justify-center gap-2 rounded-full border border-ivory/20 px-4 py-2 text-sm font-medium tracking-wide text-ivory transition-all duration-300 hover:border-ivory/45 hover:bg-ivory/5',
        className,
      )}
    >
      {children}
    </button>
  )
}
