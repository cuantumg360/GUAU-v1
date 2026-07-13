import { StyleSheet, View, type ViewProps } from 'react-native';

import { useTheme } from '@/design/ThemeContext';
import { radius, spacing } from '@/design/tokens';

type Props = ViewProps & {
  /** Variante sobria para contenido sanitario (fondo pizarra suave, sin adornos). */
  health?: boolean;
};

export function Card({ health, style, ...rest }: Props) {
  const { colors } = useTheme();
  return (
    <View
      {...rest}
      style={[
        styles.base,
        {
          backgroundColor: health ? colors.healthSoft : colors.surface,
          borderColor: health ? colors.health : colors.border,
        },
        style,
      ]}
    />
  );
}

const styles = StyleSheet.create({
  base: {
    borderRadius: radius.lg,
    borderWidth: 1,
    padding: spacing.md,
    gap: spacing.xs,
  },
});
