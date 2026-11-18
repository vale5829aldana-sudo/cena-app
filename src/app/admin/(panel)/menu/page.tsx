import Image from 'next/image'
import { getEvent, getMenuForAdmin } from '@/lib/data'
import { formatCOP } from '@/lib/format'
import { Badge, Card, Checkbox, Input, Label, PageHeader, Textarea } from '@/components/ui'
import { ActionForm, ConfirmButton, SubmitButton } from '@/components/action-form'
import { createDish, deleteDish, toggleDishActive, updateCategory, updateDish } from '../../actions'

export const dynamic = 'force-dynamic'

type DishData = {
  name: string
  description: string
  price: number
  subgroup: string | null
  isVegetarian: boolean
  isVegan: boolean
}

function DishFields({ dish }: { dish?: DishData }) {
  return (
    <>
      <div className="grid gap-3 sm:grid-cols-2">
        <div>
          <Label>Nombre</Label>
          <Input name="name" defaultValue={dish?.name} required />
        </div>
        <div>
          <Label>Precio (COP)</Label>
          <Input name="price" type="number" min={0} step={100} defaultValue={dish?.price} required />
        </div>
        <div className="sm:col-span-2">
          <Label>Descripción</Label>
          <Textarea name="description" rows={2} defaultValue={dish?.description} required />
        </div>
        <div>
          <Label>Subgrupo (opcional)</Label>
          <Input
            name="subgroup"
            defaultValue={dish?.subgroup ?? ''}
            placeholder="Ej. Mocktails"
          />
        </div>
        <div>
          <Label>Imagen (opcional)</Label>
          <input
            type="file"
            name="image"
            accept="image/png,image/jpeg,image/webp,image/gif,image/avif"
            className="block w-full text-xs text-pearl file:mr-3 file:cursor-pointer file:rounded-full file:border-0 file:bg-ivory/10 file:px-4 file:py-2 file:text-xs file:font-medium file:text-ivory hover:file:bg-ivory/15"
          />
        </div>
      </div>
      <div className="mt-4 flex gap-6">
        <Checkbox name="isVegetarian" label="Vegetariano" defaultChecked={dish?.isVegetarian} />
        <Checkbox name="isVegan" label="Vegano" defaultChecked={dish?.isVegan} />
      </div>
    </>
  )
}

export default async function MenuPage() {
  const event = await getEvent()
  if (!event) {
    return (
      <Card>
        <p className="text-sm text-bombay-400">No hay evento configurado.</p>
      </Card>
    )
  }

  const categories = await getMenuForAdmin(event.id)

  return (
    <>
      <PageHeader
        eyebrow="Carta"
        title="Menú"
        subtitle="Administra categorías, platos, bebidas, precios e imágenes."
      />

      <div className="space-y-6">
        {categories.map((cat) => (
          <Card key={cat.id} className="p-6">
            <ActionForm action={updateCategory} className="flex flex-wrap items-end gap-3">
              <input type="hidden" name="id" value={cat.id} />
              <div className="min-w-[180px] flex-1">
                <Label>Categoría</Label>
                <Input name="name" defaultValue={cat.name} required />
              </div>
              <div className="w-full sm:w-44">
                <Label>Tope de precio (COP)</Label>
                <Input
                  name="maxPrice"
                  type="number"
                  min={0}
                  step={1000}
                  defaultValue={cat.maxPrice}
                  required
                />
              </div>
              <SubmitButton variant="secondary" pendingLabel="Guardando…">
                Guardar categoría
              </SubmitButton>
            </ActionForm>
            <p className="mt-2.5 text-xs text-pearl">
              {cat.dishes.length} platos ·{" "}
              {cat.shareable ? "Se comparte entre dos comensales" : "Individual"}
            </p>

            <div className="mt-4 space-y-2">
              {cat.dishes.map((dish) => (
                <details
                  key={dish.id}
                  className="group rounded-xl border border-ivory/10 bg-night-950/30"
                >
                  <summary className="flex cursor-pointer list-none items-center justify-between gap-3 px-3.5 py-2.5 [&::-webkit-details-marker]:hidden">
                    <span className="flex min-w-0 items-center gap-3">
                      {dish.imageUrl ? (
                        <Image
                          src={dish.imageUrl}
                          alt={dish.name}
                          width={40}
                          height={40}
                          className="h-10 w-10 rounded-lg object-cover"
                        />
                      ) : (
                        <span className="flex h-10 w-10 items-center justify-center rounded-lg border border-ivory/10 bg-night-900/60 text-gold-500/70">
                          <svg
                            viewBox="0 0 24 24"
                            className="h-4 w-4"
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
                      <span className="truncate font-medium text-ivory">{dish.name}</span>
                      {!dish.active ? <Badge tone="red">Oculto</Badge> : null}
                      {dish.isVegan ? <Badge tone="green">Vegano</Badge> : null}
                    </span>
                    <span className="flex items-center gap-3">
                      <span className="whitespace-nowrap font-display text-sm text-gold-400">
                        {formatCOP(dish.price)}
                      </span>
                      <span className="text-pearl transition-transform duration-300 group-open:rotate-180">
                        ⌄
                      </span>
                    </span>
                  </summary>

                  <div className="border-t border-ivory/10 p-4">
                    <ActionForm action={updateDish} encType="multipart/form-data">
                      <input type="hidden" name="id" value={dish.id} />
                      <DishFields dish={dish} />
                      <div className="mt-4">
                        <SubmitButton pendingLabel="Guardando…">Guardar cambios</SubmitButton>
                      </div>
                    </ActionForm>

                    <div className="mt-4 flex flex-wrap gap-2 border-t border-ivory/10 pt-4">
                      <ActionForm action={toggleDishActive}>
                        <input type="hidden" name="id" value={dish.id} />
                        <SubmitButton variant="secondary" size="sm" pendingLabel="…">
                          {dish.active ? "Ocultar del menú" : "Mostrar en el menú"}
                        </SubmitButton>
                      </ActionForm>
                      <ActionForm action={deleteDish}>
                        <input type="hidden" name="id" value={dish.id} />
                        <ConfirmButton
                          message={`¿Eliminar "${dish.name}"?`}
                          className="border border-bombay-600/50 text-bombay-400 hover:bg-bombay-600/15"
                        >
                          Eliminar
                        </ConfirmButton>
                      </ActionForm>
                    </div>
                  </div>
                </details>
              ))}
            </div>

            <details className="mt-4">
              <summary className="cursor-pointer list-none text-sm font-medium text-gold-400 transition-colors hover:text-gold-300 [&::-webkit-details-marker]:hidden">
                + Agregar plato a {cat.name}
              </summary>
              <div className="mt-4">
                <ActionForm
                  action={createDish}
                  encType="multipart/form-data"
                  resetOnSuccess
                  className="rounded-xl border border-ivory/10 bg-night-950/40 p-4"
                >
                  <input type="hidden" name="categoryId" value={cat.id} />
                  <DishFields />
                  <div className="mt-4">
                    <SubmitButton pendingLabel="Agregando…">Agregar plato</SubmitButton>
                  </div>
                </ActionForm>
              </div>
            </details>
          </Card>
        ))}
      </div>
    </>
  )
}
