import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useMemo } from 'react';
import { Alert, Pressable, StyleSheet, View } from 'react-native';
import { useTranslation } from 'react-i18next';

import { dayKey, formatDate, formatTime } from '@/core/datetime';
import { AppText } from '@/design/components/AppText';
import { Button } from '@/design/components/Button';
import { Card } from '@/design/components/Card';
import { Screen } from '@/design/components/Screen';
import { useTheme } from '@/design/ThemeContext';
import { radius, spacing } from '@/design/tokens';
import { categoryMeta } from '@/features/reminders/categoryMeta';
import {
  useCompleteReminder,
  useDeleteReminder,
  useReminders,
  useSnoozeReminder,
  type Reminder,
} from '@/features/reminders/api';

type Group = { key: string; titleKey: string; items: Reminder[] };

export default function Agenda() {
  const { t } = useTranslation();
  const { colors } = useTheme();
  const router = useRouter();
  const remindersQuery = useReminders();
  const complete = useCompleteReminder();
  const snooze = useSnoozeReminder();
  const remove = useDeleteReminder();

  const groups = useMemo<Group[]>(() => {
    const all = remindersQuery.data ?? [];
    const now = new Date();
    const todayKey = dayKey(now.toISOString(), 'Europe/Madrid');
    const pending = all.filter((r) => r.status === 'pending' || r.status === 'snoozed');
    const done = all.filter((r) => r.status === 'completed');

    const overdue: Reminder[] = [];
    const today: Reminder[] = [];
    const upcoming: Reminder[] = [];
    for (const r of pending) {
      const rKey = dayKey(r.due_at, r.timezone);
      if (new Date(r.due_at).getTime() < now.getTime() && rKey !== todayKey) overdue.push(r);
      else if (rKey === todayKey) today.push(r);
      else upcoming.push(r);
    }
    return [
      { key: 'overdue', titleKey: 'reminders.section_overdue', items: overdue },
      { key: 'today', titleKey: 'reminders.section_today', items: today },
      { key: 'upcoming', titleKey: 'reminders.section_upcoming', items: upcoming },
      { key: 'done', titleKey: 'reminders.section_done', items: done.slice(0, 10) },
    ].filter((g) => g.items.length > 0);
  }, [remindersQuery.data]);

  const confirmDelete = (r: Reminder) => {
    Alert.alert(t('reminders.delete_confirm_title'), t('reminders.delete_confirm_body'), [
      { text: t('common.cancel'), style: 'cancel' },
      { text: t('reminders.delete'), style: 'destructive', onPress: () => void remove.mutate(r) },
    ]);
  };

  const empty = !remindersQuery.isPending && groups.length === 0;

  return (
    <Screen>
      <View style={styles.headerRow}>
        <AppText variant="display">{t('reminders.title_generic')}</AppText>
        <Pressable
          accessibilityRole="button"
          accessibilityLabel={t('reminders.add')}
          onPress={() => router.push('/reminder/new')}
          style={[styles.addButton, { backgroundColor: colors.primary }]}
        >
          <Ionicons name="add" size={26} color={colors.onPrimary} />
        </Pressable>
      </View>

      {empty ? (
        <Card>
          <AppText variant="heading">{t('reminders.empty_title')}</AppText>
          <AppText tone="secondary">{t('reminders.empty_body')}</AppText>
          <Button label={t('reminders.add')} onPress={() => router.push('/reminder/new')} style={styles.emptyCta} />
        </Card>
      ) : null}

      {groups.map((group) => (
        <View key={group.key} style={styles.group}>
          <AppText variant="label" tone="secondary">
            {t(group.titleKey)}
          </AppText>
          {group.items.map((r) => (
            <ReminderRow
              key={r.id}
              reminder={r}
              onComplete={() => complete.mutate(r)}
              onSnooze={() => snooze.mutate({ reminder: r, minutes: 60 })}
              onEdit={() => router.push(`/reminder/${r.id}`)}
              onDelete={() => confirmDelete(r)}
            />
          ))}
        </View>
      ))}
    </Screen>
  );
}

function ReminderRow({
  reminder,
  onComplete,
  onSnooze,
  onEdit,
  onDelete,
}: {
  reminder: Reminder;
  onComplete: () => void;
  onSnooze: () => void;
  onEdit: () => void;
  onDelete: () => void;
}) {
  const { t } = useTranslation();
  const { colors } = useTheme();
  const meta = categoryMeta[reminder.category];
  const isDone = reminder.status === 'completed';
  const accent = meta.health ? colors.health : colors.primary;

  return (
    <Card health={meta.health} style={styles.row}>
      <View style={styles.rowTop}>
        <View style={[styles.iconWrap, { backgroundColor: meta.health ? colors.healthSoft : colors.primarySoft }]}>
          <Ionicons name={meta.icon} size={20} color={accent} />
        </View>
        <View style={styles.rowInfo}>
          <AppText variant="heading" tone={meta.health ? 'health' : 'default'}>
            {reminder.title}
          </AppText>
          <AppText variant="caption" tone="secondary">
            {formatDate(reminder.due_at, reminder.timezone)} · {formatTime(reminder.due_at, reminder.timezone)}
            {reminder.repeat_frequency !== 'none' ? ' · ↻' : ''}
            {reminder.source === 'booklet' ? ` · ${t('reminders.from_booklet')}` : ''}
          </AppText>
        </View>
        {reminder.priority === 'high' ? (
          <Ionicons name="flag" size={16} color={colors.warning} />
        ) : null}
      </View>

      {!isDone ? (
        <View style={styles.actions}>
          <RowAction icon="checkmark-circle-outline" label={t('reminders.complete')} onPress={onComplete} color={colors.success} />
          <RowAction icon="time-outline" label={t('reminders.snooze')} onPress={onSnooze} color={colors.textSecondary} />
          <RowAction icon="create-outline" label={t('reminders.edit')} onPress={onEdit} color={colors.textSecondary} />
          <RowAction icon="trash-outline" label={t('reminders.delete')} onPress={onDelete} color={colors.danger} />
        </View>
      ) : null}
    </Card>
  );
}

function RowAction({
  icon,
  label,
  onPress,
  color,
}: {
  icon: React.ComponentProps<typeof Ionicons>['name'];
  label: string;
  onPress: () => void;
  color: string;
}) {
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={label}
      onPress={onPress}
      style={({ pressed }) => [styles.action, { opacity: pressed ? 0.6 : 1 }]}
      hitSlop={8}
    >
      <Ionicons name={icon} size={22} color={color} />
    </Pressable>
  );
}

const styles = StyleSheet.create({
  headerRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  addButton: { width: 44, height: 44, borderRadius: radius.pill, alignItems: 'center', justifyContent: 'center' },
  emptyCta: { marginTop: spacing.sm },
  group: { gap: spacing.xs },
  row: { gap: spacing.sm },
  rowTop: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm },
  iconWrap: { width: 40, height: 40, borderRadius: radius.md, alignItems: 'center', justifyContent: 'center' },
  rowInfo: { flex: 1, gap: 2 },
  actions: { flexDirection: 'row', gap: spacing.lg, paddingTop: spacing.xs },
  action: { minWidth: 44, minHeight: 32, alignItems: 'center', justifyContent: 'center' },
});
