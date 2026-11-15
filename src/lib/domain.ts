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

/** Fracción de la entrada que paga cada comensal. */
export const SHARED_ENTRADA_FACTOR = 0.5
export const SOLO_ENTRADA_FACTOR = 1

/**
 * Parte del precio de la entrada que paga el comensal.
 * `factor` es 0.5 si la comparte con alguien o 1 si la toma sola (RN-6).
 */
export function entradaShare(price: number, factor: number = SHARED_ENTRADA_FACTOR) {
  return Math.round(price * factor)
}

export function computeBudget(input: {
  limit: number
  entradaPrice?: number | null
  /** 0.5 entrada compartida (por defecto) o 1 entrada individual (RN-6). */
  entradaShareFactor?: number
  platoPrice?: number | null
  bebidaPrice?: number | null
}): BudgetBreakdown {
  const entradaPrice = input.entradaPrice ?? 0
  const platoPrice = input.platoPrice ?? 0
  const bebidaPrice = input.bebidaPrice ?? 0
  const share = entradaShare(entradaPrice, input.entradaShareFactor ?? SHARED_ENTRADA_FACTOR)
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
