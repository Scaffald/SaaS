/**
 * NavigationBar component types
 * iOS 26 top toolbar / navigation bar (iPhone + iPad)
 */

import type { ReactNode } from 'react'
import type { StyleProp, ViewStyle } from 'react-native'
import type { SegmentedControlProps } from '../SegmentedControl'
import type { SearchAccessoryProps } from '../SearchAccessory'

export type NavigationBarTitleSize = 'standard' | 'large'

export interface NavigationBarBackButton {
  /** Back button label (displayed next to chevron) */
  label?: string
  /** Press handler */
  onPress: () => void
  /** Override tint color */
  tintColor?: string
}

export interface NavigationBarProps {
  /** Navigation bar title */
  title: string
  /** Optional subtitle displayed below the title */
  subtitle?: string
  /** Whether to show the subtitle (default: true) */
  showSubtitle?: boolean
  /** Title display size — "standard" (17pt centered) or "large" (34pt bold left-aligned) */
  titleSize?: NavigationBarTitleSize
  /** Back button configuration */
  backButton?: NavigationBarBackButton
  /** Leading items (left side, after back button) */
  leadingItems?: ReactNode
  /** Trailing items (right side) */
  trailingItems?: ReactNode
  /** iPad: inline segmented control (replaces center title) */
  segmentedControl?: SegmentedControlProps
  /** iPad: search accessory row below the nav bar */
  searchAccessory?: SearchAccessoryProps
  /** Whether to apply glass background material */
  glass?: boolean
  /** Additional styles for the container */
  style?: StyleProp<ViewStyle>
  /** Test ID */
  testID?: string
}
