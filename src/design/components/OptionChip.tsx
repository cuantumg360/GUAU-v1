import * as Haptics from 'expo-haptics';
import { Pressable, StyleSheet } from 'react-native';

import { AppText } from '@/design/components/AppText';
import { useTheme } from '@/design/ThemeContext';
import { minTouchTarget, radius, spacing } from '@/design/tokens';

type Props = {
  label: string;
  selected: boolean;
  onPress: () => void;
};

/** Chip de selección única/múltiple usado en onboarding y formularios. */
export function OptionChip({ label, selected, onPress }: Props) {
  const { colors } = useTheme();
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityState={{ selected }}
      onPress={() => {
        void Haptics.selectionAsync();
        onPress();
      }}
      style={[
        styles.base,
        {
          backgroundColor: selected ? colors.primarySoft : colors.surface,
          borderColor: selected ? colors.primary : colors.border,
        },
      ]}
    >
      <AppText variant="heading" tone={selected ? 'primary' : 'default'}>
        {label}
      </AppText>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  base: {
    minHeight: minTouchTarget,
    borderRadius: radius.pill,
    borderWidth: 1.5,
    paddingHorizontal: spacing.md,
    justifyContent: 'center',
    alignItems: 'center',
  },
});
