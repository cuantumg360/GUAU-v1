import { Text, type TextProps } from 'react-native';

import { useTheme } from '@/design/ThemeContext';
import { typography } from '@/design/tokens';

type Variant = keyof typeof typography;
type Tone = 'default' | 'secondary' | 'primary' | 'danger' | 'health' | 'onPrimary';

type Props = TextProps & {
  variant?: Variant;
  tone?: Tone;
};

export function AppText({ variant = 'body', tone = 'default', style, ...rest }: Props) {
  const { colors } = useTheme();
  const color = {
    default: colors.text,
    secondary: colors.textSecondary,
    primary: colors.primary,
    danger: colors.danger,
    health: colors.health,
    onPrimary: colors.onPrimary,
  }[tone];

  return <Text {...rest} style={[typography[variant], { color }, style]} />;
}
