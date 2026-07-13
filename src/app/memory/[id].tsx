import { Ionicons } from '@expo/vector-icons';
import { AudioModule, useAudioPlayer } from 'expo-audio';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useState } from 'react';
import { ActivityIndicator, Alert, StyleSheet, View } from 'react-native';
import { useTranslation } from 'react-i18next';

import { formatDate } from '@/core/datetime';
import { AppText } from '@/design/components/AppText';
import { Button } from '@/design/components/Button';
import { Card } from '@/design/components/Card';
import { Screen } from '@/design/components/Screen';
import { TextField } from '@/design/components/TextField';
import { useTheme } from '@/design/ThemeContext';
import { spacing } from '@/design/tokens';
import {
  useDeleteMemory,
  useMemory,
  useMemoryAudioUrl,
  useSaveMemoryVersion,
  type Memory,
  type MemoryVersion,
} from '@/features/memories/api';

export default function MemoryDetail() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { colors } = useTheme();
  const query = useMemory(id);

  if (query.isPending) {
    return (
      <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: colors.background }}>
        <ActivityIndicator color={colors.primary} />
      </View>
    );
  }
  if (!query.data?.memory) {
    return <Screen><AppText tone="secondary">—</AppText></Screen>;
  }
  return <MemoryLoaded memory={query.data.memory} versions={query.data.versions} />;
}

function MemoryLoaded({ memory, versions }: { memory: Memory; versions: MemoryVersion[] }) {
  const { t } = useTranslation();
  const { colors } = useTheme();
  const router = useRouter();
  const saveVersion = useSaveMemoryVersion();
  const deleteMemory = useDeleteMemory();
  const audioUrlQuery = useMemoryAudioUrl(memory.audio_path);
  const player = useAudioPlayer(audioUrlQuery.data ?? undefined);

  const [editing, setEditing] = useState(false);
  // Al editar se parte de la última versión, o del original si no hay ninguna.
  const latest = versions[0]?.content ?? memory.original_text;
  const [draft, setDraft] = useState(latest);
  const [error, setError] = useState<string | null>(null);

  const play = async () => {
    await AudioModule.setAudioModeAsync({ playsInSilentMode: true });
    player.seekTo(0);
    player.play();
  };

  const saveEdit = async () => {
    setError(null);
    if (draft.trim().length === 0) {
      setError(t('memories.error_empty'));
      return;
    }
    try {
      await saveVersion.mutateAsync({ memoryId: memory.id, content: draft.trim(), producedBy: 'manual' });
      setEditing(false);
    } catch {
      setError(t('common.error_generic'));
    }
  };

  const confirmDelete = () => {
    Alert.alert(t('memories.delete_confirm_title'), t('memories.delete_confirm_body'), [
      { text: t('common.cancel'), style: 'cancel' },
      {
        text: t('memories.delete'),
        style: 'destructive',
        onPress: async () => {
          await deleteMemory.mutateAsync(memory);
          router.back();
        },
      },
    ]);
  };

  if (editing) {
    return (
      <Screen>
        <AppText variant="display">{t('memories.edit_title')}</AppText>
        <AppText variant="caption" tone="secondary">{t('memories.edit_note')}</AppText>
        <TextField value={draft} onChangeText={setDraft} multiline numberOfLines={10} maxLength={8000} style={styles.textArea} autoFocus />
        {error ? <AppText tone="danger">{error}</AppText> : null}
        <Button label={t('common.save')} onPress={() => void saveEdit()} loading={saveVersion.isPending} />
        <Button label={t('common.cancel')} variant="ghost" onPress={() => setEditing(false)} />
      </Screen>
    );
  }

  return (
    <Screen>
      <AppText variant="display">{memory.title ?? t('memories.title')}</AppText>
      <AppText variant="caption" tone="secondary">
        {memory.experienced_on
          ? formatDate(`${memory.experienced_on}T12:00:00.000Z`, 'Europe/Madrid')
          : t('memories.no_date')}
      </AppText>

      {memory.audio_path ? (
        <Button
          label={t('memories.play_audio')}
          variant="secondary"
          onPress={() => void play()}
        />
      ) : null}

      {/* Versión más reciente (o el original si no hay versiones) */}
      {versions.length > 0 ? (
        <View style={styles.section}>
          <AppText variant="label" tone="secondary">{t('memories.versions_label')}</AppText>
          {versions.map((v) => (
            <Card key={v.id}>
              <View style={styles.versionHead}>
                <AppText variant="label" tone="primary">{t('memories.version_n', { n: v.version })}</AppText>
                <AppText variant="caption" tone="secondary">
                  {v.produced_by === 'ai' ? t('memories.by_ai') : t('memories.by_manual')}
                </AppText>
              </View>
              <AppText>{v.content}</AppText>
            </Card>
          ))}
        </View>
      ) : null}

      {/* Original, siempre conservado */}
      <View style={styles.section}>
        <AppText variant="label" tone="secondary">{t('memories.original_label')}</AppText>
        <Card>
          <AppText>{memory.original_text}</AppText>
        </Card>
        <View style={styles.noteRow}>
          <Ionicons name="lock-closed-outline" size={14} color={colors.textSecondary} />
          <AppText variant="caption" tone="secondary" style={styles.flex}>{t('memories.original_note')}</AppText>
        </View>
      </View>

      <Button label={t('memories.edit')} variant="secondary" onPress={() => { setDraft(latest); setEditing(true); }} />
      <Button label={t('memories.delete')} variant="danger" onPress={confirmDelete} loading={deleteMemory.isPending} />
      <Button label={t('common.back')} variant="ghost" onPress={() => router.back()} />
    </Screen>
  );
}

const styles = StyleSheet.create({
  section: { gap: spacing.xs },
  versionHead: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  noteRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.xs },
  flex: { flex: 1 },
  textArea: { minHeight: 200, textAlignVertical: 'top' },
});
