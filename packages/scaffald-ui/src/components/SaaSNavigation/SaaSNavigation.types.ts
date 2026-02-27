/**
 * SaaSNavigation component type definitions
 */

import type { ViewStyle, TextStyle } from 'react-native'
import type React from 'react'
import type { IconComponent } from '../types'
import type { BreadcrumbItemData } from '../Breadcrumb'

/**
 * Navigation variant
 */
export type SaaSNavigationVariant =
  | 'main'
  | 'finance-banking'
  | 'left-side-links'
  | 'footer'
  | 'onboarding'

/**
 * Action button configuration
 */
export interface NavigationAction {
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
 * Avatar data for avatar group
 */
export interface NavigationAvatar {
  /**
   * Avatar source URL
   */
  src?: string

  /**
   * Avatar initials
   */
  initials?: string

  /**
   * Avatar alt text
   */
  alt?: string
}

/**
 * SaaSNavigation component props
 */
export interface SaaSNavigationProps {
  /**
   * Navigation variant
   * @default 'main'
   */
  variant?: SaaSNavigationVariant

  /**
   * Page title
   */
  pageTitle?: string

  /**
   * Page description
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
  showFeaturedIcon?: boolean

  /**
   * Whether to show page title
   * @default true
   */
  showPageTitle?: boolean

  /**
   * Whether to show description
   * @default true
   */
  showDescription?: boolean

  /**
   * Whether to show breadcrumbs
   * @default false
   */
  showBreadcrumbs?: boolean

  /**
   * Breadcrumb items
   */
  breadcrumbItems?: BreadcrumbItemData[]

  /**
   * Breadcrumb current index
   */
  breadcrumbCurrentIndex?: number

  /**
   * Breadcrumb item press handler
   */
  onBreadcrumbItemPress?: (index: number, item: BreadcrumbItemData) => void

  /**
   * Whether to show notifications
   * @default true
   */
  showNotifications?: boolean

  /**
   * Notification badge value
   */
  notificationBadge?: number | string

  /**
   * Notification press handler
   */
  onNotificationPress?: () => void

  /**
   * Search press handler
   */
  onSearchPress?: () => void

  /**
   * Whether to show avatar
   * @default true
   */
  showAvatar?: boolean

  /**
   * Avatar source URL
   */
  avatarSrc?: string

  /**
   * Avatar initials
   */
  avatarInitials?: string

  /**
   * Avatar press handler
   */
  onAvatarPress?: () => void

  /**
   * Whether to show avatar group
   * @default false
   */
  showAvatarGroup?: boolean

  /**
   * Avatar group items
   */
  avatarGroupItems?: NavigationAvatar[]

  /**
   * Whether to show CTAs
   * @default false
   */
  showCta?: boolean

  /**
   * CTA actions
   */
  ctaActions?: NavigationAction[]

  /**
   * Whether to show tabs
   * @default false
   */
  showTabs?: boolean

  /**
   * Tabs component to render below navigation
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

  /**
   * Accessibility label
   */
  accessibilityLabel?: string
}