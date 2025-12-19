/**
 * ParticipantsComplianceView - Using Tamagui
 * REQ-281: Participants Tab Compliance View - TASK-4
 */
import React, { useState, useCallback } from 'react';
import { YStack, XStack, Text } from '@unicornlove/ui';
import { Card } from '@unicornlove/ui';
import { Button as CoreButton } from '@unicornlove/ui';
import {
  ParticipantsTable,
  ParticipantsFilter,
  type FilterOption,
  type Participant,
  type ComplianceStatus,
} from '@unicornlove/compliance';
import { trpc } from '../../lib/trpc';
import SkeletonLoader from '../Common/SkeletonLoader';

interface ParticipantsComplianceViewProps {
  organizationId: string;
  projectId: string;
  onParticipantClick?: (participant: Participant) => void;
}

function mapToTableParticipant(data: {
  id: string;
  name: string;
  type: string;
  status: string;
  score: number;
  lastUpdated: Date | null;
  openIssues: number;
}): Participant {
  return {
    id: data.id,
    name: data.name,
    type: data.type as Participant['type'],
    status: data.status as ComplianceStatus,
    score: data.score,
    lastUpdated: data.lastUpdated?.toISOString() ?? new Date().toISOString(),
  };
}

export function ParticipantsComplianceView({
  organizationId,
  projectId,
  onParticipantClick,
}: ParticipantsComplianceViewProps) {
  const [activeFilter, setActiveFilter] = useState<FilterOption>('all');

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
    );

  const { data: summaryData } = trpc.participants.getComplianceSummary.useQuery(
    {
      organizationId,
      projectId,
    },
    {
      enabled: !!organizationId && !!projectId,
    }
  );

  const handleFilterChange = useCallback((filter: FilterOption) => {
    setActiveFilter(filter);
  }, []);

  const handleParticipantClick = useCallback(
    (participant: Participant) => {
      onParticipantClick?.(participant);
    },
    [onParticipantClick]
  );

  const participants: Participant[] =
    participantsData?.participants.map(mapToTableParticipant) ?? [];

  const counts = summaryData
    ? {
        all: summaryData.total,
        compliant: summaryData.compliant,
        pending: summaryData.pending,
        'at-risk': summaryData.atRisk,
        'non-compliant': summaryData.nonCompliant,
      }
    : undefined;

  return (
    <YStack gap="$4">
      {/* Filter Bar */}
      <Card padding="$4">
        <ParticipantsFilter
          activeFilter={activeFilter}
          onFilterChange={handleFilterChange}
          counts={counts}
        />
      </Card>

      {/* Summary Metrics */}
      {summaryData && (
        <XStack flexWrap="wrap" gap="$4">
          <Card padding="$4" flex={1} minWidth={200}>
            <Text fontSize="$2" color="$color10">Total Participants</Text>
            <Text fontSize="$8" fontWeight="700" color="$color12">
              {summaryData.total}
            </Text>
          </Card>
          <Card padding="$4" flex={1} minWidth={200} borderColor="$green6">
            <Text fontSize="$2" color="$green9">Compliant</Text>
            <Text fontSize="$8" fontWeight="700" color="$green11">
              {summaryData.compliant}
            </Text>
          </Card>
          <Card padding="$4" flex={1} minWidth={200} borderColor="$yellow6">
            <Text fontSize="$2" color="$yellow9">At Risk</Text>
            <Text fontSize="$8" fontWeight="700" color="$yellow11">
              {summaryData.atRisk}
            </Text>
          </Card>
          <Card padding="$4" flex={1} minWidth={200} borderColor="$red6">
            <Text fontSize="$2" color="$red9">Non-Compliant</Text>
            <Text fontSize="$8" fontWeight="700" color="$red11">
              {summaryData.nonCompliant}
            </Text>
          </Card>
        </XStack>
      )}

      {/* Results Count */}
      <XStack alignItems="center" justifyContent="space-between">
        <Text fontSize="$2" color="$color10">
          {participantsLoading
            ? 'Loading...'
            : `${participants.length} participant${participants.length !== 1 ? 's' : ''} found`}
        </Text>
        {activeFilter !== 'all' && (
          <CoreButton
            variant="text"
            onPress={() => setActiveFilter('all')}
            fontSize="$2"
            color="$blue9"
            hoverStyle={{ color: '$blue11' }}
          >
            Clear filter
          </CoreButton>
        )}
      </XStack>

      {/* Participants Table */}
      <Card>
        {participantsLoading ? (
          <YStack padding="$8">
            <SkeletonLoader variant="table" count={5} />
          </YStack>
        ) : participants.length > 0 ? (
          <ParticipantsTable
            participants={participants}
            onRowClick={handleParticipantClick}
          />
        ) : (
          <YStack padding="$12" alignItems="center">
            <Text color="$color10">
              {activeFilter === 'all'
                ? 'No participants found for this project'
                : `No ${activeFilter} participants found`}
            </Text>
          </YStack>
        )}
      </Card>
    </YStack>
  );
}

export default ParticipantsComplianceView;
