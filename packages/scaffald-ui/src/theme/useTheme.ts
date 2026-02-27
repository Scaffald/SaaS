/**
 * useTheme hook
 * Returns the full theme object with theme-scoped semantic colors for overrides.
 *
 * @example
 * ```tsx
 * const { theme, colors, spacing } = useTheme()
 *
 * <View style={{ backgroundColor: colors.bg.default }}>
 *   <Text style={{ color: colors.text.primary, marginBottom: spacing[4] }}>
 *     Themed content
 *   </Text>
 * </View>
 * ```
 */

import { useMemo } from 'react'
import { colors } from '../tokens/colors'
import { spacing, namedSpacing } from '../tokens/spacing'
import { typography } from '../tokens/typography'
import { borderRadius, borders } from '../tokens/borders'
import { shadows, boxShadows } from '../tokens/shadows'
import { useThemeContext } from './ThemeProvider'
import type { ResolvedThemeMode } from '../tokens/colors'

export type ThemeColors = {
  text: (typeof colors.text)[ResolvedThemeMode]
  bg: (typeof colors.bg)[ResolvedThemeMode]
  border: (typeof colors.border)[ResolvedThemeMode]
  fg: (typeof colors.fg)[ResolvedThemeMode]
  icon: (typeof colors.icon)[ResolvedThemeMode]
}

export interface ThemeObject {
  theme: ResolvedThemeMode
  colors: ThemeColors
  spacing: typeof spacing
  namedSpacing: typeof namedSpacing
  typography: typeof typography
  borderRadius: typeof borderRadius
  borders: typeof borders
  shadows: typeof shadows
  boxShadows: typeof boxShadows
}

export function useTheme(): ThemeObject {
  const { theme } = useThemeContext()

  return useMemo(
    () => ({
      theme,
      colors: {
        text: colors.text[theme],
        bg: colors.bg[theme],
        border: colors.border[theme],
        fg: colors.fg[theme],
        icon: colors.icon[theme],
      },
      spacing,
      namedSpacing,
      typography,
      borderRadius,
      borders,
      shadows,
      boxShadows,
    }),
    [theme]
  )
}
