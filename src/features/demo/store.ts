/**
 * GUAU · Modo prueba (demo).
 *
 * Almacén en memoria que permite recorrer toda la app SIN cuenta ni backend
 * real: nada se guarda en Supabase. Se activa con un flag persistido en
 * AsyncStorage (para que sobreviva a recargas) y se reinicia con datos semilla
 * en cada arranque de la app. Cada `api.ts` de feature comprueba `isDemo()` y,
 * en ese caso, opera contra este almacén en lugar de Supabase.
 *
 * IMPORTANTE: esto NO sustituye al producto real; es una vía de exploración.
 * El código de producción (Supabase, RLS, funciones) permanece intacto.
 */
import AsyncStorage from '@react-native-async-storage/async-storage';

import type { Tables } from '@/lib/database.types';

const DEMO_KEY = 'guau.demoMode';
export const DEMO_USER_ID = 'demo-user';
export const DEMO_PET_ID = '0a0a0a0a-0a0a-4a0a-8a0a-0a0a0a0a0a01';

type Pet = Tables<'pets'>;
type Reminder = Tables<'reminders'>;
type Activity = Tables<'activities'>;
type Streak = Tables<'streaks'>;
type Memory = Tables<'memories'>;
type MemoryVersion = Tables<'memory_versions'>;
type Product = Tables<'products'>;
type Entitlement = Tables<'entitlements'>;
type PawTx = Tables<'paw_ledger'>;

// --- flag + suscripción -------------------------------------------------
let demoEnabled = false;
const listeners = new Set<() => void>();

export function isDemo(): boolean {
  return demoEnabled;
}
/** Permite al AuthProvider reaccionar a los cambios de modo prueba. */
export function subscribeDemo(listener: () => void): () => void {
  listeners.add(listener);
  return () => listeners.delete(listener);
}
function notify(): void {
  listeners.forEach((l) => l());
}
export async function loadDemoFlag(): Promise<boolean> {
  demoEnabled = (await AsyncStorage.getItem(DEMO_KEY)) === '1';
  if (demoEnabled) seedIfEmpty();
  return demoEnabled;
}
export async function enableDemo(): Promise<void> {
  demoEnabled = true;
  reset();
  await AsyncStorage.setItem(DEMO_KEY, '1');
  notify();
}
export async function disableDemo(): Promise<void> {
  demoEnabled = false;
  await AsyncStorage.removeItem(DEMO_KEY);
  notify();
}

// --- helpers ------------------------------------------------------------
const nowIso = () => new Date().toISOString();
const daysFromNow = (n: number) => new Date(Date.now() + n * 86_400_000).toISOString();
const todayLocalDate = () => new Date().toISOString().slice(0, 10);
const uid = () => `demo-${Math.random().toString(36).slice(2, 11)}`;

// --- estado -------------------------------------------------------------
type DemoState = {
  pet: Pet | null;
  pawBalance: number;
  reminders: Reminder[];
  streak: Streak;
  todayCompleted: boolean;
  dailyActivityId: string | null;
  rewardGrants: { id: string; reward_id: string; status: string; granted_at: string; reward_definitions: { title_key: string; reward_type: string; amount: number | null } | null }[];
  memories: Memory[];
  memoryVersions: MemoryVersion[];
  ledger: PawTx[];
};

let state: DemoState = emptyState();

function emptyState(): DemoState {
  return {
    pet: null,
    pawBalance: 12,
    reminders: [],
    streak: { user_id: DEMO_USER_ID, current_count: 4, best_count: 6, last_completed_date: null, updated_at: nowIso() },
    todayCompleted: false,
    dailyActivityId: null,
    rewardGrants: [],
    memories: [],
    memoryVersions: [],
    ledger: [],
  };
}

