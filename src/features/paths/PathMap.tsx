import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { useRouter } from 'expo-router';
import { useEffect, useState } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';
import Animated, {
  Easing,
  useAnimatedStyle,
  useReducedMotion,
  useSharedValue,
  withRepeat,
  withSequence,
  withTiming,
} from 'react-native-reanimated';
import { useTranslation } from 'react-i18next';

import { AppText } from '@/design/components/AppText';
import { useTheme } from '@/design/ThemeContext';
import { motion, radius, spacing } from '@/design/tokens';
import { Mascot } from '@/features/character/Mascot';
import { useMascotConfig } from '@/features/character/mascotConfig';
import {
  PHASE_ICONS,
  PHASE_ORDER,
  pathsOfWorld,
  worldTint,
  type PathDef,
  type WorldId,
} from '@/features/paths/pathsData';
import {
  isPathUnlocked,
  phasesDone,
  type PathsProgress,
} from '@/features/paths/progress';

/**
 * Mapa serpenteante del mundo activo: el sendero de un paseo.
 *
 * Reinterpretación GUAU del patrón de mapa de progreso (referencias del
 * fundador, docs/01-founder-references.md): los nodos son almohadillas-huella
 * unidas por pequeñas pisadas, cada camino termina en un HUESO con la
 * recompensa visible por adelantado, y Toba espera junto al siguiente paso.
 * No se copia composición, iconografía ni identidad de ninguna app.
 */

const ROW_H = 92;
const NODE = 60;
/** Desplazamientos laterales del sendero (ida y vuelta, como un paseo). */
const SERPENTINE = [0, 0.72, 1, 0.72, 0, -0.72, -1, -0.72];

type MapItem =
  | { kind: 'header'; path: PathDef; done: number; completed: boolean }
  | { kind: 'phase'; path: PathDef; phaseIndex: number; nodeIndex: number }
  | { kind: 'bone'; path: PathDef; nodeIndex: number };

function buildItems(world: WorldId, progress: PathsProgress | undefined): MapItem[] {
  const items: MapItem[] = [];
  let nodeIndex = 0;
  for (const path of pathsOfWorld(world)) {
    const done = phasesDone(progress, path.id);
    items.push({ kind: 'header', path, done, completed: done >= PHASE_ORDER.length });
    for (let i = 0; i < PHASE_ORDER.length; i += 1) {
      items.push({ kind: 'phase', path, phaseIndex: i, nodeIndex });
      nodeIndex += 1;
    }
    items.push({ kind: 'bone', path, nodeIndex });
    nodeIndex += 1;
  }
  return items;
}

type Props = {
  world: WorldId;
  progress: PathsProgress | undefined;
  /** Tocar a Toba en el mapa abre su menú contextual (personaje interactivo). */
  onMascotPress?: () => void;
};

