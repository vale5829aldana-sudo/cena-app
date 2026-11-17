'use server'

import { redirect } from 'next/navigation'
import { revalidatePath } from 'next/cache'
import { prisma } from '@/lib/prisma'
import {
  clearSession,
  getAdminSession,
  setSession,
  verifyPassword,
  hashPassword,
} from '@/lib/auth'
import type { ActionState } from '@/lib/action-state'
import { removeUpload, saveImage } from '@/lib/uploads'

function fail(error: string): ActionState {
  return { ok: false, error }
}

function ok(message?: string): ActionState {
  return { ok: true, message }
}

async function guard(): Promise<boolean> {
  return (await getAdminSession()) !== null
}

async function getEvent() {
  return prisma.event.findFirst({ orderBy: { createdAt: 'asc' } })
}

function text(value: FormDataEntryValue | null): string {
  return String(value ?? '').trim()
}

function int(value: FormDataEntryValue | null): number {
  const cleaned = String(value ?? '').replace(/[^\d]/g, '')
  if (!cleaned) return Number.NaN
  return Number.parseInt(cleaned, 10)
}

function bool(value: FormDataEntryValue | null): boolean {
  const v = String(value ?? '').toLowerCase()
  return v === 'on' || v === 'true' || v === '1'
}

function revalidateAdmin() {
  revalidatePath('/admin')
  revalidatePath('/admin/asistentes')
  revalidatePath('/admin/menu')
  revalidatePath('/admin/config')
  revalidatePath('/admin/reportes')
  revalidatePath('/comensal')
}

/* ------------------------------------------------------------------ */
/* Autenticación                                                       */
/* ------------------------------------------------------------------ */

export async function login(_state: ActionState | null, formData: FormData): Promise<ActionState> {
  const username = text(formData.get('username'))
  const password = String(formData.get('password') ?? '')
  if (!username || !password) return fail('Ingresa usuario y contraseña.')

  const user = await prisma.adminUser.findUnique({ where: { username } })
  if (!user || !verifyPassword(password, user.passwordHash)) {
    return fail('Usuario o contraseña incorrectos.')
  }
  await setSession({ role: 'admin', adminId: user.id, username: user.username })
  redirect('/admin')
}

export async function logout() {
  await clearSession()
  redirect('/admin/login')
}

export async function changePassword(
  _state: ActionState | null,
  formData: FormData,
): Promise<ActionState> {
  const session = await getAdminSession()
  if (!session) return fail('Sesión expirada.')

  const current = String(formData.get('currentPassword') ?? '')
  const next = String(formData.get('newPassword') ?? '')
  if (next.length < 6) return fail('La nueva contraseña debe tener al menos 6 caracteres.')

  const user = await prisma.adminUser.findUnique({ where: { id: session.adminId } })
  if (!user || !verifyPassword(current, user.passwordHash)) {
    return fail('La contraseña actual no es correcta.')
  }
  await prisma.adminUser.update({
    where: { id: user.id },
    data: { passwordHash: hashPassword(next) },
  })
  return ok('Contraseña actualizada.')
}

/* ------------------------------------------------------------------ */
/* Asistentes                                                          */
/* ------------------------------------------------------------------ */

export async function createAttendee(
  _state: ActionState | null,
  formData: FormData,
): Promise<ActionState> {
  if (!(await guard())) return fail('Sesión expirada.')
  const event = await getEvent()
  if (!event) return fail('No hay evento configurado.')

  const name = text(formData.get('name'))
  if (!name) return fail('El nombre es obligatorio.')

  const rawLimit = text(formData.get('limitAmount'))
  let limitAmount = event.defaultLimit
  if (rawLimit) {
    limitAmount = int(rawLimit)
    if (!Number.isFinite(limitAmount) || limitAmount <= 0) {
      return fail('El límite debe ser un número mayor a 0.')
    }
  }

  const dup = await prisma.attendee.findFirst({ where: { eventId: event.id, name } })
  if (dup) return fail('Ya existe un asistente con ese nombre.')

  await prisma.attendee.create({ data: { eventId: event.id, name, limitAmount } })
  revalidateAdmin()
  return ok('Asistente agregado.')
}

