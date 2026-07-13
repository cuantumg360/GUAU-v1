import { useEffect } from 'react';
import { StyleSheet, View } from 'react-native';
import Animated, {
  Easing,
  useAnimatedStyle,
  useReducedMotion,
  useSharedValue,
  withRepeat,
  withSequence,
  withTiming,
} from 'react-native-reanimated';

import { useTheme } from '@/design/ThemeContext';
import { motion } from '@/design/tokens';
import {
  MASCOT_VARIANTS,
  useMascotConfig,
  type MascotAccessory,
  type MascotConfig,
} from '@/features/character/mascotConfig';

/**
 * GUAU · Personaje virtual "Toba" · versión 2.
 *
 * Criatura-huella original y expresiva: cuerpo-almohadilla redondeado con orejas,
 * barriga, ojos que parpadean, mejillas y boca que cambian con el estado, más un
 * accesorio configurable (collar, pañuelo, gorra, flor, gafas) y color elegible.
 * Es guía y compañía, no una mascota que cuidar; el perro real es el protagonista.
 *
 * Regla sanitaria: los estados 'sober' y 'error' anulan el movimiento, bajan la
 * expresividad y usan color sobrio. El personaje nunca es el canal principal de
 * información sanitaria (docs/08, docs/11).
 */
export type MascotState =
  | 'neutral'
  | 'attentive'
  | 'happy'
  | 'celebrating'
  | 'waiting'
  | 'sober'
  | 'error';

type Props = {
  state?: MascotState;
  size?: number;
  /** Config puntual (para preview en la pantalla de personalización). */
  config?: MascotConfig;
};

export function Mascot({ state = 'neutral', size = 96, config }: Props) {
  const { colors } = useTheme();
  const reduced = useReducedMotion();
  const liveConfig = useMascotConfig();
  const cfg = config ?? liveConfig;

  const isCalm = state === 'sober' || state === 'error' || state === 'waiting';
  const animate = !reduced && !isCalm;

  const bounce = useSharedValue(0);
  const breathe = useSharedValue(1);
  const wiggle = useSharedValue(0);
  const blink = useSharedValue(1);

  useEffect(() => {
    if (!animate) {
      bounce.value = withTiming(0, { duration: motion.calm });
      breathe.value = withTiming(1, { duration: motion.calm });
      wiggle.value = withTiming(0, { duration: motion.calm });
      return;
    }
    const amp = state === 'celebrating' ? -size * 0.09 : state === 'happy' ? -size * 0.05 : -size * 0.03;
    bounce.value = withRepeat(
      withSequence(
        withTiming(amp, { duration: motion.gentle, easing: Easing.out(Easing.quad) }),
        withTiming(0, { duration: motion.gentle, easing: Easing.in(Easing.quad) }),
      ),
      -1,
    );
    breathe.value = withRepeat(
      withSequence(
        withTiming(1.03, { duration: 1400, easing: Easing.inOut(Easing.sin) }),
        withTiming(1, { duration: 1400, easing: Easing.inOut(Easing.sin) }),
      ),
      -1,
    );
    if (state === 'celebrating') {
      wiggle.value = withRepeat(
        withSequence(
          withTiming(-0.08, { duration: 180 }),
          withTiming(0.08, { duration: 180 }),
        ),
        -1,
        true,
      );
    } else {
      wiggle.value = withTiming(0, { duration: motion.standard });
    }
  }, [animate, state, size, bounce, breathe, wiggle]);

  // Parpadeo periódico (también en estados calmados, sutil).
  useEffect(() => {
    if (reduced) return;
    let mounted = true;
    const loop = () => {
      if (!mounted) return;
      blink.value = withSequence(
        withTiming(0.1, { duration: 90 }),
        withTiming(1, { duration: 90 }),
      );
    };
    const id = setInterval(loop, 3200 + Math.random() * 1600);
    return () => {
      mounted = false;
      clearInterval(id);
    };
  }, [reduced, blink]);

  const palette = MASCOT_VARIANTS[cfg.variant];
  const bodyColor = isCalm ? colors.health : palette.body;
  const bellyColor = isCalm ? colors.healthSoft : palette.belly;
  const detailColor = isCalm ? colors.health : palette.detail;

  const containerStyle = useAnimatedStyle(() => ({
    transform: [
      { translateY: bounce.value },
      { rotate: `${wiggle.value}rad` },
      { scale: breathe.value },
    ],
  }));
  const eyeStyle = useAnimatedStyle(() => ({ transform: [{ scaleY: blink.value }] }));

  const happy = state === 'happy' || state === 'celebrating';
  const showCheeks = happy;
  const S = size; // atajo

  return (
    <Animated.View
      accessibilityElementsHidden
      importantForAccessibility="no-hide-descendants"
      style={[{ width: S, height: S * 1.16, alignItems: 'center' }, containerStyle]}
    >
      {/* Orejas */}
      <View style={[styles.ear, { width: S * 0.26, height: S * 0.34, borderRadius: S * 0.16, backgroundColor: bodyColor, left: S * 0.1, top: S * 0.02, transform: [{ rotate: '-18deg' }] }]} />
      <View style={[styles.ear, { width: S * 0.26, height: S * 0.34, borderRadius: S * 0.16, backgroundColor: bodyColor, right: S * 0.1, top: S * 0.02, transform: [{ rotate: '18deg' }] }]} />

      {/* Cuerpo */}
      <View style={[styles.body, { width: S * 0.86, height: S * 0.86, borderRadius: S * 0.42, backgroundColor: bodyColor, top: S * 0.16 }]}>
        {/* Barriga (almohadilla-huella) */}
        <View style={{ position: 'absolute', bottom: S * 0.06, width: S * 0.5, height: S * 0.42, borderRadius: S * 0.24, backgroundColor: bellyColor }} />

        {/* Cara */}
        <View style={{ alignItems: 'center', marginTop: S * 0.2 }}>
          <View style={styles.eyesRow}>
            <Eye size={S} color={detailColor} happy={happy} style={eyeStyle} />
            <Eye size={S} color={detailColor} happy={happy} style={eyeStyle} />
          </View>
          {/* Mejillas */}
          {showCheeks ? (
            <>
              <View style={[styles.cheek, { width: S * 0.11, height: S * 0.07, borderRadius: S * 0.05, backgroundColor: '#F6A6A0', left: S * 0.12, top: S * 0.34 }]} />
              <View style={[styles.cheek, { width: S * 0.11, height: S * 0.07, borderRadius: S * 0.05, backgroundColor: '#F6A6A0', right: S * 0.12, top: S * 0.34 }]} />
            </>
          ) : null}
          {/* Boca */}
          <Mouth size={S} color={detailColor} state={state} />
        </View>
      </View>

      <Accessory accessory={cfg.accessory} size={S} bodyColor={bodyColor} detailColor={detailColor} surface={colors.surface} />
    </Animated.View>
  );
}

