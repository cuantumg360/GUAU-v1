import { StyleSheet, View } from 'react-native';

import { AppText } from '@/design/components/AppText';
import { useTheme } from '@/design/ThemeContext';
import { radius, spacing } from '@/design/tokens';

/** Globo de diálogo del personaje (cola apuntando hacia el personaje, a la izquierda). */
export function SpeechBubble({ text, tail = 'left' }: { text: string; tail?: 'left' | 'down' }) {
  const { colors } = useTheme();
  return (
    <View style={styles.wrap}>
      <View style={[styles.bubble, { backgroundColor: colors.surface, borderColor: colors.border }]}>
        <AppText variant="body">{text}</AppText>
      </View>
      {tail === 'left' ? (
        <View style={[styles.tailLeft, { borderRightColor: colors.surface }]} />
      ) : (
        <View style={[styles.tailDown, { borderTopColor: colors.surface }]} />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { flexShrink: 1 },
  bubble: {
    borderWidth: 1,
    borderRadius: radius.lg,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
  },
  tailLeft: {
    position: 'absolute',
    left: -7,
    top: 18,
    width: 0,
    height: 0,
    borderTopWidth: 7,
    borderBottomWidth: 7,
    borderRightWidth: 8,
    borderTopColor: 'transparent',
    borderBottomColor: 'transparent',
  },
  tailDown: {
    position: 'absolute',
    bottom: -7,
    left: 24,
    width: 0,
    height: 0,
    borderLeftWidth: 7,
    borderRightWidth: 7,
    borderTopWidth: 8,
    borderLeftColor: 'transparent',
    borderRightColor: 'transparent',
  },
});
