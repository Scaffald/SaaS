/**
 * SettingsSectionHeader styles
 */

import type { ViewStyle, TextStyle } from 'react-native'
import { colors } from '../../tokens/colors'
import { spacing } from '../../tokens/spacing'
import { borderRadius } from '../../tokens/borders'
import { shadows } from '../../tokens/shadows'
import { typography } from '../../tokens/typography'
import type { SettingsSectionHeaderStyleConfig } from './SettingsSectionHeader.types'
import type { ThemeMode } from '../../tokens/colors'

export function getSettingsSectionHeaderStyles(theme: ThemeMode): SettingsSectionHeaderStyleConfig {
  const isLight = theme === 'light'

  const container: ViewStyle = {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing[10],
    paddingVertical: spacing[12],
  }

  const iconContainer: ViewStyle = {
    width: 32,
    height: 32,
    borderRadius: borderRadius.s,
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
    color: isLight ? colors.text.light.tertiary : colors.text.dark.tertiary,
  }

  return {
    container,
    iconContainer,
    textContainer,
    title,
    description,
  }
}
