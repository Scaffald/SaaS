import type { FC } from 'react'
import { ArrowDown, ArrowUp, Minus } from '@tamagui/lucide-icons'
import { Circle, Svg } from 'react-native-svg'
import { Card, Text, View, XStack, YStack } from 'tamagui'

export interface VersionHistoryItem {
  version: number
  rating: number
  date: string
}

export interface IndividualSkillRadarChartProps {
  skillName: string
  selfRating: number // 1-5
  peerRating?: number // 1-5, optional
  versionHistory?: VersionHistoryItem[]
  showTrend?: boolean
  size?: 'small' | 'medium' | 'large'
  onPress?: () => void
}

const sizeConfig = {
  small: {
    chartSize: 120,
    titleSize: '$3' as const,
    valueSize: '$4' as const,
  },
  medium: {
    chartSize: 160,
    titleSize: '$4' as const,
    valueSize: '$5' as const,
  },
  large: {
    chartSize: 200,
    titleSize: '$5' as const,
    valueSize: '$6' as const,
  },
} as const

const calculateTrend = (history: VersionHistoryItem[]): 'up' | 'down' | 'stable' | null => {
  if (history.length < 2) return null

  const sorted = [...history].sort((a, b) => a.version - b.version)
  const first = sorted[0].rating
  const last = sorted[sorted.length - 1].rating

  if (last > first) return 'up'
  if (last < first) return 'down'
  return 'stable'
}

/**
 * Individual Skill Radar Chart component
 *
 * Displays a single soft skill's rating on a mini radar chart with support for
 * overlaying self-assessment, peer reviews, and version history trend indicators.
 *
 * @param skillName - Name of the skill to display
 * @param selfRating - Self-assessed rating (1-5)
 * @param peerRating - Optional peer review average (1-5)
 * @param versionHistory - Optional version history with ratings
 * @param showTrend - Whether to show trend indicator from version history
 * @param size - Chart size variant (small, medium, large)
 * @param onPress - Optional press handler for interactivity
 * @returns JSX element
 *
 * @example
 * ```tsx
 * <IndividualSkillRadarChart
 *   skillName="Communication"
 *   selfRating={4}
 *   peerRating={4.5}
 *   size="medium"
 * />
 * ```
 */
export const IndividualSkillRadarChart: FC<IndividualSkillRadarChartProps> = ({
  skillName,
  selfRating,
  peerRating,
  versionHistory,
  showTrend = false,
  size = 'medium',
  onPress,
}) => {
  const config = sizeConfig[size]
  const maxValue = 5 // Soft skills are rated 1-5

  // Calculate percentage for circular gauge
  const selfPercentage = (selfRating / maxValue) * 100
  const peerPercentage =
    peerRating !== undefined && peerRating !== null ? (peerRating / maxValue) * 100 : null

  // Circular gauge parameters
  const radius = config.chartSize / 2 - 20
  const strokeWidth = size === 'small' ? 8 : size === 'medium' ? 10 : 12
  const circumference = 2 * Math.PI * radius

  const trend = versionHistory && showTrend ? calculateTrend(versionHistory) : null

  const content = (
    <Card
      elevate
      bordered
      bg="$background"
      p="$3"
      minHeight={config.chartSize + 80}
      cursor={onPress ? 'pointer' : 'default'}
      onPress={onPress}
    >
      <YStack gap="$2" items="center">
        {/* Skill Name */}
        <XStack gap="$2" items="center" justify="center" flexWrap="wrap">
          <Text fontSize={config.titleSize} fontWeight="600" color="$color12" numberOfLines={2}>
            {skillName}
          </Text>
          {trend && (
            <View>
              {trend === 'up' && <ArrowUp size={14} color="$green10" />}
              {trend === 'down' && <ArrowDown size={14} color="$red10" />}
              {trend === 'stable' && <Minus size={14} color="$gray10" />}
            </View>
          )}
        </XStack>

        {/* Circular Gauge Chart */}
        <View
          height={config.chartSize}
          width={config.chartSize}
          items="center"
          justify="center"
          position="relative"
        >
          <Svg height={config.chartSize} width={config.chartSize}>
            {/* Background circle */}
            <Circle
              cx={config.chartSize / 2}
              cy={config.chartSize / 2}
              r={radius}
              stroke="#E0E0E0"
              strokeWidth={strokeWidth}
              fill="none"
            />
            {peerPercentage !== null ? (
              <>
                {/* Self rating gauge (inner ring) */}
                <Circle
                  cx={config.chartSize / 2}
                  cy={config.chartSize / 2}
                  r={radius}
                  stroke="#1B6B93"
                  strokeWidth={strokeWidth}
                  fill="none"
                  strokeDasharray={circumference}
                  strokeDashoffset={circumference - (selfPercentage / 100) * circumference}
                  transform={`rotate(-90 ${config.chartSize / 2} ${config.chartSize / 2})`}
                  strokeLinecap="round"
                />
                {/* Peer rating gauge (outer ring) */}
                <Circle
                  cx={config.chartSize / 2}
                  cy={config.chartSize / 2}
                  r={radius + strokeWidth * 0.6}
                  stroke="#22C55E"
                  strokeWidth={strokeWidth * 0.8}
                  fill="none"
                  strokeDasharray={circumference + strokeWidth * 0.6 * 2 * Math.PI}
                  strokeDashoffset={
                    circumference +
                    strokeWidth * 0.6 * 2 * Math.PI -
                    (peerPercentage / 100) * (circumference + strokeWidth * 0.6 * 2 * Math.PI)
                  }
                  transform={`rotate(-90 ${config.chartSize / 2} ${config.chartSize / 2})`}
                  strokeLinecap="round"
                />
              </>
            ) : (
              <Circle
                cx={config.chartSize / 2}
                cy={config.chartSize / 2}
                r={radius}
                stroke="#1B6B93"
                strokeWidth={strokeWidth}
                fill="none"
                strokeDasharray={circumference}
                strokeDashoffset={circumference - (selfPercentage / 100) * circumference}
                transform={`rotate(-90 ${config.chartSize / 2} ${config.chartSize / 2})`}
                strokeLinecap="round"
              />
            )}
          </Svg>
        </View>

        {/* Rating Value */}
        <YStack gap="$1" items="center">
          <Text fontSize={config.valueSize} fontWeight="700" color="$color12">
            {selfRating.toFixed(1)}/5
          </Text>
          {peerRating !== undefined && peerRating !== null && (
            <Text fontSize="$2" color="$color10">
              Peer: {peerRating.toFixed(1)}
            </Text>
          )}
        </YStack>

        {/* Legend (if both self and peer are shown) */}
        {peerRating !== undefined && peerRating !== null && (
          <XStack gap="$3" items="center">
            <XStack gap="$1" items="center">
              <View width={12} height={12} bg="$blue10" rounded="$1" />
              <Text fontSize="$1" color="$color11">
                Self
              </Text>
            </XStack>
            <XStack gap="$1" items="center">
              <View width={12} height={12} bg="$green10" rounded="$1" />
              <Text fontSize="$1" color="$color11">
                Peer
              </Text>
            </XStack>
          </XStack>
        )}
      </YStack>
    </Card>
  )

  return content
}
