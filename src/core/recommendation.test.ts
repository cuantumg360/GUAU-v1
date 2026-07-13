import { describe, expect, it } from 'vitest';

import {
  eligibleActivities,
  pickDailyActivity,
  type ActivityCandidate,
} from './recommendation';

const acts: ActivityCandidate[] = [
  { id: 'a', slug: 'busca-premio', category: 'play', difficulty: 1, minActivityLevel: 'low' },
  { id: 'b', slug: 'manta-segura', category: 'calm', difficulty: 1, minActivityLevel: 'low' },
  { id: 'c', slug: 'mirame', category: 'communication', difficulty: 2, minActivityLevel: 'medium' },
  { id: 'd', slug: 'paseo-olfateo', category: 'play', difficulty: 1, minActivityLevel: 'medium' },
  { id: 'e', slug: 'agility', category: 'play', difficulty: 3, minActivityLevel: 'high' },
];

describe('eligibleActivities', () => {
  it('un perro tranquilo solo recibe actividades de nivel bajo', () => {
    const r = eligibleActivities(acts, 'low').map((a) => a.id);
    expect(r).toEqual(['a', 'b']);
  });

  it('un perro muy activo recibe todas', () => {
    expect(eligibleActivities(acts, 'high')).toHaveLength(5);
  });

  it('unknown se trata como nivel medio', () => {
    const r = eligibleActivities(acts, 'unknown').map((a) => a.id);
    expect(r).toEqual(['a', 'b', 'c', 'd']);
  });
});

describe('pickDailyActivity', () => {
  it('es determinista para el mismo día', () => {
    const first = pickDailyActivity(acts, { dateKey: '2026-07-13', petLevel: 'high' });
    const again = pickDailyActivity(acts, { dateKey: '2026-07-13', petLevel: 'high' });
    expect(first?.id).toBe(again?.id);
  });

  it('no repite una actividad hecha recientemente', () => {
    const chosen = pickDailyActivity(acts, { dateKey: '2026-07-13', petLevel: 'low' });
    const next = pickDailyActivity(acts, {
      dateKey: '2026-07-13',
      petLevel: 'low',
      recentActivityIds: [chosen!.id],
    });
    expect(next?.id).not.toBe(chosen?.id);
  });

  it('penaliza categorías recientes para variar', () => {
    // Perro high; si 'play' es reciente, debería preferir otra categoría.
    const result = pickDailyActivity(acts, {
      dateKey: '2026-07-13',
      petLevel: 'high',
      recentCategories: ['play', 'play'],
    });
    expect(result?.category).not.toBe('play');
  });

  it('devuelve null si no hay actividades elegibles', () => {
    const onlyHigh = acts.filter((a) => a.minActivityLevel === 'high');
    expect(pickDailyActivity(onlyHigh, { dateKey: '2026-07-13', petLevel: 'low' })).toBeNull();
  });

  it('si todas son recientes, aún recomienda alguna elegible', () => {
    const result = pickDailyActivity(acts, {
      dateKey: '2026-07-13',
      petLevel: 'low',
      recentActivityIds: ['a', 'b'],
    });
    expect(result).not.toBeNull();
    expect(['a', 'b']).toContain(result?.id);
  });
});
