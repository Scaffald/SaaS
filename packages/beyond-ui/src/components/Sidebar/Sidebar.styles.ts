/**
 * Sidebar component styles
 * Style factory functions for Sidebar navigation component
 */

import type { ViewStyle } from 'react-native'
import { Platform } from 'react-native'
import { colors } from '../../tokens/colors'
import type { ThemeMode } from '../../tokens/colors'
import { spacing } from '../../tokens/spacing'
import { borderWidth } from '../../tokens/borders'
import type { SidebarVariant, SidebarStyleConfig } from './Sidebar.types'

/**
 * Get sidebar styles based on variant, theme, and collapsed state
 */
export function getSidebarStyles(
  variant: SidebarVariant,
  theme: ThemeMode,
  collapsed: boolean,
  expandedWidth: number,
  collapsedWidth: number
): SidebarStyleConfig {
  const isLight = theme === 'light'
  const width = collapsed ? collapsedWidth : expandedWidth

  // Get background color based on theme
  const backgroundColor = isLight ? colors.bg.light.default : colors.bg.dark.default

  // Get active color based on variant
  const activeColor = getActiveColor(variant)

  // Container styles
  const container: ViewStyle = {
    width,
    height: '100%',
    flexDirection: 'column',
    backgroundColor,
    borderRightWidth: borderWidth.thin,
    borderRightColor: isLight ? colors.border.light.default : colors.border.dark.default,
    ...(Platform.OS === 'web' && {
      // Ensure sidebar stays fixed on web
      position: 'fixed',
      top: 0,
      left: 0,
    } as any),
  }

  // Scroll view styles
  const scrollView: ViewStyle = {
    flex: 1,
  }

  // Scroll content styles
  const scrollContent: ViewStyle = {
    paddingVertical: spacing[8],
    gap: spacing[2],
  }

  // Footer container styles
  const footerContainer: ViewStyle = {
    paddingTop: spacing[8],
    paddingBottom: spacing[12],
  }

  return {
    container,
    scrollView,
    scrollContent,
    footerContainer,
    activeColor,
  }
}

/**
 * Get active color based on sidebar variant
 */
function getActiveColor(variant: SidebarVariant): string {
  switch (variant) {
    case 'finance':
      return colors.blue[500]
    case 'management':
      return colors.purple[500]
    case 'banking':
      return colors.green[500]
    case 'crypto':
      return colors.orange[500]
    default:
      return colors.primary[500]
  }
}
