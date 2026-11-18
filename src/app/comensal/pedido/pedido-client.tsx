'use client'

import Image from 'next/image'
import { useEffect, useMemo, useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { computeBudget, SHARED_ENTRADA_FACTOR, SOLO_ENTRADA_FACTOR } from '@/lib/domain'
import { formatCOP } from '@/lib/format'
import { Badge, Button, Card, Eyebrow, Select, cn } from '@/components/ui'
import { BrandLockup } from '@/components/brand'
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
  onOpen,
}: {
  dish: Dish
  selected: boolean
  disabled?: boolean
  onOpen: () => void
}) {
  return (
    <button
      type="button"
      disabled={disabled}
      onClick={onOpen}
      className={cn(
        'group flex w-full items-stretch gap-3 rounded-2xl border p-3 text-left transition-all duration-500 disabled:cursor-not-allowed disabled:opacity-50',
        selected
          ? 'border-gold-500/70 bg-gold-500/8 shadow-[0_26px_70px_-44px_rgba(232,163,61,0.9)] ring-1 ring-gold-500/25'
          : 'border-ivory/12 bg-night-900/40 hover:-translate-y-0.5 hover:border-gold-500/35 hover:bg-night-900/70',
      )}
    >
      <span className="relative shrink-0">
        {dish.imageUrl ? (
          <Image
            src={dish.imageUrl}
            alt={dish.name}
            width={64}
            height={64}
            className="h-16 w-16 rounded-xl object-cover"
          />
        ) : (
          <span className="flex h-16 w-16 items-center justify-center rounded-xl border border-ivory/10 bg-night-950/50 text-gold-500/70">
            <svg
              viewBox="0 0 24 24"
              className="h-5 w-5"
              fill="none"
              stroke="currentColor"
              strokeWidth="1.3"
              aria-hidden
            >
              <path
                d="M7 3v8a2.5 2.5 0 0 0 5 0V3M9.5 3v18M17 3c-1.4 1.6-1.4 5.4 0 7v11"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
          </span>
        )}
        {selected ? (
          <span className="absolute -right-1.5 -top-1.5 flex h-5 w-5 items-center justify-center rounded-full bg-gold-500 text-night-950">
            <svg
              viewBox="0 0 20 20"
              className="h-3 w-3"
              fill="none"
              stroke="currentColor"
              strokeWidth="2.5"
              aria-hidden
            >
              <path d="m5 10 3.5 3.5L15 6" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </span>
        ) : null}
      </span>

      <span className="flex min-w-0 flex-1 flex-col">
        <span className="flex items-start justify-between gap-2">
          <span className="font-display text-base leading-tight text-ivory">
            {dish.name}
          </span>
          <span className="whitespace-nowrap font-display text-sm text-gold-400">
            {formatCOP(dish.price)}
          </span>
        </span>
        <span className="mt-1 line-clamp-2 text-xs leading-relaxed text-pearl">
          {dish.description}
        </span>
        {dish.isVegan || dish.isVegetarian ? (
          <span className="mt-2 flex gap-1.5">
            {dish.isVegan ? (
              <Badge tone="green">Vegano</Badge>
            ) : (
              <Badge tone="green">Vegetariano</Badge>
            )}
          </span>
        ) : null}
      </span>
    </button>
  )
}

/**
 * Detalle del plato en una capa modal: imagen grande, nombre, descripción y el
 * botón para elegirlo. El fondo es un degradado rojo Bombay que se funde con el
 * negro nocturno de la app.
 */