// --- catálogo estático de demo -----------------------------------------
export const DEMO_ACTIVITIES: Activity[] = [
  activity('olfato-busca-premio', 'Busca el premio', 'play', 10, 1,
    'Estimular el olfato y la concentración de forma tranquila.',
    'Un juego de olfato en el que tu perro busca pequeñas recompensas escondidas.',
    ['5-8 premios pequeños'],
    ['Enseña un premio y deja que lo huela.', 'Esconde 2-3 premios a la vista.', 'Anímale con calma: «busca».', 'Sube la dificultad poco a poco.', 'Termina con premios fáciles.'],
    ['Mueve la cola con soltura', 'Olfatea con interés'],
    ['Se aleja o pierde interés', 'Jadea en exceso'],
    '¿Cómo de concentrado has visto a tu perro?', 'low'),
  activity('calma-manta-segura', 'La manta segura', 'calm', 8, 1,
    'Crear un lugar de calma asociado a algo positivo.',
    'Enseña a tu perro que una manta es su sitio de relax.',
    ['Una manta o colchoneta'],
    ['Deja la manta y premia el interés.', 'Premia si pone una pata.', 'Premia con calma si se tumba.', 'Asocia la palabra «calma».', 'Déjale descansar.'],
    ['Se tumba relajado', 'Respira despacio'],
    ['Se levanta inquieto', 'Evita la manta'],
    '¿Ha encontrado algo de calma en su manta?', 'low'),
  activity('confianza-toca-la-mano', 'Toca la mano', 'cooperation', 7, 1,
    'Reforzar la comunicación y la confianza.',
    'Tu perro aprende a tocar tu mano con el hocico.',
    ['Premios pequeños'],
    ['Ofrece la palma cerca del hocico.', 'Cuando la toque, di «sí» y premia.', 'Añade la palabra «toca».', 'Aleja un poco la mano.', 'Termina con éxitos fáciles.'],
    ['Se acerca con interés', 'Toca con suavidad'],
    ['Se agobia o se retira'],
    '¿Con qué ganas ha respondido a tu mano?', 'low'),
  activity('paseo-de-olfateo', 'Paseo de olfateo', 'play', 20, 1,
    'Un paseo centrado en oler, al ritmo del perro.',
    'Lo importante no es la distancia sino dejar que huela todo lo que quiera.',
    ['Correa larga (opcional)'],
    ['Sal sin objetivo de distancia.', 'Deja que marque el ritmo.', 'Afloja la correa cuando sea seguro.', 'Acompáñale con calma.', 'Vuelve cuando esté satisfecho.'],
    ['Olfatea con interés', 'Camina relajado'],
    ['Tira con ansiedad'],
    '¿Ha disfrutado explorando con el olfato?', 'medium'),
];

function activity(
  slug: string, title: string, category: Activity['category'], duration: number, difficulty: number,
  objective: string, description: string, materials: string[], steps: string[],
  comfort: string[], stop: string[], question: string, level: Activity['min_activity_level'],
): Activity {
  return {
    id: `demo-act-${slug}`,
    slug, title, objective, description, category,
    duration_min: duration, difficulty, materials,
    preparation: 'Elige un momento y un lugar tranquilos.',
    context: 'Mejor cuando tu perro esté receptivo.',
    steps, comfort_signals: comfort, stop_signals: stop,
    common_mistakes: ['Alargar demasiado la sesión', 'Repetir sin premiar'],
    precautions: 'Para si tu perro muestra incomodidad. Nunca fuerces.',
    expected_outcome: 'Un ratito positivo que refuerza vuestro vínculo.',
    closing_question: question, min_activity_level: level,
    review_status: 'pending_review', published: true,
    created_at: nowIso(), updated_at: nowIso(),
  };
}

const DEMO_PRODUCTS: Product[] = [
  product('pro_monthly', 'subscription', 'products.proMonthly', null, 1995, 1995, 'month', 1),
  product('pro_annual', 'subscription', 'products.proAnnual', null, 23940, 16595, 'year', 2),
  product('paw_pack_25', 'paw_pack', 'products.pawPack25', 25, 2500, 1750, null, 10),
  product('paw_pack_50', 'paw_pack', 'products.pawPack50', 50, 5000, 3500, null, 11),
  product('paw_pack_100', 'paw_pack', 'products.pawPack100', 100, 10000, 7000, null, 12),
  product('paw_custom', 'paw_custom', 'products.pawCustom', null, 100, 100, null, 20),
];
function product(
  id: string, kind: string, title_key: string, paws: number | null,
  base: number, final: number, period: string | null, sort: number,
): Product {
  return {
    id, kind, title_key, paws, base_price_cents: base, final_price_cents: final,
    currency: 'EUR', billing_period: period, active: true, sort_order: sort, updated_at: nowIso(),
  };
}

