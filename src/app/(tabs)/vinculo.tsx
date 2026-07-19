import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { useRouter } from 'expo-router';
import { useState } from 'react';
import { Pressable, ScrollView, StyleSheet, View } from 'react-native';
import { useTranslation } from 'react-i18next';

import { AppText } from '@/design/components/AppText';
import { Screen } from '@/design/components/Screen';
import { useTheme } from '@/design/ThemeContext';
import { minTouchTarget, radius, spacing } from '@/design/tokens';
import { DailyActivityCard } from '@/features/activities/DailyActivityCard';
import { useStreak } from '@/features/activities/api';
import { CompanionOverlay } from '@/features/character/CompanionMenu';
import { PathMap } from '@/features/paths/PathMap';
import { WORLDS, worldTint, type WorldId } from '@/features/paths/pathsData';
import { usePathsProgress, worldCompleted } from '@/features/paths/progress';
import { track } from '@/lib/analytics';

/**
 * Pestaña Caminos: el mapa de progresión de GUAU (docs/01-founder-references.md).
 * Seis mundos, cada uno con cuatro caminos de cuatro fases; la experiencia real
 * ocurre fuera de la pantalla, con el perro. La racha vive en su propia pantalla
 * y aquí solo se representa de forma discreta.
 */
export default function Caminos() {
  const { t } = useTranslation();
  const { colors, isDark } = useTheme();
  const router = useRouter();
  const progressQuery = usePathsProgress();
  const streakQuery = useStreak();

  const progress = progressQuery.data;
  const [selected, setSelected] = useState<WorldId | null>(null);
  const [companionOpen, setCompanionOpen] = useState(false);
  const firstIncomplete =
    WORLDS.find((w) => worldCompleted(progress, w.id) < 4)?.id ?? WORLDS[0].id;
  const world = selected ?? firstIncomplete;
  const worldDef = WORLDS.find((w) => w.id === world) ?? WORLDS[0];
  const tint = worldTint(world, isDark);
  const done = worldCompleted(progress, world);
  const streakCount = streakQuery.data?.current_count ?? 0;

  return (
    <Screen>
      <View style={styles.header}>
        <View style={styles.flex}>
          <AppText variant="display">{t('paths.tab_title')}</AppText>
          <AppText tone="secondary">{t('paths.map_subtitle')}</AppText>
        </View>
        <Pressable
          accessibilityRole="button"
          accessibilityLabel={t('streak.open_screen')}
          onPress={() => {
            void Haptics.selectionAsync();
            router.push('/streak');
          }}
          style={[styles.streakChip, { backgroundColor: colors.primarySoft, borderColor: colors.primary }]}
        >
          <Ionicons name="flame" size={16} color={colors.primary} />
          <AppText variant="label" tone="primary">
            {streakCount}
          </AppText>
        </Pressable>
      </View>

      {/* Selector de mundos */}
      <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.worldRow}>
        {WORLDS.map((w) => {
          const wTint = worldTint(w.id, isDark);
          const active = w.id === world;
          const wDone = worldCompleted(progress, w.id);
          return (
            <Pressable
              key={w.id}
              accessibilityRole="button"
              accessibilityState={{ selected: active }}
              accessibilityLabel={`${t('paths.world_label', { n: w.index })} · ${t(`paths.w_${w.id}_title`)}`}
              onPress={() => {
                void Haptics.selectionAsync();
                setSelected(w.id);
              }}
              style={[
                styles.worldChip,
                {
                  backgroundColor: active ? wTint.main : colors.surface,
                  borderColor: active ? wTint.main : colors.border,
                },
              ]}
            >
              <Ionicons name={w.icon} size={16} color={active ? '#FFFFFF' : colors.textSecondary} />
              <AppText variant="label" style={active ? styles.onTint : undefined} tone={active ? undefined : 'secondary'}>
                {t(`paths.w_${w.id}_title`)}
              </AppText>
              <AppText variant="caption" style={active ? styles.onTintDim : undefined} tone={active ? undefined : 'secondary'}>
                {wDone}/4
              </AppText>
            </Pressable>
          );
        })}
      </ScrollView>

      {/* Cabecera del mundo activo */}
      <View style={[styles.worldCard, { backgroundColor: tint.main }]}>
        <View style={styles.flex}>
          <AppText variant="label" style={styles.onTintDim}>
            {t('paths.world_label', { n: worldDef.index }).toUpperCase()}
          </AppText>
          <AppText variant="title" style={styles.onTint}>
            {t(`paths.w_${world}_title`)}
          </AppText>
          <AppText variant="caption" style={styles.onTintDim}>
            {t(`paths.w_${world}_desc`)}
          </AppText>
        </View>
        <View style={styles.worldProgress}>
          <Ionicons name="paw" size={16} color="#FFFFFF" />
          <AppText variant="label" style={styles.onTint}>
            {t('paths.progress_caminos', { done, total: 4 })}
          </AppText>
        </View>
      </View>

      <PathMap
        world={world}
        progress={progress}
        onMascotPress={() => {
          track('companion_opened', { from: 'paths_map' });
          setCompanionOpen(true);
        }}
      />

      <CompanionOverlay visible={companionOpen} onClose={() => setCompanionOpen(false)} />

      {/* Actividad diaria: transversal, también dentro del camino activo. */}
      <DailyActivityCard />

      <AppText variant="caption" tone="secondary" style={styles.note}>
        {t('paths.review_note')}
      </AppText>
    </Screen>
  );
}

const styles = StyleSheet.create({
  header: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm },
  flex: { flex: 1, gap: 2 },
  streakChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    borderWidth: 1,
    borderRadius: radius.pill,
    paddingHorizontal: spacing.sm,
    minHeight: minTouchTarget - 8,
  },
  worldRow: { gap: spacing.xs, paddingVertical: 2 },
  worldChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    borderWidth: 1.5,
    borderRadius: radius.pill,
    paddingHorizontal: spacing.sm,
    minHeight: minTouchTarget - 4,
  },
  worldCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    borderRadius: radius.lg,
    padding: spacing.md,
  },
  worldProgress: { alignItems: 'center', gap: 2 },
  onTint: { color: '#FFFFFF' },
  onTintDim: { color: 'rgba(255,255,255,0.85)' },
  note: { textAlign: 'center' },
});
