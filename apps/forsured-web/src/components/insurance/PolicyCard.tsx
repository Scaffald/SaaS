/**
 * REQ-262: Insurance Policy Parent-Child Model - UI Components
 * PolicyCard component displays a single insurance policy with expand/collapse for children
 */

import React from 'react';
import { ChevronDown, ChevronRight, Shield, Calendar, DollarSign, Layers } from 'lucide-react';
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
      <div className="p-4">
        <div className="flex items-start justify-between gap-4">
          {/* Left: Policy Info */}
          <div className="flex-1">
            <div className="flex items-center gap-3 mb-2">
              <Shield className="text-primary-600" size={24} />
              <div>
                <h3 className="text-lg font-semibold text-text-primary">
                  {getPolicyTypeLabel(policy.policy_type)}
                </h3>
                {policy.policy_number && (
                  <p className="text-sm text-text-secondary">
                    Policy #{policy.policy_number}
                  </p>
                )}
              </div>
            </div>

            {/* Policy Details Grid */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-3">
              {/* Aggregate Limit */}
              {policy.aggregate_limit && (
                <div className="flex items-center gap-2">
                  <DollarSign size={16} className="text-text-secondary" />
                  <div>
                    <p className="text-xs text-text-secondary">Aggregate Limit</p>
                    <p className="text-sm font-medium text-text-primary">
                      {formatCurrency(policy.aggregate_limit)}
                    </p>
                  </div>
                </div>
              )}

              {/* Each Occurrence Limit */}
              {policy.each_occurrence_limit && (
                <div className="flex items-center gap-2">
                  <DollarSign size={16} className="text-text-secondary" />
                  <div>
                    <p className="text-xs text-text-secondary">Per Occurrence</p>
                    <p className="text-sm font-medium text-text-primary">
                      {formatCurrency(policy.each_occurrence_limit)}
                    </p>
                  </div>
                </div>
              )}

              {/* Deductible */}
              {policy.deductible && (
                <div className="flex items-center gap-2">
                  <DollarSign size={16} className="text-text-secondary" />
                  <div>
                    <p className="text-xs text-text-secondary">Deductible</p>
                    <p className="text-sm font-medium text-text-primary">
                      {formatCurrency(policy.deductible)}
                    </p>
                  </div>
                </div>
              )}
            </div>

            {/* Dates and Carrier */}
            <div className="flex flex-wrap items-center gap-4 mt-3">
              {policy.carrier_name && (
                <div className="text-sm text-text-secondary">
                  <span className="font-medium">Carrier:</span>{' '}
                  {policy.carrier_name}
                </div>
              )}
              {(policy.effective_date || policy.expiration_date) && (
                <div className="flex items-center gap-2 text-sm text-text-secondary">
                  <Calendar size={14} />
                  <span>
                    {formatDate(policy.effective_date)} -{' '}
                    {formatDate(policy.expiration_date)}
                  </span>
                </div>
              )}
            </div>

            {/* REQ-270: Umbrella Coverage Display */}
            {policy.policy_type === 'Umbrella' &&
              policy.underlying_coverages &&
              policy.underlying_coverages.length > 0 && (
                <div className="mt-3 flex items-center gap-2 px-3 py-2 bg-primary-50 border border-primary-200 rounded-md">
                  <Layers size={16} className="text-primary-600" />
                  <span className="text-sm text-primary-800">
                    <span className="font-medium">Umbrella covers:</span>{' '}
                    {formatUnderlyingCoverages(policy.underlying_coverages)}
                  </span>
                </div>
              )}
          </div>

          {/* Right: Status and Expand Button */}
          <div className="flex flex-col items-end gap-2">
            <StatusBadge
              status={policy.status}
              variant={getStatusColor(policy.status)}
            />

            {hasChildren && (
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  onToggleExpand();
                }}
                className="flex items-center gap-1 px-3 py-1.5 text-sm font-medium text-primary-600 hover:bg-primary-50 rounded-md transition-colors"
              >
                {isExpanded ? (
                  <>
                    <ChevronDown size={16} />
                    Hide Details
                  </>
                ) : (
                  <>
                    <ChevronRight size={16} />
                    Show Details
                  </>
                )}
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Expanded: Provisions and Endorsements */}
      {isExpanded && hasChildren && (
        <div className="border-t border-border bg-bg-secondary px-4 py-3">
          {/* Provisions */}
          {policy.provisions && policy.provisions.length > 0 && (
            <div className="mb-4">
              <h4 className="text-sm font-semibold text-text-primary mb-2">
                Coverage Provisions
              </h4>
              <div className="space-y-2">
                {policy.provisions.map((provision) => (
                  <ProvisionItem key={provision.id} provision={provision} />
                ))}
              </div>
            </div>
          )}

          {/* Endorsements */}
          {policy.endorsements && policy.endorsements.length > 0 && (
            <div>
              <h4 className="text-sm font-semibold text-text-primary mb-2">
                Policy Endorsements
              </h4>
              <div className="space-y-2">
                {policy.endorsements.map((endorsement) => (
                  <EndorsementItem key={endorsement.id} endorsement={endorsement} />
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </Card>
  );
}
