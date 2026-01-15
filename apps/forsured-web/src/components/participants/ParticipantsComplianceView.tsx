/**
 * ParticipantsComplianceView - Using Beyond UI
 * REQ-281: Participants Tab Compliance View - TASK-4
 */
import React, { useState, useCallback } from 'react'
import { Stack, Row, Text, Card, Button, Grid } from '@unicornlove/beyond-ui'
import {
  ParticipantsTable,
  ParticipantsFilter,
  type FilterOption,
  type Participant,
  type ComplianceStatus,
} from '@unicornlove/compliance'
import { trpc } from '../../lib/trpc'
import SkeletonLoader from '../Common/SkeletonLoader'

interface ParticipantsComplianceViewProps {
  organizationId: string
  projectId: string
  onParticipantClick?: (participant: Participant) => void
}

function mapToTableParticipant(data: {
  id: string
  name: string
  type: string
  status: string
  score: number
  lastUpdated: Date | null
  openIssues: number
}): Participant {
  return {
    id: data.id,
    name: data.name,
    type: data.type as Participant['type'],
    status: data.status as ComplianceStatus,
    score: data.score,
    lastUpdated: data.lastUpdated?.toISOString() ?? new Date().toISOString(),
  }
}

export function ParticipantsComplianceView({
  organizationId,
  projectId,
  onParticipantClick,
}: ParticipantsComplianceViewProps) {
  const [activeFilter, setActiveFilter] = useState<FilterOption>('all')

  const { data: participantsData, isLoading: participantsLoading } =
    trpc.participants.listByProject.useQuery(
      {
        organizationId,
        projectId,
        status: activeFilter === 'all' ? undefined : activeFilter,
        limit: 100,
        offset: 0,
      },
      {
        enabled: !!organizationId && !!projectId,
      }
    )

  const { data: summaryData } = trpc.participants.getComplianceSummary.useQuery(
    {
      organizationId,
      projectId,
    },
    {
      enabled: !!organizationId && !!projectId,
    }
  )

  const handleFilterChange = useCallback((filter: FilterOption) => {
    setActiveFilter(filter)
  }, [])

  const handleParticipantClick = useCallback(
    (participant: Participant) => {
      onParticipantClick?.(participant)
    },
    [onParticipantClick]
  )

  const participants: Participant[] =
    participantsData?.participants.map(mapToTableParticipant) ?? []

  const counts = summaryData
    ? {
        all: summaryData.total,
        compliant: summaryData.compliant,
        pending: summaryData.pending,
        'at-risk': summaryData.atRisk,
        'non-compliant': summaryData.nonCompliant,
      }
    : undefined

  return (
    <Stack style={{ gap: 'var(--space-4)' }}>
      {/* Filter Bar */}
      <Card style={{ padding: 'var(--space-4)' }}>
        <ParticipantsFilter
          activeFilter={activeFilter}
          onFilterChange={handleFilterChange}
          counts={counts}
        />
      </Card>

      {/* Summary Metrics */}
      {summaryData && (
        <Grid columns={{ base: 1, sm: 2, lg: 4 }} gap={16}>
          <Card style={{ padding: 'var(--space-4)' }}>
            <Text style={{ fontSize: 'var(--font-size-2)', color: 'var(--color-text-secondary)' }}>
              Total Participants
            </Text>
            <Text
              style={{
                fontSize: 'var(--font-size-8)',
                fontWeight: '700',
                color: 'var(--color-text-primary)',
              }}
            >
              {summaryData.total}
            </Text>
          </Card>
          <Card style={{ padding: 'var(--space-4)', borderColor: 'var(--color-green-6)' }}>
            <Text style={{ fontSize: 'var(--font-size-2)', color: 'var(--color-green-9)' }}>
              Compliant
            </Text>
            <Text
              style={{
                fontSize: 'var(--font-size-8)',
                fontWeight: '700',
                color: 'var(--color-green-11)',
              }}
            >
              {summaryData.compliant}
            </Text>
          </Card>
          <Card style={{ padding: 'var(--space-4)', borderColor: 'var(--color-yellow-6)' }}>
            <Text style={{ fontSize: 'var(--font-size-2)', color: 'var(--color-yellow-9)' }}>
              At Risk
            </Text>
            <Text
              style={{
                fontSize: 'var(--font-size-8)',
                fontWeight: '700',
                color: 'var(--color-yellow-11)',
              }}
            >
              {summaryData.atRisk}
            </Text>
          </Card>
          <Card style={{ padding: 'var(--space-4)', borderColor: 'var(--color-red-6)' }}>
            <Text style={{ fontSize: 'var(--font-size-2)', color: 'var(--color-red-9)' }}>
              Non-Compliant
            </Text>
            <Text
              style={{
                fontSize: 'var(--font-size-8)',
                fontWeight: '700',
                color: 'var(--color-red-11)',
              }}
            >
              {summaryData.nonCompliant}
            </Text>
          </Card>
        </Grid>
      )}

      {/* Results Count */}
      <Row style={{ alignItems: 'center', justifyContent: 'space-between' }}>
        <Text style={{ fontSize: 'var(--font-size-2)', color: 'var(--color-text-secondary)' }}>
          {participantsLoading
            ? 'Loading...'
            : `${participants.length} participant${participants.length !== 1 ? 's' : ''} found`}
        </Text>
        {activeFilter !== 'all' && (
          <Button
            variant="ghost"
            onPress={() => setActiveFilter('all')}
            style={{ fontSize: 'var(--font-size-2)', color: 'var(--color-blue-9)' }}
          >
            Clear filter
          </Button>
        )}
      </Row>

      {/* Participants Table */}
      <Card>
        {participantsLoading ? (
          <Stack style={{ padding: 'var(--space-8)' }}>
            <SkeletonLoader variant="table" count={5} />
          </Stack>
        ) : participants.length > 0 ? (
          <ParticipantsTable participants={participants} onRowClick={handleParticipantClick} />
        ) : (
          <Stack style={{ padding: 'var(--space-12)', alignItems: 'center' }}>
            <Text style={{ color: 'var(--color-text-secondary)' }}>
              {activeFilter === 'all'
                ? 'No participants found for this project'
                : `No ${activeFilter} participants found`}
            </Text>
          </Stack>
        )}
      </Card>
    </Stack>
  )
}

export default ParticipantsComplianceView
