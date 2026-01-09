/**
 * TableCell component styles
 * All styles mapped from Figma Forsured Design System
 */

import type { ViewStyle, TextStyle } from 'react-native'
import { colors } from '../../tokens/colors'
import type { ThemeMode } from '../../tokens/colors'
import { spacing } from '../../tokens/spacing'
import { borderRadius } from '../../tokens/borders'
import { borderWidth } from '../../tokens/borders'
import { typography } from '../../tokens/typography'
import { shadows } from '../../tokens/shadows'
import type { TableCellType, TableCellState, TableCellAlign } from './TableCell.types'

/**
 * Base cell dimensions from Figma
 * Height: 68px
 * Padding: 20px (horizontal and vertical)
 */
const CELL_HEIGHT = 68
const CELL_PADDING = spacing[20]

/**
 * Cell style configuration interface
 */
export interface TableCellStyleConfig {
  container: ViewStyle
  text?: TextStyle
  descriptionText?: TextStyle
  iconColor?: string
}

/**
 * Get table cell styles based on type, state, alignment, and theme
 */
export function getTableCellStyles(
  type: TableCellType = 'interactive-default',
  state: TableCellState = 'default',
  align: TableCellAlign = 'left',
  theme: ThemeMode = 'light',
  width?: number | string
): TableCellStyleConfig {
  // Base container styles
  const baseContainer: ViewStyle = {
    height: CELL_HEIGHT,
    paddingHorizontal: CELL_PADDING,
    paddingVertical: CELL_PADDING,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: align === 'center' ? 'center' : align === 'right' ? 'flex-end' : 'flex-start',
    borderBottomWidth: borderWidth.thin,
    borderBottomColor: colors.border[theme].default,
    backgroundColor: colors.bg[theme].default,
    ...(width && { width: typeof width === 'number' ? width : width }),
  }

  // Base text styles
  const baseText: TextStyle = {
    fontFamily: typography.paragraph.s.regular.fontFamily,
    fontSize: typography.paragraph.s.regular.fontSize,
    fontWeight: typography.paragraph.s.regular.fontWeight,
    lineHeight: typography.paragraph.s.regular.lineHeight,
    color: colors.text[theme].primary,
    textAlign: align,
  }

  // Base description text styles
  const descriptionText: TextStyle = {
    ...baseText,
    fontWeight: typography.paragraph.s.regular.fontWeight,
    color: colors.text[theme].tertiary,
  }

  // Get type-specific styles
  return getTypeSpecificStyles(type, state, baseContainer, baseText, descriptionText, theme)
}

/**
 * Get type-specific styles
 */
function getTypeSpecificStyles(
  type: TableCellType,
  state: TableCellState,
  baseContainer: ViewStyle,
  baseText: TextStyle,
  descriptionText: TextStyle,
  theme: ThemeMode
): TableCellStyleConfig {
  // Interactive cells
  if (type.startsWith('interactive-')) {
    return getInteractiveCellStyles(type, state, baseContainer, baseText, theme)
  }

  // Empty cell
  if (type === 'empty') {
    return {
      container: {
        ...baseContainer,
        paddingHorizontal: 0,
        paddingVertical: 0,
      },
    }
  }

  // Guideline cells (vertical dividers)
  if (type.startsWith('guideline-vertical-')) {
    return {
      container: {
        ...baseContainer,
        paddingHorizontal: CELL_PADDING,
        paddingVertical: 0,
        justifyContent: 'center',
        alignItems: 'flex-start',
        borderBottomWidth: 0,
      },
    }
  }

  // Checkbox/Radio/Switch only cells
  if (type === 'checkbox-only' || type === 'radio-only' || type === 'switch-only') {
    return {
      container: {
        ...baseContainer,
        justifyContent: 'center',
        alignItems: 'center',
      },
    }
  }

  // Icon cells (open/close)
  if (type === 'icon-open' || type === 'icon-close') {
    return {
      container: {
        ...baseContainer,
        justifyContent: 'center',
        alignItems: 'center',
      },
      iconColor: colors.text[theme].secondary,
    }
  }

  // Status cell
  if (type === 'status') {
    return {
      container: {
        ...baseContainer,
        gap: spacing[6],
      },
    }
  }

  // Labels cell
  if (type === 'labels') {
    return {
      container: {
        ...baseContainer,
        gap: spacing[6],
        flexWrap: 'wrap',
      },
    }
  }

  // Actions cell
  if (type === 'actions') {
    return {
      container: {
        ...baseContainer,
        justifyContent: 'flex-end',
        gap: spacing[12],
      },
      iconColor: colors.text[theme].secondary,
    }
  }

  // More cell
  if (type === 'more') {
    return {
      container: {
        ...baseContainer,
        justifyContent: 'center',
        alignItems: 'center',
      },
      iconColor: colors.text[theme].primary,
    }
  }

  // Progress bar cell
  if (type === 'progress-bar') {
    return {
      container: {
        ...baseContainer,
        gap: spacing[6],
      },
    }
  }

  // Rating cell
  if (type === 'rating') {
    return {
      container: {
        ...baseContainer,
        gap: spacing[2],
        justifyContent: 'center',
      },
    }
  }

  // Chart cells
  if (type.startsWith('chart-')) {
    return {
      container: {
        ...baseContainer,
        gap: spacing[6],
      },
    }
  }

  // Default cell types (text, card, avatar, etc.)
  return {
    container: {
      ...baseContainer,
      gap: spacing[10],
    },
    text: baseText,
    descriptionText,
  }
}

