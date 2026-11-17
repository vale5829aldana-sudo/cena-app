import Link from 'next/link'
import { getEvent, getMenu, getPairings, getReport } from '@/lib/data'
import { computeBudget } from '@/lib/domain'
import { formatCOP } from '@/lib/format'
import { Badge, Card, PageHeader } from '@/components/ui'
import { ActionForm, SubmitButton } from '@/components/action-form'
import { setEventStatus } from '../actions'

export const dynamic = 'force-dynamic'

export default async function AdminDashboard() {
  const event = await getEvent()
  if (!event) {
    return (
      <Card>
        <p className="text-sm text-bombay-400">
          No hay evento configurado. Ejecuta el seed de la base de datos.
        </p>
      </Card>
    )
  }

  const [attendees, pairings, categories] = await Promise.all([
    getReport(event.id),
    getPairings(event.id),
    getMenu(event.id),
  ])

  const confirmedOrders = attendees.filter((a) => a.orderConfirmedAt).length
  const pendingPairings = pairings.filter((p) => p.status === 'PENDING').length
  const dishCount = categories.reduce((total, c) => total + c.dishes.length, 0)

  const pairedIds = new Set<string>()
  for (const p of pairings) {
    pairedIds.add(p.initiatorId)
    pairedIds.add(p.partnerId)
  }
  const unmatched = attendees.filter((a) => !pairedIds.has(a.id))

  let estimatedTotal = 0
  let overBudget = 0
  for (const a of attendees) {
    const entrada = a.orderItems.find((i) => i.category.shareable)
    const plato = a.orderItems.find((i) => i.category.slug === 'platos-fuertes')
    const bebida = a.orderItems.find((i) => i.category.slug === 'bebidas')
    const budget = computeBudget({
      limit: a.limitAmount,
      entradaPrice: entrada?.price ?? 0,
      entradaShareFactor: entrada?.shareFactor,
      platoPrice: plato?.price ?? 0,
      bebidaPrice: bebida?.price ?? 0,
    })
    estimatedTotal += budget.total
    if (!budget.withinBudget) overBudget += 1
  }

  const stats = [
    { label: 'Asistentes', value: String(attendees.length), hint: `${confirmedOrders} pedidos confirmados` },
    { label: 'Entradas compartidas', value: String(pairings.length), hint: `${pendingPairings} por confirmar` },
    { label: 'Platos en el menú', value: String(dishCount), hint: `${categories.length} categorías` },
    { label: 'Total estimado', value: formatCOP(estimatedTotal), hint: overBudget > 0 ? `${overBudget} fuera de límite` : 'Todos dentro del límite' },
  ]

  return (
    <>
      <PageHeader
        eyebrow="Resumen"
        title={event.name}
        subtitle="Vista general del evento y sus pedidos."
        action={
          <Badge tone={event.status === 'OPEN' ? 'green' : 'red'}>
            {event.status === 'OPEN' ? 'Evento abierto' : 'Evento cerrado'}
          </Badge>
        }
      />

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {stats.map((s) => (
          <Card key={s.label} className="p-5">
            <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-pearl/80">
              {s.label}
            </p>
            <p className="mt-2 font-display text-3xl leading-none text-ivory">
              {s.value}
            </p>
            <p className="mt-2 text-xs text-pearl">{s.hint}</p>
          </Card>
        ))}
      </div>

      <div className="mt-6 grid gap-4 lg:grid-cols-2">
        <Card className="p-6">
          <h2 className="font-display text-xl text-ivory">Estado del evento</h2>
          <p className="mt-1.5 mb-5 text-sm text-pearl">
            {event.status === 'OPEN'
              ? 'Los comensales pueden armar y editar sus pedidos.'
              : 'Los pedidos están bloqueados. Ábrelo para permitir cambios.'}
          </p>
          <ActionForm action={setEventStatus}>
            <input type="hidden" name="status" value={event.status === 'OPEN' ? 'CLOSED' : 'OPEN'} />
            <SubmitButton
              variant={event.status === 'OPEN' ? 'danger' : 'primary'}
              pendingLabel="Guardando…"
            >
              {event.status === 'OPEN' ? 'Cerrar evento' : 'Abrir evento'}
            </SubmitButton>
          </ActionForm>
          {event.closedAt ? (
            <p className="mt-4 text-xs text-pearl">
              Cerrado el {new Date(event.closedAt).toLocaleString('es-CO')}
            </p>
          ) : null}
        </Card>

        <Card className="p-6">
          <h2 className="font-display text-xl text-ivory">Emparejamientos</h2>
          <p className="mt-1.5 mb-5 text-sm text-pearl">
            Casos impares o comensales sin entrada compartida.
          </p>
          {unmatched.length === 0 ? (
            <p className="text-sm text-emerald-300">
              Todos los asistentes tienen su entrada compartida.
            </p>
          ) : (
            <>
              <ul className="mb-4 space-y-2 text-sm">
                {unmatched.map((a) => (
                  <li key={a.id} className="flex items-center gap-2.5">
                    <Badge tone="amber">Sin pareja</Badge>
                    <span className="text-ivory">{a.name}</span>
                  </li>
                ))}
              </ul>
              <Link
                href="/admin/asistentes"
                className="text-sm font-medium text-gold-400 transition-colors hover:text-gold-300"
              >
                Resolver en Asistentes →
              </Link>
            </>
          )}
        </Card>
      </div>

      <div className="mt-6 flex flex-wrap gap-5">
        <Link
          href="/admin/reportes"
          className="text-sm font-medium text-gold-400 transition-colors hover:text-gold-300"
        >
          Ver reporte para la cocina →
        </Link>
        <Link
          href="/comensal"
          className="text-sm font-medium text-pearl transition-colors hover:text-ivory"
        >
          Vista del comensal →
        </Link>
      </div>
    </>
  )
}
