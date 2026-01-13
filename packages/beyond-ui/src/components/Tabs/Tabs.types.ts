/**
 * Tabs component types
 * Mapped from Figma Forsured Design System
 */

import type { ReactNode } from 'react'
import type { ViewStyle, TextStyle, PressableProps } from 'react-native'

/**
 * Tab type variants
 * - default: Background color changes on selection
 * - line: Border/underline indicator (2px selected, 1px unselected)
 * - shadow: Box shadow for selected tab
 */
export type TabType = 'default' | 'line' | 'shadow'

/**
 * Tab color variants
 * - gray: Base Gray color scheme
 * - primary: Primary Brand color scheme
 */
export type TabColor = 'gray' | 'primary'

/**
 * Tab size variants
 * - sm: Small (32px height horizontal, 115px width vertical)
 * - md: Medium (36px height horizontal, 125px width vertical)
 * - lg: Large (44px height horizontal, 136px width vertical)
 */
export type TabSize = 'sm' | 'md' | 'lg'

/**
 * Tab orientation
 * - horizontal: Tabs arranged horizontally (default)
 * - vertical: Tabs arranged vertically
 */
export type TabOrientation = 'horizontal' | 'vertical'

/**
 * Tab content variant
 * - default: Simple content with minimal padding
 * - bordered: Content with border, padding, and background for visual grouping
 */
export type TabContentVariant = 'default' | 'bordered'

/**
 * Tab state
 * - default: Unselected tab
 * - hover: Hover state (web only)
 * - selected: Active tab
 * - disabled: Disabled tab
 */
export type TabState = 'default' | 'hover' | 'selected' | 'disabled'

/**
 * Root Tabs component props
 */
export interface TabsProps {
  /**
   * Current active tab value (controlled mode)
   */
  value?: string

  /**
   * Default active tab value (uncontrolled mode)
   */
  defaultValue?: string

  /**
   * Callback when active tab changes
   */
  onValueChange?: (value: string) => void

  /**
   * Tab type variant
   * @default 'default'
   */
  type?: TabType

  /**
   * Tab color variant
   * @default 'gray'
   */
  color?: TabColor

  /**
   * Tab size variant
   * @default 'md'
   */
  size?: TabSize

  /**
   * Tab orientation
   * @default 'horizontal'
   */
  orientation?: TabOrientation

  /**
   * Disable all tabs
   * @default false
   */
  disabled?: boolean

  /**
   * Full width tabs
   * @default false
   */
  fullWidth?: boolean

  /**
   * Content variant styling
   * @default 'default'
   */
  contentVariant?: TabContentVariant

  /**
   * Tab trigger sizing mode
   * - 'auto': Width based on content (default)
   * - 'equal': All tabs have equal width (flex: 1)
   * - 'fixed': Fixed width based on size variant (horizontal only)
   * @default 'auto'
   */
  triggerSizing?: 'auto' | 'equal' | 'fixed'

  /**
   * Children tab items
   */
  children: ReactNode

  /**
   * Custom container style
   */
  containerStyle?: ViewStyle
}

/**
 * Tab item props
 * Individual tab item wrapper
 */
export interface TabItemProps {
  /**
   * Unique value for this tab
   */
  value: string

  /**
   * Whether this tab is disabled
   * @default false
   */
  disabled?: boolean

  /**
   * Children (TabTrigger and TabContent)
   */
  children: ReactNode

  /**
   * Custom container style
   */
  containerStyle?: ViewStyle
}

/**
 * Tab trigger props
 * Clickable tab button
 */
export interface TabTriggerProps extends Omit<PressableProps, 'style' | 'children'> {
  /**
   * Tab label content
   */
  children?: ReactNode

  /**
   * Icon to display at the start of the tab
   */
  iconStart?: React.ComponentType<{ size: number; color: string }>

  /**
   * Icon to display at the end of the tab
   */
  iconEnd?: React.ComponentType<{ size: number; color: string }>

  /**
   * Icon-only tab (no text)
   * @default false
   */
  iconOnly?: boolean

  /**
   * Custom container style
   */
  containerStyle?: ViewStyle

  /**
   * Custom text style
   */
  textStyle?: TextStyle

  /**
   * Press handler (optional, handled by Tabs context by default)
   */
  onPress?: () => void
}

/**
 * Tab content props
 * Panel content shown when tab is active
 */
export interface TabContentProps {
  /**
   * Content to display when tab is active
   */
  children: ReactNode

  /**
   * Custom container style
   */
  containerStyle?: ViewStyle

  /**
   * Custom content style
   */
  contentStyle?: TextStyle
}

/**
 * Tabs context value
 * Shared state and handlers for tabs component
 */
export interface TabsContextValue {
  /**
   * Current selected tab value
   */
  value: string

  /**
   * Handler to change selected tab
   */
  onValueChange: (value: string) => void

  /**
   * Tab type variant
   */
  type: TabType

  /**
   * Tab color variant
   */
  color: TabColor

  /**
   * Tab size variant
   */
  size: TabSize

  /**
   * Tab orientation
   */
  orientation: TabOrientation

  /**
   * Whether all tabs are disabled
   */
  disabled: boolean

  /**
   * Whether tabs should be full width
   */
  fullWidth: boolean

  /**
   * Content variant styling
   */
  contentVariant: TabContentVariant

  /**
   * Tab trigger sizing mode
   */
  triggerSizing: 'auto' | 'equal' | 'fixed'
}

/**
 * Tab item context value
 * Item-specific state
 */
export interface TabItemContextValue {
  /**
   * Whether this tab is selected
   */
  isSelected: boolean

  /**
   * Whether this tab is disabled
   */
  disabled: boolean

  /**
   * Tab value
   */
  value: string
}

/**
 * Tab style configuration
 * Returned from style functions
 */
export interface TabStyleConfig {
  /**
   * Container style for tab trigger
   */
  container: ViewStyle

  /**
   * Text style for tab label
   */
  text: TextStyle

  /**
   * Icon color
   */
  iconColor: string
}

