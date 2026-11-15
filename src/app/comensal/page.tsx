import Link from 'next/link'
import { getAttendees, getEvent } from '@/lib/data'
import { formatCOP } from '@/lib/format'
import { Badge, Card, PageHeader } from '@/components/ui'
import { selectAttendee } from './actions'

export const dynamic = 'force-dynamic'

export default async function ComensalPage() {
  const event = await getEvent()

  if (!event) {
    return (
      <main className="mx-auto w-full max-w-3xl px-6 py-16">
        <PageHeader title="Comensales" subtitle="No hay evento configurado." />
        <Link href="/" className="text-amber-600 hover:underline">
          ← Volver al inicio
        </Link>
      </main>
    )
  }

  const attendees = await getAttendees(event.id)

  return (
    <main className="mx-auto w-full max-w-3xl px-6 py-10">
      <Link href="/" className="text-sm text-zinc-500 hover:underline">
        ← Inicio
      </Link>
      <div className="mt-4">
        <PageHeader
          title="¿Quién eres?"
          subtitle="Selecciona tu nombre para armar tu pedido."
          action={
            <Badge tone={event.status === 'OPEN' ? 'green' : 'red'}>
              {event.status === 'OPEN' ? 'Evento abierto' : 'Evento cerrado'}
            </Badge>
          }
        />
      </div>

      {attendees.length === 0 ? (
        <Card>
          <p className="text-sm text-zinc-500">
            Aún no hay asistentes cargados. El administrador debe agregarlos en el
            panel.
          </p>
        </Card>
      ) : (
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {attendees.map((a) => (
            <form key={a.id} action={selectAttendee}>
              <input type="hidden" name="attendeeId" value={a.id} />
              <button
                type="submit"
                className="w-full rounded-xl border border-zinc-200 bg-white p-4 text-left transition-colors hover:border-amber-400 hover:bg-amber-50 dark:border-zinc-800 dark:bg-zinc-900 dark:hover:border-amber-500 dark:hover:bg-zinc-800"
              >
                <span className="block font-semibold">{a.name}</span>
                <span className="mt-1 block text-xs text-zinc-500">
                  Límite: {formatCOP(a.limitAmount)}
                </span>
                {a.orderConfirmedAt ? (
                  <span className="mt-2 inline-block text-xs font-medium text-emerald-600">
                    ✓ Pedido confirmado
                  </span>
                ) : null}
              </button>
            </form>
          ))}
        </div>
      )}
    </main>
  )
}
