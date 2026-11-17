import Image from 'next/image'
import Link from 'next/link'
import { redirect } from 'next/navigation'
import { getAdminSession } from '@/lib/auth'
import { Eyebrow } from '@/components/ui'
import { BrandLockup } from '@/components/brand'
import { LoginForm } from './login-form'

export const dynamic = 'force-dynamic'

export default async function AdminLoginPage() {
  const session = await getAdminSession()
  if (session) redirect('/admin')

  return (
    <main className="grid min-h-screen lg:grid-cols-2">
      {/* Panel editorial con la terraza */}
      <div className="relative hidden lg:block">
        <Image
          src="/brand/vertical.jpg"
          alt="Terraza de Bombay Rooftop"
          fill
          priority
          sizes="50vw"
          className="object-cover"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-night-950 via-night-950/65 to-midnight/35" />
        <div className="lights-bokeh absolute inset-0 opacity-40" />
        <div className="absolute inset-0 flex flex-col justify-between p-10">
          <BrandLockup href="/" subtitle="Bogotá" />
          <div className="max-w-md">
            <Eyebrow>Panel administrativo</Eyebrow>
            <p className="mt-4 font-display text-4xl leading-tight text-ivory">
              Una noche bajo las estrellas
            </p>
            <p className="mt-3 text-sm leading-relaxed text-pearl">
              Configura límites, asistentes y menú; cierra el evento y entrega el
              reporte consolidado a la cocina.
            </p>
          </div>
        </div>
      </div>

      {/* Formulario */}
      <div className="flex flex-col items-center justify-center gap-6 px-6 py-16">
        <div className="w-full max-w-sm lg:hidden">
          <BrandLockup href="/" subtitle="Panel administrativo" />
        </div>
        <LoginForm />
        <Link
          href="/"
          className="text-xs uppercase tracking-[0.28em] text-pearl transition-colors hover:text-ivory"
        >
          ← Volver al inicio
        </Link>
      </div>
    </main>
  )
}
