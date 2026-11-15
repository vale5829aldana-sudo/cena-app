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
        <p className="mt-2 rounded-lg bg-red-50 px-2 py-1 text-xs text-red-700 dark:bg-red-950/40 dark:text-red-300">
          {state.error}
        </p>
      ) : null}
      {state?.ok && state.message ? (
        <p className="mt-2 rounded-lg bg-emerald-50 px-2 py-1 text-xs text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-300">
          {state.message}
        </p>
      ) : null}
    </form>
  )
}

type ButtonProps = ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: 'primary' | 'secondary' | 'danger' | 'ghost'
  size?: 'sm' | 'md'
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
        'inline-flex items-center justify-center gap-2 rounded-lg px-3 py-1.5 text-sm font-medium transition-colors disabled:cursor-not-allowed disabled:opacity-60',
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
        'inline-flex items-center justify-center gap-2 rounded-lg border border-zinc-300 bg-white px-4 py-2 text-sm font-medium text-zinc-800 transition-colors hover:bg-zinc-50 dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-100 dark:hover:bg-zinc-700',
        className,
      )}
    >
      {children}
    </button>
  )
}
