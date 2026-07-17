import { Ionicons } from '@expo/vector-icons';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useEffect, useState } from 'react';
import { StyleSheet, View } from 'react-native';
import { useTranslation } from 'react-i18next';

import { AppText } from '@/design/components/AppText';
import { Button } from '@/design/components/Button';
import { Card } from '@/design/components/Card';
import { Screen } from '@/design/components/Screen';
import { TextField } from '@/design/components/TextField';
import { useTheme } from '@/design/ThemeContext';
import { radius, spacing } from '@/design/tokens';
import { Confetti } from '@/features/character/Confetti';
import { Mascot } from '@/features/character/Mascot';
import { SpeechBubble } from '@/features/character/SpeechBubble';
import {
  PHASE_ICONS,
  PHASE_ORDER,
  findPath,
  worldTint,
  type PhaseKind,
} from '@/features/paths/pathsData';
import {
  isPathUnlocked,
  phasesDone,
  useCompletePathPhase,
  usePathsProgress,
} from '@/features/paths/progress';
import { track } from '@/lib/analytics';

/**
 * Detalle de un camino: sus cuatro fases (Descubrir → Practicar → Jugar →
 * Consolidar) presentadas por Toba. La experiencia principal sucede fuera de
 * la pantalla, con el perro real; aquí solo se guía, se acompaña y se registra.
 * La recompensa del camino es visible desde el primer momento.
 */
export default function PathDetail() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { t } = useTranslation();
  const { isDark } = useTheme();
  const router = useRouter();
  const progressQuery = usePathsProgress();
  const complete = useCompletePathPhase();

  const [note, setNote] = useState('');
  const [justCompleted, setJustCompleted] = useState(false);

  const path = id ? findPath(id) : undefined;
  const pathId = path?.id;

  useEffect(() => {
    if (pathId) track('path_opened', { path: pathId });
  }, [pathId]);
  if (!path) {
    return (
      <Screen>
        <AppText tone="secondary">—</AppText>
      </Screen>
    );
  }

  const progress = progressQuery.data;
  const tint = worldTint(path.world, isDark);
  const done = phasesDone(progress, path.id);
  const unlocked = isPathUnlocked(progress, path);
  const completed = done >= PHASE_ORDER.length;
  const currentKind: PhaseKind | null = completed ? null : PHASE_ORDER[done];
  const rewardTitle = t(path.reward.titleKey);

  if (progressQuery.isSuccess && !unlocked) {
    return (
      <Screen>
        <AppText variant="display">{t(`paths.p_${path.id}_title`)}</AppText>
        <Card>
          <AppText tone="secondary">{t('paths.locked_hint')}</AppText>
        </Card>
        <Button label={t('common.back')} variant="secondary" onPress={() => router.back()} />
      </Screen>
    );
  }

  if (justCompleted) {
    return (
      <Screen scroll={false}>
        <Confetti />
        <View style={styles.celebrate}>
          <Mascot state="celebrating" size={140} />
          <AppText variant="display" style={styles.center}>
            {t('paths.camino_completed_title')}
          </AppText>
          <AppText tone="secondary" style={styles.center}>
            {t('paths.camino_completed_body', { reward: rewardTitle })}
          </AppText>
          <View style={[styles.rewardPill, { backgroundColor: tint.soft }]}>
            <Ionicons name="ribbon" size={18} color={tint.main} />
            <AppText variant="label">{rewardTitle}</AppText>
          </View>
        </View>
        <Button label={t('common.continue')} onPress={() => router.back()} />
      </Screen>
    );
  }

  const speechKey = completed ? 'paths.speech_completed' : `paths.speech_${currentKind}`;

  const markDone = async () => {
    const total = await complete.mutateAsync({ path, note: note.trim() || undefined });
    setNote('');
    if (total >= PHASE_ORDER.length) setJustCompleted(true);
  };

  return (
    <Screen>
      {/* Cabecera con la identidad del mundo */}
      <View style={[styles.banner, { backgroundColor: tint.main }]}>
        <AppText variant="label" style={styles.onTintDim}>
          {t('paths.camino_label', { n: path.order }).toUpperCase()} · {t(`paths.w_${path.world}_title`).toUpperCase()}
        </AppText>
        <AppText variant="title" style={styles.onTint}>
          {t(`paths.p_${path.id}_title`)}
        </AppText>
        <AppText variant="caption" style={styles.onTintDim}>
          {t(`paths.p_${path.id}_desc`)}
        </AppText>
      </View>

      <View style={styles.mascotRow}>
        <Mascot state={completed ? 'happy' : 'attentive'} size={72} />
        <View style={styles.flex}>
          <SpeechBubble text={t(speechKey)} />
        </View>
      </View>

      {/* Recompensa conocida por adelantado */}
      <Card>
        <View style={styles.rewardRow}>
          <View style={[styles.rewardIcon, { backgroundColor: tint.soft }]}>
            <Ionicons name={completed ? 'ribbon' : 'gift-outline'} size={20} color={tint.main} />
          </View>
          <View style={styles.flex}>
            <AppText variant="label" tone="secondary">
              {t('paths.reward_label')}
            </AppText>
            <AppText>{completed ? rewardTitle : t('paths.reward_at_end', { reward: rewardTitle })}</AppText>
          </View>
        </View>
      </Card>

      {/* Fases */}
      <AppText variant="heading">{t('paths.detail_phases_title')}</AppText>
      {PHASE_ORDER.map((kind, i) => {
        const state = i < done ? 'done' : i === done ? 'current' : 'locked';
        return (
          <PhaseRow
            key={kind}
            kind={kind}
            state={state}
            tintMain={tint.main}
            tintSoft={tint.soft}
            note={note}
            onNote={setNote}
            onDone={() => void markDone()}
            saving={complete.isPending}
          />
        );
      })}

      {completed && progress?.notes[path.id] ? (
        <Card>
          <AppText variant="label" tone="secondary">
            {t('paths.your_note')}
          </AppText>
          <AppText>{progress.notes[path.id]}</AppText>
        </Card>
      ) : null}

      <Card>
        <AppText variant="caption" tone="secondary">
          {t('activities.not_validated_note')}
        </AppText>
      </Card>

      <Button label={t('common.back')} variant="ghost" onPress={() => router.back()} />
    </Screen>
  );
}