export async function updateAttendee(
  _state: ActionState | null,
  formData: FormData,
): Promise<ActionState> {
  if (!(await guard())) return fail('Sesión expirada.')
  const id = text(formData.get('id'))
  const name = text(formData.get('name'))
  const limitAmount = int(formData.get('limitAmount'))
  if (!id) return fail('Asistente no válido.')
  if (!name) return fail('El nombre es obligatorio.')
  if (!Number.isFinite(limitAmount) || limitAmount <= 0) {
    return fail('El límite debe ser un número mayor a 0.')
  }

  const current = await prisma.attendee.findUnique({ where: { id } })
  if (!current) return fail('Asistente no encontrado.')

  const dup = await prisma.attendee.findFirst({
    where: { eventId: current.eventId, name, id: { not: id } },
  })
  if (dup) return fail('Ya existe otro asistente con ese nombre.')

  await prisma.attendee.update({ where: { id }, data: { name, limitAmount } })
  revalidateAdmin()
  return ok('Asistente actualizado.')
}

export async function deleteAttendee(
  _state: ActionState | null,
  formData: FormData,
): Promise<ActionState> {
  if (!(await guard())) return fail('Sesión expirada.')
  const id = text(formData.get('id'))
  if (!id) return fail('Asistente no válido.')

  const used = await prisma.pairing.count({
    where: { status: { in: ['PENDING', 'CONFIRMED'] }, OR: [{ initiatorId: id }, { partnerId: id }] },
  })
  if (used > 0) {
    return fail('Este asistente tiene una entrada compartida activa. Cancélala primero.')
  }

  await prisma.attendee.delete({ where: { id } })
  revalidateAdmin()
  return ok('Asistente eliminado.')
}

/* ------------------------------------------------------------------ */
/* Configuración del evento                                            */
/* ------------------------------------------------------------------ */

export async function updateEvent(
  _state: ActionState | null,
  formData: FormData,
): Promise<ActionState> {
  if (!(await guard())) return fail('Sesión expirada.')
  const event = await getEvent()
  if (!event) return fail('No hay evento configurado.')

  const name = text(formData.get('name')) || event.name
  const defaultLimit = int(formData.get('defaultLimit'))
  if (!Number.isFinite(defaultLimit) || defaultLimit <= 0) {
    return fail('El límite por defecto debe ser mayor a 0.')
  }

  const applyToAll = bool(formData.get('applyLimitToAll'))

  await prisma.$transaction(async (tx) => {
    await tx.event.update({ where: { id: event.id }, data: { name, defaultLimit } })
    if (applyToAll) {
      await tx.attendee.updateMany({ where: { eventId: event.id }, data: { limitAmount: defaultLimit } })
    }
  })

  revalidateAdmin()
  return ok(applyToAll ? 'Configuración guardada y límites actualizados.' : 'Configuración guardada.')
}

export async function setEventStatus(
  _state: ActionState | null,
  formData: FormData,
): Promise<ActionState> {
  if (!(await guard())) return fail('Sesión expirada.')
  const event = await getEvent()
  if (!event) return fail('No hay evento configurado.')

  const status = text(formData.get('status'))
  if (status !== 'OPEN' && status !== 'CLOSED') return fail('Estado no válido.')

  await prisma.event.update({
    where: { id: event.id },
    data: { status, closedAt: status === 'CLOSED' ? new Date() : null },
  })
  revalidateAdmin()
  return ok(status === 'CLOSED' ? 'Evento cerrado. Los comensales ya no pueden editar.' : 'Evento abierto.')
}

export async function updateCategory(
  _state: ActionState | null,
  formData: FormData,
): Promise<ActionState> {
  if (!(await guard())) return fail('Sesión expirada.')
  const id = text(formData.get('id'))
  const name = text(formData.get('name'))
  const maxPrice = int(formData.get('maxPrice'))
  if (!id) return fail('Categoría no válida.')
  if (!name) return fail('El nombre es obligatorio.')
  if (!Number.isFinite(maxPrice) || maxPrice <= 0) return fail('El tope debe ser mayor a 0.')

  await prisma.category.update({ where: { id }, data: { name, maxPrice } })
  revalidateAdmin()
  return ok('Categoría actualizada.')
}

