/**
 * Tabs component styles
 * All styles mapped from Figma Forsured Design System
 */

import type { ViewStyle, TextStyle } from 'react-native'
import { colors } from '../../tokens/colors'
import type { ThemeMode } from '../../tokens/colors'
import { spacing } from '../../tokens/spacing'
import { typography } from '../../tokens/typography'
import { boxShadows } from '../../tokens/shadows'
import type {
  TabType,
  TabColor,
  TabSize,
  TabOrientation,
  TabStyleConfig,
} from './Tabs.types'

/**
 * Tab size configurations from Figma
 * - Small: 32px height (horizontal), 115px width (vertical), padding 16px h, 6px v
 * - Medium: 36px height (horizontal), 125px width (vertical), padding 16px h, 8px v
 * - Large: 44px height (horizontal), 136px width (vertical), padding 16px h, 12px v
 * Font: Paragraph S/Medium (14px, 500 weight, 20px line-height) for all sizes
 * Gap: 6px (icon to text)
 */
const sizeConfig = {
  sm: {
    height: 32,
    width: 115, // Vertical width
    paddingHorizontal: spacing[16],
    paddingVertical: spacing[6],
    gap: spacing[6],
    iconSize: 20,
    fontSize: typography.small.fontSize, // 14
    lineHeight: typography.small.lineHeight, // 20
    fontWeight: typography.bodyMedium.fontWeight, // 500
  },
  md: {
    height: 36,
    width: 125, // Vertical width
    paddingHorizontal: spacing[16],
    paddingVertical: spacing[8],
    gap: spacing[6],
    iconSize: 20,
    fontSize: typography.small.fontSize, // 14
    lineHeight: typography.small.lineHeight, // 20
    fontWeight: typography.bodyMedium.fontWeight, // 500
  },
  lg: {
    height: 44,
    width: 136, // Vertical width
    paddingHorizontal: spacing[16],
    paddingVertical: spacing[12],
    gap: spacing[6],
    iconSize: 20,
    fontSize: typography.small.fontSize, // 14
    lineHeight: typography.small.lineHeight, // 20
    fontWeight: typography.bodyMedium.fontWeight, // 500
  },
} as const

/**
 * Get tab container styles for Tabs root component
 */
export function getTabsStyles(
  orientation: TabOrientation,
  fullWidth: boolean,
  _theme: ThemeMode = 'light'
): ViewStyle {
  return {
    flexDirection: orientation === 'horizontal' ? 'row' : 'column',
    ...(fullWidth && { width: '100%' }),
  }
}

/**
 * Get tab list container styles (for triggers only in horizontal layout)
 */
export function getTabListStyles(
  orientation: TabOrientation,
  _theme: ThemeMode = 'light'
): ViewStyle {
  return {
    flexDirection: orientation === 'horizontal' ? 'row' : 'column',
    alignItems: orientation === 'horizontal' ? 'flex-start' : 'stretch',
    width: '100%',
  }
}

/**
 * Get tab trigger styles based on variant, size, orientation, state, and theme
 */
