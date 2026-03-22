/**
 * PageControl styles
 * iOS 26 — dot indicators with active/inactive opacity
 */

import type { ViewStyle } from 'react-native'
import { colors } from '../../tokens/colors'
import type { ResolvedThemeMode } from '../../tokens/colors'

export interface PageControlStyleConfig {
  container: ViewStyle
  dotsRow: ViewStyle
  dot: ViewStyle
  activeDot: ViewStyle
}

export function getPageControlStyles(
  theme: ResolvedThemeMode,
): PageControlStyleConfig {
  const dotColor = colors.labels[theme].primary

  const container: ViewStyle = {
    height: 44,
    alignItems: 'center',
    justifyContent: 'center',
  }

  const dotsRow: ViewStyle = {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingHorizontal: 12,
    paddingVertical: 8,
  }

  const dot: ViewStyle = {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: dotColor,
    opacity: 0.3,
  }

  const activeDot: ViewStyle = {
    ...dot,
    opacity: 1,
  }

  return { container, dotsRow, dot, activeDot }
}
