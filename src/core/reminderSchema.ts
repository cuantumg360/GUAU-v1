import { z } from 'zod';

import { repeatFrequencies } from '@/core/recurrence';

/**
 * Validación del recordatorio compartida por creación y edición.
 * Lógica pura (testeable con Vitest, sin React Native).
 */

export const reminderCategories = [
  'vet_appointment',
  'vaccine',
  'deworming',
  'medication',
  'food_purchase',
  'grooming',
  'bath',
  'training',
  'activity',
  'trip',
  'walk',
  'custom',
] as const;
export type ReminderCategory = (typeof reminderCategories)[number];

export const reminderPriorities = ['low', 'normal', 'high'] as const;

export const reminderInputSchema = z.object({
  title: z.string().trim().min(1).max(120),
  description: z.string().trim().max(1000).nullable(),
  category: z.enum(reminderCategories),
  pet_id: z.string().uuid().nullable(),
  due_at: z.string().datetime(),
  timezone: z.string().min(1),
  all_day: z.boolean(),
  repeat_frequency: z.enum(repeatFrequencies),
  repeat_interval: z.number().int().min(1).max(365),
  // Antelaciones en minutos: enteras, no negativas, sin duplicados, máx. 5.
  lead_minutes: z.array(z.number().int().min(0).max(20160)).max(5),
  priority: z.enum(reminderPriorities),
  notes: z.string().trim().max(1000).nullable(),
});

export type ReminderInput = z.infer<typeof reminderInputSchema>;

/** Antelaciones de aviso predefinidas (minutos) que ofrece la UI. */
export const LEAD_PRESETS: { minutes: number; labelKey: string }[] = [
  { minutes: 0, labelKey: 'reminders.lead_at_time' },
  { minutes: 15, labelKey: 'reminders.lead_15m' },
  { minutes: 60, labelKey: 'reminders.lead_1h' },
  { minutes: 1440, labelKey: 'reminders.lead_1d' },
  { minutes: 10080, labelKey: 'reminders.lead_1w' },
];

/** Normaliza antelaciones: únicas y ordenadas descendentemente (aviso más lejano primero). */
export function normalizeLeadMinutes(minutes: number[]): number[] {
  return [...new Set(minutes.filter((m) => Number.isInteger(m) && m >= 0))].sort((a, b) => b - a);
}
