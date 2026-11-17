import Link from 'next/link'
import { getAttendees, getEvent } from '@/lib/data'
import { formatCOP } from '@/lib/format'
import { Badge, Card, PageHeader } from '@/components/ui'
import { BrandLockup, SiteFooter } from '@/components/brand'
import { selectAttendee } from './actions'

export const dynamic = 'force-dynamic'

export default async function ComensalPage() {
  const event = await getEvent()

  if (!event) {
    return (
      <main className="mx-auto w-full max-w-3xl px-6 py-16">
        <PageHeader
          eyebrow="Comensales"
          title="Sin evento"
          subtitle="No hay evento configurado."
        />
        <Link href="/" className="text-gold-400 transition-colors hover:text-gold-300">
          ← Volver al inicio
        </Link>
      </main>
    )
  }

  const attendees = await getAttendees(event.id)

  return (
    <main className="mx-auto w-full max-w-5xl px-6 py-8">
      <header className="flex items-center justify-between">
        <BrandLockup href="/" subtitle="Cena del evento" />
        <Link
          href="/"
          className="text-[11px] uppercase tracking-[0.28em] text-pearl transition-colors hover:text-ivory"
        >
          Inicio
        </Link>
      </header>

      <div className="mt-12">
        <PageHeader
          eyebrow="Bienvenido"
          title="¿Quién eres?"
          subtitle="Selecciona tu nombre para armar tu pedido de la noche."
          action={
            <Badge tone={event.status === 'OPEN' ? 'green' : 'red'}>
              {event.status === 'OPEN' ? 'Evento abierto' : 'Evento cerrado'}
            </Badge>
          }
        />
      </div>

      {attendees.length === 0 ? (
        <Card>
          <p className="text-sm text-pearl">
            Aún no hay asistentes cargados. El administrador debe agregarlos en el
            panel.
          </p>
        </Card>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {attendees.map((a) => (
            <form key={a.id} action={selectAttendee}>
              <input type="hidden" name="attendeeId" value={a.id} />
              <button
                type="submit"
                className="group w-full rounded-2xl border border-ivory/12 bg-night-900/50 p-5 text-left backdrop-blur-sm transition-all duration-500 hover:-translate-y-1 hover:border-gold-500/50 hover:bg-night-900/80 hover:shadow-[0_30px_80px_-44px_rgba(232,163,61,0.6)]"
              >
                <span className="flex items-start justify-between gap-3">
                  <span className="font-display text-xl leading-tight text-ivory">
                    {a.name}
                  </span>
                  <span className="text-gold-500 opacity-0 transition-opacity duration-500 group-hover:opacity-100">
                    →
                  </span>
                </span>
                <span className="mt-2 block text-xs uppercase tracking-[0.18em] text-pearl/70">
                  Límite {formatCOP(a.limitAmount)}
                </span>
                {a.orderConfirmedAt ? (
                  <span className="mt-3 inline-flex">
                    <Badge tone="green">✓ Pedido confirmado</Badge>
                  </span>
                ) : null}
              </button>
            </form>
          ))}
        </div>
      )}

      <SiteFooter />
    </main>
  )
}
