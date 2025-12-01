import { createAnimations } from "@tamagui/animations-moti";

export const animationDurations = {
  fast: 150,
  normal: 250,
  slow: 350,
  slower: 500,
} as const;

// Type definition for animations - using a generic type to avoid complex inference
type AnimationsType = Record<string, unknown>;

export const animations = createAnimations({
  "100ms": {
    type: "timing",
    duration: 100,
  },
  "200ms": {
    type: "timing",
    duration: 200,
  },
  bouncy: {
    type: "spring",
    damping: 10,
    mass: 0.9,
    stiffness: 100,
  },
  lazy: {
    type: "spring",
    damping: 20,
    stiffness: 60,
  },
  quick: {
    type: "spring",
    damping: 20,
    mass: 1.2,
    stiffness: 250,
  },
  medium: {
    damping: 15,
    stiffness: 120,
    mass: 1,
  },
  slow: {
    damping: 15,
    stiffness: 40,
  },
  tooltip: {
    damping: 10,
    mass: 0.9,
    stiffness: 100,
  },
  pulse: {
    type: "timing",
    duration: 1500,
    loop: true,
  },
}) as unknown as AnimationsType;

export type AnimationDurationName = keyof typeof animationDurations;
