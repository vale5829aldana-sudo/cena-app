'use client'

import { useMemo, useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { computeBudget, SHARED_ENTRADA_FACTOR, SOLO_ENTRADA_FACTOR } from '@/lib/domain'
import { formatCOP } from '@/lib/format'
import { Badge, Button, Card, cn } from '@/components/ui'
import { AutoRefresh } from '@/components/auto-refresh'
import {
  cancelPairing,
  clearSoloEntrada,
  confirmOrder,
  createPairing,
  resetOrder,
  respondPairing,
  setDishSelection,
  setSoloEntrada,
  signOutAttendee,
} from '../actions'

type Dish = {
  id: string
  name: string
  description: string
  price: number
  imageUrl: string | null
  subgroup: string | null
  isVegetarian: boolean
  isVegan: boolean
}

type Category = {
  id: string
  name: string
  slug: string
  shareable: boolean
  maxPrice: number
  dishes: Dish[]
}

export type PedidoProps = {
  status: 'OPEN' | 'CLOSED'
  attendee: { id: string; name: string; limitAmount: number; confirmed: boolean }
  categories: Category[]
  pairing: {
    id: string
    status: 'PENDING' | 'CONFIRMED'
    role: 'initiator' | 'partner'
    dishName: string
    dishPrice: number
    otherName: string
  } | null
  selections: Record<string, { dishId: string; price: number; shareFactor: number; name: string }>
  partners: { id: string; name: string }[]
}

function DishCard({
  dish,
  selected,
  disabled,
  onSelect,
}: {
  dish: Dish
  selected: boolean
  disabled?: boolean
  onSelect: () => void
}) {
  return (
    <button
      type="button"
      disabled={disabled}
      onClick={onSelect}
      className={cn(
        'flex w-full flex-col rounded-xl border p-3 text-left transition-colors disabled:opacity-60',
        selected
          ? 'border-amber-500 bg-amber-50 ring-2 ring-amber-200 dark:bg-amber-950/40'
          : 'border-zinc-200 bg-white hover:border-amber-300 dark:border-zinc-800 dark:bg-zinc-900',
      )}
    >
      <div className="flex items-start justify-between gap-2">
        <span className="font-medium leading-tight">{dish.name}</span>
        <span className="whitespace-nowrap text-sm font-semibold text-amber-700 dark:text-amber-400">
          {formatCOP(dish.price)}
        </span>
      </div>
      <p className="mt-1 line-clamp-3 text-xs text-zinc-500 dark:text-zinc-400">
        {dish.description}
      </p>
      <div className="mt-2 flex gap-1">
        {dish.isVegan ? <Badge tone="green">Vegano</Badge> : null}
        {dish.isVegetarian && !dish.isVegan ? <Badge tone="green">Vegetariano</Badge> : null}
      </div>
    </button>
  )
}

export function PedidoClient(props: PedidoProps) {
  const { status, attendee, categories, pairing, selections, partners } = props
  const router = useRouter()
  const [error, setError] = useState<string | null>(null)
  const [pending, startTransition] = useTransition()

  const [entradaId, setEntradaId] = useState<string | null>(null)
  const [partnerId, setPartnerId] = useState<string>('')
  const [modoEntrada, setModoEntrada] = useState<'compartir' | 'solo'>('compartir')

  const closed = status === 'CLOSED'
  const entradaCat = categories.find((c) => c.shareable)
  const platoCat = categories.find((c) => c.slug === 'platos-fuertes')
  const bebidaCat = categories.find((c) => c.slug === 'bebidas')

  // Entrada individual (RN-6): existe una selección de entrada sin emparejamiento.
  const soloEntrada = !pairing && entradaCat ? selections[entradaCat.id] : undefined
  const entradaFactor =
    pairing?.status === 'CONFIRMED'
      ? SHARED_ENTRADA_FACTOR
      : soloEntrada
        ? SOLO_ENTRADA_FACTOR
        : 0
  const entradaPrice =
    pairing?.status === 'CONFIRMED' ? pairing.dishPrice : (soloEntrada?.price ?? 0)
  const entradaReady = entradaFactor > 0

  const budget = useMemo(
    () =>
      computeBudget({
        limit: attendee.limitAmount,
        entradaPrice,
        entradaShareFactor: entradaFactor,
        platoPrice: platoCat ? (selections[platoCat.id]?.price ?? 0) : 0,
        bebidaPrice: bebidaCat ? (selections[bebidaCat.id]?.price ?? 0) : 0,
      }),
    [attendee.limitAmount, entradaPrice, entradaFactor, platoCat, bebidaCat, selections],
  )

  const run = (fn: () => Promise<{ ok: boolean; error?: string }>) => {
    setError(null)
    startTransition(async () => {
      try {
        const res = await fn()
        if (!res.ok) setError(res.error ?? 'Ocurrió un error.')
        else router.refresh()
      } catch {
        setError('Ocurrió un error inesperado.')
      }
    })
  }

  const readyToConfirm =
    entradaReady &&
    platoCat &&
    selections[platoCat.id] &&
    bebidaCat &&
    selections[bebidaCat.id] &&
    budget.withinBudget

  const bebidaGroups = useMemo(() => {
    if (!bebidaCat) return []
    const map = new Map<string, Dish[]>()
    for (const d of bebidaCat.dishes) {
      const key = d.subgroup ?? 'Bebidas'
      const arr = map.get(key) ?? []
      arr.push(d)
      map.set(key, arr)
    }
    return Array.from(map.entries())
  }, [bebidaCat])

  return (
    <main className="mx-auto w-full max-w-5xl px-4 py-8 sm:px-6">
      <AutoRefresh enabled={pairing?.status === 'PENDING'} />

      <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
        <div>
          <p className="text-sm text-zinc-500">Comensal</p>
          <h1 className="text-2xl font-bold">{attendee.name}</h1>
        </div>
        <div className="flex items-center gap-3">
          {attendee.confirmed ? <Badge tone="green">Pedido confirmado</Badge> : null}
          <Badge tone={closed ? 'red' : 'green'}>
            {closed ? 'Evento cerrado' : 'Evento abierto'}
          </Badge>
          <form action={signOutAttendee}>
            <Button variant="ghost" size="sm" type="submit">
              Cambiar de comensal
            </Button>
          </form>
        </div>
      </div>

      {closed ? (
        <Card className="mb-4 border-red-200 bg-red-50 dark:border-red-900 dark:bg-red-950/40">
          <p className="text-sm text-red-700 dark:text-red-300">
            El evento está cerrado. Ya no puedes modificar tu pedido.
          </p>
        </Card>
      ) : null}

      {error ? (
        <Card className="mb-4 border-red-200 bg-red-50 dark:border-red-900 dark:bg-red-950/40">
          <p className="text-sm text-red-700 dark:text-red-300">{error}</p>
        </Card>
      ) : null}

      <div className="grid gap-6 lg:grid-cols-[1fr_320px]">
        <div className="space-y-6">
          {/* ENTRADA */}
          <section>
            <h2 className="mb-3 text-lg font-semibold">1. Tu entrada</h2>

            {!pairing && entradaCat ? (
              <>
                <div className="mb-3 inline-flex rounded-lg border border-zinc-300 bg-white p-1 text-sm dark:border-zinc-700 dark:bg-zinc-900">
                  <button
                    type="button"
                    onClick={() => setModoEntrada('compartir')}
                    className={cn(
                      'rounded-md px-3 py-1.5 font-medium transition-colors',
                      modoEntrada === 'compartir'
                        ? 'bg-amber-500 text-white'
                        : 'text-zinc-600 hover:bg-zinc-100 dark:text-zinc-300 dark:hover:bg-zinc-800',
                    )}
                  >
                    Compartir con alguien
                  </button>
                  <button
                    type="button"
                    onClick={() => setModoEntrada('solo')}
                    className={cn(
                      'rounded-md px-3 py-1.5 font-medium transition-colors',
                      modoEntrada === 'solo'
                        ? 'bg-amber-500 text-white'
                        : 'text-zinc-600 hover:bg-zinc-100 dark:text-zinc-300 dark:hover:bg-zinc-800',
                    )}
                  >
                    Tomarla solo
                  </button>
                </div>

                {modoEntrada === 'compartir' ? (
                  <Card>
                    {partners.length === 0 ? (
                      <p className="text-sm text-zinc-500">
                        No hay compañeros disponibles para compartir. Pídele al
                        administrador que revise los emparejamientos, o toma la
                        entrada solo (pago completo).
                      </p>
                    ) : (
                      <>
                        <p className="mb-3 text-sm text-zinc-500">
                          Elige la entrada y con quién la compartirás (la mitad del
                          precio para cada uno).
                        </p>
                        <div className="grid gap-2 sm:grid-cols-2">
                          {entradaCat.dishes.map((d) => (
                            <DishCard
                              key={d.id}
                              dish={d}
                              selected={entradaId === d.id}
                              disabled={closed || pending}
                              onSelect={() => setEntradaId(d.id)}
                            />
                          ))}
                        </div>
                        <div className="mt-4 flex flex-col gap-3 sm:flex-row sm:items-end">
                          <div className="flex-1">
                            <label className="mb-1 block text-xs font-semibold uppercase tracking-wide text-zinc-500">
                              Compartir con
                            </label>
                            <select
                              value={partnerId}
                              onChange={(e) => setPartnerId(e.target.value)}
                              className="w-full rounded-lg border border-zinc-300 bg-white px-3 py-2 text-sm dark:border-zinc-700 dark:bg-zinc-950"
                            >
                              <option value="">Selecciona un compañero…</option>
                              {partners.map((p) => (
                                <option key={p.id} value={p.id}>
                                  {p.name}
                                </option>
                              ))}
                            </select>
                          </div>
                          <Button
                            disabled={closed || pending || !entradaId || !partnerId}
                            onClick={() =>
                              entradaId &&
                              partnerId &&
                              run(() => createPairing(entradaId, partnerId))
                            }
                          >
                            Proponer compartir
                          </Button>
                        </div>
                      </>
                    )}
                  </Card>
                ) : (
                  <Card>
                    <p className="mb-3 text-sm text-zinc-500">
                      Respaldo para casos impares: si no compartes con nadie, tomas
                      la entrada y pagas el <strong>100 %</strong> de su precio.
                    </p>
                    <div className="grid gap-2 sm:grid-cols-2">
                      {entradaCat.dishes.map((d) => (
                        <DishCard
                          key={d.id}
                          dish={d}
                          selected={soloEntrada?.dishId === d.id}
                          disabled={closed || pending}
                          onSelect={() => run(() => setSoloEntrada(d.id))}
                        />
                      ))}
                    </div>
                  </Card>
                )}
              </>
            ) : null}

            {!pairing && soloEntrada ? (
              <Card className="mt-3 border-amber-200 bg-amber-50 dark:border-amber-900 dark:bg-amber-950/40">
                <p className="text-sm">
                  Tomas <strong>{soloEntrada.name}</strong> individualmente. Tu
                  parte: <strong>{formatCOP(soloEntrada.price)}</strong> (100 %).
                </p>
                <div className="mt-3">
                  <Button
                    variant="secondary"
                    size="sm"
                    disabled={pending || closed}
                    onClick={() => run(() => clearSoloEntrada())}
                  >
                    Quitar entrada individual
                  </Button>
                </div>
              </Card>
            ) : null}

            {pairing?.status === 'PENDING' && pairing.role === 'initiator' ? (
              <Card className="border-amber-200 bg-amber-50 dark:border-amber-900 dark:bg-amber-950/40">
                <p className="text-sm">
                  Propusiste compartir <strong>{pairing.dishName}</strong> con{' '}
                  <strong>{pairing.otherName}</strong>. Esperando su confirmación…
                </p>
                <div className="mt-3">
                  <Button
                    variant="secondary"
                    size="sm"
                    disabled={pending}
                    onClick={() => run(() => cancelPairing(pairing.id))}
                  >
                    Cancelar propuesta
                  </Button>
                </div>
              </Card>
            ) : null}

            {pairing?.status === 'PENDING' && pairing.role === 'partner' ? (
              <Card className="border-blue-200 bg-blue-50 dark:border-blue-900 dark:bg-blue-950/40">
                <p className="text-sm">
                  <strong>{pairing.otherName}</strong> te propone compartir{' '}
                  <strong>{pairing.dishName}</strong> ({formatCOP(pairing.dishPrice)}). Tu
                  parte: <strong>{formatCOP(Math.round(pairing.dishPrice / 2))}</strong>.
                </p>
                <div className="mt-3 flex gap-2">
                  <Button
                    size="sm"
                    disabled={pending || closed}
                    onClick={() => run(() => respondPairing(pairing.id, true))}
                  >
                    Aceptar
                  </Button>
                  <Button
                    variant="secondary"
                    size="sm"
                    disabled={pending || closed}
                    onClick={() => run(() => respondPairing(pairing.id, false))}
                  >
                    Rechazar
                  </Button>
                </div>
              </Card>
            ) : null}

            {pairing?.status === 'CONFIRMED' ? (
              <Card className="border-emerald-200 bg-emerald-50 dark:border-emerald-900 dark:bg-emerald-950/40">
                <p className="text-sm">
                  Compartes <strong>{pairing.dishName}</strong> con{' '}
                  <strong>{pairing.otherName}</strong>. Tu parte:{' '}
                  <strong>{formatCOP(Math.round(pairing.dishPrice / 2))}</strong>.
                </p>
              </Card>
            ) : null}
          </section>

          {/* PLATO FUERTE */}
          {platoCat ? (
            <section>
              <h2 className="mb-3 text-lg font-semibold">2. Tu plato fuerte</h2>
              <div className="grid gap-2 sm:grid-cols-2">
                {platoCat.dishes.map((d) => (
                  <DishCard
                    key={d.id}
                    dish={d}
                    selected={selections[platoCat.id]?.dishId === d.id}
                    disabled={closed || pending || !entradaReady}
                    onSelect={() => run(() => setDishSelection(platoCat.id, d.id))}
                  />
                ))}
              </div>
            </section>
          ) : null}

          {/* BEBIDA */}
          {bebidaCat ? (
            <section>
              <h2 className="mb-3 text-lg font-semibold">3. Tu bebida</h2>
              <div className="space-y-4">
                {bebidaGroups.map(([group, dishes]) => (
                  <div key={group}>
                    <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-zinc-500">
                      {group}
                    </p>
                    <div className="grid gap-2 sm:grid-cols-2">
                      {dishes.map((d) => (
                        <DishCard
                          key={d.id}
                          dish={d}
                          selected={selections[bebidaCat.id]?.dishId === d.id}
                          disabled={closed || pending || !entradaReady}
                          onSelect={() => run(() => setDishSelection(bebidaCat.id, d.id))}
                        />
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </section>
          ) : null}
        </div>

        {/* RESUMEN */}
        <aside className="lg:sticky lg:top-6 lg:h-fit">
          <Card>
            <h2 className="mb-3 text-lg font-semibold">Tu resumen</h2>
            <dl className="space-y-2 text-sm">
              <div className="flex justify-between">
                <dt className="text-zinc-500">Límite por persona</dt>
                <dd className="font-medium">{formatCOP(budget.limit)}</dd>
              </div>
              <div className="flex justify-between">
                <dt className="text-zinc-500">Entrada (tu parte)</dt>
                <dd>{budget.entradaShare ? formatCOP(budget.entradaShare) : '—'}</dd>
              </div>
              <div className="flex justify-between">
                <dt className="text-zinc-500">Plato fuerte</dt>
                <dd>{budget.platoPrice ? formatCOP(budget.platoPrice) : '—'}</dd>
              </div>
              <div className="flex justify-between">
                <dt className="text-zinc-500">Bebida</dt>
                <dd>{budget.bebidaPrice ? formatCOP(budget.bebidaPrice) : '—'}</dd>
              </div>
              <div className="mt-2 flex justify-between border-t border-zinc-200 pt-2 dark:border-zinc-800">
                <dt className="font-semibold">Total</dt>
                <dd className="font-semibold">{formatCOP(budget.total)}</dd>
              </div>
              <div className="flex justify-between">
                <dt className="text-zinc-500">Disponible</dt>
                <dd
                  className={cn(
                    'font-medium',
                    budget.remaining < 0 ? 'text-red-600' : 'text-emerald-600',
                  )}
                >
                  {formatCOP(budget.remaining)}
                </dd>
              </div>
            </dl>

            {!budget.withinBudget ? (
              <p className="mt-3 rounded-lg bg-red-50 p-2 text-xs text-red-700 dark:bg-red-950/40 dark:text-red-300">
                Te pasas del límite. Ajusta tu plato o bebida.
              </p>
            ) : null}

            <div className="mt-4 space-y-2">
              <Button
                className="w-full"
                disabled={closed || pending || !readyToConfirm}
                onClick={() => run(() => confirmOrder())}
              >
                {attendee.confirmed ? 'Actualizar pedido' : 'Confirmar pedido'}
              </Button>
              <Button
                variant="ghost"
                size="sm"
                className="w-full"
                disabled={closed || pending}
                onClick={() => {
                  if (confirm('¿Reiniciar tu pedido? Se borrarán tus selecciones.')) {
                    run(() => resetOrder())
                  }
                }}
              >
                Reiniciar pedido
              </Button>
            </div>

            {pending ? (
              <p className="mt-2 text-center text-xs text-zinc-500">Guardando…</p>
            ) : null}
          </Card>
        </aside>
      </div>
    </main>
  )
}
