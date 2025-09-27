import { ScrollView, Separator, Text, XStack, YStack, Spinner } from '@app/ui'
import { forwardRef, useImperativeHandle, useRef } from 'react'
import { Platform } from 'react-native'

import type { TalentProfile } from '../types'
import { ResultCard } from './ResultCard'

type ResultListProps = {
  profiles: TalentProfile[]
  selectedId: string | null
  onSelect: (profileId: string) => void
  isLoading?: boolean
}

export interface ResultListRef {
  scrollToCard: (profileId: string) => void
}

export const ResultList = forwardRef<ResultListRef, ResultListProps>(
  ({ profiles, selectedId, onSelect, isLoading }, ref) => {
    const scrollViewRef = useRef<any>(null)
    const cardRefs = useRef<Map<string, any>>(new Map())

    // Expose scroll functionality to parent
    useImperativeHandle(ref, () => ({
      scrollToCard: (profileId: string) => {
        const cardRef = cardRefs.current.get(profileId)
        if (!cardRef || !scrollViewRef.current) return

        if (Platform.OS === 'web') {
          const element = cardRef as HTMLElement
          element.scrollIntoView({
            behavior: 'smooth',
            block: 'center',
            inline: 'nearest',
          })
        } else {
          const nativeCardRef = cardRef as {
            measureLayout: (
              container: unknown,
              onSuccess: (x: number, y: number, width: number, height: number) => void,
              onFail: () => void
            ) => void
          }
          const nativeScrollView = scrollViewRef.current as {
            scrollTo: (options: { y: number; animated: boolean }) => void
          }

          nativeCardRef.measureLayout(
            scrollViewRef.current,
            (_x: number, y: number, _width: number, _height: number) => {
              nativeScrollView.scrollTo({
                y: y - 100,
                animated: true,
              })
            },
            () => {}
          )
        }
      },
    }))

    const registerCardRef = (profileId: string, ref: unknown) => {
      cardRefs.current.set(profileId, ref)
    }

    if (isLoading) {
      return (
        <YStack flex={1} gap="$3" alignItems="center" justifyContent="center">
          <Spinner size="large" />
          <Text color="$color10">Loading talent profiles...</Text>
        </YStack>
      )
    }

    return (
      <YStack flex={1} gap="$3" overflow="hidden">
        <XStack justifyContent="space-between" alignItems="center" flexShrink={0}>
          <Text fontWeight="700" fontSize="$5">
            {profiles.length} results
          </Text>
        </XStack>
        <ScrollView
          ref={scrollViewRef}
          flex={1}
          showsVerticalScrollIndicator
          renderToHardwareTextureAndroid
        >
          <YStack gap="$2" paddingBottom="$6">
            {profiles.map((profile, index) => (
              <YStack key={profile.id} gap="$2">
                <ResultCard
                  ref={(ref) => registerCardRef(profile.id, ref)}
                  profile={profile}
                  isSelected={profile.id === selectedId}
                  onSelect={onSelect}
                />
                {index < profiles.length - 1 ? <Separator /> : null}
              </YStack>
            ))}
          </YStack>
        </ScrollView>
      </YStack>
    )
  }
)
