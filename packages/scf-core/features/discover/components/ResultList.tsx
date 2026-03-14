import { EmptyState, ErrorState, SkeletonList } from '@scaffald/ui'
import { Search } from 'lucide-react-native'
import { forwardRef, memo, useImperativeHandle, useMemo, useRef } from 'react'
import { Platform } from 'react-native'
import { ScrollView, Stack } from '@scaffald/ui'
import type { JobMapPin } from '../hooks/useJobs'
import type { OrganizationMapPin } from '../hooks/useOrganizations'
import type { TalentProfile } from '../types'
import { JobCard } from './JobCard'
import { OrganizationCard } from './OrganizationCard'
import { ResultCard } from './ResultCard'

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
  error?: Error | null
  onRetry?: () => void
  /** Called when a card is hovered (web only). Pass null on hover end. */
  onCardHover?: (id: string | null) => void
}

export interface ResultListRef {
  scrollToCard: (profileId: string) => void
}

const ResultListComponent = forwardRef<ResultListRef, ResultListProps>(
  (
    { profiles, organizations = [], jobs = [], selectedId, onSelect, isLoading, error, onRetry, onCardHover },
    ref
  ) => {
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
        <Stack flex={1} gap={12} padding="sm" width="100%">
          <SkeletonList count={5} gap={8} variant="profile" />
        </Stack>
      )
    }

    if (error) {
      return (
        <Stack flex={1} padding="md" width="100%">
          <ErrorState
            title="Failed to load results"
            description="We encountered an error while loading workers. Please try again."
            error={error}
            retry={onRetry}
            retryText="Retry"
          />
        </Stack>
      )
    }

    return (
      <Stack flex={1} gap={8} width="100%" style={{ overflow: 'hidden' }}>
        <ScrollView
          ref={scrollViewRef}
          showsVerticalScrollIndicator
          renderToHardwareTextureAndroid
          style={{ flex: 1, width: '100%' }}
        >
          <Stack gap={8} paddingVertical={8} paddingBottom={24} width="100%">
            {allResults.length === 0 ? (
              <EmptyState
                icon={Search}
                title="No results found"
                description="Try adjusting your search filters or search terms to find more workers."
              />
            ) : (
              allResults.map((result) => (
                <Stack
                  key={result.id}
                  // @ts-expect-error web-only mouse events
                  onMouseEnter={Platform.OS === 'web' && onCardHover ? () => onCardHover(result.id) : undefined}
                  onMouseLeave={Platform.OS === 'web' && onCardHover ? () => onCardHover(null) : undefined}
                >
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
                      ref={(ref) => registerCardRef(result.id, ref)}
                      job={result}
                      isSelected={result.id === selectedId}
                      onPress={() => onSelect(result.id)}
                    />
                  )}
                </Stack>
              ))
            )}
          </Stack>
        </ScrollView>
      </Stack>
    )
  }
)

export const ResultList = memo(ResultListComponent)
