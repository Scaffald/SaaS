/**
 * Dropdown component styles
 * All styles mapped from Figma Forsured Design System
 */

import { colors } from '../../tokens/colors'
import { spacing } from '../../tokens/spacing'
import { borderRadius } from '../../tokens/borders'
import { typography } from '../../tokens/typography'
import { shadows } from '../../tokens/shadows'
import type { DropdownStyleConfig } from './Dropdown.types'

/**
 * Get dropdown styles
 * Returns style configuration matching Figma design system
 */
export function getDropdownStyles(): DropdownStyleConfig {
  return {
    // Trigger button styles
    trigger: {
      backgroundColor: colors.fg.light.default, // foreground-01 (#141c25)
      paddingHorizontal: spacing[20], // padding-20
      paddingVertical: spacing[10], // padding-10
      borderRadius: borderRadius.m, // radius-m (10px)
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      gap: spacing[8],
      ...shadows.button,
    },
    triggerText: {
      fontFamily: typography.bodyMedium.fontFamily,
      fontSize: typography.small.fontSize,
      fontWeight: typography.bodyMedium.fontWeight,
      lineHeight: typography.small.lineHeight,
      color: colors.white, // white
      textAlign: 'center',
    },
    // Menu panel styles
    menu: {
      backgroundColor: colors.bg.light.default, // bg-0 (white)
      borderWidth: 1,
      borderColor: colors.border.light.default, // border-200 (#e4e7ec)
      borderRadius: borderRadius.l, // radius-l (12px)
      paddingVertical: spacing[8],
      paddingHorizontal: 0,
      width: 246, // Fixed width from Figma
      ...shadows.l,
    },
    // Section container styles
    section: {
      width: '100%',
    },
    // Section heading styles
    sectionHeading: {
      fontFamily: typography.body.fontFamily,
      fontSize: typography.caption.fontSize,
      fontWeight: typography.body.fontWeight,
      lineHeight: typography.caption.lineHeight,
      color: colors.text.light.tertiary, // #637083
      paddingHorizontal: spacing[10],
      paddingVertical: spacing[8],
      borderBottomWidth: 1,
      borderBottomColor: colors.border.light[100], // border-100 (#f2f4f7)
    },
    // Menu item styles
    item: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: spacing[6],
      paddingHorizontal: spacing[16],
      paddingVertical: spacing[8],
      width: '100%',
    },
    itemText: {
      fontFamily: typography.body.fontFamily,
      fontSize: typography.small.fontSize,
      fontWeight: typography.body.fontWeight,
      lineHeight: typography.small.lineHeight,
      color: colors.text.light.secondary, // #344051
      flex: 1,
    },
    // Divider styles
    divider: {
      height: 1,
      backgroundColor: colors.border.light[100], // border-100 (#f2f4f7)
      width: '100%',
      marginVertical: 0,
    },
    // Checkbox styles
    checkbox: {
      width: 20,
      height: 20,
      borderWidth: 1,
      borderColor: colors.border.light.default,
      borderRadius: borderRadius.xs,
      alignItems: 'center',
      justifyContent: 'center',
    },
    checkboxChecked: {
      backgroundColor: colors.primary[500],
      borderColor: colors.primary[500],
    },
    // Avatar styles
    avatar: {
      width: 20,
      height: 20,
      borderRadius: borderRadius.max,
      backgroundColor: colors.gray[300],
    },
    // Badge styles
    badge: {
      paddingHorizontal: spacing[4],
      paddingVertical: spacing[2],
      borderRadius: borderRadius.max,
      backgroundColor: colors.gray[200],
      minWidth: 20,
      alignItems: 'center',
      justifyContent: 'center' as const,
    },
    badgeText: {
      fontFamily: typography.caption.fontFamily,
      fontSize: typography.caption.fontSize,
      fontWeight: typography.captionBold.fontWeight,
      lineHeight: typography.caption.lineHeight,
      color: colors.text.light.secondary,
    },
    // Shortcut text styles
    shortcut: {
      fontFamily: typography.caption.fontFamily,
      fontSize: typography.caption.fontSize,
      fontWeight: typography.caption.fontWeight,
      lineHeight: typography.caption.lineHeight,
      color: colors.text.light.tertiary,
      paddingHorizontal: spacing[4],
    },
    // Submenu arrow styles
    submenuArrow: {
      width: 20,
      height: 20,
      alignItems: 'center',
      justifyContent: 'center',
    },
    // Hover state styles
    itemHover: {
      backgroundColor: colors.bg.light.subtle,
    },
    // Active state styles
    itemActive: {
      backgroundColor: colors.bg.light.selected,
    },
    // Icon colors
    iconColor: colors.icon.light.muted, // #637083 for menu item icons
    caretColor: colors.white, // White for trigger caret
  }
}

/**
 * Get dark mode dropdown styles
 */
export function getDropdownDarkStyles(): DropdownStyleConfig {
  const baseStyles = getDropdownStyles()
  return {
    ...baseStyles,
    menu: {
      ...baseStyles.menu,
      backgroundColor: colors.bg.dark.default,
      borderColor: colors.border.dark.default,
    },
    sectionHeading: {
      ...baseStyles.sectionHeading,
      color: colors.text.dark.tertiary,
      borderBottomColor: colors.border.dark[100],
    },
    item: {
      ...baseStyles.item,
    },
    itemText: {
      ...baseStyles.itemText,
      color: colors.text.dark.secondary,
    },
    divider: {
      ...baseStyles.divider,
      backgroundColor: colors.border.dark[100],
    },
    badge: {
      ...baseStyles.badge,
      backgroundColor: colors.gray[750],
    },
    badgeText: {
      ...baseStyles.badgeText,
      color: colors.text.dark.secondary,
    },
    shortcut: {
      ...baseStyles.shortcut,
      color: colors.text.dark.tertiary,
    },
    itemHover: {
      ...baseStyles.itemHover,
      backgroundColor: colors.bg.dark.subtle,
    },
    itemActive: {
      ...baseStyles.itemActive,
      backgroundColor: colors.bg.dark.selected,
    },
    iconColor: colors.icon.dark.muted,
  }
}
