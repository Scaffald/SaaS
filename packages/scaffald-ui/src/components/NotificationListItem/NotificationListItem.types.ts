/**
 * NotificationListItem component type definitions
 */

import type { ViewStyle, TextStyle } from 'react-native'
import type React from 'react'

/**
 * Notification list item variant
 */
export type NotificationListItemVariant =
  | 'double-cta'
  | 'single-cta'
  | 'double-link'
  | 'single-text'
  | 'file'

/**
 * Notification state
 */
export type NotificationState = 'new' | 'read' | 'hover'

/**
 * Action button configuration
 */
export interface NotificationAction {
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
 * Link configuration
 */
export interface NotificationLink {
  /**
   * Link label
   */
  label: string

  /**
   * Press handler
   */
  onPress: () => void
}

/**
 * File configuration (for file variant)
 */
export interface NotificationFile {
  /**
   * File name
   */
  name: string

  /**
   * File size (optional)
   */
  size?: string

  /**
   * File icon (optional)
   */
  icon?: React.ReactNode
}

/**
 * NotificationListItem component props
 */
export interface NotificationListItemProps {
  /**
   * Notification variant
   * @default 'single-text'
   */
  variant?: NotificationListItemVariant

  /**
   * Notification state
   * @default 'read'
   */
  state?: NotificationState

  /**
   * Avatar source URL
   */
  avatarSrc?: string

  /**
   * Avatar indicator color (for online status, etc.)
   */
  avatarIndicatorColor?: string

  /**
   * Notification content - supports rich text with name, action, and context
   * Example: "Tina Hernandez replied to your comment in Generic posts"
   */
  content: React.ReactNode

  /**
   * Timestamp text (e.g., "5 min ago")
   */
  timestamp?: string

  /**
   * Primary action buttons (for CTA variants)
   * Max 2 actions supported
   */
  actions?: NotificationAction[]

  /**
   * Link actions (for link variants)
   * Max 2 links supported
   */
  links?: NotificationLink[]

  /**
   * File configuration (for file variant)
   */
  file?: NotificationFile

  /**
   * Press handler for entire item
   */
  onPress?: () => void

  /**
   * Whether notification is disabled
   * @default false
   */
  disabled?: boolean

  /**
   * Custom container style
   */
  style?: ViewStyle

  /**
   * Custom content style
   */
  contentStyle?: TextStyle

  /**
   * Accessibility label
   */
  accessibilityLabel?: string
}