import { Paragraph, SizableText, XStack, YStack, useTheme } from '@app/ui'
import { AlertTriangle, TrendingUp } from '@tamagui/lucide-icons'
import { Line, Path, Svg } from 'react-native-svg'

import type {
  HireScoreBreakdownEntry,
  HireScoreResult,
} from '../../../utils/hireScore'
import { DashboardCard } from '../primitives'

export type DashboardHeroProps = {
  name?: string
  score: HireScoreResult
}

const toneToToken = {
  positive: 'green10',
  caution: 'yellow10',
  critical: 'red10',
} as const satisfies Record<HireScoreResult['tone'], string>

const START_ANGLE = -90
const END_ANGLE = 90
const GAUGE_RADIUS = 110
const GAUGE_STROKE = 18
const GAUGE_SIZE = GAUGE_RADIUS * 2 + GAUGE_STROKE
const GAUGE_CONTAINER_HEIGHT = GAUGE_SIZE / 2 + GAUGE_STROKE

const clamp = (value: number, min: number, max: number) => Math.min(Math.max(value, min), max)

const polarToCartesian = (cx: number, cy: number, radius: number, angle: number) => {
  const radians = ((angle - 90) * Math.PI) / 180
  return {
    x: cx + radius * Math.cos(radians),
    y: cy + radius * Math.sin(radians),
  }
}

const describeArc = (
  cx: number,
  cy: number,
  radius: number,
  startAngle: number,
  endAngle: number
) => {
  const start = polarToCartesian(cx, cy, radius, endAngle)
  const end = polarToCartesian(cx, cy, radius, startAngle)
  const largeArcFlag = Math.abs(endAngle - startAngle) <= 180 ? '0' : '1'
  const sweepFlag = endAngle > startAngle ? '1' : '0'
  return `M ${start.x} ${start.y} A ${radius} ${radius} 0 ${largeArcFlag} ${sweepFlag} ${end.x} ${end.y}`
}

export const DashboardHero = ({ name = 'there', score }: DashboardHeroProps) => {
  const theme = useTheme()
  const gaugeColor = theme[toneToToken[score.tone]].val
  const trackColor = theme.gray5.val
  const positiveIconColor = theme.green10.val
  const negativeIconColor = theme.red10.val
  const improvementItems = score.nextSteps.filter(
    (entry) => !score.activities.some((activity) => activity.id === entry.id)
  )

  return (
    <DashboardCard>
      <YStack gap="$5">
        <YStack gap="$2">
          <SizableText size="$8" fontWeight="700">
            Welcome back, {name}
          </SizableText>
          <Paragraph size="$2" color="$gray11">
            Your Hire Score shows how ready you are for new opportunities and highlights what to
            do next.
          </Paragraph>
        </YStack>

        <XStack gap="$6" $sm={{ fd: 'column', gap: '$5' }} fw="wrap">
          <YStack ai="center" gap="$3" miw={240} $sm={{ miw: 'auto' }}>
            <HireScoreGauge value={score.total} max={score.max} color={gaugeColor} track={trackColor} />

            <YStack ai="center" gap="$1" px="$3">
              <SizableText size="$6" fontWeight="600">
                {score.label}
              </SizableText>
              <Paragraph size="$2" color="$gray11" ta="center">
                {score.message}
              </Paragraph>
            </YStack>
          </YStack>

          <YStack f={1} gap="$3" miw={240}>
            <YStack gap="$1">
              <SizableText size="$4" fontWeight="600">
                Score activity
              </SizableText>
              <Paragraph size="$2" color="$gray11">
                Recent actions that raised or lowered your Hire Score.
              </Paragraph>
            </YStack>

            <YStack gap="$3">
              {score.activities.length > 0 ? (
                score.activities.slice(0, 4).map((entry) => (
                  <HireScoreActivityRow
                    key={entry.id}
                    entry={entry}
                    positiveColor={positiveIconColor}
                    negativeColor={negativeIconColor}
                  />
                ))
              ) : (
                <Paragraph size="$2" color="$gray11">
                  Complete profile items to start building your Hire Score.
                </Paragraph>
              )}
            </YStack>
          </YStack>

          <YStack f={1} gap="$3" miw={240}>
            <YStack gap="$1">
              <SizableText size="$4" fontWeight="600">
                Next steps
              </SizableText>
              <Paragraph size="$2" color="$gray11">
                Complete these items to increase your Hire Score.
              </Paragraph>
            </YStack>

            <YStack gap="$3">
              {improvementItems.length > 0 ? (
                improvementItems.slice(0, 3).map((entry) => (
                  <HireScoreNextStepRow key={entry.id} entry={entry} negativeColor={negativeIconColor} />
                ))
              ) : (
                <Paragraph size="$2" color="$gray11">
                  You have completed every Hire Score task — great work!
                </Paragraph>
              )}
            </YStack>
          </YStack>
        </XStack>
      </YStack>
    </DashboardCard>
  )
}

