import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { StyleSheet, View, Pressable } from 'react-native';
import { useTranslation } from 'react-i18next';

import { formatDate } from '@/core/datetime';
import { AppText } from '@/design/components/AppText';
import { Button } from '@/design/components/Button';
import { Card } from '@/design/components/Card';
import { Screen } from '@/design/components/Screen';
import { useTheme } from '@/design/ThemeContext';
import { radius, spacing } from '@/design/tokens';
import { Mascot } from '@/features/character/Mascot';
import { useMemories, type Memory } from '@/features/memories/api';

export default function Recuerdos() {
  const { t } = useTranslation();
  const router = useRouter();
  const memoriesQuery = useMemories();
  const memories = memoriesQuery.data ?? [];
  const empty = !memoriesQuery.isPending && memories.length === 0;

  return (
    <Screen>
      <View style={styles.header}>
        <View style={styles.flex}>
          <AppText variant="display">{t('memories.title')}</AppText>
          <AppText tone="secondary">{t('memories.subtitle')}</AppText>
        </View>
        <Mascot state="neutral" size={60} />
      </View>

      <View style={styles.addRow}>
        <Button label={t('memories.add_text')} style={styles.flex} onPress={() => router.push('/memory/new?kind=text')} />
        <Button
          label={t('memories.add_voice')}
          variant="secondary"
          style={styles.flex}
          onPress={() => router.push('/memory/new?kind=voice')}
        />
      </View>

      {empty ? (
        <Card>
          <AppText variant="heading">{t('memories.empty_title')}</AppText>
          <AppText tone="secondary">{t('memories.empty_body')}</AppText>
        </Card>
      ) : null}

      {memories.map((m) => (
        <MemoryRow key={m.id} memory={m} onPress={() => router.push(`/memory/${m.id}`)} />
      ))}
    </Screen>
  );
}

function MemoryRow({ memory, onPress }: { memory: Memory; onPress: () => void }) {
  const { t } = useTranslation();
  const { colors } = useTheme();
  const preview = memory.original_text.length > 90 ? `${memory.original_text.slice(0, 90)}…` : memory.original_text;

  return (
    <Pressable accessibilityRole="button" onPress={onPress}>
      <Card>
        <View style={styles.rowTop}>
          <View style={[styles.icon, { backgroundColor: colors.accentSoft }]}>
            <Ionicons name={memory.input_kind === 'voice' ? 'mic-outline' : 'create-outline'} size={18} color={colors.accent} />
          </View>
          <View style={styles.flex}>
            <AppText variant="heading">{memory.title ?? preview}</AppText>
            <AppText variant="caption" tone="secondary">
              {memory.experienced_on ? formatDate(`${memory.experienced_on}T12:00:00.000Z`, 'Europe/Madrid') : t('memories.no_date')}
            </AppText>
          </View>
          <Ionicons name="chevron-forward" size={18} color={colors.textSecondary} />
        </View>
        {memory.title ? <AppText tone="secondary">{preview}</AppText> : null}
      </Card>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  header: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm },
  flex: { flex: 1, gap: 2 },
  addRow: { flexDirection: 'row', gap: spacing.sm },
  rowTop: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm },
  icon: { width: 36, height: 36, borderRadius: radius.md, alignItems: 'center', justifyContent: 'center' },
});
