import { getEvent, getMenu, getPairings, getReport } from '@/lib/data'
import { formatCOP } from '@/lib/format'
import { Badge, Card, Input, Label, PageHeader } from '@/components/ui'
import { ActionForm, ConfirmButton, SubmitButton } from '@/components/action-form'
import {
  cancelAdminPairing,
  createAdminPairing,
  createAttendee,
  deleteAttendee,
  updateAttendee,
} from '../../actions'

export const dynamic = 'force-dynamic'

export default async function AsistentesPage() {
  const event = await getEvent()
  if (!event) {
    return (
      <Card>
        <p className="text-sm text-red-600">No hay evento configurado.</p>
      </Card>
    )
  }

  const [attendees, pairings, categories] = await Promise.all([
    getReport(event.id),
    getPairings(event.id),
    getMenu(event.id),
  ])

  const entradaCat = categories.find((c) => c.shareable)
  const entradas = entradaCat?.dishes ?? []

  const pairingByAttendee = new Map<string, (typeof pairings)[number]>()
  for (const p of pairings) {
    pairingByAttendee.set(p.initiatorId, p)
    pairingByAttendee.set(p.partnerId, p)
  }

  const available = attendees.filter((a) => !pairingByAttendee.has(a.id))

  return (
    <>
      <PageHeader
        title="Asistentes"
        subtitle={`${attendees.length} comensales · límite por defecto ${formatCOP(event.defaultLimit)}`}
      />

      <Card className="mb-6">
        <h2 className="mb-3 text-lg font-semibold">Agregar asistente</h2>
        <ActionForm action={createAttendee} resetOnSuccess className="flex flex-wrap items-end gap-3">
          <div className="min-w-[200px] flex-1">
            <Label>Nombre</Label>
            <Input name="name" placeholder="Nombre del comensal" required />
          </div>
          <div className="w-44">
            <Label>Límite (COP)</Label>
            <Input
              name="limitAmount"
              type="number"
              min={0}
              step={1000}
              placeholder={String(event.defaultLimit)}
            />
          </div>
          <SubmitButton pendingLabel="Agregando…">Agregar</SubmitButton>
        </ActionForm>
      </Card>

      <div className="space-y-3">
        {attendees.length === 0 ? (
          <Card>
            <p className="text-sm text-zinc-500">Aún no hay asistentes.</p>
          </Card>
        ) : (
          attendees.map((a) => {
            const pairing = pairingByAttendee.get(a.id)
            return (
              <Card key={a.id}>
                <ActionForm action={updateAttendee} className="flex flex-wrap items-end gap-3">
                  <input type="hidden" name="id" value={a.id} />
                  <div className="min-w-[200px] flex-1">
                    <Label>Nombre</Label>
                    <Input name="name" defaultValue={a.name} required />
                  </div>
                  <div className="w-44">
                    <Label>Límite (COP)</Label>
                    <Input
                      name="limitAmount"
                      type="number"
                      min={0}
                      step={1000}
                      defaultValue={a.limitAmount}
                      required
                    />
                  </div>
                  <SubmitButton variant="secondary" pendingLabel="Guardando…">
                    Guardar
                  </SubmitButton>
                </ActionForm>

                <div className="mt-3 flex flex-wrap items-center justify-between gap-2 border-t border-zinc-100 pt-3 dark:border-zinc-800">
                  <div className="flex flex-wrap items-center gap-2 text-xs">
                    {a.orderConfirmedAt ? (
                      <Badge tone="green">Pedido confirmado</Badge>
                    ) : (
                      <Badge>Sin confirmar</Badge>
                    )}
                    {pairing ? (
                      <span className="text-zinc-500">
                        Entrada: {pairing.dish.name} con{' '}
                        {pairing.initiatorId === a.id
                          ? pairing.partner.name
                          : pairing.initiator.name}{' '}
                        {pairing.status === 'PENDING' ? '(pendiente)' : ''}
                      </span>
                    ) : (
                      <Badge tone="amber">Sin entrada compartida</Badge>
                    )}
                  </div>
                  <ActionForm action={deleteAttendee}>
                    <input type="hidden" name="id" value={a.id} />
                    <ConfirmButton
                      message={`¿Eliminar a ${a.name}? Se borrarán sus selecciones.`}
                      className="text-red-600 hover:bg-red-50 dark:hover:bg-red-950/40"
                    >
                      Eliminar
                    </ConfirmButton>
                  </ActionForm>
                </div>
              </Card>
            )
          })
        )}
      </div>

      <Card className="mt-8">
        <h2 className="text-lg font-semibold">Emparejamiento manual</h2>
        <p className="mt-1 mb-4 text-sm text-zinc-500">
          Para resolver casos impares: crea una entrada compartida confirmada entre dos
          comensales.
        </p>

        {entradas.length === 0 ? (
          <p className="text-sm text-zinc-500">No hay entradas disponibles en el menú.</p>
        ) : available.length < 2 ? (
          <p className="text-sm text-zinc-500">
            No hay suficientes comensales sin pareja para crear un emparejamiento.
          </p>
        ) : (
          <ActionForm action={createAdminPairing} resetOnSuccess className="flex flex-wrap items-end gap-3">
            <div className="min-w-[220px] flex-1">
              <Label>Entrada</Label>
              <select
                name="dishId"
                required
                className="w-full rounded-lg border border-zinc-300 bg-white px-3 py-2 text-sm dark:border-zinc-700 dark:bg-zinc-950"
              >
                <option value="">Selecciona una entrada…</option>
                {entradas.map((d) => (
                  <option key={d.id} value={d.id}>
                    {d.name} — {formatCOP(d.price)}
                  </option>
                ))}
              </select>
            </div>
            <div className="min-w-[180px] flex-1">
              <Label>Comensal 1</Label>
              <select
                name="initiatorId"
                required
                className="w-full rounded-lg border border-zinc-300 bg-white px-3 py-2 text-sm dark:border-zinc-700 dark:bg-zinc-950"
              >
                <option value="">Selecciona…</option>
                {available.map((a) => (
                  <option key={a.id} value={a.id}>
                    {a.name}
                  </option>
                ))}
              </select>
            </div>
            <div className="min-w-[180px] flex-1">
              <Label>Comensal 2</Label>
              <select
                name="partnerId"
                required
                className="w-full rounded-lg border border-zinc-300 bg-white px-3 py-2 text-sm dark:border-zinc-700 dark:bg-zinc-950"
              >
                <option value="">Selecciona…</option>
                {available.map((a) => (
                  <option key={a.id} value={a.id}>
                    {a.name}
                  </option>
                ))}
              </select>
            </div>
            <SubmitButton pendingLabel="Creando…">Emparejar</SubmitButton>
          </ActionForm>
        )}

        {pairings.length > 0 ? (
          <div className="mt-5 space-y-2 border-t border-zinc-100 pt-4 dark:border-zinc-800">
            <p className="text-xs font-semibold uppercase tracking-wide text-zinc-500">
              Emparejamientos activos
            </p>
            {pairings.map((p) => (
              <div key={p.id} className="flex flex-wrap items-center justify-between gap-2 text-sm">
                <span>
                  <strong>{p.initiator.name}</strong> + <strong>{p.partner.name}</strong> —{' '}
                  {p.dish.name}{' '}
                  <Badge tone={p.status === 'CONFIRMED' ? 'green' : 'amber'}>
                    {p.status === 'CONFIRMED' ? 'Confirmado' : 'Pendiente'}
                  </Badge>
                </span>
                <ActionForm action={cancelAdminPairing}>
                  <input type="hidden" name="id" value={p.id} />
                  <ConfirmButton
                    message={`¿Cancelar la entrada compartida de ${p.initiator.name} y ${p.partner.name}?`}
                    className="text-red-600 hover:bg-red-50 dark:hover:bg-red-950/40"
                  >
                    Cancelar
                  </ConfirmButton>
                </ActionForm>
              </div>
            ))}
          </div>
        ) : null}
      </Card>
    </>
  )
}
