import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

import { advance, type RepeatRule } from '@/core/recurrence';
import { reminderInputSchema, type ReminderInput } from '@/core/reminderSchema';
import { track } from '@/lib/analytics';
import type { Tables } from '@/lib/database.types';
import { supabase } from '@/lib/supabase';
import {
  cancelReminderNotifications,
  scheduleReminderNotifications,
} from '@/features/reminders/notifications';

export type Reminder = Tables<'reminders'>;

const LIST_KEY = ['reminders'] as const;

/** Recordatorios activos (no cancelados) ordenados por fecha. */
export function useReminders() {
  return useQuery({
    queryKey: LIST_KEY,
    queryFn: async (): Promise<Reminder[]> => {
      const { data, error } = await supabase
        .from('reminders')
        .select('*')
        .neq('status', 'cancelled')
        .order('due_at', { ascending: true });
      if (error) throw error;
      return data;
    },
  });
}

export function useCreateReminder() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (input: ReminderInput): Promise<Reminder> => {
      const parsed = reminderInputSchema.parse(input);
      const { data: userData, error: userError } = await supabase.auth.getUser();
      if (userError || !userData.user) throw userError ?? new Error('not_authenticated');

      const { data, error } = await supabase
        .from('reminders')
        .insert({ ...parsed, owner_id: userData.user.id, source: 'manual' })
        .select()
        .single();
      if (error) throw error;

      await scheduleReminderNotifications(data);
      track('reminder_created', { category: data.category, repeats: data.repeat_frequency !== 'none' });
      return data;
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: LIST_KEY }),
  });
}

export function useUpdateReminder() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, input }: { id: string; input: ReminderInput }): Promise<Reminder> => {
      const parsed = reminderInputSchema.parse(input);
      const { data, error } = await supabase
        .from('reminders')
        .update(parsed)
        .eq('id', id)
        .select()
        .single();
      if (error) throw error;
      await scheduleReminderNotifications(data);
      track('reminder_updated');
      return data;
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: LIST_KEY }),
  });
}

/**
 * Completa un recordatorio. Si es recurrente, además crea la siguiente
 * ocurrencia (nuevo `due_at`) para que la serie continúe; el completado marca
 * la instancia actual.
 */
export function useCompleteReminder() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (reminder: Reminder): Promise<void> => {
      const { error } = await supabase
        .from('reminders')
        .update({ status: 'completed', completed_at: new Date().toISOString() })
        .eq('id', reminder.id);
      if (error) throw error;
      await cancelReminderNotifications(reminder.id);
      track('reminder_completed', { category: reminder.category });

      if (reminder.repeat_frequency !== 'none') {
        const rule: RepeatRule = {
          frequency: reminder.repeat_frequency as RepeatRule['frequency'],
          interval: reminder.repeat_interval,
        };
        const nextDue = advance(reminder.due_at, rule);
        const { data: userData } = await supabase.auth.getUser();
        if (userData.user) {
          const { data: created, error: insertError } = await supabase
            .from('reminders')
            .insert({
              owner_id: userData.user.id,
              pet_id: reminder.pet_id,
              title: reminder.title,
              description: reminder.description,
              category: reminder.category,
              due_at: nextDue,
              timezone: reminder.timezone,
              all_day: reminder.all_day,
              repeat_frequency: reminder.repeat_frequency,
              repeat_interval: reminder.repeat_interval,
              lead_minutes: reminder.lead_minutes,
              priority: reminder.priority,
              notes: reminder.notes,
              source: 'manual',
            })
            .select()
            .single();
          if (!insertError && created) await scheduleReminderNotifications(created);
        }
      }
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: LIST_KEY }),
  });
}

/** Pospone un recordatorio un número de minutos (aviso único al vencer el snooze). */
export function useSnoozeReminder() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ reminder, minutes }: { reminder: Reminder; minutes: number }): Promise<void> => {
      const until = new Date(Date.now() + minutes * 60_000).toISOString();
      const { data, error } = await supabase
        .from('reminders')
        .update({ status: 'snoozed', snoozed_until: until })
        .eq('id', reminder.id)
        .select()
        .single();
      if (error) throw error;
      await scheduleReminderNotifications(data);
      track('reminder_snoozed', { minutes });
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: LIST_KEY }),
  });
}

export function useDeleteReminder() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (reminder: Reminder): Promise<void> => {
      // Cancelación lógica: preserva historial. RLS permite el update al dueño.
      const { error } = await supabase
        .from('reminders')
        .update({ status: 'cancelled' })
        .eq('id', reminder.id);
      if (error) throw error;
      await cancelReminderNotifications(reminder.id);
      track('reminder_deleted');
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: LIST_KEY }),
  });
}
