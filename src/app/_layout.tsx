import '@/i18n';

import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { Stack } from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';
import { useEffect } from 'react';
import { useTranslation } from 'react-i18next';

import { useTheme, ThemeProvider } from '@/design/ThemeContext';
import { AuthProvider, useAuth } from '@/features/auth/AuthProvider';
import { track } from '@/lib/analytics';

SplashScreen.preventAutoHideAsync();

const queryClient = new QueryClient({
  defaultOptions: {
    queries: { retry: 2, staleTime: 60 * 1000 },
  },
});

function RootNavigator() {
  const { ready, session } = useAuth();
  const { colors } = useTheme();
  const { t } = useTranslation();

  useEffect(() => {
    if (ready) {
      void SplashScreen.hideAsync();
      if (session) track('app_open');
    }
  }, [ready, session]);

  if (!ready) return null; // el splash nativo sigue visible

  return (
    <Stack
      screenOptions={{
        headerShown: false,
        contentStyle: { backgroundColor: colors.background },
        animation: 'fade_from_bottom',
      }}
    >
      <Stack.Screen name="reminder/new" options={{ presentation: 'modal' }} />
      <Stack.Screen name="reminder/[id]" options={{ presentation: 'modal' }} />
      <Stack.Screen name="activity/[id]" options={{ presentation: 'modal' }} />
      <Stack.Screen name="memory/new" options={{ presentation: 'modal' }} />
      <Stack.Screen name="memory/[id]" options={{ presentation: 'modal' }} />
      <Stack.Screen name="paywall" options={{ presentation: 'modal' }} />
      <Stack.Screen name="paws" options={{ presentation: 'modal' }} />
      <Stack.Screen name="paw-history" options={{ presentation: 'modal' }} />
      <Stack.Screen name="mascot" options={{ presentation: 'modal' }} />
      <Stack.Screen
        name="dog"
        options={{
          headerShown: true,
          title: '',
          headerBackTitle: t('common.back'),
          headerTintColor: colors.primary,
          headerStyle: { backgroundColor: colors.background },
          headerShadowVisible: false,
        }}
      />
    </Stack>
  );
}

export default function RootLayout() {
  return (
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <ThemeProvider>
          <RootNavigator />
        </ThemeProvider>
      </AuthProvider>
    </QueryClientProvider>
  );
}
