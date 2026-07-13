import { useQuery } from '@tanstack/react-query';

import { demoStore, isDemo } from '@/features/demo/store';
import type { Tables } from '@/lib/database.types';
import { supabase } from '@/lib/supabase';

export type Product = Tables<'products'>;
export type PawTransaction = Tables<'paw_ledger'>;
export type Entitlement = Tables<'entitlements'>;

/** Catálogo de productos activos, ordenados (planes y packs). */
export function useProducts() {
  return useQuery({
    queryKey: ['products'],
    staleTime: 10 * 60 * 1000,
    queryFn: async (): Promise<Product[]> => {
      if (isDemo()) return demoStore.products();
      const { data, error } = await supabase
        .from('products')
        .select('*')
        .eq('active', true)
        .order('sort_order');
      if (error) throw error;
      return data;
    },
  });
}

/** Derecho (plan) actual del usuario, validado en servidor. */
export function useEntitlement() {
  return useQuery({
    queryKey: ['entitlement'],
    queryFn: async (): Promise<Entitlement | null> => {
      if (isDemo()) return demoStore.entitlement();
      const { data, error } = await supabase.from('entitlements').select('*').maybeSingle();
      if (error) throw error;
      return data;
    },
  });
}

/** Historial de movimientos de Huellas (ledger), más recientes primero. */
export function usePawLedger() {
  return useQuery({
    queryKey: ['paw_ledger'],
    queryFn: async (): Promise<PawTransaction[]> => {
      if (isDemo()) return demoStore.ledger();
      const { data, error } = await supabase
        .from('paw_ledger')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(100);
      if (error) throw error;
      return data;
    },
  });
}

/** Configuración de la recarga personalizada desde servidor (mín/máx/precio). */
export function useTopupConfig() {
  return useQuery({
    queryKey: ['topup_config'],
    staleTime: 10 * 60 * 1000,
    queryFn: async () => {
      if (isDemo()) return { min: 5, max: 500, unitPriceCents: 100 };
      const { data, error } = await supabase
        .from('app_config')
        .select('key, value')
        .in('key', ['paws.custom_topup_min', 'paws.custom_topup_max', 'paws.unit_price_cents']);
      if (error) throw error;
      const get = (k: string) =>
        Number((data?.find((r) => r.key === k)?.value as { value: number } | undefined)?.value ?? 0);
      return {
        min: get('paws.custom_topup_min') || 5,
        max: get('paws.custom_topup_max') || 500,
        unitPriceCents: get('paws.unit_price_cents') || 100,
      };
    },
  });
}
