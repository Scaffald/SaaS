/**
 * Dropdown component styles
 * All styles mapped from Figma Forsured Design System
 */

import type { ViewStyle, TextStyle } from 'react-native'
import { colors } from '../../tokens/colors'
import { spacing } from '../../tokens/spacing'
import { borderRadius } from '../../tokens/borders'
import { typography } from '../../tokens/typography'
import { shadows, boxShadows } from '../../tokens/shadows'
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
    // Icon colors
    iconColor: colors.icon.light.muted, // #637083 for menu item icons
    caretColor: colors.white, // White for trigger caret
  }
}

/**
 * Get dark mode dropdown styles
 */
export function getDropdownDarkStyles(): DropdownStyleConfig {
  return {
    ...getDropdownStyles(),
    menu: {
      ...getDropdownStyles().menu,
      backgroundColor: colors.bg.dark.default,
      borderColor: colors.border.dark.default,
    },
    sectionHeading: {
      ...getDropdownStyles().sectionHeading,
      color: colors.text.dark.tertiary,
      borderBottomColor: colors.border.dark[100],
    },
    item: {
      ...getDropdownStyles().item,
    },
    itemText: {
      ...getDropdownStyles().itemText,
      color: colors.text.dark.secondary,
    },
    divider: {
      ...getDropdownStyles().divider,
      backgroundColor: colors.border.dark[100],
    },
    iconColor: colors.icon.dark.muted,
  }
}

