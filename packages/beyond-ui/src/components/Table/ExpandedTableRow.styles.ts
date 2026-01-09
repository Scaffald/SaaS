/**
 * ExpandedTableRow component styles
 * All styles mapped from Figma Forsured Design System
 */

import type { ViewStyle, TextStyle } from 'react-native'
import { colors } from '../../tokens/colors'
import type { ThemeMode } from '../../tokens/colors'
import { spacing } from '../../tokens/spacing'
import { borderWidth } from '../../tokens/borders'
import { typography } from '../../tokens/typography'
import type { ExpandedTableRowVariant } from './ExpandedTableRow.types'

/**
 * Expanded row style configuration interface
 */
export interface ExpandedTableRowStyleConfig {
  container: ViewStyle
  guidelineCell: ViewStyle
  contentArea: ViewStyle
  title?: TextStyle
  fieldLabel?: TextStyle
  fieldValue?: TextStyle
  infoLabel?: TextStyle
  infoValue?: TextStyle
}

/**
 * Get expanded table row styles based on variant and theme
 */
export function getExpandedTableRowStyles(
  variant: ExpandedTableRowVariant = 'default',
  theme: ThemeMode = 'light'
): ExpandedTableRowStyleConfig {
  // Base container - always has gray background
  const baseContainer: ViewStyle = {
    flexDirection: 'row',
    borderBottomWidth: borderWidth.thin,
    borderBottomColor: colors.border[theme].default,
    backgroundColor: colors.bg[theme].secondary || colors.gray[50],
  }

  // Guideline cell (40px width)
  const guidelineCell: ViewStyle = {
    width: 40,
    backgroundColor: colors.bg[theme].default,
    paddingLeft: spacing[20],
    paddingRight: 0,
    paddingVertical: 0,
    flexDirection: 'column',
    alignItems: 'center',
  }

  // Content area
  const contentArea: ViewStyle = {
    flex: 1,
    paddingHorizontal: spacing[20],
    paddingVertical: spacing[20],
    gap: spacing[20],
  }

  // Title styles (for variant2)
  const title: TextStyle = {
    fontFamily: typography.paragraph.m.medium.fontFamily,
    fontSize: typography.paragraph.m.medium.fontSize,
    fontWeight: typography.paragraph.m.medium.fontWeight,
    lineHeight: typography.paragraph.m.medium.lineHeight,
    color: colors.text[theme].primary,
    marginBottom: spacing[4],
  }

  // Field label styles (for default variant)
  const fieldLabel: TextStyle = {
    fontFamily: typography.paragraph.s.medium.fontFamily,
    fontSize: typography.paragraph.s.medium.fontSize,
    fontWeight: typography.paragraph.s.medium.fontWeight,
    lineHeight: typography.paragraph.s.medium.lineHeight,
    color: colors.text[theme].primary,
    marginBottom: spacing[4],
  }

  // Field value styles (for variant2)
  const fieldValue: TextStyle = {
    fontFamily: typography.paragraph.m.medium.fontFamily,
    fontSize: typography.paragraph.m.medium.fontSize,
    fontWeight: typography.paragraph.m.medium.fontWeight,
    lineHeight: typography.paragraph.m.medium.lineHeight,
    color: colors.text[theme].secondary,
  }

  // Info label styles (for variant2)
  const infoLabel: TextStyle = {
    fontFamily: typography.paragraph.s.regular.fontFamily,
    fontSize: typography.paragraph.s.regular.fontSize,
    fontWeight: typography.paragraph.s.regular.fontWeight,
    lineHeight: typography.paragraph.s.regular.lineHeight,
    color: colors.text[theme].tertiary,
    marginBottom: spacing[4],
  }

  // Info value styles (for variant2)
  const infoValue: TextStyle = {
    fontFamily: typography.paragraph.m.medium.fontFamily,
    fontSize: typography.paragraph.m.medium.fontSize,
    fontWeight: typography.paragraph.m.medium.fontWeight,
    lineHeight: typography.paragraph.m.medium.lineHeight,
    color: colors.text[theme].secondary,
  }

  if (variant === 'variant2') {
    return {
      container: {
        ...baseContainer,
        paddingBottom: spacing[24],
      },
      guidelineCell,
      contentArea: {
        ...contentArea,
        paddingTop: spacing[20],
        paddingBottom: spacing[24],
        gap: spacing[12],
      },
      title,
      infoLabel,
      infoValue,
    }
  }

  // Default variant (with form inputs)
  return {
    container: baseContainer,
    guidelineCell,
    contentArea: {
      ...contentArea,
      paddingBottom: spacing[24],
      flexDirection: 'row',
      gap: spacing[20],
    },
    fieldLabel,
    fieldValue,
  }
}
