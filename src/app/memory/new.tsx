import { Ionicons } from '@expo/vector-icons';
import { AudioModule, RecordingPresets, setAudioModeAsync, useAudioRecorder, useAudioRecorderState } from 'expo-audio';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useState } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';
import { useTranslation } from 'react-i18next';

import { parseDateParts } from '@/core/datetime';
import { AppText } from '@/design/components/AppText';
import { Button } from '@/design/components/Button';
import { Card } from '@/design/components/Card';
import { Screen } from '@/design/components/Screen';
import { TextField } from '@/design/components/TextField';
import { useTheme } from '@/design/ThemeContext';
import { radius, spacing } from '@/design/tokens';
import { useCreateMemory } from '@/features/memories/api';
import { usePrimaryPet } from '@/features/pets/api';

function toIsoDate(text: string): string | null {
  if (text.trim() === '') return null;
  const parts = parseDateParts(text);
  if (!parts) return undefined as unknown as null; // señal de error
  return `${parts.year}-${String(parts.month).padStart(2, '0')}-${String(parts.day).padStart(2, '0')}`;
}

export default function NewMemory() {
  const { kind } = useLocalSearchParams<{ kind?: string }>();
  const isVoice = kind === 'voice';
  const { t } = useTranslation();
  const { colors } = useTheme();
  const router = useRouter();
  const petQuery = usePrimaryPet();
  const createMemory = useCreateMemory();

  const recorder = useAudioRecorder(RecordingPresets.HIGH_QUALITY);
  const recorderState = useAudioRecorderState(recorder);

  const [title, setTitle] = useState('');
  const [dateText, setDateText] = useState('');
  const [text, setText] = useState('');
  const [audioUri, setAudioUri] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [permissionError, setPermissionError] = useState(false);

  const startRecording = async () => {
    setError(null);
    setPermissionError(false);
    const status = await AudioModule.requestRecordingPermissionsAsync();
    if (!status.granted) {
      setPermissionError(true);
      return;
    }
    await setAudioModeAsync({ playsInSilentMode: true, allowsRecording: true });
    await recorder.prepareToRecordAsync();
    recorder.record();
  };

  const stopRecording = async () => {
    await recorder.stop();
    setAudioUri(recorder.uri ?? null);
  };

  const save = async () => {
    setError(null);
    if (text.trim().length === 0) {
      setError(t('memories.error_empty'));
      return;
    }
    const iso = toIsoDate(dateText);
    if (iso === undefined) {
      setError(t('memories.error_date'));
      return;
    }
    try {
      await createMemory.mutateAsync({
        title: title.trim() === '' ? null : title.trim(),
        originalText: text.trim(),
        experiencedOn: iso,
        inputKind: isVoice ? 'voice' : 'text',
        originalTranscript: isVoice ? text.trim() : null,
        petId: petQuery.data?.id ?? null,
        audioUri: isVoice ? audioUri : null,
      });
      router.back();
    } catch {
      setError(t('common.error_generic'));
    }
  };

  return (
    <Screen>
      <AppText variant="display">{isVoice ? t('memories.new_voice_title') : t('memories.new_text_title')}</AppText>

      {isVoice ? (
        <Card>
          <AppText tone="secondary">{t('memories.record_hint')}</AppText>
          <View style={styles.recordRow}>
            <Pressable
              accessibilityRole="button"
              accessibilityLabel={recorderState.isRecording ? t('memories.record_stop') : t('memories.record_start')}
              onPress={() => void (recorderState.isRecording ? stopRecording() : startRecording())}
              style={[styles.recordButton, { backgroundColor: recorderState.isRecording ? colors.danger : colors.primary }]}
            >
              <Ionicons name={recorderState.isRecording ? 'stop' : 'mic'} size={28} color={colors.onPrimary} />
            </Pressable>
            <AppText tone="secondary">
              {recorderState.isRecording
                ? t('memories.recording')
                : audioUri
                  ? '✓'
                  : t('memories.record_start')}
            </AppText>
          </View>
          {permissionError ? <AppText tone="danger">{t('memories.permission_denied')}</AppText> : null}
          <AppText variant="caption" tone="secondary">{t('memories.transcribe_hint')}</AppText>
        </Card>
      ) : null}

      <TextField
        label={t('memories.field_title')}
        placeholder={t('memories.field_title_placeholder')}
        value={title}
        onChangeText={setTitle}
        maxLength={140}
      />
      <TextField
        label={t('memories.field_date')}
        placeholder={t('memories.field_date_placeholder')}
        value={dateText}
        onChangeText={setDateText}
        keyboardType="numbers-and-punctuation"
      />
      <TextField
        label={isVoice ? t('memories.transcript_label') : t('memories.field_text')}
        placeholder={t('memories.field_text_placeholder')}
        value={text}
        onChangeText={setText}
        multiline
        numberOfLines={8}
        maxLength={8000}
        style={styles.textArea}
      />

      {error ? <AppText tone="danger">{error}</AppText> : null}
      <Button
        label={createMemory.isPending ? t('memories.saving') : t('memories.save')}
        onPress={() => void save()}
        loading={createMemory.isPending}
      />
      <Button label={t('common.cancel')} variant="ghost" onPress={() => router.back()} />
    </Screen>
  );
}

const styles = StyleSheet.create({
  recordRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.md, marginVertical: spacing.xs },
  recordButton: { width: 64, height: 64, borderRadius: radius.pill, alignItems: 'center', justifyContent: 'center' },
  textArea: { minHeight: 160, textAlignVertical: 'top' },
});
