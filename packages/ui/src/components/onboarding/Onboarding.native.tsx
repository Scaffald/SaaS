import { useRef, useState } from 'react'
import { Circle } from '@tamagui/shapes'
import { Image } from '@tamagui/image'
import { ScrollView } from '@tamagui/scroll-view'
import { useTheme } from '@tamagui/core'
import { useWindowDimensions } from '@tamagui/use-window-dimensions'
import { XStack, YStack } from '@tamagui/stacks'
import type { ScrollView as RNScrollView } from 'react-native'
import { useSafeAreaInsets } from 'react-native-safe-area-context'

import type { OnboardingProps } from './Onboarding'
import { OnboardingControls } from '../onboarding-controls/OnboardingControls'

export const Onboarding = ({ onOnboarded, steps }: OnboardingProps) => {
  const dimensions = useWindowDimensions()
  const safeAreaInsets = useSafeAreaInsets()

  const [stepIdx, _setStepIdx] = useState(0)
  // prevent a background to ever "continue" animation / try to continue where it left off - cause looks weird

  const [key, setKey] = useState(0)
  const stepsCount = steps.length
  const currentStep = steps[stepIdx] || steps[0]

  const setStepIdx = (newIdx: number) => {
    if (stepIdx !== newIdx) {
      _setStepIdx(newIdx)
      setKey(key + 1)
    }
  }

  const handleScroll: ScrollViewProps['onScroll'] = (event) => {
    const val = event.nativeEvent.contentOffset.x / dimensions.width
    const newIdx = Math.round(val)
    if (stepIdx !== newIdx) {
      setStepIdx(newIdx)
    }
  }

  const changePage = (newStepIdx: number) => {
    scrollRef.current?.scrollTo({ x: newStepIdx * dimensions.width, animated: true })
  }

  const scrollRef = useRef<RNScrollView>(null)

  return (
    <YStack flex={1} background="$color3" overflow="hidden">
      <Background backgroundImage={currentStep.backgroundImage} />

      <YStack flex={1} style={{ justifyContent: 'space-between' }}>
        <YStack flex={1} pt={safeAreaInsets.top} pl={safeAreaInsets.left} pr={safeAreaInsets.right}>
          <ScrollView
            ref={scrollRef}
            horizontal
            pagingEnabled
            scrollEventThrottle={16}
            showsHorizontalScrollIndicator={false}
            onScroll={handleScroll}
          >
            {steps.map((step, idx) => {
              const isActive = idx === stepIdx
              return (
                <YStack
                  key={`onboarding-step-${step.backgroundImage}-step`}
                  width={dimensions.width - (safeAreaInsets.left + safeAreaInsets.right)}
                >
                  {isActive && <step.Content key={`onboarding-content-${step.backgroundImage}`} />}
                </YStack>
              )
            })}
          </ScrollView>
          <XStack gap={10} style={{ justifyContent: 'center' }} my="$4">
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
        </YStack>

        <YStack pl={safeAreaInsets.left} pr={safeAreaInsets.right} pb={safeAreaInsets.bottom || 0}>
          <OnboardingControls
            currentIdx={stepIdx}
            onChange={(val) => changePage(val)}
            stepsCount={stepsCount}
            onFinish={onOnboarded}
          />
        </YStack>
      </YStack>
    </YStack>
  )
}

const Point = ({ active, onPress }: { active: boolean; onPress: () => void }) => {
  return (
    <YStack
      br="$10"
      width={active ? 30 : 10}
      height={10}
      onPress={onPress}
      background={active ? '$color7' : '$color6'}
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
          style={{ top: 0 }}
          style={{ left: 0 }}
          style={{ right: 0 }}
          style={{ bottom: 0 }}
        />
        {/* Theme-sensitive overlay with blur for better text readability */}
        <YStack
          fullscreen
          background={isDarkTheme ? 'rgba(0, 0, 0, 0.5)' : 'rgba(255, 255, 255, 0.5)'}
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
    <YStack fullscreen justifyContent="center" style={{ alignItems: 'center' }}>
      <Circle
        animation="lazy"
        x={0}
        y={0}
        opacity={1}
        scale={1}
        background="$color3"
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
