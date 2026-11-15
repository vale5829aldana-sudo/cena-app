'use client'

import { ActionForm, SubmitButton } from '@/components/action-form'
import { Card, Input, Label } from '@/components/ui'
import { login } from '../actions'

export function LoginForm() {
  return (
    <Card className="w-full max-w-sm">
      <h1 className="text-xl font-bold">Panel administrativo</h1>
      <p className="mt-1 mb-4 text-sm text-zinc-500">
        Ingresa con tu usuario y contraseña.
      </p>
      <ActionForm action={login}>
        <div className="space-y-3">
          <div>
            <Label>Usuario</Label>
            <Input name="username" autoComplete="username" required />
          </div>
          <div>
            <Label>Contraseña</Label>
            <Input name="password" type="password" autoComplete="current-password" required />
          </div>
        </div>
        <SubmitButton className="mt-4 w-full" pendingLabel="Ingresando…">
          Ingresar
        </SubmitButton>
      </ActionForm>
    </Card>
  )
}
