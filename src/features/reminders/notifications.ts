import * as Device from 'expo-device';
import * as Notifications from 'expo-notifications';
import { Platform } from 'react-native';

import { NONE_REPEAT, notificationTimes, type RepeatRule } from '@/core/recurrence';
import type { Tables } from '@/lib/database.types';

/**
 * Notificaciones locales de recordatorios.
 *
 * Alcance de la fase: se programan avisos LOCALES (funcionan sin backend de
 * push). Para cada recordatorio se agenda una notificación por cada antelación
 * de la próxima ocurrencia. Las push remotas (Expo Push) requieren credenciales
 * de proyecto EAS y se añadirán en hardening (ver docs/17-known-limitations.md).
 *
 * El identificador de cada notificación se prefija con el id del recordatorio
 * para poder cancelarlas al editar/completar/borrar.
 */

Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowBanner: true,
    shouldShowList: true,
    shouldPlaySound: true,
    shouldSetBadge: false,
  }),
});

type Reminder = Tables<'reminders'>;

export async function ensureNotificationPermission(): Promise<boolean> {
  if (!Device.isDevice) return false; // los simuladores no entregan notificaciones locales fiables
  const { status } = await Notifications.getPermissionsAsync();
  if (status === 'granted') return true;
  const { status: asked } = await Notifications.requestPermissionsAsync();
  return asked === 'granted';
}

function idPrefix(reminderId: string): string {
  return `reminder:${reminderId}`;
}

/** Cancela todas las notificaciones programadas de un recordatorio. */
export async function cancelReminderNotifications(reminderId: string): Promise<void> {
  const scheduled = await Notifications.getAllScheduledNotificationsAsync();
  const prefix = idPrefix(reminderId);
  await Promise.all(
    scheduled
      .filter((n) => typeof n.content.data?.tag === 'string' && (n.content.data.tag as string).startsWith(prefix))
      .map((n) => Notifications.cancelScheduledNotificationAsync(n.identifier)),
  );
}

/**
 * (Re)programa las notificaciones locales de un recordatorio según su próxima
 * ocurrencia y sus antelaciones. Cancela primero las anteriores (idempotente).
 * No programa nada si el recordatorio no está pendiente o no hay permiso.
 */
export async function scheduleReminderNotifications(
  reminder: Reminder,
  petName?: string,
): Promise<void> {
  if (Platform.OS === 'web') return;
  await cancelReminderNotifications(reminder.id);
  if (reminder.status !== 'pending' && reminder.status !== 'snoozed') return;

  const granted = await ensureNotificationPermission();
  if (!granted) return;

  const rule: RepeatRule = {
    frequency: (reminder.repeat_frequency as RepeatRule['frequency']) ?? 'none',
    interval: reminder.repeat_interval ?? 1,
  };
  // Para recordatorios pospuestos usamos snoozed_until como instante base.
  const baseIso = reminder.snoozed_until ?? reminder.due_at;
  const times = notificationTimes(
    baseIso,
    reminder.snoozed_until ? [0] : reminder.lead_minutes ?? [60],
    new Date(),
  );

  const body = petName ? `${petName} · ${reminder.title}` : reminder.title;

  await Promise.all(
    times.map((iso, index) =>
      Notifications.scheduleNotificationAsync({
        content: {
          title: 'GUAU',
          body,
          data: { tag: `${idPrefix(reminder.id)}:${index}`, reminderId: reminder.id },
        },
        trigger: {
          type: Notifications.SchedulableTriggerInputTypes.DATE,
          date: new Date(iso),
        },
      }),
    ),
  );
  // `rule` se usará al expandir series largas en hardening; por ahora
  // programamos la próxima ocurrencia (evita saturar el planificador del SO).
  void (rule.frequency === NONE_REPEAT.frequency);
}