export function PathMap({ world, progress, onMascotPress }: Props) {
  const { t } = useTranslation();
  const { colors, isDark } = useTheme();
  const router = useRouter();
  const mascot = useMascotConfig();
  const [width, setWidth] = useState(0);

  const tint = worldTint(world, isDark);
  const items = buildItems(world, progress);
  const amplitude = Math.max(0, width / 2 - NODE / 2 - spacing.md);
  const center = width / 2;

  const xOf = (nodeIndex: number) => center + SERPENTINE[nodeIndex % SERPENTINE.length] * amplitude;
  const yOf = (row: number) => row * ROW_H + ROW_H / 2;

  // Nodo activo del mundo: primera fase pendiente de un camino desbloqueado.
  let activeRow = -1;
  let activeX = center;
  items.forEach((item, row) => {
    if (activeRow >= 0 || item.kind !== 'phase') return;
    const done = phasesDone(progress, item.path.id);
    if (item.phaseIndex === done && isPathUnlocked(progress, item.path)) {
      activeRow = row;
      activeX = xOf(item.nodeIndex);
    }
  });

  const open = (path: PathDef) => {
    void Haptics.selectionAsync();
    router.push(`/path/${path.id}`);
  };

  return (
    <View
      onLayout={(e) => setWidth(e.nativeEvent.layout.width)}
      style={{ height: items.length * ROW_H + spacing.lg }}
      accessibilityLabel={t('paths.map_a11y')}
    >
      {width === 0
        ? null
        : items.map((item, row) => {
            if (item.kind === 'header') {
              return (
                <CaminoHeader
                  key={`h-${item.path.id}`}
                  y={yOf(row)}
                  path={item.path}
                  completed={item.completed}
                  tintMain={tint.main}
                  onPress={() => open(item.path)}
                />
              );
            }

            const x = xOf(item.nodeIndex);
            const y = yOf(row);
            const next = items[row + 1];
            const connector =
              next && next.kind !== 'header' ? (
                <Connector
                  key={`c-${row}`}
                  from={{ x, y }}
                  to={{ x: xOf(next.nodeIndex), y: yOf(row + 1) }}
                  color={
                    phasesDone(progress, item.path.id) >
                    (item.kind === 'phase' ? item.phaseIndex : PHASE_ORDER.length - 1)
                      ? tint.main
                      : colors.border
                  }
                />
              ) : null;

            if (item.kind === 'bone') {
              const earned = phasesDone(progress, item.path.id) >= PHASE_ORDER.length;
              return (
                <View key={`b-${item.path.id}`}>
                  {connector}
                  <BoneNode
                    x={x}
                    y={y}
                    earned={earned}
                    tintMain={tint.main}
                    tintSoft={tint.soft}
                    rewardLabel={t(item.path.reward.titleKey)}
                    onPress={() => open(item.path)}
                  />
                </View>
              );
            }

            const done = phasesDone(progress, item.path.id);
            const unlocked = isPathUnlocked(progress, item.path);
            const state: NodeState =
              item.phaseIndex < done ? 'completed' : item.phaseIndex === done && unlocked ? 'active' : 'locked';
            return (
              <View key={`p-${item.path.id}-${item.phaseIndex}`}>
                {connector}
                <PhaseNode
                  x={x}
                  y={y}
                  state={state}
                  phaseIndex={item.phaseIndex}
                  path={item.path}
                  tintMain={tint.main}
                  tintSoft={tint.soft}
                  onPress={() => open(item.path)}
                />
              </View>
            );
          })}

      {/* Toba espera junto al siguiente paso (no se queda quieto en cada nivel). */}
      {width > 0 && activeRow >= 0 ? (
        <Pressable
          accessibilityRole="button"
          accessibilityLabel={t('character.open_menu', { mascot: mascot.name })}
          disabled={!onMascotPress}
          onPress={() => {
            void Haptics.selectionAsync();
            onMascotPress?.();
          }}
          style={({ pressed }) => ({
            position: 'absolute',
            top: yOf(activeRow) - 40,
            // Al lado contrario del nodo; si el nodo cae centrado, a su derecha.
            left: Math.min(
              Math.max(
                (Math.abs(activeX - center) < NODE ? activeX + NODE + 14 : center - (activeX - center)) - 34,
                spacing.xs,
              ),
              width - 76,
            ),
            transform: [{ scale: pressed ? 0.94 : 1 }],
          })}
        >
          <Mascot state="attentive" size={68} />
        </Pressable>
      ) : null}
    </View>
  );
}

type NodeState = 'completed' | 'active' | 'locked';

