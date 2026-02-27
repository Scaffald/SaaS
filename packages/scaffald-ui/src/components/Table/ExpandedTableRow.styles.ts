/**
 * ExpandedTableRow component styles
 * All styles mapped from Figma Forsured Design System
 */

import type { ViewStyle, TextStyle } from 'react-native'
import { colors } from '../../tokens/colors'
import type { ThemeMode } from '../../tokens/colors'
import { spacing } from '../../tokens/spacing'
import { borderWidth } from '../../tokens/borders'
import { typographyVariants } from '../../tokens/typography'
import type { ExpandedTableRowVariant } from './ExpandedTableRow.types'

/**
 * Expanded row style configuration interface
 */
export interface ExpandedTableRowStyleConfig {
  container: ViewStyle
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
    backgroundColor: colors.bg[theme].subtle || colors.gray[50],
  }

  // Guideline cell is now handled by TableCell component
  // No need for separate style definition

  // Content area
  const contentArea: ViewStyle = {
    flex: 1,
    paddingHorizontal: spacing[20],
    paddingVertical: spacing[20],
    gap: spacing[20],
  }

  // Title styles (for variant2)
  const title: TextStyle = {
    fontFamily: typographyVariants.paragraphMMedium.fontFamily,
    fontSize: typographyVariants.paragraphMMedium.fontSize,
    fontWeight: typographyVariants.paragraphMMedium.fontWeight,
    lineHeight: typographyVariants.paragraphMMedium.lineHeight,
    color: colors.text[theme].primary,
    marginBottom: spacing[20], // Gap between title and info items
  }

  // Field label styles (for default variant)
  const fieldLabel: TextStyle = {
    fontFamily: typographyVariants.paragraphSMedium.fontFamily,
    fontSize: typographyVariants.paragraphSMedium.fontSize,
    fontWeight: typographyVariants.paragraphSMedium.fontWeight,
    lineHeight: typographyVariants.paragraphSMedium.lineHeight,
    color: colors.text[theme].primary,
    marginBottom: spacing[4],
  }

  // Field value styles (for variant2)
  const fieldValue: TextStyle = {
    fontFamily: typographyVariants.paragraphMMedium.fontFamily,
    fontSize: typographyVariants.paragraphMMedium.fontSize,
    fontWeight: typographyVariants.paragraphMMedium.fontWeight,
    lineHeight: typographyVariants.paragraphMMedium.lineHeight,
    color: colors.text[theme].secondary,
  }

  // Info label styles (for variant2)
  const infoLabel: TextStyle = {
    fontFamily: typographyVariants.paragraphSRegular.fontFamily,
    fontSize: typographyVariants.paragraphSRegular.fontSize,
    fontWeight: typographyVariants.paragraphSRegular.fontWeight,
    lineHeight: typographyVariants.paragraphSRegular.lineHeight,
    color: colors.text[theme].tertiary,
    marginBottom: spacing[4],
  }

  // Info value styles (for variant2)
  const infoValue: TextStyle = {
    fontFamily: typographyVariants.paragraphMMedium.fontFamily,
    fontSize: typographyVariants.paragraphMMedium.fontSize,
    fontWeight: typographyVariants.paragraphMMedium.fontWeight,
    lineHeight: typographyVariants.paragraphMMedium.lineHeight,
    color: colors.text[theme].secondary,
  }

  if (variant === 'variant2') {
    return {
      container: {
        ...baseContainer,
        paddingBottom: spacing[24],
      },
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
