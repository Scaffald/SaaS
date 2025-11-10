export const opacity = {
  disabled: 0.5,
  hover: 0.8,
  loading: 0.6,
  overlay: 0.7,
} as const

export type OpacityToken = keyof typeof opacity