type HireScoreGaugeProps = {
  value: number
  max: number
  color: string
  track: string
}

const HireScoreGauge = ({ value, max, color, track }: HireScoreGaugeProps) => {
  const clamped = max > 0 ? clamp(value / max, 0, 1) : 0
  const progressAngle = START_ANGLE + (END_ANGLE - START_ANGLE) * clamped
  const pointerAngle = clamped > 0 ? progressAngle : START_ANGLE
  const pointerColor = clamped > 0 ? color : track
  const center = GAUGE_SIZE / 2

  const trackPath = describeArc(center, center, GAUGE_RADIUS, START_ANGLE, END_ANGLE)
  const progressPath =
    clamped <= 0
      ? null
      : describeArc(center, center, GAUGE_RADIUS, START_ANGLE, progressAngle)

  const pointerInner = polarToCartesian(center, center, GAUGE_RADIUS - GAUGE_STROKE / 2, pointerAngle)
  const pointerOuter = polarToCartesian(center, center, GAUGE_RADIUS + 8, pointerAngle)

  return (
    <YStack
      w={GAUGE_SIZE}
      h={GAUGE_CONTAINER_HEIGHT}
      overflow="hidden"
      position="relative"
      ai="center"
    >
      <Svg width={GAUGE_SIZE} height={GAUGE_SIZE} viewBox={`0 0 ${GAUGE_SIZE} ${GAUGE_SIZE}`}>
        <Path d={trackPath} stroke={track} strokeWidth={GAUGE_STROKE} strokeLinecap="round" fill="none" />
        {progressPath ? (
          <Path d={progressPath} stroke={color} strokeWidth={GAUGE_STROKE} strokeLinecap="round" fill="none" />
        ) : null}
        <Line
          x1={pointerInner.x}
          y1={pointerInner.y}
          x2={pointerOuter.x}
          y2={pointerOuter.y}
          stroke={pointerColor}
          strokeWidth={4}
          strokeLinecap="round"
        />
      </Svg>

      <YStack position="absolute" top="52%" w="100%" ai="center" gap="$1">
        <SizableText size="$9" fontWeight="800">
          {Math.round(value)}
        </SizableText>
        <Paragraph size="$2" color="$gray11">
          out of {max}
        </Paragraph>
      </YStack>
    </YStack>
  )
}

type HireScoreActivityRowProps = {
  entry: HireScoreBreakdownEntry
  positiveColor: string
  negativeColor: string
}

const HireScoreActivityRow = ({ entry, positiveColor, negativeColor }: HireScoreActivityRowProps) => {
  const isPositive = entry.impact > 0

  return (
    <XStack ai="flex-start" gap="$3">
      <YStack
        w={36}
        h={36}
        br={9999}
        ai="center"
        jc="center"
        bg={isPositive ? '$green4' : '$red4'}
      >
        {isPositive ? (
          <TrendingUp size={18} color={positiveColor} />
        ) : (
          <AlertTriangle size={18} color={negativeColor} />
        )}
      </YStack>

      <YStack f={1} gap="$1">
        <XStack ai="center" jc="space-between" gap="$3">
          <SizableText size="$3" fontWeight="600">
            {entry.title}
          </SizableText>
          <SizableText size="$3" fontWeight="600" color={isPositive ? '$green10' : '$red10'}>
            {formatImpact(entry.impact)}
          </SizableText>
        </XStack>
        <Paragraph size="$2" color="$gray11">
          {entry.description}
        </Paragraph>
      </YStack>
    </XStack>
  )
}

type HireScoreNextStepRowProps = {
  entry: HireScoreBreakdownEntry
  negativeColor: string
}

const HireScoreNextStepRow = ({ entry, negativeColor }: HireScoreNextStepRowProps) => {
  const availablePoints = Math.abs(entry.impact)

  return (
    <XStack ai="flex-start" gap="$3">
      <YStack w={36} h={36} br={9999} ai="center" jc="center" bg="$red4">
        <AlertTriangle size={18} color={negativeColor} />
      </YStack>

      <YStack f={1} gap="$1">
        <XStack ai="center" jc="space-between" gap="$3">
          <SizableText size="$3" fontWeight="600">
            {entry.title}
          </SizableText>
          <Paragraph size="$2" color="$gray11">
            +{availablePoints} pts available
          </Paragraph>
        </XStack>
        <Paragraph size="$2" color="$gray11">
          {entry.description}
        </Paragraph>
      </YStack>
    </XStack>
  )
}

const formatImpact = (impact: number) => {
  const absolute = Math.abs(impact)
  if (absolute === 0) return '0 pts'
  const prefix = impact > 0 ? '+' : '-'
  return `${prefix}${absolute} pts`
}
