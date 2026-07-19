import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { useRouter } from 'expo-router';
import { useState } from 'react';
import { Modal, Pressable, StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useTranslation } from 'react-i18next';

import { formatDate, formatTime } from '@/core/datetime';
import { AppText } from '@/design/components/AppText';
import { Button } from '@/design/components/Button';
import { useTheme } from '@/design/ThemeContext';
import { minTouchTarget, radius, spacing } from '@/design/tokens';
import { useDailyRecommendation, useStreak, useTodayCompletion } from '@/features/activities/api';
import { Mascot } from '@/features/character/Mascot';
import { useMascotConfig } from '@/features/character/mascotConfig';
import { SpeechBubble } from '@/features/character/SpeechBubble';
import { usePrimaryPet } from '@/features/pets/api';
import { useReminders } from '@/features/reminders/api';
import { track } from '@/lib/analytics';

/**
 * Toba interactivo (docs/11-virtual-character.md): tocar al personaje abre un
 * menú contextual con UNA prioridad principal y pocos accesos rápidos, según
 * el momento (actividad pendiente, recordatorio próximo, racha, recuerdo).
 * No es una sección más: el personaje aparece por toda la app y responde.
 * Regla: nunca muestra diez prioridades a la vez ni bloquea la navegación.
 */

type CompanionAction = {
  key: string;
  icon: React.ComponentProps<typeof Ionicons>['name'];
  label: string;
  route: string;
};

function useCompanionContext(): { speech: string; main: CompanionAction | null; quick: CompanionAction[] } {
  const { t } = useTranslation();
  const petQuery = usePrimaryPet();
  const doneQuery = useTodayCompletion();
  const recQuery = useDailyRecommendation(petQuery.data?.activity_level);
  const remindersQuery = useReminders();
  const streakQuery = useStreak();
  const mascot = useMascotConfig();

  const dogName = petQuery.data?.name ?? '';
  const todayDone = doneQuery.data === true;
  const activity = recQuery.data ?? null;
  const nextReminder = (remindersQuery.data ?? []).find((r) => r.status === 'pending') ?? null;
  const streakCount = streakQuery.data?.current_count ?? 0;

  const actions: CompanionAction[] = [];
  if (!todayDone && activity) {
    actions.push({
      key: 'daily_activity',
      icon: 'paw',
      label: t('character.menu_start_activity'),
      route: `/activity/${activity.id}`,
    });
  }
  if (nextReminder) {
    actions.push({
      key: 'next_reminder',
      icon: 'calendar-outline',
      label: t('character.menu_next_reminder', {
        title: nextReminder.title,
        when: `${formatDate(nextReminder.due_at, nextReminder.timezone)} · ${formatTime(nextReminder.due_at, nextReminder.timezone)}`,
      }),
      route: `/reminder/${nextReminder.id}`,
    });
  }
  actions.push({
    key: 'new_memory',
    icon: 'book-outline',
    label: t('character.menu_new_memory'),
    route: '/memory/new',
  });
  actions.push({
    key: 'streak',
    icon: 'flame-outline',
    label: t('character.menu_view_streak'),
    route: '/streak',
  });
  actions.push({
    key: 'customize',
    icon: 'color-palette-outline',
    label: t('character.menu_customize', { mascot: mascot.name }),
    route: '/mascot',
  });

  const speech = !todayDone && activity
    ? t('character.menu_speech_activity', { name: dogName })
    : todayDone && streakCount > 0
      ? t('character.menu_speech_done', { count: streakCount })
      : t('character.menu_speech_hello');

  // Una prioridad principal + máximo tres accesos rápidos.
  const [main, ...rest] = actions;
  return { speech, main: main ?? null, quick: rest.slice(0, 3) };
}

export function CompanionOverlay({ visible, onClose }: { visible: boolean; onClose: () => void }) {
  const { t } = useTranslation();
  const { colors } = useTheme();
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { speech, main, quick } = useCompanionContext();

  const go = (action: CompanionAction) => {
    track('companion_action', { action: action.key });
    onClose();
    router.push(action.route);
  };

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
      <View style={styles.backdropWrap}>
        <Pressable
          accessibilityRole="button"
          accessibilityLabel={t('character.menu_close')}
          onPress={onClose}
          style={styles.backdrop}
        />
        <View
          accessibilityViewIsModal
          style={[
            styles.sheet,
            { backgroundColor: colors.surface, paddingBottom: insets.bottom + spacing.md },
          ]}
        >
          <View style={styles.mascotRow}>
            <Mascot state="happy" size={84} />
            <View style={styles.flex}>
              <SpeechBubble text={speech} />
            </View>
          </View>

          {main ? <Button label={main.label} onPress={() => go(main)} /> : null}

          <View style={styles.quickList}>
            {quick.map((action) => (
              <Pressable
                key={action.key}
                accessibilityRole="button"
                accessibilityLabel={action.label}
                onPress={() => go(action)}
                style={({ pressed }) => [
                  styles.quickRow,
                  { backgroundColor: colors.surfaceAlt, opacity: pressed ? 0.8 : 1 },
                ]}
              >
                <Ionicons name={action.icon} size={18} color={colors.primary} />
                <AppText style={styles.flex} numberOfLines={1}>
                  {action.label}
                </AppText>
                <Ionicons name="chevron-forward" size={16} color={colors.textSecondary} />
              </Pressable>
            ))}
          </View>
        </View>
      </View>
    </Modal>
  );
}

/**
 * Toba flotante: el personaje aparece en las pantallas principales y, al
 * tocarlo, abre su menú contextual. Colocar FUERA del scroll (hermano de
 * `Screen`) para que acompañe sin desplazarse con el contenido.
 */
export function CompanionFab() {
  const { t } = useTranslation();
  const { colors } = useTheme();
  const mascot = useMascotConfig();
  const [open, setOpen] = useState(false);

  const openMenu = () => {
    void Haptics.selectionAsync();
    track('companion_opened', { from: 'fab' });
    setOpen(true);
  };

  return (
    <>
      <Pressable
        accessibilityRole="button"
        accessibilityLabel={t('character.open_menu', { mascot: mascot.name })}
        onPress={openMenu}
        style={({ pressed }) => [
          styles.fab,
          {
            backgroundColor: colors.surface,
            borderColor: colors.border,
            transform: [{ scale: pressed ? 0.94 : 1 }],
          },
        ]}
      >
        <Mascot state="neutral" size={44} />
      </Pressable>
      <CompanionOverlay visible={open} onClose={() => setOpen(false)} />
    </>
  );
}

const styles = StyleSheet.create({
  backdropWrap: { flex: 1, justifyContent: 'flex-end' },
  backdrop: { ...StyleSheet.absoluteFillObject, backgroundColor: 'rgba(20,15,10,0.45)' },
  sheet: {
    borderTopLeftRadius: radius.lg,
    borderTopRightRadius: radius.lg,
    padding: spacing.lg,
    gap: spacing.md,
  },
  mascotRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm },
  flex: { flex: 1 },
  quickList: { gap: spacing.xs },
  quickRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    minHeight: minTouchTarget,
    borderRadius: radius.md,
    paddingHorizontal: spacing.sm,
  },
  fab: {
    position: 'absolute',
    right: spacing.md,
    bottom: spacing.md,
    width: 60,
    height: 64,
    borderRadius: 32,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOpacity: 0.12,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 3 },
    elevation: 4,
  },
});
