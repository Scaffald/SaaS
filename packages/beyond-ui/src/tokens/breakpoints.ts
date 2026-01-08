/**
 * Breakpoint tokens for responsive design
 *
 * Matches breakpoints from @unicornlove/ui for consistency
 * Values: xs(660), sm(800), md(1020), lg(1280), xl(1420), xxl(1600)
 */

/**
 * Breakpoint values in pixels
 * These represent the minimum width for each breakpoint
 */
export const breakpoints = {
  xs: 660,
  sm: 800,
  md: 1020,
  lg: 1280,
  xl: 1420,
  xxl: 1600,
} as const

/**
 * Media query strings for use in styled components or CSS-in-JS
 */
export const mediaQueries = {
  xs: `@media (min-width: ${breakpoints.xs}px)`,
  sm: `@media (min-width: ${breakpoints.sm}px)`,
  md: `@media (min-width: ${breakpoints.md}px)`,
  lg: `@media (min-width: ${breakpoints.lg}px)`,
  xl: `@media (min-width: ${breakpoints.xl}px)`,
  xxl: `@media (min-width: ${breakpoints.xxl}px)`,
} as const

/**
 * Max-width media queries (exclusive)
 */
export const mediaQueriesMax = {
  xs: `@media (max-width: ${breakpoints.xs - 1}px)`,
  sm: `@media (max-width: ${breakpoints.sm - 1}px)`,
  md: `@media (max-width: ${breakpoints.md - 1}px)`,
  lg: `@media (max-width: ${breakpoints.lg - 1}px)`,
  xl: `@media (max-width: ${breakpoints.xl - 1}px)`,
  xxl: `@media (max-width: ${breakpoints.xxl - 1}px)`,
} as const

/**
 * Range media queries (between two breakpoints)
 */
export const mediaQueriesRange = {
  xsToSm: `@media (min-width: ${breakpoints.xs}px) and (max-width: ${breakpoints.sm - 1}px)`,
  smToMd: `@media (min-width: ${breakpoints.sm}px) and (max-width: ${breakpoints.md - 1}px)`,
  mdToLg: `@media (min-width: ${breakpoints.md}px) and (max-width: ${breakpoints.lg - 1}px)`,
  lgToXl: `@media (min-width: ${breakpoints.lg}px) and (max-width: ${breakpoints.xl - 1}px)`,
  xlToXxl: `@media (min-width: ${breakpoints.xl}px) and (max-width: ${breakpoints.xxl - 1}px)`,
} as const

/**
 * Device categories based on breakpoints
 */
export const devices = {
  mobile: mediaQueriesMax.sm, // < 800px
  tablet: mediaQueriesRange.smToMd, // 800px - 1019px
  desktop: mediaQueries.lg, // >= 1280px
} as const

/**
 * Container max-widths for each breakpoint
 * Useful for constraining content width
 */
export const containerMaxWidths = {
  xs: 640,
  sm: 768,
  md: 1024,
  lg: 1280,
  xl: 1400,
  xxl: 1536,
} as const

/**
 * Helper function to check if a width matches a breakpoint
 */
export const matchesBreakpoint = (width: number, breakpoint: keyof typeof breakpoints): boolean => {
  return width >= breakpoints[breakpoint]
}

/**
 * Helper function to get the current breakpoint name
 */
export const getCurrentBreakpoint = (width: number): keyof typeof breakpoints => {
  if (width >= breakpoints.xxl) return 'xxl'
  if (width >= breakpoints.xl) return 'xl'
  if (width >= breakpoints.lg) return 'lg'
  if (width >= breakpoints.md) return 'md'
  if (width >= breakpoints.sm) return 'sm'
  return 'xs'
}

export type Breakpoint = keyof typeof breakpoints
export type MediaQuery = keyof typeof mediaQueries
export type Device = keyof typeof devices
