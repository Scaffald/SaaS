import { useCallback, useEffect, useMemo, useState } from 'react'
import type { FC } from 'react'
import { PanResponder } from 'react-native'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import {
  AnimatePresence,
  Circle,
  Image,
  useTheme,
  useWindowDimensions,
  XStack,
  YStack,
} from 'tamagui'

import { OnboardingControls } from './OnboardingControls'

export type OnboardingStepInfo = {
  Content: FC
  backgroundImage?: string
}

export type OnboardingProps = {
  /**
   * native only
   */
  onOnboarded?: () => void
  /**
   * web only
   */
  autoSwipe?: boolean
  steps: OnboardingStepInfo[]
}

const AUTO_SWIPE_THRESHOLD = 15_000 // ms
export const Onboarding = ({ onOnboarded, autoSwipe, steps }: OnboardingProps) => {
  const [stepIdx, _setStepIdx] = useState(0)
  // prevent a background to ever "continue" animation / try to continue where it left off - cause looks weird

  const [key, setKey] = useState(0)
  const stepsCount = steps.length
  const currentStep = steps[stepIdx] || steps[0]

  const setStepIdx = useCallback(
    (newIdx: number) => {
      if (stepIdx !== newIdx) {
        _setStepIdx(newIdx)
        setKey(key + 1)
      }
    },
    [key, stepIdx]
  )

  useEffect(() => {
    if (autoSwipe) {
      const interval = setTimeout(() => {
        if (stepIdx >= stepsCount - 1) {
          setStepIdx(0)
        } else {
          setStepIdx(stepIdx + 1)
        }
      }, AUTO_SWIPE_THRESHOLD)
      return () => clearTimeout(interval)
    }
  }, [stepIdx, autoSwipe, stepsCount, setStepIdx])

  const panResponder = useMemo(() => {
    return PanResponder.create({
      onMoveShouldSetPanResponderCapture: (_event, gesture) => {
        const THRESHOLD = 100
        if (gesture.dx > THRESHOLD) {
          setStepIdx(Math.max(0, stepIdx - 1))
          return true
        }
        if (gesture.dx < -THRESHOLD) {
          setStepIdx(Math.min(stepsCount - 1, stepIdx + 1))
          return true
        }
        return false
      },
    })
  }, [setStepIdx, stepIdx, stepsCount])

  const safeAreaInsets = useSafeAreaInsets()

  return (
    <YStack
      flex={1}
      bg="$color3"
      overflow="hidden"
      pb={safeAreaInsets.bottom}
      pr={safeAreaInsets.right}
      pt={safeAreaInsets.top}
      pl={safeAreaInsets.left}
    >
      <AnimatePresence>
        <Background key={key} backgroundImage={currentStep.backgroundImage} />
      </AnimatePresence>

      <YStack flex={1} {...panResponder.panHandlers}>
        <AnimatePresence>
          <currentStep.Content key={key} />
        </AnimatePresence>
      </YStack>

      <XStack gap={10} justify="center" my="$4">
        {Array.from({ length: stepsCount }, (_, idx) => {
          const isActive = idx === stepIdx
          return (
            <Point
              key={`point-${idx}-${stepsCount}`}
              active={isActive}
              onPress={() => setStepIdx(idx)}
            />
          )
        })}
      </XStack>
      <OnboardingControls
        currentIdx={stepIdx}
        onChange={(val) => setStepIdx(val)}
        stepsCount={stepsCount}
        onFinish={onOnboarded}
      />
    </YStack>
  )
}

const Point = ({ active, onPress }: { active: boolean; onPress: () => void }) => {
  return (
    <YStack
      rounded="$10"
      width={active ? 30 : 10}
      height={10}
      onPress={onPress}
      bg={active ? '$color7' : '$color6'}
    />
  )
}

export const Background = ({ backgroundImage }: { backgroundImage?: string }) => {
  const { height } = useWindowDimensions()
  const theme = useTheme()

  // Determine if theme is dark based on background color
  const isDarkTheme =
    theme.color1?.val?.includes('hsl(0, 0%, 10%)') ||
    theme.color1?.val?.includes('hsl(0, 0%, 20%)') ||
    theme.color1?.val?.includes('hsl(0, 0%, 30%)')

  if (backgroundImage) {
    return (
      <YStack fullscreen>
        <Image
          source={{ uri: backgroundImage }}
          flex={1}
          height="100%"
          resizeMode="cover"
          position="absolute"
          t={0}
          l={0}
          r={0}
          b={0}
        />
        {/* Theme-sensitive overlay with blur for better text readability */}
        <YStack
          fullscreen
          bg={isDarkTheme ? 'rgba(0, 0, 0, 0.5)' : 'rgba(255, 255, 255, 0.5)'}
          position="absolute"
          style={{
            backdropFilter: 'blur(8px)',
            WebkitBackdropFilter: 'blur(8px)',
          }}
        />
      </YStack>
    )
  }

  return (
    <YStack fullscreen justify="center" items="center">
      <Circle
        animation="lazy"
        x={0}
        y={0}
        opacity={1}
        scale={1}
        bg="$color3"
        enterStyle={{
          scale: 0,
        }}
        exitStyle={{
          scale: 10,
          opacity: 0,
        }}
        width={height * 3}
        height={height * 3}
      />
    </YStack>
  )
}
