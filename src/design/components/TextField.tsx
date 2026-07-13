import { StyleSheet, TextInput, View, type TextInputProps } from 'react-native';

import { AppText } from '@/design/components/AppText';
import { useTheme } from '@/design/ThemeContext';
import { minTouchTarget, radius, spacing, typography } from '@/design/tokens';

type Props = TextInputProps & {
  label?: string;
  error?: string;
};

export function TextField({ label, error, style, ...rest }: Props) {
  const { colors } = useTheme();
  return (
    <View style={styles.wrapper}>
      {label ? (
        <AppText variant="label" tone="secondary" style={styles.label}>
          {label}
        </AppText>
      ) : null}
      <TextInput
        accessibilityLabel={label}
        placeholderTextColor={colors.textSecondary}
        {...rest}
        style={[
          styles.input,
          typography.body,
          {
            backgroundColor: colors.surface,
            color: colors.text,
            borderColor: error ? colors.danger : colors.border,
          },
          style,
        ]}
      />
      {error ? (
        <AppText variant="caption" tone="danger" style={styles.error}>
          {error}
        </AppText>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  wrapper: { width: '100%' },
  label: { marginBottom: spacing.xxs },
  input: {
    minHeight: minTouchTarget + 6,
    borderRadius: radius.md,
    borderWidth: 1,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
  },
  error: { marginTop: spacing.xxs },
});
