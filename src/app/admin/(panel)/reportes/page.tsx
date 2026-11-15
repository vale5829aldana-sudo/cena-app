import { getEvent, getPairings, getReport } from '@/lib/data'
import { buildAttendeeRows, buildKitchenRows } from '@/lib/report'
import { formatCOP } from '@/lib/format'
import { Badge, Card, PageHeader } from '@/components/ui'
import { PrintButton } from '@/components/action-form'

export const dynamic = 'force-dynamic'

export default async function ReportesPage() {
  const event = await getEvent()
  if (!event) {
    return (
      <Card>
        <p className="text-sm text-red-600">No hay evento configurado.</p>
      </Card>
    )
  }

  const [attendees, pairings] = await Promise.all([getReport(event.id), getPairings(event.id)])
  const rows = buildAttendeeRows(attendees)
  const kitchen = buildKitchenRows(attendees)

  const pairingByAttendee = new Map<string, string>()
  for (const p of pairings) {
    pairingByAttendee.set(p.initiatorId, p.partner.name)
    pairingByAttendee.set(p.partnerId, p.initiator.name)
  }

  const total = rows.reduce((sum, r) => sum + r.budget.total, 0)
  const confirmed = attendees.filter((a) => a.orderConfirmedAt).length
  const kitchenTotal = kitchen.reduce((sum, r) => sum + r.subtotal, 0)

  return (
    <>
      <PageHeader
        title="Reporte para la cocina"
        subtitle={`${attendees.length} comensales · ${confirmed} pedidos confirmados · total ${formatCOP(total)}`}
        action={
          <div className="flex flex-wrap gap-2 print:hidden">
            <a
              href="/admin/reportes/export?tipo=pedidos"
              className="inline-flex items-center justify-center rounded-lg border border-zinc-300 bg-white px-4 py-2 text-sm font-medium text-zinc-800 hover:bg-zinc-50 dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-100"
            >
              Exportar pedidos (CSV)
            </a>
            <a
              href="/admin/reportes/export?tipo=cocina"
              className="inline-flex items-center justify-center rounded-lg border border-zinc-300 bg-white px-4 py-2 text-sm font-medium text-zinc-800 hover:bg-zinc-50 dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-100"
            >
              Exportar cocina (CSV)
            </a>
            <PrintButton />
          </div>
        }
      />

      <Card className="mb-6">
        <h2 className="mb-3 text-lg font-semibold">Consolidado de cocina</h2>
        {kitchen.length === 0 ? (
          <p className="text-sm text-zinc-500">Aún no hay pedidos registrados.</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-zinc-200 text-left text-xs uppercase tracking-wide text-zinc-500 dark:border-zinc-800">
                  <th className="py-2 pr-4">Categoría</th>
                  <th className="py-2 pr-4">Plato / bebida</th>
                  <th className="py-2 pr-4 text-right">Precio unit.</th>
                  <th className="py-2 pr-4 text-right">Cantidad</th>
                  <th className="py-2 text-right">Subtotal</th>
                </tr>
              </thead>
              <tbody>
                {kitchen.map((row) => (
                  <tr
                    key={`${row.category}-${row.name}`}
                    className="border-b border-zinc-100 last:border-0 dark:border-zinc-800/60"
                  >
                    <td className="py-2 pr-4 text-zinc-500">{row.category}</td>
                    <td className="py-2 pr-4 font-medium">{row.name}</td>
                    <td className="py-2 pr-4 text-right">{formatCOP(row.price)}</td>
                    <td className="py-2 pr-4 text-right font-semibold">{row.qty}</td>
                    <td className="py-2 text-right">{formatCOP(row.subtotal)}</td>
                  </tr>
                ))}
              </tbody>
              <tfoot>
                <tr className="border-t border-zinc-200 font-semibold dark:border-zinc-800">
                  <td className="py-2" colSpan={4}>
                    Total
                  </td>
                  <td className="py-2 text-right">{formatCOP(kitchenTotal)}</td>
                </tr>
              </tfoot>
            </table>
          </div>
        )}
      </Card>

      <Card>
        <h2 className="mb-3 text-lg font-semibold">Pedidos por comensal</h2>
        {rows.length === 0 ? (
          <p className="text-sm text-zinc-500">Aún no hay comensales.</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-zinc-200 text-left text-xs uppercase tracking-wide text-zinc-500 dark:border-zinc-800">
                  <th className="py-2 pr-4">Comensal</th>
                  <th className="py-2 pr-4">Entrada (parte)</th>
                  <th className="py-2 pr-4">Plato fuerte</th>
                  <th className="py-2 pr-4">Bebida</th>
                  <th className="py-2 pr-4 text-right">Total</th>
                  <th className="py-2">Estado</th>
                </tr>
              </thead>
              <tbody>
                {rows.map(({ attendee, entrada, plato, bebida, budget }) => (
                  <tr
                    key={attendee.id}
                    className="border-b border-zinc-100 align-top last:border-0 dark:border-zinc-800/60"
                  >
                    <td className="py-2 pr-4">
                      <div className="font-medium">{attendee.name}</div>
                      <div className="text-xs text-zinc-500">
                        Límite {formatCOP(attendee.limitAmount)}
                        {pairingByAttendee.get(attendee.id)
                          ? ` · con ${pairingByAttendee.get(attendee.id)}`
                          : ""}
                      </div>
                    </td>
                    <td className="py-2 pr-4">
                      {entrada ? (
                        <div>
                          {entrada.dish.name}
                          <div className="text-xs text-zinc-500">
                            {formatCOP(Math.round(entrada.price * entrada.shareFactor))}
                          </div>
                        </div>
                      ) : (
                        <span className="text-zinc-400">—</span>
                      )}
                    </td>
                    <td className="py-2 pr-4">
                      {plato ? (
                        <div>
                          {plato.dish.name}
                          <div className="text-xs text-zinc-500">{formatCOP(plato.price)}</div>
                        </div>
                      ) : (
                        <span className="text-zinc-400">—</span>
                      )}
                    </td>
                    <td className="py-2 pr-4">
                      {bebida ? (
                        <div>
                          {bebida.dish.name}
                          <div className="text-xs text-zinc-500">{formatCOP(bebida.price)}</div>
                        </div>
                      ) : (
                        <span className="text-zinc-400">—</span>
                      )}
                    </td>
                    <td className="py-2 pr-4 text-right">
                      <div className="font-semibold">{formatCOP(budget.total)}</div>
                      <div
                        className={
                          budget.remaining < 0 ? "text-xs text-red-600" : "text-xs text-zinc-500"
                        }
                      >
                        {formatCOP(budget.remaining)} disp.
                      </div>
                    </td>
                    <td className="py-2">
                      {attendee.orderConfirmedAt ? (
                        <Badge tone="green">Confirmado</Badge>
                      ) : (
                        <Badge>Pendiente</Badge>
                      )}
                      {!budget.withinBudget ? (
                        <div className="mt-1">
                          <Badge tone="red">Excede límite</Badge>
                        </div>
                      ) : null}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Card>
    </>
  )
}
