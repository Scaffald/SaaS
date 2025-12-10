/**
 * REQ-128: Compliance Rule Evaluation Engine
 * Compliance Gap List Component
 */

import React from 'react';
import { ComplianceGap, GapType, GapSeverity } from '../../lib/compliance/evaluator';

interface ComplianceGapListProps {
  gaps: ComplianceGap[];
}

/**
 * Display list of compliance gaps with remediation guidance
 */
export const ComplianceGapList: React.FC<ComplianceGapListProps> = ({ gaps }) => {
  if (gaps.length === 0) {
    return (
      <div className="bg-green-50 border border-green-200 rounded-lg p-6 text-center">
        <div className="text-4xl mb-2">✓</div>
        <div className="text-green-800 font-semibold">
          No Compliance Gaps Identified
        </div>
        <div className="text-green-600 text-sm mt-1">
          This policy meets all project requirements
        </div>
      </div>
    );
  }

  // Group gaps by severity
  const criticalGaps = gaps.filter((g) => g.severity === 'critical');
  const warningGaps = gaps.filter((g) => g.severity === 'warning');
  const infoGaps = gaps.filter((g) => g.severity === 'info');

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold text-gray-900">Compliance Gaps</h2>
        <div className="text-sm text-gray-500">
          {gaps.length} {gaps.length === 1 ? 'issue' : 'issues'} found
        </div>
      </div>

      {/* Critical Gaps */}
      {criticalGaps.length > 0 && (
        <div>
          <h3 className="text-lg font-semibold text-red-700 mb-3">
            Critical Issues ({criticalGaps.length})
          </h3>
          <div className="space-y-3">
            {criticalGaps.map((gap) => (
              <GapCard key={gap.id} gap={gap} />
            ))}
          </div>
        </div>
      )}

      {/* Warning Gaps */}
      {warningGaps.length > 0 && (
        <div>
          <h3 className="text-lg font-semibold text-yellow-700 mb-3">
            Warnings ({warningGaps.length})
          </h3>
          <div className="space-y-3">
            {warningGaps.map((gap) => (
              <GapCard key={gap.id} gap={gap} />
            ))}
          </div>
        </div>
      )}

      {/* Info Gaps */}
      {infoGaps.length > 0 && (
        <div>
          <h3 className="text-lg font-semibold text-blue-700 mb-3">
            Information ({infoGaps.length})
          </h3>
          <div className="space-y-3">
            {infoGaps.map((gap) => (
              <GapCard key={gap.id} gap={gap} />
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

/**
 * Individual gap card component
 */
const GapCard: React.FC<{ gap: ComplianceGap }> = ({ gap }) => {
  const getSeverityIcon = (severity: GapSeverity): string => {
    switch (severity) {
      case 'critical':
        return '🔴';
      case 'warning':
        return '⚠️';
      case 'info':
        return 'ℹ️';
      default:
        return '❓';
    }
  };

  const getSeverityColor = (severity: GapSeverity): string => {
    switch (severity) {
      case 'critical':
        return 'border-red-300 bg-red-50';
      case 'warning':
        return 'border-yellow-300 bg-yellow-50';
      case 'info':
        return 'border-blue-300 bg-blue-50';
      default:
        return 'border-gray-300 bg-gray-50';
    }
  };

  const getGapTypeLabel = (type: GapType): string => {
    switch (type) {
      case 'missing_coverage':
        return 'Missing Coverage';
      case 'insufficient_amount':
        return 'Insufficient Amount';
      case 'missing_endorsement':
        return 'Missing Endorsement';
      case 'expired_policy':
        return 'Expired/Invalid Policy';
      case 'incorrect_holder':
        return 'Incorrect Certificate Holder';
      case 'expiring_soon':
        return 'Expiring Soon';
      default:
        return 'Unknown Issue';
    }
  };

  const formatValue = (value: string | number | null | undefined): string => {
    if (value === null || value === undefined) {
      return 'N/A';
    }

    if (typeof value === 'number') {
      return new Intl.NumberFormat('en-US', {
        style: 'currency',
        currency: 'USD',
        minimumFractionDigits: 0,
        maximumFractionDigits: 0
      }).format(value);
    }

    return value.toString();
  };

  return (
    <div
      className={`border-2 rounded-lg p-4 ${getSeverityColor(gap.severity)}`}
    >
      <div className="flex items-start justify-between">
        <div className="flex items-start space-x-3 flex-1">
          <div className="text-2xl">{getSeverityIcon(gap.severity)}</div>
          <div className="flex-1">
            <div className="font-semibold text-gray-900">
              {getGapTypeLabel(gap.type)}
            </div>
            {gap.coverage_type && (
              <div className="text-sm text-gray-600 mt-1">
                Coverage: {gap.coverage_type.replace(/_/g, ' ')}
              </div>
            )}
            {gap.endorsement && (
              <div className="text-sm text-gray-600 mt-1">
                Endorsement: {gap.endorsement.replace(/_/g, ' ')}
              </div>
            )}
            {gap.current_value !== undefined && gap.current_value !== null && (
              <div className="text-sm text-gray-600 mt-1">
                Current: {formatValue(gap.current_value)} → Required:{' '}
                {formatValue(gap.required_value)}
              </div>
            )}
          </div>
        </div>
        <div className="text-sm font-semibold text-gray-700">
          -{gap.points_deducted} pts
        </div>
      </div>

      {/* Remediation */}
      <div className="mt-3 pt-3 border-t border-gray-300">
        <div className="text-xs font-semibold text-gray-700 mb-1">
          How to Fix:
        </div>
        <div className="text-sm text-gray-800">{gap.remediation}</div>
      </div>
    </div>
  );
};