/* ------------------------------------------------------------------ */
/* Platos y bebidas                                                    */
/* ------------------------------------------------------------------ */

export async function createDish(
  _state: ActionState | null,
  formData: FormData,
): Promise<ActionState> {
  if (!(await guard())) return fail('Sesión expirada.')

  const categoryId = text(formData.get('categoryId'))
  const name = text(formData.get('name'))
  const description = text(formData.get('description'))
  const price = int(formData.get('price'))
  const subgroup = text(formData.get('subgroup')) || null

  if (!categoryId) return fail('Selecciona una categoría.')
  if (!name) return fail('El nombre es obligatorio.')
  if (!description) return fail('La descripción es obligatoria.')
  if (!Number.isFinite(price) || price <= 0) return fail('El precio debe ser mayor a 0.')

  const category = await prisma.category.findUnique({ where: { id: categoryId } })
  if (!category) return fail('Categoría no encontrada.')
  if (price > category.maxPrice) {
    return fail(`El precio supera el tope de ${category.name}.`)
  }

  let imageUrl: string | null = null
  try {
    imageUrl = await saveImage(formData.get('image'))
  } catch (error) {
    return fail(error instanceof Error ? error.message : 'No se pudo subir la imagen.')
  }

  await prisma.dish.create({
    data: {
      categoryId,
      name,
      description,
      price,
      imageUrl,
      subgroup,
      isVegetarian: bool(formData.get('isVegetarian')),
      isVegan: bool(formData.get('isVegan')),
    },
  })
  revalidateAdmin()
  return ok('Plato agregado.')
}

export async function updateDish(
  _state: ActionState | null,
  formData: FormData,
): Promise<ActionState> {
  if (!(await guard())) return fail('Sesión expirada.')

  const id = text(formData.get('id'))
  if (!id) return fail('Plato no válido.')
  const dish = await prisma.dish.findUnique({ where: { id }, include: { category: true } })
  if (!dish) return fail('Plato no encontrado.')

  const name = text(formData.get('name'))
  const description = text(formData.get('description'))
  const price = int(formData.get('price'))
  const subgroup = text(formData.get('subgroup')) || null

  if (!name) return fail('El nombre es obligatorio.')
  if (!description) return fail('La descripción es obligatoria.')
  if (!Number.isFinite(price) || price <= 0) return fail('El precio debe ser mayor a 0.')
  if (price > dish.category.maxPrice) {
    return fail(`El precio supera el tope de ${dish.category.name}.`)
  }

  let imageUrl = dish.imageUrl
  try {
    const uploaded = await saveImage(formData.get('image'))
    if (uploaded) {
      await removeUpload(dish.imageUrl)
      imageUrl = uploaded
    }
  } catch (error) {
    return fail(error instanceof Error ? error.message : 'No se pudo subir la imagen.')
  }

  await prisma.dish.update({
    where: { id },
    data: {
      name,
      description,
      price,
      imageUrl,
      subgroup,
      isVegetarian: bool(formData.get('isVegetarian')),
      isVegan: bool(formData.get('isVegan')),
    },
  })
  revalidateAdmin()
  return ok('Plato actualizado.')
}

export async function toggleDishActive(
  _state: ActionState | null,
  formData: FormData,
): Promise<ActionState> {
  if (!(await guard())) return fail('Sesión expirada.')
  const id = text(formData.get('id'))
  if (!id) return fail('Plato no válido.')
  const dish = await prisma.dish.findUnique({ where: { id } })
  if (!dish) return fail('Plato no encontrado.')

  await prisma.dish.update({ where: { id }, data: { active: !dish.active } })
  revalidateAdmin()
  return ok(dish.active ? 'Plato ocultado del menú.' : 'Plato visible en el menú.')
}

