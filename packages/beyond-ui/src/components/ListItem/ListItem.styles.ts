/**
 * ListItem component styles
 * All styles mapped from Figma Forsured Design System
 */

import type { ViewStyle, TextStyle } from 'react-native'
import { colors } from '../../tokens/colors'
import type { ThemeMode } from '../../tokens/colors'
import { spacing } from '../../tokens/spacing'
import { typographyVariants } from '../../tokens/typography'
import type { ListItemVariant } from './ListItem.types'

/**
 * List item style configuration interface
 */
export interface ListItemStyleConfig {
  container: ViewStyle
  leftSection?: ViewStyle
  contentSection?: ViewStyle
  rightSection?: ViewStyle
  title?: TextStyle
  subtitle?: TextStyle
  description?: TextStyle
  metadata?: TextStyle
}

/**
 * Get list item styles based on variant and theme
 */
export function getListItemStyles(
  variant: ListItemVariant,
  theme: ThemeMode = 'light'
): ListItemStyleConfig {
  // Base container styles (common across all variants)
  const baseContainer: ViewStyle = {
    flexDirection: 'row',
    alignItems: 'center',
    padding: spacing[12],
    gap: spacing[12],
    minHeight: 68, // Standard list item height
  }

  // Base content section
  const baseContentSection: ViewStyle = {
    flex: 1,
    flexDirection: 'column',
    gap: spacing[4],
    minWidth: 0, // Allow text truncation
  }

  // Base title text
  const baseTitle: TextStyle = {
    fontFamily: typographyVariants.paragraphMSemiBold.fontFamily,
    fontSize: typographyVariants.paragraphMSemiBold.fontSize,
    fontWeight: typographyVariants.paragraphMSemiBold.fontWeight,
    lineHeight: typographyVariants.paragraphMSemiBold.lineHeight,
    letterSpacing: parseFloat(typographyVariants.paragraphMSemiBold.letterSpacing || '0'),
    color: colors.text[theme].primary,
  }

  // Base subtitle text
  const baseSubtitle: TextStyle = {
    fontFamily: typographyVariants.paragraphSRegular.fontFamily,
    fontSize: typographyVariants.paragraphSRegular.fontSize,
    fontWeight: typographyVariants.paragraphSRegular.fontWeight,
    lineHeight: typographyVariants.paragraphSRegular.lineHeight,
    letterSpacing: parseFloat(typographyVariants.paragraphSRegular.letterSpacing || '0'),
    color: colors.text[theme].tertiary,
  }

  // Base description text
  const baseDescription: TextStyle = {
    fontFamily: typographyVariants.paragraphSRegular.fontFamily,
    fontSize: typographyVariants.paragraphSRegular.fontSize,
    fontWeight: typographyVariants.paragraphSRegular.fontWeight,
    lineHeight: typographyVariants.paragraphSRegular.lineHeight,
    letterSpacing: parseFloat(typographyVariants.paragraphSRegular.letterSpacing || '0'),
    color: colors.text[theme].secondary,
  }

  // Base metadata text
  const baseMetadata: TextStyle = {
    fontFamily: typographyVariants.captionRegular.fontFamily,
    fontSize: typographyVariants.captionRegular.fontSize,
    fontWeight: typographyVariants.captionRegular.fontWeight,
    lineHeight: typographyVariants.captionRegular.lineHeight,
    letterSpacing: parseFloat(typographyVariants.captionRegular.letterSpacing || '0'),
    color: colors.text[theme].tertiary,
  }

  switch (variant) {
    case 'user-profile-01':
    case 'user-profile-02':
      return {
        container: baseContainer,
        leftSection: {
          width: 48,
          height: 48,
        },
        contentSection: {
          ...baseContentSection,
          gap: spacing[12],
        },
        title: {
          fontFamily: typographyVariants.paragraphMSemiBold.fontFamily,
          fontSize: typographyVariants.paragraphMSemiBold.fontSize,
          fontWeight: typographyVariants.paragraphMSemiBold.fontWeight,
          lineHeight: typographyVariants.paragraphMSemiBold.lineHeight,
          letterSpacing: parseFloat(typographyVariants.paragraphMSemiBold.letterSpacing || '0'),
          color: colors.text[theme].primary,
        },
        subtitle: baseSubtitle,
        description: baseDescription,
      }

    case 'product':
      return {
        container: baseContainer,
        leftSection: {
          width: 48,
          height: 48,
        },
        contentSection: {
          ...baseContentSection,
          gap: spacing[8],
        },
        title: {
          fontFamily: typographyVariants.paragraphLSemiBold.fontFamily,
          fontSize: typographyVariants.paragraphLSemiBold.fontSize,
          fontWeight: typographyVariants.paragraphLSemiBold.fontWeight,
          lineHeight: typographyVariants.paragraphLSemiBold.lineHeight,
          letterSpacing: parseFloat(typographyVariants.paragraphLSemiBold.letterSpacing || '0'),
          color: colors.text[theme].primary,
        },
        rightSection: {
          width: 48,
          height: 48,
          alignItems: 'center',
          justifyContent: 'center',
        },
      }

    case 'search-result-01':
      return {
        container: {
          ...baseContainer,
          flexDirection: 'column',
          alignItems: 'flex-start',
          gap: spacing[8],
        },
        contentSection: {
          ...baseContentSection,
          gap: spacing[4],
        },
        title: {
          fontFamily: typographyVariants.paragraphLSemiBold.fontFamily,
          fontSize: typographyVariants.paragraphLSemiBold.fontSize,
          fontWeight: typographyVariants.paragraphLSemiBold.fontWeight,
          lineHeight: typographyVariants.paragraphLSemiBold.lineHeight,
          letterSpacing: parseFloat(typographyVariants.paragraphLSemiBold.letterSpacing || '0'),
          color: colors.text[theme].primary,
        },
        subtitle: {
          fontFamily: typographyVariants.paragraphSRegular.fontFamily,
          fontSize: typographyVariants.paragraphSRegular.fontSize,
          fontWeight: typographyVariants.paragraphSRegular.fontWeight,
          lineHeight: typographyVariants.paragraphSRegular.lineHeight,
          letterSpacing: parseFloat(typographyVariants.paragraphSRegular.letterSpacing || '0'),
          color: colors.text[theme].secondary,
        },
        description: baseDescription,
      }

    case 'search-result-02':
      return {
        container: {
          ...baseContainer,
          flexDirection: 'column',
          alignItems: 'flex-start',
          gap: spacing[12],
        },
        contentSection: {
          ...baseContentSection,
          gap: spacing[4],
        },
        title: {
          fontFamily: typographyVariants.paragraphLSemiBold.fontFamily,
          fontSize: typographyVariants.paragraphLSemiBold.fontSize,
          fontWeight: typographyVariants.paragraphLSemiBold.fontWeight,
          lineHeight: typographyVariants.paragraphLSemiBold.lineHeight,
          letterSpacing: parseFloat(typographyVariants.paragraphLSemiBold.letterSpacing || '0'),
          color: colors.text[theme].primary,
        },
        description: baseDescription,
      }

    case 'search-result-03':
      return {
        container: baseContainer,
        leftSection: {
          width: 40,
          height: 40,
        },
        contentSection: {
          ...baseContentSection,
          gap: spacing[4],
        },
        title: {
          fontFamily: typographyVariants.paragraphLSemiBold.fontFamily,
          fontSize: typographyVariants.paragraphLSemiBold.fontSize,
          fontWeight: typographyVariants.paragraphLSemiBold.fontWeight,
          lineHeight: typographyVariants.paragraphLSemiBold.lineHeight,
          letterSpacing: parseFloat(typographyVariants.paragraphLSemiBold.letterSpacing || '0'),
          color: colors.text[theme].primary,
        },
        description: baseDescription,
      }

    case 'task':
      return {
        container: baseContainer,
        leftSection: {
          width: 24,
          height: 24,
        },
        contentSection: {
          ...baseContentSection,
          gap: spacing[2],
        },
        title: {
          fontFamily: typographyVariants.paragraphSSemiBold.fontFamily,
          fontSize: typographyVariants.paragraphSSemiBold.fontSize,
          fontWeight: typographyVariants.paragraphSSemiBold.fontWeight,
          lineHeight: typographyVariants.paragraphSSemiBold.lineHeight,
          letterSpacing: parseFloat(typographyVariants.paragraphSSemiBold.letterSpacing || '0'),
          color: colors.text[theme].primary,
        },
        metadata: baseMetadata,
      }

    case 'song-title':
      return {
        container: baseContainer,
        leftSection: {
          width: 50,
          height: 50,
        },
        contentSection: {
          ...baseContentSection,
          gap: spacing[0],
        },
        title: {
          fontFamily: typographyVariants.paragraphMMedium.fontFamily,
          fontSize: typographyVariants.paragraphMMedium.fontSize,
          fontWeight: typographyVariants.paragraphMMedium.fontWeight,
          lineHeight: typographyVariants.paragraphMMedium.lineHeight,
          letterSpacing: parseFloat(typographyVariants.paragraphMMedium.letterSpacing || '0'),
          color: colors.text[theme].primary,
        },
        subtitle: baseSubtitle,
      }

    case 'cloud-file':
      return {
        container: baseContainer,
        leftSection: {
          width: 40,
          height: 40,
        },
        contentSection: {
          ...baseContentSection,
          gap: spacing[0],
        },
        title: {
          fontFamily: typographyVariants.paragraphMMedium.fontFamily,
          fontSize: typographyVariants.paragraphMMedium.fontSize,
          fontWeight: typographyVariants.paragraphMMedium.fontWeight,
          lineHeight: typographyVariants.paragraphMMedium.lineHeight,
          letterSpacing: parseFloat(typographyVariants.paragraphMMedium.letterSpacing || '0'),
          color: colors.text[theme].primary,
        },
        subtitle: baseSubtitle,
      }

    case 'phone-number':
      return {
        container: baseContainer,
        leftSection: {
          width: 28,
          height: 28,
        },
        contentSection: {
          ...baseContentSection,
          flexDirection: 'row',
          alignItems: 'center',
          gap: spacing[10],
        },
        title: {
          fontFamily: typographyVariants.paragraphSMedium.fontFamily,
          fontSize: typographyVariants.paragraphSMedium.fontSize,
          fontWeight: typographyVariants.paragraphSMedium.fontWeight,
          lineHeight: typographyVariants.paragraphSMedium.lineHeight,
          letterSpacing: parseFloat(typographyVariants.paragraphSMedium.letterSpacing || '0'),
          color: colors.text[theme].tertiary,
        },
        subtitle: {
          fontFamily: typographyVariants.paragraphSMedium.fontFamily,
          fontSize: typographyVariants.paragraphSMedium.fontSize,
          fontWeight: typographyVariants.paragraphSMedium.fontWeight,
          lineHeight: typographyVariants.paragraphSMedium.lineHeight,
          letterSpacing: parseFloat(typographyVariants.paragraphSMedium.letterSpacing || '0'),
          color: colors.text[theme].primary,
        },
      }

    case 'integration':
      return {
        container: baseContainer,
        leftSection: {
          width: 24,
          height: 24,
        },
        contentSection: {
          ...baseContentSection,
          flex: 1,
        },
        title: {
          fontFamily: typographyVariants.paragraphSMedium.fontFamily,
          fontSize: typographyVariants.paragraphSMedium.fontSize,
          fontWeight: typographyVariants.paragraphSMedium.fontWeight,
          lineHeight: typographyVariants.paragraphSMedium.lineHeight,
          letterSpacing: parseFloat(typographyVariants.paragraphSMedium.letterSpacing || '0'),
          color: colors.text[theme].primary,
        },
        rightSection: {
          width: 24,
          height: 24,
        },
      }

    default:
      return {
        container: baseContainer,
        contentSection: baseContentSection,
        title: baseTitle,
      }
  }
}
