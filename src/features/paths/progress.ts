/**
 * GUAU · Progreso de Caminos (Fase 1: persistencia local).
 *
 * El estado se simula con datos locales estructurados (AsyncStorage), igual en
 * modo prueba y en cuenta real, hasta que la Fase 2 lo mueva a Supabase con RLS.
 * Reglas: las fases se completan en orden; un camino se abre al completar el
 * anterior de su mundo; el primer camino de cada mundo está siempre abierto
 * (los mundos no se bloquean entre sí: cada familia empieza por donde necesita).
 */
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

import { PHASE_ORDER, pathsOfWorld, type PathDef, type WorldId } from '@/features/paths/pathsData';
import { track } from '@/lib/analytics';

const STORAGE_KEY = 'guau.pathsProgress.v1';

export type PathsProgress = {
  /** pathId → fases completadas (0..4). */
  phases: Record<string, number>;
  /** pathId → nota de la fase Consolidar («¿cómo respondió tu perro?»). */
  notes: Record<string, string>;
};

const EMPTY: PathsProgress = { phases: {}, notes: {} };

async function loadProgress(): Promise<PathsProgress> {
  try {
    const raw = await AsyncStorage.getItem(STORAGE_KEY);
    if (!raw) return EMPTY;
    const parsed = JSON.parse(raw) as Partial<PathsProgress>;
    return { phases: parsed.phases ?? {}, notes: parsed.notes ?? {} };
  } catch {
    return EMPTY;
  }
}

async function saveProgress(progress: PathsProgress): Promise<void> {
  await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(progress));
}

export function usePathsProgress() {
  return useQuery({
    queryKey: ['paths_progress'],
    queryFn: loadProgress,
  });
}

/** Fases completadas de un camino (0..4). */
export function phasesDone(progress: PathsProgress | undefined, pathId: string): number {
  return progress?.phases[pathId] ?? 0;
}

export function isPathCompleted(progress: PathsProgress | undefined, pathId: string): boolean {
  return phasesDone(progress, pathId) >= PHASE_ORDER.length;
}

/** Un camino se abre al completar el anterior de su mundo; el 1º siempre abierto. */
export function isPathUnlocked(progress: PathsProgress | undefined, path: PathDef): boolean {
  if (path.order === 1) return true;
  const prev = pathsOfWorld(path.world).find((p) => p.order === path.order - 1);
  return prev ? isPathCompleted(progress, prev.id) : true;
}

/** Caminos completados en un mundo (para «2 de 4 caminos»). */
export function worldCompleted(progress: PathsProgress | undefined, world: WorldId): number {
  return pathsOfWorld(world).filter((p) => isPathCompleted(progress, p.id)).length;
}

/** Primer camino no completado y desbloqueado del mundo (donde está Toba). */
export function activePathOfWorld(progress: PathsProgress | undefined, world: WorldId): PathDef | null {
  for (const p of pathsOfWorld(world)) {
    if (!isPathCompleted(progress, p.id) && isPathUnlocked(progress, p)) return p;
  }
  return null;
}

/**
 * Completa la siguiente fase de un camino. Devuelve el número de fases hechas
 * tras la operación; al llegar a 4 el camino queda completado (recompensa).
 */
export function useCompletePathPhase() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ path, note }: { path: PathDef; note?: string }): Promise<number> => {
      const progress = await loadProgress();
      const done = progress.phases[path.id] ?? 0;
      if (done >= PHASE_ORDER.length) return done;
      const next = done + 1;
      progress.phases[path.id] = next;
      if (note?.trim()) progress.notes[path.id] = note.trim();
      await saveProgress(progress);
      track('path_phase_completed', { path: path.id, phase: PHASE_ORDER[done] });
      if (next >= PHASE_ORDER.length) track('path_completed', { path: path.id, world: path.world });
      return next;
    },
    onSuccess: () => void queryClient.invalidateQueries({ queryKey: ['paths_progress'] }),
  });
}
