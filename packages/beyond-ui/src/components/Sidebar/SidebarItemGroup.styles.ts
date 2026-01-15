/**
 * SidebarItemGroup component styles
 */

import type { ViewStyle } from 'react-native'
import { colors } from '../../tokens/colors'
import type { ThemeMode } from '../../tokens/colors'
import { spacing } from '../../tokens/spacing'
import { borderWidth } from '../../tokens/borders'

export interface SidebarItemGroupStyleConfig {
  container: ViewStyle
  divider: ViewStyle
  content: ViewStyle
}

export function getSidebarItemGroupStyles(theme: ThemeMode): SidebarItemGroupStyleConfig {
  const isLight = theme === 'light'

  const container: ViewStyle = {
    gap: spacing[4],
  }

  const divider: ViewStyle = {
    height: 1,
    marginHorizontal: spacing[12],
    marginVertical: spacing[8],
    borderTopWidth: borderWidth.thin,
    borderTopColor: isLight ? colors.border.light.default : colors.border.dark.default,
  }

  const content: ViewStyle = {
    gap: spacing[2],
  }

  return {
    container,
    divider,
    content,
  }
}
