/**
 * Onboarding – multi-step flow with optional background image, step indicators, and controls
 */

import { useCallback, useEffect, useState } from 'react'
import { Image, Pressable, useWindowDimensions } from 'react-native'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import { Box, Stack, Row } from '../Layout'
import { colors } from '../../tokens/colors'
import type { OnboardingProps } from './Onboarding.types'
import { OnboardingControls } from './OnboardingControls'

const AUTO_SWIPE_THRESHOLD = 15_000

export function Onboarding({ onOnboarded, autoSwipe, steps, staticMode = false }: OnboardingProps) {
  const [stepIdx, setStepIdxState] = useState(0)
  const [key, setKey] = useState(0)
  const { height } = useWindowDimensions()
  const insets = useSafeAreaInsets()
  const stepsCount = steps.length
  const currentStep = steps[stepIdx] || steps[0]

  const setStepIdx = useCallback((newIdx: number) => {
    setStepIdxState((prev) => {
      if (prev !== newIdx) {
        setKey((k) => k + 1)
        return newIdx
      }
      return prev
    })
  }, [])

  useEffect(() => {
    if (!autoSwipe || staticMode) return
    const t = setTimeout(() => {
      setStepIdx(stepIdx >= stepsCount - 1 ? 0 : stepIdx + 1)
    }, AUTO_SWIPE_THRESHOLD)
    return () => clearTimeout(t)
  }, [autoSwipe, staticMode, stepIdx, stepsCount, setStepIdx])

  return (
    <Box
      flex={1}
      style={{
        backgroundColor: colors.gray[100],
        overflow: 'hidden',
        paddingBottom: insets.bottom,
        paddingRight: insets.right,
        paddingTop: insets.top,
        paddingLeft: insets.left,
      }}
    >
      {currentStep.backgroundImage ? (
        <Box position="absolute" top={0} left={0} right={0} bottom={0}>
          <Image
            source={{ uri: currentStep.backgroundImage }}
            style={{ flex: 1, width: '100%', height: '100%', resizeMode: 'cover' }}
          />
          <Box
            position="absolute"
            top={0}
            left={0}
            right={0}
            bottom={0}
            style={{
              backgroundColor: 'rgba(255, 255, 255, 0.5)',
            }}
          />
        </Box>
      ) : (
        <Box
          position="absolute"
          top={0}
          left={0}
          right={0}
          bottom={0}
          align="center"
          justify="center"
          style={{ backgroundColor: colors.gray[100] }}
        >
          <Box
            style={{
              width: height * 3,
              height: height * 3,
              borderRadius: height * 1.5,
              backgroundColor: colors.gray[200],
            }}
          />
        </Box>
      )}

      <Stack flex={1}>
        <Box flex={1} key={key}>
          <currentStep.Content />
        </Box>

        {!staticMode && (
          <Row gap={10} justify="center" style={{ marginVertical: 16 }}>
            {Array.from({ length: stepsCount }, (_, idx) => (
              <Pressable key={`point-${idx}-${stepsCount}`} onPress={() => setStepIdx(idx)}>
                <Box
                  style={{
                    width: idx === stepIdx ? 30 : 10,
                    height: 10,
                    borderRadius: 5,
                    backgroundColor: idx === stepIdx ? colors.gray[600] : colors.gray[400],
                  }}
                />
              </Pressable>
            ))}
          </Row>
        )}

        {!staticMode && (
          <OnboardingControls
            currentIdx={stepIdx}
            onChange={setStepIdx}
            stepsCount={stepsCount}
            onFinish={onOnboarded}
          />
        )}
      </Stack>
    </Box>
  )
}
