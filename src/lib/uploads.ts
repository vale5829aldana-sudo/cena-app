import 'server-only'
import { mkdir, unlink, writeFile } from 'node:fs/promises'
import path from 'node:path'
import { randomUUID } from 'node:crypto'

/**
 * Directorio de las imágenes del menú subidas desde el panel.
 *
 * Vive fuera de `public/` a propósito: `next start` congela el listado de
 * `public/` al arrancar, así que cualquier archivo nuevo daría 404 hasta
 * reiniciar el servidor. Sirviéndolas por un Route Handler (`/uploads/[file]`)
 * que lee del disco en cada petición, las imágenes aparecen de inmediato.
 */
export const UPLOAD_DIR = path.join(process.cwd(), 'data', 'uploads')

/** Ruta pública con la que se referencian las imágenes. */
export const UPLOAD_URL_PREFIX = '/uploads/'

export const MAX_IMAGE_BYTES = 4 * 1024 * 1024

/** Tipos aceptados al subir: MIME → extensión. */
export const IMAGE_TYPES: Record<string, string> = {
  'image/jpeg': 'jpg',
  'image/png': 'png',
  'image/webp': 'webp',
  'image/gif': 'gif',
  'image/avif': 'avif',
}

/** Extensión → tipo de contenido, para servir el archivo. */
export const EXT_TO_TYPE: Record<string, string> = {
  jpg: 'image/jpeg',
  jpeg: 'image/jpeg',
  png: 'image/png',
  webp: 'image/webp',
  gif: 'image/gif',
  avif: 'image/avif',
}

/** Acepta solo nombres de archivo simples (sin rutas ni traversal). */
export function isSafeFileName(name: string): boolean {
  return /^[A-Za-z0-9._-]+$/.test(name) && !name.includes('..')
}

/** Extrae el nombre de archivo de una URL de subida, o null si no aplica. */
export function uploadNameFromUrl(url: string | null | undefined): string | null {
  if (!url || !url.startsWith(UPLOAD_URL_PREFIX)) return null
  const name = url.slice(UPLOAD_URL_PREFIX.length)
  return isSafeFileName(name) ? name : null
}

/** Guarda la imagen recibida y devuelve su URL pública (o null si no se envió). */
export async function saveImage(file: FormDataEntryValue | null): Promise<string | null> {
  if (!file || typeof file === 'string' || file.size === 0) return null
  const ext = IMAGE_TYPES[file.type]
  if (!ext) throw new Error('Formato no permitido. Usa JPG, PNG, WEBP, GIF o AVIF.')
  if (file.size > MAX_IMAGE_BYTES) throw new Error('La imagen supera los 4 MB.')
  await mkdir(UPLOAD_DIR, { recursive: true })
  const filename = `${randomUUID()}.${ext}`
  await writeFile(path.join(UPLOAD_DIR, filename), Buffer.from(await file.arrayBuffer()))
  return `${UPLOAD_URL_PREFIX}${filename}`
}

/** Borra una imagen subida previamente (si la URL apunta al almacén). */
export async function removeUpload(url: string | null | undefined) {
  const name = uploadNameFromUrl(url)
  if (!name) return
  try {
    await unlink(path.join(UPLOAD_DIR, name))
  } catch {
    // El archivo pudo haber sido borrado manualmente; no es crítico.
  }
}
