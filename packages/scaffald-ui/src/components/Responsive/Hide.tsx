/**
 * Hide component
 * Conditionally hide children based on breakpoint visibility rules
 *
 * @example
 * ```tsx
 * import { Hide } from '@scaffald/ui'
 *
 * // Hide on desktop (lg and above)
 * <Hide above="md">
 *   <MobileOnlyFeature />
 * </Hide>
 *
 * // Hide on mobile (below sm)
 * <Hide below="sm">
 *   <DesktopOnlyFeature />
 * </Hide>
 *
 * // Hide only at tablet size (md breakpoint)
 * <Hide at="md">
 *   <NotForTablet />
 * </Hide>
 * ```
 */

import { useResponsive } from '../../hooks/useResponsive'
import { breakpoints, type Breakpoint } from '../../tokens/breakpoints'
import type { HideProps } from './Responsive.types'

export function Hide({ above, below, at, children }: HideProps) {
  const { breakpoint, width } = useResponsive()

  // Get breakpoint values
  const getBreakpointValue = (bp: Breakpoint): number => {
    return breakpoints[bp]
  }

  // Determine if content should be hidden
  let shouldHide = false

  if (at) {
    // Hide only at specific breakpoint
    shouldHide = breakpoint === at
  } else if (above && below) {
    // Hide between two breakpoints
    const aboveValue = getBreakpointValue(above)
    const belowValue = getBreakpointValue(below)
    shouldHide = width >= aboveValue && width < belowValue
  } else if (above) {
    // Hide at breakpoint and above
    const aboveValue = getBreakpointValue(above)
    shouldHide = width >= aboveValue
  } else if (below) {
    // Hide below breakpoint
    const belowValue = getBreakpointValue(below)
    shouldHide = width < belowValue
  }

  return !shouldHide ? <>{children}</> : null
}

export type { HideProps } from './Responsive.types'
