/**
 * SidebarHeader component styles
 */

import type { ViewStyle, TextStyle } from 'react-native'
import { Platform } from 'react-native'
import { colors } from '../../tokens/colors'
import type { ThemeMode } from '../../tokens/colors'
import { spacing } from '../../tokens/spacing'
import { borderRadius } from '../../tokens/borders'
import { typography } from '../../tokens/typography'

export interface SidebarHeaderStyleConfig {
  container: ViewStyle
  content: ViewStyle
  logoContainer: ViewStyle
  title: TextStyle
  collapseButton: ViewStyle
  iconColor: string
}

export function getSidebarHeaderStyles(
  theme: ThemeMode,
  collapsed: boolean
): SidebarHeaderStyleConfig {
  const isLight = theme === 'light'

  const container: ViewStyle = {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    minHeight: 56,
    paddingHorizontal: collapsed ? spacing[8] : 24,
    paddingVertical: spacing[16],
  }

  const content: ViewStyle = {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing[12],
    flex: 1,
  }

  const logoContainer: ViewStyle = {
    width: 24,
    height: 24,
    alignItems: 'center',
    justifyContent: 'center',
  }

  const title: TextStyle = {
    fontFamily: typography.bodyMedium.fontFamily,
    fontSize: typography.body.fontSize,
    fontWeight: typography.bodyMedium.fontWeight,
    lineHeight: typography.body.lineHeight,
    color: isLight ? colors.text.light.primary : colors.text.dark.primary,
  }

  const collapseButton: ViewStyle = {
    width: 32,
    height: 32,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: borderRadius.s,
    ...(Platform.OS === 'web' && {
      cursor: 'pointer' as any,
    }),
  }

  const iconColor = isLight ? colors.icon.light.default : colors.icon.dark.default

  return {
    container,
    content,
    logoContainer,
    title,
    collapseButton,
    iconColor,
  }
}
