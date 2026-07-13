import { describe, expect, it } from 'vitest';

import {
  ageFromBirthDate,
  approximateBirthDate,
  parseSpanishDate,
  parseWeightKg,
  petInputSchema,
} from './petSchema';

const TODAY = new Date('2026-07-13T12:00:00Z');

describe('parseSpanishDate', () => {
  it('convierte DD/MM/AAAA a ISO', () => {
    expect(parseSpanishDate('05/03/2021', TODAY)).toBe('2021-03-05');
  });

  it('rechaza fechas imposibles', () => {
    expect(parseSpanishDate('31/02/2021', TODAY)).toBeNull();
  });

  it('rechaza fechas futuras', () => {
    expect(parseSpanishDate('01/01/2030', TODAY)).toBeNull();
  });

  it('rechaza formatos incorrectos', () => {
    expect(parseSpanishDate('2021-03-05', TODAY)).toBeNull();
    expect(parseSpanishDate('5/3/21', TODAY)).toBeNull();
  });
});

describe('approximateBirthDate + ageFromBirthDate', () => {
  it('una edad aproximada de 3 años produce una fecha coherente', () => {
    const iso = approximateBirthDate(3, TODAY);
    expect(iso).toBe('2023-07-13');
    expect(ageFromBirthDate(iso, TODAY)).toEqual({ years: 3, months: 0 });
  });

  it('calcula meses para cachorros', () => {
    expect(ageFromBirthDate('2026-02-13', TODAY)).toEqual({ years: 0, months: 5 });
  });

  it('devuelve null para fechas futuras', () => {
    expect(ageFromBirthDate('2027-01-01', TODAY)).toBeNull();
  });
});

describe('parseWeightKg', () => {
  it('acepta coma decimal española', () => {
    expect(parseWeightKg('12,5')).toBe(12.5);
  });

  it('acepta punto decimal', () => {
    expect(parseWeightKg('7.25')).toBe(7.25);
  });

  it('rechaza valores fuera de rango', () => {
    expect(parseWeightKg('0,2')).toBeNull();
    expect(parseWeightKg('180')).toBeNull();
  });

  it('rechaza texto no numérico', () => {
    expect(parseWeightKg('doce')).toBeNull();
  });
});

describe('petInputSchema', () => {
  const base = {
    name: 'Luna',
    sex: 'female' as const,
    reproductive_status: 'neutered' as const,
    birth_date: '2021-03-05',
    birth_date_is_approx: false,
    breed: 'Border collie',
    is_mixed_breed: false,
    weight_kg: 17.5,
    activity_level: 'high' as const,
  };

  it('acepta un perfil completo válido', () => {
    expect(petInputSchema.safeParse(base).success).toBe(true);
  });

  it('acepta los campos opcionales como null', () => {
    expect(
      petInputSchema.safeParse({ ...base, birth_date: null, breed: null, weight_kg: null }).success,
    ).toBe(true);
  });

  it('rechaza nombres vacíos o demasiado largos', () => {
    expect(petInputSchema.safeParse({ ...base, name: '' }).success).toBe(false);
    expect(petInputSchema.safeParse({ ...base, name: 'a'.repeat(61) }).success).toBe(false);
  });

  it('rechaza pesos imposibles', () => {
    expect(petInputSchema.safeParse({ ...base, weight_kg: 0 }).success).toBe(false);
    expect(petInputSchema.safeParse({ ...base, weight_kg: 200 }).success).toBe(false);
  });
});
