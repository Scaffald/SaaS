/**
 * Shared style utilities for scf-core components.
 *
 * Centralizes repeated visual patterns (frosted glass, pill badges, icon circles)
 * so every card and panel uses consistent, token-based styles.
 */
import { Platform } from 'react-native'
import type { ViewStyle, TextStyle } from 'react-native'
import { colors } from '@scaffald/ui/tokens'
import { fontSize, fontWeight, lineHeight } from '@scaffald/ui/tokens'
import type { ResolvedThemeMode } from '@scaffald/ui/tokens'

// ---------------------------------------------------------------------------
// Frosted glass (web-only backdrop-filter)
// ---------------------------------------------------------------------------

export function frostedGlassStyle(theme: ResolvedThemeMode): ViewStyle & Record<string, unknown> {
  if (Platform.OS !== 'web') {
    return { backgroundColor: colors.bg[theme].default }
  }
  return {
    backgroundColor: theme === 'dark' ? 'rgba(30, 25, 20, 0.85)' : 'rgba(251, 248, 243, 0.75)',
    backdropFilter: 'blur(20px) saturate(180%)',
    WebkitBackdropFilter: 'blur(20px) saturate(180%)',
  } as ViewStyle & Record<string, unknown>
}

// ---------------------------------------------------------------------------
// Card color palettes — one per entity type, theme-aware
// ---------------------------------------------------------------------------

/** Worker / profile card colors */
export const workerPalette = {
  light: {
    iconBg: colors.primary[50], // #e8f6f9
    iconFg: colors.primary[500], // #1d7282
    accent: colors.primary[500], // #1d7282
    selectedBorder: colors.primary[400], // #1e96a8
    pillBg: colors.primary[50],
    pillText: colors.primary[700], // #034550
    tagBg: colors.gray[100], // #f1efeb
    tagText: colors.gray[600], // #504940
  },
  dark: {
    iconBg: colors.primary[800], // #022d38
    iconFg: colors.primary[300], // #3fb5c7
    accent: colors.primary[300],
    selectedBorder: colors.primary[300],
    pillBg: colors.primary[800],
    pillText: colors.primary[200], // #7fd1de
    tagBg: colors.gray[700], // #3c352c
    tagText: colors.gray[300], // #cdc8c0
  },
} as const

/** Organization card colors */
export const orgPalette = {
  light: {
    iconBg: colors.violet[50], // #f5f3ff
    iconFg: colors.violet[600], // #7c3aed
    accent: colors.violet[600],
    selectedBorder: colors.violet[600],
  },
  dark: {
    iconBg: colors.violet[900], // #4c1d95
    iconFg: colors.violet[300], // #c4b5fd
    accent: colors.violet[300],
    selectedBorder: colors.violet[300],
  },
} as const

/** Job card colors */
export const jobPalette = {
  light: {
    iconBg: colors.warning[50], // #fdf5e6
    iconFg: colors.warning[500], // #9a6614
    accent: colors.warning[500],
    selectedBorder: colors.amber[600], // #d97706
    pillBg: colors.warning[50],
    pillText: colors.amber[800], // #92400e
  },
  dark: {
    iconBg: colors.warning[900], // #402807
    iconFg: colors.warning[300], // #e8ae4a
    accent: colors.warning[300],
    selectedBorder: colors.amber[400],
    pillBg: colors.warning[900],
    pillText: colors.amber[300], // #fcd34d
  },
} as const

/** Badge tone colors for success / warning / danger pills */
export const badgeToneColors = {
  success: { bg: colors.green[100], text: colors.green[600], icon: colors.green[600] },
  warning: { bg: colors.yellow[100], text: colors.yellow[600], icon: colors.yellow[600] },
  danger: { bg: colors.rose[100], text: colors.rose[600], icon: colors.rose[600] },
} as const

// ---------------------------------------------------------------------------
// Semantic text colors (theme-aware convenience)
// ---------------------------------------------------------------------------

export function textColors(theme: ResolvedThemeMode) {
  return {
    primary: colors.text[theme].primary,
    secondary: colors.text[theme].secondary,
    tertiary: colors.text[theme].tertiary,
    disabled: colors.text[theme].disabled,
    muted: colors.icon[theme].muted, // gray.500 light / gray.400 dark
  }
}

// ---------------------------------------------------------------------------
// Common text styles (use instead of hardcoded fontSize: 13, etc.)
// ---------------------------------------------------------------------------

/** 14px body text — use for card titles in compact mode */
export const textSmall: TextStyle = { fontSize: fontSize.sm, lineHeight: lineHeight.sm }

/** 12px caption text — use for pills, badges, overflow counts */
export const textCaption: TextStyle = { fontSize: fontSize.xs, lineHeight: lineHeight.xs }

/** Card subtitle — 14px regular, secondary color */
export function subtitleStyle(theme: ResolvedThemeMode): TextStyle {
  return { ...textSmall, color: colors.text[theme].tertiary }
}

/** Card metric text — 14px, tertiary color */
export function metricTextStyle(theme: ResolvedThemeMode): TextStyle {
  return { ...textSmall, color: colors.text[theme].tertiary }
}

/** Card title text — 14/15px, semibold */
export function titleStyle(compact: boolean): TextStyle {
  return { fontSize: compact ? fontSize.sm : 15, fontWeight: fontWeight.semibold }
}

// ---------------------------------------------------------------------------
// Icon circle — the colored circle used as card avatar / entity icon
// ---------------------------------------------------------------------------

export function iconCircleStyle(size: number, bgColor: string, borderRadius?: number): ViewStyle {
  return {
    width: size,
    height: size,
    borderRadius: borderRadius ?? 12,
    backgroundColor: bgColor,
    alignItems: 'center',
    justifyContent: 'center',
  }
}

// ---------------------------------------------------------------------------
// Pill / Tag — small rounded badge with bg + text
// ---------------------------------------------------------------------------

export const pillStyle: ViewStyle = {
  paddingHorizontal: 8,
  paddingVertical: 3,
  borderRadius: 6,
}
