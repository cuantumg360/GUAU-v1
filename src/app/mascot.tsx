import { useRouter } from 'expo-router';
import { useEffect, useState } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';
import { useTranslation } from 'react-i18next';

import { AppText } from '@/design/components/AppText';
import { Button } from '@/design/components/Button';
import { Gradient } from '@/design/components/Gradient';
import { Screen } from '@/design/components/Screen';
import { TextField } from '@/design/components/TextField';
import { useTheme } from '@/design/ThemeContext';
import { radius, spacing } from '@/design/tokens';
import { Mascot } from '@/features/character/Mascot';
import { SpeechBubble } from '@/features/character/SpeechBubble';
import {
  getMascotConfig,
  MASCOT_ACCESSORIES,
  MASCOT_VARIANTS,
  randomizeMascot,
  saveMascotConfig,
  type MascotAccessory,
  type MascotConfig,
  type MascotVariant,
} from '@/features/character/mascotConfig';

export default function MascotCustomize() {
  const { t } = useTranslation();
  const { colors } = useTheme();
  const router = useRouter();
  const [draft, setDraft] = useState<MascotConfig>(getMascotConfig());

  useEffect(() => setDraft(getMascotConfig()), []);

  const variants = Object.keys(MASCOT_VARIANTS) as MascotVariant[];

  const save = async () => {
    await saveMascotConfig({ ...draft, name: draft.name.trim() || 'Toba' });
    router.back();
  };

  return (
    <Screen>
      <Gradient rounded style={styles.hero}>
        <Mascot state="happy" size={140} config={draft} />
      </Gradient>

      <View style={styles.bubbleRow}>
        <SpeechBubble text={t('character.intro_line', { mascot: draft.name || 'Toba' })} tail="down" />
      </View>

      <AppText variant="display">{t('character.customize_title')}</AppText>
      <AppText tone="secondary">{t('character.customize_subtitle', { mascot: draft.name || 'Toba' })}</AppText>

      <TextField
        label={t('character.section_name')}
        placeholder={t('character.name_placeholder')}
        value={draft.name}
        onChangeText={(name) => setDraft((d) => ({ ...d, name }))}
        maxLength={20}
      />

      <AppText variant="label" tone="secondary" style={styles.label}>{t('character.section_color')}</AppText>
      <View style={styles.row}>
        {variants.map((v) => {
          const selected = draft.variant === v;
          return (
            <Pressable
              key={v}
              accessibilityRole="button"
              accessibilityLabel={MASCOT_VARIANTS[v].label}
              accessibilityState={{ selected }}
              onPress={() => setDraft((d) => ({ ...d, variant: v }))}
              style={[
                styles.swatch,
                { backgroundColor: MASCOT_VARIANTS[v].body, borderColor: selected ? colors.text : 'transparent' },
              ]}
            />
          );
        })}
      </View>

      <AppText variant="label" tone="secondary" style={styles.label}>{t('character.section_accessory')}</AppText>
      <View style={styles.row}>
        {MASCOT_ACCESSORIES.map((a) => {
          const selected = draft.accessory === a.key;
          return (
            <Pressable
              key={a.key}
              accessibilityRole="button"
              accessibilityLabel={a.label}
              accessibilityState={{ selected }}
              onPress={() => setDraft((d) => ({ ...d, accessory: a.key as MascotAccessory }))}
              style={[
                styles.accChip,
                { backgroundColor: selected ? colors.primarySoft : colors.surface, borderColor: selected ? colors.primary : colors.border },
              ]}
            >
              <AppText>{a.emoji}</AppText>
              <AppText variant="caption" tone={selected ? 'primary' : 'secondary'}>{a.label}</AppText>
            </Pressable>
          );
        })}
      </View>

      <Button label={t('character.randomize')} variant="secondary" onPress={() => setDraft((d) => randomizeMascot(d.name))} />
      <Button label={t('character.save')} onPress={() => void save()} />
      <Button label={t('common.cancel')} variant="ghost" onPress={() => router.back()} />
    </Screen>
  );
}

const styles = StyleSheet.create({
  hero: { alignItems: 'center', justifyContent: 'center', paddingVertical: spacing.lg },
  bubbleRow: { alignItems: 'flex-start' },
  label: { marginTop: spacing.xs },
  row: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm, alignItems: 'center' },
  swatch: { width: 44, height: 44, borderRadius: radius.pill, borderWidth: 3 },
  accChip: { flexDirection: 'row', alignItems: 'center', gap: 6, paddingHorizontal: spacing.sm, paddingVertical: spacing.xs, borderRadius: radius.pill, borderWidth: 1.5 },
});
