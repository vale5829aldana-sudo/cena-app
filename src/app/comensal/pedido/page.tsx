import { redirect } from 'next/navigation'
import { getSession } from '@/lib/auth'
import {
  getActivePairing,
  getAttendee,
  getAvailablePartners,
  getEvent,
  getMenu,
  getOrderItems,
} from '@/lib/data'
import { PedidoClient, type PedidoProps } from './pedido-client'

export const dynamic = 'force-dynamic'

export default async function PedidoPage() {
  const session = await getSession()
  if (!session || session.role !== 'attendee') redirect('/comensal')

  const event = await getEvent()
  if (!event) redirect('/')

  const attendee = await getAttendee(session.attendeeId)
  if (!attendee || attendee.eventId !== event.id) redirect('/comensal')

  const [categories, pairing, items, partners] = await Promise.all([
    getMenu(event.id),
    getActivePairing(event.id, attendee.id),
    getOrderItems(attendee.id),
    getAvailablePartners(event.id, attendee.id),
  ])

  const selections: PedidoProps['selections'] = {}
  for (const it of items) {
    selections[it.categoryId] = {
      dishId: it.dishId,
      price: it.price,
      shareFactor: it.shareFactor,
      name: it.dish.name,
    }
  }

  const pairingProp: PedidoProps['pairing'] = pairing
    ? {
        id: pairing.id,
        status: pairing.status === 'CONFIRMED' ? 'CONFIRMED' : 'PENDING',
        role: pairing.initiatorId === attendee.id ? 'initiator' : 'partner',
        dishName: pairing.dish.name,
        dishPrice: pairing.dish.price,
        otherName:
          pairing.initiatorId === attendee.id
            ? pairing.partner.name
            : pairing.initiator.name,
      }
    : null

  return (
    <PedidoClient
      status={event.status}
      attendee={{
        id: attendee.id,
        name: attendee.name,
        limitAmount: attendee.limitAmount,
        confirmed: Boolean(attendee.orderConfirmedAt),
      }}
      categories={categories.map((c) => ({
        id: c.id,
        name: c.name,
        slug: c.slug,
        shareable: c.shareable,
        maxPrice: c.maxPrice,
        dishes: c.dishes.map((d) => ({
          id: d.id,
          name: d.name,
          description: d.description,
          price: d.price,
          imageUrl: d.imageUrl,
          subgroup: d.subgroup,
          isVegetarian: d.isVegetarian,
          isVegan: d.isVegan,
        })),
      }))}
      pairing={pairingProp}
      selections={selections}
      partners={partners.map((p) => ({ id: p.id, name: p.name }))}
    />
  )
}
