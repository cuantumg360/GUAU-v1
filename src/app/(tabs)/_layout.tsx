import { Ionicons } from '@expo/vector-icons';
import { Redirect, Tabs } from 'expo-router';
import { useTranslation } from 'react-i18next';

import { useTheme } from '@/design/ThemeContext';
import { useAuth } from '@/features/auth/AuthProvider';

export default function TabsLayout() {
  const { t } = useTranslation();
  const { colors } = useTheme();
  const { session, ready } = useAuth();

  if (ready && !session) return <Redirect href="/welcome" />;

  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: colors.primary,
        tabBarInactiveTintColor: colors.textSecondary,
        tabBarStyle: { backgroundColor: colors.surface, borderTopColor: colors.border },
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: 'GUAU',
          tabBarIcon: ({ color, size }) => <Ionicons name="paw" color={color} size={size} />,
        }}
      />
      <Tabs.Screen
        name="dog"
        options={{
          title: t('dog.tab_title'),
          tabBarIcon: ({ color, size }) => <Ionicons name="heart" color={color} size={size} />,
        }}
      />
      <Tabs.Screen
        name="settings"
        options={{
          title: t('settings.tab_title'),
          tabBarIcon: ({ color, size }) => <Ionicons name="settings-outline" color={color} size={size} />,
        }}
      />
    </Tabs>
  );
}
