/**
 * SettingsNotificationTable component types
 */

import type { ViewStyle } from 'react-native'

export interface NotificationPreference {
  /**
   * Unique identifier for the notification
   */
  id: string

  /**
   * Notification name/type
   */
  name: string

  /**
   * Category this notification belongs to
   */
  category: string

  /**
   * Email notification enabled
   */
  email: boolean

  /**
   * Mobile notification enabled
   */
  mobile: boolean

  /**
   * Inbox notification enabled
   */
  inbox: boolean

  /**
   * Browser notification enabled
   */
  browser: boolean
}

export interface SettingsNotificationTableProps {
  /**
   * Notification preferences data
   */
  preferences: NotificationPreference[]

  /**
   * Callback when a preference changes
   */
  onPreferenceChange?: (id: string, channel: 'email' | 'mobile' | 'inbox' | 'browser', enabled: boolean) => void

  /**
   * Custom container style
   */
  style?: ViewStyle
}