// --- seed ---------------------------------------------------------------
export function reset(): void {
  state = emptyState();
  // Perro de ejemplo ya creado (se puede editar; el onboarding queda cubierto
  // por la edición del perfil). Para probar el onboarding desde cero, usa
  // "Rehacer onboarding" en Ajustes (borra el perro demo).
  state.pet = {
    id: DEMO_PET_ID, owner_id: DEMO_USER_ID, species: 'dog', name: 'Luna',
    photo_path: null, birth_date: '2022-05-10', birth_date_is_approx: false,
    sex: 'female', breed: 'Border collie', is_mixed_breed: false, weight_kg: 17.5,
    reproductive_status: 'neutered', activity_level: 'high', notes: null,
    is_primary: true, deleted_at: null, created_at: nowIso(), updated_at: nowIso(),
  };
  state.reminders = [
    reminder('Paseo largo por el parque', 'walk', daysFromNow(0.1), 'normal'),
    reminder('Vacuna anual', 'vaccine', daysFromNow(6), 'high', 'yearly'),
    reminder('Comprar pienso', 'food_purchase', daysFromNow(2), 'normal'),
    reminder('Revisión veterinaria', 'vet_appointment', daysFromNow(14), 'normal'),
  ];
  state.dailyActivityId = DEMO_ACTIVITIES[0].id;
  state.rewardGrants = [
    { id: uid(), reward_id: 'streak_3', status: 'claimed', granted_at: daysFromNow(-1),
      reward_definitions: { title_key: 'rewards.streak_3', reward_type: 'paws', amount: 1 } },
  ];
  state.ledger = [
    ledgerRow('reward', 1, 11, 12, 'reward:streak_3'),
    ledgerRow('adjustment', 11, 0, 11, 'demo:bienvenida'),
  ];
  state.memories = [
    memory('El primer baño en el río', 'text',
      'Hoy Luna se metió por primera vez en el río. Al principio dudó, pero al ver que yo estaba cerca se lanzó y no paraba de mover la cola. Volvió empapada y feliz.', '2026-06-15'),
    memory('Aprendió a dar la pata', 'voice',
      'Después de varios días practicando, hoy Luna dio la pata a la primera. Se la ve muy orgullosa.', '2026-06-28'),
  ];
}

function reminder(title: string, category: Reminder['category'], due: string, priority: Reminder['priority'], repeat: string = 'none'): Reminder {
  return {
    id: uid(), owner_id: DEMO_USER_ID, pet_id: DEMO_PET_ID, title, description: null,
    category, due_at: due, timezone: 'Europe/Madrid', all_day: false,
    repeat_frequency: repeat, repeat_interval: 1, lead_minutes: [1440, 60], priority,
    notes: null, source: 'manual', related_health_field_id: null, status: 'pending',
    completed_at: null, snoozed_until: null, created_at: nowIso(), updated_at: nowIso(),
  };
}

function memory(title: string, kind: string, text: string, on: string): Memory {
  return {
    id: uid(), owner_id: DEMO_USER_ID, pet_id: DEMO_PET_ID, title,
    experienced_on: on, input_kind: kind, original_text: text,
    original_transcript: kind === 'voice' ? text : null, audio_path: null,
    created_at: nowIso(), updated_at: nowIso(), deleted_at: null,
  };
}

function ledgerRow(kind: PawTx['kind'], delta: number, before: number, after: number, reason: string): PawTx {
  return {
    id: uid(), user_id: DEMO_USER_ID, kind, delta, balance_before: before, balance_after: after,
    reason, operation: null, related_entity: null, purchase_ref: null,
    idempotency_key: uid(), status: 'completed', meta: null, created_at: nowIso(),
  };
}

function seedIfEmpty(): void {
  if (state.pet === null && state.reminders.length === 0) reset();
}

