/**
 * Show component
 * Conditionally render children based on breakpoint visibility rules
 *
 * @example
 * ```tsx
 * import { Show } from '@scaffald/ui'
 *
 * // Show only on desktop (lg and above)
 * <Show above="md">
 *   <DesktopNavigation />
 * </Show>
 *
 * // Show only on mobile (below sm)
 * <Show below="sm">
 *   <MobileMenu />
 * </Show>
 *
 * // Show only at tablet size (md breakpoint)
 * <Show at="md">
 *   <TabletLayout />
 * </Show>
 * ```
 */

import { useResponsive } from '../../hooks/useResponsive'
import { breakpoints, type Breakpoint } from '../../tokens/breakpoints'
import type { ShowProps } from './Responsive.types'

export function Show({ above, below, at, children }: ShowProps) {
  const { breakpoint, width } = useResponsive()

  // Get breakpoint values
  const getBreakpointValue = (bp: Breakpoint): number => {
    return breakpoints[bp]
  }

  // Determine if content should be shown
  let shouldShow = false

  if (at) {
    // Show only at specific breakpoint
    shouldShow = breakpoint === at
  } else if (above && below) {
    // Show between two breakpoints
    const aboveValue = getBreakpointValue(above)
    const belowValue = getBreakpointValue(below)
    shouldShow = width >= aboveValue && width < belowValue
  } else if (above) {
    // Show at breakpoint and above
    const aboveValue = getBreakpointValue(above)
    shouldShow = width >= aboveValue
  } else if (below) {
    // Show below breakpoint
    const belowValue = getBreakpointValue(below)
    shouldShow = width < belowValue
  } else {
    // No conditions specified, always show
    shouldShow = true
  }

  return shouldShow ? <>{children}</> : null
}

export type { ShowProps } from './Responsive.types'
