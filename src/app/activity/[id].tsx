import { Ionicons } from '@expo/vector-icons';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useState } from 'react';
import { ActivityIndicator, StyleSheet, View } from 'react-native';
import { useTranslation } from 'react-i18next';

import { AppText } from '@/design/components/AppText';
import { Button } from '@/design/components/Button';
import { Card } from '@/design/components/Card';
import { Screen } from '@/design/components/Screen';
import { TextField } from '@/design/components/TextField';
import { useTheme } from '@/design/ThemeContext';
import { spacing } from '@/design/tokens';
import { useActivities, useCompleteDailyActivity, type Activity } from '@/features/activities/api';
import { Mascot } from '@/features/character/Mascot';
import { track } from '@/lib/analytics';

export default function ActivityDetail() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { colors } = useTheme();
  const activitiesQuery = useActivities();
  const activity = activitiesQuery.data?.find((a) => a.id === id);

  if (activitiesQuery.isPending) {
    return (
      <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: colors.background }}>
        <ActivityIndicator color={colors.primary} />
      </View>
    );
  }
  if (!activity) return <Screen><AppText tone="secondary">—</AppText></Screen>;
  return <ActivityLoaded activity={activity} />;
}

function ActivityLoaded({ activity }: { activity: Activity }) {
  const { t } = useTranslation();
  const { colors } = useTheme();
  const router = useRouter();
  const complete = useCompleteDailyActivity();
  const [phase, setPhase] = useState<'read' | 'respond' | 'done'>('read');
  const [response, setResponse] = useState('');
  const [error, setError] = useState<string | null>(null);

  const openTracked = () => track('activity_opened', { activity: activity.slug });
  if (phase === 'read') openTracked();

  const submit = async () => {
    setError(null);
    try {
      await complete.mutateAsync({ activityId: activity.id, dogResponse: response.trim() || undefined });
      setPhase('done');
    } catch {
      setError(t('common.error_generic'));
    }
  };

  if (phase === 'done') {
    return (
      <Screen scroll={false}>
        <View style={styles.celebrate}>
          <Mascot state="celebrating" size={140} />
          <AppText variant="display" style={styles.center}>{t('activities.already_done')}</AppText>
          <AppText tone="secondary" style={styles.center}>{t('streak.motivate_keep')}</AppText>
        </View>
        <Button label={t('common.continue')} onPress={() => router.back()} />
      </Screen>
    );
  }

  if (phase === 'respond') {
    return (
      <Screen>
        <AppText variant="display">{t('activities.response_title')}</AppText>
        <TextField
          placeholder={t('activities.response_placeholder')}
          value={response}
          onChangeText={setResponse}
          multiline
          numberOfLines={3}
          maxLength={500}
          autoFocus
        />
        {error ? <AppText tone="danger">{error}</AppText> : null}
        <Button
          label={complete.isPending ? t('activities.completing') : t('activities.mark_done')}
          onPress={() => void submit()}
          loading={complete.isPending}
        />
        <Button label={t('activities.response_skip')} variant="ghost" onPress={() => void submit()} />
      </Screen>
    );
  }

  return (
    <Screen>
      <AppText variant="display">{activity.title}</AppText>
      <View style={styles.metaRow}>
        <Badge icon="time-outline" label={t('activities.duration', { min: activity.duration_min })} />
        <Badge label={t(`activities.difficulty_${activity.difficulty}`)} />
        <Badge label={t(`activities.cat_${activity.category}`)} />
      </View>

      <Card>
        <AppText variant="caption" tone="secondary">{t('activities.not_validated_note')}</AppText>
      </Card>

      <Section title={t('activities.section_objective')} body={activity.objective} />
      {activity.materials.length > 0 ? (
        <ListSection title={t('activities.section_materials')} items={activity.materials} />
      ) : null}
      {activity.preparation ? <Section title={t('activities.section_prepare')} body={activity.preparation} /> : null}
      {activity.context ? <Section title={t('activities.section_context')} body={activity.context} /> : null}

      <NumberedSection title={t('activities.section_steps')} items={activity.steps} />

      {activity.comfort_signals.length > 0 ? (
        <ListSection title={t('activities.section_comfort')} items={activity.comfort_signals} icon="happy-outline" color={colors.success} />
      ) : null}
      {activity.stop_signals.length > 0 ? (
        <ListSection title={t('activities.section_stop')} items={activity.stop_signals} icon="hand-left-outline" color={colors.warning} />
      ) : null}
      {activity.common_mistakes.length > 0 ? (
        <ListSection title={t('activities.section_mistakes')} items={activity.common_mistakes} />
      ) : null}
      {activity.precautions ? (
        <Card health>
          <AppText variant="heading" tone="health">{t('activities.section_precautions')}</AppText>
          <AppText tone="secondary">{activity.precautions}</AppText>
        </Card>
      ) : null}
      {activity.expected_outcome ? <Section title={t('activities.section_outcome')} body={activity.expected_outcome} /> : null}

      <Button label={t('activities.mark_done')} onPress={() => setPhase('respond')} />
      <Button label={t('common.cancel')} variant="ghost" onPress={() => router.back()} />
    </Screen>
  );
}

function Section({ title, body }: { title: string; body: string }) {
  return (
    <View style={styles.section}>
      <AppText variant="label" tone="secondary">{title}</AppText>
      <AppText>{body}</AppText>
    </View>
  );
}

function ListSection({ title, items, icon, color }: { title: string; items: string[]; icon?: React.ComponentProps<typeof Ionicons>['name']; color?: string }) {
  const { colors } = useTheme();
  return (
    <View style={styles.section}>
      <AppText variant="label" tone="secondary">{title}</AppText>
      {items.map((item, i) => (
        <View key={i} style={styles.listRow}>
          <Ionicons name={icon ?? 'ellipse'} size={icon ? 16 : 6} color={color ?? colors.textSecondary} />
          <AppText style={styles.flex}>{item}</AppText>
        </View>
      ))}
    </View>
  );
}

function NumberedSection({ title, items }: { title: string; items: string[] }) {
  const { colors } = useTheme();
  return (
    <View style={styles.section}>
      <AppText variant="label" tone="secondary">{title}</AppText>
      {items.map((item, i) => (
        <View key={i} style={styles.listRow}>
          <View style={[styles.stepNum, { backgroundColor: colors.primarySoft }]}>
            <AppText variant="label" tone="primary">{i + 1}</AppText>
          </View>
          <AppText style={styles.flex}>{item}</AppText>
        </View>
      ))}
    </View>
  );
}

function Badge({ icon, label }: { icon?: React.ComponentProps<typeof Ionicons>['name']; label: string }) {
  const { colors } = useTheme();
  return (
    <View style={[styles.badge, { backgroundColor: colors.surfaceAlt }]}>
      {icon ? <Ionicons name={icon} size={14} color={colors.textSecondary} /> : null}
      <AppText variant="caption" tone="secondary">{label}</AppText>
    </View>
  );
}

const styles = StyleSheet.create({
  metaRow: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.xs },
  badge: { flexDirection: 'row', alignItems: 'center', gap: 4, paddingHorizontal: spacing.xs, paddingVertical: 4, borderRadius: 999 },
  section: { gap: spacing.xs },
  listRow: { flexDirection: 'row', alignItems: 'flex-start', gap: spacing.sm },
  stepNum: { width: 24, height: 24, borderRadius: 12, alignItems: 'center', justifyContent: 'center' },
  flex: { flex: 1 },
  celebrate: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: spacing.md },
  center: { textAlign: 'center' },
});