// --- API del almacén (usada por los hooks branch isDemo) ----------------
export const demoStore = {
  // pets
  getPrimaryPet: (): Pet | null => state.pet,
  createPet: (input: Partial<Pet>): Pet => {
    state.pet = {
      id: DEMO_PET_ID, owner_id: DEMO_USER_ID, species: 'dog',
      name: input.name ?? 'Mi perro', photo_path: null,
      birth_date: input.birth_date ?? null, birth_date_is_approx: input.birth_date_is_approx ?? false,
      sex: input.sex ?? 'unknown', breed: input.breed ?? null, is_mixed_breed: input.is_mixed_breed ?? false,
      weight_kg: input.weight_kg ?? null, reproductive_status: input.reproductive_status ?? 'unknown',
      activity_level: input.activity_level ?? 'unknown', notes: null, is_primary: true,
      deleted_at: null, created_at: nowIso(), updated_at: nowIso(),
    };
    return state.pet;
  },
  updatePet: (input: Partial<Pet>): Pet => {
    state.pet = { ...(state.pet as Pet), ...input, updated_at: nowIso() };
    return state.pet;
  },
  setPetPhoto: (uri: string): Pet => {
    state.pet = { ...(state.pet as Pet), photo_path: uri, updated_at: nowIso() };
    return state.pet;
  },
  resetOnboarding: (): void => {
    state.pet = null;
  },

  // config
  pawBalance: (): number => state.pawBalance,
  featureFlags: (): Record<string, boolean> => ({
    calendar: true, activities: true, streaks_rewards: true, memories: true, paywall: true,
    scanner_physical: false, scanner_food: false, scanner_booklet: false, chat: false,
  }),

  // reminders
  reminders: (): Reminder[] => state.reminders.filter((r) => r.status !== 'cancelled'),
  addReminder: (r: Partial<Reminder>): Reminder => {
    const row = reminder(r.title ?? 'Recordatorio', r.category ?? 'custom', r.due_at ?? daysFromNow(1), r.priority ?? 'normal', r.repeat_frequency ?? 'none');
    Object.assign(row, r, { id: uid() });
    state.reminders.unshift(row);
    return row;
  },
  updateReminder: (id: string, r: Partial<Reminder>): Reminder => {
    const idx = state.reminders.findIndex((x) => x.id === id);
    state.reminders[idx] = { ...state.reminders[idx], ...r, updated_at: nowIso() };
    return state.reminders[idx];
  },
  setReminderStatus: (id: string, status: Reminder['status'], extra: Partial<Reminder> = {}): void => {
    const idx = state.reminders.findIndex((x) => x.id === id);
    if (idx >= 0) state.reminders[idx] = { ...state.reminders[idx], status, ...extra, updated_at: nowIso() };
  },

  // activities / streak / rewards
  activities: (): Activity[] => DEMO_ACTIVITIES,
  streak: (): Streak => state.streak,
  todayCompleted: (): boolean => state.todayCompleted,
  dailyActivity: (): Activity | null =>
    DEMO_ACTIVITIES.find((a) => a.id === state.dailyActivityId) ?? DEMO_ACTIVITIES[0],
  changeDaily: (): Activity => {
    const others = DEMO_ACTIVITIES.filter((a) => a.id !== state.dailyActivityId);
    const next = others[Math.floor(Math.random() * others.length)] ?? DEMO_ACTIVITIES[0];
    state.dailyActivityId = next.id;
    return next;
  },
  completeDaily: (): Streak => {
    if (state.todayCompleted) return state.streak;
    state.todayCompleted = true;
    const current = state.streak.current_count + 1;
    state.streak = {
      ...state.streak, current_count: current,
      best_count: Math.max(state.streak.best_count, current),
      last_completed_date: todayLocalDate(), updated_at: nowIso(),
    };
    // Recompensa de hito en demo (7 días → +2 Huellas), sin duplicar.
    const milestones: Record<number, { id: string; amount: number; key: string }> = {
      7: { id: 'streak_7', amount: 2, key: 'rewards.streak_7' },
      14: { id: 'streak_14', amount: 3, key: 'rewards.streak_14' },
      30: { id: 'streak_30', amount: 5, key: 'rewards.streak_30' },
    };
    const m = milestones[current];
    if (m && !state.rewardGrants.some((g) => g.reward_id === m.id)) {
      state.rewardGrants.unshift({ id: uid(), reward_id: m.id, status: 'claimed', granted_at: nowIso(),
        reward_definitions: { title_key: m.key, reward_type: 'paws', amount: m.amount } });
      const before = state.pawBalance;
      state.pawBalance += m.amount;
      state.ledger.unshift(ledgerRow('reward', m.amount, before, state.pawBalance, `reward:${m.id}`));
    }
    return state.streak;
  },
  rewardGrants: () => state.rewardGrants,

  // memories
  memories: (): Memory[] => state.memories.filter((m) => m.deleted_at === null),
  memory: (id: string) => ({
    memory: state.memories.find((m) => m.id === id) ?? null,
    versions: state.memoryVersions.filter((v) => v.memory_id === id).sort((a, b) => b.version - a.version),
  }),
  addMemory: (input: { title: string | null; originalText: string; experiencedOn: string | null; inputKind: string; originalTranscript?: string | null; audioUri?: string | null }): Memory => {
    const row: Memory = {
      id: uid(), owner_id: DEMO_USER_ID, pet_id: state.pet?.id ?? null, title: input.title,
      experienced_on: input.experiencedOn, input_kind: input.inputKind,
      original_text: input.originalText, original_transcript: input.originalTranscript ?? null,
      audio_path: input.audioUri ?? null, created_at: nowIso(), updated_at: nowIso(), deleted_at: null,
    };
    state.memories.unshift(row);
    return row;
  },
  addMemoryVersion: (memoryId: string, content: string): MemoryVersion => {
    const existing = state.memoryVersions.filter((v) => v.memory_id === memoryId);
    const row: MemoryVersion = {
      id: uid(), memory_id: memoryId, owner_id: DEMO_USER_ID,
      version: existing.length + 1, content, produced_by: 'manual', created_at: nowIso(),
    };
    state.memoryVersions.push(row);
    return row;
  },
  deleteMemory: (id: string): void => {
    const idx = state.memories.findIndex((m) => m.id === id);
    if (idx >= 0) state.memories[idx] = { ...state.memories[idx], deleted_at: nowIso() };
  },

  // billing
  products: (): Product[] => DEMO_PRODUCTS,
  entitlement: (): Entitlement => ({
    user_id: DEMO_USER_ID, plan: 'free', status: 'active', current_period_end: null,
    source: 'default', updated_at: nowIso(),
  }),
  ledger: (): PawTx[] => state.ledger,
};
