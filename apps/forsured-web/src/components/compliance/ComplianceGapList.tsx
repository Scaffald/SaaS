/**
 * REQ-128: Compliance Rule Evaluation Engine
 * Compliance Gap List Component
 */

import { YStack, XStack, Text } from '@unicornlove/ui';
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
      <YStack
        backgroundColor="$green2"
        borderWidth={1}
        borderColor="$green6"
        borderRadius="$4"
        padding="$6"
        alignItems="center"
      >
        <Text fontSize="$10" marginBottom="$2">
          ✓
        </Text>
        <Text color="$green11" fontWeight="600">
          No Compliance Gaps Identified
        </Text>
        <Text color="$green10" fontSize="$3" marginTop="$1">
          This policy meets all project requirements
        </Text>
      </YStack>
    );
  }

  // Group gaps by severity
  const criticalGaps = gaps.filter((g) => g.severity === 'critical');
  const warningGaps = gaps.filter((g) => g.severity === 'warning');
  const infoGaps = gaps.filter((g) => g.severity === 'info');

  return (
    <YStack gap="$6">
      <XStack alignItems="center" justifyContent="space-between">
        <Text fontSize="$8" fontWeight="700" color="$color12">
          Compliance Gaps
        </Text>
        <Text fontSize="$3" color="$color10">
          {gaps.length} {gaps.length === 1 ? 'issue' : 'issues'} found
        </Text>
      </XStack>

      {/* Critical Gaps */}
      {criticalGaps.length > 0 && (
        <YStack>
          <Text fontSize="$6" fontWeight="600" color="$red11" marginBottom="$3">
            Critical Issues ({criticalGaps.length})
          </Text>
          <YStack gap="$3">
            {criticalGaps.map((gap) => (
              <GapCard key={gap.id} gap={gap} />
            ))}
          </YStack>
        </YStack>
      )}

      {/* Warning Gaps */}
      {warningGaps.length > 0 && (
        <YStack>
          <Text fontSize="$6" fontWeight="600" color="$yellow11" marginBottom="$3">
            Warnings ({warningGaps.length})
          </Text>
          <YStack gap="$3">
            {warningGaps.map((gap) => (
              <GapCard key={gap.id} gap={gap} />
            ))}
          </YStack>
        </YStack>
      )}

      {/* Info Gaps */}
      {infoGaps.length > 0 && (
        <YStack>
          <Text fontSize="$6" fontWeight="600" color="$blue11" marginBottom="$3">
            Information ({infoGaps.length})
          </Text>
          <YStack gap="$3">
            {infoGaps.map((gap) => (
              <GapCard key={gap.id} gap={gap} />
            ))}
          </YStack>
        </YStack>
      )}
    </YStack>
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

  const getSeverityColors = (severity: GapSeverity) => {
    switch (severity) {
      case 'critical':
        return { border: '$red6', bg: '$red2' };
      case 'warning':
        return { border: '$yellow6', bg: '$yellow2' };
      case 'info':
        return { border: '$blue6', bg: '$blue2' };
      default:
        return { border: '$borderColor', bg: '$color2' };
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
    <YStack
      borderWidth={2}
      borderRadius="$4"
      padding="$4"
      borderColor={colors.border}
      backgroundColor={colors.bg}
    >
      <XStack alignItems="flex-start" justifyContent="space-between">
        <XStack alignItems="flex-start" gap="$3" flex={1}>
          <Text fontSize="$8">{getSeverityIcon(gap.severity)}</Text>
          <YStack flex={1}>
            <Text fontWeight="600" color="$color12">
              {getGapTypeLabel(gap.type)}
            </Text>
            {gap.coverage_type && (
              <Text fontSize="$3" color="$color10" marginTop="$1">
                Coverage: {gap.coverage_type.replace(/_/g, ' ')}
              </Text>
            )}
            {gap.endorsement && (
              <Text fontSize="$3" color="$color10" marginTop="$1">
                Endorsement: {gap.endorsement.replace(/_/g, ' ')}
              </Text>
            )}
            {gap.current_value !== undefined && gap.current_value !== null && (
              <Text fontSize="$3" color="$color10" marginTop="$1">
                Current: {formatValue(gap.current_value)} → Required:{' '}
                {formatValue(gap.required_value)}
              </Text>
            )}
          </YStack>
        </XStack>
        <Text fontSize="$3" fontWeight="600" color="$color11">
          -{gap.points_deducted} pts
        </Text>
      </XStack>

      {/* Remediation */}
      <YStack marginTop="$3" paddingTop="$3" borderTopWidth={1} borderColor="$borderColor">
        <Text fontSize="$1" fontWeight="600" color="$color11" marginBottom="$1">
          How to Fix:
        </Text>
        <Text fontSize="$3" color="$color12">
          {gap.remediation}
        </Text>
      </YStack>
    </YStack>
  );
};