/**
 * Get interactive cell styles based on state
 */
function getInteractiveCellStyles(
  type: TableCellType,
  state: TableCellState,
  baseContainer: ViewStyle,
  baseText: TextStyle,
  theme: ThemeMode
): TableCellStyleConfig {
  // Determine state from type if not explicitly provided
  let actualState: TableCellState = state
  if (type === 'interactive-hover') {
    actualState = 'hover'
  } else if (type === 'interactive-focused') {
    actualState = 'focused'
  } else if (type === 'interactive-error') {
    actualState = 'error'
  }

  switch (actualState) {
    case 'hover':
      return {
        container: {
          ...baseContainer,
          backgroundColor: colors.bg[theme].hover || colors.gray[50],
        },
        text: baseText,
      }

    case 'focused':
      return {
        container: {
          ...baseContainer,
          borderWidth: borderWidth.thin,
          borderColor: colors.gray[900],
          borderBottomColor: colors.border[theme].default,
          // Note: React Native doesn't support box-shadow spread well
          // For web, this would have: box-shadow: 0 0 0 4px rgba(206, 210, 218, 1), 0 0 0 2px rgba(255, 255, 255, 1)
        },
        text: baseText,
      }

    case 'error':
      return {
        container: {
          ...baseContainer,
          borderWidth: borderWidth.thin,
          borderColor: colors.error[400],
          borderBottomColor: colors.error[400],
          // Note: React Native doesn't support box-shadow spread well
          // For web, this would have: box-shadow: 0 0 0 4px rgba(255, 133, 133, 1), 0 0 0 2px rgba(255, 255, 255, 1)
        },
        text: {
          ...baseText,
          color: colors.error[500],
        },
      }

    case 'disabled':
      return {
        container: {
          ...baseContainer,
          backgroundColor: colors.bg[theme].disabled || colors.gray[50],
          opacity: 0.6,
        },
        text: {
          ...baseText,
          color: colors.text[theme].disabled,
        },
      }

    default:
      return {
        container: baseContainer,
        text: baseText,
      }
  }
}

/**
 * Get text cell styles with selection controls
 */
export function getTextCellStyles(
  state: TableCellState,
  align: TableCellAlign,
  theme: ThemeMode,
  width?: number | string
): TableCellStyleConfig {
  return getTableCellStyles('text-default', state, align, theme, width)
}

/**
 * Get checkbox/radio/switch cell styles
 */
export function getSelectionCellStyles(
  type: 'checkbox-only' | 'radio-only' | 'switch-only',
  theme: ThemeMode,
  width?: number | string
): TableCellStyleConfig {
  return getTableCellStyles(type, 'default', 'center', theme, width)
}

/**
 * Get icon cell styles
 */
export function getIconCellStyles(
  type: 'icon-open' | 'icon-close',
  theme: ThemeMode,
  width?: number | string
): TableCellStyleConfig {
  return getTableCellStyles(type, 'default', 'center', theme, width)
}
