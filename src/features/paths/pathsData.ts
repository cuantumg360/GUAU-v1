/**
 * GUAU · Sistema de Caminos (Fase 1: datos locales estructurados).
 *
 * 6 mundos × 4 caminos × 4 fases = 96 ejercicios (docs/01-product-specification.md).
 * Cada camino termina en una recompensa VISIBLE por adelantado (regla de producto:
 * las recompensas se conocen antes de completar el objetivo; nada aleatorio).
 *
 * Los títulos proceden del prompt maestro y quedan preparados para revisión
 * profesional. Los textos viven en i18n bajo `paths.*`; aquí solo estructura.
 * En Fase 2 este catálogo pasa a servidor con configuración remota.
 */
import type { Ionicons } from '@expo/vector-icons';

import { palette } from '@/design/tokens';

type IconName = React.ComponentProps<typeof Ionicons>['name'];

export type PhaseKind = 'discover' | 'practice' | 'play' | 'consolidate';

/** Orden fijo de fases dentro de un camino (docs: Descubrir→Practicar→Jugar→Consolidar). */
export const PHASE_ORDER: PhaseKind[] = ['discover', 'practice', 'play', 'consolidate'];

export const PHASE_ICONS: Record<PhaseKind, IconName> = {
  discover: 'book-outline',
  practice: 'footsteps-outline',
  play: 'tennisball-outline',
  consolidate: 'ribbon-outline',
};

export type WorldId = 'vinculo' | 'juego' | 'convivencia' | 'emocional' | 'exterior' | 'bienestar';

export type WorldDef = {
  id: WorldId;
  /** 1..6, para "Mundo n". */
  index: number;
  icon: IconName;
};

export const WORLDS: WorldDef[] = [
  { id: 'vinculo', index: 1, icon: 'heart-outline' },
  { id: 'juego', index: 2, icon: 'tennisball-outline' },
  { id: 'convivencia', index: 3, icon: 'home-outline' },
  { id: 'emocional', index: 4, icon: 'leaf-outline' },
  { id: 'exterior', index: 5, icon: 'trail-sign-outline' },
  { id: 'bienestar', index: 6, icon: 'moon-outline' },
];

/**
 * Identidad cromática de cada mundo (la diferenciación no depende solo del color:
 * cada mundo cambia también el icono, el entorno del mapa y la recompensa).
 * `main` garantiza contraste AA con texto blanco; `soft` con tinta.
 */
export function worldTint(world: WorldId, isDark: boolean): { main: string; soft: string } {
  const light: Record<WorldId, { main: string; soft: string }> = {
    vinculo: { main: palette.terracotta600, soft: palette.terracotta100 },
    juego: { main: palette.amber700, soft: palette.amber100 },
    convivencia: { main: palette.green700, soft: palette.green100 },
    emocional: { main: palette.teal700, soft: palette.teal100 },
    exterior: { main: palette.slate700, soft: palette.slate100 },
    bienestar: { main: palette.plum700, soft: palette.plum100 },
  };
  const dark: Record<WorldId, { main: string; soft: string }> = {
    vinculo: { main: palette.terracotta600, soft: '#3A2A21' },
    juego: { main: palette.amber700, soft: '#332A18' },
    convivencia: { main: palette.green700, soft: '#22301F' },
    emocional: { main: palette.teal700, soft: '#20312F' },
    exterior: { main: palette.slate700, soft: '#1F2B35' },
    bienestar: { main: palette.plum700, soft: '#2E2334' },
  };
  return (isDark ? dark : light)[world];
}

export type PathReward = {
  /** Fase 1: insignias (sin Huellas hasta que el ledger real las abone en Fase 2). */
  kind: 'badge';
  /** Clave i18n del nombre de la insignia, visible ANTES de completar. */
  titleKey: string;
};

export type PathDef = {
  /** Slug estable; también prefijo de sus claves i18n `paths.p_<id>_*`. */
  id: string;
  world: WorldId;
  /** 1..4 dentro del mundo. */
  order: number;
  reward: PathReward;
};

function path(id: string, world: WorldId, order: number): PathDef {
  return { id, world, order, reward: { kind: 'badge', titleKey: `paths.p_${id}_reward` } };
}

export const PATHS: PathDef[] = [
  // Mundo 1 · Vínculo
  path('atencion', 'vinculo', 1),
  path('comunicacion', 'vinculo', 2),
  path('confianza', 'vinculo', 3),
  path('calma_compania', 'vinculo', 4),
  // Mundo 2 · Juego y mente
  path('juego_cooperativo', 'juego', 1),
  path('olfato', 'juego', 2),
  path('retos', 'juego', 3),
  path('concentracion', 'juego', 4),
  // Mundo 3 · Convivencia
  path('manipulacion', 'convivencia', 1),
  path('rutinas', 'convivencia', 2),
  path('habitos_comida', 'convivencia', 3),
  path('situaciones_domesticas', 'convivencia', 4),
  // Mundo 4 · Regulación emocional
  path('autocontrol', 'emocional', 1),
  path('frustracion', 'emocional', 2),
  path('separaciones', 'emocional', 3),
  path('sonidos', 'emocional', 4),
  // Mundo 5 · Exterior
  path('paseo', 'exterior', 1),
  path('atencion_fuera', 'exterior', 2),
  path('llamada', 'exterior', 3),
  path('lugares_nuevos', 'exterior', 4),
  // Mundo 6 · Bienestar
  path('descanso', 'bienestar', 1),
  path('conciencia_corporal', 'bienestar', 2),
  path('cooperacion_cuidados', 'bienestar', 3),
  path('etapas_vida', 'bienestar', 4),
];

export function pathsOfWorld(world: WorldId): PathDef[] {
  return PATHS.filter((p) => p.world === world).sort((a, b) => a.order - b.order);
}

export function findPath(id: string): PathDef | undefined {
  return PATHS.find((p) => p.id === id);
}
