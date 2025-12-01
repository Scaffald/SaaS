import { cardShadows } from './shadows'

export const cardElevations = {
  flat: {
    light: {
      boxShadow: cardShadows.none,
      borderWidth: 1,
      borderColor: '$borderColor',
    },
    dark: {
      boxShadow: cardShadows.none,
      borderWidth: 1,
      borderColor: '$borderColor',
    },
  },
  raised: {
    light: {
      boxShadow: cardShadows.light,
      borderWidth: 1,
      borderColor: '$borderColor',
    },
    dark: {
      boxShadow: cardShadows.dark,
      borderWidth: 1,
      borderColor: '$borderColor',
    },
  },
  elevated: {
    light: {
      boxShadow: cardShadows.elevated,
      borderWidth: 0,
    },
    dark: {
      boxShadow: cardShadows.dark,
      borderWidth: 1,
      borderColor: '$borderColor',
    },
  },
} as const

export type CardElevationVariant = keyof typeof cardElevations
