/**
 * TraitScoreCard - Displays a scored trait with icon, label, and animated bar.
 *
 * Used in assessment results to visualize individual trait scores.
 *
 * @example
 * ```tsx
 * import { Brain } from 'lucide-react-native'
 *
 * <TraitScoreCard
 *   trait="Problem Solving"
 *   score={92}
 *   icon={Brain}
 *   color={colors.primary[500]}
 *   animationDelay={200}
 * />
 * ```
 */

import { useMemo } from 'react'
import { View, Text } from 'react-native'
import { useThemeContext } from '../../theme'
import { colors } from '../../tokens/colors'
import { spacing } from '../../tokens/spacing'
import { borderRadius } from '../../tokens/borders'
import { fontSize, fontWeight } from '../../tokens/typography'
import { AssessmentProgressBar } from './AssessmentProgressBar'
import type { TraitScoreCardProps } from './TraitScoreCard.types'

export function TraitScoreCard({
  trait,
  score,
  icon: Icon,
  color,
  style,
}: TraitScoreCardProps) {
  const { theme } = useThemeContext()
  const accentColor = color ?? colors.primary[500]

  const styles = useMemo(
    () => ({
      container: {
        borderWidth: 1,
        borderColor: colors.border[theme].default,
        borderRadius: borderRadius.xl,
        padding: spacing[20],
        backgroundColor: colors.bg[theme].default,
      } as const,
      topRow: {
        flexDirection: 'row' as const,
        alignItems: 'center' as const,
        justifyContent: 'space-between' as const,
        marginBottom: spacing[12],
      },
      leftSection: {
        flexDirection: 'row' as const,
        alignItems: 'center' as const,
        gap: spacing[12],
        flex: 1,
      },
      iconContainer: {
        width: 40,
        height: 40,
        borderRadius: borderRadius.m,
        alignItems: 'center' as const,
        justifyContent: 'center' as const,
        backgroundColor: `${accentColor}1A`, // 10% opacity
      },
      traitName: {
        fontSize: fontSize.md,
        fontWeight: fontWeight.semibold,
        color: colors.text[theme].primary,
      },
      scoreValue: {
        fontSize: fontSize.lg,
        fontWeight: fontWeight.bold,
        color: colors.text[theme].primary,
      },
    }),
    [theme, accentColor]
  )

  return (
    <View style={[styles.container, style]}>
      <View style={styles.topRow}>
        <View style={styles.leftSection}>
          {Icon && (
            <View style={styles.iconContainer}>
              <Icon size={20} color={accentColor} />
            </View>
          )}
          <Text style={styles.traitName}>{trait}</Text>
        </View>
        <Text style={styles.scoreValue}>{score}</Text>
      </View>
      <AssessmentProgressBar
        value={score}
        color={accentColor}
        height={6}
      />
    </View>
  )
}
