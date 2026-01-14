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
 * Matches Figma "_Date Picker Date" component exactly
 */
export function getContainerStyles(
  state: DatePickerDayState,
  disabled: boolean,
  theme: ThemeMode = 'light'
): ViewStyle {
  const baseContainer: ViewStyle = {
    width: 40,
    height: 40,
    padding: spacing[8],
    borderRadius: borderRadius.s, // 8px default
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
  }

  if (disabled || state === 'empty') {
    return {
      ...baseContainer,
      backgroundColor: colors.bg[theme].default, // white bg
      opacity: 0.3,
    }
  }

  // Selected states - foreground-01 bg (#141c25), white text, 6px border radius
  if (state === 'selected' || state === 'selected-left' || state === 'selected-right') {
    const container: ViewStyle = {
      ...baseContainer,
      backgroundColor: colors.fg[theme].default, // foreground-01 (#141c25)
      borderRadius: borderRadius.xs, // 6px for selected (not 8px)
    }

    if (state === 'selected-left') {
      container.borderTopLeftRadius = borderRadius.s // 8px
      container.borderBottomLeftRadius = borderRadius.s // 8px
      container.borderTopRightRadius = 0
      container.borderBottomRightRadius = 0
    } else if (state === 'selected-right') {
      container.borderTopRightRadius = borderRadius.s // 8px
      container.borderBottomRightRadius = borderRadius.s // 8px
      container.borderTopLeftRadius = 0
      container.borderBottomLeftRadius = 0
    }

    return container
  }

  // Middle (in range) state - bg-100 background (#f2f4f7)
  if (state === 'middle') {
    return {
      ...baseContainer,
      backgroundColor: colors.bg[theme].muted, // bg-100 (#f2f4f7)
    }
  }

  // Today state - white bg, primary text
  if (state === 'today') {
    return {
      ...baseContainer,
      backgroundColor: colors.bg[theme].default, // white
    }
  }

  // Hover state - bg-100 background (#f2f4f7)
  if (state === 'hover' && Platform.OS === 'web') {
    return {
      ...baseContainer,
      backgroundColor: colors.bg[theme].muted, // bg-100 (#f2f4f7)
    }
  }

  // Default state - white bg
  return {
    ...baseContainer,
    backgroundColor: colors.bg[theme].default, // white
  }
}

/**
 * Get text styles based on state
 * Matches Figma typography exactly: Paragraph S/Regular (14px, 400 weight, 20px line height)
 */
export function getTextStyles(
  state: DatePickerDayState,
  disabled: boolean,
  isLabel: boolean,
  theme: ThemeMode = 'light'
): TextStyle {
  const baseText: TextStyle = {
    ...(isLabel ? typography.caption : typography.paragraphSRegular),
    textAlign: 'center',
    includeFontPadding: false,
  }

  if (disabled || state === 'empty') {
    return {
      ...baseText,
      color: colors.text[theme].tertiary, // #637083
      opacity: 0.3,
    }
  }

  // Selected states - white text (text-quaternary)
  if (state === 'selected' || state === 'selected-left' || state === 'selected-right') {
    return {
      ...baseText,
      color: colors.text[theme].quaternary || colors.white, // white text
      fontWeight: fontWeight.regular,
    }
  }

  // Today state - primary text color (#141c25)
  if (state === 'today') {
    return {
      ...baseText,
      color: colors.text[theme].primary, // #141c25
      fontWeight: fontWeight.regular,
    }
  }

  // Middle (in range) state - primary text color (#141c25)
  if (state === 'middle') {
    return {
      ...baseText,
      color: colors.text[theme].primary, // #141c25
      fontWeight: fontWeight.regular,
    }
  }

  // Default and hover states - secondary text color (#344051)
  return {
    ...baseText,
    color: colors.text[theme].secondary, // #344051
    fontWeight: fontWeight.regular,
  }
}

/**
 * Get indicator styles
 * Matches Figma: 4px circle, positioned at top: calc(50% + 10px) = bottom: 2px
 * Green color: #10b978 (emerald[500])
 */
export function getIndicatorStyles(): ViewStyle {
  return {
    position: 'absolute',
    bottom: spacing[2], // 2px from bottom = top: calc(50% + 10px) when centered
    left: '50%',
    marginLeft: -INDICATOR_SIZE / 2,
    width: INDICATOR_SIZE,
    height: INDICATOR_SIZE,
    borderRadius: INDICATOR_SIZE / 2,
    backgroundColor: colors.emerald[500], // #10b978 - Green indicator from Figma
  }
}
