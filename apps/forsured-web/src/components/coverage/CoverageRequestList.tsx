/**
 * REQ-273: Coverage Request Workflow - UI Components
 * CoverageRequestList component displays all coverage requests for an organization
 */

import { useState, useEffect } from 'react';
import { FileQuestion } from 'lucide-react';
import { Stack, Row, Text, H2, H3, Button, Card, CardContent, Spinner } from '@unicornlove/beyond-ui';
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
      <Stack align="center" justify="center" padding={32}>
        <Stack align="center">
          <Spinner size="md" color="primary" style={{ marginBottom: 16 }} />
          <Text size="sm" style={{ color: 'var(--color-text-tertiary)' }}>
            Loading coverage requests...
          </Text>
        </Stack>
      </Stack>
    );
  }

  if (error) {
    return (
      <Card
        variant="filled"
        style={{
          backgroundColor: 'var(--color-red-2)',
          borderColor: 'var(--color-red-6)',
          borderWidth: 1,
          borderRadius: 16,
        }}
      >
        <CardContent padding="lg">
          <Row align="center" gap={8} style={{ marginBottom: 8 }}>
            <FileQuestion color="var(--color-red-10)" size={20} />
            <H3 style={{ color: 'var(--color-red-11)' }}>
              Error Loading Requests
            </H3>
          </Row>
          <Text size="sm" style={{ color: 'var(--color-red-11)', marginBottom: 12 }}>
            {error}
          </Text>
          <Button
            onPress={loadRequests}
            size="sm"
            color="red"
            variant="filled"
            style={{ marginTop: 12 }}
          >
            Retry
          </Button>
        </CardContent>
      </Card>
    );
  }

  if (requests.length === 0) {
    return (
      <Card
        variant="outlined"
        style={{
          borderWidth: 2,
          borderStyle: 'dashed',
          borderColor: 'var(--color-border)',
          borderRadius: 16,
        }}
      >
        <CardContent padding="xl">
          <Stack align="center">
            <FileQuestion
              color="var(--color-text-tertiary)"
              size={48}
              style={{ marginBottom: 16 }}
            />
            <H3 style={{ color: 'var(--color-text-primary)', marginBottom: 8 }}>
              No Coverage Requests
            </H3>
            <Text size="sm" style={{ color: 'var(--color-text-tertiary)' }}>
              {userRole === 'subcontractor'
                ? 'Request coverage from your broker to get started'
                : 'No coverage requests have been submitted yet'}
            </Text>
          </Stack>
        </CardContent>
      </Card>
    );
  }

  return (
    <Stack gap={16}>
      <Row align="center" justify="space-between" style={{ marginBottom: 16 }}>
        <H2 style={{ color: 'var(--color-text-primary)' }}>
          Coverage Requests
          <Text
            size="sm"
            weight="regular"
            style={{ color: 'var(--color-text-tertiary)', marginLeft: 8 }}
          >
            ({requests.length} {requests.length === 1 ? 'request' : 'requests'})
          </Text>
        </H2>
      </Row>

      <Stack gap={16}>
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
      </Stack>
    </Stack>
  );
}
