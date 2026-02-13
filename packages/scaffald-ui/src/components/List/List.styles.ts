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
export function getListStyles(theme: ThemeMode = 'light', gap: number = 10): ListStyleConfig {
  return {
    container: {
      flexDirection: 'column',
      backgroundColor: colors.bg[theme].default,
    },
    title: {
      fontFamily: typographyVariants.paragraphMMedium.fontFamily,
      fontSize: typographyVariants.paragraphMMedium.fontSize,
      fontWeight: typographyVariants.paragraphMMedium.fontWeight,
      lineHeight: typographyVariants.paragraphMMedium.lineHeight,
      letterSpacing: parseFloat(typographyVariants.paragraphMMedium.letterSpacing || '0'),
      color: colors.text[theme].secondary,
      marginBottom: spacing[16],
    },
    content: {
      flexDirection: 'column',
      gap: gap || 10, // Default 10px gap from Figma
    },
  }
}
