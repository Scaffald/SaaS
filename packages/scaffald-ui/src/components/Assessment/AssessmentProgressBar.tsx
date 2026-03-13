/**
 * AssessmentProgressBar - A thin, animated progress bar for assessment flows.
 *
 * Unlike the full-featured ProgressBar component, this is a minimal visual
 * indicator designed for assessment headers and inline progress tracking.
 *
 * @example
 * ```tsx
 * <AssessmentProgressBar value={75} />
 * <AssessmentProgressBar value={50} color={colors.emerald[500]} height={4} />
 * ```
 */

import { useEffect, useMemo } from 'react'
import { View } from 'react-native'
import { AnimatedView } from '../../animation/AnimatedView'
import { useReducedMotion } from '../../animation/useReducedMotion'
import {
  isReanimatedLoaded,
  useSharedValueAsserted,
  useAnimatedStyleAsserted,
  withTimingAsserted,
} from '../../animation/reanimated.types'
import { timingConfigs } from '../../animation/presets'
import { useThemeContext } from '../../theme'
import { colors } from '../../tokens/colors'
import { borderRadius } from '../../tokens/borders'
import type { AssessmentProgressBarProps } from './AssessmentProgressBar.types'

export function AssessmentProgressBar({
  value,
  color,
  trackColor,
  height = 3,
  animated = true,
  style,
}: AssessmentProgressBarProps) {
  const { theme } = useThemeContext()
  const prefersReducedMotion = useReducedMotion()
  const clampedValue = Math.max(0, Math.min(100, value))
  const canAnimate = animated && isReanimatedLoaded && !prefersReducedMotion

  const fillColor = color ?? colors.primary[500]
  const bgColor = trackColor ?? colors.bg[theme].subtle

  const trackStyle = useMemo(
    () => ({
      height,
      backgroundColor: bgColor,
      borderRadius: borderRadius.max,
      overflow: 'hidden' as const,
      width: '100%' as unknown as number,
    }),
    [height, bgColor]
  )

  const fillBaseStyle = useMemo(
    () => ({
      height: '100%' as unknown as number,
      backgroundColor: fillColor,
      borderRadius: borderRadius.max,
    }),
    [fillColor]
  )

  if (canAnimate) {
    return (
      <View style={[trackStyle, style]}>
        <AnimatedFill value={clampedValue} baseStyle={fillBaseStyle} />
      </View>
    )
  }

  return (
    <View style={[trackStyle, style]}>
      <View style={[fillBaseStyle, { width: `${clampedValue}%` as unknown as number }]} />
    </View>
  )
}

/**
 * Internal animated fill (only rendered when Reanimated is available)
 */
function AnimatedFill({
  value,
  baseStyle,
}: {
  value: number
  baseStyle: Record<string, unknown>
}) {
  const progress = useSharedValueAsserted(value)
  const durationMs = timingConfigs.normal.duration

  useEffect(() => {
    progress.value = withTimingAsserted(value, { duration: durationMs })
  }, [value, durationMs, progress])

  const animatedStyle = useAnimatedStyleAsserted(
    () => {
      'worklet'
      return {
        width: `${progress.value}%`,
      }
    },
    [progress]
  )

  return <AnimatedView style={[baseStyle, animatedStyle]} />
}
