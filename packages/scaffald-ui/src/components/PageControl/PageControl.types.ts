/**
 * PageControl component types
 * iOS 26 style page indicator dots
 */

import type { StyleProp, ViewStyle } from 'react-native'

export type PageControlVariant = 'dots' | 'pill'

export interface PageControlProps {
  /** Total number of pages */
  totalPages: number
  /** Currently active page (0-indexed) */
  currentPage: number
  /** Called when a dot is pressed */
  onPageChange?: (page: number) => void
  /** Visual variant — "dots" (default) or "pill" (glass capsule background) */
  variant?: PageControlVariant
  /** Additional styles */
  style?: StyleProp<ViewStyle>
  /** Test ID */
  testID?: string
}
