import { describe, expect, it } from 'vitest';

import { dayKey, formatDate, formatTime, parseDateParts, parseTimeParts, toDueAtIso } from './datetime';

describe('parseDateParts / parseTimeParts', () => {
  it('parsea fechas válidas y rechaza imposibles', () => {
    expect(parseDateParts('01/09/2026')).toEqual({ year: 2026, month: 9, day: 1 });
    expect(parseDateParts('31/02/2026')).toBeNull();
    expect(parseDateParts('1/9/2026')).toBeNull();
  });

  it('parsea horas válidas y rechaza inválidas', () => {
    expect(parseTimeParts('08:30')).toEqual({ hour: 8, minute: 30 });
    expect(parseTimeParts('24:00')).toBeNull();
    expect(parseTimeParts('10:99')).toBeNull();
  });
});

describe('toDueAtIso (hora de pared → instante UTC)', () => {
  it('09:00 en Madrid en verano es 07:00 UTC', () => {
    expect(toDueAtIso('15/07/2026', '09:00', 'Europe/Madrid')).toBe('2026-07-15T07:00:00.000Z');
  });

  it('09:00 en Madrid en invierno es 08:00 UTC', () => {
    expect(toDueAtIso('15/01/2026', '09:00', 'Europe/Madrid')).toBe('2026-01-15T08:00:00.000Z');
  });

  it('devuelve null si la fecha u hora son inválidas', () => {
    expect(toDueAtIso('99/99/2026', '09:00', 'Europe/Madrid')).toBeNull();
    expect(toDueAtIso('15/07/2026', '99:00', 'Europe/Madrid')).toBeNull();
  });
});

describe('formato de vuelta (instante → hora de pared)', () => {
  it('formatea el instante en la zona (ida y vuelta consistente)', () => {
    const iso = toDueAtIso('15/07/2026', '09:00', 'Europe/Madrid')!;
    expect(formatDate(iso, 'Europe/Madrid')).toBe('15/07/2026');
    expect(formatTime(iso, 'Europe/Madrid')).toBe('09:00');
    expect(dayKey(iso, 'Europe/Madrid')).toBe('2026-07-15');
  });

  it('el mismo instante se ve distinto en otra zona', () => {
    const iso = '2026-07-15T07:00:00.000Z';
    expect(formatTime(iso, 'Europe/Madrid')).toBe('09:00');
    expect(formatTime(iso, 'America/New_York')).toBe('03:00');
  });
});