export function getTabTriggerStyles(
  type: TabType,
  color: TabColor,
  size: TabSize,
  orientation: TabOrientation,
  isSelected: boolean,
  isDisabled: boolean,
  isHovered: boolean,
  iconOnly: boolean,
  theme: ThemeMode = 'light',
  triggerSizing: 'auto' | 'equal' | 'fixed' = 'auto'
): TabStyleConfig {
  const sizeStyles = sizeConfig[size]
  const isHorizontal = orientation === 'horizontal'

  // Base container styles
  const container: ViewStyle = {
    flexDirection: isHorizontal ? 'row' : 'column',
    alignItems: 'center',
    justifyContent: 'center',
    gap: sizeStyles.gap,
    paddingHorizontal: sizeStyles.paddingHorizontal,
    paddingVertical: sizeStyles.paddingVertical,
    // Prevent container from growing/shrinking based on content by default
    flexShrink: 0,
    flexGrow: 0,
    ...(isHorizontal
      ? {
          height: sizeStyles.height,
          minHeight: sizeStyles.height,
          // Width handling based on triggerSizing prop
          ...(triggerSizing === 'equal'
            ? {
                flex: 1, // Equal width for all tabs
                flexGrow: 1,
                flexShrink: 1,
              }
            : triggerSizing === 'fixed'
            ? {
                // Fixed width based on size (horizontal only)
                width: sizeStyles.width || 150, // Use vertical width as base or fallback
                minWidth: sizeStyles.width || 150,
              }
            : {
                // Auto - width based on content, but with min constraint
                minWidth: iconOnly ? sizeStyles.height : undefined,
              }),
        }
      : {
          width: sizeStyles.width,
          minWidth: sizeStyles.width,
        }),
  }

  // Text styles
  const text: TextStyle = {
    fontFamily: typography.bodyMedium.fontFamily,
    fontSize: sizeStyles.fontSize,
    fontWeight: sizeStyles.fontWeight,
    lineHeight: sizeStyles.lineHeight,
    textAlign: 'center',
  }

  // Color configuration based on color variant and state
  let textColor: string
  let iconColor: string
  let backgroundColor: string | undefined
  let borderBottomWidth: number | undefined
  let borderBottomColor: string | undefined
  let borderRightWidth: number | undefined
  let borderRightColor: string | undefined
  let boxShadow: string | undefined

  // Determine colors based on state
  if (isDisabled) {
    textColor = colors.text[theme].disabled
    iconColor = colors.text[theme].disabled
  } else if (isSelected) {
    // Selected state colors
    if (color === 'primary') {
      textColor = colors.primary[600] // #d54e21
      iconColor = colors.primary[600]
    } else {
      textColor = colors.text[theme].primary // #141c25
      iconColor = colors.text[theme].primary
    }
  } else {
    // Unselected state
    textColor = colors.text[theme].tertiary // #637083
    iconColor = colors.text[theme].tertiary
  }

  // Apply type-specific styles
  if (type === 'default') {
    // Always use consistent 2px border to prevent layout shifts
    // Use border color to differentiate states instead of width changes
    if (isHorizontal) {
      borderBottomWidth = 2
    } else {
      borderRightWidth = 2
    }
    // Default type: Background color + border indicator
    if (isSelected && !isDisabled) {
      // Selected: background + 2px bottom border in theme color
      backgroundColor = colors.bg[theme].emphasis // Base/200 #e4e7ec for selected background
      if (isHorizontal) {
        borderBottomColor = color === 'primary' ? colors.primary[600] : colors.text[theme].primary
      } else {
        borderRightColor = color === 'primary' ? colors.primary[600] : colors.text[theme].primary
      }
    } else {
      // Unselected: transparent background + 2px border in subtle gray
      backgroundColor = 'transparent'
      if (isHorizontal) {
        // Use a very subtle border color for unselected (appears thinner visually)
        borderBottomColor = colors.border[theme].default // #e4e7ec
      } else {
        borderRightColor = colors.border[theme].default
      }
    }

    // Hover state (web only) - light background tint
    if (isHovered && !isSelected && !isDisabled) {
      backgroundColor = colors.bg[theme].subtle
    }
  } else if (type === 'line') {
    // Line type: Border/underline indicator only, no background changes
    // Always use consistent 2px border to prevent layout shifts
    if (isHorizontal) {
      borderBottomWidth = 2
    } else {
      borderRightWidth = 2
    }
    backgroundColor = 'transparent'
    if (isSelected && !isDisabled) {
      // Selected: 2px underline/border in theme color
      if (isHorizontal) {
        borderBottomColor = color === 'primary' ? colors.primary[600] : colors.text[theme].primary
      } else {
        borderRightColor = color === 'primary' ? colors.primary[600] : colors.text[theme].primary
      }
    } else {
      // Unselected: 2px underline/border in subtle gray (appears thinner visually)
      if (isHorizontal) {
        borderBottomColor = colors.border[theme].default // #e4e7ec
      } else {
        borderRightColor = colors.border[theme].default
      }
    }

    // Hover state (web only) - light background tint
    if (isHovered && !isSelected && !isDisabled) {
      backgroundColor = colors.bg[theme].subtle
    }
  } else if (type === 'shadow') {
    // Shadow type: Box shadow for selected tab, no borders
    backgroundColor = isSelected && !isDisabled ? colors.bg[theme].default : 'transparent'
    if (isSelected && !isDisabled) {
      // Apply shadow for selected tab
      boxShadow = boxShadows.tabs // '0 1px 3px 0 rgba(20, 28, 37, 0.051)'
    }
    // Remove borders for shadow type (always, not just when selected)
    borderBottomWidth = undefined
    borderRightWidth = undefined

    // Hover state (web only) - light background tint
    if (isHovered && !isSelected && !isDisabled) {
      backgroundColor = colors.bg[theme].subtle
    }
  }

  // Apply colors and borders to container
  container.backgroundColor = backgroundColor
  if (borderBottomWidth !== undefined) {
    container.borderBottomWidth = borderBottomWidth
    if (borderBottomColor) {
      container.borderBottomColor = borderBottomColor
    }
  }
  if (borderRightWidth !== undefined) {
    container.borderRightWidth = borderRightWidth
    if (borderRightColor) {
      container.borderRightColor = borderRightColor
    }
  }
  if (boxShadow && typeof boxShadow === 'string') {
    container.boxShadow = boxShadow
  }

  // Apply text color
  text.color = textColor

  return {
    container,
    text,
    iconColor,
  }
}

/**
 * Get styles for TabContent component
 */
export interface TabContentStyleConfig {
  container: ViewStyle
  content: TextStyle
  customContent: ViewStyle
}

export function getTabContentStyles(
  contentVariant: 'default' | 'bordered',
  theme: ThemeMode
): TabContentStyleConfig {
  const container: ViewStyle = {
    paddingTop: spacing[12],
    gap: spacing[12],
  }

  // Add bordered variant styles
  if (contentVariant === 'bordered') {
    container.backgroundColor = colors.bg[theme].default
    container.borderWidth = 1
    container.borderColor = colors.border[theme].default
    container.borderRadius = 12 // borderRadius.m
    container.padding = spacing[16]
  }

  const content: TextStyle = {
    fontFamily: typography.body.fontFamily,
    fontSize: typography.body.fontSize,
    fontWeight: typography.body.fontWeight,
    lineHeight: typography.body.lineHeight,
    color: colors.text[theme].secondary,
  }

  const customContent: ViewStyle = {
    // Allow custom content to define its own styles
  }

  return {
    container,
    content,
    customContent,
  }
}

