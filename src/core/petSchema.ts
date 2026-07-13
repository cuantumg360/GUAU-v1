import { z } from 'zod';

/**
 * Validación del perfil del perro compartida por onboarding y edición.
 * Lógica pura (testeable con Vitest, sin React Native).
 */

export const petSexValues = ['male', 'female', 'unknown'] as const;
export const reproductiveValues = ['intact', 'neutered', 'unknown'] as const;
export const activityValues = ['low', 'medium', 'high', 'unknown'] as const;

export const petInputSchema = z.object({
  name: z.string().trim().min(1).max(60),
  sex: z.enum(petSexValues),
  reproductive_status: z.enum(reproductiveValues),
  birth_date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).nullable(),
  birth_date_is_approx: z.boolean(),
  breed: z.string().trim().max(80).nullable(),
  is_mixed_breed: z.boolean(),
  weight_kg: z.number().gt(0.4).lt(121).nullable(),
  activity_level: z.enum(activityValues),
});

export type PetInput = z.infer<typeof petInputSchema>;

/**
 * Convierte "DD/MM/AAAA" a fecha ISO (AAAA-MM-DD). Devuelve null si el texto
 * no es una fecha real o está en el futuro (`today` inyectable para tests).
 */
export function parseSpanishDate(text: string, today: Date = new Date()): string | null {
  const match = /^(\d{2})\/(\d{2})\/(\d{4})$/.exec(text.trim());
  if (!match) return null;
  const [, dd, mm, yyyy] = match;
  const day = Number(dd);
  const month = Number(mm);
  const year = Number(yyyy);
  const date = new Date(Date.UTC(year, month - 1, day));
  const isReal =
    date.getUTCFullYear() === year && date.getUTCMonth() === month - 1 && date.getUTCDate() === day;
  if (!isReal) return null;
  if (date.getTime() > today.getTime()) return null;
  if (year < 1990) return null; // fuera de rango plausible para un perro vivo
  return `${yyyy}-${mm}-${dd}`;
}

/** Fecha ISO aproximada restando años completos a la fecha actual (1 de enero no: mismo día). */
export function approximateBirthDate(yearsOld: number, today: Date = new Date()): string {
  const d = new Date(Date.UTC(today.getUTCFullYear() - yearsOld, today.getUTCMonth(), today.getUTCDate()));
  return d.toISOString().slice(0, 10);
}

/** Edad en años y meses a partir de una fecha ISO. */
export function ageFromBirthDate(
  birthDate: string,
  today: Date = new Date(),
): { years: number; months: number } | null {
  const birth = new Date(`${birthDate}T00:00:00Z`);
  if (Number.isNaN(birth.getTime()) || birth.getTime() > today.getTime()) return null;
  let years = today.getUTCFullYear() - birth.getUTCFullYear();
  let months = today.getUTCMonth() - birth.getUTCMonth();
  if (today.getUTCDate() < birth.getUTCDate()) months -= 1;
  if (months < 0) {
    years -= 1;
    months += 12;
  }
  return { years, months };
}

/** Normaliza un peso escrito con coma o punto decimal. */
export function parseWeightKg(text: string): number | null {
  const normalized = text.trim().replace(',', '.');
  if (!/^\d{1,3}(\.\d{1,2})?$/.test(normalized)) return null;
  const value = Number(normalized);
  if (value <= 0.4 || value >= 121) return null;
  return value;
}
