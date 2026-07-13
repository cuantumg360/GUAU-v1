import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

import { dayKey } from '@/core/datetime';
import { pickDailyActivity, type ActivityCandidate } from '@/core/recommendation';
import { track } from '@/lib/analytics';
import type { Tables } from '@/lib/database.types';
import { supabase } from '@/lib/supabase';

export type Activity = Tables<'activities'>;
export type Streak = Tables<'streaks'>;

const DEFAULT_TZ = 'Europe/Madrid';

/** Catálogo de actividades publicadas (RLS: solo published). */
export function useActivities() {
  return useQuery({
    queryKey: ['activities'],
    staleTime: 10 * 60 * 1000,
    queryFn: async (): Promise<Activity[]> => {
      const { data, error } = await supabase.from('activities').select('*').order('created_at');
      if (error) throw error;
      return data;
    },
  });
}

export function useStreak() {
  return useQuery({
    queryKey: ['streak'],
    queryFn: async (): Promise<Streak | null> => {
      const { data, error } = await supabase.from('streaks').select('*').maybeSingle();
      if (error) throw error;
      return data;
    },
  });
}

/** ¿Se ha completado ya la actividad de hoy? (para no ofrecer completar dos veces). */
export function useTodayCompletion() {
  return useQuery({
    queryKey: ['today_completion'],
    queryFn: async (): Promise<boolean> => {
      const today = dayKey(new Date().toISOString(), DEFAULT_TZ);
      const { data, error } = await supabase
        .from('activity_completions')
        .select('id')
        .eq('local_date', today)
        .maybeSingle();
      if (error) throw error;
      return data !== null;
    },
  });
}

/**
 * Actividad diaria recomendada. Selección determinista en cliente (misma cada
 * día); se persiste en daily_recommendations para trazar y permitir "cambiar".
 */
export function useDailyRecommendation(petActivityLevel: string | undefined) {
  const activitiesQuery = useActivities();
  return useQuery({
    queryKey: ['daily_recommendation', petActivityLevel],
    enabled: activitiesQuery.data !== undefined,
    queryFn: async (): Promise<Activity | null> => {
      const activities = activitiesQuery.data ?? [];
      if (activities.length === 0) return null;
      const today = dayKey(new Date().toISOString(), DEFAULT_TZ);

      // Historial reciente para no repetir.
      const { data: recent } = await supabase
        .from('activity_completions')
        .select('activity_id, local_date')
        .order('local_date', { ascending: false })
        .limit(7);
      const recentIds = (recent ?? []).map((r) => r.activity_id);
      const recentCategories: string[] = (recent ?? [])
        .map((r) => activities.find((a) => a.id === r.activity_id)?.category)
        .filter((c): c is NonNullable<typeof c> => Boolean(c));

      // ¿Existe ya una recomendación persistida para hoy?
      const { data: existing } = await supabase
        .from('daily_recommendations')
        .select('activity_id')
        .eq('local_date', today)
        .maybeSingle();
      if (existing) {
        return activities.find((a) => a.id === existing.activity_id) ?? null;
      }

      const candidates: ActivityCandidate[] = activities.map((a) => ({
        id: a.id,
        slug: a.slug,
        category: a.category,
        difficulty: a.difficulty,
        minActivityLevel: a.min_activity_level,
      }));
      const chosen = pickDailyActivity(candidates, {
        dateKey: today,
        petLevel: (petActivityLevel as ActivityCandidate['minActivityLevel']) ?? 'unknown',
        recentActivityIds: recentIds,
        recentCategories,
      });
      if (!chosen) return null;

      const { data: userData } = await supabase.auth.getUser();
      if (userData.user) {
        await supabase
          .from('daily_recommendations')
          .insert({ user_id: userData.user.id, local_date: today, activity_id: chosen.id });
      }
      track('daily_activity_viewed', { activity: chosen.slug });
      return activities.find((a) => a.id === chosen.id) ?? null;
    },
  });
}

/**
 * Completar la actividad diaria: llama a la RPC atómica del servidor, que
 * actualiza la racha (con protección de reloj) y concede recompensas. Devuelve
 * la racha resultante.
 */
export function useCompleteDailyActivity() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({
      activityId,
      dogResponse,
    }: {
      activityId: string;
      dogResponse?: string;
    }): Promise<Streak> => {
      const { data, error } = await supabase.rpc('complete_daily_activity', {
        p_activity_id: activityId,
        p_dog_response: dogResponse ?? undefined,
        p_source: 'daily',
      });
      if (error) throw error;
      const streak = data as unknown as Streak;
      track('daily_activity_completed', { streak: streak.current_count });
      track('streak_incremented', { current: streak.current_count, best: streak.best_count });
      return streak;
    },
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ['streak'] });
      void queryClient.invalidateQueries({ queryKey: ['today_completion'] });
      void queryClient.invalidateQueries({ queryKey: ['paw_balance'] });
      void queryClient.invalidateQueries({ queryKey: ['reward_grants'] });
    },
  });
}

/** Cambia la recomendación de hoy por otra elegible al azar (determinista por intento). */
export function useChangeDailyActivity() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ currentId, activities }: { currentId: string; activities: Activity[] }): Promise<Activity | null> => {
      const today = dayKey(new Date().toISOString(), DEFAULT_TZ);
      const alternatives = activities.filter((a) => a.id !== currentId);
      if (alternatives.length === 0) return null;
      const next = alternatives[Math.floor(Math.random() * alternatives.length)];
      const { data: userData } = await supabase.auth.getUser();
      if (userData.user) {
        await supabase
          .from('daily_recommendations')
          .upsert({ user_id: userData.user.id, local_date: today, activity_id: next.id }, { onConflict: 'user_id,local_date' });
      }
      track('daily_activity_changed', { activity: next.slug });
      return next;
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['daily_recommendation'] }),
  });
}

/** Recompensas concedidas al usuario (con su definición para mostrar). */
export function useRewardGrants() {
  return useQuery({
    queryKey: ['reward_grants'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('reward_grants')
        .select('id, reward_id, status, granted_at, reward_definitions(title_key, reward_type, amount)')
        .order('granted_at', { ascending: false });
      if (error) throw error;
      return data;
    },
  });
}
