/**
 * Coverage Request Workflow - UI Components
 * CoverageRequestCard component displays a single coverage request with actions
 */

import { FileQuestion, DollarSign, Calendar, User } from 'lucide-react';
import { Stack, Row, Text, Button, Card, CardContent } from '@scaffald/ui';
import { CoverageRequest } from '../../types';
import StatusBadge from '../Common/StatusBadge';

export interface CoverageRequestCardProps {
  request: CoverageRequest;
  onProvideQuote?: (requestId: string) => void;
  onApprove?: (requestId: string) => void;
  onReject?: (requestId: string) => void;
  onCancel?: (requestId: string) => void;
  userRole?: 'broker' | 'subcontractor' | 'manager';
}

export default function CoverageRequestCard({
  request,
  onProvideQuote,
  onApprove,
  onReject,
  onCancel,
  userRole = 'subcontractor',
}: CoverageRequestCardProps) {
  const formatCurrency = (amount: number | undefined) => {
    if (amount === undefined || amount === null) return 'N/A';
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount);
  };

  const formatDate = (dateString: string) => {
    try {
      return new Date(dateString).toLocaleDateString('en-US', {
        month: 'short',
        day: 'numeric',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
      });
    } catch {
      return dateString;
    }
  };

  const getStatusColor = (
    status: string
  ): 'success' | 'warning' | 'danger' | 'info' => {
    const colors: Record<string, 'success' | 'warning' | 'danger' | 'info'> = {
      pending: 'warning',
      quoted: 'info',
      approved: 'success',
      rejected: 'danger',
      cancelled: 'danger',
    };
    return colors[status] || 'info';
  };

  const canBrokerProvideQuote = userRole === 'broker' && request.status === 'pending';
  const canSubApproveReject =
    userRole === 'subcontractor' && request.status === 'quoted';
  const canCancel =
    (userRole === 'subcontractor' || userRole === 'manager') &&
    request.status === 'pending';

  return (
    <Card padding="none">
      <CardContent padding="lg">
        <Row align="flex-start" justify="space-between" gap={16}>
          {/* Left: Request Info */}
          <Stack style={{ flex: 1 }}>
            <Row align="center" gap={12} style={{ marginBottom: 8 }}>
              <FileQuestion color="var(--color-blue-10)" size={24} />
              <Stack>
                <Text
                  size="lg"
                  weight="semibold"
                  style={{ color: 'var(--color-text-primary)' }}
                >
                  {request.coverage_type} Coverage Request
                </Text>
                <Text size="sm" style={{ color: 'var(--color-text-secondary)' }}>
                  Request #{request.id.substring(0, 8)}
                </Text>
              </Stack>
            </Row>

            {/* Request Details */}
            <Row wrap gap={16} style={{ marginTop: 12 }}>
              {/* Quote Amount (if quoted) */}
              {request.quote_amount && (
                <Row align="center" gap={8}>
                  <DollarSign size={16} color="var(--color-text-secondary)" />
                  <Stack>
                    <Text size="xs" style={{ color: 'var(--color-text-secondary)' }}>
                      Quote Amount
                    </Text>
                    <Text
                      size="sm"
                      weight="medium"
                      style={{ color: 'var(--color-text-primary)' }}
                    >
                      {formatCurrency(request.quote_amount)}
                    </Text>
                  </Stack>
                </Row>
              )}

              {/* Created Date */}
              <Row align="center" gap={8}>
                <Calendar size={16} color="var(--color-text-secondary)" />
                <Stack>
                  <Text size="xs" style={{ color: 'var(--color-text-secondary)' }}>
                    Requested On
                  </Text>
                  <Text
                    size="sm"
                    weight="medium"
                    style={{ color: 'var(--color-text-primary)' }}
                  >
                    {formatDate(request.created_at)}
                  </Text>
                </Stack>
              </Row>

              {/* Broker (if assigned) */}
              {request.broker_id && (
                <Row align="center" gap={8}>
                  <User size={16} color="var(--color-text-secondary)" />
                  <Stack>
                    <Text size="xs" style={{ color: 'var(--color-text-secondary)' }}>
                      Assigned Broker
                    </Text>
                    <Text
                      size="sm"
                      weight="medium"
                      style={{ color: 'var(--color-text-primary)' }}
                    >
                      Broker #{request.broker_id.substring(0, 8)}
                    </Text>
                  </Stack>
                </Row>
              )}
            </Row>

            {/* Quote Details (if available) */}
            {request.quote_details && (
              <Stack
                style={{
                  marginTop: 12,
                  padding: 12,
                  backgroundColor: 'var(--color-bg-subtle)',
                  borderRadius: 8,
                }}
              >
                <Text
                  size="xs"
                  weight="semibold"
                  style={{ color: 'var(--color-text-primary)', marginBottom: 4 }}
                >
                  Quote Details:
                </Text>
                <Text
                  size="xs"
                  mono
                  style={{ color: 'var(--color-text-secondary)', overflowX: 'auto' }}
                >
                  {JSON.stringify(request.quote_details, null, 2)}
                </Text>
              </Stack>
            )}
          </Stack>

          {/* Right: Status and Actions */}
          <Stack align="flex-end" gap={8}>
            <StatusBadge
              status={request.status}
              variant={getStatusColor(request.status)}
            />

            {/* Action Buttons */}
            <Stack gap={8} style={{ marginTop: 8 }}>
              {/* Broker: Provide Quote */}
              {canBrokerProvideQuote && onProvideQuote && (
                <Button
                  size="sm"
                  color="primary"
                  variant="filled"
                  onPress={() => onProvideQuote(request.id)}
                >
                  Provide Quote
                </Button>
              )}

              {/* Sub: Approve/Reject Quote */}
              {canSubApproveReject && (
                <>
                  {onApprove && (
                    <Button
                      size="sm"
                      color="green"
                      variant="filled"
                      onPress={() => onApprove(request.id)}
                    >
                      Approve Quote
                    </Button>
                  )}
                  {onReject && (
                    <Button
                      size="sm"
                      color="red"
                      variant="filled"
                      onPress={() => onReject(request.id)}
                    >
                      Reject Quote
                    </Button>
                  )}
                </>
              )}

              {/* Cancel Request */}
              {canCancel && onCancel && (
                <Button
                  size="sm"
                  color="gray"
                  variant="outlined"
                  onPress={() => onCancel(request.id)}
                >
                  Cancel Request
                </Button>
              )}
            </Stack>
          </Stack>
        </Row>
      </CardContent>
    </Card>
  );
}