function DishDetail({
  dish,
  selected,
  selectable,
  hint,
  actionLabel,
  pending,
  onConfirm,
  onClose,
}: {
  dish: Dish
  selected: boolean
  selectable: boolean
  hint?: string
  actionLabel: string
  pending: boolean
  onConfirm: () => void
  onClose: () => void
}) {
  useEffect(() => {
    const onKey = (event: KeyboardEvent) => {
      if (event.key === 'Escape') onClose()
    }
    window.addEventListener('keydown', onKey)
    const previousOverflow = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    return () => {
      window.removeEventListener('keydown', onKey)
      document.body.style.overflow = previousOverflow
    }
  }, [onClose])

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6"
      role="dialog"
      aria-modal="true"
      aria-label={dish.name}
    >
      <button
        type="button"
        aria-label="Cerrar detalle"
        onClick={onClose}
        className="absolute inset-0 cursor-default backdrop-blur-[3px]"
        style={{
          backgroundImage:
            'radial-gradient(140% 100% at 50% -12%, rgba(200,16,46,0.62) 0%, rgba(157,12,36,0.42) 42%, rgba(11,15,26,0.92) 78%)',
        }}
      />

      <div className="relative z-10 max-h-[90vh] w-full max-w-lg overflow-y-auto rounded-3xl border border-ivory/15 bg-night-900/95 shadow-luxe">
        <div className="relative aspect-[4/3] w-full overflow-hidden">
          {dish.imageUrl ? (
            <Image
              src={dish.imageUrl}
              alt={dish.name}
              fill
              sizes="(max-width: 640px) 100vw, 512px"
              className="object-cover"
            />
          ) : (
            <div className="flex h-full w-full items-center justify-center bg-night-950/60 text-gold-500/60">
              <svg
                viewBox="0 0 24 24"
                className="h-12 w-12"
                fill="none"
                stroke="currentColor"
                strokeWidth="1.1"
                aria-hidden
              >
                <path
                  d="M7 3v8a2.5 2.5 0 0 0 5 0V3M9.5 3v18M17 3c-1.4 1.6-1.4 5.4 0 7v11"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </svg>
            </div>
          )}
          <div className="pointer-events-none absolute inset-x-0 bottom-0 h-20 bg-gradient-to-t from-night-900 to-transparent" />
          <button
            type="button"
            onClick={onClose}
            aria-label="Cerrar"
            className="absolute right-3 top-3 flex h-9 w-9 items-center justify-center rounded-full border border-ivory/20 bg-night-950/70 text-ivory backdrop-blur transition-colors hover:border-ivory/40 hover:bg-night-950/90"
          >
            <svg
              viewBox="0 0 20 20"
              className="h-4 w-4"
              fill="none"
              stroke="currentColor"
              strokeWidth="1.6"
              aria-hidden
            >
              <path d="m5 5 10 10M15 5 5 15" strokeLinecap="round" />
            </svg>
          </button>
        </div>

        <div className="p-6">
          <div className="flex items-start justify-between gap-3">
            <h2 className="font-display text-2xl leading-tight text-ivory">{dish.name}</h2>
            <span className="whitespace-nowrap font-display text-lg text-gold-400">
              {formatCOP(dish.price)}
            </span>
          </div>

          {dish.isVegan || dish.isVegetarian ? (
            <div className="mt-3 flex gap-1.5">
              <Badge tone="green">{dish.isVegan ? 'Vegano' : 'Vegetariano'}</Badge>
            </div>
          ) : null}

          <p className="mt-3 text-sm leading-relaxed text-pearl">{dish.description}</p>

          {hint ? (
            <p className="mt-4 rounded-lg border border-gold-500/30 bg-gold-500/8 p-2.5 text-xs text-gold-300">
              {hint}
            </p>
          ) : null}

          <div className="mt-6">
            <Button
              className="w-full"
              size="lg"
              disabled={!selectable || pending || selected}
              onClick={onConfirm}
            >
              {selected ? 'Ya está elegido' : actionLabel}
            </Button>
          </div>
        </div>
      </div>
    </div>
  )
}