export async function deleteDish(
  _state: ActionState | null,
  formData: FormData,
): Promise<ActionState> {
  if (!(await guard())) return fail('Sesión expirada.')
  const id = text(formData.get('id'))
  if (!id) return fail('Plato no válido.')

  const dish = await prisma.dish.findUnique({
    where: { id },
    include: { _count: { select: { orderItems: true, pairings: true } } },
  })
  if (!dish) return fail('Plato no encontrado.')
  if (dish._count.orderItems > 0 || dish._count.pairings > 0) {
    return fail('Este plato tiene pedidos asociados. Desactívalo en lugar de eliminarlo.')
  }

  await prisma.dish.delete({ where: { id } })
  await removeUpload(dish.imageUrl)
  revalidateAdmin()
  return ok('Plato eliminado.')
}

/* ------------------------------------------------------------------ */
/* Emparejamiento manual (casos impares)                               */
/* ------------------------------------------------------------------ */

export async function createAdminPairing(
  _state: ActionState | null,
  formData: FormData,
): Promise<ActionState> {
  if (!(await guard())) return fail('Sesión expirada.')
  const event = await getEvent()
  if (!event) return fail('No hay evento configurado.')

  const dishId = text(formData.get('dishId'))
  const initiatorId = text(formData.get('initiatorId'))
  const partnerId = text(formData.get('partnerId'))

  if (!dishId || !initiatorId || !partnerId) return fail('Completa entrada y los dos comensales.')
  if (initiatorId === partnerId) return fail('Los dos comensales deben ser diferentes.')

  const dish = await prisma.dish.findUnique({ where: { id: dishId }, include: { category: true } })
  if (!dish || !dish.category.shareable) return fail('La entrada seleccionada no es válida.')

  const attendees = await prisma.attendee.findMany({
    where: { id: { in: [initiatorId, partnerId] }, eventId: event.id },
  })
  if (attendees.length !== 2) return fail('Los comensales deben pertenecer a este evento.')

  const busy = await prisma.pairing.findFirst({
    where: {
      eventId: event.id,
      status: { in: ['PENDING', 'CONFIRMED'] },
      OR: [
        { initiatorId: { in: [initiatorId, partnerId] } },
        { partnerId: { in: [initiatorId, partnerId] } },
      ],
    },
  })
  if (busy) return fail('Uno de los comensales ya tiene una entrada compartida activa.')

  await prisma.$transaction(async (tx) => {
    const pairing = await tx.pairing.create({
      data: {
        eventId: event.id,
        dishId: dish.id,
        initiatorId,
        partnerId,
        status: 'CONFIRMED',
        confirmedAt: new Date(),
      },
    })
    for (const attendeeId of [initiatorId, partnerId]) {
      await tx.orderItem.upsert({
        where: { attendeeId_categoryId: { attendeeId, categoryId: dish.categoryId } },
        create: {
          attendeeId,
          categoryId: dish.categoryId,
          dishId: dish.id,
          pairingId: pairing.id,
          price: dish.price,
          shareFactor: 0.5,
        },
        update: {
          dishId: dish.id,
          pairingId: pairing.id,
          price: dish.price,
          shareFactor: 0.5,
        },
      })
    }
  })

  revalidateAdmin()
  return ok('Emparejamiento creado.')
}

export async function cancelAdminPairing(
  _state: ActionState | null,
  formData: FormData,
): Promise<ActionState> {
  if (!(await guard())) return fail('Sesión expirada.')
  const id = text(formData.get('id'))
  if (!id) return fail('Emparejamiento no válido.')

  const pairing = await prisma.pairing.findUnique({ where: { id } })
  if (!pairing) return fail('Emparejamiento no encontrado.')

  await prisma.$transaction([
    prisma.pairing.update({ where: { id }, data: { status: 'CANCELLED' } }),
    prisma.orderItem.deleteMany({ where: { pairingId: id } }),
  ])
  revalidateAdmin()
  return ok('Emparejamiento cancelado.')
}
