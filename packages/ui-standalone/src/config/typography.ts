const fontSizes = {
  xs: '$1',
  sm: '$2',
  base: '$3',
  lg: '$4',
  xl: '$5',
  '2xl': '$6',
  '3xl': '$7',
  '4xl': '$8',
} as const

const lineHeights = {
  tight: 1.25,
  snug: 1.375,
  normal: 1.5,
  relaxed: 1.625,
  loose: 2,
} as const

const fontWeights = {
  normal: '400',
  medium: '500',
  semibold: '600',
  bold: '700',
} as const

export const typography = {
  ...fontSizes,
  lineHeightTight: lineHeights.tight,
  lineHeightSnug: lineHeights.snug,
  lineHeightNormal: lineHeights.normal,
  lineHeightRelaxed: lineHeights.relaxed,
  lineHeightLoose: lineHeights.loose,
  fontWeightNormal: fontWeights.normal,
  fontWeightMedium: fontWeights.medium,
  fontWeightSemibold: fontWeights.semibold,
  fontWeightBold: fontWeights.bold,
} as const

export type FontSizeToken = keyof typeof fontSizes
export type LineHeightToken = keyof typeof lineHeights
export type FontWeightToken = keyof typeof fontWeights
