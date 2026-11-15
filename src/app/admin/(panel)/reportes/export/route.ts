import type { NextRequest } from 'next/server'
import { getAdminSession } from '@/lib/auth'
import { getEvent, getPairings, getReport } from '@/lib/data'
import { buildAttendeeRows, buildKitchenRows } from '@/lib/report'

export const dynamic = 'force-dynamic'

function cell(value: unknown): string {
  const text = value == null ? '' : String(value)
  return `"${text.replace(/"/g, '""')}"`
}

function toCsv(rows: unknown[][]): string {
  // BOM para que Excel reconozca UTF-8; separador ';' para Excel en español.
  return '\uFEFF' + rows.map((row) => row.map(cell).join(';')).join('\r\n')
}

export async function GET(request: NextRequest) {
  const session = await getAdminSession()
  if (!session) return new Response('No autorizado', { status: 401 })

  const event = await getEvent()
  if (!event) return new Response('No hay evento configurado', { status: 404 })

  const tipo = request.nextUrl.searchParams.get('tipo') ?? 'pedidos'
  const attendees = await getReport(event.id)
  const stamp = new Date().toISOString().slice(0, 10)

  let csv: string
  let filename: string

  if (tipo === 'cocina') {
    const kitchen = buildKitchenRows(attendees)
    const rows: unknown[][] = [['Categoría', 'Plato', 'Precio unitario', 'Cantidad', 'Subtotal']]
    for (const r of kitchen) rows.push([r.category, r.name, r.price, r.qty, r.subtotal])
    rows.push(['', '', '', 'Total', kitchen.reduce((sum, r) => sum + r.subtotal, 0)])
    csv = toCsv(rows)
    filename = `cocina-${stamp}.csv`
  } else {
    const pairings = await getPairings(event.id)
    const pairingByAttendee = new Map<string, string>()
    for (const p of pairings) {
      pairingByAttendee.set(p.initiatorId, p.partner.name)
      pairingByAttendee.set(p.partnerId, p.initiator.name)
    }

    const rows: unknown[][] = [
      [
        'Comensal',
        'Límite',
        'Entrada',
        'Precio entrada (mitad)',
        'Plato fuerte',
        'Precio plato',
        'Bebida',
        'Precio bebida',
        'Total',
        'Disponible',
        'Confirmado',
        'Comparte con',
      ],
    ]
    for (const { attendee, entrada, plato, bebida, budget } of buildAttendeeRows(attendees)) {
      rows.push([
        attendee.name,
        attendee.limitAmount,
        entrada?.dish.name ?? '',
        entrada ? Math.round(entrada.price / 2) : '',
        plato?.dish.name ?? '',
        plato?.price ?? '',
        bebida?.dish.name ?? '',
        bebida?.price ?? '',
        budget.total,
        budget.remaining,
        attendee.orderConfirmedAt ? 'Sí' : 'No',
        pairingByAttendee.get(attendee.id) ?? '',
      ])
    }
    csv = toCsv(rows)
    filename = `pedidos-${stamp}.csv`
  }

  return new Response(csv, {
    headers: {
      'Content-Type': 'text/csv; charset=utf-8',
      'Content-Disposition': `attachment; filename="${filename}"`,
    },
  })
}
