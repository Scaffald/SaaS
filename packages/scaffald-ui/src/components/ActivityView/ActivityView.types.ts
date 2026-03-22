/**
 * ActivityView (Share Sheet) component types
 * iOS 26 share sheet with glassmorphic design
 */

import type { ViewStyle, ImageSourcePropType } from 'react-native'

/**
 * Contact displayed in the share sheet header row
 */
export interface ActivityViewContact {
  /** Contact name */
  name: string
  /** Avatar image source (URI string or require()) */
  avatar?: string | ImageSourcePropType
}

/**
 * App displayed in the app icon row (AirDrop, Messages, etc.)
 */
export interface ActivityViewApp {
  /** App name */
  name: string
  /** App icon (rendered as React node) */
  icon: React.ReactNode
  /** Callback when app is selected */
  onPress: () => void
}

/**
 * Quick action displayed in the action grid (Copy, Add to Favorites, etc.)
 */
export interface ActivityViewAction {
  /** Action label */
  label: string
  /** Action icon */
  icon: React.ReactNode
  /** Callback when action is pressed */
  onPress: () => void
  /** Renders in destructive red */
  destructive?: boolean
}

/**
 * List item within a grouped section
 */
export interface ActivityViewListItem {
  /** Item label */
  label: string
  /** Leading icon */
  icon: React.ReactNode
  /** Callback when item is pressed */
  onPress: () => void
}

/**
 * Grouped section of list items
 */
export interface ActivityViewSection {
  /** Optional section header */
  title?: string
  /** Items in this section */
  items: ActivityViewListItem[]
}

/**
 * ActivityView (Share Sheet) props
 */
export interface ActivityViewProps {
  /** Controls visibility */
  visible: boolean
  /** Called when share sheet should close */
  onClose: () => void
  /** Content title (e.g. document name) */
  title?: string
  /** Content subtitle (e.g. URL or description) */
  subtitle?: string
  /** Content thumbnail image source */
  thumbnail?: string | ImageSourcePropType
  /** Collaborate button config */
  collaborate?: {
    label: string
    onPress: () => void
    subtitle?: string
  }
  /** Contacts row */
  contacts?: ActivityViewContact[]
  /** App icons row */
  apps?: ActivityViewApp[]
  /** Quick action grid */
  actions?: ActivityViewAction[]
  /** Grouped list sections */
  sections?: ActivityViewSection[]
  /** Footer edit actions button */
  onEditActions?: () => void
  /** Custom style */
  style?: ViewStyle
}
