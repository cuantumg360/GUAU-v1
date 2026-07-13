import { Ionicons } from '@expo/vector-icons';
import { StyleSheet, View } from 'react-native';
import { useTranslation } from 'react-i18next';

import { AppText } from '@/design/components/AppText';
import { Card } from '@/design/components/Card';
import { Screen } from '@/design/components/Screen';
import { useTheme } from '@/design/ThemeContext';
import { radius, spacing } from '@/design/tokens';
import { DailyActivityCard } from '@/features/activities/DailyActivityCard';
import { useRewardGrants, useStreak } from '@/features/activities/api';
import { Mascot } from '@/features/character/Mascot';

type RewardRow = {
  id: string;
  reward_id: string;
  status: string;
  reward_definitions: { title_key: string; reward_type: string; amount: number | null } | null;
};

export default function Vinculo() {
  const { t } = useTranslation();
  const { colors } = useTheme();
  const streakQuery = useStreak();
  const rewardsQuery = useRewardGrants();

  const current = streakQuery.data?.current_count ?? 0;
  const best = streakQuery.data?.best_count ?? 0;
  const rewards = (rewardsQuery.data ?? []) as unknown as RewardRow[];

  return (
    <Screen>
      <View style={styles.header}>
        <View style={styles.flex}>
          <AppText variant="display">{t('activities.tab_title')}</AppText>
          <AppText tone="secondary">{t('activities.daily_subtitle')}</AppText>
        </View>
        <Mascot state={current > 0 ? 'happy' : 'neutral'} size={64} />
      </View>

      <DailyActivityCard />

      <Card>
        <AppText variant="heading">{t('streak.title')}</AppText>
        <View style={styles.streakRow}>
          <View style={[styles.streakBox, { backgroundColor: colors.primarySoft }]}>
            <Ionicons name="flame" size={22} color={colors.primary} />
            <AppText variant="display" tone="primary">{current}</AppText>
            <AppText variant="caption" tone="secondary">{t('streak.current')}</AppText>
          </View>
          <View style={[styles.streakBox, { backgroundColor: colors.surfaceAlt }]}>
            <Ionicons name="trophy-outline" size={22} color={colors.textSecondary} />
            <AppText variant="display">{best}</AppText>
            <AppText variant="caption" tone="secondary">{t('streak.best')}</AppText>
          </View>
        </View>
        <AppText variant="caption" tone="secondary">
          {current > 0 ? t('streak.motivate_keep') : t('streak.motivate_start')}
        </AppText>
      </Card>

      <Card>
        <AppText variant="heading">{t('streak.rewards_title')}</AppText>
        {rewards.length === 0 ? (
          <AppText variant="caption" tone="secondary">{t('streak.rewards_empty')}</AppText>
        ) : (
          <View style={styles.rewardsList}>
            {rewards.map((r) => (
              <View key={r.id} style={styles.rewardRow}>
                <View style={[styles.rewardIcon, { backgroundColor: colors.successSoft }]}>
                  <Ionicons name="gift" size={18} color={colors.success} />
                </View>
                <View style={styles.flex}>
                  <AppText>{r.reward_definitions ? t(r.reward_definitions.title_key) : r.reward_id}</AppText>
                  {r.reward_definitions?.reward_type === 'paws' && r.reward_definitions.amount ? (
                    <AppText variant="caption" tone="primary">
                      {t('rewards.got_paws', { amount: r.reward_definitions.amount })}
                    </AppText>
                  ) : null}
                </View>
                <AppText variant="caption" tone="secondary">{t('streak.reward_claimed')}</AppText>
              </View>
            ))}
          </View>
        )}
      </Card>
    </Screen>
  );
}

const styles = StyleSheet.create({
  header: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm },
  flex: { flex: 1, gap: 2 },
  streakRow: { flexDirection: 'row', gap: spacing.sm, marginVertical: spacing.xs },
  streakBox: { flex: 1, alignItems: 'center', gap: 2, paddingVertical: spacing.md, borderRadius: radius.md },
  rewardsList: { gap: spacing.xs, marginTop: spacing.xs },
  rewardRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm },
  rewardIcon: { width: 34, height: 34, borderRadius: radius.md, alignItems: 'center', justifyContent: 'center' },
});
