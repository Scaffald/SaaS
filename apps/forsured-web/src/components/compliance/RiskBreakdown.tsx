/**
 * RiskBreakdown - Detailed risk score breakdown component
 * REQ: Phase 5 - Risk Level Algorithm Implementation
 *
 * Shows the weighted components that contribute to the overall risk score:
 *   - Coverage (40%): Requirements met
 *   - Policy Status (25%): Active vs expired
 *   - Issues (20%): Open issue severity
 *   - History (15%): Trend over time
 */
import React from 'react';
import { Row, Stack, Text } from '@unicornlove/beyond-ui';
import { CheckCircle, FileText, AlertTriangle, TrendingUp, AlertCircle } from 'lucide-react';
import { RiskBreakdown as RiskBreakdownType, RiskLevel } from '../../lib/compliance/riskCalculationService';
import { RiskBadge } from './RiskBadge';

export interface RiskBreakdownProps {
  /** The breakdown data from risk calculation */
  breakdown: RiskBreakdownType;
  /** Overall risk level */
  riskLevel: RiskLevel;
  /** Overall compliance score */
  complianceScore: number;
  /** Whether to show detailed information */
  showDetails?: boolean;
  /** Whether to show override alerts */
  showOverrides?: boolean;
}

interface ComponentRowProps {
  label: string;
  score: number;
  weight: number;
  weighted: number;
  detail: string;
  icon: React.ReactNode;
  showDetails: boolean;
}

function getProgressColor(score: number): string {
  if (score >= 90) return 'var(--color-green-9)';
  if (score >= 70) return 'var(--color-yellow-9)';
  if (score >= 50) return 'var(--color-orange-9)';
  return 'var(--color-red-9)';
}

const ComponentRow: React.FC<ComponentRowProps> = ({
  label,
  score,
  weight,
  weighted,
  detail,
  icon,
  showDetails,
}) => {
  const progressColor = getProgressColor(score);

  return (
    <Stack style={{ gap: 4 }}>
      <Row style={{ justifyContent: 'space-between', alignItems: 'center' }}>
        <Row style={{ alignItems: 'center', gap: 8 }}>
          {icon}
          <Text style={{ fontSize: 'var(--font-size-2)', fontWeight: 500 }}>
            {label}
          </Text>
        </Row>
        <Text style={{ fontSize: 'var(--font-size-1)', color: 'var(--color-9)' }}>
          {score}% x {(weight * 100).toFixed(0)}% = {weighted}
        </Text>
      </Row>

      <div
        style={{
          height: 6,
          backgroundColor: 'var(--color-gray-4)',
          borderRadius: 3,
          overflow: 'hidden',
        }}
      >
        <div
          style={{
            height: '100%',
            width: `${score}%`,
            backgroundColor: progressColor,
            borderRadius: 3,
          }}
        />
      </div>

      {showDetails && (
        <Text style={{ fontSize: 'var(--font-size-1)', color: 'var(--color-10)' }}>
          {detail}
        </Text>
      )}
    </Stack>
  );
};

