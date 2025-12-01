import type { ColorTokens } from '@tamagui/core'
import type { ReactNode } from 'react'

/**
 * Component-specific types that are shared across component families
 */

/**
 * Card header configuration
 */
export interface CardHeaderProps {
  /** Main title text */
  title: string
  /** Optional subtitle text or element */
  subtitle?: string | ReactNode
  /** Optional icon to display before title */
  icon?: ReactNode
  /** Optional badge/chip to display in header */
  badge?: ReactNode
  /** Text color for selected state */
  isSelected?: boolean
}

/**
 * Metadata item configuration for cards and other components
 */
export interface MetadataItem {
  /** Unique key for the item */
  key: string
  /** Icon to display */
  icon: ReactNode
  /** Label text */
  label: string
  /** Optional color override */
  color?: ColorTokens
}

/**
 * Card metadata section props
 */
export interface CardMetadataProps {
  /** Array of metadata items to display */
  items: MetadataItem[]
  /** Whether the card is selected */
  isSelected?: boolean
  /** Maximum number of items to show before overflow */
  maxItems?: number
}

/**
 * Badge/Chip configuration
 */
export interface BadgeConfig {
  /** Unique key for the badge */
  key: string
  /** Badge label text */
  label: string
  /** Badge background color */
  bg?: ColorTokens | string
  /** Badge text color */
  color?: ColorTokens | string
  /** Optional icon */
  icon?: ReactNode
}

/**
 * Card badges section props
 */
export interface CardBadgesProps {
  /** Array of badges to display */
  badges: BadgeConfig[]
  /** Whether the card is selected */
  isSelected?: boolean
  /** Maximum number of badges to show */
  maxVisible?: number
}

/**
 * Action button configuration
 */
export interface ActionButton {
  /** Button label */
  label: string
  /** Button press handler */
  onPress: () => void
  /** Button theme */
  theme?: string
  /** Button variant */
  variant?: 'primary' | 'secondary' | 'outline'
  /** Whether button is disabled */
  disabled?: boolean
}

/**
 * Card actions section props
 */
export interface CardActionsProps {
  /** Array of action buttons */
  actions: ActionButton[]
  /** Whether the card is selected */
  isSelected?: boolean
}


