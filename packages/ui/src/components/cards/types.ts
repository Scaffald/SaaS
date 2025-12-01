import type { ColorTokens, SpaceTokens } from '@tamagui/core'
import type { ReactNode } from 'react'
import type { TamaguiElement } from 'tamagui'

/**
 * Base card props shared across all card variants
 */
export interface BaseCardProps {
  /** Card ID for selection tracking */
  id: string
  /** Whether the card is currently selected */
  isSelected?: boolean
  /** Callback when card is pressed/clicked */
  onPress?: () => void
  /** Whether the card is disabled */
  disabled?: boolean
  /** Additional className for styling */
  className?: string
  /** Children content */
  children?: ReactNode
}

/**
 * Selection state configuration
 */
export interface SelectionConfig {
  /** Whether selection is enabled */
  enabled: boolean
  /** Border color when selected */
  selectedBorderColor?: ColorTokens
  /** Background color when selected */
  selectedBgColor?: ColorTokens
  /** Text color when selected */
  selectedTextColor?: ColorTokens
  /** Shadow configuration when selected */
  selectedShadow?: string
}

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
 * Metadata item configuration
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

/**
 * Complete selectable card props
 */
export interface SelectableCardProps extends BaseCardProps {
  /** Selection configuration */
  selection?: SelectionConfig
  /** Forward ref */
  ref?: React.Ref<TamaguiElement>
  /** Custom padding */
  padding?: SpaceTokens
  /** Custom gap between children */
  gap?: SpaceTokens
}
