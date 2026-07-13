import { type ReactNode } from 'react';
import { KeyboardAvoidingView, Platform, ScrollView, StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { useTheme } from '@/design/ThemeContext';
import { spacing } from '@/design/tokens';

type Props = {
  children: ReactNode;
  /** scroll=false para pantallas que gestionan su propio layout. */
  scroll?: boolean;
};

export function Screen({ children, scroll = true }: Props) {
  const { colors } = useTheme();
  const insets = useSafeAreaInsets();

  const inner = scroll ? (
    <ScrollView
      contentContainerStyle={[styles.content, { paddingBottom: insets.bottom + spacing.xl }]}
      keyboardShouldPersistTaps="handled"
    >
      {children}
    </ScrollView>
  ) : (
    <View style={[styles.content, styles.fill, { paddingBottom: insets.bottom + spacing.md }]}>
      {children}
    </View>
  );

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      style={[styles.fill, { backgroundColor: colors.background, paddingTop: insets.top }]}
    >
      {inner}
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  fill: { flex: 1 },
  content: { paddingHorizontal: spacing.lg, paddingTop: spacing.md, gap: spacing.md },
});
