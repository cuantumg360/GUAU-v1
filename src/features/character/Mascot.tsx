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

/**
 * Personaje virtual de GUAU · versión 0 (implementación programática).
 *
 * Criatura original inspirada en una huella: un cuerpo-almohadilla redondeado
 * con cuatro "dedos" que orbitan la cabeza. No es un perro concreto ni una
 * mascota que cuidar: es guía y compañía. La v0 prioriza estados y contención;
 * el diseño ilustrado de alta fidelidad la sustituirá manteniendo esta API
 * (ver docs/11-virtual-character.md).
 *
 * Regla sanitaria: los estados 'sober' y 'error' anulan el movimiento y bajan
 * la expresividad. El personaje nunca es el canal principal de información
 * sanitaria.
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
};

export function Mascot({ state = 'neutral', size = 96 }: Props) {
  const { colors } = useTheme();
  const reducedMotion = useReducedMotion();
  const bounce = useSharedValue(0);

  const isCalm = state === 'sober' || state === 'error' || state === 'waiting';
  const animate = !reducedMotion && !isCalm;

  useEffect(() => {
    if (!animate) {
      bounce.value = withTiming(0, { duration: motion.calm });
      return;
    }
    const amplitude = state === 'celebrating' ? -8 : state === 'happy' ? -5 : -3;
    bounce.value = withRepeat(
      withSequence(
        withTiming(amplitude, { duration: motion.gentle, easing: Easing.out(Easing.quad) }),
        withTiming(0, { duration: motion.gentle, easing: Easing.in(Easing.quad) }),
      ),
      -1,
    );
  }, [animate, state, bounce]);

  const bodyStyle = useAnimatedStyle(() => ({ transform: [{ translateY: bounce.value }] }));

  const bodyColor = isCalm ? colors.health : colors.primary;
  const toeColor = isCalm ? colors.healthSoft : colors.primarySoft;
  const eyeHeight = state === 'happy' || state === 'celebrating' ? size * 0.05 : size * 0.09;

  const toe = (angleDeg: number) => {
    const rad = (angleDeg * Math.PI) / 180;
    const orbit = size * 0.52;
    return (
      <View
        key={angleDeg}
        style={{
          position: 'absolute',
          width: size * 0.24,
          height: size * 0.3,
          borderRadius: size * 0.15,
          backgroundColor: toeColor,
          borderWidth: 2,
          borderColor: bodyColor,
          left: size / 2 - size * 0.12 + Math.sin(rad) * orbit * 0.62,
          top: size * 0.32 - Math.cos(rad) * orbit * 0.55,
        }}
      />
    );
  };

  return (
    <Animated.View
      accessibilityElementsHidden
      importantForAccessibility="no-hide-descendants"
      style={[{ width: size, height: size * 1.1 }, bodyStyle]}
    >
      {[-42, -14, 14, 42].map(toe)}
      <View
        style={[
          styles.body,
          {
            width: size * 0.78,
            height: size * 0.66,
            borderRadius: size * 0.36,
            backgroundColor: bodyColor,
            left: size * 0.11,
            top: size * 0.38,
          },
        ]}
      >
        <View style={styles.eyes}>
          <View
            style={{
              width: size * 0.09,
              height: eyeHeight,
              borderRadius: size * 0.05,
              backgroundColor: colors.surface,
            }}
          />
          <View
            style={{
              width: size * 0.09,
              height: eyeHeight,
              borderRadius: size * 0.05,
              backgroundColor: colors.surface,
            }}
          />
        </View>
      </View>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  body: {
    position: 'absolute',
    alignItems: 'center',
    justifyContent: 'center',
  },
  eyes: {
    flexDirection: 'row',
    gap: 12,
  },
});
