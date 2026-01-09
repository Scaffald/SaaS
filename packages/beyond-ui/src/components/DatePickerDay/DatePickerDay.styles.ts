/**
 * DatePickerDay component styles
 * All styles mapped from Figma Forsured Design System
 */

import type { ViewStyle, TextStyle } from 'react-native'
import { Platform } from 'react-native'
import { colors } from '../../tokens/colors'
import type { ThemeMode } from '../../tokens/colors'
import { spacing } from '../../tokens/spacing'
import { borderRadius } from '../../tokens/borders'
import { typography, fontWeight } from '../../tokens/typography'
import type { DatePickerDayState } from './DatePickerDay.types'

/**
 * Indicator dot size from Figma
 */
const INDICATOR_SIZE = 4

/**
 * Get container styles based on state
 */
export function getContainerStyles(
  state: DatePickerDayState,
  disabled: boolean,
  theme: ThemeMode = 'light'
): ViewStyle {
  const baseContainer: ViewStyle = {
    flex: 1,
    minHeight: 40,
    padding: spacing[8],
    borderRadius: borderRadius.s,
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
  }

  if (disabled || state === 'empty') {
    return {
      ...baseContainer,
      opacity: 0.3,
    }
  }

  // Selected states
  if (state === 'selected' || state === 'selected-left' || state === 'selected-right') {
    const container: ViewStyle = {
      ...baseContainer,
      backgroundColor: colors.primary[500],
    }

    if (state === 'selected-left') {
      container.borderTopLeftRadius = borderRadius.s
      container.borderBottomLeftRadius = borderRadius.s
      container.borderTopRightRadius = 0
      container.borderBottomRightRadius = 0
    } else if (state === 'selected-right') {
      container.borderTopRightRadius = borderRadius.s
      container.borderBottomRightRadius = borderRadius.s
      container.borderTopLeftRadius = 0
      container.borderBottomLeftRadius = 0
    } else {
      container.borderRadius = borderRadius.s
    }

    return container
  }

  // Middle (in range) state
  if (state === 'middle') {
    return {
      ...baseContainer,
      backgroundColor: colors.primary[50],
    }
  }

  // Today state
  if (state === 'today') {
    return baseContainer
  }

  // Hover state (web only)
  if (state === 'hover' && Platform.OS === 'web') {
    return {
      ...baseContainer,
      backgroundColor: colors.bg[theme].subtle,
    }
  }

  // Default state
  return baseContainer
}

/**
 * Get text styles based on state
 */
export function getTextStyles(
  state: DatePickerDayState,
  disabled: boolean,
  isLabel: boolean,
  theme: ThemeMode = 'light'
): TextStyle {
  const baseText: TextStyle = {
    ...(isLabel ? typography.caption : typography.small),
    textAlign: 'center',
    includeFontPadding: false,
  }

  if (disabled || state === 'empty') {
    return {
      ...baseText,
      color: colors.text[theme].tertiary,
      opacity: 0.3,
    }
  }

  // Selected states - white text
  if (state === 'selected' || state === 'selected-left' || state === 'selected-right') {
    return {
      ...baseText,
      color: colors.white,
      fontWeight: fontWeight.regular,
    }
  }

  // Today state - primary text color
  if (state === 'today') {
    return {
      ...baseText,
      color: colors.text[theme].primary,
      fontWeight: fontWeight.regular,
    }
  }

  // Middle (in range) state - primary text color
  if (state === 'middle') {
    return {
      ...baseText,
      color: colors.text[theme].primary,
      fontWeight: fontWeight.regular,
    }
  }

  // Default and hover states
  return {
    ...baseText,
    color: colors.text[theme].secondary,
    fontWeight: fontWeight.regular,
  }
}

/**
 * Get indicator styles
 */
export function getIndicatorStyles(): ViewStyle {
  return {
    position: 'absolute',
    bottom: spacing[2],
    left: '50%',
    marginLeft: -INDICATOR_SIZE / 2,
    width: INDICATOR_SIZE,
    height: INDICATOR_SIZE,
    borderRadius: INDICATOR_SIZE / 2,
    backgroundColor: colors.success[500], // Green indicator from Figma
  }
}
