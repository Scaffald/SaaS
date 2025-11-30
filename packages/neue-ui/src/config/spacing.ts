export const spacing = {
  xs: '$2',
  sm: '$3',
  md: '$4',
  lg: '$5',
  xl: '$6',
  '2xl': '$8',
  '3xl': '$10',
  '4xl': '$12',
} as const

export type SpacingToken = keyof typeof spacing
