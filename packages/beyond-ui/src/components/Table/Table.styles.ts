/**
 * Table component styles
 * All styles mapped from Figma Forsured Design System
 */

import type { ViewStyle } from 'react-native'
import { colors } from '../../tokens/colors'
import type { ThemeMode } from '../../tokens/colors'
import { spacing } from '../../tokens/spacing'
import { borderWidth } from '../../tokens/borders'
import { borderRadius } from '../../tokens/borders'

/**
 * Table style configuration interface
 */
export interface TableStyleConfig {
  container: ViewStyle
  header: ViewStyle
  headerContent: ViewStyle
  headerActions: ViewStyle
  body: ViewStyle
  footer: ViewStyle
}

/**
 * Get table styles based on theme
 */
export function getTableStyles(theme: ThemeMode = 'light'): TableStyleConfig {
  return {
    container: {
      flex: 1,
      backgroundColor: colors.bg[theme].default,
      borderRadius: borderRadius.m,
      overflow: 'hidden',
    },
    header: {
      padding: spacing[32],
      borderBottomWidth: borderWidth.thin,
      borderBottomColor: colors.border[theme].default,
      backgroundColor: colors.bg[theme].default,
    },
    headerContent: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      gap: spacing[20],
    },
    headerActions: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: spacing[17],
    },
    body: {
      flex: 1,
    },
    footer: {
      padding: spacing[32],
      borderTopWidth: borderWidth.thin,
      borderTopColor: colors.border[theme].default,
      backgroundColor: colors.bg[theme].default,
    },
  }
}
