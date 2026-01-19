/**
 * SidebarFooter component styles
 */

import type { ViewStyle, TextStyle } from 'react-native'
import { Platform } from 'react-native'
import { colors } from '../../tokens/colors'
import type { ThemeMode } from '../../tokens/colors'
import { spacing } from '../../tokens/spacing'
import { borderRadius } from '../../tokens/borders'
import { typography } from '../../tokens/typography'

export interface SidebarFooterStyleConfig {
  container: ViewStyle
  actionsWrapper: ViewStyle
  actions: ViewStyle
  actionButton: ViewStyle
  actionBadge: ViewStyle
  actionBadgeText: TextStyle
  divider: ViewStyle
  userSection: ViewStyle
  avatarContainer: ViewStyle
  userInfo: ViewStyle
  userName: TextStyle
  userEmail: TextStyle
  iconColor: string
}

export function getSidebarFooterStyles(
  theme: ThemeMode,
  collapsed: boolean
): SidebarFooterStyleConfig {
  const isLight = theme === 'light'

  const container: ViewStyle = {
    flexDirection: 'column',
  }

  const actionsWrapper: ViewStyle = {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: spacing[16],
    paddingVertical: spacing[8],
    justifyContent: collapsed ? 'center' : 'flex-start',
  }

  const actions: ViewStyle = {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    flex: 1,
    gap: spacing[4],
  }

  const actionButton: ViewStyle = {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: borderRadius.m,
    paddingHorizontal: spacing[10],
    paddingVertical: spacing[10],
    minWidth: 40,
    minHeight: 40,
    ...(Platform.OS === 'web' && {
      transition: 'all 150ms ease-in-out',
      cursor: 'pointer',
      ':hover': {
        backgroundColor: isLight ? colors.bg.light.subtle : colors.bg.dark.subtle,
      },
    } as any),
  }

  const actionBadge: ViewStyle = {
    position: 'absolute',
    top: -4,
    right: -4,
    borderRadius: borderRadius.max,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 2,
  }

  const actionBadgeText: TextStyle = {
    fontFamily: typography.caption.fontFamily,
    fontSize: 8,
    fontWeight: typography.bodyMedium.fontWeight,
    color: colors.white,
    lineHeight: 10,
  }

  const divider: ViewStyle = {
    height: 1,
    backgroundColor: isLight ? colors.border.light.default : colors.border.dark.default,
    marginVertical: spacing[12],
  }

  const userSection: ViewStyle = {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing[6],
    paddingHorizontal: spacing[16],
    paddingBottom: spacing[10],
  }

  const avatarContainer: ViewStyle = {
    width: 40,
    height: 40,
  }

  const userInfo: ViewStyle = {
    flex: 1,
    gap: spacing[2],
  }

  const userName: TextStyle = {
    fontFamily: typography.body.fontFamily,
    fontSize: typography.body.fontSize,
    fontWeight: typography.body.fontWeight,
    lineHeight: typography.body.lineHeight,
    color: isLight ? colors.text.light.primary : colors.text.dark.primary,
  }

  const userEmail: TextStyle = {
    fontFamily: typography.body.fontFamily,
    fontSize: typography.caption.fontSize,
    fontWeight: typography.body.fontWeight,
    lineHeight: typography.caption.lineHeight,
    color: isLight ? colors.text.light.secondary : colors.text.dark.secondary,
  }

  const iconColor = isLight ? colors.icon.light.default : colors.icon.dark.default

  return {
    container,
    actionsWrapper,
    actions,
    actionButton,
    actionBadge,
    actionBadgeText,
    divider,
    userSection,
    avatarContainer,
    userInfo,
    userName,
    userEmail,
    iconColor,
  }
}
