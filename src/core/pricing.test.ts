import { describe, expect, it } from 'vitest';

import {
  formatEuros,
  monthlyEquivalentCents,
  savingsCents,
  savingsPercent,
  validateCustomTopup,
} from './pricing';

// Cifras contractuales del brief de producto (docs/09-monetization.md).
const PRO_MONTHLY_CENTS = 1995;
const PRO_ANNUAL_CENTS = 16595;
const TWELVE_MONTHS_CENTS = PRO_MONTHLY_CENTS * 12;

describe('plan Pro', () => {
  it('doce mensualidades cuestan 239,40 €', () => {
    expect(TWELVE_MONTHS_CENTS).toBe(23940);
  });

  it('el plan anual ahorra 73,45 €', () => {
    expect(savingsCents(TWELVE_MONTHS_CENTS, PRO_ANNUAL_CENTS)).toBe(7345);
  });

  it('el plan anual equivale a ~13,83 €/mes', () => {
    expect(monthlyEquivalentCents(PRO_ANNUAL_CENTS)).toBe(1383);
  });

  it('el ahorro anual es ~30,7 %', () => {
    expect(savingsPercent(TWELVE_MONTHS_CENTS, PRO_ANNUAL_CENTS)).toBeCloseTo(30.7, 1);
  });
});

describe('packs de Huellas (30 % de descuento fijo)', () => {
  it.each([
    [25, 2500, 1750],
    [50, 5000, 3500],
    [100, 10000, 7000],
  ])('pack de %i Huellas: %i céntimos → %i céntimos', (_paws, base, final) => {
    expect(savingsPercent(base, final)).toBe(30);
  });
});

describe('recarga personalizada', () => {
  const rules = { min: 5, max: 500, unitPriceCents: 100 };

  it('acepta el mínimo de 5 Huellas a 1 €/Huella sin descuento', () => {
    expect(validateCustomTopup(5, rules)).toEqual({ ok: true, priceCents: 500 });
  });

  it('rechaza cantidades por debajo del mínimo', () => {
    expect(validateCustomTopup(4, rules)).toEqual({ ok: false, error: 'below_min' });
  });

  it('rechaza cantidades no enteras', () => {
    expect(validateCustomTopup(7.5, rules)).toEqual({ ok: false, error: 'not_integer' });
  });

  it('rechaza cantidades por encima del máximo configurado', () => {
    expect(validateCustomTopup(501, rules)).toEqual({ ok: false, error: 'above_max' });
  });
});

describe('formato de moneda es-ES', () => {
  it('formatea céntimos como euros', () => {
    // Nota: Intl usa espacio no separable antes del símbolo.
    expect(formatEuros(1750).replace(/ /g, ' ')).toBe('17,50 €');
  });
});
