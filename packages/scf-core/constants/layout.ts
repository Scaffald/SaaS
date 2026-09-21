/**
 * The screen rhythm — one frame for every screen.
 *
 * The four layouts each invented their own spacing, and because three of them
 * expressed it through the *named* padding scale (`'2xl'` is 16, `'lg'` is
 * 10, `'sm'` is 6) the divergence did not look like divergence in the source.
 * Measured at 1440 the page title started at x=332 under DashboardLayout,
 * x=316 under Profile and Assessments, and x=314 under Office — three
 * different left edges for the same thing, on top of the 22 distinct title
 * positions the route sweep found before #814.
 *
 * These are plain numbers on purpose. A layout reaching for `'2xl'` cannot
 * tell you what it will get without opening the token file, and that is how
 * a 32px gutter and a 16px gutter both read as "the big one".
 *
 * The values follow DashboardLayout, which was already the most airy and the
 * closest to the prototype: the SCF design system runs a 1.15× density scale
 * and asks for room rather than tightness.
 */

import { useResponsive } from '@scaffald/ui'

export const SCREEN_RHYTHM = {
  /** Space between the screen's content and the window edge (or the drawer). */
  gutter: { desktop: 32, phone: 16 },
  /** Space above the first element and below the last. */
  verticalPadding: { desktop: 32, phone: 16 },
  /** Space between the header, the toolbar and the content. */
  sectionGap: { desktop: 24, phone: 20 },
  /** Space between the two columns of a two-column screen. */
  columnGap: { desktop: 32, phone: 16 },
  /** Space between stacked rows once the two columns collapse to one. */
  rowGap: { desktop: 40, phone: 28 },
} as const

export type ScreenRhythm = {
  gutter: number
  verticalPadding: number
  sectionGap: number
  columnGap: number
  rowGap: number
  isDesktop: boolean
}

/**
 * The rhythm at the current width.
 *
 * Always through `useResponsive`: it is one `useSyncExternalStore` subscription
 * shared by every caller, where `useWindowDimensions` registers a listener per
 * component and, with enough of them mounted at once, cascades into "Maximum
 * update depth exceeded". `OfficeLayout` was still on the latter with its own
 * `width > 800` threshold, which is also why Office collapsed to one column at
 * a different width than everywhere else.
 */
export function useScreenRhythm(): ScreenRhythm {
  const { isDesktop } = useResponsive()
  const key = isDesktop ? 'desktop' : 'phone'
  return {
    gutter: SCREEN_RHYTHM.gutter[key],
    verticalPadding: SCREEN_RHYTHM.verticalPadding[key],
    sectionGap: SCREEN_RHYTHM.sectionGap[key],
    columnGap: SCREEN_RHYTHM.columnGap[key],
    rowGap: SCREEN_RHYTHM.rowGap[key],
    isDesktop,
  }
}
