/**
 * Tooltip Arrow component
 * Renders arrow pointing to tooltip trigger based on position
 * Uses View borders for cross-platform arrow rendering
 */

import { View, } from 'react-native'
import type { TooltipArrowProps } from './Tooltip.types'
import { getTooltipStyles } from './Tooltip.styles'
import { colors } from '../../tokens/colors'

/**
 * Tooltip Arrow component
 * Creates arrow using View borders similar to Dropdown caret
 */
export function TooltipArrow({ position, color }: TooltipArrowProps) {
  // If no arrow, don't render anything
  if (position === 'none') {
    return null
  }

  const _styles = getTooltipStyles('default', color)
  const arrowColor = color === 'primary' ? colors.primary[50] : colors.gray[100]

  // Arrow dimensions from design: 6px height, 13px width
  const arrowWidth = 13
  const arrowHeight = 6

  // Base arrow style - creates a downward pointing arrow using borders
  const createArrowStyle = () => {
    const baseStyle = {
      width: 0,
      height: 0,
      borderLeftWidth: arrowWidth / 2,
      borderRightWidth: arrowWidth / 2,
      borderLeftColor: 'transparent' as const,
      borderRightColor: 'transparent' as const,
      borderTopWidth: 0,
      borderBottomWidth: 0,
      borderTopColor: 'transparent' as const,
      borderBottomColor: 'transparent' as const,
    }

    switch (position) {
      case 'down-center':
      case 'down-left':
      case 'down-right': {
        // Arrow points up (tooltip is below, arrow points to trigger above)
        return {
          ...baseStyle,
          borderBottomWidth: arrowHeight,
          borderBottomColor: arrowColor,
        }
      }

      case 'up-center':
      case 'up-left':
      case 'up-right': {
        // Arrow points down (tooltip is above, arrow points to trigger below)
        return {
          ...baseStyle,
          borderTopWidth: arrowHeight,
          borderTopColor: arrowColor,
        }
      }

      case 'left': {
        // Arrow points right (tooltip is to left, arrow points to trigger on right)
        // Rotate 90 degrees: swap width/height and borders
        return {
          width: 0,
          height: 0,
          borderTopWidth: arrowWidth / 2,
          borderBottomWidth: arrowWidth / 2,
          borderTopColor: 'transparent' as const,
          borderBottomColor: 'transparent' as const,
          borderLeftWidth: 0,
          borderRightWidth: arrowHeight,
          borderLeftColor: 'transparent' as const,
          borderRightColor: arrowColor,
        }
      }

      case 'right': {
        // Arrow points left (tooltip is to right, arrow points to trigger on left)
        // Rotate 270 degrees: swap width/height and borders
        return {
          width: 0,
          height: 0,
          borderTopWidth: arrowWidth / 2,
          borderBottomWidth: arrowWidth / 2,
          borderTopColor: 'transparent' as const,
          borderBottomColor: 'transparent' as const,
          borderLeftWidth: arrowHeight,
          borderRightWidth: 0,
          borderLeftColor: arrowColor,
          borderRightColor: 'transparent' as const,
        }
      }

      default:
        return baseStyle
    }
  }

  // Container style for positioning arrow
  const getContainerStyle = () => {
    const baseContainer: Record<string, unknown> = {
      width: arrowWidth,
      height: arrowHeight,
      alignItems: 'center' as const,
      justifyContent: 'center' as const,
    }

    // For up/down positions, handle horizontal alignment
    if (position === 'up-left' || position === 'down-left') {
      baseContainer.alignItems = 'flex-start'
    } else if (position === 'up-right' || position === 'down-right') {
      baseContainer.alignItems = 'flex-end'
    }

    // For left/right positions, handle vertical alignment (center by default)
    if (position === 'left' || position === 'right') {
      baseContainer.width = arrowHeight
      baseContainer.height = arrowWidth
      baseContainer.justifyContent = 'center'
    }

    return baseContainer
  }

  const arrowStyle = createArrowStyle()
  const containerStyle = getContainerStyle()

  return (
    <View style={containerStyle}>
      <View style={arrowStyle} />
    </View>
  )
}

