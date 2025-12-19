/**
 * REQ-165: Compliance Requirements Management System
 * Detail view for a single compliance requirement
 */

import React, { useState, useEffect, useCallback } from 'react';
import { YStack, XStack, Text, Button, Card, H2, H3 } from '@unicornlove/ui';
import {
  ComplianceRequirement,
  CoverageType,
  RequirementStatus
} from '../../lib/compliance/types';
import { getRequirement, getRequirementVersions } from '../../lib/compliance/requirementService';

interface RequirementDetailProps {
  requirementId: string;
  onEdit?: () => void;
  onClose?: () => void;
  onViewVersion?: (versionId: string) => void;
}

export default function RequirementDetail({
  requirementId,
  onEdit,
  onClose,
  onViewVersion
}: RequirementDetailProps) {
  const [requirement, setRequirement] = useState<ComplianceRequirement | null>(null);
  const [versions, setVersions] = useState<ComplianceRequirement[]>([]);
  const [showVersions, setShowVersions] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadRequirement = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await getRequirement(requirementId);
      setRequirement(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load requirement');
    } finally {
      setLoading(false);
    }
  }, [requirementId]);

  const loadVersions = useCallback(async () => {
    try {
      const data = await getRequirementVersions(requirementId);
      setVersions(data);
    } catch (err) {
      console.error('Failed to load versions:', err);
    }
  }, [requirementId]);

  useEffect(() => {
    loadRequirement();
    loadVersions();
  }, [loadRequirement, loadVersions]);

  function formatCurrency(amount: number): string {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0
    }).format(amount);
  }

  function getTypeLabel(type: CoverageType): string {
    const labels = {
      [CoverageType.GENERAL_LIABILITY]: 'General Liability',
      [CoverageType.WORKERS_COMP]: 'Workers Compensation',
      [CoverageType.AUTO_LIABILITY]: 'Auto Liability',
      [CoverageType.UMBRELLA]: 'Umbrella/Excess Liability',
      [CoverageType.CUSTOM]: 'Custom'
    };
    return labels[type];
  }

  function getStatusBadge(status: RequirementStatus) {
    const badgeConfig = {
      [RequirementStatus.ACTIVE]: { bg: '$green3', color: '$green11' },
      [RequirementStatus.DRAFT]: { bg: '$yellow3', color: '$yellow11' },
      [RequirementStatus.ARCHIVED]: { bg: '$gray3', color: '$gray11' }
    };

    const config = badgeConfig[status] || badgeConfig[RequirementStatus.DRAFT];

    return (
      <Text
        paddingHorizontal="$3"
        paddingVertical="$1"
        fontSize="$3"
        fontWeight="500"
        borderRadius={9999}
        backgroundColor={config.bg}
        color={config.color}
      >
        {status.charAt(0).toUpperCase() + status.slice(1)}
      </Text>
    );
  }

  if (loading) {
    return (
      <YStack alignItems="center" justifyContent="center" height={256}>
        <Text color="$gray9">Loading requirement details...</Text>
      </YStack>
    );
  }

  if (error || !requirement) {
    return (
      <Card backgroundColor="$red2" borderColor="$red5" borderRadius="$2" padding="$4">
        <Text color="$red11">Error: {error || 'Requirement not found'}</Text>
        {onClose && (
          <Button
            unstyled
            marginTop="$2"
            fontSize="$3"
            color="$red9"
            hoverStyle={{ color: '$red10' }}
            onPress={onClose}
          >
            Close
          </Button>
        )}
      </Card>
    );
  }

  const { requirement_definition } = requirement;

  return (
    <YStack gap="$6">
      {/* Header */}
      <Card backgroundColor="$background" borderRadius="$4" elevation={2} padding="$6">
        <XStack alignItems="flex-start" justifyContent="space-between">
          <YStack flex={1}>
            <XStack alignItems="center" gap="$3" marginBottom="$2">
              <H2 fontSize="$9" fontWeight="700" color="$gray12">{requirement.name}</H2>
              {getStatusBadge(requirement.status)}
              {requirement.is_template && (
                <Text
                  paddingHorizontal="$3"
                  paddingVertical="$1"
                  fontSize="$3"
                  fontWeight="500"
                  borderRadius={9999}
                  backgroundColor="$purple3"
                  color="$purple11"
                >
                  Template
                </Text>
              )}
            </XStack>
            <YStack gap="$1">
              <Text fontSize="$3" color="$gray9">Type: {getTypeLabel(requirement.type)}</Text>
              <Text fontSize="$3" color="$gray9">Version: {requirement.version}</Text>
              <Text fontSize="$3" color="$gray9">
                Effective Date: {new Date(requirement.effective_date).toLocaleDateString()}
              </Text>
              {requirement.superseded_date && (
                <Text fontSize="$3" color="$orange9">
                  Superseded: {new Date(requirement.superseded_date).toLocaleDateString()}
                </Text>
              )}
            </YStack>
            {requirement.description && (
              <Text marginTop="$4" color="$gray11">{requirement.description}</Text>
            )}
          </YStack>
          <XStack gap="$2">
            {onEdit && requirement.status !== RequirementStatus.ARCHIVED && (
              <Button variant="solid" onPress={onEdit}>
                Edit
              </Button>
            )}
            {onClose && (
              <Button variant="outlined" onPress={onClose}>
                Close
              </Button>
            )}
          </XStack>
        </XStack>
      </Card>

      {/* Coverage Limits */}
      <Card backgroundColor="$background" borderRadius="$4" elevation={2} padding="$6">
        <H3 fontSize="$6" fontWeight="600" color="$gray12" marginBottom="$4">Coverage Limits</H3>
        {Object.keys(requirement_definition.coverage_limits).length === 0 ? (
          <Text color="$gray9">Statutory or per policy</Text>
        ) : (
          <XStack flexWrap="wrap" gap="$4">
            {Object.entries(requirement_definition.coverage_limits).map(([key, value]) => {
              if (value === undefined) return null;
              return (
                <YStack key={key} flex={1} minWidth="200px">
                  <Text fontSize="$3" fontWeight="500" color="$gray9" textTransform="capitalize">
                    {key.replace(/_/g, ' ')}
                  </Text>
                  <Text fontSize="$6" fontWeight="600" color="$gray12">{formatCurrency(value)}</Text>
                </YStack>
              );
            })}
          </XStack>
        )}
      </Card>

      {/* Required Endorsements */}
      <Card backgroundColor="$background" borderRadius="$4" elevation={2} padding="$6">
        <H3 fontSize="$6" fontWeight="600" color="$gray12" marginBottom="$4">Required Endorsements</H3>
        {requirement_definition.required_endorsements.length === 0 ? (
          <Text color="$gray9">No endorsements required</Text>
        ) : (
          <YStack gap="$4">
            {requirement_definition.required_endorsements.map((endorsement, index) => (
              <YStack key={index} borderLeftWidth={4} borderColor="$blue9" paddingLeft="$4">
                <Text fontWeight="500" color="$gray12">{endorsement.endorsement_type}</Text>
                <Text fontSize="$3" color="$gray10" marginTop="$1">{endorsement.description}</Text>
              </YStack>
            ))}
          </YStack>
        )}
      </Card>

      {/* Policy Conditions */}
      <Card backgroundColor="$background" borderRadius="$4" elevation={2} padding="$6">
        <H3 fontSize="$6" fontWeight="600" color="$gray12" marginBottom="$4">Policy Conditions</H3>
        {requirement_definition.policy_conditions.length === 0 ? (
          <Text color="$gray9">No special conditions</Text>
        ) : (
          <YStack gap="$4">
            {requirement_definition.policy_conditions.map((condition, index) => (
              <YStack key={index} borderLeftWidth={4} borderColor="$green9" paddingLeft="$4">
                <Text fontWeight="500" color="$gray12">{condition.condition_type}</Text>
                <Text fontSize="$3" color="$gray10" marginTop="$1">{condition.description}</Text>
              </YStack>
            ))}
          </YStack>
        )}
      </Card>

      {/* Documentation Requirements */}
      <Card backgroundColor="$background" borderRadius="$4" elevation={2} padding="$6">
        <H3 fontSize="$6" fontWeight="600" color="$gray12" marginBottom="$4">Documentation Requirements</H3>
        {requirement_definition.documentation_requirements.length === 0 ? (
          <Text color="$gray9">No documentation specified</Text>
        ) : (
          <YStack gap="$2">
            {requirement_definition.documentation_requirements.map((doc, index) => (
              <XStack key={index} alignItems="center" gap="$2">
                <Text color={doc.is_required ? '$red9' : '$gray7'} fontWeight={doc.is_required ? '700' : '400'}>
                  {doc.is_required ? '* Required' : 'Optional'}
                </Text>
                <Text color="$gray12">{doc.document_type}</Text>
              </XStack>
            ))}
          </YStack>
        )}
      </Card>

      {/* Version History */}
      {versions.length > 1 && (
        <Card backgroundColor="$background" borderRadius="$4" elevation={2} padding="$6">
          <XStack alignItems="center" justifyContent="space-between" marginBottom="$4">
            <H3 fontSize="$6" fontWeight="600" color="$gray12">Version History</H3>
            <Button
              unstyled
              fontSize="$3"
              color="$blue9"
              hoverStyle={{ color: '$blue10' }}
              onPress={() => setShowVersions(!showVersions)}
            >
              {showVersions ? 'Hide' : 'Show'} Versions ({versions.length})
            </Button>
          </XStack>
          {showVersions && (
            <YStack gap="$2">
              {versions.map((version) => (
                <Card
                  key={version.id}
                  padding="$3"
                  borderColor={version.id === requirement.id ? '$blue9' : '$gray5'}
                  backgroundColor={version.id === requirement.id ? '$blue2' : '$background'}
                  borderRadius="$2"
                  hoverStyle={{ backgroundColor: '$gray2' }}
                >
                  <XStack alignItems="center" justifyContent="space-between">
                    <YStack>
                      <XStack alignItems="center" gap="$2">
                        <Text fontWeight="500">Version {version.version}</Text>
                        {version.id === requirement.id && (
                          <Text fontSize="$3" color="$blue9">(Current)</Text>
                        )}
                        {version.superseded_date && (
                          <Text fontSize="$3" color="$gray9">
                            (Superseded {new Date(version.superseded_date).toLocaleDateString()})
                          </Text>
                        )}
                      </XStack>
                      {version.change_summary && (
                        <Text fontSize="$3" color="$gray10" marginTop="$1">{version.change_summary}</Text>
                      )}
                      <Text fontSize="$2" color="$gray9" marginTop="$1">
                        Effective: {new Date(version.effective_date).toLocaleDateString()}
                      </Text>
                    </YStack>
                    {onViewVersion && version.id !== requirement.id && (
                      <Button
                        unstyled
                        fontSize="$3"
                        color="$blue9"
                        hoverStyle={{ color: '$blue10' }}
                        onPress={() => onViewVersion(version.id)}
                      >
                        View
                      </Button>
                    )}
                  </XStack>
                </Card>
              ))}
            </YStack>
          )}
        </Card>
      )}
    </YStack>
  );
}
