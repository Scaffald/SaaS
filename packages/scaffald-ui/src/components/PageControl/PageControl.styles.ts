/**
 * PageControl styles
 * iOS 26 — dot indicators with active/inactive opacity
 */

import type { ViewStyle } from 'react-native'
import { Platform } from 'react-native'
import { colors } from '../../tokens/colors'
import { borderRadius } from '../../tokens/borders'
import type { ResolvedThemeMode } from '../../tokens/colors'

const PILL_BG = {
  light: 'rgba(235, 235, 237, 0.6)',
  dark: 'rgba(58, 58, 60, 0.6)',
} as const

export interface PageControlStyleConfig {
  container: ViewStyle
  dotsRow: ViewStyle
  pillContainer: ViewStyle
  dot: ViewStyle
  activeDot: ViewStyle
  smallDot: ViewStyle
  tinyDot: ViewStyle
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

  const pillContainer: ViewStyle = {
    backgroundColor: PILL_BG[theme],
    borderRadius: borderRadius.pill,
    paddingHorizontal: 10,
    paddingVertical: 6,
  }

  if (Platform.OS === 'web') {
    const webPill = pillContainer as Record<string, unknown>
    webPill.backdropFilter = 'blur(30px)'
    webPill.WebkitBackdropFilter = 'blur(30px)'
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

  /** Smaller dot for edge compression (6+ pages) */
  const smallDot: ViewStyle = {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: dotColor,
    opacity: 0.2,
  }

  /** Tiny dot for far-edge compression (7+ pages) */
  const tinyDot: ViewStyle = {
    width: 4,
    height: 4,
    borderRadius: 2,
    backgroundColor: dotColor,
    opacity: 0.15,
  }

  return { container, dotsRow, pillContainer, dot, activeDot, smallDot, tinyDot }
}
