/**
 * SidebarMenuItem component styles
 * Style factory functions for sidebar menu items
 */

import type { ViewStyle, TextStyle } from 'react-native'
import { colors } from '../../tokens/colors'
import type { ThemeMode } from '../../tokens/colors'
import { spacing } from '../../tokens/spacing'
import { borderRadius } from '../../tokens/borders'
import { typography } from '../../tokens/typography'
import type { SidebarItemType, SidebarItemState } from './Sidebar.types'

export interface SidebarMenuItemStyleConfig {
  item: ViewStyle
  headingContainer: ViewStyle
  headingText: TextStyle
  dividerContainer: ViewStyle
  textContainer: ViewStyle
  label: TextStyle
  labelWithSupport: TextStyle
  supportingText: TextStyle
  trailing: ViewStyle
  badge: ViewStyle
  badgeText: TextStyle
  countText: TextStyle
  ctaButton: ViewStyle
  ctaButtonText: TextStyle
  submenu: ViewStyle
}

/**
 * Get sidebar menu item styles based on type, state, theme, and other props
 */
export function getSidebarMenuItemStyles(
  type: SidebarItemType,
  state: SidebarItemState,
  theme: ThemeMode,
  collapsed: boolean,
  activeColor: string
): SidebarMenuItemStyleConfig {
  const isLight = theme === 'light'

  // Base item styles
  const item: ViewStyle = {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing[12],
    minHeight: 40,
    paddingHorizontal: spacing[12],
    paddingVertical: type === 'double' ? spacing[12] : spacing[8],
    marginHorizontal: spacing[16],
    marginVertical: 1,
    borderRadius: borderRadius.s,
  }

  // Add background color based on state
  if (state === 'active') {
    item.backgroundColor = activeColor
  } else if (state === 'hover') {
    item.backgroundColor = isLight ? colors.bg.light.subtle : colors.bg.dark.subtle
  }

  // Child type indentation
  if (type === 'child') {
    item.marginLeft = collapsed ? spacing[16] : spacing[24] + spacing[16]
  }

  // Double type spacing (user profile)
  if (type === 'double') {
    item.minHeight = 56
  }

  // Heading container styles
  const headingContainer: ViewStyle = {
    paddingVertical: spacing[8],
    paddingHorizontal: collapsed ? spacing[12] : spacing[12],
  }

  // Heading text styles
  const headingText: TextStyle = {
    fontFamily: typography.caption.fontFamily,
    fontSize: typography.caption.fontSize,
    fontWeight: typography.body.fontWeight as any,
    lineHeight: typography.caption.lineHeight,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    color: isLight ? colors.text.light.secondary : colors.text.dark.secondary,
  }

  // Divider container styles
  const dividerContainer: ViewStyle = {
    height: 1,
    marginHorizontal: spacing[12],
    marginVertical: spacing[8],
    borderTopWidth: 1,
    borderTopColor: isLight ? colors.border.light.default : colors.border.dark.default,
  }

  // Text container styles
  const textContainer: ViewStyle = {
    flex: 1,
    gap: spacing[2],
    minWidth: 0, // Ensure text can shrink
  }

  // Get text color based on state
  const getTextColor = (): string => {
    if (state === 'disabled') {
      return isLight ? colors.text.light.disabled : colors.text.dark.disabled
    }
    if (state === 'active') {
      return colors.white
    }
    return isLight ? colors.text.light.primary : colors.text.dark.primary
  }

  // Label styles
  const label: TextStyle = {
    fontFamily: typography.body.fontFamily,
    fontSize: typography.body.fontSize,
    fontWeight: typography.body.fontWeight as any,
    lineHeight: typography.body.lineHeight,
    color: getTextColor(),
  }

  // Label with support text styles
  const labelWithSupport: TextStyle = {
    fontWeight: typography.bodyMedium.fontWeight as any,
  }

  // Supporting text styles
  const supportingText: TextStyle = {
    fontFamily: typography.body.fontFamily,
    fontSize: typography.small.fontSize,
    fontWeight: typography.body.fontWeight as any,
    lineHeight: typography.small.lineHeight,
    color:
      state === 'active'
        ? colors.white
        : isLight
          ? colors.text.light.secondary
          : colors.text.dark.secondary,
  }

  // Trailing styles
  const trailing: ViewStyle = {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing[8],
  }

  // Badge styles
  const badge: ViewStyle = {
    height: 16,
    paddingHorizontal: 4,
    borderRadius: borderRadius.max,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.error[500],
  }

  // Badge text styles
  const badgeText: TextStyle = {
    fontFamily: typography.caption.fontFamily,
    fontSize: typography.caption.fontSize,
    fontWeight: typography.bodyMedium.fontWeight as any,
    color: colors.white,
    lineHeight: 16,
  }

  // Count text styles
  const countText: TextStyle = {
    fontFamily: typography.body.fontFamily,
    fontSize: typography.small.fontSize,
    fontWeight: typography.body.fontWeight as any,
    lineHeight: typography.small.lineHeight,
    color: getTextColor(),
  }

  // CTA button styles
  const ctaButton: ViewStyle = {
    paddingHorizontal: spacing[8],
    paddingVertical: spacing[4],
    borderRadius: borderRadius.s,
    backgroundColor: colors.primary[500],
  }

  // CTA button text styles
  const ctaButtonText: TextStyle = {
    fontFamily: typography.bodyMedium.fontFamily,
    fontSize: typography.small.fontSize,
    fontWeight: typography.bodyMedium.fontWeight as any,
    color: colors.white,
  }

  // Submenu styles
  const submenu: ViewStyle = {
    marginLeft: spacing[24],
    gap: spacing[2],
  }

  return {
    item,
    headingContainer,
    headingText,
    dividerContainer,
    textContainer,
    label,
    labelWithSupport,
    supportingText,
    trailing,
    badge,
    badgeText,
    countText,
    ctaButton,
    ctaButtonText,
    submenu,
  }
}

/**
 * Get icon color based on state and theme
 */
export function getIconColor(state: SidebarItemState, theme: ThemeMode): string {
  const isLight = theme === 'light'

  if (state === 'disabled') {
    return isLight ? colors.text.light.disabled : colors.text.dark.disabled
  }
  if (state === 'active') {
    return colors.white
  }
  return isLight ? colors.icon.light.default : colors.icon.dark.default
}
