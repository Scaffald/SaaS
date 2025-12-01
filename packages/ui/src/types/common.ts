import type { ColorTokens, SpaceTokens } from '@tamagui/core'
import type { ReactNode } from 'react'
import type { TamaguiElement } from 'tamagui'

/**
 * Common component prop patterns shared across multiple components
 */

/**
 * Base props for selectable/interactive components
 */
export interface BaseSelectableProps {
  /** Component ID for tracking/selection */
  id: string
  /** Whether the component is currently selected */
  isSelected?: boolean
  /** Callback when component is pressed/clicked */
  onPress?: () => void
  /** Whether the component is disabled */
  disabled?: boolean
  /** Additional className for styling */
  className?: string
  /** Children content */
  children?: ReactNode
}

/**
 * Selection state configuration for selectable components
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
 * Common styling props for components with customizable spacing
 */
export interface SpacingProps {
  /** Custom padding */
  padding?: SpaceTokens
  /** Custom gap between children */
  gap?: SpaceTokens
}

/**
 * Common props for components that can be forwarded a ref
 */
export interface RefForwardingProps {
  /** Forward ref */
  ref?: React.Ref<TamaguiElement>
}

/**
 * Base card props - extends BaseSelectableProps with card-specific patterns
 */
export interface BaseCardProps extends BaseSelectableProps {}

