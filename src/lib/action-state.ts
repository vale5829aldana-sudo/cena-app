/** Resultado estándar de las Server Actions del panel administrativo. */
export type ActionState = {
  ok: boolean
  error?: string
  message?: string
}

export type ActionFn = (
  state: ActionState | null,
  formData: FormData,
) => Promise<ActionState>
