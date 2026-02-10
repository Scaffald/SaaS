/**
 * Insurance Policy Parent-Child Model - UI Components
 * PolicyCard component displays a single insurance policy with expand/collapse for children
 */

import { ChevronDown, ChevronRight, Shield, Calendar, DollarSign, Layers } from 'lucide-react';
import { Stack, Row, Text, Button } from '@unicornlove/beyond-ui';
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
      <Stack style={{ padding: '16px' }}>
        <Row style={{ alignItems: 'flex-start', justifyContent: 'space-between', gap: '16px' }}>
          {/* Left: Policy Info */}
          <Stack style={{ flex: 1 }}>
            <Row style={{ alignItems: 'center', gap: '12px', marginBottom: '8px' }}>
              <Shield color="var(--color-blue-10)" size={24} />
              <Stack>
                <Text style={{ fontSize: '18px', fontWeight: 600, color: 'var(--color-12)' }}>
                  {getPolicyTypeLabel(policy.policy_type)}
                </Text>
                {policy.policy_number && (
                  <Text style={{ fontSize: '14px', color: 'var(--color-11)' }}>
                    Policy #{policy.policy_number}
                  </Text>
                )}
              </Stack>
            </Row>

            {/* Policy Details Grid */}
            <Row style={{ flexWrap: 'wrap', gap: '16px', marginTop: '12px' }}>
              {/* Aggregate Limit */}
              {policy.aggregate_limit && (
                <Row style={{ alignItems: 'center', gap: '8px' }}>
                  <DollarSign size={16} color="var(--color-11)" />
                  <Stack>
                    <Text style={{ fontSize: '12px', color: 'var(--color-11)' }}>
                      Aggregate Limit
                    </Text>
                    <Text style={{ fontSize: '14px', fontWeight: 500, color: 'var(--color-12)' }}>
                      {formatCurrency(policy.aggregate_limit)}
                    </Text>
                  </Stack>
                </Row>
              )}

              {/* Each Occurrence Limit */}
              {policy.each_occurrence_limit && (
                <Row style={{ alignItems: 'center', gap: '8px' }}>
                  <DollarSign size={16} color="var(--color-11)" />
                  <Stack>
                    <Text style={{ fontSize: '12px', color: 'var(--color-11)' }}>
                      Per Occurrence
                    </Text>
                    <Text style={{ fontSize: '14px', fontWeight: 500, color: 'var(--color-12)' }}>
                      {formatCurrency(policy.each_occurrence_limit)}
                    </Text>
                  </Stack>
                </Row>
              )}

              {/* Deductible */}
              {policy.deductible && (
                <Row style={{ alignItems: 'center', gap: '8px' }}>
                  <DollarSign size={16} color="var(--color-11)" />
                  <Stack>
                    <Text style={{ fontSize: '12px', color: 'var(--color-11)' }}>
                      Deductible
                    </Text>
                    <Text style={{ fontSize: '14px', fontWeight: 500, color: 'var(--color-12)' }}>
                      {formatCurrency(policy.deductible)}
                    </Text>
                  </Stack>
                </Row>
              )}
            </Row>

            {/* Dates and Carrier */}
            <Row style={{ flexWrap: 'wrap', alignItems: 'center', gap: '16px', marginTop: '12px' }}>
              {policy.carrier_name && (
                <Text style={{ fontSize: '14px', color: 'var(--color-11)' }}>
                  <span style={{ fontWeight: 500 }}>Carrier:</span> {policy.carrier_name}
                </Text>
              )}
              {(policy.effective_date || policy.expiration_date) && (
                <Row style={{ alignItems: 'center', gap: '8px' }}>
                  <Calendar size={14} color="var(--color-11)" />
                  <Text style={{ fontSize: '14px', color: 'var(--color-11)' }}>
                    {formatDate(policy.effective_date)} -{' '}
                    {formatDate(policy.expiration_date)}
                  </Text>
                </Row>
              )}
            </Row>

            {/* Umbrella Coverage Display */}
            {policy.policy_type === 'Umbrella' &&
              policy.underlying_coverages &&
              policy.underlying_coverages.length > 0 && (
                <Row
                  style={{
                    marginTop: '12px',
                    alignItems: 'center',
                    gap: '8px',
                    paddingLeft: '12px',
                    paddingRight: '12px',
                    paddingTop: '8px',
                    paddingBottom: '8px',
                    backgroundColor: 'var(--color-blue-2)',
                    borderWidth: '1px',
                    borderStyle: 'solid',
                    borderColor: 'var(--color-blue-6)',
                    borderRadius: '4px',
                  }}
                >
                  <Layers size={16} color="var(--color-blue-10)" />
                  <Text style={{ fontSize: '14px', color: 'var(--color-blue-11)' }}>
                    <span style={{ fontWeight: 500 }}>Umbrella covers:</span>{' '}
                    {formatUnderlyingCoverages(policy.underlying_coverages)}
                  </Text>
                </Row>
              )}
          </Stack>

          {/* Right: Status and Expand Button */}
          <Stack style={{ alignItems: 'flex-end', gap: '8px' }}>
            <StatusBadge
              status={policy.status}
              variant={getStatusColor(policy.status)}
            />

            {hasChildren && (
              <Row
                style={{
                  alignItems: 'center',
                  gap: '4px',
                  paddingLeft: '12px',
                  paddingRight: '12px',
                  paddingTop: '6px',
                  paddingBottom: '6px',
                  fontSize: '14px',
                  fontWeight: 500,
                  color: 'var(--color-blue-10)',
                  borderRadius: '4px',
                  cursor: 'pointer',
                }}
                onClick={(e) => {
                  e?.stopPropagation?.();
                  onToggleExpand();
                }}
              >
                {isExpanded ? (
                  <>
                    <ChevronDown size={16} />
                    <Text style={{ fontSize: '14px', fontWeight: 500, color: 'var(--color-blue-10)' }}>
                      Hide Details
                    </Text>
                  </>
                ) : (
                  <>
                    <ChevronRight size={16} />
                    <Text style={{ fontSize: '14px', fontWeight: 500, color: 'var(--color-blue-10)' }}>
                      Show Details
                    </Text>
                  </>
                )}
              </Row>
            )}
          </Stack>
        </Row>
      </Stack>

      {/* Expanded: Provisions and Endorsements */}
      {isExpanded && hasChildren && (
        <Stack
          style={{
            borderTopWidth: '1px',
            borderTopStyle: 'solid',
            borderTopColor: 'var(--color-border)',
            backgroundColor: 'var(--color-2)',
            paddingLeft: '16px',
            paddingRight: '16px',
            paddingTop: '12px',
            paddingBottom: '12px',
          }}
        >
          {/* Provisions */}
          {policy.provisions && policy.provisions.length > 0 && (
            <Stack style={{ marginBottom: '16px' }}>
              <Text style={{ fontSize: '14px', fontWeight: 600, color: 'var(--color-12)', marginBottom: '8px' }}>
                Coverage Provisions
              </Text>
              <Stack style={{ gap: '8px' }}>
                {policy.provisions.map((provision) => (
                  <ProvisionItem key={provision.id} provision={provision} />
                ))}
              </Stack>
            </Stack>
          )}

          {/* Endorsements */}
          {policy.endorsements && policy.endorsements.length > 0 && (
            <Stack>
              <Text style={{ fontSize: '14px', fontWeight: 600, color: 'var(--color-12)', marginBottom: '8px' }}>
                Policy Endorsements
              </Text>
              <Stack style={{ gap: '8px' }}>
                {policy.endorsements.map((endorsement) => (
                  <EndorsementItem key={endorsement.id} endorsement={endorsement} />
                ))}
              </Stack>
            </Stack>
          )}
        </Stack>
      )}
    </Card>
  );
}
