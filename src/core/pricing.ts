/**
 * Lógica pura de precios y Huellas (sin dependencias de React Native).
 *
 * IMPORTANTE: esto es solo presentación y prevalidación en cliente. La fuente
 * de verdad de precios es la tabla `products` y la validación vinculante de la
 * recarga personalizada es `validate_custom_topup()` en Postgres.
 */

/** Formatea céntimos como importe en euros para es-ES (p. ej. 1.750 → "17,50 €"). */
export function formatEuros(cents: number): string {
  return new Intl.NumberFormat('es-ES', { style: 'currency', currency: 'EUR' }).format(cents / 100);
}

/** Porcentaje de ahorro entre precio base y final, redondeado a 1 decimal. */
export function savingsPercent(baseCents: number, finalCents: number): number {
  if (baseCents <= 0) return 0;
  return Math.round(((baseCents - finalCents) / baseCents) * 1000) / 10;
}

/** Ahorro absoluto en céntimos. */
export function savingsCents(baseCents: number, finalCents: number): number {
  return Math.max(0, baseCents - finalCents);
}

/** Equivalente mensual de un precio anual, en céntimos (redondeo al céntimo). */
export function monthlyEquivalentCents(annualCents: number): number {
  return Math.round(annualCents / 12);
}

export type CustomTopupError = 'not_integer' | 'below_min' | 'above_max';

export type CustomTopupResult =
  | { ok: true; priceCents: number }
  | { ok: false; error: CustomTopupError };

/**
 * Prevalidación en cliente de la recarga personalizada. Refleja las reglas del
 * servidor (mínimo/máximo/unidad llegan de app_config); el servidor revalida.
 */
export function validateCustomTopup(
  paws: number,
  { min, max, unitPriceCents }: { min: number; max: number; unitPriceCents: number },
): CustomTopupResult {
  if (!Number.isInteger(paws)) return { ok: false, error: 'not_integer' };
  if (paws < min) return { ok: false, error: 'below_min' };
  if (paws > max) return { ok: false, error: 'above_max' };
  return { ok: true, priceCents: paws * unitPriceCents };
}
