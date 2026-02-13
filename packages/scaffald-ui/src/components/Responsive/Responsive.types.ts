/**
 * Responsive utility component types
 * Components for conditional rendering based on breakpoints
 */

import type { Breakpoint } from '../../tokens/breakpoints'

export interface ShowProps {
  /**
   * Show content at this breakpoint and above
   * Example: above="md" shows on md, lg, xl, xxl
   */
  above?: Breakpoint

  /**
   * Show content below this breakpoint
   * Example: below="lg" shows on base, xs, sm, md
   */
  below?: Breakpoint

  /**
   * Show content only at this specific breakpoint
   * Example: at="md" shows only on md
   */
  at?: Breakpoint

  /**
   * Children to conditionally render
   */
  children: React.ReactNode
}

export interface HideProps {
  /**
   * Hide content at this breakpoint and above
   * Example: above="md" hides on md, lg, xl, xxl
   */
  above?: Breakpoint

  /**
   * Hide content below this breakpoint
   * Example: below="lg" hides on base, xs, sm, md
   */
  below?: Breakpoint

  /**
   * Hide content only at this specific breakpoint
   * Example: at="md" hides only on md
   */
  at?: Breakpoint

  /**
   * Children to conditionally render
   */
  children: React.ReactNode
}

export interface ResponsiveProps {
  /**
   * Render function that receives current breakpoint info
   */
  children: (info: {
    breakpoint: Breakpoint | 'base'
    isMobile: boolean
    isTablet: boolean
    isDesktop: boolean
    width: number
    height: number
  }) => React.ReactNode
}
