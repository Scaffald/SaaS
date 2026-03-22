/**
 * ToolbarButtonGroup styles
 * iOS 26 grouped toolbar buttons
 */

import type { ViewStyle } from 'react-native'
import { Platform } from 'react-native'
import { colors } from '../../tokens/colors'
import { borderRadius } from '../../tokens/borders'
import { shadows, boxShadows } from '../../tokens/shadows'
import type { ResolvedThemeMode } from '../../tokens/colors'

const GLASS_BG = {
  light: 'rgba(245, 245, 245, 0.6)',
  dark: 'rgba(44, 44, 46, 0.7)',
} as const

export interface ToolbarButtonGroupStyleConfig {
  /** Outer glass pill container */
  container: ViewStyle
  /** Row layout for buttons */
  row: ViewStyle
}

export function getToolbarButtonGroupStyles(
  theme: ResolvedThemeMode,
): ToolbarButtonGroupStyleConfig {
  const container: ViewStyle = {
    backgroundColor: GLASS_BG[theme],
    borderRadius: borderRadius.sheet,
    paddingHorizontal: 2,
    paddingVertical: 2,
    ...shadows.iosSheet,
  }

  if (Platform.OS === 'web') {
    const webContainer = container as Record<string, unknown>
    webContainer.backdropFilter = 'blur(50px)'
    webContainer.WebkitBackdropFilter = 'blur(50px)'
    webContainer.boxShadow = boxShadows.iosSheet
    delete webContainer.shadowColor
    delete webContainer.shadowOffset
    delete webContainer.shadowOpacity
    delete webContainer.shadowRadius
    delete webContainer.elevation
  }

  const row: ViewStyle = {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 0,
  }

  return { container, row }
}
