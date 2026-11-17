'use client'

import { ActionForm, SubmitButton } from '@/components/action-form'
import { Card, Eyebrow, Input, Label } from '@/components/ui'
import { login } from '../actions'

export function LoginForm() {
  return (
    <Card className="w-full max-w-sm p-6">
      <Eyebrow>Acceso</Eyebrow>
      <h1 className="mt-3 font-display text-2xl text-ivory">
        Panel administrativo
      </h1>
      <p className="mt-1 mb-5 text-sm text-pearl">
        Ingresa con tu usuario y contraseña.
      </p>
      <ActionForm action={login}>
        <div className="space-y-4">
          <div>
            <Label>Usuario</Label>
            <Input name="username" autoComplete="username" required />
          </div>
          <div>
            <Label>Contraseña</Label>
            <Input
              name="password"
              type="password"
              autoComplete="current-password"
              required
            />
          </div>
        </div>
        <SubmitButton className="mt-5 w-full" pendingLabel="Ingresando…">
          Ingresar
        </SubmitButton>
      </ActionForm>
    </Card>
  )
}
