import { X } from 'lucide-react-native'
import type { RefObject } from 'react'
import { memo } from 'react'
import { Platform } from 'react-native'
import { Button, Text, Row, Stack, useThemeContext } from '@scaffald/ui'
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
  onClose?: () => void
}

const RAIL_WIDTH = 380

export const ResultsRail = memo(function ResultsRail({
  isVisible,
  profiles,
  organizations,
  jobs,
  selectedId,
  onSelect,
  isLoading,
  resultListRef,
  onClose,
}: ResultsRailProps) {
  const { theme } = useThemeContext()
  const totalResults = (profiles?.length ?? 0) + (organizations?.length ?? 0) + (jobs?.length ?? 0)

  const frostedBg = theme === 'dark'
    ? 'rgba(30, 25, 20, 0.82)'
    : 'rgba(251, 248, 243, 0.78)'

  const borderColor = theme === 'dark'
    ? 'rgba(80, 73, 64, 0.3)'
    : 'rgba(237, 221, 201, 0.5)'

  return (
    <Stack
      style={{
        position: 'absolute',
        top: 0,
        right: 0,
        height: '100%',
        width: RAIL_WIDTH,
        minWidth: RAIL_WIDTH,
        maxWidth: RAIL_WIDTH,
        overflow: 'hidden',
        borderLeftWidth: 1,
        borderColor,
        zIndex: 10,
        backgroundColor: frostedBg,
        transform: [{ translateX: isVisible ? 0 : RAIL_WIDTH }],
        // @ts-expect-error web-only CSS properties
        transition: 'transform 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
        boxShadow: isVisible ? '-4px 0 20px rgba(0,0,0,0.10)' : 'none',
        ...(Platform.OS === 'web' ? {
          backdropFilter: 'blur(20px) saturate(180%)',
          WebkitBackdropFilter: 'blur(20px) saturate(180%)',
        } : {}),
      }}
    >
      {/* Header */}
      <Row
        justify="space-between"
        align="center"
        paddingHorizontal={16}
        paddingVertical={10}
        style={{
          borderBottomWidth: 1,
          borderColor,
          flexShrink: 0,
        }}
      >
        <Text style={{ fontSize: 14, fontWeight: '600' }}>
          {totalResults} {totalResults === 1 ? 'result' : 'results'}
        </Text>
        {onClose && (
          <Button
            size="sm"
            variant="outline"
            iconStart={X}
            onPress={onClose}
            aria-label="Close results panel"
          />
        )}
      </Row>

      {/* Results */}
      <Stack flex={1} paddingHorizontal={10} style={{ overflow: 'hidden' }}>
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
    </Stack>
  )
})
