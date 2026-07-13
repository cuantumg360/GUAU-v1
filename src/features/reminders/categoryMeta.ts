import type { ComponentProps } from 'react';
import type { Ionicons } from '@expo/vector-icons';

import type { ReminderCategory } from '@/core/reminderSchema';

type IoniconName = ComponentProps<typeof Ionicons>['name'];

/**
 * Metadatos de presentación por categoría de recordatorio. La categoría
 * `medication` y las sanitarias se muestran con tono sobrio (health) según la
 * política del modo sanitario.
 */
export const categoryMeta: Record<ReminderCategory, { icon: IoniconName; health: boolean }> = {
  vet_appointment: { icon: 'medkit-outline', health: true },
  vaccine: { icon: 'shield-checkmark-outline', health: true },
  deworming: { icon: 'bug-outline', health: true },
  medication: { icon: 'medical-outline', health: true },
  food_purchase: { icon: 'cart-outline', health: false },
  grooming: { icon: 'cut-outline', health: false },
  bath: { icon: 'water-outline', health: false },
  training: { icon: 'ribbon-outline', health: false },
  activity: { icon: 'paw-outline', health: false },
  trip: { icon: 'airplane-outline', health: false },
  walk: { icon: 'footsteps-outline', health: false },
  custom: { icon: 'ellipse-outline', health: false },
};
