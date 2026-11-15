import 'server-only'
import { cookies } from 'next/headers'
import { redirect } from 'next/navigation'
import {
  createHmac,
  randomBytes,
  scryptSync,
  timingSafeEqual,
} from 'node:crypto'

const COOKIE_NAME = 'cena_session'
const SECRET = process.env.SESSION_SECRET ?? 'dev-secret-change-me'

export type Session =
  | { role: 'admin'; adminId: string; username: string }
  | { role: 'attendee'; attendeeId: string }

function sign(value: string) {
  return createHmac('sha256', SECRET).update(value).digest('base64url')
}

function encode(session: Session) {
  const payload = Buffer.from(JSON.stringify(session)).toString('base64url')
  return `${payload}.${sign(payload)}`
}

function decode(token: string | undefined): Session | null {
  if (!token) return null
  const [payload, signature] = token.split('.')
  if (!payload || !signature) return null
  const expected = sign(payload)
  const a = Buffer.from(signature)
  const b = Buffer.from(expected)
  if (a.length !== b.length || !timingSafeEqual(a, b)) return null
  try {
    return JSON.parse(Buffer.from(payload, 'base64url').toString()) as Session
  } catch {
    return null
  }
}

export async function getSession(): Promise<Session | null> {
  const store = await cookies()
  return decode(store.get(COOKIE_NAME)?.value)
}

export type AdminSession = Extract<Session, { role: 'admin' }>

/** Sesión de administrador sin redirigir (para Server Actions). */
export async function getAdminSession(): Promise<AdminSession | null> {
  const session = await getSession()
  return session && session.role === 'admin' ? session : null
}

/** Devuelve la sesión de administrador o redirige al login. */
export async function requireAdmin(): Promise<AdminSession> {
  const session = await getSession()
  if (!session || session.role !== 'admin') redirect('/admin/login')
  return session
}

export async function setSession(session: Session) {
  const store = await cookies()
  store.set(COOKIE_NAME, encode(session), {
    httpOnly: true,
    sameSite: 'lax',
    path: '/',
    maxAge: 60 * 60 * 12,
  })
}

export async function clearSession() {
  const store = await cookies()
  store.delete(COOKIE_NAME)
}

export function hashPassword(password: string) {
  const salt = randomBytes(16).toString('hex')
  const hash = scryptSync(password, salt, 64).toString('hex')
  return `scrypt:${salt}:${hash}`
}

export function verifyPassword(password: string, stored: string) {
  const [scheme, salt, hash] = stored.split(':')
  if (scheme !== 'scrypt' || !salt || !hash) return false
  const derived = scryptSync(password, salt, 64)
  const expected = Buffer.from(hash, 'hex')
  return derived.length === expected.length && timingSafeEqual(derived, expected)
}
