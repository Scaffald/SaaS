/**
 * AppearanceThemeCard styles
 */

import type { ViewStyle } from 'react-native'
import { colors } from '../../tokens/colors'
import { spacing } from '../../tokens/spacing'
import { borderRadius } from '../../tokens/borders'
import { boxShadows } from '../../tokens/shadows'
import { typography } from '../../tokens/typography'
import type { AppearanceThemeCardStyleConfig, AppearanceThemeCardVariant } from './AppearanceThemeCard.types'
import type { ThemeMode } from '../../tokens/colors'

export function getAppearanceThemeCardStyles(
  theme: ThemeMode,
  variant: AppearanceThemeCardVariant,
  selected: boolean
): AppearanceThemeCardStyleConfig {
  const isLight = theme === 'light'

  const container: ViewStyle = {
    width: 160,
    height: 124,
    borderRadius: borderRadius.m,
    overflow: 'hidden',
    backgroundColor: isLight ? colors.bg.light.default : colors.bg.dark.default,
    borderWidth: selected ? 2 : 1,
    borderColor: selected
      ? isLight
        ? colors.gray[900]
        : colors.gray[100]
      : isLight
        ? colors.border.light['200']
        : colors.border.dark['200'],
    ...(selected && {
      ...boxShadows.focusBase,
    }),
  }

  const preview: ViewStyle = {
    width: 160,
    height: 100,
    borderRadius: borderRadius.m,
    overflow: 'hidden',
  }

  const previewLight: ViewStyle = {
    backgroundColor: colors.gray[50],
  }

  const previewDark: ViewStyle = {
    backgroundColor: colors.gray[900],
  }

  const previewSystem: ViewStyle = {
    // System shows split between light and dark
    flexDirection: 'row',
  }

  const label: ViewStyle = {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    height: 24,
    justifyContent: 'center',
    alignItems: 'center',
    fontFamily: typography.bodyMedium.fontFamily,
    fontSize: 14,
    fontWeight: typography.bodyMedium.fontWeight,
    lineHeight: 20,
    color: isLight ? colors.text.light.primary : colors.text.dark.primary,
  }

  return {
    container,
    preview,
    previewLight,
    previewDark,
    previewSystem,
    label,
  }
}
