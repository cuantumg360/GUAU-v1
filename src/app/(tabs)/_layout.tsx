import { Ionicons } from '@expo/vector-icons';
import { Redirect, Tabs } from 'expo-router';
import { useTranslation } from 'react-i18next';

import { useTheme } from '@/design/ThemeContext';
import { useAuth } from '@/features/auth/AuthProvider';
import { useFeatureFlags } from '@/lib/remoteConfig';

export default function TabsLayout() {
  const { t } = useTranslation();
  const { colors } = useTheme();
  const { session, ready } = useAuth();
  const flagsQuery = useFeatureFlags();

  if (ready && !session) return <Redirect href="/welcome" />;

  const calendarEnabled = flagsQuery.data?.calendar === true;
  const activitiesEnabled = flagsQuery.data?.activities === true;
  const memoriesEnabled = flagsQuery.data?.memories === true;

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
        name="agenda"
        options={{
          title: t('reminders.tab_title'),
          tabBarIcon: ({ color, size }) => <Ionicons name="calendar-outline" color={color} size={size} />,
          href: calendarEnabled ? undefined : null,
        }}
      />
      <Tabs.Screen
        name="vinculo"
        options={{
          title: t('paths.tab_title'),
          tabBarIcon: ({ color, size }) => <Ionicons name="footsteps-outline" color={color} size={size} />,
          href: activitiesEnabled ? undefined : null,
        }}
      />
      <Tabs.Screen
        name="recuerdos"
        options={{
          title: t('memories.tab_title'),
          tabBarIcon: ({ color, size }) => <Ionicons name="book-outline" color={color} size={size} />,
          href: memoriesEnabled ? undefined : null,
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