function Eye({ size, color, happy, style }: { size: number; color: string; happy: boolean; style: object }) {
  if (happy) {
    // ojo feliz: arco hacia arriba
    return (
      <View style={{ width: size * 0.12, height: size * 0.12, alignItems: 'center', justifyContent: 'center' }}>
        <View style={{ width: size * 0.12, height: size * 0.06, borderTopLeftRadius: size * 0.06, borderTopRightRadius: size * 0.06, borderWidth: size * 0.02, borderBottomWidth: 0, borderColor: color }} />
      </View>
    );
  }
  return (
    <Animated.View style={[{ width: size * 0.1, height: size * 0.12, borderRadius: size * 0.06, backgroundColor: color }, style]} />
  );
}

function Mouth({ size, color, state }: { size: number; color: string; state: MascotState }) {
  if (state === 'sober' || state === 'error') {
    return <View style={{ marginTop: size * 0.04, width: size * 0.16, height: size * 0.02, borderRadius: 2, backgroundColor: color }} />;
  }
  const w = state === 'happy' || state === 'celebrating' ? size * 0.2 : size * 0.12;
  return (
    <View style={{ marginTop: size * 0.05, width: w, height: size * 0.1, borderBottomLeftRadius: w, borderBottomRightRadius: w, borderWidth: size * 0.022, borderTopWidth: 0, borderColor: color }} />
  );
}

function Accessory({ accessory, size, bodyColor, detailColor, surface }: { accessory: MascotAccessory; size: number; bodyColor: string; detailColor: string; surface: string }) {
  const S = size;
  switch (accessory) {
    case 'collar':
      return (
        <>
          <View style={{ position: 'absolute', top: S * 0.78, width: S * 0.6, height: S * 0.09, borderRadius: S * 0.05, backgroundColor: detailColor }} />
          <View style={{ position: 'absolute', top: S * 0.84, width: S * 0.12, height: S * 0.12, borderRadius: S * 0.06, backgroundColor: '#E8B84B' }} />
        </>
      );
    case 'bandana':
      return (
        <View style={{ position: 'absolute', top: S * 0.74, width: 0, height: 0, borderLeftWidth: S * 0.16, borderRightWidth: S * 0.16, borderTopWidth: S * 0.16, borderLeftColor: 'transparent', borderRightColor: 'transparent', borderTopColor: '#C2512F' }} />
      );
    case 'cap':
      return (
        <>
          <View style={{ position: 'absolute', top: -S * 0.02, width: S * 0.5, height: S * 0.2, borderTopLeftRadius: S * 0.25, borderTopRightRadius: S * 0.25, backgroundColor: '#33566E' }} />
          <View style={{ position: 'absolute', top: S * 0.13, width: S * 0.62, height: S * 0.07, borderRadius: S * 0.04, backgroundColor: '#33566E' }} />
        </>
      );
    case 'flower':
      return (
        <View style={{ position: 'absolute', top: S * 0.04, right: S * 0.14, width: S * 0.16, height: S * 0.16, borderRadius: S * 0.08, backgroundColor: '#F2B705', alignItems: 'center', justifyContent: 'center' }}>
          <View style={{ width: S * 0.06, height: S * 0.06, borderRadius: S * 0.03, backgroundColor: surface }} />
        </View>
      );
    case 'glasses':
      return (
        <View style={{ position: 'absolute', top: S * 0.42, flexDirection: 'row', alignItems: 'center', gap: S * 0.03 }}>
          <View style={{ width: S * 0.16, height: S * 0.16, borderRadius: S * 0.08, borderWidth: S * 0.02, borderColor: detailColor }} />
          <View style={{ width: S * 0.16, height: S * 0.16, borderRadius: S * 0.08, borderWidth: S * 0.02, borderColor: detailColor }} />
        </View>
      );
    default:
      return null;
  }
}

const styles = StyleSheet.create({
  ear: { position: 'absolute' },
  body: { position: 'absolute', alignItems: 'center' },
  eyesRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', width: '46%' },
  cheek: { position: 'absolute' },
});
