import { useLocalSearchParams } from 'expo-router';
import { ActivityIndicator, View } from 'react-native';

import { useTheme } from '@/design/ThemeContext';
import { ReminderForm } from '@/features/reminders/ReminderForm';
import { useReminders } from '@/features/reminders/api';

export default function EditReminder() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { colors } = useTheme();
  const remindersQuery = useReminders();
  const reminder = remindersQuery.data?.find((r) => r.id === id);

  if (remindersQuery.isPending) {
    return (
      <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: colors.background }}>
        <ActivityIndicator color={colors.primary} />
      </View>
    );
  }
  if (!reminder) return <ReminderForm />;
  return <ReminderForm existing={reminder} />;
}
