import { readFile, stat } from 'node:fs/promises'
import path from 'node:path'
import { EXT_TO_TYPE, UPLOAD_DIR, isSafeFileName } from '@/lib/uploads'

export const dynamic = 'force-dynamic'

/**
 * Sirve las imágenes del menú leídas del disco en cada petición.
 *
 * No se pueden dejar en `public/` porque `next start` congela ese directorio al
 * arrancar y las imágenes nuevas darían 404 hasta reiniciar. Este handler evita
 * ese problema: la imagen recién subida se ve de inmediato.
 */
export async function GET(
  _request: Request,
  { params }: { params: Promise<{ file: string }> },
) {
  const { file } = await params

  if (!isSafeFileName(file)) {
    return new Response('No encontrado', { status: 404 })
  }

  const ext = path.extname(file).slice(1).toLowerCase()
  const contentType = EXT_TO_TYPE[ext]
  if (!contentType) {
    return new Response('No encontrado', { status: 404 })
  }

  const fullPath = path.join(UPLOAD_DIR, file)
  try {
    const info = await stat(fullPath)
    if (!info.isFile()) return new Response('No encontrado', { status: 404 })
    const data = await readFile(fullPath)
    return new Response(new Uint8Array(data), {
      headers: {
        'Content-Type': contentType,
        'Content-Length': String(info.size),
        // Los archivos subidos llevan nombre UUID (inmutable); una hora basta.
        'Cache-Control': 'public, max-age=3600',
      },
    })
  } catch {
    return new Response('No encontrado', { status: 404 })
  }
}
