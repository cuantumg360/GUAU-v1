import { timeZoneOffsetMs, wallTimeToUtc } from '@/core/recurrence';

/**
 * Utilidades de fecha/hora para la UI de recordatorios (lógica pura).
 * La UI trabaja con hora "de pared" (DD/MM/AAAA + HH:MM) en una zona horaria;
 * el almacenamiento usa instantes absolutos (ISO/UTC).
 */

/** Parsea "DD/MM/AAAA" a componentes; null si no es una fecha real. */
export function parseDateParts(text: string): { year: number; month: number; day: number } | null {
  const m = /^(\d{2})\/(\d{2})\/(\d{4})$/.exec(text.trim());
  if (!m) return null;
  const day = Number(m[1]);
  const month = Number(m[2]);
  const year = Number(m[3]);
  const probe = new Date(Date.UTC(year, month - 1, day));
  if (probe.getUTCFullYear() !== year || probe.getUTCMonth() !== month - 1 || probe.getUTCDate() !== day) {
    return null;
  }
  if (year < 2000 || year > 2100) return null;
  return { year, month, day };
}

/** Parsea "HH:MM" (24h) a componentes; null si es inválida. */
export function parseTimeParts(text: string): { hour: number; minute: number } | null {
  const m = /^(\d{1,2}):(\d{2})$/.exec(text.trim());
  if (!m) return null;
  const hour = Number(m[1]);
  const minute = Number(m[2]);
  if (hour < 0 || hour > 23 || minute < 0 || minute > 59) return null;
  return { hour, minute };
}

/**
 * Combina fecha + hora de pared en una zona horaria y devuelve el instante ISO
 * (UTC). Devuelve null si alguna parte es inválida.
 */
export function toDueAtIso(
  dateText: string,
  timeText: string,
  timeZone: string,
): string | null {
  const date = parseDateParts(dateText);
  const time = parseTimeParts(timeText);
  if (!date || !time) return null;
  return wallTimeToUtc({ ...date, hour: time.hour, minute: time.minute }, timeZone);
}

/** Formatea un instante ISO como "DD/MM/AAAA" en la zona indicada. */
export function formatDate(iso: string, timeZone: string): string {
  const wall = wallParts(iso, timeZone);
  return `${pad(wall.day)}/${pad(wall.month)}/${wall.year}`;
}

/** Formatea un instante ISO como "HH:MM" en la zona indicada. */
export function formatTime(iso: string, timeZone: string): string {
  const wall = wallParts(iso, timeZone);
  return `${pad(wall.hour)}:${pad(wall.minute)}`;
}

/** Día del calendario (AAAA-MM-DD) del instante en la zona; útil para agrupar. */
export function dayKey(iso: string, timeZone: string): string {
  const wall = wallParts(iso, timeZone);
  return `${wall.year}-${pad(wall.month)}-${pad(wall.day)}`;
}

function pad(n: number): string {
  return String(n).padStart(2, '0');
}

function wallParts(iso: string, timeZone: string) {
  const utcMs = new Date(iso).getTime();
  const offset = timeZoneOffsetMs(utcMs, timeZone);
  const local = new Date(utcMs + offset);
  return {
    year: local.getUTCFullYear(),
    month: local.getUTCMonth() + 1,
    day: local.getUTCDate(),
    hour: local.getUTCHours(),
    minute: local.getUTCMinutes(),
  };
}
