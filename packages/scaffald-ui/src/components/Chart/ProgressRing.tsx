/**
 * ProgressRing component
 * Circular progress indicator with centered label
 *
 * @example
 * ```tsx
 * <ProgressRing value={75} label="Skills" size="md" />
 * ```
 */

import { View, Text } from 'react-native'
import Svg, { Circle } from 'react-native-svg'
import type { ProgressRingProps } from './Chart.types'
import { colors } from '../../tokens/colors'
import { typography } from '../../tokens/typography'

const RING_SIZES = {
  sm: { diameter: 56, strokeWidth: 4, valueFontSize: 14, labelFontSize: 8 },
  md: { diameter: 80, strokeWidth: 5, valueFontSize: 18, labelFontSize: 10 },
  lg: { diameter: 110, strokeWidth: 6, valueFontSize: 24, labelFontSize: 12 },
} as const

export function ProgressRing({
  value,
  label,
  size = 'md',
  color = colors.primary[500],
  style,
}: ProgressRingProps) {
  const clampedValue = Math.max(0, Math.min(100, value))
  const config = RING_SIZES[size]
  const { diameter, strokeWidth, valueFontSize, labelFontSize } = config

  const center = diameter / 2
  const radius = (diameter - strokeWidth) / 2
  const circumference = 2 * Math.PI * radius
  const offset = circumference - (clampedValue / 100) * circumference

  return (
    <View
      style={[
        {
          width: diameter,
          height: diameter,
          alignItems: 'center',
          justifyContent: 'center',
        },
        style,
      ]}
    >
      <Svg width={diameter} height={diameter} viewBox={`0 0 ${diameter} ${diameter}`}>
        {/* Background ring */}
        <Circle
          cx={center}
          cy={center}
          r={radius}
          fill="none"
          stroke={colors.gray[200]}
          strokeWidth={strokeWidth}
        />
        {/* Progress arc */}
        <Circle
          cx={center}
          cy={center}
          r={radius}
          fill="none"
          stroke={color}
          strokeWidth={strokeWidth}
          strokeDasharray={circumference}
          strokeDashoffset={offset}
          strokeLinecap="round"
          transform={`rotate(-90 ${center} ${center})`}
        />
      </Svg>

      {/* Center text overlay */}
      <View style={{ position: 'absolute', alignItems: 'center', justifyContent: 'center' }}>
        <Text
          style={{
            fontFamily: typography.body.fontFamily,
            fontSize: valueFontSize,
            fontWeight: '700',
            color: colors.text.light.primary,
          }}
        >
          {Math.round(clampedValue)}%
        </Text>
        {label && (
          <Text
            style={{
              fontFamily: typography.caption.fontFamily,
              fontSize: labelFontSize,
              color: colors.text.light.tertiary,
              marginTop: 1,
            }}
            numberOfLines={1}
          >
            {label}
          </Text>
        )}
      </View>
    </View>
  )
}
