import { memo, useMemo } from 'react'
import { Paragraph, SizableText, View, YStack, useTheme } from '@app/ui'
import Svg, { Line, Path, Text as SvgText } from 'react-native-svg'
import { getVariableValue } from 'tamagui'

import type { HireScoreLevel } from '../../../hooks/useHireScore'

const GAUGE_RADIUS = 96
const STROKE_WIDTH = 18
const VIEWBOX_WIDTH = GAUGE_RADIUS * 2 + STROKE_WIDTH * 2
const VIEWBOX_HEIGHT = GAUGE_RADIUS + STROKE_WIDTH * 1.5

const clamp = (value: number, min: number, max: number) => Math.min(max, Math.max(min, value))

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
  const largeArcFlag = Math.abs(endAngle - startAngle) > 180 ? 1 : 0
  return `M ${start.x} ${start.y} A ${radius} ${radius} 0 ${largeArcFlag} 0 ${end.x} ${end.y}`
}

const resolveTokenColor = (theme: ReturnType<typeof useTheme>, token: string, fallback: string) => {
  const tokenKey = token.startsWith('$') ? token.slice(1) : token
  const maybeVariable = (theme as Record<string, unknown>)[tokenKey]
  if (!maybeVariable) return fallback
  const value = typeof maybeVariable === 'string' ? maybeVariable : getVariableValue(maybeVariable)
  return typeof value === 'string' ? value : fallback
}

type HireScoreGaugeProps = {
  score: number
  level: HireScoreLevel
  isLoading?: boolean
}

const TICKS = [0, 25, 50, 75, 100]

export const HireScoreGauge = memo(({ score, level, isLoading }: HireScoreGaugeProps) => {
  const theme = useTheme()
  const accent = useMemo(
    () => resolveTokenColor(theme, level.tone, getVariableValue(theme.color12)),
    [level.tone, theme]
  )
  const trackColor = useMemo(() => getVariableValue(theme.color5), [theme])
  const tickColor = useMemo(() => getVariableValue(theme.color7), [theme])
  const textColor = useMemo(() => getVariableValue(theme.color12), [theme])

  const normalized = isLoading ? 0 : clamp(score, 0, 100)
  const endAngle = 180 - (normalized / 100) * 180
  const hasProgress = normalized > 0
  const label = isLoading ? 'Calculating' : level.label

  const trackPath = useMemo(
    () => describeArc(VIEWBOX_WIDTH / 2, VIEWBOX_WIDTH / 2, GAUGE_RADIUS, 180, 0),
    []
  )

  const progressPath = useMemo(() => {
    if (!hasProgress) return ''
    return describeArc(VIEWBOX_WIDTH / 2, VIEWBOX_WIDTH / 2, GAUGE_RADIUS, 180, endAngle)
  }, [endAngle, hasProgress])

  return (
    <YStack ai="center" gap="$2">
      <View width={VIEWBOX_WIDTH} height={VIEWBOX_HEIGHT} position="relative">
        <Svg width="100%" height="100%" viewBox={`0 0 ${VIEWBOX_WIDTH} ${VIEWBOX_HEIGHT}`}>
          <Path
            d={trackPath}
            stroke={trackColor}
            strokeWidth={STROKE_WIDTH}
            fill="none"
            strokeLinecap="round"
          />
          {progressPath ? (
            <Path
              d={progressPath}
              stroke={accent}
              strokeWidth={STROKE_WIDTH}
              fill="none"
              strokeLinecap="round"
            />
          ) : null}
          {TICKS.map((value) => {
            const angle = 180 - (value / 100) * 180
            const inner = polarToCartesian(
              VIEWBOX_WIDTH / 2,
              VIEWBOX_WIDTH / 2,
              GAUGE_RADIUS - STROKE_WIDTH * 0.55,
              angle
            )
            const outer = polarToCartesian(
              VIEWBOX_WIDTH / 2,
              VIEWBOX_WIDTH / 2,
              GAUGE_RADIUS + STROKE_WIDTH * 0.3,
              angle
            )
            return (
              <Line
                key={value}
                x1={inner.x}
                y1={inner.y}
                x2={outer.x}
                y2={outer.y}
                stroke={tickColor}
                strokeWidth={2}
                strokeLinecap="round"
              />
            )
          })}
        </Svg>
        <YStack
          position="absolute"
          top={0}
          left={0}
          right={0}
          bottom={0}
          ai="center"
          jc="center"
          gap={6}
        >
          <Paragraph size="$2" color={level.tone} fontWeight="600">
            {label}
          </Paragraph>
          <SizableText size="$9" color={textColor} fontWeight="800">
            {isLoading ? '—' : normalized}
          </SizableText>
        </YStack>
      </View>
      <View width="100%" maxWidth={VIEWBOX_WIDTH} px="$2">
        <Svg width="100%" height={16} viewBox={`0 0 ${VIEWBOX_WIDTH} 16`}>
          {TICKS.map((value) => (
            <SvgText
              key={value}
              x={(VIEWBOX_WIDTH / 100) * value}
              y={12}
              fontSize={11}
              fill={tickColor}
              textAnchor="middle"
            >
              {value}
            </SvgText>
          ))}
        </Svg>
      </View>
    </YStack>
  )
})

HireScoreGauge.displayName = 'HireScoreGauge'