export const RiskBreakdown: React.FC<RiskBreakdownProps> = ({
  breakdown,
  riskLevel,
  complianceScore,
  showDetails = false,
  showOverrides = true,
}) => {
  const components = [
    {
      label: 'Coverage',
      score: breakdown.coverage.score,
      weight: breakdown.coverage.weight,
      weighted: breakdown.coverage.weighted,
      detail: breakdown.coverage.totalRequirements > 0
        ? `${breakdown.coverage.metRequirements}/${breakdown.coverage.totalRequirements} requirements met`
        : 'No requirements defined',
      icon: <CheckCircle size={16} style={{ color: 'var(--color-9)' }} />,
    },
    {
      label: 'Policy Status',
      score: breakdown.policy.score,
      weight: breakdown.policy.weight,
      weighted: breakdown.policy.weighted,
      detail: breakdown.policy.anyExpiredOver60
        ? 'Critical: Policy expired >60 days'
        : breakdown.policy.penalty > 0
          ? `${breakdown.policy.penalty} point penalty from expiring policies`
          : 'All policies current',
      icon: <FileText size={16} style={{ color: 'var(--color-9)' }} />,
    },
    {
      label: 'Issues',
      score: breakdown.issues.score,
      weight: breakdown.issues.weight,
      weighted: breakdown.issues.weighted,
      detail: breakdown.issues.criticalCount > 0
        ? `${breakdown.issues.criticalCount} critical issue${breakdown.issues.criticalCount > 1 ? 's' : ''} open`
        : 'No critical issues',
      icon: <AlertTriangle size={16} style={{ color: 'var(--color-9)' }} />,
    },
    {
      label: 'History',
      score: breakdown.history.score,
      weight: breakdown.history.weight,
      weighted: breakdown.history.weighted,
      detail: `Trend: ${breakdown.history.trend}`,
      icon: <TrendingUp size={16} style={{ color: 'var(--color-9)' }} />,
    },
  ];

  const hasOverride = breakdown.overrides.hasCriticalOverride;

  return (
    <Stack style={{ gap: 'var(--space-4)', padding: 'var(--space-3)', backgroundColor: 'var(--color-background-hover)', borderRadius: 'var(--radius-3)' }}>
      {/* Header with overall score */}
      <Row style={{ justifyContent: 'space-between', alignItems: 'center' }}>
        <Stack style={{ gap: 4 }}>
          <Text style={{ fontSize: 'var(--font-size-4)', fontWeight: 700 }}>
            Risk Score Breakdown
          </Text>
          <Text style={{ fontSize: 'var(--font-size-2)', color: 'var(--color-10)' }}>
            Overall Score: {complianceScore}%
          </Text>
        </Stack>
        <RiskBadge level={riskLevel} score={complianceScore} showScore size="lg" />
      </Row>

      {/* Component rows */}
      <Stack style={{ gap: 'var(--space-3)' }}>
        {components.map((component) => (
          <ComponentRow
            key={component.label}
            {...component}
            showDetails={showDetails}
          />
        ))}
      </Stack>

      {/* Override alerts */}
      {showOverrides && hasOverride && (
        <Stack
          style={{
            padding: 'var(--space-3)',
            backgroundColor: 'var(--color-red-3)',
            borderRadius: 'var(--radius-2)',
            borderWidth: 1,
            borderStyle: 'solid',
            borderColor: 'var(--color-red-6)',
          }}
        >
          <Row style={{ alignItems: 'center', gap: 8, marginBottom: 8 }}>
            <AlertCircle size={18} style={{ color: 'var(--color-red-10)' }} />
            <Text style={{ fontSize: 'var(--font-size-2)', fontWeight: 600, color: 'var(--color-red-11)' }}>
              Override Active
            </Text>
          </Row>
          <Stack style={{ gap: 4 }}>
            {breakdown.overrides.expiredPolicyOverride && (
              <Text style={{ fontSize: 'var(--font-size-1)', color: 'var(--color-red-10)' }}>
                Policy expired more than 60 days
              </Text>
            )}
            {breakdown.overrides.criticalIssueOverride && (
              <Text style={{ fontSize: 'var(--font-size-1)', color: 'var(--color-red-10)' }}>
                Critical issue open more than 14 days
              </Text>
            )}
            {breakdown.overrides.lowCoverageOverride && (
              <Text style={{ fontSize: 'var(--font-size-1)', color: 'var(--color-red-10)' }}>
                Coverage below 50%
              </Text>
            )}
          </Stack>
        </Stack>
      )}

      {/* Legend */}
      {showDetails && (
        <Stack style={{ gap: 8, padding: 8, backgroundColor: 'var(--color-background)', borderRadius: 'var(--radius-2)' }}>
          <Text style={{ fontSize: 'var(--font-size-1)', fontWeight: 600, color: 'var(--color-10)' }}>
            Risk Level Thresholds
          </Text>
          <Row style={{ flexWrap: 'wrap', gap: 8 }}>
            <Text style={{ fontSize: 'var(--font-size-1)', color: 'var(--color-green-10)' }}>90-100: LOW</Text>
            <Text style={{ fontSize: 'var(--font-size-1)', color: 'var(--color-yellow-10)' }}>70-89: MEDIUM</Text>
            <Text style={{ fontSize: 'var(--font-size-1)', color: 'var(--color-orange-10)' }}>50-69: HIGH</Text>
            <Text style={{ fontSize: 'var(--font-size-1)', color: 'var(--color-red-10)' }}>0-49: CRITICAL</Text>
          </Row>
        </Stack>
      )}
    </Stack>
  );
};

/**
 * Compact summary view of risk breakdown
 */
export const RiskSummary: React.FC<{
  breakdown: RiskBreakdownType;
  riskLevel: RiskLevel;
  complianceScore: number;
}> = ({ breakdown, riskLevel, complianceScore }) => {
  return (
    <Stack style={{ gap: 8, padding: 8 }}>
      <Row style={{ justifyContent: 'space-between', alignItems: 'center' }}>
        <Text style={{ fontSize: 'var(--font-size-2)', fontWeight: 500 }}>Compliance Score</Text>
        <RiskBadge level={riskLevel} score={complianceScore} showScore />
      </Row>

      <Row style={{ gap: 8, flexWrap: 'wrap' }}>
        <Row style={{ alignItems: 'center', gap: 4 }}>
          <CheckCircle size={12} />
          <Text style={{ fontSize: 'var(--font-size-1)', color: 'var(--color-10)' }}>
            Coverage: {breakdown.coverage.score}%
          </Text>
        </Row>
        <Row style={{ alignItems: 'center', gap: 4 }}>
          <FileText size={12} />
          <Text style={{ fontSize: 'var(--font-size-1)', color: 'var(--color-10)' }}>
            Policy: {breakdown.policy.score}%
          </Text>
        </Row>
        <Row style={{ alignItems: 'center', gap: 4 }}>
          <AlertTriangle size={12} />
          <Text style={{ fontSize: 'var(--font-size-1)', color: 'var(--color-10)' }}>
            Issues: {breakdown.issues.score}%
          </Text>
        </Row>
        <Row style={{ alignItems: 'center', gap: 4 }}>
          <TrendingUp size={12} />
          <Text style={{ fontSize: 'var(--font-size-1)', color: 'var(--color-10)' }}>
            Trend: {breakdown.history.trend}
          </Text>
        </Row>
      </Row>
    </Stack>
  );
};

export default RiskBreakdown;
