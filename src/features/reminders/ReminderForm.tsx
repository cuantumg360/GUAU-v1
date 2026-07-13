import { useRouter } from 'expo-router';
import { useState } from 'react';
import { StyleSheet, View } from 'react-native';
import { useTranslation } from 'react-i18next';

import { formatDate, formatTime, toDueAtIso } from '@/core/datetime';
import { repeatFrequencies } from '@/core/recurrence';
import {
  LEAD_PRESETS,
  normalizeLeadMinutes,
  reminderCategories,
  reminderInputSchema,
  reminderPriorities,
  type ReminderInput,
} from '@/core/reminderSchema';
import { AppText } from '@/design/components/AppText';
import { Button } from '@/design/components/Button';
import { OptionChip } from '@/design/components/OptionChip';
import { Screen } from '@/design/components/Screen';
import { TextField } from '@/design/components/TextField';
import { spacing } from '@/design/tokens';
import { usePrimaryPet } from '@/features/pets/api';
import { useCreateReminder, useUpdateReminder, type Reminder } from '@/features/reminders/api';

const DEFAULT_TZ = 'Europe/Madrid';

type Props = { existing?: Reminder };

/** Formulario compartido por crear (/reminder/new) y editar (/reminder/[id]). */
export function ReminderForm({ existing }: Props) {
  const { t } = useTranslation();
  const router = useRouter();
  const petQuery = usePrimaryPet();
  const createReminder = useCreateReminder();
  const updateReminder = useUpdateReminder();

  const tz = existing?.timezone ?? DEFAULT_TZ;
  const [title, setTitle] = useState(existing?.title ?? '');
  const [category, setCategory] = useState<ReminderInput['category']>(existing?.category ?? 'vet_appointment');
  const [dateText, setDateText] = useState(existing ? formatDate(existing.due_at, tz) : '');
  const [timeText, setTimeText] = useState(existing ? formatTime(existing.due_at, tz) : '09:00');
  const [repeat, setRepeat] = useState<ReminderInput['repeat_frequency']>(existing?.repeat_frequency as ReminderInput['repeat_frequency'] ?? 'none');
  const [interval, setInterval] = useState(String(existing?.repeat_interval ?? 1));
  const [leads, setLeads] = useState<number[]>(existing?.lead_minutes ?? [1440]);
  const [priority, setPriority] = useState<ReminderInput['priority']>(existing?.priority ?? 'normal');
  const [notes, setNotes] = useState(existing?.notes ?? '');
  const [linkPet, setLinkPet] = useState(existing ? existing.pet_id !== null : true);
  const [error, setError] = useState<string | null>(null);

  const busy = createReminder.isPending || updateReminder.isPending;

  const toggleLead = (minutes: number) => {
    setLeads((prev) =>
      prev.includes(minutes) ? prev.filter((m) => m !== minutes) : [...prev, minutes].slice(0, 5),
    );
  };

  const submit = async () => {
    setError(null);
    if (title.trim().length === 0) {
      setError(t('reminders.error_title'));
      return;
    }
    const dueIso = toDueAtIso(dateText, timeText, tz);
    if (!dueIso || new Date(dueIso).getTime() <= Date.now()) {
      setError(t('reminders.error_datetime'));
      return;
    }
    const petId = linkPet ? petQuery.data?.id ?? null : null;
    const input: ReminderInput = {
      title: title.trim(),
      description: null,
      category,
      pet_id: petId,
      due_at: dueIso,
      timezone: tz,
      all_day: false,
      repeat_frequency: repeat,
      repeat_interval: Math.min(365, Math.max(1, Number(interval) || 1)),
      lead_minutes: normalizeLeadMinutes(leads),
      priority,
      notes: notes.trim() === '' ? null : notes.trim(),
    };
    const parsed = reminderInputSchema.safeParse(input);
    if (!parsed.success) {
      setError(t('common.error_generic'));
      return;
    }
    try {
      if (existing) {
        await updateReminder.mutateAsync({ id: existing.id, input: parsed.data });
      } else {
        await createReminder.mutateAsync(parsed.data);
      }
      router.back();
    } catch {
      setError(t('common.error_generic'));
    }
  };

  return (
    <Screen>
      <AppText variant="display">{existing ? t('reminders.edit_title') : t('reminders.new_title')}</AppText>

      <TextField
        label={t('reminders.field_title')}
        placeholder={t('reminders.field_title_placeholder')}
        value={title}
        onChangeText={setTitle}
        maxLength={120}
      />

      <View style={styles.block}>
        <AppText variant="label" tone="secondary">{t('reminders.field_category')}</AppText>
        <View style={styles.chips}>
          {reminderCategories.map((c) => (
            <OptionChip key={c} label={t(`reminders.cat_${c}`)} selected={category === c} onPress={() => setCategory(c)} />
          ))}
        </View>
      </View>

      {petQuery.data ? (
        <View style={styles.chips}>
          <OptionChip
            label={petQuery.data.name}
            selected={linkPet}
            onPress={() => setLinkPet(true)}
          />
          <OptionChip label={t('reminders.field_no_pet')} selected={!linkPet} onPress={() => setLinkPet(false)} />
        </View>
      ) : null}

      <View style={styles.row}>
        <View style={styles.flex}>
          <TextField
            label={t('reminders.field_date')}
            placeholder={t('reminders.field_date_placeholder')}
            value={dateText}
            onChangeText={setDateText}
            keyboardType="numbers-and-punctuation"
          />
        </View>
        <View style={styles.timeField}>
          <TextField
            label={t('reminders.field_time')}
            placeholder={t('reminders.field_time_placeholder')}
            value={timeText}
            onChangeText={setTimeText}
            keyboardType="numbers-and-punctuation"
          />
        </View>
      </View>

      <View style={styles.block}>
        <AppText variant="label" tone="secondary">{t('reminders.field_repeat')}</AppText>
        <View style={styles.chips}>
          {repeatFrequencies.map((f) => (
            <OptionChip
              key={f}
              label={f === 'none' ? t('reminders.repeat_none') : t(`reminders.repeat_${f}`)}
              selected={repeat === f}
              onPress={() => setRepeat(f)}
            />
          ))}
        </View>
        {repeat !== 'none' ? (
          <View style={styles.intervalRow}>
            <AppText tone="secondary">{t('reminders.field_repeat_interval')}</AppText>
            <View style={styles.intervalField}>
              <TextField value={interval} onChangeText={setInterval} keyboardType="number-pad" />
            </View>
            <AppText tone="secondary">{t(`reminders.repeat_${repeat}`)}</AppText>
          </View>
        ) : null}
      </View>

      <View style={styles.block}>
        <AppText variant="label" tone="secondary">{t('reminders.field_lead')}</AppText>
        <View style={styles.chips}>
          {LEAD_PRESETS.map((p) => (
            <OptionChip key={p.minutes} label={t(p.labelKey)} selected={leads.includes(p.minutes)} onPress={() => toggleLead(p.minutes)} />
          ))}
        </View>
      </View>

      <View style={styles.block}>
        <AppText variant="label" tone="secondary">{t('reminders.field_priority')}</AppText>
        <View style={styles.chips}>
          {reminderPriorities.map((p) => (
            <OptionChip key={p} label={t(`reminders.priority_${p}`)} selected={priority === p} onPress={() => setPriority(p)} />
          ))}
        </View>
      </View>

      <TextField
        label={t('reminders.field_notes')}
        value={notes}
        onChangeText={setNotes}
        multiline
        numberOfLines={3}
        maxLength={1000}
      />

      <AppText variant="caption" tone="secondary">{t('reminders.permission_note')}</AppText>
      {error ? <AppText tone="danger">{error}</AppText> : null}

      <Button label={t('common.save')} onPress={() => void submit()} loading={busy} />
      <Button label={t('common.cancel')} variant="ghost" onPress={() => router.back()} />
    </Screen>
  );
}

const styles = StyleSheet.create({
  block: { gap: spacing.xs },
  chips: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.xs },
  row: { flexDirection: 'row', gap: spacing.sm },
  flex: { flex: 2 },
  timeField: { flex: 1 },
  intervalRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm },
  intervalField: { width: 72 },
});
