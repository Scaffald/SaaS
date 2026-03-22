/**
 * BottomToolbar styles
 * iOS 26 glassmorphic bottom toolbar
 */

import type { ViewStyle } from 'react-native'
import { Platform } from 'react-native'
import { borderRadius } from '../../tokens/borders'
import { shadows, boxShadows } from '../../tokens/shadows'
import type { ResolvedThemeMode } from '../../tokens/colors'

const GLASS_BG = {
  light: 'rgba(245, 245, 245, 0.6)',
  dark: 'rgba(44, 44, 46, 0.7)',
} as const

export interface BottomToolbarStyleConfig {
  /** Outer wrapper with safe-area padding */
  wrapper: ViewStyle
  /** Glass pill container */
  pill: ViewStyle
  /** Content row inside pill */
  contentRow: ViewStyle
  /** Search variant: full-width row */
  searchRow: ViewStyle
  /** Page control variant: row with leading + dots + trailing */
  pageControlRow: ViewStyle
  /** Button group in page control layout */
  pageControlButtons: ViewStyle
}

export function getBottomToolbarStyles(
  theme: ResolvedThemeMode,
): BottomToolbarStyleConfig {
  const wrapper: ViewStyle = {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    alignItems: 'center',
    paddingBottom: 8,
    paddingHorizontal: 16,
  }

  const pill: ViewStyle = {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: GLASS_BG[theme],
    borderRadius: borderRadius.sheet,
    paddingHorizontal: 4,
    paddingVertical: 4,
    ...shadows.iosSheet,
  }

  if (Platform.OS === 'web') {
    const webPill = pill as Record<string, unknown>
    webPill.backdropFilter = 'blur(50px)'
    webPill.WebkitBackdropFilter = 'blur(50px)'
    webPill.boxShadow = boxShadows.iosSheet
    delete webPill.shadowColor
    delete webPill.shadowOffset
    delete webPill.shadowOpacity
    delete webPill.shadowRadius
    delete webPill.elevation
  }

  const contentRow: ViewStyle = {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 0,
  }

  const searchRow: ViewStyle = {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
    paddingHorizontal: 4,
    gap: 4,
  }

  const pageControlRow: ViewStyle = {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    flex: 1,
  }

  const pageControlButtons: ViewStyle = {
    flexDirection: 'row',
    alignItems: 'center',
  }

  return {
    wrapper,
    pill,
    contentRow,
    searchRow,
    pageControlRow,
    pageControlButtons,
  }
}