function PhaseNode({
  x,
  y,
  state,
  phaseIndex,
  path,
  tintMain,
  tintSoft,
  onPress,
}: {
  x: number;
  y: number;
  state: NodeState;
  phaseIndex: number;
  path: PathDef;
  tintMain: string;
  tintSoft: string;
  onPress: () => void;
}) {
  const { t } = useTranslation();
  const { colors } = useTheme();
  const kind = PHASE_ORDER[phaseIndex];
  const label = `${t(`paths.p_${path.id}_title`)} · ${t(`paths.phase_${kind}`)}`;

  const background = { completed: tintMain, active: colors.surface, locked: colors.surfaceAlt }[state];
  const border = { completed: tintMain, active: tintMain, locked: colors.border }[state];
  const iconColor = { completed: '#FFFFFF', active: tintMain, locked: colors.textSecondary }[state];

  return (
    <View style={[styles.nodeWrap, { top: y - NODE / 2, left: x - NODE / 2 }]}>
      {state === 'active' ? <ActiveHalo color={tintSoft} /> : null}
      {state === 'active' ? (
        <View style={[styles.startPill, { backgroundColor: tintMain }]}>
          <AppText variant="label" style={styles.startText}>
            {t('paths.node_start')}
          </AppText>
        </View>
      ) : null}
      <Pressable
        accessibilityRole="button"
        accessibilityLabel={label}
        accessibilityState={{ disabled: state === 'locked' }}
        disabled={state === 'locked'}
        onPress={onPress}
        style={({ pressed }) => [
          styles.node,
          {
            backgroundColor: background,
            borderColor: border,
            borderWidth: state === 'active' ? 3 : 1.5,
            opacity: pressed ? 0.85 : 1,
          },
        ]}
      >
        {state === 'completed' ? (
          <Ionicons name="checkmark" size={26} color={iconColor} />
        ) : (
          <Ionicons name={PHASE_ICONS[kind]} size={24} color={iconColor} />
        )}
      </Pressable>
    </View>
  );
}

/** Halo que respira alrededor del nodo activo (se detiene con reduced motion). */
function ActiveHalo({ color }: { color: string }) {
  const reduced = useReducedMotion();
  const scale = useSharedValue(1);

  useEffect(() => {
    if (reduced) return;
    scale.value = withRepeat(
      withSequence(
        withTiming(1.18, { duration: motion.gentle * 2, easing: Easing.inOut(Easing.sin) }),
        withTiming(1, { duration: motion.gentle * 2, easing: Easing.inOut(Easing.sin) }),
      ),
      -1,
    );
  }, [reduced, scale]);

  const style = useAnimatedStyle(() => ({ transform: [{ scale: scale.value }] }));
  return <Animated.View pointerEvents="none" style={[styles.halo, { backgroundColor: color }, style]} />;
}

/** Hueso de recompensa al final del camino: se sabe qué contiene antes de llegar. */
function BoneNode({
  x,
  y,
  earned,
  tintMain,
  tintSoft,
  rewardLabel,
  onPress,
}: {
  x: number;
  y: number;
  earned: boolean;
  tintMain: string;
  tintSoft: string;
  rewardLabel: string;
  onPress: () => void;
}) {
  const { t } = useTranslation();
  const { colors } = useTheme();
  const fill = earned ? tintMain : tintSoft;
  const knob = earned ? tintMain : tintSoft;
  const border = earned ? tintMain : colors.border;

  return (
    <View style={[styles.boneWrap, { top: y - 21, left: x - 62 }]}>
      <Pressable
        accessibilityRole="button"
        accessibilityLabel={`${t('paths.reward_label')}: ${rewardLabel}`}
        onPress={onPress}
        style={({ pressed }) => [styles.boneBody, { opacity: pressed ? 0.85 : 1 }]}
      >
        <View style={[styles.boneKnob, { backgroundColor: knob, borderColor: border, top: 0, left: 0 }]} />
        <View style={[styles.boneKnob, { backgroundColor: knob, borderColor: border, bottom: 0, left: 0 }]} />
        <View style={[styles.boneKnob, { backgroundColor: knob, borderColor: border, top: 0, right: 0 }]} />
        <View style={[styles.boneKnob, { backgroundColor: knob, borderColor: border, bottom: 0, right: 0 }]} />
        <View style={[styles.boneBar, { backgroundColor: fill, borderColor: border }]}>
          <Ionicons name={earned ? 'checkmark' : 'gift-outline'} size={18} color={earned ? '#FFFFFF' : tintMain} />
        </View>
      </Pressable>
      <AppText variant="caption" tone="secondary" style={styles.boneLabel} numberOfLines={2}>
        {rewardLabel}
      </AppText>
    </View>
  );
}

