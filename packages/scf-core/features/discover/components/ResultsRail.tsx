import type { RefObject } from 'react'
import { memo } from 'react'
import { Stack } from '@scaffald/ui'
import type { JobMapPin } from '../hooks/useJobs'
import type { OrganizationMapPin } from '../hooks/useOrganizations'
import type { TalentProfile } from '../types'
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
    <Stack
      gap={12}
      paddingHorizontal={12}
      backgroundColor="$color2"
      style={{
        position: 'absolute',
        top: 0,
        right: 0,
        height: '100%',
        width: 320,
        minWidth: 320,
        maxWidth: 320,
        overflow: 'hidden',
        borderLeftWidth: 1,
        borderColor: 'var(--color-border)',
        zIndex: 10,
        opacity: isVisible ? 1 : 0,
      }}
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
    </Stack>
  )
})
