/**
 * SettingsPageLayout component types
 */

import type { ViewStyle } from 'react-native'
import type { ReactNode } from 'react'

export interface SettingsTab {
  /**
   * Tab identifier
   */
  id: string

  /**
   * Tab label
   */
  label: string

  /**
   * Tab icon component (optional)
   */
  icon?: React.ComponentType<{ size: number; color: string }>

  /**
   * Whether the tab is disabled
   */
  disabled?: boolean
}

export interface SettingsPageLayoutProps {
  /**
   * Tabs for navigation
   */
  tabs: SettingsTab[]

  /**
   * Currently active tab ID
   */
  activeTabId: string

  /**
   * Callback when tab changes
   */
  onTabChange?: (tabId: string) => void

  /**
   * Content to display
   */
  children: ReactNode

  /**
   * Custom container style
   */
  style?: ViewStyle

  /**
   * Custom content style
   */
  contentStyle?: ViewStyle
}
