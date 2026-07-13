/**
 * Selección determinista de la actividad diaria (lógica pura, testeable).
 *
 * El brief pide empezar con reglas deterministas y contenido etiquetado, sin
 * repetir mecánicamente. La personalización avanzada llega después.
 *
 * Criterios (en orden):
 *  1. Adecuación al nivel de actividad del perro (no proponer algo demasiado
 *     intenso a un perro tranquilo).
 *  2. No repetir actividades hechas recientemente.
 *  3. Rotar por categoría para variar (juego/calma/relax/…).
 *  4. Desempate estable por un hash de (fecha + slug) para que el mismo día
 *     produzca siempre la misma recomendación (idempotencia visual).
 */

export type ActivityLevel = 'low' | 'medium' | 'high' | 'unknown';

export type ActivityCandidate = {
  id: string;
  slug: string;
  category: string;
  difficulty: number;
  minActivityLevel: ActivityLevel;
};

const LEVEL_RANK: Record<ActivityLevel, number> = { low: 0, medium: 1, high: 2, unknown: 1 };

/** Filtra actividades cuyo nivel mínimo no supera el del perro. */
export function eligibleActivities(
  activities: ActivityCandidate[],
  petLevel: ActivityLevel,
): ActivityCandidate[] {
  const petRank = LEVEL_RANK[petLevel];
  return activities.filter((a) => LEVEL_RANK[a.minActivityLevel] <= petRank);
}

/** Hash determinista pequeño (djb2) de una cadena. */
function hash(str: string): number {
  let h = 5381;
  for (let i = 0; i < str.length; i++) {
    h = ((h << 5) + h + str.charCodeAt(i)) >>> 0;
  }
  return h;
}

/**
 * Elige la actividad del día. `dateKey` es AAAA-MM-DD (día local del usuario).
 * `recentActivityIds` son las últimas completadas (más reciente primero) y
 * `recentCategories` las categorías recientes, para evitar repetición.
 */
export function pickDailyActivity(
  activities: ActivityCandidate[],
  {
    dateKey,
    petLevel,
    recentActivityIds = [],
    recentCategories = [],
  }: {
    dateKey: string;
    petLevel: ActivityLevel;
    recentActivityIds?: string[];
    recentCategories?: string[];
  },
): ActivityCandidate | null {
  const eligible = eligibleActivities(activities, petLevel);
  if (eligible.length === 0) return null;

  // Evita las hechas recientemente; si eso vacía la lista, usa todas las elegibles.
  const recentSet = new Set(recentActivityIds);
  let pool = eligible.filter((a) => !recentSet.has(a.id));
  if (pool.length === 0) pool = eligible;

  // Penaliza categorías recientes (más reciente = mayor penalización).
  const categoryPenalty = new Map<string, number>();
  recentCategories.forEach((cat, index) => {
    const weight = recentCategories.length - index; // reciente pesa más
    categoryPenalty.set(cat, (categoryPenalty.get(cat) ?? 0) + weight);
  });

  // Puntuación: menor penalización de categoría es mejor; desempate por hash estable.
  const scored = pool
    .map((a) => ({
      activity: a,
      penalty: categoryPenalty.get(a.category) ?? 0,
      tie: hash(`${dateKey}:${a.slug}`),
    }))
    .sort((x, y) => (x.penalty - y.penalty) || (x.tie - y.tie));

  return scored[0].activity;
}
