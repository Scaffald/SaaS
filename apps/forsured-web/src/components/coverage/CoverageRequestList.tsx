/**
 * REQ-273: Coverage Request Workflow - UI Components
 * CoverageRequestList component displays all coverage requests for an organization
 */

import { useState, useEffect } from 'react';
import { FileQuestion } from 'lucide-react';
import { YStack, XStack, Text, H2, H3, Button, Card, Spinner } from '@unicornlove/ui';
import { CoverageRequest } from '../../types';
import { getAllCoverageRequests } from '../../lib/api/coverageRequestService';
import CoverageRequestCard from './CoverageRequestCard';

export interface CoverageRequestListProps {
  organizationId: string;
  userRole?: 'broker' | 'subcontractor' | 'manager';
  onProvideQuote?: (requestId: string) => void;
  onApprove?: (requestId: string) => void;
  onReject?: (requestId: string) => void;
  onCancel?: (requestId: string) => void;
}

export default function CoverageRequestList({
  organizationId,
  userRole = 'subcontractor',
  onProvideQuote,
  onApprove,
  onReject,
  onCancel,
}: CoverageRequestListProps) {
  const [requests, setRequests] = useState<CoverageRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    loadRequests();
  }, [organizationId]);

  const loadRequests = async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await getAllCoverageRequests(organizationId);
      setRequests(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load coverage requests');
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <YStack alignItems="center" justifyContent="center" padding="$8">
        <YStack alignItems="center">
          <Spinner size="large" color="$blue10" marginBottom="$4" />
          <Text fontSize="$2" color="$color10">
            Loading coverage requests...
          </Text>
        </YStack>
      </YStack>
    );
  }

  if (error) {
    return (
      <Card
        padding="$6"
        backgroundColor="$red2"
        borderColor="$red6"
        borderRadius="$4"
      >
        <XStack alignItems="center" gap="$2" marginBottom="$2">
          <FileQuestion color="$red10" size={20} />
          <H3 fontSize="$2" fontWeight="600" color="$red11">
            Error Loading Requests
          </H3>
        </XStack>
        <Text fontSize="$2" color="$red11" marginBottom="$3">
          {error}
        </Text>
        <Button
          onPress={loadRequests}
          marginTop="$3"
          paddingHorizontal="$4"
          paddingVertical="$2"
          fontSize="$2"
          fontWeight="500"
          color="white"
          backgroundColor="$red10"
          hoverStyle={{ backgroundColor: '$red11' }}
          borderRadius="$2"
        >
          Retry
        </Button>
      </Card>
    );
  }

  if (requests.length === 0) {
    return (
      <Card
        alignItems="center"
        padding="$12"
        backgroundColor="$background"
        borderRadius="$4"
        borderWidth={2}
        borderStyle="dashed"
        borderColor="$borderColor"
      >
        <FileQuestion color="$color9" size={48} marginBottom="$4" />
        <H3 fontSize="$6" fontWeight="600" color="$color12" marginBottom="$2">
          No Coverage Requests
        </H3>
        <Text fontSize="$2" color="$color10">
          {userRole === 'subcontractor'
            ? 'Request coverage from your broker to get started'
            : 'No coverage requests have been submitted yet'}
        </Text>
      </Card>
    );
  }

  return (
    <YStack gap="$4">
      <XStack alignItems="center" justifyContent="space-between" marginBottom="$4">
        <H2 fontSize="$7" fontWeight="600" color="$color12">
          Coverage Requests
          <Text fontSize="$2" fontWeight="400" color="$color10" marginLeft="$2">
            ({requests.length} {requests.length === 1 ? 'request' : 'requests'})
          </Text>
        </H2>
      </XStack>

      <YStack gap="$4">
        {requests.map((request) => (
          <CoverageRequestCard
            key={request.id}
            request={request}
            userRole={userRole}
            onProvideQuote={onProvideQuote}
            onApprove={onApprove}
            onReject={onReject}
            onCancel={onCancel}
          />
        ))}
      </YStack>
    </YStack>
  );
}
