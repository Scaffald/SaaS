/**
 * REQ-262: Insurance Policy Parent-Child Model - UI Components
 * PolicyCard component displays a single insurance policy with expand/collapse for children
 */

import { ChevronDown, ChevronRight, Shield, Calendar, DollarSign, Layers } from 'lucide-react';
import { YStack, XStack, Text, Button } from '@unicornlove/ui';
import { InsurancePolicy } from '../../types';
import Card from '../Common/Card';
import StatusBadge from '../Common/StatusBadge';
import ProvisionItem from './ProvisionItem';
import EndorsementItem from './EndorsementItem';
import { formatUnderlyingCoverages } from '../../utils/umbrellaValidation';

export interface PolicyCardProps {
  policy: InsurancePolicy;
  isExpanded: boolean;
  onToggleExpand: () => void;
  onClick?: () => void;
}

export default function PolicyCard({
  policy,
  isExpanded,
  onToggleExpand,
  onClick,
}: PolicyCardProps) {
  const formatCurrency = (amount: number | undefined) => {
    if (amount === undefined || amount === null) return 'N/A';
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount);
  };

  const formatDate = (dateString: string | undefined) => {
    if (!dateString) return 'N/A';
    try {
      return new Date(dateString).toLocaleDateString('en-US', {
        month: 'short',
        day: 'numeric',
        year: 'numeric',
      });
    } catch {
      return dateString;
    }
  };

  const getPolicyTypeLabel = (type: string) => {
    const labels: Record<string, string> = {
      GL: 'General Liability',
      WC: 'Workers Compensation',
      Auto: 'Commercial Auto',
      Umbrella: 'Umbrella/Excess',
      'Professional Liability': 'Professional Liability',
      Other: 'Other',
    };
    return labels[type] || type;
  };

  const getStatusColor = (status: string) => {
    const colors: Record<string, 'success' | 'warning' | 'danger' | 'info'> = {
      active: 'success',
      pending: 'warning',
      expired: 'danger',
      cancelled: 'danger',
    };
    return colors[status] || 'info';
  };

  const hasChildren =
    (policy.provisions && policy.provisions.length > 0) ||
    (policy.endorsements && policy.endorsements.length > 0);

  return (
    <Card padding="none">
      {/* Main Policy Header */}
      <YStack padding="$4">
        <XStack alignItems="flex-start" justifyContent="space-between" gap="$4">
          {/* Left: Policy Info */}
          <YStack flex={1}>
            <XStack alignItems="center" gap="$3" mb="$2">
              <Shield color="$blue10" size={24} />
              <YStack>
                <Text fontSize="$6" fontWeight="600" color="$color12">
                  {getPolicyTypeLabel(policy.policy_type)}
                </Text>
                {policy.policy_number && (
                  <Text fontSize="$3" color="$color11">
                    Policy #{policy.policy_number}
                  </Text>
                )}
              </YStack>
            </XStack>

            {/* Policy Details Grid */}
            <XStack
              flexWrap="wrap"
              gap="$4"
              mt="$3"
              $gtMd={{ flexDirection: 'row' }}
            >
              {/* Aggregate Limit */}
              {policy.aggregate_limit && (
                <XStack alignItems="center" gap="$2">
                  <DollarSign size={16} color="$color11" />
                  <YStack>
                    <Text fontSize="$1" color="$color11">
                      Aggregate Limit
                    </Text>
                    <Text fontSize="$3" fontWeight="500" color="$color12">
                      {formatCurrency(policy.aggregate_limit)}
                    </Text>
                  </YStack>
                </XStack>
              )}

              {/* Each Occurrence Limit */}
              {policy.each_occurrence_limit && (
                <XStack alignItems="center" gap="$2">
                  <DollarSign size={16} color="$color11" />
                  <YStack>
                    <Text fontSize="$1" color="$color11">
                      Per Occurrence
                    </Text>
                    <Text fontSize="$3" fontWeight="500" color="$color12">
                      {formatCurrency(policy.each_occurrence_limit)}
                    </Text>
                  </YStack>
                </XStack>
              )}

              {/* Deductible */}
              {policy.deductible && (
                <XStack alignItems="center" gap="$2">
                  <DollarSign size={16} color="$color11" />
                  <YStack>
                    <Text fontSize="$1" color="$color11">
                      Deductible
                    </Text>
                    <Text fontSize="$3" fontWeight="500" color="$color12">
                      {formatCurrency(policy.deductible)}
                    </Text>
                  </YStack>
                </XStack>
              )}
            </XStack>

            {/* Dates and Carrier */}
            <XStack flexWrap="wrap" alignItems="center" gap="$4" mt="$3">
              {policy.carrier_name && (
                <Text fontSize="$3" color="$color11">
                  <Text fontWeight="500">Carrier:</Text> {policy.carrier_name}
                </Text>
              )}
              {(policy.effective_date || policy.expiration_date) && (
                <XStack alignItems="center" gap="$2">
                  <Calendar size={14} color="$color11" />
                  <Text fontSize="$3" color="$color11">
                    {formatDate(policy.effective_date)} -{' '}
                    {formatDate(policy.expiration_date)}
                  </Text>
                </XStack>
              )}
            </XStack>

            {/* REQ-270: Umbrella Coverage Display */}
            {policy.policy_type === 'Umbrella' &&
              policy.underlying_coverages &&
              policy.underlying_coverages.length > 0 && (
                <XStack
                  mt="$3"
                  alignItems="center"
                  gap="$2"
                  paddingHorizontal="$3"
                  paddingVertical="$2"
                  backgroundColor="$blue2"
                  borderWidth={1}
                  borderColor="$blue6"
                  borderRadius="$2"
                >
                  <Layers size={16} color="$blue10" />
                  <Text fontSize="$3" color="$blue11">
                    <Text fontWeight="500">Umbrella covers:</Text>{' '}
                    {formatUnderlyingCoverages(policy.underlying_coverages)}
                  </Text>
                </XStack>
              )}
          </YStack>

          {/* Right: Status and Expand Button */}
          <YStack alignItems="flex-end" gap="$2">
            <StatusBadge
              status={policy.status}
              variant={getStatusColor(policy.status)}
            />

            {hasChildren && (
              <XStack
                alignItems="center"
                gap="$1"
                paddingHorizontal="$3"
                paddingVertical="$1.5"
                fontSize="$3"
                fontWeight="500"
                color="$blue10"
                hoverStyle={{ backgroundColor: '$blue2' }}
                borderRadius="$2"
                cursor="pointer"
                onPress={(e) => {
                  e?.stopPropagation?.();
                  onToggleExpand();
                }}
              >
                {isExpanded ? (
                  <>
                    <ChevronDown size={16} />
                    <Text fontSize="$3" fontWeight="500" color="$blue10">
                      Hide Details
                    </Text>
                  </>
                ) : (
                  <>
                    <ChevronRight size={16} />
                    <Text fontSize="$3" fontWeight="500" color="$blue10">
                      Show Details
                    </Text>
                  </>
                )}
              </XStack>
            )}
          </YStack>
        </XStack>
      </YStack>

      {/* Expanded: Provisions and Endorsements */}
      {isExpanded && hasChildren && (
        <YStack
          borderTopWidth={1}
          borderColor="$borderColor"
          backgroundColor="$color2"
          paddingHorizontal="$4"
          paddingVertical="$3"
        >
          {/* Provisions */}
          {policy.provisions && policy.provisions.length > 0 && (
            <YStack mb="$4">
              <Text fontSize="$3" fontWeight="600" color="$color12" mb="$2">
                Coverage Provisions
              </Text>
              <YStack gap="$2">
                {policy.provisions.map((provision) => (
                  <ProvisionItem key={provision.id} provision={provision} />
                ))}
              </YStack>
            </YStack>
          )}

          {/* Endorsements */}
          {policy.endorsements && policy.endorsements.length > 0 && (
            <YStack>
              <Text fontSize="$3" fontWeight="600" color="$color12" mb="$2">
                Policy Endorsements
              </Text>
              <YStack gap="$2">
                {policy.endorsements.map((endorsement) => (
                  <EndorsementItem key={endorsement.id} endorsement={endorsement} />
                ))}
              </YStack>
            </YStack>
          )}
        </YStack>
      )}
    </Card>
  );
}
