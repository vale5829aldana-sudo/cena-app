// Reglas de negocio de la Cena App.

export type BudgetBreakdown = {
  limit: number
  entradaPrice: number
  entradaShare: number
  platoPrice: number
  bebidaPrice: number
  total: number
  remaining: number
  withinBudget: boolean
}

/** Mitad del precio de la entrada (lo que paga cada comensal). */
export function entradaShare(price: number) {
  return Math.round(price / 2)
}

export function computeBudget(input: {
  limit: number
  entradaPrice?: number | null
  platoPrice?: number | null
  bebidaPrice?: number | null
}): BudgetBreakdown {
  const entradaPrice = input.entradaPrice ?? 0
  const platoPrice = input.platoPrice ?? 0
  const bebidaPrice = input.bebidaPrice ?? 0
  const share = entradaShare(entradaPrice)
  const total = share + platoPrice + bebidaPrice
  const remaining = input.limit - total
  return {
    limit: input.limit,
    entradaPrice,
    entradaShare: share,
    platoPrice,
    bebidaPrice,
    total,
    remaining,
    withinBudget: total <= input.limit,
  }
}

/**
 * Valida que un plato no supere el tope de su categoría.
 */
export function exceedsCategoryCap(price: number, maxPrice: number) {
  return price > maxPrice
}
