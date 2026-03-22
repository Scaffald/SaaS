/**
 * SearchAccessory styles
 * iOS 26 search accessory with optional scope segmented control
 */

import type { ViewStyle } from 'react-native'
import type { ResolvedThemeMode } from '../../tokens/colors'

export interface SearchAccessoryStyleConfig {
  container: ViewStyle
  row: ViewStyle
  searchWrapper: ViewStyle
  scopeWrapper: ViewStyle
}

export function getSearchAccessoryStyles(
  _theme: ResolvedThemeMode,
): SearchAccessoryStyleConfig {
  const container: ViewStyle = {
    paddingHorizontal: 16,
    paddingVertical: 8,
  }

  const row: ViewStyle = {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  }

  const searchWrapper: ViewStyle = {
    flex: 1,
  }

  const scopeWrapper: ViewStyle = {
    flexShrink: 0,
  }

  return { container, row, searchWrapper, scopeWrapper }
}
