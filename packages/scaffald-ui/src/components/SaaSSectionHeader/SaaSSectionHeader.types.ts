/**
 * SaaSSectionHeader component type definitions
 */

import type { ViewStyle, TextStyle } from 'react-native'
import type React from 'react'
import type { IconComponent } from '../types'

/**
 * Section header variant
 */
export type SaaSSectionHeaderVariant =
  | 'default'
  | 'ctas'
  | 'search'
  | 'time-period'
  | 'tabs'
  | 'sub-header'

/**
 * Action button configuration
 */
export interface SectionHeaderAction {
  /**
   * Button label
   */
  label: string

  /**
   * Press handler
   */
  onPress: () => void

  /**
   * Button variant (primary/secondary)
   */
  variant?: 'primary' | 'secondary'
}

/**
 * Time period option
 */
export interface TimePeriodOption {
  /**
   * Period label (e.g., "Last 7 days")
   */
  label: string

  /**
   * Period value
   */
  value: string
}

/**
 * SaaSSectionHeader component props
 */
export interface SaaSSectionHeaderProps {
  /**
   * Header variant
   * @default 'default'
   */
  variant?: SaaSSectionHeaderVariant

  /**
   * Section title
   */
  title: string

  /**
   * Section description (optional)
   */
  description?: string

  /**
   * Featured icon component
   */
  featuredIcon?: IconComponent

  /**
   * Whether to show featured icon
   * @default true
   */
  showIcon?: boolean

  /**
   * Whether to show description
   * @default true
   */
  showDescription?: boolean

  /**
   * Whether tabs are shown below header
   * @default false
   */
  tabsBelow?: boolean

  /**
   * Action buttons (for CTAs variant)
   */
  actions?: SectionHeaderAction[]

  /**
   * Search value (for Search variant)
   */
  searchValue?: string

  /**
   * Search placeholder
   */
  searchPlaceholder?: string

  /**
   * Search change handler (for Search variant)
   */
  onSearchChange?: (value: string) => void

  /**
   * Selected time period (for Time Period variant)
   */
  selectedTimePeriod?: string

  /**
   * Time period options (for Time Period variant)
   */
  timePeriodOptions?: TimePeriodOption[]

  /**
   * Time period change handler (for Time Period variant)
   */
  onTimePeriodChange?: (value: string) => void

  /**
   * Tabs component to render below header (for Tabs variant or tabsBelow=true)
   */
  tabs?: React.ReactNode

  /**
   * Custom container style
   */
  style?: ViewStyle

  /**
   * Custom title style
   */
  titleStyle?: TextStyle

  /**
   * Custom description style
   */
  descriptionStyle?: TextStyle
}