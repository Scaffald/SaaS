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
  collapsedWidth: number,
  mode: 'fixed' | 'overlay' = 'fixed',
  animated: boolean = true,
  animationDuration: number = 200
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
      // Position based on mode
      position: mode === 'overlay' ? 'fixed' : 'fixed',
      top: 0,
      left: 0,
      zIndex: mode === 'overlay' ? 1000 : 'auto',
      // Add smooth transitions for width changes
      ...(animated && {
        transition: `width ${animationDuration}ms cubic-bezier(0.4, 0, 0.2, 1), transform ${animationDuration}ms cubic-bezier(0.4, 0, 0.2, 1)`,
      }),
      // Add shadow for overlay mode
      ...(mode === 'overlay' && {
        boxShadow: '2px 0 8px rgba(0, 0, 0, 0.15)',
      }),
      // Better overflow handling
      overflow: 'hidden',
    } as any),
  }

  // Scroll view styles
  const scrollView: ViewStyle = {
    flex: 1,
  }

  // Scroll content styles with improved spacing
  const scrollContent: ViewStyle = {
    paddingVertical: spacing[12],
    gap: spacing[2],
  }

  // Footer container styles with better spacing
  const footerContainer: ViewStyle = {
    paddingTop: spacing[12],
    paddingBottom: spacing[16],
    borderTopWidth: borderWidth.thin,
    borderTopColor: isLight ? colors.border.light.subtle : colors.border.dark.subtle,
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