function PhaseRow({
  kind,
  state,
  tintMain,
  tintSoft,
  note,
  onNote,
  onDone,
  saving,
}: {
  kind: PhaseKind;
  state: 'done' | 'current' | 'locked';
  tintMain: string;
  tintSoft: string;
  note: string;
  onNote: (v: string) => void;
  onDone: () => void;
  saving: boolean;
}) {
  const { t } = useTranslation();
  const { colors } = useTheme();

  const iconBg = state === 'done' ? tintMain : state === 'current' ? tintSoft : colors.surfaceAlt;
  const iconColor = state === 'done' ? '#FFFFFF' : state === 'current' ? tintMain : colors.textSecondary;

  return (
    <Card style={state === 'locked' ? styles.lockedCard : undefined}>
      <View style={styles.phaseHeader}>
        <View style={[styles.phaseIcon, { backgroundColor: iconBg }]}>
          <Ionicons name={state === 'done' ? 'checkmark' : PHASE_ICONS[kind]} size={18} color={iconColor} />
        </View>
        <View style={styles.flex}>
          <AppText variant="heading">{t(`paths.phase_${kind}`)}</AppText>
          <AppText variant="caption" tone="secondary">
            {state === 'done'
              ? t('paths.phase_done')
              : state === 'current'
                ? t('paths.phase_current')
                : t('paths.phase_locked')}
          </AppText>
        </View>
      </View>

      {state === 'current' ? (
        <View style={styles.phaseBody}>
          <AppText tone="secondary">{t(`paths.tpl_${kind}_objective`)}</AppText>
          {[1, 2, 3].map((n) => (
            <View key={n} style={styles.stepRow}>
              <View style={[styles.stepNum, { backgroundColor: tintSoft }]}>
                <AppText variant="label" style={{ color: tintMain }}>
                  {n}
                </AppText>
              </View>
              <AppText style={styles.flex}>{t(`paths.tpl_${kind}_step${n}`)}</AppText>
            </View>
          ))}
          <View style={[styles.noteBox, { backgroundColor: colors.warningSoft }]}>
            <Ionicons name="hand-left-outline" size={16} color={colors.warning} />
            <AppText variant="caption" tone="secondary" style={styles.flex}>
              {t('paths.stop_note')}
            </AppText>
          </View>
          {kind === 'consolidate' ? (
            <TextField
              label={t('paths.consolidate_note_label')}
              placeholder={t('activities.response_placeholder')}
              value={note}
              onChangeText={onNote}
              multiline
              numberOfLines={2}
              maxLength={500}
            />
          ) : null}
          <AppText variant="caption" tone="secondary">
            {t('paths.outside_note')}
          </AppText>
          <Button
            label={saving ? t('paths.phase_completing') : t('paths.mark_phase_done')}
            onPress={onDone}
            loading={saving}
          />
        </View>
      ) : null}
    </Card>
  );
}

const styles = StyleSheet.create({
  banner: { borderRadius: radius.lg, padding: spacing.md, gap: 2 },
  onTint: { color: '#FFFFFF' },
  onTintDim: { color: 'rgba(255,255,255,0.85)' },
  mascotRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm },
  flex: { flex: 1 },
  rewardRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm },
  rewardIcon: { width: 40, height: 40, borderRadius: radius.md, alignItems: 'center', justifyContent: 'center' },
  phaseHeader: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm },
  phaseIcon: { width: 34, height: 34, borderRadius: 17, alignItems: 'center', justifyContent: 'center' },
  phaseBody: { gap: spacing.sm, marginTop: spacing.xs },
  stepRow: { flexDirection: 'row', alignItems: 'flex-start', gap: spacing.sm },
  stepNum: { width: 24, height: 24, borderRadius: 12, alignItems: 'center', justifyContent: 'center' },
  noteBox: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
    borderRadius: radius.sm,
    padding: spacing.xs,
  },
  lockedCard: { opacity: 0.6 },
  celebrate: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: spacing.md },
  center: { textAlign: 'center' },
  rewardPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    borderRadius: radius.pill,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs,
  },
});
