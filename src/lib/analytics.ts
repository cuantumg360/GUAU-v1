import { Platform } from 'react-native';

import { supabase } from '@/lib/supabase';

/**
 * Taxonomía de eventos de la fase actual. Ampliar aquí (y en
 * docs/12-analytics.md) antes de emitir un evento nuevo: los nombres no se
 * inventan en los call sites.
 */
export type AnalyticsEvent =
  | 'app_open'
  | 'signup_completed'
  | 'signin_completed'
  | 'onboarding_started'
  | 'onboarding_step_viewed'
  | 'onboarding_completed'
  | 'pet_created'
  | 'pet_updated'
  | 'pet_photo_added'
  | 'reminder_created'
  | 'reminder_updated'
  | 'reminder_completed'
  | 'reminder_snoozed'
  | 'reminder_deleted'
  | 'daily_activity_viewed'
  | 'activity_opened'
  | 'daily_activity_completed'
  | 'daily_activity_changed'
  | 'streak_incremented'
  | 'reward_granted'
  | 'signout'
  | 'account_delete_requested';

/** Propiedades planas; nunca información sanitaria ni contenido libre. */
type Props = Record<string, string | number | boolean>;

const sessionId = `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 10)}`;

/**
 * Registro fire-and-forget: la analítica jamás bloquea ni rompe la UX.
 * Requiere sesión (RLS solo admite eventos del propio usuario).
 */
export function track(name: AnalyticsEvent, props: Props = {}): void {
  void (async () => {
    try {
      const { data } = await supabase.auth.getSession();
      const userId = data.session?.user.id;
      if (!userId) return;
      await supabase.from('analytics_events').insert({
        user_id: userId,
        name,
        props,
        session_id: sessionId,
        platform: Platform.OS === 'ios' || Platform.OS === 'android' ? Platform.OS : 'web',
        client_ts: new Date().toISOString(),
      });
    } catch {
      // Silencioso a propósito; los fallos de analítica no son fallos de producto.
    }
  })();
}
