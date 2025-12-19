/**
 * ComplianceScore - Visual indicator of compliance status
 */

import { styled, YStack, XStack, Text, View, type YStackProps } from 'tamagui'
import { CheckCircle, AlertTriangle, XCircle, TrendingUp, TrendingDown } from '@tamagui/lucide-icons'

export interface ComplianceScoreProps extends Omit<YStackProps, 'children'> {
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
}

const sizeConfig = {
  sm: {
    circleSize: 80,
    fontSize: '$5',
    labelSize: '$2',
    strokeWidth: 6,
  },
  md: {
    circleSize: 120,
    fontSize: '$7',
    labelSize: '$3',
    strokeWidth: 8,
  },
  lg: {
    circleSize: 160,
    fontSize: '$9',
    labelSize: '$4',
    strokeWidth: 10,
  },
} as const

const ScoreContainer = styled(YStack, {
  name: 'ComplianceScore',
  alignItems: 'center',
  gap: '$2',
})

const CircleContainer = styled(View, {
  name: 'ComplianceScoreCircle',
  alignItems: 'center',
  justifyContent: 'center',
  position: 'relative',
})

const ScoreText = styled(Text, {
  name: 'ComplianceScoreText',
  fontWeight: '700',
  color: '$color12',
})

const LabelText = styled(Text, {
  name: 'ComplianceScoreLabel',
  color: '$color9',
  textAlign: 'center',
})

const TrendContainer = styled(XStack, {
  name: 'ComplianceScoreTrend',
  alignItems: 'center',
  gap: '$1',
  paddingHorizontal: '$2',
  paddingVertical: '$1',
  borderRadius: '$full',
})

const TrendText = styled(Text, {
  name: 'ComplianceScoreTrendText',
  fontSize: '$2',
  fontWeight: '500',
})

const StatusIcon = styled(View, {
  name: 'ComplianceScoreStatusIcon',
  position: 'absolute',
  bottom: 0,
  right: 0,
  borderRadius: '$full',
  backgroundColor: '$background',
  padding: 2,
})

function getScoreColor(score: number, warningThreshold: number, dangerThreshold: number): string {
  if (score >= warningThreshold) return '$green9'
  if (score >= dangerThreshold) return '$yellow9'
  return '$red9'
}

export function ComplianceScore({
  score,
  previousScore,
  label = 'Compliance Score',
  size = 'md',
  showTrend = true,
  warningThreshold = 70,
  dangerThreshold = 50,
  ...props
}: ComplianceScoreProps) {
  const config = sizeConfig[size]
  const scoreColor = getScoreColor(score, warningThreshold, dangerThreshold)
  const normalizedScore = Math.min(100, Math.max(0, score))

  // Calculate trend
  const trend = previousScore !== undefined ? score - previousScore : 0
  const trendDirection = trend > 0 ? 'up' : trend < 0 ? 'down' : 'neutral'

  // Status icon based on score
  const StatusIconComponent =
    score >= warningThreshold ? CheckCircle : score >= dangerThreshold ? AlertTriangle : XCircle

  return (
    <ScoreContainer {...props}>
      <CircleContainer width={config.circleSize} height={config.circleSize}>
        {/* Background circle */}
        <View
          position="absolute"
          width={config.circleSize}
          height={config.circleSize}
          borderRadius={config.circleSize / 2}
          borderWidth={config.strokeWidth}
          borderColor="$color4"
        />

        {/* SVG would be ideal here, but using a simple View approach */}
        <View
          position="absolute"
          width={config.circleSize}
          height={config.circleSize}
          borderRadius={config.circleSize / 2}
          borderWidth={config.strokeWidth}
          borderColor={scoreColor}
          borderTopColor={normalizedScore < 25 ? 'transparent' : scoreColor}
          borderRightColor={normalizedScore < 50 ? 'transparent' : scoreColor}
          borderBottomColor={normalizedScore < 75 ? 'transparent' : scoreColor}
          transform={[{ rotate: '-90deg' }]}
        />

        <YStack alignItems="center">
          <ScoreText fontSize={config.fontSize}>{Math.round(score)}</ScoreText>
          <Text fontSize="$2" color="$color9">
            / 100
          </Text>
        </YStack>

        <StatusIcon>
          <StatusIconComponent size={size === 'sm' ? 16 : size === 'md' ? 20 : 24} color={scoreColor} />
        </StatusIcon>
      </CircleContainer>

      <LabelText fontSize={config.labelSize}>{label}</LabelText>

      {showTrend && previousScore !== undefined && trend !== 0 && (
        <TrendContainer
          backgroundColor={trendDirection === 'up' ? '$green3' : '$red3'}
        >
          {trendDirection === 'up' ? (
            <TrendingUp size={12} color="$green11" />
          ) : (
            <TrendingDown size={12} color="$red11" />
          )}
          <TrendText color={trendDirection === 'up' ? '$green11' : '$red11'}>
            {trend > 0 ? '+' : ''}{trend.toFixed(1)}%
          </TrendText>
        </TrendContainer>
      )}
    </ScoreContainer>
  )
}
