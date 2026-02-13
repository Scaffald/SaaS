/**
 * Sheet component styles
 * Style factory functions for Sheet and sub-components
 */

import { Platform, StyleSheet } from 'react-native'
import type { ViewStyle } from 'react-native'
import { colors } from '../../tokens/colors'
import { borderRadius } from '../../tokens/borders'
import { shadows, boxShadows } from '../../tokens/shadows'
import { spacing } from '../../tokens/spacing'
import type { ThemeMode } from '../../tokens/colors'

export interface SheetStyleConfig {
  overlay: ViewStyle
  backdrop: ViewStyle
  container: ViewStyle
  handleContainer: ViewStyle
  handle: ViewStyle
}

export interface SheetHeaderStyleConfig {
  header: ViewStyle
  headerContent: ViewStyle
  titleContainer: ViewStyle
}

export interface SheetContentStyleConfig {
  content: ViewStyle
  contentScroll: ViewStyle
  contentContainer: ViewStyle
}

export interface SheetFooterStyleConfig {
  footer: ViewStyle
}

/**
 * Get sheet container and overlay styles
 */
export function getSheetStyles(
  theme: ThemeMode,
  sheetHeight: number,
  isAutoHeight: boolean
): SheetStyleConfig {
  const shadow = shadows.l

  return {
    overlay: {
      flex: 1,
      justifyContent: 'flex-end',
    },
    backdrop: {
      ...StyleSheet.absoluteFillObject,
      backgroundColor: 'rgba(0, 0, 0, 0.5)',
    },
    container: {
      height: isAutoHeight ? undefined : sheetHeight,
      maxHeight: isAutoHeight ? sheetHeight : undefined,
      backgroundColor: colors.bg[theme].default,
      borderTopLeftRadius: borderRadius.xl,
      borderTopRightRadius: borderRadius.xl,
      ...(Platform.OS === 'web'
        ? {
            boxShadow: boxShadows.l,
          }
        : {
            shadowColor: shadow.shadowColor,
            shadowOffset: shadow.shadowOffset,
            shadowOpacity: shadow.shadowOpacity,
            shadowRadius: shadow.shadowRadius,
            elevation: shadow.elevation,
          }),
    },
    handleContainer: {
      alignItems: 'center',
      paddingTop: spacing[8],
      paddingBottom: spacing[4],
    },
    handle: {
      width: 36,
      height: 4,
      borderRadius: 2,
      backgroundColor: colors.border[theme].default,
    },
  }
}

/**
 * Get sheet header styles
 */
export function getSheetHeaderStyles(theme: ThemeMode): SheetHeaderStyleConfig {
  return {
    header: {
      paddingHorizontal: spacing[16],
      paddingVertical: spacing[12],
      borderBottomWidth: 1,
      borderBottomColor: colors.border[theme].subtle,
    },
    headerContent: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
    },
    titleContainer: {
      flex: 1,
      gap: spacing[4],
    },
  }
}

/**
 * Get sheet content styles
 */
export function getSheetContentStyles(_theme: ThemeMode): SheetContentStyleConfig {
  return {
    content: {
      flex: 1,
      padding: spacing[16],
    },
    contentScroll: {
      flex: 1,
    },
    contentContainer: {
      padding: spacing[16],
    },
  }
}

/**
 * Get sheet footer styles
 */
export function getSheetFooterStyles(
  theme: ThemeMode,
  align: 'left' | 'center' | 'right' | 'space-between'
): SheetFooterStyleConfig {
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
      gap: spacing[12],
      paddingHorizontal: spacing[16],
      paddingVertical: spacing[12],
      borderTopWidth: 1,
      borderTopColor: colors.border[theme].subtle,
    },
  }
}
