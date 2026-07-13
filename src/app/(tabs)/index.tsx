import { Image, StyleSheet, View } from 'react-native';
import { useTranslation } from 'react-i18next';

import { ageFromBirthDate } from '@/core/petSchema';
import { AppText } from '@/design/components/AppText';
import { Card } from '@/design/components/Card';
import { Screen } from '@/design/components/Screen';
import { useTheme } from '@/design/ThemeContext';
import { radius, spacing } from '@/design/tokens';
import { DailyActivityCard } from '@/features/activities/DailyActivityCard';
import { Mascot } from '@/features/character/Mascot';
import { usePetPhotoUrl, usePrimaryPet } from '@/features/pets/api';
import { useFeatureFlags, usePawBalance } from '@/lib/remoteConfig';

function greetingKey(hour: number): 'home.greeting_morning' | 'home.greeting_afternoon' | 'home.greeting_evening' {
  if (hour < 14) return 'home.greeting_morning';
  if (hour < 21) return 'home.greeting_afternoon';
  return 'home.greeting_evening';
}

/**
 * Inicio. Sin sección "Hoy": la actividad diaria (Etapa 4) aparecerá aquí de
 * forma contextual. Las funciones aún no activas se muestran como estado real
 * de construcción gobernado por feature flags de servidor — no hay botones falsos.
 */
export default function Home() {
  const { t } = useTranslation();
  const { colors } = useTheme();
  const petQuery = usePrimaryPet();
  const photoQuery = usePetPhotoUrl(petQuery.data?.photo_path ?? null);
  const flagsQuery = useFeatureFlags();
  const pawQuery = usePawBalance();

  const pet = petQuery.data;
  const age = pet?.birth_date ? ageFromBirthDate(pet.birth_date) : null;

  const upcoming: { flag: string; label: string }[] = [
    { flag: 'calendar', label: t('home.feature_calendar') },
    { flag: 'activities', label: t('home.feature_activities') },
    { flag: 'scanner_physical', label: t('home.feature_scanner_physical') },
    { flag: 'scanner_food', label: t('home.feature_scanner_food') },
    { flag: 'scanner_booklet', label: t('home.feature_scanner_booklet') },
    { flag: 'memories', label: t('home.feature_memories') },
    { flag: 'streaks_rewards', label: t('home.feature_streaks') },
  ].filter((f) => flagsQuery.data?.[f.flag] === false);

  return (
    <Screen>
      <View style={styles.headerRow}>
        <View style={styles.greeting}>
          <AppText variant="display">{t(greetingKey(new Date().getHours()))}</AppText>
          {pet ? (
            <AppText tone="secondary">{t('home.with_dog', { name: pet.name })}</AppText>
          ) : null}
        </View>
        <Mascot state="neutral" size={64} />
      </View>

      {pet ? (
        <Card>
          <View style={styles.petRow}>
            {photoQuery.data ? (
              <Image source={{ uri: photoQuery.data }} style={[styles.petPhoto, { borderColor: colors.border }]} />
            ) : (
              <View style={[styles.petPhoto, styles.petPhotoEmpty, { backgroundColor: colors.surfaceAlt, borderColor: colors.border }]}>
                <AppText variant="display">{pet.name.slice(0, 1).toUpperCase()}</AppText>
              </View>
            )}
            <View style={styles.petInfo}>
              <AppText variant="title">{pet.name}</AppText>
              {age ? (
                <AppText tone="secondary">
                  {age.years > 0
                    ? t('dog.age_years', { count: age.years })
                    : t('dog.age_months', { count: age.months })}
                  {pet.birth_date_is_approx ? ' (aprox.)' : ''}
                </AppText>
              ) : null}
              {typeof pawQuery.data === 'number' ? (
                <AppText variant="label" tone="primary">
                  {pawQuery.data} {t('home.paw_balance')}
                </AppText>
              ) : null}
            </View>
          </View>
        </Card>
      ) : null}

      {flagsQuery.data?.activities ? <DailyActivityCard /> : null}

      {upcoming.length > 0 ? (
        <Card>
          <AppText variant="heading">{t('home.coming_soon_title')}</AppText>
          <AppText variant="caption" tone="secondary">
            {t('home.coming_soon_body')}
          </AppText>
          <View style={styles.upcomingList}>
            {upcoming.map((f) => (
              <View key={f.flag} style={styles.upcomingRow}>
                <View style={[styles.dot, { backgroundColor: colors.accent }]} />
                <AppText tone="secondary">{f.label}</AppText>
              </View>
            ))}
          </View>
        </Card>
      ) : null}
    </Screen>
  );
}

const styles = StyleSheet.create({
  headerRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  greeting: { flex: 1, gap: spacing.xxs },
  petRow: { flexDirection: 'row', gap: spacing.md, alignItems: 'center' },
  petPhoto: { width: 84, height: 84, borderRadius: radius.lg, borderWidth: 1 },
  petPhotoEmpty: { alignItems: 'center', justifyContent: 'center' },
  petInfo: { flex: 1, gap: spacing.xxs },
  upcomingList: { gap: spacing.xs, marginTop: spacing.xs },
  upcomingRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.xs },
  dot: { width: 6, height: 6, borderRadius: 3 },
});
