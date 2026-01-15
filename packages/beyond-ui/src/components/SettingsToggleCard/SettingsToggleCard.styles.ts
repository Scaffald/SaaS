/**
 * SettingsToggleCard styles
 */

import type { ViewStyle, TextStyle } from 'react-native'
import { colors } from '../../tokens/colors'
import { spacing } from '../../tokens/spacing'
import { borderRadius } from '../../tokens/borders'
import { shadows } from '../../tokens/shadows'
import { typography } from '../../tokens/typography'
import type { SettingsToggleCardStyleConfig } from './SettingsToggleCard.types'
import type { ThemeMode } from '../../tokens/colors'

export function getSettingsToggleCardStyles(
  theme: ThemeMode,
  enabled: boolean,
  disabled: boolean
): SettingsToggleCardStyleConfig {
  const isLight = theme === 'light'

  const container: ViewStyle = {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    padding: spacing[16],
    borderRadius: borderRadius.l,
    backgroundColor: isLight ? colors.bg.light.default : colors.bg.dark.default,
    borderWidth: enabled && !disabled ? 1 : 1,
    borderColor: enabled && !disabled
      ? isLight
        ? colors.gray[700]
        : colors.gray[300]
      : isLight
        ? colors.border.light['200']
        : colors.border.dark['200'],
    ...shadows.button,
    ...(disabled && {
      opacity: 0.5,
    }),
  }

  const content: ViewStyle = {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing[10],
  }

  const iconContainer: ViewStyle = {
    width: 40,
    height: 40,
    borderRadius: borderRadius.max,
    backgroundColor: isLight ? colors.gray[50] : colors.gray[800],
    justifyContent: 'center',
    alignItems: 'center',
    ...shadows.xs,
  }

  const textContainer: ViewStyle = {
    flex: 1,
    gap: spacing[2],
  }

  const title: TextStyle = {
    fontFamily: typography.bodyMedium.fontFamily,
    fontSize: 16,
    fontWeight: typography.bodyMedium.fontWeight,
    lineHeight: 24,
    color: isLight ? colors.text.light.primary : colors.text.dark.primary,
  }

  const description: TextStyle = {
    fontFamily: typography.body.fontFamily,
    fontSize: 14,
    fontWeight: typography.body.fontWeight,
    lineHeight: 20,
    color: isLight ? colors.text.light.secondary : colors.text.dark.secondary,
  }

  return {
    container,
    content,
    iconContainer,
    textContainer,
    title,
    description,
  }
}
