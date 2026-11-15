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
        <p className="text-sm text-red-600">
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
        title={event.name}
        subtitle="Resumen general del evento."
        action={
          <Badge tone={event.status === 'OPEN' ? 'green' : 'red'}>
            {event.status === 'OPEN' ? 'Evento abierto' : 'Evento cerrado'}
          </Badge>
        }
      />

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {stats.map((s) => (
          <Card key={s.label}>
            <p className="text-xs font-semibold uppercase tracking-wide text-zinc-500">
              {s.label}
            </p>
            <p className="mt-1 text-2xl font-bold">{s.value}</p>
            <p className="mt-1 text-xs text-zinc-500">{s.hint}</p>
          </Card>
        ))}
      </div>

      <div className="mt-6 grid gap-4 lg:grid-cols-2">
        <Card>
          <h2 className="text-lg font-semibold">Estado del evento</h2>
          <p className="mt-1 mb-4 text-sm text-zinc-500">
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
            <p className="mt-3 text-xs text-zinc-500">
              Cerrado el {new Date(event.closedAt).toLocaleString('es-CO')}
            </p>
          ) : null}
        </Card>

        <Card>
          <h2 className="text-lg font-semibold">Emparejamientos</h2>
          <p className="mt-1 mb-4 text-sm text-zinc-500">
            Casos impares o comensales sin entrada compartida.
          </p>
          {unmatched.length === 0 ? (
            <p className="text-sm text-emerald-600">
              Todos los asistentes tienen su entrada compartida.
            </p>
          ) : (
            <>
              <ul className="mb-3 space-y-1 text-sm">
                {unmatched.map((a) => (
                  <li key={a.id} className="flex items-center gap-2">
                    <Badge tone="amber">Sin pareja</Badge>
                    <span>{a.name}</span>
                  </li>
                ))}
              </ul>
              <Link
                href="/admin/asistentes"
                className="text-sm font-medium text-amber-600 hover:underline"
              >
                Resolver en Asistentes →
              </Link>
            </>
          )}
        </Card>
      </div>

      <div className="mt-6 flex flex-wrap gap-3">
        <Link href="/admin/reportes" className="text-sm font-medium text-amber-600 hover:underline">
          Ver reporte para la cocina →
        </Link>
        <Link href="/comensal" className="text-sm font-medium text-amber-600 hover:underline">
          Vista del comensal →
        </Link>
      </div>
    </>
  )
}
