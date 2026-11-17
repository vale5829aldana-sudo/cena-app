import { getEvent, getMenuForAdmin } from '@/lib/data'
import { formatCOP } from '@/lib/format'
import { Badge, Card, Checkbox, Input, Label, PageHeader } from '@/components/ui'
import { ActionForm, SubmitButton } from '@/components/action-form'
import { changePassword, setEventStatus, updateCategory, updateEvent } from '../../actions'

export const dynamic = 'force-dynamic'

export default async function ConfigPage() {
  const event = await getEvent()
  if (!event) {
    return (
      <Card>
        <p className="text-sm text-bombay-400">No hay evento configurado.</p>
      </Card>
    )
  }

  const categories = await getMenuForAdmin(event.id)

  return (
    <>
      <PageHeader
        eyebrow="Ajustes"
        title="Configuración"
        subtitle="Límites, topes por categoría y seguridad."
      />

      <div className="grid gap-6 lg:grid-cols-2">
        <Card className="p-6">
          <h2 className="font-display text-xl text-ivory">Datos del evento</h2>
          <p className="mt-1.5 mb-5 text-sm text-pearl">
            Nombre y límite de gasto por persona.
          </p>
          <ActionForm action={updateEvent}>
            <div className="space-y-4">
              <div>
                <Label>Nombre del evento</Label>
                <Input name="name" defaultValue={event.name} required />
              </div>
              <div>
                <Label>Límite por defecto (COP)</Label>
                <Input
                  name="defaultLimit"
                  type="number"
                  min={0}
                  step={1000}
                  defaultValue={event.defaultLimit}
                  required
                />
                <p className="mt-1.5 text-xs text-pearl">
                  Actualmente: {formatCOP(event.defaultLimit)} por persona.
                </p>
              </div>
              <Checkbox
                name="applyLimitToAll"
                label="Aplicar este límite a todos los asistentes"
              />
            </div>
            <div className="mt-5">
              <SubmitButton pendingLabel="Guardando…">Guardar configuración</SubmitButton>
            </div>
          </ActionForm>
        </Card>

        <Card className="p-6">
          <h2 className="font-display text-xl text-ivory">Estado del evento</h2>
          <p className="mt-1.5 mb-5 text-sm text-pearl">
            Al cerrar el evento, los comensales ya no pueden modificar sus pedidos.
          </p>
          <div className="mb-5">
            <Badge tone={event.status === 'OPEN' ? 'green' : 'red'}>
              {event.status === 'OPEN' ? 'Evento abierto' : 'Evento cerrado'}
            </Badge>
          </div>
          <ActionForm action={setEventStatus}>
            <input type="hidden" name="status" value={event.status === 'OPEN' ? 'CLOSED' : 'OPEN'} />
            <SubmitButton
              variant={event.status === 'OPEN' ? 'danger' : 'primary'}
              pendingLabel="Guardando…"
            >
              {event.status === 'OPEN' ? 'Cerrar evento' : 'Abrir evento'}
            </SubmitButton>
          </ActionForm>
        </Card>

        <Card className="p-6">
          <h2 className="font-display text-xl text-ivory">Topes por categoría</h2>
          <p className="mt-1.5 mb-5 text-sm text-pearl">
            Precio máximo permitido por plato en cada categoría.
          </p>
          <div className="space-y-4">
            {categories.map((cat) => (
              <ActionForm
                key={cat.id}
                action={updateCategory}
                className="flex flex-wrap items-end gap-3"
              >
                <input type="hidden" name="id" value={cat.id} />
                <input type="hidden" name="name" value={cat.name} />
                <div className="min-w-[140px] flex-1">
                  <Label>{cat.name}</Label>
                  <Input
                    name="maxPrice"
                    type="number"
                    min={0}
                    step={1000}
                    defaultValue={cat.maxPrice}
                    required
                  />
                </div>
                <SubmitButton variant="secondary" pendingLabel="Guardando…">
                  Guardar
                </SubmitButton>
              </ActionForm>
            ))}
          </div>
        </Card>

        <Card className="p-6">
          <h2 className="font-display text-xl text-ivory">Seguridad</h2>
          <p className="mt-1.5 mb-5 text-sm text-pearl">
            Cambia la contraseña del administrador.
          </p>
          <ActionForm action={changePassword} resetOnSuccess>
            <div className="space-y-4">
              <div>
                <Label>Contraseña actual</Label>
                <Input
                  name="currentPassword"
                  type="password"
                  autoComplete="current-password"
                  required
                />
              </div>
              <div>
                <Label>Nueva contraseña</Label>
                <Input
                  name="newPassword"
                  type="password"
                  autoComplete="new-password"
                  minLength={6}
                  required
                />
              </div>
            </div>
            <div className="mt-5">
              <SubmitButton pendingLabel="Guardando…">Cambiar contraseña</SubmitButton>
            </div>
          </ActionForm>
        </Card>
      </div>
    </>
  )
}
