/**
 * GUAU · Configuración del personaje virtual (personalización).
 *
 * El personaje "Toba" es una criatura-huella original que acompaña al usuario.
 * Aquí vive su personalización: nombre, color y accesorio. Se guarda en el
 * dispositivo (AsyncStorage) para que funcione igual en modo prueba y con cuenta
 * real; en el futuro puede sincronizarse a servidor. Un pequeño pub-sub permite
 * que todas las instancias del personaje se actualicen en vivo al cambiarlo.
 */
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useEffect, useState } from 'react';

const KEY = 'guau.mascotConfig';

export type MascotVariant = 'terracotta' | 'teal' | 'violet' | 'honey' | 'sky' | 'forest';
export type MascotAccessory = 'none' | 'collar' | 'bandana' | 'cap' | 'flower' | 'glasses';

export type MascotConfig = {
  name: string;
  variant: MascotVariant;
  accessory: MascotAccessory;
};

export const DEFAULT_MASCOT: MascotConfig = {
  name: 'Toba',
  variant: 'terracotta',
  accessory: 'collar',
};

/** Paletas del personaje (cuerpo, barriga, detalle). */
export const MASCOT_VARIANTS: Record<MascotVariant, { body: string; belly: string; detail: string; label: string }> = {
  terracotta: { body: '#C2512F', belly: '#F6E0D6', detail: '#8A3418', label: 'Terracota' },
  teal: { body: '#2E7E78', belly: '#D9EAE8', detail: '#1C534E', label: 'Verde mar' },
  violet: { body: '#6C5CE7', belly: '#E6E1FB', detail: '#4A3FB0', label: 'Violeta' },
  honey: { body: '#D99A2B', belly: '#F8ECCD', detail: '#9A6A14', label: 'Miel' },
  sky: { body: '#3E86C7', belly: '#DCEAF6', detail: '#2A5E8E', label: 'Cielo' },
  forest: { body: '#4E8A5B', belly: '#DCEEE0', detail: '#356140', label: 'Bosque' },
};

export const MASCOT_ACCESSORIES: { key: MascotAccessory; label: string; emoji: string }[] = [
  { key: 'none', label: 'Sin accesorio', emoji: '🚫' },
  { key: 'collar', label: 'Collar', emoji: '🦴' },
  { key: 'bandana', label: 'Pañuelo', emoji: '🧣' },
  { key: 'cap', label: 'Gorra', emoji: '🧢' },
  { key: 'flower', label: 'Flor', emoji: '🌼' },
  { key: 'glasses', label: 'Gafas', emoji: '🤓' },
];

export const MASCOT_NAME_SUGGESTIONS = ['Toba', 'Uma', 'Kiro', 'Palo', 'Nube', 'Río'];

// --- estado + pub-sub ---------------------------------------------------
let current: MascotConfig = { ...DEFAULT_MASCOT };
let loaded = false;
const listeners = new Set<() => void>();

function notify() {
  listeners.forEach((l) => l());
}

export function getMascotConfig(): MascotConfig {
  return current;
}

export async function loadMascotConfig(): Promise<MascotConfig> {
  try {
    const raw = await AsyncStorage.getItem(KEY);
    if (raw) current = { ...DEFAULT_MASCOT, ...(JSON.parse(raw) as Partial<MascotConfig>) };
  } catch {
    // ignora: usa el valor por defecto
  }
  loaded = true;
  notify();
  return current;
}

export async function saveMascotConfig(next: MascotConfig): Promise<void> {
  current = next;
  notify();
  try {
    await AsyncStorage.setItem(KEY, JSON.stringify(next));
  } catch {
    // silencioso
  }
}

export function randomizeMascot(name: string): MascotConfig {
  const variants = Object.keys(MASCOT_VARIANTS) as MascotVariant[];
  const accessories = MASCOT_ACCESSORIES.filter((a) => a.key !== 'none').map((a) => a.key);
  return {
    name,
    variant: variants[Math.floor(Math.random() * variants.length)],
    accessory: accessories[Math.floor(Math.random() * accessories.length)],
  };
}

/** Hook reactivo: devuelve la config actual y se actualiza al cambiarla. */
export function useMascotConfig(): MascotConfig {
  const [config, setConfig] = useState<MascotConfig>(current);
  useEffect(() => {
    const update = () => setConfig({ ...current });
    listeners.add(update);
    if (!loaded) void loadMascotConfig();
    else update();
    return () => {
      listeners.delete(update);
    };
  }, []);
  return config;
}
