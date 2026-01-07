/**
 * Column and Grid System Tokens
 *
 * Grid system specifications mapped from Figma Forsured Design System.
 * Defines column counts, widths, gutters, and margins for responsive layouts.
 *
 * Layout Types:
 * - Desktop: Standard 12-column grid for desktop viewports (1440px)
 * - Tablet: 6-column grid for tablet viewports (768px)
 * - Mobile: 4-column grid for mobile viewports (375px)
 * - SaaS: Special layout with sidebar for SaaS applications (1440px)
 *
 * Usage Examples:
 *
 * ```typescript
 * // Using desktop grid tokens
 * const desktopColWidth = columns.desktop.columnWidth  // 72
 * const desktopGutter = columns.desktop.gutter         // 32
 * const desktopMargin = columns.desktop.sideMargin     // 112
 *
 * // Using tablet grid tokens
 * const tabletCols = columns.tablet.columnCount        // 6
 * const tabletColWidth = columns.tablet.columnWidth    // ~91
 *
 * // Using mobile grid tokens
 * const mobileGutter = columns.mobile.gutter           // 16
 *
 * // Using SaaS layout tokens
 * const sidebarWidth = columns.saas.sidebarWidth       // 272
 * const saasGutter = columns.saas.gutter               // 24
 * ```
 */

/**
 * Desktop Grid System (1440px container)
 * 12-column grid system for desktop viewports
 */
export const desktop = {
  /** Total container width */
  containerWidth: 1440,
  /** Number of columns */
  columnCount: 12,
  /** Width of a single column in pixels */
  columnWidth: 72,
  /** Gutter width between columns in pixels */
  gutter: 32,
  /** Side margin width in pixels (applied to left and right) */
  sideMargin: 112,
  /** Total content width (container - side margins) */
  contentWidth: 1216,
} as const

/**
 * Tablet Grid System (768px container)
 * 6-column grid system for tablet viewports
 */
export const tablet = {
  /** Total container width */
  containerWidth: 768,
  /** Number of columns */
  columnCount: 6,
  /** Width of a single column in pixels (calculated: ~90.67px, rounded to 91px) */
  columnWidth: 91,
  /** Gutter width between columns in pixels */
  gutter: 32,
  /** Side margin width in pixels (applied to left and right) */
  sideMargin: 32,
  /** Total content width (container - side margins) */
  contentWidth: 704,
} as const

/**
 * Mobile Grid System (375px container)
 * 4-column grid system for mobile viewports
 */
export const mobile = {
  /** Total container width */
  containerWidth: 375,
  /** Number of columns */
  columnCount: 4,
  /** Width of a single column in pixels (calculated: ~73.75px, rounded to 74px) */
  columnWidth: 74,
  /** Gutter width between columns in pixels */
  gutter: 16,
  /** Side margin width in pixels (applied to left and right) */
  sideMargin: 16,
  /** Total content width (container - side margins) */
  contentWidth: 343,
} as const

/**
 * SaaS Layout System (1440px container)
 * Special layout with sidebar for SaaS applications
 * 12-column grid system with dedicated sidebar space
 */
export const saas = {
  /** Total container width */
  containerWidth: 1440,
  /** Sidebar width in pixels */
  sidebarWidth: 272,
  /** Gap between sidebar and main content grid in pixels */
  sidebarGap: 32,
  /** Number of columns in main content area */
  columnCount: 12,
  /** Width of a single column in pixels */
  columnWidth: 70,
  /** Gutter width between columns in pixels */
  gutter: 24,
  /** Right margin width in pixels */
  rightMargin: 32,
  /** Total content width (container - sidebar - sidebarGap - rightMargin) */
  contentWidth: 1104,
  /** Main grid area width (contentWidth - rightMargin) */
  gridWidth: 1072,
} as const

/**
 * Complete columns configuration object
 */
export const columns = {
  desktop,
  tablet,
  mobile,
  saas,
} as const

/**
 * Helper function to calculate column span width
 * Returns the total width of n columns plus (n-1) gutters
 *
 * @example
 * ```typescript
 * // Calculate width for 4 columns with desktop grid
 * const width = getColumnSpanWidth(4, 'desktop')  // 4*72 + 3*32 = 384
 * ```
 */
export function getColumnSpanWidth(span: number, layout: keyof typeof columns): number {
  const layoutConfig = columns[layout]
  return span * layoutConfig.columnWidth + (span - 1) * layoutConfig.gutter
}

/**
 * Helper function to calculate total width including side margins
 * Returns the total width needed for n columns with gutters and side margins
 *
 * @example
 * ```typescript
 * // Calculate total width for 6 columns with desktop grid
 * const totalWidth = getTotalWidth(6, 'desktop')  // includes side margins
 * ```
 */
export function getTotalWidth(span: number, layout: keyof typeof columns): number {
  const contentWidth = getColumnSpanWidth(span, layout)

  if (layout === 'saas') {
    const saasConfig = columns.saas
    return saasConfig.sidebarWidth + saasConfig.sidebarGap + contentWidth + saasConfig.rightMargin
  }

  const layoutConfig = columns[layout]
  return contentWidth + layoutConfig.sideMargin * 2
}

// Type exports
export type ColumnLayout = keyof typeof columns
export type DesktopColumns = typeof desktop
export type TabletColumns = typeof tablet
export type MobileColumns = typeof mobile
export type SaasColumns = typeof saas
