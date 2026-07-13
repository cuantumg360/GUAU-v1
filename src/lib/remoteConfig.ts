import { useQuery } from '@tanstack/react-query';

import { supabase } from '@/lib/supabase';

/**
 * Feature flags y configuración comercial viven en servidor (tablas
 * feature_flags y app_config). El cliente solo los lee; nada de límites ni
 * precios hardcodeados en la interfaz.
 */

export function useFeatureFlags() {
  return useQuery({
    queryKey: ['feature_flags'],
    staleTime: 5 * 60 * 1000,
    queryFn: async () => {
      const { data, error } = await supabase.from('feature_flags').select('key, enabled, description');
      if (error) throw error;
      return Object.fromEntries(data.map((f) => [f.key, f.enabled])) as Record<string, boolean>;
    },
  });
}

export function useAppConfigValue(key: string) {
  return useQuery({
    queryKey: ['app_config', key],
    staleTime: 5 * 60 * 1000,
    queryFn: async () => {
      const { data, error } = await supabase.from('app_config').select('value').eq('key', key).maybeSingle();
      if (error) throw error;
      return data?.value ?? null;
    },
  });
}

export function usePawBalance() {
  return useQuery({
    queryKey: ['paw_balance'],
    queryFn: async () => {
      const { data, error } = await supabase.from('paw_accounts').select('balance').maybeSingle();
      if (error) throw error;
      return data?.balance ?? 0;
    },
  });
}
