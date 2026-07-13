import { describe, expect, it } from 'vitest';

import { normalizeLeadMinutes, reminderInputSchema, type ReminderInput } from './reminderSchema';

const base: ReminderInput = {
  title: 'Vacuna anual',
  description: null,
  category: 'vaccine',
  pet_id: '3f2504e0-4f89-41d3-9a0c-0305e82c3301',
  due_at: '2026-09-01T08:00:00.000Z',
  timezone: 'Europe/Madrid',
  all_day: false,
  repeat_frequency: 'yearly',
  repeat_interval: 1,
  lead_minutes: [1440, 60],
  priority: 'high',
  notes: null,
};

describe('reminderInputSchema', () => {
  it('acepta un recordatorio válido', () => {
    expect(reminderInputSchema.safeParse(base).success).toBe(true);
  });

  it('acepta pet_id nulo (recordatorio no ligado a un perro)', () => {
    expect(reminderInputSchema.safeParse({ ...base, pet_id: null }).success).toBe(true);
  });

  it('rechaza título vacío o excesivo', () => {
    expect(reminderInputSchema.safeParse({ ...base, title: '' }).success).toBe(false);
    expect(reminderInputSchema.safeParse({ ...base, title: 'a'.repeat(121) }).success).toBe(false);
  });

  it('rechaza fecha no ISO', () => {
    expect(reminderInputSchema.safeParse({ ...base, due_at: '01/09/2026' }).success).toBe(false);
  });

  it('rechaza intervalo de repetición fuera de rango', () => {
    expect(reminderInputSchema.safeParse({ ...base, repeat_interval: 0 }).success).toBe(false);
    expect(reminderInputSchema.safeParse({ ...base, repeat_interval: 400 }).success).toBe(false);
  });

  it('rechaza más de 5 antelaciones o valores negativos', () => {
    expect(reminderInputSchema.safeParse({ ...base, lead_minutes: [1, 2, 3, 4, 5, 6] }).success).toBe(false);
    expect(reminderInputSchema.safeParse({ ...base, lead_minutes: [-5] }).success).toBe(false);
  });
});

describe('normalizeLeadMinutes', () => {
  it('elimina duplicados y ordena de mayor a menor', () => {
    expect(normalizeLeadMinutes([60, 1440, 60, 15])).toEqual([1440, 60, 15]);
  });

  it('descarta valores no enteros o negativos', () => {
    expect(normalizeLeadMinutes([30, -1, 2.5, 0])).toEqual([30, 0]);
  });
});
