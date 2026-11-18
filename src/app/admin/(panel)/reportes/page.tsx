import { getEvent, getPairings, getReport } from '@/lib/data'
import { buildAttendeeRows, buildKitchenRows } from '@/lib/report'
import { formatCOP } from '@/lib/format'
import { Badge, Card, PageHeader } from '@/components/ui'
import { PrintButton } from '@/components/action-form'

export const dynamic = 'force-dynamic'

const exportLinkClass =
  'inline-flex items-center justify-center rounded-full border border-ivory/20 px-4 py-2 text-sm font-medium tracking-wide text-ivory transition-all duration-300 hover:border-ivory/45 hover:bg-ivory/5'

export default async function ReportesPage() {
  const event = await getEvent()
  if (!event) {
    return (
      <Card>
        <p className="text-sm text-bombay-400">No hay evento configurado.</p>
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
        eyebrow="Cocina"
        title="Reporte para la cocina"
        subtitle={`${attendees.length} comensales · ${confirmed} pedidos confirmados · total ${formatCOP(total)}`}
        action={
          <div className="flex flex-wrap gap-2 print:hidden">
            <a href="/admin/reportes/export?tipo=pedidos" className={exportLinkClass}>
              Exportar pedidos (CSV)
            </a>
            <a href="/admin/reportes/export?tipo=cocina" className={exportLinkClass}>
              Exportar cocina (CSV)
            </a>
            <PrintButton />
          </div>
        }
      />

      <p className="mb-4 text-xs text-pearl sm:hidden">
        Desliza las tablas horizontalmente para ver todas las columnas.
      </p>

      <Card className="print-plain mb-6 p-6">
        <h2 className="mb-4 font-display text-xl text-ivory">Consolidado de cocina</h2>
        {kitchen.length === 0 ? (
          <p className="text-sm text-pearl">Aún no hay pedidos registrados.</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-ivory/10 text-left text-[11px] uppercase tracking-[0.16em] text-pearl/80">
                  <th className="py-2.5 pr-4 font-semibold">Categoría</th>
                  <th className="py-2.5 pr-4 font-semibold">Plato / bebida</th>
                  <th className="py-2.5 pr-4 text-right font-semibold">Precio unit.</th>
                  <th className="py-2.5 pr-4 text-right font-semibold">Cantidad</th>
                  <th className="py-2.5 text-right font-semibold">Subtotal</th>
                </tr>
              </thead>
              <tbody>
                {kitchen.map((row) => (
                  <tr
                    key={`${row.category}-${row.name}`}
                    className="border-b border-ivory/8 last:border-0"
                  >
                    <td className="py-2.5 pr-4 text-pearl">{row.category}</td>
                    <td className="py-2.5 pr-4 font-medium text-ivory">{row.name}</td>
                    <td className="py-2.5 pr-4 text-right text-pearl">{formatCOP(row.price)}</td>
                    <td className="py-2.5 pr-4 text-right font-semibold text-ivory">{row.qty}</td>
                    <td className="py-2.5 text-right text-ivory">{formatCOP(row.subtotal)}</td>
                  </tr>
                ))}
              </tbody>
              <tfoot>
                <tr className="border-t border-ivory/15">
                  <td className="py-3 font-display text-base text-ivory" colSpan={4}>
                    Total
                  </td>
                  <td className="py-3 text-right font-display text-base text-gold-400">
                    {formatCOP(kitchenTotal)}
                  </td>
                </tr>
              </tfoot>
            </table>
          </div>
        )}
      </Card>

      <Card className="print-plain p-6">
        <h2 className="mb-4 font-display text-xl text-ivory">Pedidos por comensal</h2>
        {rows.length === 0 ? (
          <p className="text-sm text-pearl">Aún no hay comensales.</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-ivory/10 text-left text-[11px] uppercase tracking-[0.16em] text-pearl/80">
                  <th className="py-2.5 pr-4 font-semibold">Comensal</th>
                  <th className="py-2.5 pr-4 font-semibold">Entrada (parte)</th>
                  <th className="py-2.5 pr-4 font-semibold">Plato fuerte</th>
                  <th className="py-2.5 pr-4 font-semibold">Bebida</th>
                  <th className="py-2.5 pr-4 text-right font-semibold">Total</th>
                  <th className="py-2.5 font-semibold">Estado</th>
                </tr>
              </thead>
              <tbody>
                {rows.map(({ attendee, entrada, plato, bebida, budget }) => (
                  <tr
                    key={attendee.id}
                    className="border-b border-ivory/8 align-top last:border-0"
                  >
                    <td className="py-2.5 pr-4">
                      <div className="font-medium text-ivory">{attendee.name}</div>
                      <div className="text-xs text-pearl">
                        Límite {formatCOP(attendee.limitAmount)}
                        {pairingByAttendee.get(attendee.id)
                          ? ` · con ${pairingByAttendee.get(attendee.id)}`
                          : ""}
                      </div>
                    </td>
                    <td className="py-2.5 pr-4">
                      {entrada ? (
                        <div className="text-ivory">
                          {entrada.dish.name}
                          <div className="text-xs text-pearl">
                            {formatCOP(Math.round(entrada.price * entrada.shareFactor))}
                          </div>
                        </div>
                      ) : (
                        <span className="text-pearl/50">—</span>
                      )}
                    </td>
                    <td className="py-2.5 pr-4">
                      {plato ? (
                        <div className="text-ivory">
                          {plato.dish.name}
                          <div className="text-xs text-pearl">{formatCOP(plato.price)}</div>
                        </div>
                      ) : (
                        <span className="text-pearl/50">—</span>
                      )}
                    </td>
                    <td className="py-2.5 pr-4">
                      {bebida ? (
                        <div className="text-ivory">
                          {bebida.dish.name}
                          <div className="text-xs text-pearl">{formatCOP(bebida.price)}</div>
                        </div>
                      ) : (
                        <span className="text-pearl/50">—</span>
                      )}
                    </td>
                    <td className="py-2.5 pr-4 text-right">
                      <div className="font-semibold text-ivory">{formatCOP(budget.total)}</div>
                      <div
                        className={
                          budget.remaining < 0
                            ? "text-xs text-bombay-400"
                            : "text-xs text-pearl"
                        }
                      >
                        {formatCOP(budget.remaining)} disp.
                      </div>
                    </td>
                    <td className="py-2.5">
                      {attendee.orderConfirmedAt ? (
                        <Badge tone="green">Confirmado</Badge>
                      ) : (
                        <Badge>Pendiente</Badge>
                      )}
                      {!budget.withinBudget ? (
                        <div className="mt-1.5">
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
