import type { TextStyle, ViewStyle } from 'react-native'
import { colors, type ResolvedThemeMode } from '../../tokens/colors'
import { spacing } from '../../tokens/spacing'
import { borderRadius } from '../../tokens/borders'
import { fontSize, fontWeight } from '../../tokens/typography'

export interface AssessmentOptionCardStyleConfig {
  container: ViewStyle
  text: TextStyle
}

export function getAssessmentOptionCardStyles(
  isSelected: boolean,
  disabled: boolean,
  theme: ResolvedThemeMode
): AssessmentOptionCardStyleConfig {
  const container: ViewStyle = {
    borderWidth: 2,
    borderRadius: borderRadius.xl,
    padding: spacing[20],
    borderColor: isSelected
      ? colors.primary[500]
      : colors.border[theme].default,
    backgroundColor: isSelected
      ? theme === 'dark'
        ? 'rgba(29, 114, 130, 0.1)' // primary[500] at 10%
        : 'rgba(29, 114, 130, 0.05)' // primary[500] at 5%
      : colors.bg[theme].default,
    opacity: disabled ? 0.5 : 1,
  }

  const text: TextStyle = {
    fontSize: fontSize.md,
    fontWeight: fontWeight.medium,
    color: colors.text[theme].primary,
  }

  return { container, text }
}
