/**
 * Popover component styles
 * Style factory functions for Popover and sub-components
 */

import { Platform } from 'react-native'
import type { ViewStyle, } from 'react-native'
import { colors } from '../../tokens/colors'
import { borderRadius } from '../../tokens/borders'
import { shadows, boxShadows } from '../../tokens/shadows'
import { spacing } from '../../tokens/spacing'
import type { ThemeMode } from '../../tokens/colors'

export interface PopoverStyleConfig {
  container: ViewStyle
  content: ViewStyle
}

export interface PopoverHeaderStyleConfig {
  header: ViewStyle
  headerContent: ViewStyle
}

export interface PopoverContentStyleConfig {
  content: ViewStyle
}

export interface PopoverFooterStyleConfig {
  footer: ViewStyle
}

/**
 * Get popover container and content styles
 */
export function getPopoverStyles(
  theme: ThemeMode,
  maxWidth: number,
  width?: number | 'auto' | 'trigger',
  triggerWidth?: number
): PopoverStyleConfig {
  const shadow = shadows.m

  let popoverWidth: number | 'auto' | undefined
  if (width === 'trigger' && triggerWidth) {
    popoverWidth = triggerWidth
  } else if (typeof width === 'number') {
    popoverWidth = width
  } else {
    popoverWidth = undefined
  }

  return {
    container: {
      position: 'absolute',
      width: popoverWidth,
      maxWidth,
      backgroundColor: colors.bg[theme].default,
      borderRadius: borderRadius.l,
      ...(Platform.OS === 'web'
        ? {
            boxShadow: boxShadows.m,
          }
        : {
            shadowColor: shadow.shadowColor,
            shadowOffset: shadow.shadowOffset,
            shadowOpacity: shadow.shadowOpacity,
            shadowRadius: shadow.shadowRadius,
            elevation: shadow.elevation,
          }),
    },
    content: {
      overflow: 'hidden',
      borderRadius: borderRadius.l,
    },
  }
}

/**
 * Get popover header styles
 */
export function getPopoverHeaderStyles(theme: ThemeMode): PopoverHeaderStyleConfig {
  return {
    header: {
      paddingHorizontal: spacing[12],
      paddingVertical: spacing[8],
      borderBottomWidth: 1,
      borderBottomColor: colors.border[theme].subtle,
    },
    headerContent: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
    },
  }
}

/**
 * Get popover content styles
 */
export function getPopoverContentStyles(): PopoverContentStyleConfig {
  return {
    content: {
      padding: spacing[12],
    },
  }
}

/**
 * Get popover footer styles
 */
export function getPopoverFooterStyles(
  theme: ThemeMode,
  align: 'left' | 'center' | 'right' | 'space-between'
): PopoverFooterStyleConfig {
  const alignMap = {
    left: 'flex-start',
    center: 'center',
    right: 'flex-end',
    'space-between': 'space-between',
  } as const

  return {
    footer: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: alignMap[align],
      gap: spacing[8],
      paddingHorizontal: spacing[12],
      paddingVertical: spacing[8],
      borderTopWidth: 1,
      borderTopColor: colors.border[theme].subtle,
    },
  }
}
