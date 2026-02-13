/**
 * Skeleton component types
 * Loading placeholder components for showing content structure while loading
 */

import type { ReactNode } from 'react'
import type { ViewStyle, StyleProp, DimensionValue } from 'react-native'

/**
 * Skeleton shape variants
 */
export type SkeletonShape = 'rectangle' | 'circle' | 'text'

/**
 * Skeleton animation variants
 */
export type SkeletonAnimation = 'pulse' | 'wave' | 'none'

/**
 * Skeleton component props
 */
export interface SkeletonProps {
  /** Width of the skeleton */
  width?: DimensionValue
  /** Height of the skeleton */
  height?: DimensionValue
  /** Shape variant */
  shape?: SkeletonShape
  /** Border radius (overrides shape default) */
  borderRadius?: number
  /** Animation type */
  animation?: SkeletonAnimation
  /** Animation duration in milliseconds */
  animationDuration?: number
  /** Additional styles */
  style?: StyleProp<ViewStyle>
  /** Test ID for testing */
  testID?: string
}

/**
 * SkeletonText component props
 * Renders multiple lines of text-shaped skeletons
 */
export interface SkeletonTextProps {
  /** Number of lines to render */
  lines?: number
  /** Width of the last line (percentage or 'auto') */
  lastLineWidth?: DimensionValue
  /** Gap between lines */
  gap?: number
  /** Line height */
  lineHeight?: number
  /** Animation type */
  animation?: SkeletonAnimation
  /** Animation duration in milliseconds */
  animationDuration?: number
  /** Additional styles */
  style?: StyleProp<ViewStyle>
  /** Test ID for testing */
  testID?: string
}

/**
 * SkeletonAvatar component props
 * Renders a circular avatar-shaped skeleton
 */
export interface SkeletonAvatarProps {
  /** Size of the avatar (width and height) */
  size?: number
  /** Animation type */
  animation?: SkeletonAnimation
  /** Animation duration in milliseconds */
  animationDuration?: number
  /** Additional styles */
  style?: StyleProp<ViewStyle>
  /** Test ID for testing */
  testID?: string
}

/**
 * SkeletonCard component props
 * Renders a card-like skeleton with configurable sections
 */
export interface SkeletonCardProps {
  /** Whether to show an image/media section */
  hasMedia?: boolean
  /** Height of the media section */
  mediaHeight?: number
  /** Whether to show an avatar in header */
  hasAvatar?: boolean
  /** Number of text lines */
  textLines?: number
  /** Animation type */
  animation?: SkeletonAnimation
  /** Animation duration in milliseconds */
  animationDuration?: number
  /** Additional styles */
  style?: StyleProp<ViewStyle>
  /** Test ID for testing */
  testID?: string
}

/**
 * SkeletonGroup component props
 * Wraps skeleton items with shared animation timing
 */
export interface SkeletonGroupProps {
  /** Children to wrap */
  children: ReactNode
  /** Animation type for all children */
  animation?: SkeletonAnimation
  /** Animation duration for all children */
  animationDuration?: number
  /** Gap between skeleton items */
  gap?: number
  /** Horizontal or vertical layout */
  direction?: 'row' | 'column'
  /** Additional styles */
  style?: StyleProp<ViewStyle>
}

/**
 * SkeletonBox component props (alias for rectangle Skeleton, parity with @unicornlove/ui)
 */
export interface SkeletonBoxProps {
  width?: DimensionValue
  height?: DimensionValue
  borderRadius?: number
  /** Whether animation is enabled */
  animated?: boolean
  style?: StyleProp<ViewStyle>
  testID?: string
}

/**
 * SkeletonForm component props
 */
export interface SkeletonFormProps {
  /** Number of form fields to render */
  fields?: number
  /** Gap between fields */
  gap?: number
  animation?: SkeletonAnimation
  animationDuration?: number
  style?: StyleProp<ViewStyle>
  testID?: string
}

/**
 * SkeletonList component props
 */
export interface SkeletonListProps {
  /** Number of skeleton items to render */
  count?: number
  /** Gap between items */
  gap?: number
  /** Variant of skeleton cards: job (media+avatar), profile (avatar), organization (media) */
  variant?: 'job' | 'profile' | 'organization'
  animation?: SkeletonAnimation
  animationDuration?: number
  style?: StyleProp<ViewStyle>
  testID?: string
}
