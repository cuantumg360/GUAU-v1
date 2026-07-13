import type { Session } from '@supabase/supabase-js';
import { createContext, useContext, useEffect, useState, type ReactNode } from 'react';
import { AppState } from 'react-native';

import { supabase } from '@/lib/supabase';

type AuthState = {
  session: Session | null;
  /** false hasta restaurar la sesión persistida (evita parpadeos de rutas). */
  ready: boolean;
};

const AuthContext = createContext<AuthState>({ session: null, ready: false });

export function AuthProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState<AuthState>({ session: null, ready: false });

  useEffect(() => {
    void supabase.auth.getSession().then(({ data }) => {
      setState({ session: data.session, ready: true });
    });
    const { data: sub } = supabase.auth.onAuthStateChange((_event, session) => {
      setState({ session, ready: true });
    });
    return () => sub.subscription.unsubscribe();
  }, []);

  useEffect(() => {
    // Refresco de tokens solo con la app en primer plano (recomendación Supabase RN).
    const sub = AppState.addEventListener('change', (status) => {
      if (status === 'active') {
        void supabase.auth.startAutoRefresh();
      } else {
        void supabase.auth.stopAutoRefresh();
      }
    });
    void supabase.auth.startAutoRefresh();
    return () => sub.remove();
  }, []);

  return <AuthContext.Provider value={state}>{children}</AuthContext.Provider>;
}

export function useAuth(): AuthState {
  return useContext(AuthContext);
}
