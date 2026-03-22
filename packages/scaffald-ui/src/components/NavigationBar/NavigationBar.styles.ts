/**
 * NavigationBar styles
 * iOS 26 top navigation bar — iPhone + iPad
 */

import type { ViewStyle, TextStyle } from 'react-native'
import { Platform } from 'react-native'
import { colors } from '../../tokens/colors'
import { borderRadius } from '../../tokens/borders'
import type { ResolvedThemeMode } from '../../tokens/colors'

const GLASS_BG = {
  light: 'rgba(248, 248, 248, 0.75)',
  dark: 'rgba(30, 30, 30, 0.75)',
} as const

export interface NavigationBarStyleConfig {
  /** Outer wrapper */
  container: ViewStyle
  /** Glass background container */
  glassContainer: ViewStyle
  /** Standard nav row (3-zone layout) */
  navRow: ViewStyle
  /** Leading zone (back button + leading items) */
  leading: ViewStyle
  /** Center zone (title or segmented control) */
  center: ViewStyle
  /** Trailing zone (action buttons) */
  trailing: ViewStyle
  /** Large title row (below nav row) */
  largeTitleRow: ViewStyle
  /** Standard title text */
  title: TextStyle
  /** Standard subtitle text */
  subtitle: TextStyle
  /** Large title text */
  largeTitle: TextStyle
  /** Large subtitle text */
  largeSubtitle: TextStyle
  /** Title container (for stacking title + subtitle) */
  titleStack: ViewStyle
  /** Separator line at bottom */
  separator: ViewStyle
}

export function getNavigationBarStyles(
  theme: ResolvedThemeMode,
): NavigationBarStyleConfig {
  const container: ViewStyle = {
    width: '100%' as any,
  }

  const glassContainer: ViewStyle = {
    ...container,
    backgroundColor: GLASS_BG[theme],
  }

  if (Platform.OS === 'web') {
    const webGlass = glassContainer as Record<string, unknown>
    webGlass.backdropFilter = 'blur(50px)'
    webGlass.WebkitBackdropFilter = 'blur(50px)'
  }

  const navRow: ViewStyle = {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    minHeight: 44,
    paddingHorizontal: 8,
  }

  const leading: ViewStyle = {
    flexDirection: 'row',
    alignItems: 'center',
    minWidth: 44,
    justifyContent: 'flex-start',
  }

  const center: ViewStyle = {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 8,
  }

  const trailing: ViewStyle = {
    flexDirection: 'row',
    alignItems: 'center',
    minWidth: 44,
    justifyContent: 'flex-end',
  }

  const largeTitleRow: ViewStyle = {
    paddingHorizontal: 16,
    paddingTop: 2,
    paddingBottom: 8,
  }

  const title: TextStyle = {
    fontSize: 17,
    fontWeight: '600',
    color: colors.labels[theme].primary,
    textAlign: 'center',
  }

  const subtitle: TextStyle = {
    fontSize: 12,
    fontWeight: '400',
    color: colors.labels[theme].secondary,
    textAlign: 'center',
  }

  const largeTitle: TextStyle = {
    fontSize: 34,
    fontWeight: '700',
    color: colors.labels[theme].primary,
    letterSpacing: 0.37,
  }

  const largeSubtitle: TextStyle = {
    fontSize: 15,
    fontWeight: '400',
    color: colors.labels[theme].secondary,
    marginTop: 2,
  }

  const titleStack: ViewStyle = {
    alignItems: 'center',
    justifyContent: 'center',
  }

  const separator: ViewStyle = {
    height: 0.5,
    backgroundColor: colors.border[theme].default,
  }

  return {
    container,
    glassContainer,
    navRow,
    leading,
    center,
    trailing,
    largeTitleRow,
    title,
    subtitle,
    largeTitle,
    largeSubtitle,
    titleStack,
    separator,
  }
}
