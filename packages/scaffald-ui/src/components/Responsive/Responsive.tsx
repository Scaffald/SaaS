/**
 * Responsive component
 * Render prop component that provides breakpoint information
 *
 * @example
 * ```tsx
 * import { Responsive } from '@scaffald/ui'
 *
 * // Access breakpoint info in render function
 * <Responsive>
 *   {({ breakpoint, isMobile, isTablet, isDesktop }) => (
 *     <>
 *       {isMobile && <MobileLayout />}
 *       {isTablet && <TabletLayout />}
 *       {isDesktop && <DesktopLayout />}
 *     </>
 *   )}
 * </Responsive>
 *
 * // Use specific breakpoint
 * <Responsive>
 *   {({ breakpoint }) => (
 *     <div>Current: {breakpoint}</div>
 *   )}
 * </Responsive>
 * ```
 */

import { useResponsive } from '../../hooks/useResponsive'
import type { ResponsiveProps } from './Responsive.types'

export function Responsive({ children }: ResponsiveProps) {
  const { breakpoint, isMobile, isTablet, isDesktop, width, height } = useResponsive()

  return (
    <>
      {children({
        breakpoint,
        isMobile,
        isTablet,
        isDesktop,
        width,
        height,
      })}
    </>
  )
}

export type { ResponsiveProps } from './Responsive.types'
