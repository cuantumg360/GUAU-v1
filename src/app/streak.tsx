import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { Pressable, ScrollView, StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useTranslation } from 'react-i18next';

import { AppText } from '@/design/components/AppText';
import { minTouchTarget, palette, radius, spacing, typography } from '@/design/tokens';
import { useRewardGrants, useStreak } from '@/features/activities/api';
import { Confetti } from '@/features/character/Confetti';
import { Mascot } from '@/features/character/Mascot';

/**
 * Pantalla de racha (docs/01-founder-references.md): celebración inmersiva a
 * pantalla completa tras completar una acción real con el perro, y también
 * consulta del estado (mejor racha, próximo hito con recompensa conocida).
 *
 * Reglas de producto: la racha motiva, nunca culpabiliza; Toba jamás castiga;
 * el hito siguiente se conoce por adelantado; sin recompensas por compartir.
 * El fondo cálido es fijo (idéntico en tema claro y oscuro): es una escena.
 */

const MILESTONES = [3, 7, 14, 30, 60, 100, 180, 365] as const;
const WEEKDAYS = ['L', 'M', 'X', 'J', 'V', 'S', 'D'];

const WHITE = '#FFFFFF';
const WHITE_DIM = 'rgba(255,255,255,0.82)';
const WHITE_FAINT = 'rgba(255,255,255,0.28)';

function localDayString(d: Date): string {
  const y = d.getFullYear();
  const m = `${d.getMonth() + 1}`.padStart(2, '0');
  const day = `${d.getDate()}`.padStart(2, '0');
  return `${y}-${m}-${day}`;
}

/** Lunes a domingo de la semana actual, como fechas locales YYYY-MM-DD. */
function currentWeek(): string[] {
  const now = new Date();
  const monday = new Date(now);
  monday.setDate(now.getDate() - ((now.getDay() + 6) % 7));
  return Array.from({ length: 7 }, (_, i) => {
    const d = new Date(monday);
    d.setDate(monday.getDate() + i);
    return localDayString(d);
  });
}

type RewardRow = {
  id: string;
  reward_id: string;
  reward_definitions: { title_key: string; reward_type: string; amount: number | null } | null;
};

