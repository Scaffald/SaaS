/**
 * BottomToolbar component types
 * iOS 26 bottom toolbar with buttons, search, or page control
 */

import type { ReactNode } from 'react'
import type { StyleProp, ViewStyle } from 'react-native'
import type { ToolbarButtonConfig } from '../ToolbarButton'
import type { ToolbarSearchBarProps } from '../ToolbarSearchBar'

export type BottomToolbarVariant = 'buttons' | 'search' | 'pageControl'

export interface BottomToolbarPageControl {
  /** Total number of pages */
  count: number
  /** Currently active page (0-indexed) */
  current: number
  /** Called when page changes */
  onChange?: (page: number) => void
}

export interface BottomToolbarProps {
  /** Toolbar content variant */
  variant?: BottomToolbarVariant
  /** Buttons to display (for "buttons" variant) */
  buttons?: ToolbarButtonConfig[]
  /** Search bar props (for "search" variant) */
  searchBar?: ToolbarSearchBarProps
  /** Page control config (for "pageControl" variant) */
  pageControl?: BottomToolbarPageControl
  /** Buttons before page control */
  leadingButtons?: ToolbarButtonConfig[]
  /** Buttons after page control */
  trailingButtons?: ToolbarButtonConfig[]
  /** Custom children (overrides variant content) */
  children?: ReactNode
  /** Additional styles */
  style?: StyleProp<ViewStyle>
  /** Test ID */
  testID?: string
}
