/**
 * ListItem component types
 * Comprehensive type definitions for all list item variants
 */

import type { ViewStyle, } from 'react-native'
import type React from 'react'

/**
 * List item variant types
 * Based on Figma Design System specifications
 */
export type ListItemVariant =
  | 'user-profile-01'
  | 'user-profile-02'
  | 'product'
  | 'search-result-01'
  | 'search-result-02'
  | 'search-result-03'
  | 'task'
  | 'song-title'
  | 'cloud-file'
  | 'phone-number'
  | 'integration'

/**
 * Base props shared across all variants
 */
export interface BaseListItemProps {
  /**
   * List item variant
   */
  variant: ListItemVariant

  /**
   * Press handler for entire item
   */
  onPress?: () => void

  /**
   * Custom container style
   */
  style?: ViewStyle

  /**
   * Accessibility label
   */
  accessibilityLabel?: string
}

/**
 * User Profile 01 props
 */
export interface UserProfile01Props extends BaseListItemProps {
  variant: 'user-profile-01'
  avatarSrc?: string
  avatarInitials?: string
  name: string
  username: string
  description?: string
  onFollowPress?: () => void
  showVerified?: boolean
}

/**
 * User Profile 02 props
 */
export interface UserProfile02Props extends BaseListItemProps {
  variant: 'user-profile-02'
  avatarSrc?: string
  avatarInitials?: string
  name: string
  username: string
  subscriptionDate?: string
  onViewProfilePress?: () => void
}

/**
 * Product props
 */
export interface ProductProps extends BaseListItemProps {
  variant: 'product'
  logo?: React.ReactNode
  logoSrc?: string
  name: string
  tags?: string[]
  count?: number
  onActionPress?: () => void
}

/**
 * Search Result 01 props
 */
export interface SearchResult01Props extends BaseListItemProps {
  variant: 'search-result-01'
  title: string
  timestamp?: string
  breadcrumbs?: Array<{ label: string; href?: string }>
  description: string
  onReadMorePress?: () => void
}

/**
 * Search Result 02 props
 */
export interface SearchResult02Props extends BaseListItemProps {
  variant: 'search-result-02'
  title: string
  description: string
  authorName: string
  authorAvatarSrc?: string
  authorAvatarInitials?: string
  updatedText?: string
}

/**
 * Search Result 03 props
 */
export interface SearchResult03Props extends BaseListItemProps {
  variant: 'search-result-03'
  icon?: React.ReactNode
  iconSrc?: string
  title: string
  description: string
}

/**
 * Task props
 */
export interface TaskProps extends BaseListItemProps {
  variant: 'task'
  iconColor?: 'success' | 'error' | 'warning' | 'info'
  icon?: React.ReactNode
  title: string
  metadata?: string
  updatedText?: string
}

/**
 * Song Title props
 */
export interface SongTitleProps extends BaseListItemProps {
  variant: 'song-title'
  imageSrc?: string
  imagePlaceholder?: boolean
  title: string
  type?: string
  artist?: string
  year?: string
}

/**
 * Cloud File props
 */
export interface CloudFileProps extends BaseListItemProps {
  variant: 'cloud-file'
  icon?: React.ReactNode
  iconSrc?: string
  name: string
  service?: string
  size?: string
}

/**
 * Phone Number props
 */
export interface PhoneNumberProps extends BaseListItemProps {
  variant: 'phone-number'
  flagIcon?: React.ReactNode
  flagSrc?: string
  countryCode: string
  countryName: string
}

/**
 * Integration props
 */
export interface IntegrationProps extends BaseListItemProps {
  variant: 'integration'
  icon?: React.ReactNode
  iconSrc?: string
  name: string
  onPress?: () => void
}

/**
 * ListItem props (discriminated union)
 */
export type ListItemProps =
  | UserProfile01Props
  | UserProfile02Props
  | ProductProps
  | SearchResult01Props
  | SearchResult02Props
  | SearchResult03Props
  | TaskProps
  | SongTitleProps
  | CloudFileProps
  | PhoneNumberProps
  | IntegrationProps
