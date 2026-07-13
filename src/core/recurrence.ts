/**
 * Lógica pura de recordatorios: recurrencia y antelaciones de aviso.
 * Sin dependencias de React Native (testeable con Vitest).
 *
 * Diseño de zona horaria: `due_at` es un instante absoluto (ISO/UTC). La hora
 * "de pared" que ve el usuario se interpreta en la zona horaria del recordatorio
 * al construir el instante (en la capa de UI). Aquí operamos sobre instantes
 * absolutos, de modo que las repeticiones son deterministas independientemente
 * de dónde se ejecute el cálculo. Los saltos de horario de verano se resuelven
 * en la capa de presentación con Intl; el motor de recurrencia trabaja en UTC
 * para evitar dobles avisos o días perdidos.
 */

export const repeatFrequencies = ['none', 'daily', 'weekly', 'monthly', 'yearly'] as const;
export type RepeatFrequency = (typeof repeatFrequencies)[number];

export type RepeatRule = {
  frequency: RepeatFrequency;
  /** Cada cuántas unidades se repite (>=1). Ignorado si frequency='none'. */
  interval: number;
};

export const NONE_REPEAT: RepeatRule = { frequency: 'none', interval: 1 };

/** Avanza un instante ISO una unidad de repetición. Devuelve ISO en UTC. */
export function advance(iso: string, rule: RepeatRule): string {
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) throw new Error('INVALID_DATE');
  const step = Math.max(1, Math.floor(rule.interval));
  const d = new Date(date.getTime());
  switch (rule.frequency) {
    case 'none':
      return date.toISOString();
    case 'daily':
      d.setUTCDate(d.getUTCDate() + step);
      break;
    case 'weekly':
      d.setUTCDate(d.getUTCDate() + step * 7);
      break;
    case 'monthly':
      d.setUTCMonth(d.getUTCMonth() + step);
      break;
    case 'yearly':
      d.setUTCFullYear(d.getUTCFullYear() + step);
      break;
  }
  return d.toISOString();
}

/**
 * Próxima ocurrencia estrictamente posterior a `after` (por defecto ahora).
 * Para 'none', devuelve el propio `startIso` si aún es futuro, o null si pasó.
 * Devuelve null si no hay siguiente (regla none ya vencida).
 */
export function nextOccurrence(
  startIso: string,
  rule: RepeatRule,
  after: Date = new Date(),
): string | null {
  const afterMs = after.getTime();
  let current = new Date(startIso);
  if (Number.isNaN(current.getTime())) throw new Error('INVALID_DATE');

  if (rule.frequency === 'none') {
    return current.getTime() > afterMs ? current.toISOString() : null;
  }

  // Avanza hasta superar `after`. Cota de seguridad para evitar bucles infinitos
  // ante reglas degeneradas.
  let guard = 0;
  while (current.getTime() <= afterMs) {
    current = new Date(advance(current.toISOString(), rule));
    if (++guard > 10000) return null;
  }
  return current.toISOString();
}

/**
 * Expande las ocurrencias de un recordatorio dentro de [from, to] (inclusive).
 * Limita la cantidad para no desbordar en repeticiones frecuentes.
 */
export function occurrencesInRange(
  startIso: string,
  rule: RepeatRule,
  from: Date,
  to: Date,
  maxCount = 366,
): string[] {
  const result: string[] = [];
  const fromMs = from.getTime();
  const toMs = to.getTime();
  let current = new Date(startIso);
  if (Number.isNaN(current.getTime())) throw new Error('INVALID_DATE');

  if (rule.frequency === 'none') {
    const t = current.getTime();
    return t >= fromMs && t <= toMs ? [current.toISOString()] : [];
  }

  // Salta las ocurrencias anteriores a `from`.
  let guard = 0;
  while (current.getTime() < fromMs && guard < 100000) {
    current = new Date(advance(current.toISOString(), rule));
    guard++;
  }
  while (current.getTime() <= toMs && result.length < maxCount) {
    if (current.getTime() >= fromMs) result.push(current.toISOString());
    current = new Date(advance(current.toISOString(), rule));
  }
  return result;
}

/**
 * Instantes de aviso: para cada antelación (minutos) resta ese tiempo al
 * instante del evento. Descarta avisos que caerían en el pasado respecto a
 * `now`. Devuelve ISO ordenados ascendentemente y sin duplicados.
 */
export function notificationTimes(
  occurrenceIso: string,
  leadMinutes: number[],
  now: Date = new Date(),
): string[] {
  const base = new Date(occurrenceIso).getTime();
  if (Number.isNaN(base)) throw new Error('INVALID_DATE');
  const nowMs = now.getTime();
  const times = new Set<string>();
  for (const lead of leadMinutes.length > 0 ? leadMinutes : [0]) {
    const t = base - Math.max(0, lead) * 60_000;
    if (t > nowMs) times.add(new Date(t).toISOString());
  }
  return [...times].sort();
}

/**
 * Construye un instante UTC a partir de la fecha/hora "de pared" del usuario y
 * su zona horaria IANA. Resuelve el desfase de la zona en esa fecha concreta
 * (incluye horario de verano) usando Intl. `wall` = {y,m,d,hh,mm}.
 */
export function wallTimeToUtc(
  wall: { year: number; month: number; day: number; hour: number; minute: number },
  timeZone: string,
): string {
  // Instante candidato interpretando la hora de pared como si fuera UTC.
  const asUtc = Date.UTC(wall.year, wall.month - 1, wall.day, wall.hour, wall.minute);
  // Desfase de la zona en ese instante: diferencia entre la hora de pared
  // formateada en la zona y el instante UTC candidato.
  const offset = timeZoneOffsetMs(asUtc, timeZone);
  return new Date(asUtc - offset).toISOString();
}

/** Desfase (ms) de una zona horaria IANA respecto a UTC en un instante dado. */
export function timeZoneOffsetMs(utcMs: number, timeZone: string): number {
  const dtf = new Intl.DateTimeFormat('en-US', {
    timeZone,
    hourCycle: 'h23',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
  });
  const parts = dtf.formatToParts(new Date(utcMs));
  const map: Record<string, number> = {};
  for (const p of parts) {
    if (p.type !== 'literal') map[p.type] = Number(p.value);
  }
  const asIfUtc = Date.UTC(map.year, map.month - 1, map.day, map.hour, map.minute, map.second);
  return asIfUtc - utcMs;
}
