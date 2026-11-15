import 'server-only'
import { prisma } from './prisma'

export async function getEvent() {
  return prisma.event.findFirst({ orderBy: { createdAt: 'asc' } })
}

export async function getMenu(eventId: string) {
  return prisma.category.findMany({
    where: { eventId },
    orderBy: { sortOrder: 'asc' },
    include: {
      dishes: {
        where: { active: true },
        orderBy: [{ subgroup: 'asc' }, { name: 'asc' }],
      },
    },
  })
}

export async function getAttendees(eventId: string) {
  return prisma.attendee.findMany({
    where: { eventId },
    orderBy: { name: 'asc' },
  })
}

export async function getAttendee(id: string) {
  return prisma.attendee.findUnique({ where: { id } })
}

export async function getActivePairing(eventId: string, attendeeId: string) {
  return prisma.pairing.findFirst({
    where: {
      eventId,
      status: { in: ['PENDING', 'CONFIRMED'] },
      OR: [{ initiatorId: attendeeId }, { partnerId: attendeeId }],
    },
    include: { dish: true, initiator: true, partner: true },
    orderBy: { createdAt: 'desc' },
  })
}

export async function getOrderItems(attendeeId: string) {
  return prisma.orderItem.findMany({
    where: { attendeeId },
    include: { dish: true, category: true },
  })
}

/** Asistentes que no tienen una pareja activa (candidatos para compartir entrada). */
export async function getAvailablePartners(eventId: string, attendeeId: string) {
  const attendees = await prisma.attendee.findMany({
    where: { eventId, id: { not: attendeeId } },
    orderBy: { name: 'asc' },
  })
  const busy = await prisma.pairing.findMany({
    where: { eventId, status: { in: ['PENDING', 'CONFIRMED'] } },
    select: { initiatorId: true, partnerId: true },
  })
  const busyIds = new Set<string>()
  for (const p of busy) {
    busyIds.add(p.initiatorId)
    busyIds.add(p.partnerId)
  }
  return attendees.filter((a) => !busyIds.has(a.id))
}

/** Menú completo (incluye platos inactivos) para el panel administrativo. */
export async function getMenuForAdmin(eventId: string) {
  return prisma.category.findMany({
    where: { eventId },
    orderBy: { sortOrder: 'asc' },
    include: {
      dishes: {
        orderBy: [{ subgroup: 'asc' }, { name: 'asc' }],
      },
    },
  })
}

/** Emparejamientos activos del evento (pendientes y confirmados). */
export async function getPairings(eventId: string) {
  return prisma.pairing.findMany({
    where: { eventId, status: { in: ['PENDING', 'CONFIRMED'] } },
    include: { dish: true, initiator: true, partner: true },
    orderBy: { createdAt: 'desc' },
  })
}

/** Pedidos de todos los asistentes para el reporte consolidado. */
export async function getReport(eventId: string) {
  return prisma.attendee.findMany({
    where: { eventId },
    orderBy: { name: 'asc' },
    include: {
      orderItems: {
        include: { dish: true, category: true },
      },
    },
  })
}
