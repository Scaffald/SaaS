/**
 * TableColumnHeader component styles
 * All styles mapped from Figma Forsured Design System
 */

import type { ViewStyle, TextStyle } from 'react-native'
import { colors } from '../../tokens/colors'
import type { ThemeMode } from '../../tokens/colors'
import { spacing } from '../../tokens/spacing'
import { borderWidth } from '../../tokens/borders'
import { typographyVariants } from '../../tokens/typography'
import type { TableColumnHeaderState, TableColumnHeaderAlign } from './TableColumnHeader.types'

/**
 * Column header dimensions from Figma
 * Height: 40px
 * Padding: 20px horizontal, 10px vertical
 */
const HEADER_HEIGHT = 40
const HEADER_PADDING_H = spacing[20]
const HEADER_PADDING_V = spacing[10]

/**
 * Header style configuration interface
 */
export interface TableColumnHeaderStyleConfig {
  container: ViewStyle
  text: TextStyle
  iconColor?: string
}

/**
 * Get table column header styles based on state, alignment, and theme
 */
export function getTableColumnHeaderStyles(
  state: TableColumnHeaderState = 'default',
  align: TableColumnHeaderAlign = 'left',
  theme: ThemeMode = 'light',
  width?: number | string
): TableColumnHeaderStyleConfig {
  // Base container styles
  const baseContainer: ViewStyle = {
    height: HEADER_HEIGHT,
    paddingHorizontal: HEADER_PADDING_H,
    paddingVertical: HEADER_PADDING_V,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: align === 'center' ? 'center' : align === 'right' ? 'flex-end' : 'flex-start',
    borderBottomWidth: borderWidth.thin,
    borderBottomColor: colors.border[theme].default,
    backgroundColor: colors.bg[theme].subtle || colors.gray[50],
    gap: spacing[4],
    ...(width && { width: typeof width === 'string' ? (parseFloat(width) || undefined) : width }),
  }

  // Base text styles
  const baseText: TextStyle = {
    fontFamily: typographyVariants.paragraphSMedium.fontFamily,
    fontSize: typographyVariants.paragraphSMedium.fontSize,
    fontWeight: typographyVariants.paragraphSMedium.fontWeight,
    lineHeight: typographyVariants.paragraphSMedium.lineHeight,
    color: colors.text[theme].secondary,
    textAlign: align,
  }

  // Empty state - return container with empty text style
  if (state === 'empty') {
    return {
      container: {
        ...baseContainer,
        paddingHorizontal: 0,
        paddingVertical: 0,
      },
      text: baseText,
    }
  }

  return {
    container: baseContainer,
    text: baseText,
    iconColor: colors.text[theme].secondary,
  }
}
