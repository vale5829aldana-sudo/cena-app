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
            className="block w-full text-sm text-zinc-500 file:mr-3 file:rounded-lg file:border-0 file:bg-zinc-100 file:px-3 file:py-2 file:text-sm file:font-medium dark:file:bg-zinc-800"
          />
        </div>
      </div>
      <div className="mt-3 flex gap-5">
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
        <p className="text-sm text-red-600">No hay evento configurado.</p>
      </Card>
    )
  }

  const categories = await getMenuForAdmin(event.id)

  return (
    <>
      <PageHeader
        title="Menú"
        subtitle="Administra categorías, platos, bebidas, precios e imágenes."
      />

      <div className="space-y-6">
        {categories.map((cat) => (
          <Card key={cat.id}>
            <ActionForm action={updateCategory} className="flex flex-wrap items-end gap-3">
              <input type="hidden" name="id" value={cat.id} />
              <div className="min-w-[180px] flex-1">
                <Label>Categoría</Label>
                <Input name="name" defaultValue={cat.name} required />
              </div>
              <div className="w-44">
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
            <p className="mt-2 text-xs text-zinc-500">
              {cat.dishes.length} platos ·{" "}
              {cat.shareable ? "Se comparte entre dos comensales" : "Individual"}
            </p>

            <div className="mt-4 space-y-2">
              {cat.dishes.map((dish) => (
                <details
                  key={dish.id}
                  className="rounded-xl border border-zinc-200 dark:border-zinc-800"
                >
                  <summary className="flex cursor-pointer items-center justify-between gap-3 px-3 py-2">
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
                        <span className="flex h-10 w-10 items-center justify-center rounded-lg bg-zinc-100 text-lg dark:bg-zinc-800">
                          🍽️
                        </span>
                      )}
                      <span className="truncate font-medium">{dish.name}</span>
                      {!dish.active ? <Badge tone="red">Oculto</Badge> : null}
                      {dish.isVegan ? <Badge tone="green">Vegano</Badge> : null}
                    </span>
                    <span className="whitespace-nowrap text-sm font-semibold text-amber-700 dark:text-amber-400">
                      {formatCOP(dish.price)}
                    </span>
                  </summary>

                  <div className="border-t border-zinc-100 p-3 dark:border-zinc-800">
                    <ActionForm action={updateDish} encType="multipart/form-data">
                      <input type="hidden" name="id" value={dish.id} />
                      <DishFields dish={dish} />
                      <div className="mt-3">
                        <SubmitButton pendingLabel="Guardando…">Guardar cambios</SubmitButton>
                      </div>
                    </ActionForm>

                    <div className="mt-3 flex flex-wrap gap-2 border-t border-zinc-100 pt-3 dark:border-zinc-800">
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
                          className="text-red-600 hover:bg-red-50 dark:hover:bg-red-950/40"
                        >
                          Eliminar
                        </ConfirmButton>
                      </ActionForm>
                    </div>
                  </div>
                </details>
              ))}
            </div>

            <details className="mt-3">
              <summary className="cursor-pointer text-sm font-medium text-amber-600">
                + Agregar plato a {cat.name}
              </summary>
              <div className="mt-3">
                <ActionForm
                  action={createDish}
                  encType="multipart/form-data"
                  resetOnSuccess
                  className="rounded-xl bg-zinc-50 p-3 dark:bg-zinc-950/40"
                >
                  <input type="hidden" name="categoryId" value={cat.id} />
                  <DishFields />
                  <div className="mt-3">
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
