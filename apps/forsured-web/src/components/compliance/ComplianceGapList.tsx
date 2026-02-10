/**
 * Compliance Rule Evaluation Engine
 * Compliance Gap List Component
 */

import React from 'react';
import { Stack, Row, Text } from '@unicornlove/beyond-ui';
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
      <Stack
        style={{
          backgroundColor: 'var(--color-green2)',
          borderWidth: '1px',
          borderStyle: 'solid',
          borderColor: 'var(--color-green6)',
          borderRadius: '8px',
          padding: '24px',
          alignItems: 'center',
        }}
      >
        <Text style={{ fontSize: '36px', marginBottom: '8px' }}>
          &#10003;
        </Text>
        <Text style={{ color: 'var(--color-green11)', fontWeight: 600 }}>
          No Compliance Gaps Identified
        </Text>
        <Text style={{ color: 'var(--color-green10)', fontSize: '14px', marginTop: '4px' }}>
          This policy meets all project requirements
        </Text>
      </Stack>
    );
  }

  // Group gaps by severity
  const criticalGaps = gaps.filter((g) => g.severity === 'critical');
  const warningGaps = gaps.filter((g) => g.severity === 'warning');
  const infoGaps = gaps.filter((g) => g.severity === 'info');

  return (
    <Stack style={{ gap: '24px' }}>
      <Row style={{ alignItems: 'center', justifyContent: 'space-between' }}>
        <Text style={{ fontSize: '28px', fontWeight: 700, color: 'var(--color-color12)' }}>
          Compliance Gaps
        </Text>
        <Text style={{ fontSize: '14px', color: 'var(--color-color10)' }}>
          {gaps.length} {gaps.length === 1 ? 'issue' : 'issues'} found
        </Text>
      </Row>

      {/* Critical Gaps */}
      {criticalGaps.length > 0 && (
        <Stack>
          <Text style={{ fontSize: '20px', fontWeight: 600, color: 'var(--color-red11)', marginBottom: '12px' }}>
            Critical Issues ({criticalGaps.length})
          </Text>
          <Stack style={{ gap: '12px' }}>
            {criticalGaps.map((gap) => (
              <GapCard key={gap.id} gap={gap} />
            ))}
          </Stack>
        </Stack>
      )}

      {/* Warning Gaps */}
      {warningGaps.length > 0 && (
        <Stack>
          <Text style={{ fontSize: '20px', fontWeight: 600, color: 'var(--color-yellow11)', marginBottom: '12px' }}>
            Warnings ({warningGaps.length})
          </Text>
          <Stack style={{ gap: '12px' }}>
            {warningGaps.map((gap) => (
              <GapCard key={gap.id} gap={gap} />
            ))}
          </Stack>
        </Stack>
      )}

      {/* Info Gaps */}
      {infoGaps.length > 0 && (
        <Stack>
          <Text style={{ fontSize: '20px', fontWeight: 600, color: 'var(--color-blue11)', marginBottom: '12px' }}>
            Information ({infoGaps.length})
          </Text>
          <Stack style={{ gap: '12px' }}>
            {infoGaps.map((gap) => (
              <GapCard key={gap.id} gap={gap} />
            ))}
          </Stack>
        </Stack>
      )}
    </Stack>
  );
};

/**
 * Individual gap card component
 */
const GapCard: React.FC<{ gap: ComplianceGap }> = ({ gap }) => {
  const getSeverityIcon = (severity: GapSeverity): string => {
    switch (severity) {
      case 'critical':
        return '!';
      case 'warning':
        return '!';
      case 'info':
        return 'i';
      default:
        return '?';
    }
  };

  const getSeverityColors = (severity: GapSeverity): React.CSSProperties => {
    switch (severity) {
      case 'critical':
        return { borderColor: 'var(--color-red6)', backgroundColor: 'var(--color-red2)' };
      case 'warning':
        return { borderColor: 'var(--color-yellow6)', backgroundColor: 'var(--color-yellow2)' };
      case 'info':
        return { borderColor: 'var(--color-blue6)', backgroundColor: 'var(--color-blue2)' };
      default:
        return { borderColor: 'var(--color-border)', backgroundColor: 'var(--color-color2)' };
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

  const colors = getSeverityColors(gap.severity);

  return (
    <Stack
      style={{
        borderWidth: '2px',
        borderStyle: 'solid',
        borderRadius: '8px',
        padding: '16px',
        ...colors,
      }}
    >
      <Row style={{ alignItems: 'flex-start', justifyContent: 'space-between' }}>
        <Row style={{ alignItems: 'flex-start', gap: '12px', flex: 1 }}>
          <Text style={{ fontSize: '28px' }}>{getSeverityIcon(gap.severity)}</Text>
          <Stack style={{ flex: 1 }}>
            <Text style={{ fontWeight: 600, color: 'var(--color-color12)' }}>
              {getGapTypeLabel(gap.type)}
            </Text>
            {gap.coverage_type && (
              <Text style={{ fontSize: '14px', color: 'var(--color-color10)', marginTop: '4px' }}>
                Coverage: {gap.coverage_type.replace(/_/g, ' ')}
              </Text>
            )}
            {gap.endorsement && (
              <Text style={{ fontSize: '14px', color: 'var(--color-color10)', marginTop: '4px' }}>
                Endorsement: {gap.endorsement.replace(/_/g, ' ')}
              </Text>
            )}
            {gap.current_value !== undefined && gap.current_value !== null && (
              <Text style={{ fontSize: '14px', color: 'var(--color-color10)', marginTop: '4px' }}>
                Current: {formatValue(gap.current_value)} -&gt; Required:{' '}
                {formatValue(gap.required_value)}
              </Text>
            )}
          </Stack>
        </Row>
        <Text style={{ fontSize: '14px', fontWeight: 600, color: 'var(--color-color11)' }}>
          -{gap.points_deducted} pts
        </Text>
      </Row>

      {/* Remediation */}
      <Stack style={{ marginTop: '12px', paddingTop: '12px', borderTopWidth: '1px', borderTopStyle: 'solid', borderColor: 'var(--color-border)' }}>
        <Text style={{ fontSize: '10px', fontWeight: 600, color: 'var(--color-color11)', marginBottom: '4px' }}>
          How to Fix:
        </Text>
        <Text style={{ fontSize: '14px', color: 'var(--color-color12)' }}>
          {gap.remediation}
        </Text>
      </Stack>
    </Stack>
  );
};
