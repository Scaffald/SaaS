/**
 * AssessmentHeader - Category label + question title pattern.
 *
 * Provides consistent visual hierarchy for assessment steps with an
 * optional uppercase category tag, bold title, and subtitle.
 *
 * @example
 * ```tsx
 * <AssessmentHeader
 *   category="Work Style"
 *   title="When you start a project, what's your instinct?"
 * />
 *
 * <AssessmentHeader
 *   category="Weekly Pulse"
 *   title="Color Preference Assessment"
 *   subtitle="Track your mood through color selection"
 * />
 * ```
 */

import { useMemo } from 'react'
import { View, Text } from 'react-native'
import { useThemeContext } from '../../theme'
import { colors } from '../../tokens/colors'
import { spacing } from '../../tokens/spacing'
import { fontSize, fontWeight } from '../../tokens/typography'
import type { ViewStyle, TextStyle } from 'react-native'

export interface AssessmentHeaderProps {
  /**
   * Category label displayed above the title (rendered uppercase)
   */
  category?: string

  /**
   * Main heading text
   */
  title: string

  /**
   * Optional subtitle text below the title
   */
  subtitle?: string

  /**
   * Text alignment
   * @default 'left'
   */
  align?: 'left' | 'center'

  /**
   * Additional container styles
   */
  style?: ViewStyle
}

export function AssessmentHeader({
  category,
  title,
  subtitle,
  align = 'left',
  style,
}: AssessmentHeaderProps) {
  const { theme } = useThemeContext()

  const styles = useMemo(
    () => ({
      container: {
        gap: spacing[8],
      } as ViewStyle,
      category: {
        fontSize: fontSize.xs,
        fontWeight: fontWeight.semibold,
        color: colors.primary[500],
        textTransform: 'uppercase',
        letterSpacing: 2,
        textAlign: align,
      } as TextStyle,
      title: {
        fontSize: fontSize.h4,
        fontWeight: fontWeight.bold,
        color: colors.text[theme].primary,
        textAlign: align,
      } as TextStyle,
      subtitle: {
        fontSize: fontSize.md,
        color: colors.text[theme].secondary,
        textAlign: align,
        lineHeight: fontSize.md * 1.5,
      } as TextStyle,
    }),
    [theme, align]
  )

  return (
    <View style={[styles.container, style]}>
      {category && <Text style={styles.category}>{category}</Text>}
      <Text style={styles.title}>{title}</Text>
      {subtitle && <Text style={styles.subtitle}>{subtitle}</Text>}
    </View>
  )
}
