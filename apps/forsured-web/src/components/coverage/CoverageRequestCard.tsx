/**
 * REQ-273: Coverage Request Workflow - UI Components
 * CoverageRequestCard component displays a single coverage request with actions
 */

import { FileQuestion, DollarSign, Calendar, User } from 'lucide-react';
import { YStack, XStack, Text, Button } from '@unicornlove/ui';
import { CoverageRequest } from '../../types';
import Card from '../Common/Card';
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
      <YStack padding="$4">
        <XStack alignItems="flex-start" justifyContent="space-between" gap="$4">
          {/* Left: Request Info */}
          <YStack flex={1}>
            <XStack alignItems="center" gap="$3" mb="$2">
              <FileQuestion color="$blue10" size={24} />
              <YStack>
                <Text fontSize="$6" fontWeight="600" color="$color12">
                  {request.coverage_type} Coverage Request
                </Text>
                <Text fontSize="$3" color="$color11">
                  Request #{request.id.substring(0, 8)}
                </Text>
              </YStack>
            </XStack>

            {/* Request Details */}
            <XStack
              flexWrap="wrap"
              gap="$4"
              mt="$3"
              $gtMd={{ flexDirection: 'row' }}
            >
              {/* Quote Amount (if quoted) */}
              {request.quote_amount && (
                <XStack alignItems="center" gap="$2">
                  <DollarSign size={16} color="$color11" />
                  <YStack>
                    <Text fontSize="$1" color="$color11">
                      Quote Amount
                    </Text>
                    <Text fontSize="$3" fontWeight="500" color="$color12">
                      {formatCurrency(request.quote_amount)}
                    </Text>
                  </YStack>
                </XStack>
              )}

              {/* Created Date */}
              <XStack alignItems="center" gap="$2">
                <Calendar size={16} color="$color11" />
                <YStack>
                  <Text fontSize="$1" color="$color11">
                    Requested On
                  </Text>
                  <Text fontSize="$3" fontWeight="500" color="$color12">
                    {formatDate(request.created_at)}
                  </Text>
                </YStack>
              </XStack>

              {/* Broker (if assigned) */}
              {request.broker_id && (
                <XStack alignItems="center" gap="$2">
                  <User size={16} color="$color11" />
                  <YStack>
                    <Text fontSize="$1" color="$color11">
                      Assigned Broker
                    </Text>
                    <Text fontSize="$3" fontWeight="500" color="$color12">
                      Broker #{request.broker_id.substring(0, 8)}
                    </Text>
                  </YStack>
                </XStack>
              )}
            </XStack>

            {/* Quote Details (if available) */}
            {request.quote_details && (
              <YStack
                mt="$3"
                padding="$3"
                backgroundColor="$color2"
                borderRadius="$2"
              >
                <Text fontSize="$1" fontWeight="600" color="$color12" mb="$1">
                  Quote Details:
                </Text>
                <Text
                  fontSize="$1"
                  color="$color11"
                  fontFamily="$mono"
                  overflowX="auto"
                >
                  {JSON.stringify(request.quote_details, null, 2)}
                </Text>
              </YStack>
            )}
          </YStack>

          {/* Right: Status and Actions */}
          <YStack alignItems="flex-end" gap="$2">
            <StatusBadge
              status={request.status}
              variant={getStatusColor(request.status)}
            />

            {/* Action Buttons */}
            <YStack gap="$2" mt="$2">
              {/* Broker: Provide Quote */}
              {canBrokerProvideQuote && onProvideQuote && (
                <Button
                  size="$3"
                  backgroundColor="$blue10"
                  color="white"
                  hoverStyle={{ backgroundColor: '$blue11' }}
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
                      size="$3"
                      backgroundColor="$green10"
                      color="white"
                      hoverStyle={{ backgroundColor: '$green11' }}
                      onPress={() => onApprove(request.id)}
                    >
                      Approve Quote
                    </Button>
                  )}
                  {onReject && (
                    <Button
                      size="$3"
                      backgroundColor="$red10"
                      color="white"
                      hoverStyle={{ backgroundColor: '$red11' }}
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
                  size="$3"
                  variant="outlined"
                  color="$color11"
                  hoverStyle={{ color: '$color12', borderColor: '$borderColor' }}
                  onPress={() => onCancel(request.id)}
                >
                  Cancel Request
                </Button>
              )}
            </YStack>
          </YStack>
        </XStack>
      </YStack>
    </Card>
  );
}
