import type { Session } from '@supabase/supabase-js';
import { createContext, useContext, useEffect, useState, type ReactNode } from 'react';
import { AppState } from 'react-native';

import { DEMO_USER_ID, isDemo, loadDemoFlag, subscribeDemo } from '@/features/demo/store';
import { supabase } from '@/lib/supabase';

type AuthState = {
  session: Session | null;
  /** false hasta restaurar la sesión persistida (evita parpadeos de rutas). */
  ready: boolean;
  /** true cuando la sesión es de modo prueba (datos en memoria, sin backend). */
  demo: boolean;
};

const AuthContext = createContext<AuthState>({ session: null, ready: false, demo: false });

/** Sesión sintética de modo prueba (solo se leen user.id y user.email). */
const demoSession = {
  user: { id: DEMO_USER_ID, email: 'prueba@guau.demo' },
} as unknown as Session;

export function AuthProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState<AuthState>({ session: null, ready: false, demo: false });

  useEffect(() => {
    let active = true;
    void (async () => {
      // El modo prueba tiene prioridad: si está activo, no tocamos Supabase.
      const demo = await loadDemoFlag();
      if (demo) {
        if (active) setState({ session: demoSession, ready: true, demo: true });
        return;
      }
      const { data } = await supabase.auth.getSession();
      if (active) setState({ session: data.session, ready: true, demo: false });
    })();

    const { data: sub } = supabase.auth.onAuthStateChange((_event, session) => {
      // En modo prueba ignoramos los eventos de Supabase.
      if (isDemo()) return;
      setState({ session, ready: true, demo: false });
    });

    // Reacciona a activar/salir del modo prueba (botón en welcome / ajustes).
    const unsubDemo = subscribeDemo(() => {
      if (isDemo()) {
        setState({ session: demoSession, ready: true, demo: true });
      } else {
        setState({ session: null, ready: true, demo: false });
      }
    });

    return () => {
      active = false;
      sub.subscription.unsubscribe();
      unsubDemo();
    };
  }, []);

  useEffect(() => {
    if (isDemo()) return;
    const sub = AppState.addEventListener('change', (status) => {
      if (status === 'active') {
        void supabase.auth.startAutoRefresh();
      } else {
        void supabase.auth.stopAutoRefresh();
      }
    });
    void supabase.auth.startAutoRefresh();
    return () => sub.remove();
  }, [state.demo]);

  return <AuthContext.Provider value={state}>{children}</AuthContext.Provider>;
}

export function useAuth(): AuthState {
  return useContext(AuthContext);
}
