/**
 * ComplianceScore - Visual indicator of compliance status
 */

import { CheckCircle, AlertTriangle, XCircle, TrendingUp, TrendingDown } from 'lucide-react-native'
import { View, StyleSheet } from 'react-native'
import { Text, Row, Stack, useThemeContext } from '@unicornlove/beyond-ui'
import { colors, spacing } from '@unicornlove/beyond-ui/tokens'
import type { ViewStyle } from 'react-native'

export interface ComplianceScoreProps {
  /** Current score (0-100) */
  score: number
  /** Previous score for comparison */
  previousScore?: number
  /** Label for the score */
  label?: string
  /** Size variant */
  size?: 'sm' | 'md' | 'lg'
  /** Whether to show the trend indicator */
  showTrend?: boolean
  /** Threshold for warning (default 70) */
  warningThreshold?: number
  /** Threshold for danger (default 50) */
  dangerThreshold?: number
  /** Additional styles */
  style?: ViewStyle
}

const sizeConfig = {
  sm: {
    circleSize: 80,
    fontSize: 18,
    labelSize: 12,
    strokeWidth: 6,
  },
  md: {
    circleSize: 120,
    fontSize: 28,
    labelSize: 14,
    strokeWidth: 8,
  },
  lg: {
    circleSize: 160,
    fontSize: 36,
    labelSize: 16,
    strokeWidth: 10,
  },
} as const

function getScoreColor(score: number, warningThreshold: number, dangerThreshold: number, theme: 'light' | 'dark'): string {
  if (score >= warningThreshold) return colors.fg[theme].success
  if (score >= dangerThreshold) return colors.fg[theme].warning
  return colors.fg[theme].error
}

export function ComplianceScore({
  score,
  previousScore,
  label = 'Compliance Score',
  size = 'md',
  showTrend = true,
  warningThreshold = 70,
  dangerThreshold = 50,
  style,
}: ComplianceScoreProps) {
  const { theme } = useThemeContext()
  const config = sizeConfig[size]
  const scoreColor = getScoreColor(score, warningThreshold, dangerThreshold, theme)
  const normalizedScore = Math.min(100, Math.max(0, score))

  // Calculate trend
  const trend = previousScore !== undefined ? score - previousScore : 0
  const trendDirection = trend > 0 ? 'up' : trend < 0 ? 'down' : 'neutral'

  // Status icon based on score
  const StatusIconComponent =
    score >= warningThreshold ? CheckCircle : score >= dangerThreshold ? AlertTriangle : XCircle

  return (
    <Stack gap={spacing[2]} style={{...styles.container, ...style}}>
      <View
        style={{
          ...styles.circleContainer,
          width: config.circleSize,
          height: config.circleSize,
        }}
      >
        {/* Background circle */}
        <View
          style={{
            ...styles.absoluteCircle,
            width: config.circleSize,
            height: config.circleSize,
            borderRadius: (config.circleSize / 2),
            borderWidth: config.strokeWidth,
            borderColor: colors.border[theme].subtle,
          }}
        />

        {/* Progress circle - simplified approach */}
        <View
          style={{
            ...styles.absoluteCircle,
            width: config.circleSize,
            height: config.circleSize,
            borderRadius: (config.circleSize / 2),
            borderWidth: config.strokeWidth,
            borderColor: scoreColor,
            borderTopColor: normalizedScore < 25 ? 'transparent' : scoreColor,
            borderRightColor: normalizedScore < 50 ? 'transparent' : scoreColor,
            borderBottomColor: normalizedScore < 75 ? 'transparent' : scoreColor,
            transform: [{ rotate: '-90deg' }],
          }}
        />

        <Stack gap={0} style={styles.scoreTextContainer}>
          <Text
            size="xl"
            weight="bold"
            style={{ fontSize: config.fontSize, color: colors.text[theme].primary }}
          >
            {Math.round(score)}
          </Text>
          <Text size="sm" style={{ color: colors.text[theme].secondary }}>
            / 100
          </Text>
        </Stack>

        <View
          style={{
            ...styles.statusIcon,
            backgroundColor: colors.bg[theme].default,
            borderRadius: 20,
          }}
        >
          <StatusIconComponent
            size={size === 'sm' ? 16 : size === 'md' ? 20 : 24}
            color={scoreColor}
          />
        </View>
      </View>

      <Text
        size={size === 'sm' ? 'sm' : size === 'md' ? 'md' : 'lg'}
        style={{...styles.labelText, color: colors.text[theme].secondary}}
      >
        {label}
      </Text>

      {showTrend && previousScore !== undefined && trend !== 0 && (
        <Row
          gap={spacing[2]}
          paddingHorizontal={spacing[2]}
          paddingVertical={spacing[2]}
          style={{
            ...styles.trendContainer,
            backgroundColor:
              trendDirection === 'up'
                ? '#dcfce7'
                : '#fee2e2',
          }}
        >
          {trendDirection === 'up' ? (
            <TrendingUp size={12} color={colors.fg[theme].success} />
          ) : (
            <TrendingDown size={12} color={colors.fg[theme].error} />
          )}
          <Text
            size="xs"
            weight="medium"
            style={{
              color:
                trendDirection === 'up'
                  ? colors.fg[theme].success
                  : colors.fg[theme].error,
            }}
          >
            {trend > 0 ? '+' : ''}
            {trend.toFixed(1)}%
          </Text>
        </Row>
      )}
    </Stack>
  )
}

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
  },
  circleContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
  },
  absoluteCircle: {
    position: 'absolute',
  },
  scoreTextContainer: {
    alignItems: 'center',
  },
  statusIcon: {
    position: 'absolute',
    bottom: 0,
    right: 0,
    padding: 2,
  },
  labelText: {
    textAlign: 'center',
  },
  trendContainer: {
    borderRadius: 9999,
    alignItems: 'center',
  },
})
