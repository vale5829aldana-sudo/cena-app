import 'server-only'
import { computeBudget, type BudgetBreakdown } from './domain'

export type ReportItem = {
  dishId: string
  price: number
  shareFactor: number
  dish: { name: string }
  category: { name: string; slug: string; shareable: boolean }
}

export type ReportAttendee = {
  id: string
  name: string
  limitAmount: number
  orderConfirmedAt: Date | null
  orderItems: ReportItem[]
}

export type AttendeeRow = {
  attendee: ReportAttendee
  entrada: ReportItem | null
  plato: ReportItem | null
  bebida: ReportItem | null
  budget: BudgetBreakdown
}

/** Arma una fila de reporte por comensal con su desglose y validación de límite. */
export function buildAttendeeRows(attendees: ReportAttendee[]): AttendeeRow[] {
  return attendees.map((attendee) => {
    const entrada = attendee.orderItems.find((i) => i.category.shareable) ?? null
    const plato = attendee.orderItems.find((i) => i.category.slug === 'platos-fuertes') ?? null
    const bebida = attendee.orderItems.find((i) => i.category.slug === 'bebidas') ?? null
    const budget = computeBudget({
      limit: attendee.limitAmount,
      entradaPrice: entrada?.price ?? 0,
      platoPrice: plato?.price ?? 0,
      bebidaPrice: bebida?.price ?? 0,
    })
    return { attendee, entrada, plato, bebida, budget }
  })
}

export type KitchenRow = {
  category: string
  name: string
  price: number
  qty: number
  subtotal: number
}

/**
 * Consolida las cantidades para la cocina. Las entradas compartidas aportan
 * 0.5 por comensal, de modo que cada pareja suma 1 unidad.
 */
export function buildKitchenRows(attendees: ReportAttendee[]): KitchenRow[] {
  const map = new Map<string, KitchenRow>()
  for (const attendee of attendees) {
    for (const item of attendee.orderItems) {
      const row =
        map.get(item.dishId) ??
        { category: item.category.name, name: item.dish.name, price: item.price, qty: 0, subtotal: 0 }
      row.qty += item.shareFactor
      row.subtotal = row.price * row.qty
      map.set(item.dishId, row)
    }
  }
  return Array.from(map.values()).sort(
    (a, b) => a.category.localeCompare(b.category) || a.name.localeCompare(b.name),
  )
}
