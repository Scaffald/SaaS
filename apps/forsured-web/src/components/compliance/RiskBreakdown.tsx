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
import { XStack, YStack, Text, Progress } from '@unicornlove/ui';
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

const ComponentRow: React.FC<ComponentRowProps> = ({
  label,
  score,
  weight,
  weighted,
  detail,
  icon,
  showDetails,
}) => {
  const progressColor = score >= 90 ? '$green9' : score >= 70 ? '$yellow9' : score >= 50 ? '$orange9' : '$red9';

  return (
    <YStack gap="$1">
      <XStack justifyContent="space-between" alignItems="center">
        <XStack alignItems="center" gap="$2">
          {icon}
          <Text fontSize="$2" fontWeight="500">
            {label}
          </Text>
        </XStack>
        <Text fontSize="$1" color="$color9">
          {score}% x {(weight * 100).toFixed(0)}% = {weighted}
        </Text>
      </XStack>

      <Progress value={score} max={100} height={6}>
        <Progress.Indicator backgroundColor={progressColor} />
      </Progress>

      {showDetails && (
        <Text fontSize="$1" color="$color10">
          {detail}
        </Text>
      )}
    </YStack>
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
      icon: <CheckCircle size={16} color="$color9" />,
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
      icon: <FileText size={16} color="$color9" />,
    },
    {
      label: 'Issues',
      score: breakdown.issues.score,
      weight: breakdown.issues.weight,
      weighted: breakdown.issues.weighted,
      detail: breakdown.issues.criticalCount > 0
        ? `${breakdown.issues.criticalCount} critical issue${breakdown.issues.criticalCount > 1 ? 's' : ''} open`
        : 'No critical issues',
      icon: <AlertTriangle size={16} color="$color9" />,
    },
    {
      label: 'History',
      score: breakdown.history.score,
      weight: breakdown.history.weight,
      weighted: breakdown.history.weighted,
      detail: `Trend: ${breakdown.history.trend}`,
      icon: <TrendingUp size={16} color="$color9" />,
    },
  ];

  const hasOverride = breakdown.overrides.hasCriticalOverride;

  return (
    <YStack gap="$4" padding="$3" backgroundColor="$backgroundHover" borderRadius="$3">
      {/* Header with overall score */}
      <XStack justifyContent="space-between" alignItems="center">
        <YStack gap="$1">
          <Text fontSize="$4" fontWeight="700">
            Risk Score Breakdown
          </Text>
          <Text fontSize="$2" color="$color10">
            Overall Score: {complianceScore}%
          </Text>
        </YStack>
        <RiskBadge level={riskLevel} score={complianceScore} showScore size="lg" />
      </XStack>

      {/* Component rows */}
      <YStack gap="$3">
        {components.map((component) => (
          <ComponentRow
            key={component.label}
            {...component}
            showDetails={showDetails}
          />
        ))}
      </YStack>

      {/* Override alerts */}
      {showOverrides && hasOverride && (
        <YStack
          padding="$3"
          backgroundColor="$red3"
          borderRadius="$2"
          borderWidth={1}
          borderColor="$red6"
        >
          <XStack alignItems="center" gap="$2" marginBottom="$2">
            <AlertCircle size={18} color="var(--red10)" />
            <Text fontSize="$2" fontWeight="600" color="$red11">
              Override Active
            </Text>
          </XStack>
          <YStack gap="$1">
            {breakdown.overrides.expiredPolicyOverride && (
              <Text fontSize="$1" color="$red10">
                Policy expired more than 60 days
              </Text>
            )}
            {breakdown.overrides.criticalIssueOverride && (
              <Text fontSize="$1" color="$red10">
                Critical issue open more than 14 days
              </Text>
            )}
            {breakdown.overrides.lowCoverageOverride && (
              <Text fontSize="$1" color="$red10">
                Coverage below 50%
              </Text>
            )}
          </YStack>
        </YStack>
      )}

      {/* Legend */}
      {showDetails && (
        <YStack gap="$2" padding="$2" backgroundColor="$background" borderRadius="$2">
          <Text fontSize="$1" fontWeight="600" color="$color10">
            Risk Level Thresholds
          </Text>
          <XStack flexWrap="wrap" gap="$2">
            <Text fontSize="$1" color="$green10">90-100: LOW</Text>
            <Text fontSize="$1" color="$yellow10">70-89: MEDIUM</Text>
            <Text fontSize="$1" color="$orange10">50-69: HIGH</Text>
            <Text fontSize="$1" color="$red10">0-49: CRITICAL</Text>
          </XStack>
        </YStack>
      )}
    </YStack>
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
    <YStack gap="$2" padding="$2">
      <XStack justifyContent="space-between" alignItems="center">
        <Text fontSize="$2" fontWeight="500">Compliance Score</Text>
        <RiskBadge level={riskLevel} score={complianceScore} showScore />
      </XStack>

      <XStack gap="$2" flexWrap="wrap">
        <XStack alignItems="center" gap="$1">
          <CheckCircle size={12} />
          <Text fontSize="$1" color="$color10">
            Coverage: {breakdown.coverage.score}%
          </Text>
        </XStack>
        <XStack alignItems="center" gap="$1">
          <FileText size={12} />
          <Text fontSize="$1" color="$color10">
            Policy: {breakdown.policy.score}%
          </Text>
        </XStack>
        <XStack alignItems="center" gap="$1">
          <AlertTriangle size={12} />
          <Text fontSize="$1" color="$color10">
            Issues: {breakdown.issues.score}%
          </Text>
        </XStack>
        <XStack alignItems="center" gap="$1">
          <TrendingUp size={12} />
          <Text fontSize="$1" color="$color10">
            Trend: {breakdown.history.trend}
          </Text>
        </XStack>
      </XStack>
    </YStack>
  );
};

export default RiskBreakdown;