/** Separador de camino dentro del mundo. */
function CaminoHeader({
  y,
  path,
  completed,
  tintMain,
  onPress,
}: {
  y: number;
  path: PathDef;
  completed: boolean;
  tintMain: string;
  onPress: () => void;
}) {
  const { t } = useTranslation();
  const { colors } = useTheme();
  return (
    <View pointerEvents="box-none" style={[styles.headerRow, { top: y - 20 }]}>
      <View style={[styles.headerLine, { backgroundColor: colors.border }]} />
      <Pressable
        accessibilityRole="button"
        accessibilityLabel={`${t('paths.camino_label', { n: path.order })} · ${t(`paths.p_${path.id}_title`)}`}
        onPress={onPress}
        style={({ pressed }) => [
          styles.headerPill,
          { backgroundColor: completed ? tintMain : colors.surface, borderColor: completed ? tintMain : colors.border, opacity: pressed ? 0.85 : 1 },
        ]}
      >
        {completed ? <Ionicons name="checkmark" size={14} color="#FFFFFF" /> : null}
        <AppText variant="label" style={completed ? styles.startText : undefined} tone={completed ? undefined : 'secondary'}>
          {t('paths.camino_label', { n: path.order })} · {t(`paths.p_${path.id}_title`)}
        </AppText>
      </Pressable>
      <View style={[styles.headerLine, { backgroundColor: colors.border }]} />
    </View>
  );
}

/** Pisadas pequeñas entre nodos: el sendero se recorre andando. */
function Connector({
  from,
  to,
  color,
}: {
  from: { x: number; y: number };
  to: { x: number; y: number };
  color: string;
}) {
  const dots = [0.36, 0.64];
  return (
    <>
      {dots.map((f, i) => (
        <View
          key={i}
          pointerEvents="none"
          style={{
            position: 'absolute',
            top: from.y + (to.y - from.y) * f - 4,
            left: from.x + (to.x - from.x) * f - 4 + (i === 0 ? -5 : 5),
            width: 8,
            height: 10,
            borderRadius: 5,
            backgroundColor: color,
            opacity: 0.55,
          }}
        />
      ))}
    </>
  );
}

const styles = StyleSheet.create({
  nodeWrap: { position: 'absolute', width: NODE, height: NODE, alignItems: 'center', justifyContent: 'center' },
  node: {
    width: NODE,
    height: NODE,
    borderRadius: NODE / 2,
    alignItems: 'center',
    justifyContent: 'center',
  },
  halo: { position: 'absolute', width: NODE + 18, height: NODE + 18, borderRadius: (NODE + 18) / 2 },
  startPill: {
    position: 'absolute',
    top: -26,
    paddingHorizontal: spacing.xs,
    paddingVertical: 2,
    borderRadius: radius.pill,
    zIndex: 2,
  },
  startText: { color: '#FFFFFF' },
  boneWrap: { position: 'absolute', width: 124, alignItems: 'center' },
  boneBody: { width: 96, height: 42, alignItems: 'center', justifyContent: 'center' },
  boneKnob: { position: 'absolute', width: 20, height: 20, borderRadius: 10, borderWidth: 1.5 },
  boneBar: {
    width: 72,
    height: 26,
    borderRadius: 13,
    borderWidth: 1.5,
    alignItems: 'center',
    justifyContent: 'center',
  },
  boneLabel: { textAlign: 'center', marginTop: 2 },
  headerRow: {
    position: 'absolute',
    left: 0,
    right: 0,
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
  },
  headerLine: { flex: 1, height: 1 },
  headerPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    borderWidth: 1,
    borderRadius: radius.pill,
    paddingHorizontal: spacing.sm,
    paddingVertical: 6,
  },
});
