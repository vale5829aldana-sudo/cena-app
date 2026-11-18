import { getEvent, getMenu, getPairings, getReport } from '@/lib/data'
import { formatCOP } from '@/lib/format'
import { Badge, Card, Input, Label, PageHeader, Select } from '@/components/ui'
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
        <p className="text-sm text-bombay-400">No hay evento configurado.</p>
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
        eyebrow="Comensales"
        title="Asistentes"
        subtitle={`${attendees.length} comensales · límite por defecto ${formatCOP(event.defaultLimit)}`}
      />

      <Card className="mb-6 p-6">
        <h2 className="font-display text-xl text-ivory">Agregar asistente</h2>
        <ActionForm
          action={createAttendee}
          resetOnSuccess
          className="mt-4 flex flex-wrap items-end gap-3"
        >
          <div className="min-w-[200px] flex-1">
            <Label>Nombre</Label>
            <Input name="name" placeholder="Nombre del comensal" required />
          </div>
          <div className="w-full sm:w-44">
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
            <p className="text-sm text-pearl">Aún no hay asistentes.</p>
          </Card>
        ) : (
          attendees.map((a) => {
            const pairing = pairingByAttendee.get(a.id)
            return (
              <Card key={a.id} className="p-5">
                <ActionForm action={updateAttendee} className="flex flex-wrap items-end gap-3">
                  <input type="hidden" name="id" value={a.id} />
                  <div className="min-w-[200px] flex-1">
                    <Label>Nombre</Label>
                    <Input name="name" defaultValue={a.name} required />
                  </div>
                  <div className="w-full sm:w-44">
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

                <div className="mt-4 flex flex-wrap items-center justify-between gap-2 border-t border-ivory/10 pt-4">
                  <div className="flex flex-wrap items-center gap-2 text-xs">
                    {a.orderConfirmedAt ? (
                      <Badge tone="green">Pedido confirmado</Badge>
                    ) : (
                      <Badge>Sin confirmar</Badge>
                    )}
                    {pairing ? (
                      <span className="text-pearl">
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
                      className="border border-bombay-600/50 text-bombay-400 hover:bg-bombay-600/15"
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

      <Card className="mt-8 p-6">
        <h2 className="font-display text-xl text-ivory">Emparejamiento manual</h2>
        <p className="mt-1.5 mb-5 text-sm text-pearl">
          Para resolver casos impares: crea una entrada compartida confirmada entre dos
          comensales.
        </p>

        {entradas.length === 0 ? (
          <p className="text-sm text-pearl">No hay entradas disponibles en el menú.</p>
        ) : available.length < 2 ? (
          <p className="text-sm text-pearl">
            No hay suficientes comensales sin pareja para crear un emparejamiento.
          </p>
        ) : (
          <ActionForm
            action={createAdminPairing}
            resetOnSuccess
            className="flex flex-wrap items-end gap-3"
          >
            <div className="min-w-[220px] flex-1">
              <Label>Entrada</Label>
              <Select name="dishId" required defaultValue="">
                <option value="">Selecciona una entrada…</option>
                {entradas.map((d) => (
                  <option key={d.id} value={d.id}>
                    {d.name} — {formatCOP(d.price)}
                  </option>
                ))}
              </Select>
            </div>
            <div className="min-w-[180px] flex-1">
              <Label>Comensal 1</Label>
              <Select name="initiatorId" required defaultValue="">
                <option value="">Selecciona…</option>
                {available.map((a) => (
                  <option key={a.id} value={a.id}>
                    {a.name}
                  </option>
                ))}
              </Select>
            </div>
            <div className="min-w-[180px] flex-1">
              <Label>Comensal 2</Label>
              <Select name="partnerId" required defaultValue="">
                <option value="">Selecciona…</option>
                {available.map((a) => (
                  <option key={a.id} value={a.id}>
                    {a.name}
                  </option>
                ))}
              </Select>
            </div>
            <SubmitButton pendingLabel="Creando…">Emparejar</SubmitButton>
          </ActionForm>
        )}

        {pairings.length > 0 ? (
          <div className="mt-6 space-y-2.5 border-t border-ivory/10 pt-5">
            <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-pearl/80">
              Emparejamientos activos
            </p>
            {pairings.map((p) => (
              <div
                key={p.id}
                className="flex flex-wrap items-center justify-between gap-2 text-sm"
              >
                <span className="text-pearl">
                  <strong className="text-ivory">{p.initiator.name}</strong> +{' '}
                  <strong className="text-ivory">{p.partner.name}</strong> — {p.dish.name}{' '}
                  <Badge tone={p.status === 'CONFIRMED' ? 'green' : 'amber'}>
                    {p.status === 'CONFIRMED' ? 'Confirmado' : 'Pendiente'}
                  </Badge>
                </span>
                <ActionForm action={cancelAdminPairing}>
                  <input type="hidden" name="id" value={p.id} />
                  <ConfirmButton
                    message={`¿Cancelar la entrada compartida de ${p.initiator.name} y ${p.partner.name}?`}
                    className="border border-bombay-600/50 text-bombay-400 hover:bg-bombay-600/15"
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
