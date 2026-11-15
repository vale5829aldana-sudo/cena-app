'use server'

import { redirect } from 'next/navigation'
import { revalidatePath } from 'next/cache'
import { prisma } from '@/lib/prisma'
import { clearSession, getSession, setSession } from '@/lib/auth'
import { computeBudget, SOLO_ENTRADA_FACTOR } from '@/lib/domain'

export type ActionResult = { ok: boolean; error?: string }

const PATH = '/comensal/pedido'

async function loadAttendee() {
  const session = await getSession()
  if (!session || session.role !== 'attendee') return null
  return prisma.attendee.findUnique({
    where: { id: session.attendeeId },
    include: { event: true },
  })
}

function fail(error: string): ActionResult {
  return { ok: false, error }
}

export async function selectAttendee(formData: FormData) {
  const attendeeId = String(formData.get('attendeeId') ?? '')
  const attendee = await prisma.attendee.findUnique({ where: { id: attendeeId } })
  if (!attendee) return
  await setSession({ role: 'attendee', attendeeId: attendee.id })
  redirect(PATH)
}

export async function signOutAttendee() {
  await clearSession()
  redirect('/comensal')
}

export async function createPairing(
  entradaDishId: string,
  partnerId: string,
): Promise<ActionResult> {
  const me = await loadAttendee()
  if (!me) return fail('Sesión no válida.')
  if (me.event.status !== 'OPEN') return fail('El evento está cerrado.')
  if (partnerId === me.id) return fail('No puedes compartir contigo mismo.')

  const dish = await prisma.dish.findUnique({
    where: { id: entradaDishId },
    include: { category: true },
  })
  if (!dish || !dish.active) return fail('Entrada no disponible.')
  if (!dish.category.shareable) return fail('Esta categoría no se comparte.')

  const partner = await prisma.attendee.findUnique({ where: { id: partnerId } })
  if (!partner || partner.eventId !== me.eventId) return fail('Compañero no válido.')

  const busy = await prisma.pairing.findFirst({
    where: {
      eventId: me.eventId,
      status: { in: ['PENDING', 'CONFIRMED'] },
      OR: [
        { initiatorId: me.id },
        { partnerId: me.id },
        { initiatorId: partnerId },
        { partnerId: partnerId },
      ],
    },
  })
  if (busy) return fail('Tú o tu compañero ya tienen una entrada compartida.')

  await prisma.pairing.create({
    data: {
      eventId: me.eventId,
      dishId: dish.id,
      initiatorId: me.id,
      partnerId,
      status: 'PENDING',
    },
  })
  revalidatePath(PATH)
  return { ok: true }
}

export async function cancelPairing(pairingId: string): Promise<ActionResult> {
  const me = await loadAttendee()
  if (!me) return fail('Sesión no válida.')

  const pairing = await prisma.pairing.findUnique({ where: { id: pairingId } })
  if (!pairing || pairing.initiatorId !== me.id || pairing.status !== 'PENDING') {
    return fail('No puedes cancelar esta propuesta.')
  }
  await prisma.pairing.update({
    where: { id: pairingId },
    data: { status: 'CANCELLED' },
  })
  revalidatePath(PATH)
  return { ok: true }
}

export async function respondPairing(
  pairingId: string,
  accept: boolean,
): Promise<ActionResult> {
  const me = await loadAttendee()
  if (!me) return fail('Sesión no válida.')
  if (me.event.status !== 'OPEN') return fail('El evento está cerrado.')

  const pairing = await prisma.pairing.findUnique({
    where: { id: pairingId },
    include: { dish: true },
  })
  if (!pairing || pairing.partnerId !== me.id || pairing.status !== 'PENDING') {
    return fail('Propuesta no válida.')
  }

  if (!accept) {
    await prisma.pairing.update({
      where: { id: pairingId },
      data: { status: 'REJECTED' },
    })
    revalidatePath(PATH)
    return { ok: true }
  }

  await prisma.$transaction([
    prisma.pairing.update({
      where: { id: pairingId },
      data: { status: 'CONFIRMED', confirmedAt: new Date() },
    }),
    prisma.orderItem.upsert({
      where: {
        attendeeId_categoryId: {
          attendeeId: pairing.initiatorId,
          categoryId: pairing.dish.categoryId,
        },
      },
      create: {
        attendeeId: pairing.initiatorId,
        categoryId: pairing.dish.categoryId,
        dishId: pairing.dishId,
        pairingId: pairing.id,
        price: pairing.dish.price,
        shareFactor: 0.5,
      },
      update: {
        dishId: pairing.dishId,
        pairingId: pairing.id,
        price: pairing.dish.price,
        shareFactor: 0.5,
      },
    }),
    prisma.orderItem.upsert({
      where: {
        attendeeId_categoryId: {
          attendeeId: pairing.partnerId,
          categoryId: pairing.dish.categoryId,
        },
      },
      create: {
        attendeeId: pairing.partnerId,
        categoryId: pairing.dish.categoryId,
        dishId: pairing.dishId,
        pairingId: pairing.id,
        price: pairing.dish.price,
        shareFactor: 0.5,
      },
      update: {
        dishId: pairing.dishId,
        pairingId: pairing.id,
        price: pairing.dish.price,
        shareFactor: 0.5,
      },
    }),
  ])

  revalidatePath(PATH)
  return { ok: true }
}

