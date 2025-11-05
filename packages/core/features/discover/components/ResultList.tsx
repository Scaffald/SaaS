import { ScrollView, Separator, Text, XStack, YStack, Spinner } from 'tamagui'
import { forwardRef, useImperativeHandle, useRef, useMemo, memo } from 'react'
import { Platform } from 'react-native'

import type { TalentProfile } from '../types'
import type { OrganizationMapPin } from '../hooks/useOrganizations'
import type { JobMapPin } from '../hooks/useJobs'
import { ResultCard } from './ResultCard'
import { OrganizationCard } from './OrganizationCard'
import { JobCard } from './JobCard'

type ResultItem =
  | ({ type: 'profile' } & TalentProfile)
  | ({ type: 'organization' } & OrganizationMapPin)
  | ({ type: 'job' } & JobMapPin)

type ResultListProps = {
  profiles: TalentProfile[]
  organizations?: OrganizationMapPin[]
  jobs?: JobMapPin[]
  selectedId: string | null
  onSelect: (id: string) => void
  isLoading?: boolean
}

export interface ResultListRef {
  scrollToCard: (profileId: string) => void
}

const ResultListComponent = forwardRef<ResultListRef, ResultListProps>(
  ({ profiles, organizations = [], jobs = [], selectedId, onSelect, isLoading }, ref) => {
    const scrollViewRef = useRef<ScrollView>(null)

    // Combine profiles, organizations, and jobs into a single list
    // Use useMemo to prevent recreating array on every render
    const allResults: ResultItem[] = useMemo(
      () => [
        ...profiles.map((profile) => ({ type: 'profile' as const, ...profile })),
        ...organizations.map((org) => ({ type: 'organization' as const, ...org })),
        ...jobs.map((job) => ({ type: 'job' as const, ...job })),
      ],
      [profiles, organizations, jobs]
    )
    const cardRefs = useRef<
      Map<
        string,
        | HTMLElement
        | {
            measureLayout: (
              container: unknown,
              onSuccess: (x: number, y: number, width: number, height: number) => void,
              onFail: () => void
            ) => void
          }
      >
    >(new Map())

    // Expose scroll functionality to parent
    useImperativeHandle(ref, () => ({
      scrollToCard: (profileId: string) => {
        const cardRef = cardRefs.current.get(profileId)
        if (!cardRef || !scrollViewRef.current) {
          return
        }

        if (Platform.OS === 'web') {
          // The ref IS the scrollable element (has class is_ScrollView)
          const scrollContainer = scrollViewRef.current as unknown as HTMLElement | null

          if (!scrollContainer) {
            return
          }

          // Calculate card position and scroll to it
          const cardElement = cardRef as HTMLElement
          const cardTop = cardElement.offsetTop
          const targetScroll = cardTop - 100 // Center with offset

          // Set scroll position directly
          scrollContainer.scrollTop = targetScroll
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
            () => {
              // measureLayout failed
            }
          )
        }
      },
    }))

    const registerCardRef = (profileId: string, ref: unknown) => {
      if (ref) {
        cardRefs.current.set(
          profileId,
          ref as
            | HTMLElement
            | {
                measureLayout: (
                  container: unknown,
                  onSuccess: (x: number, y: number, width: number, height: number) => void,
                  onFail: () => void
                ) => void
              }
        )
      }
    }

    if (isLoading) {
      return (
        <YStack flex={1} gap="$3" items="center" justify="center">
          <Spinner size="large" />
          <Text color="$color10">Loading talent profiles...</Text>
        </YStack>
      )
    }

    return (
      <YStack flex={1} gap="$3" overflow="hidden">
        <XStack justify="space-between" items="center" shrink={0} pt="$3" px="$3">
          <Text fontWeight="700" fontSize="$5">
            {allResults.length} results
          </Text>
        </XStack>
        <ScrollView
          ref={scrollViewRef}
          flex={1}
          showsVerticalScrollIndicator
          renderToHardwareTextureAndroid
        >
          <YStack gap="$2" pb="$6">
            {allResults.map((result, index) => (
              <YStack key={result.id} gap="$2">
                {result.type === 'profile' ? (
                  <ResultCard
                    ref={(ref) => registerCardRef(result.id, ref)}
                    profile={result}
                    isSelected={result.id === selectedId}
                    onSelect={onSelect}
                  />
                ) : result.type === 'organization' ? (
                  <OrganizationCard
                    ref={(ref) => registerCardRef(result.id, ref)}
                    organization={result}
                    isSelected={result.id === selectedId}
                    onSelect={onSelect}
                  />
                ) : (
                  <JobCard
                    job={result}
                    isSelected={result.id === selectedId}
                    onPress={() => onSelect(result.id)}
                  />
                )}
                {index < allResults.length - 1 ? <Separator /> : null}
              </YStack>
            ))}
          </YStack>
        </ScrollView>
      </YStack>
    )
  }
)

export const ResultList = memo(ResultListComponent)
