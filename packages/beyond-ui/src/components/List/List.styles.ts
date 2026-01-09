/**
 * List component styles
 * All styles mapped from Figma Forsured Design System
 */

import type { ViewStyle, TextStyle } from 'react-native'
import { colors } from '../../tokens/colors'
import type { ThemeMode } from '../../tokens/colors'
import { spacing } from '../../tokens/spacing'
import { typographyVariants } from '../../tokens/typography'

/**
 * List style configuration interface
 */
export interface ListStyleConfig {
  container: ViewStyle
  title: TextStyle
  content: ViewStyle
}

/**
 * Get list styles based on theme
 */
export function getListStyles(theme: ThemeMode = 'light', gap: number = 0): ListStyleConfig {
  return {
    container: {
      flexDirection: 'column',
      backgroundColor: colors.bg[theme].default,
    },
    title: {
      fontFamily: typographyVariants.paragraphMSemiBold.fontFamily,
      fontSize: typographyVariants.paragraphMSemiBold.fontSize,
      fontWeight: typographyVariants.paragraphMSemiBold.fontWeight,
      lineHeight: typographyVariants.paragraphMSemiBold.lineHeight,
      letterSpacing: parseFloat(typographyVariants.paragraphMSemiBold.letterSpacing || '0'),
      color: colors.text[theme].primary,
      marginBottom: spacing[16],
    },
    content: {
      flexDirection: 'column',
      gap,
    },
  }
}
