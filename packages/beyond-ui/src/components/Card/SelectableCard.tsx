/**
 * SelectableCard component
 * A card that can be selected with visual feedback
 */

import type React from 'react'
import { forwardRef, type ComponentRef } from 'react'
import { Card } from './Card'
import type { CardProps } from './Card.types'
import { useThemeContext } from '../../theme'
import { colors } from '../../tokens'

export interface SelectableCardProps extends Omit<CardProps, 'onPress'> {
  /** Unique identifier for the card */
  id: string
  /** Whether the card is currently selected */
  isSelected?: boolean
  /** Callback when card is pressed */
  onPress?: (id?: string) => void
  /** Selection configuration */
  selection?: {
    enabled: boolean
    selectedBorderColor?: string
    selectedBgColor?: string
    selectedShadow?: string
  }
}

/**
 * SelectableCard - A card with selection state
 *
 * @example
 * ```tsx
 * <SelectableCard
 *   id="card-1"
 *   isSelected={selectedId === 'card-1'}
 *   onPress={(id) => setSelectedId(id)}
 *   selection={{ enabled: true }}
 * >
 *   <CardContent>Card content</CardContent>
 * </SelectableCard>
 * ```
 */
export const SelectableCard = forwardRef<
  ComponentRef<typeof Card>,
  SelectableCardProps
>(
  (
    {
      id,
      isSelected = false,
      onPress,
      selection,
      style,
      variant = 'elevated',
      children,
      ...props
    },
    ref
  ): React.ReactElement => {
    const { theme } = useThemeContext()

    // Build selection styles
    const selectionStyles = isSelected && selection?.enabled
      ? {
          borderColor: selection.selectedBorderColor || colors.border[theme].primary,
          backgroundColor: selection.selectedBgColor || colors.bg[theme].primarySubtle,
        }
      : {}

    return (
      <Card
        ref={ref}
        variant={variant}
        pressable={!!onPress}
        onPress={onPress ? () => onPress(id) : undefined}
        style={[
          style,
          selectionStyles,
        ]}
        {...props}
      >
        {children}
      </Card>
    )
  }
)

SelectableCard.displayName = 'SelectableCard'
