import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { StyleSheet, View } from 'react-native';
import { useTranslation } from 'react-i18next';

import { AppText } from '@/design/components/AppText';
import { Button } from '@/design/components/Button';
import { Card } from '@/design/components/Card';
import { useTheme } from '@/design/ThemeContext';
import { spacing } from '@/design/tokens';
import { useDailyRecommendation, useTodayCompletion } from '@/features/activities/api';
import { usePrimaryPet } from '@/features/pets/api';

/**
 * Actividad diaria contextual. NO es una sección "Hoy": es una tarjeta que
 * aparece en la Home y en el tab Vínculo. Presenta la actividad recomendada,
 * permite empezarla o, si ya se hizo, muestra el estado de completado.
 */
export function DailyActivityCard() {
  const { t } = useTranslation();
  const { colors } = useTheme();
  const router = useRouter();
  const petQuery = usePrimaryPet();
  const recQuery = useDailyRecommendation(petQuery.data?.activity_level);
  const doneQuery = useTodayCompletion();

  if (doneQuery.data) {
    return (
      <Card style={styles.doneCard}>
        <View style={styles.doneRow}>
          <Ionicons name="checkmark-circle" size={28} color={colors.success} />
          <View style={styles.flex}>
            <AppText variant="heading">{t('activities.already_done')}</AppText>
            <AppText variant="caption" tone="secondary">
              {t('activities.already_done_body')}
            </AppText>
          </View>
        </View>
      </Card>
    );
  }

  const activity = recQuery.data;
  if (!activity) return null;

  return (
    <Card>
      <AppText variant="label" tone="primary">
        {t('activities.daily_title')}
      </AppText>
      <AppText variant="title">{activity.title}</AppText>
      <AppText tone="secondary">{activity.description}</AppText>
      <View style={styles.metaRow}>
        <View style={[styles.badge, { backgroundColor: colors.surfaceAlt }]}>
          <Ionicons name="time-outline" size={14} color={colors.textSecondary} />
          <AppText variant="caption" tone="secondary">
            {t('activities.duration', { min: activity.duration_min })}
          </AppText>
        </View>
        <View style={[styles.badge, { backgroundColor: colors.surfaceAlt }]}>
          <AppText variant="caption" tone="secondary">
            {t(`activities.difficulty_${activity.difficulty}`)}
          </AppText>
        </View>
        <View style={[styles.badge, { backgroundColor: colors.accentSoft }]}>
          <AppText variant="caption" tone="secondary">
            {t(`activities.cat_${activity.category}`)}
          </AppText>
        </View>
      </View>
      <Button label={t('activities.start')} onPress={() => router.push(`/activity/${activity.id}`)} />
    </Card>
  );
}

const styles = StyleSheet.create({
  doneCard: {},
  doneRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm },
  flex: { flex: 1, gap: 2 },
  metaRow: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.xs, marginVertical: spacing.xs },
  badge: { flexDirection: 'row', alignItems: 'center', gap: 4, paddingHorizontal: spacing.xs, paddingVertical: 4, borderRadius: 999 },
});
