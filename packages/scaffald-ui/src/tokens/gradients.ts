/**
 * Gradient tokens mapped from Figma Forsured Design System
 *
 * Gradients are two-color linear gradients that reference existing color tokens.
 * All gradients use 180deg direction (top to bottom) as standard.
 *
 * @example
 * ```typescript
 * import { gradients } from '@scaffald/ui/tokens'
 *
 * // Use gradient colors for React Native LinearGradient
 * <LinearGradient colors={gradients.gray[900].colors} />
 *
 * // Use CSS string for web
 * <div style={{ background: gradients.gray[900].css }} />
 * ```
 */

import { colors } from './colors'

/**
 * Helper function to create a gradient object
 */
function createGradient(
  start: string,
  end: string
): {
  colors: [string, string]
  css: string
  start: string
  end: string
} {
  return {
    colors: [start, end],
    css: `linear-gradient(180deg, ${start} 0%, ${end} 100%)`,
    start,
    end,
  } as const
}

/**
 * Base Gray gradients
 * Gradients between consecutive gray shades
 */
const grayGradients = {
  900: createGradient(colors.gray[900], colors.gray[800]),
  800: createGradient(colors.gray[800], colors.gray[700]),
  700: createGradient(colors.gray[700], colors.gray[600]),
  600: createGradient(colors.gray[600], colors.gray[500]),
  500: createGradient(colors.gray[500], colors.gray[400]),
  400: createGradient(colors.gray[400], colors.gray[300]),
  300: createGradient(colors.gray[300], colors.gray[200]),
  200: createGradient(colors.gray[200], colors.gray[100]),
  100: createGradient(colors.gray[100], colors.gray[50]),
  50: createGradient(colors.gray[50], colors.gray[50]), // 50->25: Using gray[50] for 25 (same value)
  25: createGradient(colors.gray[50], colors.white), // 25->0: gray[25] uses gray[50], gray[0] uses white
} as const

/**
 * Primary (Brand) gradients
 * Gradients between consecutive primary shades
 */
const primaryGradients = {
  900: createGradient(colors.primary[900], colors.primary[800]),
  800: createGradient(colors.primary[800], colors.primary[700]),
  700: createGradient(colors.primary[700], colors.primary[600]),
  600: createGradient(colors.primary[600], colors.primary[500]),
  500: createGradient(colors.primary[500], colors.primary[400]),
  400: createGradient(colors.primary[400], colors.primary[300]),
  300: createGradient(colors.primary[300], colors.primary[200]),
  200: createGradient(colors.primary[200], colors.primary[100]),
  100: createGradient(colors.primary[100], colors.primary[50]),
  50: createGradient(colors.primary[50], colors.white), // 50->0: primary[0] uses white
} as const

/**
 * Info gradients
 * Gradients between consecutive info shades
 */
const infoGradients = {
  900: createGradient(colors.info[900], colors.info[800]),
  800: createGradient(colors.info[800], colors.info[700]),
  700: createGradient(colors.info[700], colors.info[600]),
  600: createGradient(colors.info[600], colors.info[500]),
  500: createGradient(colors.info[500], colors.info[400]),
  400: createGradient(colors.info[400], colors.info[300]),
  300: createGradient(colors.info[300], colors.info[200]),
  200: createGradient(colors.info[200], colors.info[100]),
  100: createGradient(colors.info[100], colors.info[50]),
  50: createGradient(colors.info[50], colors.white), // 50->0: info[0] uses white
} as const

/**
 * Success gradients
 * Gradients between consecutive success shades
 */
const successGradients = {
  900: createGradient(colors.success[900], colors.success[800]),
  800: createGradient(colors.success[800], colors.success[700]),
  700: createGradient(colors.success[700], colors.success[600]),
  600: createGradient(colors.success[600], colors.success[500]),
  500: createGradient(colors.success[500], colors.success[400]),
  400: createGradient(colors.success[400], colors.success[300]),
  300: createGradient(colors.success[300], colors.success[200]),
  200: createGradient(colors.success[200], colors.success[100]),
  100: createGradient(colors.success[100], colors.success[50]),
  50: createGradient(colors.success[50], colors.white), // 50->0: success[0] uses white
} as const

/**
 * Warning gradients
 * Gradients between consecutive warning shades
 */
const warningGradients = {
  900: createGradient(colors.warning[900], colors.warning[800]),
  800: createGradient(colors.warning[800], colors.warning[700]),
  700: createGradient(colors.warning[700], colors.warning[600]),
  600: createGradient(colors.warning[600], colors.warning[500]),
  500: createGradient(colors.warning[500], colors.warning[400]),
  400: createGradient(colors.warning[400], colors.warning[300]),
  300: createGradient(colors.warning[300], colors.warning[200]),
  200: createGradient(colors.warning[200], colors.warning[100]),
  100: createGradient(colors.warning[100], colors.warning[50]),
  50: createGradient(colors.warning[50], colors.white), // 50->0: warning[0] uses white
} as const

/**
 * Error gradients
 * Gradients between consecutive error shades
 */
const errorGradients = {
  900: createGradient(colors.error[900], colors.error[800]),
  800: createGradient(colors.error[800], colors.error[700]),
  700: createGradient(colors.error[700], colors.error[600]),
  600: createGradient(colors.error[600], colors.error[500]),
  500: createGradient(colors.error[500], colors.error[400]),
  400: createGradient(colors.error[400], colors.error[300]),
  300: createGradient(colors.error[300], colors.error[200]),
  200: createGradient(colors.error[200], colors.error[100]),
  100: createGradient(colors.error[100], colors.error[50]),
  50: createGradient(colors.error[50], colors.white), // 50->0: error[0] uses white
} as const

/**
 * Named special gradients
 * Multi-color gradients with descriptive names from Figma
 */
const namedGradients = {
  'warm-flame': createGradient(colors.orange[400], colors.rose[400]),
  'juicy-peach': createGradient(colors.rose[300], colors.orange[200]),
  'dusty-grass': createGradient(colors.lime[300], colors.emerald[400]),
  'tempting-azure': createGradient(colors.teal[300], colors.teal[500]),
  'ocean-blue': createGradient(colors.sky[400], colors.blue[500]),
  'malibu-beach': createGradient(colors.cyan[400], colors.sky[500]),
  'night-fade': createGradient(colors.pink[200], colors.indigo[400]),
  'spring-warmth': createGradient(colors.purple[300], colors.pink[200]),
} as const

/**
 * Gradient tokens organized by color family
 */
export const gradients = {
  gray: grayGradients,
  primary: primaryGradients,
  info: infoGradients,
  success: successGradients,
  warning: warningGradients,
  error: errorGradients,
  named: namedGradients,
} as const

export type GradientToken = typeof gradients
export type GrayGradientToken = keyof typeof grayGradients
export type PrimaryGradientToken = keyof typeof primaryGradients
export type InfoGradientToken = keyof typeof infoGradients
export type SuccessGradientToken = keyof typeof successGradients
export type WarningGradientToken = keyof typeof warningGradients
export type ErrorGradientToken = keyof typeof errorGradients
export type NamedGradientToken = keyof typeof namedGradients
