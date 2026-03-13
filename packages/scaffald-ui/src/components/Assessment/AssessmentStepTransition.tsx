/**
 * AssessmentStepTransition - Animated wrapper for assessment step transitions.
 *
 * Slides content in/out when the step key changes, with configurable direction.
 * Falls back to instant swap when Reanimated is not available or reduced motion
 * is preferred.
 *
 * @example
 * ```tsx
 * const [direction, setDirection] = useState(1)
 *
 * <AssessmentStepTransition stepKey={currentStep} direction={direction}>
 *   {currentStep === 'intro' && <IntroStep />}
 *   {currentStep === 'question' && <QuestionStep />}
 * </AssessmentStepTransition>
 * ```
 */

import { useEffect, useRef, useState, type ReactNode } from 'react'
import { View, type ViewStyle } from 'react-native'
import { AnimatedView } from '../../animation/AnimatedView'
import { useReducedMotion } from '../../animation/useReducedMotion'
import {
  isReanimatedLoaded,
  useSharedValueAsserted,
  useAnimatedStyleAsserted,
  withTimingAsserted,
} from '../../animation/reanimated.types'
import { timingConfigs } from '../../animation/presets'

export interface AssessmentStepTransitionProps {
  /**
   * Key that identifies the current step. Transition triggers when this changes.
   */
  stepKey: string

  /**
   * Slide direction: 1 = forward (slide left), -1 = backward (slide right)
   * @default 1
   */
  direction?: 1 | -1

  /**
   * Slide distance in pixels
   * @default 40
   */
  distance?: number

  /**
   * Children to render
   */
  children: ReactNode

  /**
   * Additional container styles
   */
  style?: ViewStyle
}

export function AssessmentStepTransition({
  stepKey,
  direction = 1,
  distance = 40,
  children,
  style,
}: AssessmentStepTransitionProps) {
  const prefersReducedMotion = useReducedMotion()
  const canAnimate = isReanimatedLoaded && !prefersReducedMotion
  const prevKeyRef = useRef(stepKey)
  const isFirstRender = useRef(true)

  if (!canAnimate) {
    return <View style={style}>{children}</View>
  }

  return (
    <ReanimatedStepTransition
      stepKey={stepKey}
      direction={direction}
      distance={distance}
      style={style}
      prevKeyRef={prevKeyRef}
      isFirstRender={isFirstRender}
    >
      {children}
    </ReanimatedStepTransition>
  )
}

function ReanimatedStepTransition({
  stepKey,
  direction,
  distance = 40,
  children,
  style,
  prevKeyRef,
  isFirstRender,
}: AssessmentStepTransitionProps & {
  prevKeyRef: React.MutableRefObject<string>
  isFirstRender: React.MutableRefObject<boolean>
}) {
  const translateX = useSharedValueAsserted(0)
  const opacity = useSharedValueAsserted(1)
  const [displayKey, setDisplayKey] = useState(stepKey)
  const [displayChildren, setDisplayChildren] = useState(children)
  const exitTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const pendingStepKeyRef = useRef<string | null>(null)

  const durationMs = timingConfigs.normal.duration

  useEffect(() => {
    if (isFirstRender.current) {
      isFirstRender.current = false
      prevKeyRef.current = stepKey
      return
    }

    if (stepKey === prevKeyRef.current) {
      // Same step, just update children
      setDisplayChildren(children)
      return
    }

    // Cancel any pending transition so an older timeout cannot overwrite display state
    if (exitTimeoutRef.current != null) {
      clearTimeout(exitTimeoutRef.current)
      exitTimeoutRef.current = null
    }

    const dir = direction ?? 1
    pendingStepKeyRef.current = stepKey

    // Slide out current content
    translateX.value = withTimingAsserted(
      -dir * distance!,
      { duration: durationMs * 0.4 },
      (finished) => {
        'worklet'
        if (finished) {
          // Done handled below
        }
      }
    )
    opacity.value = withTimingAsserted(0, { duration: durationMs * 0.4 })

    // After exit, mount new content and slide in
    const exitDuration = durationMs * 0.4
    exitTimeoutRef.current = setTimeout(() => {
      exitTimeoutRef.current = null
      // Only apply if this transition is still the current one (guard against stale callback)
      if (pendingStepKeyRef.current !== stepKey) return
      setDisplayKey(stepKey)
      setDisplayChildren(children)
      prevKeyRef.current = stepKey

      // Start from offset position
      translateX.value = dir * distance!
      opacity.value = 0

      // Slide in
      requestAnimationFrame(() => {
        translateX.value = withTimingAsserted(0, { duration: durationMs * 0.6 })
        opacity.value = withTimingAsserted(1, { duration: durationMs * 0.6 })
      })
    }, exitDuration)

    return () => {
      if (exitTimeoutRef.current != null) {
        clearTimeout(exitTimeoutRef.current)
        exitTimeoutRef.current = null
      }
    }
  }, [stepKey]) // eslint-disable-line react-hooks/exhaustive-deps

  // Update children if step hasn't changed (e.g., state updates within step)
  useEffect(() => {
    if (stepKey === displayKey) {
      setDisplayChildren(children)
    }
  }, [children, stepKey, displayKey])

  const animatedStyle = useAnimatedStyleAsserted(
    () => {
      'worklet'
      return {
        transform: [{ translateX: translateX.value }],
        opacity: opacity.value,
      }
    },
    [translateX, opacity]
  )

  return (
    <AnimatedView style={[style, animatedStyle]} key={displayKey}>
      {displayChildren}
    </AnimatedView>
  )
}
