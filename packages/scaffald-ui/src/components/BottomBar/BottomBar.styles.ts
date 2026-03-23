/**
 * BottomBar styles — glass pill container with fixed positioning
 */

import type { ViewStyle } from 'react-native'
import { Platform } from 'react-native'
import { borderRadius } from '../../tokens/borders'
import { shadows, boxShadows } from '../../tokens/shadows'
import type { ResolvedThemeMode } from '../../tokens/colors'
import type { BottomBarLevel } from './BottomBar.types'

const GLASS_BG = {
  light: 'rgba(245, 245, 245, 0.6)',
  dark: 'rgba(44, 44, 46, 0.7)',
} as const

const Z_INDEX: Record<BottomBarLevel, number> = {
  global: 9999,
  page: 10000,
}

export interface BottomBarStyleConfig {
  wrapper: ViewStyle
  pill: ViewStyle
  contentRow: ViewStyle
}

export function getBottomBarStyles(
  theme: ResolvedThemeMode,
  level: BottomBarLevel,
  bottomInset: number,
): BottomBarStyleConfig {
  const wrapper: ViewStyle = {
    position: Platform.OS === 'web' ? ('fixed' as never) : 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    zIndex: Z_INDEX[level],
    alignItems: 'center',
    paddingBottom: bottomInset + 8,
    paddingHorizontal: 16,
    paddingTop: 8,
  }

  const pill: ViewStyle & Record<string, unknown> = {
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
    pill.backdropFilter = 'blur(50px)'
    pill.WebkitBackdropFilter = 'blur(50px)'
    pill.boxShadow = boxShadows.iosSheet
    delete pill.shadowColor
    delete pill.shadowOffset
    delete pill.shadowOpacity
    delete pill.shadowRadius
    delete pill.elevation
  }

  const contentRow: ViewStyle = {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 0,
  }

  return { wrapper, pill: pill as ViewStyle, contentRow }
}