export async function setDishSelection(
  categoryId: string,
  dishId: string,
): Promise<ActionResult> {
  const me = await loadAttendee()
  if (!me) return fail('Sesión no válida.')
  if (me.event.status !== 'OPEN') return fail('El evento está cerrado.')

  const dish = await prisma.dish.findUnique({
    where: { id: dishId },
    include: { category: true },
  })
  if (!dish || !dish.active || dish.categoryId !== categoryId) {
    return fail('Plato no disponible.')
  }
  if (dish.category.shareable) {
    return fail('La entrada se elige al compartir con tu compañero.')
  }

  await prisma.orderItem.upsert({
    where: { attendeeId_categoryId: { attendeeId: me.id, categoryId } },
    create: {
      attendeeId: me.id,
      categoryId,
      dishId: dish.id,
      price: dish.price,
      shareFactor: 1,
    },
    update: { dishId: dish.id, price: dish.price, shareFactor: 1 },
  })

  revalidatePath(PATH)
  return { ok: true }
}

export async function clearDishSelection(categoryId: string): Promise<ActionResult> {
  const me = await loadAttendee()
  if (!me) return fail('Sesión no válida.')
  if (me.event.status !== 'OPEN') return fail('El evento está cerrado.')
  await prisma.orderItem.deleteMany({
    where: { attendeeId: me.id, categoryId },
  })
  revalidatePath(PATH)
  return { ok: true }
}

/** Comprueba si el comensal tiene una entrada compartida activa. */
async function hasActivePairing(eventId: string, attendeeId: string) {
  return prisma.pairing.findFirst({
    where: {
      eventId,
      status: { in: ['PENDING', 'CONFIRMED'] },
      OR: [{ initiatorId: attendeeId }, { partnerId: attendeeId }],
    },
  })
}

/**
 * RN-6 (respaldo): el comensal toma la entrada solo y paga el 100 %.
 * Solo se permite si no tiene una entrada compartida activa.
 */
export async function setSoloEntrada(entradaDishId: string): Promise<ActionResult> {
  const me = await loadAttendee()
  if (!me) return fail('Sesión no válida.')
  if (me.event.status !== 'OPEN') return fail('El evento está cerrado.')
  if (await hasActivePairing(me.eventId, me.id)) {
    return fail('Ya tienes una entrada compartida activa.')
  }

  const dish = await prisma.dish.findUnique({
    where: { id: entradaDishId },
    include: { category: true },
  })
  if (!dish || !dish.active) return fail('Entrada no disponible.')
  if (!dish.category.shareable) return fail('Esta categoría no es una entrada.')

  await prisma.orderItem.upsert({
    where: { attendeeId_categoryId: { attendeeId: me.id, categoryId: dish.categoryId } },
    create: {
      attendeeId: me.id,
      categoryId: dish.categoryId,
      dishId: dish.id,
      price: dish.price,
      shareFactor: SOLO_ENTRADA_FACTOR,
    },
    update: { dishId: dish.id, price: dish.price, shareFactor: SOLO_ENTRADA_FACTOR, pairingId: null },
  })

  revalidatePath(PATH)
  return { ok: true }
}

/** Quita la entrada individual (solo si no hay una entrada compartida). */
export async function clearSoloEntrada(): Promise<ActionResult> {
  const me = await loadAttendee()
  if (!me) return fail('Sesión no válida.')
  if (me.event.status !== 'OPEN') return fail('El evento está cerrado.')
  if (await hasActivePairing(me.eventId, me.id)) {
    return fail('Tu entrada está compartida con otra persona.')
  }

  const cat = await prisma.category.findFirst({
    where: { eventId: me.eventId, shareable: true },
  })
  if (cat) {
    await prisma.orderItem.deleteMany({ where: { attendeeId: me.id, categoryId: cat.id } })
  }
  revalidatePath(PATH)
  return { ok: true }
}

export async function confirmOrder(): Promise<ActionResult> {
  const me = await loadAttendee()
  if (!me) return fail('Sesión no válida.')
  if (me.event.status !== 'OPEN') return fail('El evento está cerrado.')

  const items = await prisma.orderItem.findMany({
    where: { attendeeId: me.id },
    include: { dish: true, category: true },
  })
  const entrada = items.find((i) => i.category.shareable)
  const plato = items.find((i) => i.category.slug === 'platos-fuertes')
  const bebida = items.find((i) => i.category.slug === 'bebidas')

  if (!entrada) return fail('Debes elegir tu entrada (compartida o individual).')
  if (!plato) return fail('Debes elegir un plato fuerte.')
  if (!bebida) return fail('Debes elegir una bebida.')

  const budget = computeBudget({
    limit: me.limitAmount,
    entradaPrice: entrada.price,
    entradaShareFactor: entrada.shareFactor,
    platoPrice: plato.price,
    bebidaPrice: bebida.price,
  })
  if (!budget.withinBudget) {
    return fail(
      `Te pasas del límite por ${budget.remaining < 0 ? Math.abs(budget.remaining) : 0}.`,
    )
  }

  await prisma.attendee.update({
    where: { id: me.id },
    data: { orderConfirmedAt: new Date() },
  })
  revalidatePath(PATH)
  return { ok: true }
}

export async function resetOrder(): Promise<ActionResult> {
  const me = await loadAttendee()
  if (!me) return fail('Sesión no válida.')
  if (me.event.status !== 'OPEN') return fail('El evento está cerrado.')

  await prisma.$transaction([
    prisma.orderItem.deleteMany({ where: { attendeeId: me.id } }),
    prisma.pairing.updateMany({
      where: {
        status: { in: ['PENDING', 'CONFIRMED'] },
        OR: [{ initiatorId: me.id }, { partnerId: me.id }],
      },
      data: { status: 'CANCELLED' },
    }),
    prisma.attendee.update({
      where: { id: me.id },
      data: { orderConfirmedAt: null },
    }),
  ])
  revalidatePath(PATH)
  return { ok: true }
}
