/**
 * REQ-128: Compliance Rule Evaluation Engine
 * Compliance Score Dashboard Component
 */

import { YStack, XStack, Text, H2, Card } from '@unicornlove/ui';
import type { EvaluationResult } from '../../lib/compliance/evaluator';
import { ComplianceStatus } from '../../lib/compliance/evaluator/types';

interface ComplianceScoreDashboardProps {
  evaluation: EvaluationResult;
}

/**
 * Display compliance score with visual indicators
 */
export const ComplianceScoreDashboard = ({
  evaluation
}: ComplianceScoreDashboardProps) => {
  const getStatusColorProps = (status: ComplianceStatus) => {
    switch (status) {
      case ComplianceStatus.COMPLIANT:
        return {
          color: '$green10',
          backgroundColor: '$green2',
          borderColor: '$green6',
        };
      case ComplianceStatus.WARNING:
        return {
          color: '$yellow10',
          backgroundColor: '$yellow2',
          borderColor: '$yellow6',
        };
      case ComplianceStatus.CRITICAL:
        return {
          color: '$red10',
          backgroundColor: '$red2',
          borderColor: '$red6',
        };
      default:
        return {
          color: '$gray10',
          backgroundColor: '$gray2',
          borderColor: '$gray6',
        };
    }
  };

  const getStatusLabel = (status: ComplianceStatus): string => {
    switch (status) {
      case ComplianceStatus.COMPLIANT:
        return 'Compliant';
      case ComplianceStatus.WARNING:
        return 'Needs Attention';
      case ComplianceStatus.CRITICAL:
        return 'Critical Issues';
      default:
        return 'Unknown';
    }
  };

  const getScoreColor = (score: number) => {
    if (score >= 90) return '$green10';
    if (score >= 70) return '$yellow10';
    return '$red10';
  };

  const statusColorProps = getStatusColorProps(evaluation.status);

  return (
    <Card padding="$6" elevation={2} borderRadius="$4">
      <XStack alignItems="center" justifyContent="space-between" mb="$6">
        <H2 fontSize="$8" fontWeight="bold" color="$color12">
          Compliance Score
        </H2>
        <XStack
          paddingHorizontal="$4"
          paddingVertical="$2"
          borderRadius={9999}
          borderWidth={2}
          fontWeight="600"
          {...statusColorProps}
        >
          <Text {...statusColorProps} fontWeight="600">
            {getStatusLabel(evaluation.status)}
          </Text>
        </XStack>
      </XStack>

      {/* Score Display */}
      <YStack alignItems="center" mb="$8">
        <Text fontSize="$10" fontWeight="bold" color={getScoreColor(evaluation.score)}>
          {evaluation.score}
        </Text>
        <Text color="$color10" fontSize="$2" mt="$2">
          out of 100
        </Text>
      </YStack>

      {/* Score Breakdown */}
      <YStack gap="$4">
        <XStack justifyContent="space-between" alignItems="center" borderTopWidth={1} borderColor="$borderColor" paddingTop="$4">
          <Text color="$color10">Total Gaps Identified:</Text>
          <Text fontWeight="600" color="$color12">
            {evaluation.gaps.length}
          </Text>
        </XStack>

        <XStack justifyContent="space-between" alignItems="center">
          <Text color="$color10">Critical Issues:</Text>
          <Text fontWeight="600" color="$red10">
            {evaluation.gaps.filter((g) => g.severity === 'critical').length}
          </Text>
        </XStack>

        <XStack justifyContent="space-between" alignItems="center">
          <Text color="$color10">Warnings:</Text>
          <Text fontWeight="600" color="$yellow10">
            {evaluation.gaps.filter((g) => g.severity === 'warning').length}
          </Text>
        </XStack>

        <XStack justifyContent="space-between" alignItems="center" borderTopWidth={1} borderColor="$borderColor" paddingTop="$4">
          <Text color="$color10">Coverage Types Evaluated:</Text>
          <Text fontWeight="600" color="$color12">
            {evaluation.metadata.coverage_types_evaluated.length}
          </Text>
        </XStack>

        <XStack justifyContent="space-between" alignItems="center">
          <Text color="$color10">Requirements Checked:</Text>
          <Text fontWeight="600" color="$color12">
            {evaluation.metadata.total_requirements_checked}
          </Text>
        </XStack>
      </YStack>

      {/* Evaluation Metadata */}
      <YStack mt="$6" paddingTop="$6" borderTopWidth={1} borderColor="$borderColor">
        <XStack justifyContent="space-between">
          <Text fontSize="$1" color="$color10">
            Evaluated: {new Date(evaluation.evaluated_at).toLocaleString()}
          </Text>
          <Text fontSize="$1" color="$color10">
            Duration: {evaluation.metadata.evaluation_duration_ms}ms
          </Text>
        </XStack>
        <Text fontSize="$1" color="$color10" mt="$1">
          Engine Version: {evaluation.metadata.rule_engine_version}
        </Text>
      </YStack>
    </Card>
  );
};
