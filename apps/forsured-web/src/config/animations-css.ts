/**
 * CSS-based animations for web builds
 * Uses @tamagui/animations-css instead of @tamagui/animations-moti
 * to avoid react-native-reanimated issues on web
 */
import { createAnimations } from '@tamagui/animations-css';

export const animationDurations = {
  fast: 150,
  normal: 250,
  slow: 350,
  slower: 500,
} as const;

export const animations = createAnimations({
  '100ms': 'ease-in 100ms',
  '200ms': 'ease-in 200ms',
  bouncy: 'ease-in-out 300ms',
  lazy: 'ease-in 500ms',
  quick: 'ease-out 150ms',
  medium: 'ease-in-out 300ms',
  slow: 'ease-in 500ms',
  tooltip: 'ease-out 200ms',
  pulse: 'ease-in-out 1500ms infinite',
});

export type AnimationDurationName = keyof typeof animationDurations;
