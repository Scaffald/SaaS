/**
 * ToolbarSearchBar styles
 * iOS 26 glassmorphic search bar
 */

import type { ViewStyle, TextStyle } from 'react-native'
import { Platform } from 'react-native'
import { colors } from '../../tokens/colors'
import { borderRadius } from '../../tokens/borders'
import type { ResolvedThemeMode } from '../../tokens/colors'

const GLASS_BG = {
  light: 'rgba(235, 235, 237, 0.7)',
  dark: 'rgba(58, 58, 60, 0.7)',
} as const

export interface ToolbarSearchBarStyleConfig {
  container: ViewStyle
  row: ViewStyle
  searchIcon: ViewStyle
  input: TextStyle
  trailingIcons: ViewStyle
  iconButton: ViewStyle
  placeholderColor: string
  textColor: string
  iconColor: string
}

export function getToolbarSearchBarStyles(
  theme: ResolvedThemeMode,
): ToolbarSearchBarStyleConfig {
  const container: ViewStyle = {
    backgroundColor: GLASS_BG[theme],
    borderRadius: borderRadius.pill,
    height: 36,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 8,
    flex: 1,
  }

  if (Platform.OS === 'web') {
    const webContainer = container as Record<string, unknown>
    webContainer.backdropFilter = 'blur(30px)'
    webContainer.WebkitBackdropFilter = 'blur(30px)'
  }

  const row: ViewStyle = {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  }

  const searchIcon: ViewStyle = {
    width: 20,
    height: 20,
    alignItems: 'center',
    justifyContent: 'center',
  }

  const input: TextStyle = {
    flex: 1,
    fontSize: 17,
    fontWeight: '400',
    color: colors.labels[theme].primary,
    paddingVertical: 0,
    height: 36,
  }

  if (Platform.OS === 'web') {
    const webInput = input as Record<string, unknown>
    webInput.outlineStyle = 'none'
  }

  const trailingIcons: ViewStyle = {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 2,
  }

  const iconButton: ViewStyle = {
    width: 28,
    height: 28,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 14,
  }

  return {
    container,
    row,
    searchIcon,
    input,
    trailingIcons,
    iconButton,
    placeholderColor: colors.labelsVibrant[theme].secondary,
    textColor: colors.labels[theme].primary,
    iconColor: colors.labelsVibrant[theme].secondary,
  }
}