function SectionTitle({ index, children }: { index: string; children: string }) {
  return (
    <h2 className="mb-4 flex items-baseline gap-3">
      <span className="font-display text-2xl text-gold-500/80">{index}</span>
      <span className="font-display text-2xl text-ivory">{children}</span>
    </h2>
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
  const [detail, setDetail] = useState<{
    dish: Dish
    context: 'entrada' | 'solo' | 'plato' | 'bebida'
  } | null>(null)

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

  const closeDetail = () => setDetail(null)

  const confirmDetail = () => {
    if (!detail) return
    const { dish, context } = detail
    setDetail(null)
    if (context === 'entrada') {
      setEntradaId(dish.id)
    } else if (context === 'solo') {
      run(() => setSoloEntrada(dish.id))
    } else if (context === 'plato' && platoCat) {
      run(() => setDishSelection(platoCat.id, dish.id))
    } else if (context === 'bebida' && bebidaCat) {
      run(() => setDishSelection(bebidaCat.id, dish.id))
    }
  }

  const detailSelected = !detail
    ? false
    : detail.context === 'entrada'
      ? entradaId === detail.dish.id
      : detail.context === 'solo'
        ? soloEntrada?.dishId === detail.dish.id
        : detail.context === 'plato' && platoCat
          ? selections[platoCat.id]?.dishId === detail.dish.id
          : detail.context === 'bebida' && bebidaCat
            ? selections[bebidaCat.id]?.dishId === detail.dish.id
            : false

  const detailSelectable =
    detail?.context === 'plato' || detail?.context === 'bebida'
      ? entradaReady
      : Boolean(detail)

  const detailActionLabel = !detail
    ? ''
    : detail.context === 'entrada'
      ? 'Elegir esta entrada'
      : detail.context === 'solo'
        ? 'Tomar esta entrada (100 %)'
        : detail.context === 'plato'
          ? 'Elegir este plato'
          : 'Elegir esta bebida'

  const detailHint =
    detail && !detailSelectable
      ? 'Primero elige tu entrada (compartida o individual) para habilitar platos y bebidas.'
      : undefined

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

      <header className="mb-8 flex items-center justify-between">
        <BrandLockup href="/comensal" subtitle="Tu pedido" />
        <form action={signOutAttendee}>
          <Button variant="ghost" size="sm" type="submit">
            Cambiar de comensal
          </Button>
        </form>
      </header>

      <div className="mb-8 flex flex-wrap items-end justify-between gap-4">
        <div>
          <Eyebrow>Comensal</Eyebrow>
          <h1 className="mt-2 font-display text-4xl leading-tight text-ivory">
            {attendee.name}
          </h1>
        </div>
        <div className="flex flex-wrap items-center gap-3">
          {attendee.confirmed ? <Badge tone="green">Pedido confirmado</Badge> : null}
          <Badge tone={closed ? 'red' : 'green'}>
            {closed ? 'Evento cerrado' : 'Evento abierto'}
          </Badge>
        </div>
      </div>

      {closed ? (
        <Card className="mb-4 border-bombay-600/30 bg-bombay-600/10">
          <p className="text-sm text-bombay-400">
            El evento está cerrado. Ya no puedes modificar tu pedido.
          </p>
        </Card>
      ) : null}

      {error ? (
        <Card className="mb-4 border-bombay-600/30 bg-bombay-600/10">
          <p className="text-sm text-bombay-400">{error}</p>
        </Card>
      ) : null}

      <div className="grid gap-6 lg:grid-cols-[1fr_330px]">
        <div className="space-y-8">
          {/* ENTRADA */}
          <section>
            <SectionTitle index="01">Tu entrada</SectionTitle>

            {!pairing && entradaCat ? (
              <>
                <div className="mb-4 inline-flex rounded-full border border-ivory/15 bg-night-900/50 p-1 text-xs">
                  <button
                    type="button"
                    onClick={() => setModoEntrada('compartir')}
                    className={cn(
                      'rounded-full px-4 py-1.5 font-medium tracking-wide transition-all duration-300',
                      modoEntrada === 'compartir'
                        ? 'bg-gold-500 text-night-950'
                        : 'text-pearl hover:text-ivory',
                    )}
                  >
                    Compartir con alguien
                  </button>
                  <button
                    type="button"
                    onClick={() => setModoEntrada('solo')}
                    className={cn(
                      'rounded-full px-4 py-1.5 font-medium tracking-wide transition-all duration-300',
                      modoEntrada === 'solo'
                        ? 'bg-gold-500 text-night-950'
                        : 'text-pearl hover:text-ivory',
                    )}
                  >
                    Tomarla solo
                  </button>
                </div>

                {modoEntrada === 'compartir' ? (
                  <Card>
                    {partners.length === 0 ? (
                      <p className="text-sm text-pearl">
                        No hay compañeros disponibles para compartir. Pídele al
                        administrador que revise los emparejamientos, o toma la
                        entrada solo (pago completo).
                      </p>
                    ) : (
                      <>
                        <p className="mb-4 text-sm text-pearl">
                          Elige la entrada y con quién la compartirás (la mitad del
                          precio para cada uno).
                        </p>
                        <div className="grid gap-2.5 sm:grid-cols-2">
                          {entradaCat.dishes.map((d) => (
                            <DishCard
                              key={d.id}
                              dish={d}
                              selected={entradaId === d.id}
                              disabled={closed || pending}
                              onOpen={() => setDetail({ dish: d, context: 'entrada' })}
                            />
                          ))}
                        </div>
                        <div className="mt-5 flex flex-col gap-3 sm:flex-row sm:items-end">
                          <div className="flex-1">
                            <label className="mb-1.5 block text-[11px] font-semibold uppercase tracking-[0.18em] text-pearl/80">
                              Compartir con
                            </label>
                            <Select
                              value={partnerId}
                              onChange={(e) => setPartnerId(e.target.value)}
                            >
                              <option value="">Selecciona un compañero…</option>
                              {partners.map((p) => (
                                <option key={p.id} value={p.id}>
                                  {p.name}
                                </option>
                              ))}
                            </Select>
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
                    <p className="mb-4 text-sm text-pearl">
                      Respaldo para casos impares: si no compartes con nadie, tomas
                      la entrada y pagas el <strong className="text-ivory">100 %</strong>{' '}
                      de su precio.
                    </p>
                    <div className="grid gap-2.5 sm:grid-cols-2">
                      {entradaCat.dishes.map((d) => (
                        <DishCard
                          key={d.id}
                          dish={d}
                          selected={soloEntrada?.dishId === d.id}
                          disabled={closed || pending}
                          onOpen={() => setDetail({ dish: d, context: 'solo' })}
                        />
                      ))}
                    </div>
                  </Card>
                )}
              </>
            ) : null}

            {!pairing && soloEntrada ? (
              <Card className="mt-4 border-gold-500/40 bg-gold-500/8">
                <p className="text-sm text-ivory">
                  Tomas <strong>{soloEntrada.name}</strong> individualmente. Tu
                  parte: <strong className="text-gold-400">{formatCOP(soloEntrada.price)}</strong>{' '}
                  (100 %).
                </p>
                <div className="mt-4">
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
              <Card className="border-gold-500/40 bg-gold-500/8">
                <p className="text-sm text-ivory">
                  Propusiste compartir <strong>{pairing.dishName}</strong> con{' '}
                  <strong>{pairing.otherName}</strong>. Esperando su confirmación…
                </p>
                <div className="mt-4">
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
              <Card className="border-midnight/60 bg-midnight/20">
                <p className="text-sm text-ivory">
                  <strong>{pairing.otherName}</strong> te propone compartir{' '}
                  <strong>{pairing.dishName}</strong> ({formatCOP(pairing.dishPrice)}). Tu
                  parte:{' '}
                  <strong className="text-gold-400">
                    {formatCOP(Math.round(pairing.dishPrice / 2))}
                  </strong>
                  .
                </p>
                <div className="mt-4 flex gap-2">
                  <Button
                    size="sm"
                    disabled={pending || closed}
                    onClick={() => run(() => respondPairing(pairing.id, true))}
                  >
                    Aceptar
                  </Button>
                  <Button
                    variant="outline"
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
              <Card className="border-emerald-400/30 bg-emerald-500/8">
                <p className="text-sm text-ivory">
                  Compartes <strong>{pairing.dishName}</strong> con{' '}
                  <strong>{pairing.otherName}</strong>. Tu parte:{' '}
                  <strong className="text-emerald-300">
                    {formatCOP(Math.round(pairing.dishPrice / 2))}
                  </strong>
                  .
                </p>
              </Card>
            ) : null}
          </section>

          {/* PLATO FUERTE */}
          {platoCat ? (
            <section>
              <SectionTitle index="02">Tu plato fuerte</SectionTitle>
              <div className="grid gap-2.5 sm:grid-cols-2">
                {platoCat.dishes.map((d) => (
                  <DishCard
                    key={d.id}
                    dish={d}
                    selected={selections[platoCat.id]?.dishId === d.id}
                    disabled={closed || pending}
                    onOpen={() => setDetail({ dish: d, context: 'plato' })}
                  />
                ))}
              </div>
            </section>
          ) : null}

          {/* BEBIDA */}
          {bebidaCat ? (
            <section>
              <SectionTitle index="03">Tu bebida</SectionTitle>
              <div className="space-y-5">
                {bebidaGroups.map(([group, dishes]) => (
                  <div key={group}>
                    <p className="mb-2.5 text-[11px] font-semibold uppercase tracking-[0.24em] text-gold-500/80">
                      {group}
                    </p>
                    <div className="grid gap-2.5 sm:grid-cols-2">
                      {dishes.map((d) => (
                        <DishCard
                          key={d.id}
                          dish={d}
                          selected={selections[bebidaCat.id]?.dishId === d.id}
                          disabled={closed || pending}
                          onOpen={() => setDetail({ dish: d, context: 'bebida' })}
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
          <Card className="p-6">
            <Eyebrow>Resumen</Eyebrow>
            <dl className="mt-5 space-y-3 text-sm">
              <div className="flex justify-between">
                <dt className="text-pearl">Límite por persona</dt>
                <dd className="text-ivory">{formatCOP(budget.limit)}</dd>
              </div>
              <div className="flex justify-between">
                <dt className="text-pearl">Entrada (tu parte)</dt>
                <dd className="text-ivory">
                  {budget.entradaShare ? formatCOP(budget.entradaShare) : '—'}
                </dd>
              </div>
              <div className="flex justify-between">
                <dt className="text-pearl">Plato fuerte</dt>
                <dd className="text-ivory">
                  {budget.platoPrice ? formatCOP(budget.platoPrice) : '—'}
                </dd>
              </div>
              <div className="flex justify-between">
                <dt className="text-pearl">Bebida</dt>
                <dd className="text-ivory">
                  {budget.bebidaPrice ? formatCOP(budget.bebidaPrice) : '—'}
                </dd>
              </div>
            </dl>

            <div className="my-5 h-px w-full bg-ivory/10" />

            <div className="flex items-end justify-between">
              <span className="text-sm text-pearl">Total</span>
              <span className="font-display text-3xl text-ivory">
                {formatCOP(budget.total)}
              </span>
            </div>
            <div className="mt-2 flex justify-between text-sm">
              <span className="text-pearl">Disponible</span>
              <span
                className={cn(
                  'font-medium',
                  budget.remaining < 0 ? 'text-bombay-400' : 'text-emerald-300',
                )}
              >
                {formatCOP(budget.remaining)}
              </span>
            </div>

            {!budget.withinBudget ? (
              <p className="mt-4 rounded-lg border border-bombay-600/30 bg-bombay-600/10 p-2.5 text-xs text-bombay-400">
                Te pasas del límite. Ajusta tu plato o bebida.
              </p>
            ) : null}

            <div className="mt-6 space-y-2.5">
              <Button
                className="w-full"
                size="lg"
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
              <p className="mt-3 text-center text-xs text-pearl">Guardando…</p>
            ) : null}
          </Card>
        </aside>
      </div>

      {detail ? (
        <DishDetail
          dish={detail.dish}
          selected={detailSelected}
          selectable={detailSelectable}
          hint={detailHint}
          actionLabel={detailActionLabel}
          pending={pending || closed}
          onConfirm={confirmDetail}
          onClose={closeDetail}
        />
      ) : null}
    </main>
  )
}
