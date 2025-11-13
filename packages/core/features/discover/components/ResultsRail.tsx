import { YStack } from 'tamagui'
import { memo } from 'react'
import type { RefObject } from 'react'
import type { TalentProfile } from '../types'
import type { OrganizationMapPin } from '../hooks/useOrganizations'
import type { JobMapPin } from '../hooks/useJobs'
import { ResultList, type ResultListRef } from './ResultList'

interface ResultsRailProps {
  isVisible: boolean
  profiles: TalentProfile[]
  organizations?: OrganizationMapPin[]
  jobs?: JobMapPin[]
  selectedId: string | null
  onSelect: (id: string) => void
  isLoading?: boolean
  resultListRef?: RefObject<ResultListRef | null>
}

export const ResultsRail = memo(function ResultsRail({
  isVisible,
  profiles,
  organizations,
  jobs,
  selectedId,
  onSelect,
  isLoading,
  resultListRef,
}: ResultsRailProps) {
  return (
    <YStack
      position="absolute"
      t={0}
      r={0}
      height="100%"
      flexBasis={380}
      maxW={420}
      gap="$3"
      px="$3"
      overflow="hidden"
      animation="quick"
      // Hide on mobile ($sm and below), show on desktop ($gtSm)
      $sm={{ display: 'none' }}
      $gtSm={{ display: 'flex' }}
      x={isVisible ? 0 : 420}
      opacity={isVisible ? 1 : 0}
      bg="$color2"
      borderLeftWidth={1}
      borderColor="$borderColor"
      shadowColor="$shadowColor"
      shadowOffset={{ width: -4, height: 0 }}
      shadowOpacity={0.1}
      shadowRadius={12}
      z={10}
    >
      <ResultList
        ref={resultListRef}
        profiles={profiles}
        organizations={organizations}
        jobs={jobs}
        selectedId={selectedId}
        onSelect={onSelect}
        isLoading={isLoading}
      />
    </YStack>
  )
})