export default function StreakScreen() {
  const { celebrate } = useLocalSearchParams<{ celebrate?: string }>();
  const { t } = useTranslation();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const streakQuery = useStreak();
  const rewardsQuery = useRewardGrants();

  const current = streakQuery.data?.current_count ?? 0;
  const best = streakQuery.data?.best_count ?? 0;
  const lastDone = streakQuery.data?.last_completed_date ?? null;
  const celebrating = celebrate === '1' && current > 0;

  // Días cubiertos por la racha dentro de la semana actual.
  const week = currentWeek();
  const today = localDayString(new Date());
  const streakStart = lastDone
    ? localDayString(new Date(new Date(`${lastDone}T12:00:00`).getTime() - (current - 1) * 86_400_000))
    : null;
  const isDone = (day: string) =>
    streakStart !== null && lastDone !== null && day >= streakStart && day <= lastDone;
  const todayDone = isDone(today);

  const nextMilestone = MILESTONES.find((m) => m > current) ?? null;
  const rewards = (rewardsQuery.data ?? []) as unknown as RewardRow[];

  return (
    <View style={styles.fill}>
      <LinearGradient
        colors={[palette.terracotta500, palette.terracotta600]}
        start={{ x: 0, y: 0 }}
        end={{ x: 0, y: 1 }}
        style={StyleSheet.absoluteFill}
      />
      {celebrating ? <Confetti /> : null}

      <ScrollView
        contentContainerStyle={[
          styles.content,
          { paddingTop: insets.top + spacing.lg, paddingBottom: insets.bottom + spacing.xl },
        ]}
        showsVerticalScrollIndicator={false}
      >
        {/* Halo claro: Toba puede ser terracota y el fondo también lo es. */}
        <View style={styles.mascotHalo}>
          <Mascot state={celebrating ? 'celebrating' : current > 0 ? 'happy' : 'neutral'} size={110} />
        </View>

        <AppText style={styles.bigNumber} accessibilityLabel={t('streak.days', { count: current })}>
          {current}
        </AppText>
        <AppText variant="title" style={styles.onTint}>
          {t('streak.days_label', { count: current })}
        </AppText>
        <AppText variant="body" style={styles.subtitle}>
          {current === 0
            ? t('streak.no_guilt')
            : todayDone
              ? t('streak.today_counts')
              : t('streak.today_pending')}
        </AppText>

        {/* Semana actual */}
        <View style={styles.weekRow}>
          {week.map((day, i) => {
            const done = isDone(day);
            const isToday = day === today;
            const future = day > today;
            return (
              <View key={day} style={styles.dayCol}>
                <AppText variant="label" style={styles.onTintDim}>
                  {WEEKDAYS[i]}
                </AppText>
                <View
                  style={[
                    styles.dayCircle,
                    done
                      ? { backgroundColor: WHITE }
                      : { backgroundColor: future ? 'rgba(255,255,255,0.10)' : WHITE_FAINT },
                    isToday ? styles.todayRing : null,
                  ]}
                >
                  {done ? <Ionicons name="paw" size={16} color={palette.terracotta600} /> : null}
                </View>
              </View>
            );
          })}
        </View>

        {/* Mejor racha + próximo hito (recompensa conocida por adelantado) */}
        <View style={styles.statsRow}>
          <View style={styles.statBox}>
            <Ionicons name="trophy-outline" size={18} color={WHITE} />
            <AppText variant="label" style={styles.onTint}>
              {t('streak.best')}
            </AppText>
            <AppText variant="title" style={styles.onTint}>
              {best}
            </AppText>
          </View>
          {nextMilestone ? (
            <View style={styles.statBox}>
              <Ionicons name="flag-outline" size={18} color={WHITE} />
              <AppText variant="label" style={styles.onTint}>
                {t('streak.next_milestone', { days: nextMilestone })}
              </AppText>
              <AppText variant="caption" style={styles.onTintDim}>
                {t(`rewards.streak_${nextMilestone}`)}
              </AppText>
            </View>
          ) : null}
        </View>

        {rewards.length > 0 ? (
          <View style={styles.rewardsBlock}>
            <AppText variant="label" style={styles.onTintDim}>
              {t('streak.rewards_title')}
            </AppText>
            {rewards.map((r) => (
              <View key={r.id} style={styles.rewardRow}>
                <Ionicons name="gift-outline" size={16} color={WHITE} />
                <AppText variant="caption" style={[styles.onTint, styles.flex]}>
                  {r.reward_definitions ? t(r.reward_definitions.title_key) : r.reward_id}
                </AppText>
                {r.reward_definitions?.reward_type === 'paws' && r.reward_definitions.amount ? (
                  <AppText variant="caption" style={styles.onTintDim}>
                    {t('rewards.got_paws', { amount: r.reward_definitions.amount })}
                  </AppText>
                ) : null}
              </View>
            ))}
          </View>
        ) : null}
      </ScrollView>

      <View style={[styles.footer, { paddingBottom: insets.bottom + spacing.md }]}>
        <Pressable
          accessibilityRole="button"
          accessibilityLabel={t('common.continue')}
          onPress={() => router.back()}
          style={({ pressed }) => [styles.continueBtn, { opacity: pressed ? 0.85 : 1 }]}
        >
          <AppText variant="heading" style={styles.continueText}>
            {t('common.continue')}
          </AppText>
        </Pressable>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  fill: { flex: 1 },
  content: { alignItems: 'center', gap: spacing.sm, paddingHorizontal: spacing.lg },
  mascotHalo: {
    width: 164,
    height: 164,
    borderRadius: 82,
    backgroundColor: 'rgba(255,255,255,0.18)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  bigNumber: { ...typography.display, fontSize: 76, lineHeight: 84, color: WHITE, marginTop: spacing.sm },
  onTint: { color: WHITE },
  onTintDim: { color: WHITE_DIM },
  subtitle: { color: WHITE_DIM, textAlign: 'center' },
  weekRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignSelf: 'stretch',
    marginTop: spacing.md,
  },
  dayCol: { alignItems: 'center', gap: 6 },
  dayCircle: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
  },
  todayRing: { borderWidth: 2, borderColor: WHITE },
  statsRow: { flexDirection: 'row', gap: spacing.sm, alignSelf: 'stretch', marginTop: spacing.md },
  statBox: {
    flex: 1,
    alignItems: 'center',
    gap: 2,
    backgroundColor: 'rgba(255,255,255,0.14)',
    borderRadius: radius.md,
    padding: spacing.sm,
  },
  rewardsBlock: { alignSelf: 'stretch', gap: spacing.xs, marginTop: spacing.md },
  rewardRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
    backgroundColor: 'rgba(255,255,255,0.14)',
    borderRadius: radius.sm,
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs,
  },
  flex: { flex: 1 },
  footer: { paddingHorizontal: spacing.lg },
  continueBtn: {
    minHeight: minTouchTarget + 8,
    borderRadius: radius.pill,
    backgroundColor: WHITE,
    alignItems: 'center',
    justifyContent: 'center',
  },
  continueText: { color: palette.terracotta600 },
});
