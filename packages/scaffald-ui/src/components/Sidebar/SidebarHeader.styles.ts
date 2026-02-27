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
    minHeight: 64,
    paddingHorizontal: collapsed ? spacing[16] : spacing[20],
    paddingVertical: spacing[20],
    gap: spacing[12],
    borderBottomWidth: 1,
    borderBottomColor: isLight ? colors.border.light.subtle : colors.border.dark.subtle,
  }

  const logoContainer: ViewStyle = {
    flex: 1,
    alignItems: collapsed ? 'center' : 'flex-start',
    justifyContent: 'center',
    ...(Platform.OS === 'web' && {
      transition: 'all 200ms cubic-bezier(0.4, 0, 0.2, 1)',
    } as any),
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
    logoContainer,
    title,
    collapseButton,
    iconColor,
  }
}
