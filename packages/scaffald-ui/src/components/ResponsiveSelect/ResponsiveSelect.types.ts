/**
 * ResponsiveSelect and AdaptiveSelectSheet type definitions
 */

import type { ReactNode } from 'react'
import type { ViewStyle, TextStyle } from 'react-native'
import type { SheetHeight } from '../Sheet/Sheet.types'

export interface ResponsiveSelectOption {
  value: string
  label: string
  /** Optional compact label shown in the trigger button (falls back to label) */
  triggerLabel?: string
  disabled?: boolean
}

export type ResponsiveSelectSize = 'sm' | 'md' | 'lg'

export interface ResponsiveSelectProps {
  /** Current selected value */
  value?: string
  /** Callback when value changes */
  onValueChange: (value: string) => void
  /** Placeholder text */
  placeholder?: string
  /** Options to display */
  options: ResponsiveSelectOption[]
  /** Label for the select field */
  label?: string
  /** Error message to display */
  error?: string
  /** Whether the select is disabled */
  disabled?: boolean
  /** Size of the select trigger */
  size?: ResponsiveSelectSize
  /** Sheet snap height for mobile (percentage 0–1, or use Sheet height presets) */
  sheetHeight?: number
  /** Sheet title for mobile */
  sheetTitle?: string
  /** Whether to show check indicator on selected item */
  showIndicator?: boolean
  /** Style override for the trigger (desktop: Dropdown trigger, mobile: Button) */
  triggerStyle?: ViewStyle
  /** Text style override for the trigger label (desktop only) */
  triggerTextStyle?: TextStyle
  testID?: string
}

export interface AdaptiveSelectSheetProps {
  /** Whether the sheet is visible */
  visible: boolean
  /** Callback when sheet should close */
  onClose: () => void
  /** Title shown in sheet header */
  title: string
  /** Option list content (e.g. list of Pressables) */
  children: ReactNode
  /** Height of the sheet */
  height?: SheetHeight
}
