import { Redirect } from 'expo-router';
import { ActivityIndicator, View } from 'react-native';

import { useTheme } from '@/design/ThemeContext';
import { useAuth } from '@/features/auth/AuthProvider';
import { usePrimaryPet } from '@/features/pets/api';

/**
 * Puerta de entrada: decide destino según sesión y estado del onboarding.
 * Sin sesión → bienvenida. Con sesión sin perro → onboarding. Resto → tabs.
 */
export default function Index() {
  const { session, ready } = useAuth();
  const { colors } = useTheme();
  const petQuery = usePrimaryPet();

  if (!ready) return null;
  if (!session) return <Redirect href="/welcome" />;

  if (petQuery.isPending) {
    return (
      <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: colors.background }}>
        <ActivityIndicator color={colors.primary} />
      </View>
    );
  }

  return petQuery.data ? <Redirect href="/(tabs)" /> : <Redirect href="/onboarding" />;
}
