import { LinearGradient } from 'expo-linear-gradient';
import { StyleSheet, View, type ViewProps } from 'react-native';

import { useTheme } from '@/design/ThemeContext';
import { radius } from '@/design/tokens';

type Props = ViewProps & {
  /** Par de colores; por defecto un degradado cálido de marca. */
  colors?: [string, string];
  rounded?: boolean;
};

/** Fondo con degradado suave para las zonas "héroe" (Home, onboarding, celebraciones). */
export function Gradient({ colors: gradientColors, rounded, style, children, ...rest }: Props) {
  const { colors, isDark } = useTheme();
  const pair: [string, string] =
    gradientColors ??
    (isDark
      ? [colors.surfaceAlt, colors.background]
      : [colors.primarySoft, colors.accentSoft]);

  return (
    <View {...rest} style={[rounded ? styles.rounded : null, styles.clip, style]}>
      <LinearGradient colors={pair} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={StyleSheet.absoluteFill} />
      {children}
    </View>
  );
}

const styles = StyleSheet.create({
  clip: { overflow: 'hidden' },
  rounded: { borderRadius: radius.lg },
});
