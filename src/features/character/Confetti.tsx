import { useEffect } from 'react';
import { Dimensions, StyleSheet, View } from 'react-native';
import Animated, {
  Easing,
  useAnimatedStyle,
  useReducedMotion,
  useSharedValue,
  withDelay,
  withTiming,
} from 'react-native-reanimated';

const COLORS = ['#C2512F', '#2E7E78', '#E8B84B', '#6C5CE7', '#3E86C7', '#4E8A5B'];
const WIDTH = Dimensions.get('window').width;

/** Confeti breve (una pasada). Respeta reduce motion: no se muestra si está activo. */
export function Confetti({ count = 24 }: { count?: number }) {
  const reduced = useReducedMotion();
  if (reduced) return null;
  return (
    <View pointerEvents="none" style={StyleSheet.absoluteFill}>
      {Array.from({ length: count }).map((_, i) => (
        <Piece key={i} index={i} />
      ))}
    </View>
  );
}

function Piece({ index }: { index: number }) {
  const progress = useSharedValue(0);
  const startX = (index / 24) * WIDTH + (Math.random() * 40 - 20);
  const drift = Math.random() * 80 - 40;
  const size = 6 + Math.random() * 6;
  const color = COLORS[index % COLORS.length];
  const delay = Math.random() * 250;
  const rounded = index % 2 === 0;

  useEffect(() => {
    progress.value = withDelay(delay, withTiming(1, { duration: 1400 + Math.random() * 700, easing: Easing.out(Easing.quad) }));
  }, [progress, delay]);

  const style = useAnimatedStyle(() => ({
    opacity: 1 - progress.value,
    transform: [
      { translateY: progress.value * 560 },
      { translateX: progress.value * drift },
      { rotate: `${progress.value * 540}deg` },
    ],
  }));

  return (
    <Animated.View
      style={[
        {
          position: 'absolute',
          top: -20,
          left: startX,
          width: size,
          height: size,
          borderRadius: rounded ? size / 2 : 2,
          backgroundColor: color,
        },
        style,
      ]}
    />
  );
}
