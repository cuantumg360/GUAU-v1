import { describe, expect, it } from 'vitest';

import {
  advance,
  nextOccurrence,
  notificationTimes,
  occurrencesInRange,
  timeZoneOffsetMs,
  wallTimeToUtc,
  type RepeatRule,
} from './recurrence';

const daily: RepeatRule = { frequency: 'daily', interval: 1 };
const everyOtherDay: RepeatRule = { frequency: 'daily', interval: 2 };
const weekly: RepeatRule = { frequency: 'weekly', interval: 1 };
const monthly: RepeatRule = { frequency: 'monthly', interval: 1 };
const yearly: RepeatRule = { frequency: 'yearly', interval: 1 };
const none: RepeatRule = { frequency: 'none', interval: 1 };

describe('advance', () => {
  it('suma días, semanas, meses y años en UTC', () => {
    expect(advance('2026-01-01T09:00:00.000Z', daily)).toBe('2026-01-02T09:00:00.000Z');
    expect(advance('2026-01-01T09:00:00.000Z', weekly)).toBe('2026-01-08T09:00:00.000Z');
    expect(advance('2026-01-31T09:00:00.000Z', monthly)).toBe('2026-03-03T09:00:00.000Z'); // 31 ene +1 mes → desborda a marzo
    expect(advance('2024-02-29T09:00:00.000Z', yearly)).toBe('2025-03-01T09:00:00.000Z'); // bisiesto → 1 mar
  });

  it('respeta el intervalo', () => {
    expect(advance('2026-01-01T09:00:00.000Z', everyOtherDay)).toBe('2026-01-03T09:00:00.000Z');
  });
});

describe('nextOccurrence', () => {
  it('none: futuro devuelve el propio inicio; pasado devuelve null', () => {
    const after = new Date('2026-07-13T12:00:00Z');
    expect(nextOccurrence('2026-07-20T10:00:00.000Z', none, after)).toBe('2026-07-20T10:00:00.000Z');
    expect(nextOccurrence('2026-07-01T10:00:00.000Z', none, after)).toBeNull();
  });

  it('recurrente: avanza hasta superar el instante de referencia', () => {
    const after = new Date('2026-07-13T12:00:00Z');
    // Inicio en el pasado, diario → primera ocurrencia futura
    expect(nextOccurrence('2026-07-10T09:00:00.000Z', daily, after)).toBe('2026-07-14T09:00:00.000Z');
  });

  it('recurrente: si el inicio ya es futuro, es la próxima', () => {
    const after = new Date('2026-07-13T12:00:00Z');
    expect(nextOccurrence('2026-07-13T18:00:00.000Z', weekly, after)).toBe('2026-07-13T18:00:00.000Z');
  });
});

describe('occurrencesInRange', () => {
  it('expande un diario dentro del rango', () => {
    const from = new Date('2026-07-13T00:00:00Z');
    const to = new Date('2026-07-16T23:59:59Z');
    const occ = occurrencesInRange('2026-07-10T09:00:00.000Z', daily, from, to);
    expect(occ).toEqual([
      '2026-07-13T09:00:00.000Z',
      '2026-07-14T09:00:00.000Z',
      '2026-07-15T09:00:00.000Z',
      '2026-07-16T09:00:00.000Z',
    ]);
  });

  it('none dentro del rango devuelve una ocurrencia; fuera, ninguna', () => {
    const from = new Date('2026-07-13T00:00:00Z');
    const to = new Date('2026-07-14T00:00:00Z');
    expect(occurrencesInRange('2026-07-13T10:00:00.000Z', none, from, to)).toHaveLength(1);
    expect(occurrencesInRange('2026-08-13T10:00:00.000Z', none, from, to)).toHaveLength(0);
  });
});

describe('notificationTimes', () => {
  it('resta cada antelación y descarta avisos pasados', () => {
    const now = new Date('2026-07-13T08:00:00Z');
    const occ = '2026-07-13T10:00:00.000Z';
    // 1 día antes cae en el pasado (se descarta); 60 y 15 min antes son futuros
    const times = notificationTimes(occ, [1440, 60, 15], now);
    expect(times).toEqual(['2026-07-13T09:00:00.000Z', '2026-07-13T09:45:00.000Z']);
  });

  it('sin antelaciones avisa en el propio instante', () => {
    const now = new Date('2026-07-13T08:00:00Z');
    expect(notificationTimes('2026-07-13T10:00:00.000Z', [], now)).toEqual(['2026-07-13T10:00:00.000Z']);
  });
});

describe('zonas horarias', () => {
  it('Europe/Madrid en verano está en UTC+2 (CEST)', () => {
    // 15 jul 2026 12:00 UTC → offset +2h
    const offset = timeZoneOffsetMs(Date.parse('2026-07-15T12:00:00Z'), 'Europe/Madrid');
    expect(offset).toBe(2 * 60 * 60 * 1000);
  });

  it('Europe/Madrid en invierno está en UTC+1 (CET)', () => {
    const offset = timeZoneOffsetMs(Date.parse('2026-01-15T12:00:00Z'), 'Europe/Madrid');
    expect(offset).toBe(1 * 60 * 60 * 1000);
  });

  it('9:00 hora de pared en Madrid en verano equivale a 07:00 UTC', () => {
    const utc = wallTimeToUtc(
      { year: 2026, month: 7, day: 15, hour: 9, minute: 0 },
      'Europe/Madrid',
    );
    expect(utc).toBe('2026-07-15T07:00:00.000Z');
  });

  it('9:00 hora de pared en Madrid en invierno equivale a 08:00 UTC', () => {
    const utc = wallTimeToUtc(
      { year: 2026, month: 1, day: 15, hour: 9, minute: 0 },
      'Europe/Madrid',
    );
    expect(utc).toBe('2026-01-15T08:00:00.000Z');
  });
});
