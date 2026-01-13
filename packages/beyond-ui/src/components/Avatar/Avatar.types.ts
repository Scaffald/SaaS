/**
 * Avatar component types
 */

import type { ReactNode } from 'react'
import type { ViewStyle, ImageSourcePropType } from 'react-native'

// Avatar sizes from Figma (in pixels)
export type AvatarSize = 16 | 20 | 24 | 32 | 36 | 40 | 48 | 56 | 64 | 72 | 80

// Avatar colors (ring/background colors)
export type AvatarColor = 'gray' | 'primary' | 'info' | 'success' | 'warning' | 'error'

// Status indicator types
export type AvatarStatus = 'online' | 'offline' | 'busy' | 'away'

// Base avatar props
export interface AvatarProps {
  /** Size in pixels */
  size?: AvatarSize
  /** Color for ring border or background */
  color?: AvatarColor
  /** Image source for photo type */
  src?: ImageSourcePropType | string
  /** Initials to display (e.g., "JD" for John Doe) */
  initials?: string
  /** Icon element for icon/logo type */
  icon?: ReactNode
  /** Alt text for image */
  alt?: string
  /** Show ring border */
  showRing?: boolean
  /** Status indicator */
  status?: AvatarStatus
  /** Custom badge element */
  badge?: ReactNode
  /** Verified badge */
  verified?: boolean
  /** Star badge */
  star?: boolean
  /** Custom container style */
  containerStyle?: ViewStyle
  /** Custom avatar style */
  avatarStyle?: ViewStyle
  /** Press handler */
  onPress?: () => void
  /** Error handler for image loading failures */
  onError?: (error: Error) => void
}

// Avatar group props
export interface AvatarGroupProps {
  /** Children avatars */
  children: ReactNode
  /** Size for all avatars */
  size?: AvatarSize
  /** Maximum number of avatars to show */
  max?: number
  /** Spacing between avatars (negative for overlap) */
  spacing?: number
  /** Custom container style */
  containerStyle?: ViewStyle
}

// Add avatar button props
export interface AddAvatarProps {
  /** Size in pixels */
  size?: AvatarSize
  /** Press handler */
  onPress?: () => void
  /** Custom container style */
  containerStyle?: ViewStyle
}
