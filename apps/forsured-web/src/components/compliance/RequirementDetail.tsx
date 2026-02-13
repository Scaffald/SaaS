/**
 * Compliance Requirements Management System
 * Detail view for a single compliance requirement
 */

import React, { useState, useEffect, useCallback } from 'react';
import { Stack, Row, Text, Button, Card } from '@scaffald/ui';
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

  function getStatusBadgeStyles(status: RequirementStatus): React.CSSProperties {
    const badgeConfig = {
      [RequirementStatus.ACTIVE]: { backgroundColor: 'var(--color-green-3)', color: 'var(--color-green-11)' },
      [RequirementStatus.DRAFT]: { backgroundColor: 'var(--color-yellow-3)', color: 'var(--color-yellow-11)' },
      [RequirementStatus.ARCHIVED]: { backgroundColor: 'var(--color-gray-3)', color: 'var(--color-gray-11)' }
    };

    return badgeConfig[status] || badgeConfig[RequirementStatus.DRAFT];
  }

  function getStatusBadge(status: RequirementStatus) {
    return (
      <Text
        style={{
          paddingLeft: 'var(--space-3)',
          paddingRight: 'var(--space-3)',
          paddingTop: 4,
          paddingBottom: 4,
          fontSize: 'var(--font-size-3)',
          fontWeight: 500,
          borderRadius: 9999,
          ...getStatusBadgeStyles(status),
        }}
      >
        {status.charAt(0).toUpperCase() + status.slice(1)}
      </Text>
    );
  }

  if (loading) {
    return (
      <Stack style={{ alignItems: 'center', justifyContent: 'center', height: 256 }}>
        <Text style={{ color: 'var(--color-gray-9)' }}>Loading requirement details...</Text>
      </Stack>
    );
  }

  if (error || !requirement) {
    return (
      <Card style={{ backgroundColor: 'var(--color-red-2)', borderColor: 'var(--color-red-5)', borderRadius: 'var(--radius-2)', padding: 'var(--space-4)' }}>
        <Text style={{ color: 'var(--color-red-11)' }}>Error: {error || 'Requirement not found'}</Text>
        {onClose && (
          <button
            style={{
              marginTop: 8,
              fontSize: 'var(--font-size-3)',
              color: 'var(--color-red-9)',
              background: 'transparent',
              border: 'none',
              cursor: 'pointer',
            }}
            onClick={onClose}
          >
            Close
          </button>
        )}
      </Card>
    );
  }

  const { requirement_definition } = requirement;

  return (
    <Stack style={{ gap: 'var(--space-6)' }}>
      {/* Header */}
      <Card style={{ backgroundColor: 'var(--color-background)', borderRadius: 'var(--radius-4)', boxShadow: '0 2px 8px var(--color-shadow)', padding: 'var(--space-6)' }}>
        <Row style={{ alignItems: 'flex-start', justifyContent: 'space-between' }}>
          <Stack style={{ flex: 1 }}>
            <Row style={{ alignItems: 'center', gap: 'var(--space-3)', marginBottom: 8 }}>
              <h2 style={{ fontSize: 'var(--font-size-9)', fontWeight: 700, color: 'var(--color-gray-12)', margin: 0 }}>{requirement.name}</h2>
              {getStatusBadge(requirement.status)}
              {requirement.is_template && (
                <Text
                  style={{
                    paddingLeft: 'var(--space-3)',
                    paddingRight: 'var(--space-3)',
                    paddingTop: 4,
                    paddingBottom: 4,
                    fontSize: 'var(--font-size-3)',
                    fontWeight: 500,
                    borderRadius: 9999,
                    backgroundColor: 'var(--color-purple-3)',
                    color: 'var(--color-purple-11)',
                  }}
                >
                  Template
                </Text>
              )}
            </Row>
            <Stack style={{ gap: 4 }}>
              <Text style={{ fontSize: 'var(--font-size-3)', color: 'var(--color-gray-9)' }}>Type: {getTypeLabel(requirement.type)}</Text>
              <Text style={{ fontSize: 'var(--font-size-3)', color: 'var(--color-gray-9)' }}>Version: {requirement.version}</Text>
              <Text style={{ fontSize: 'var(--font-size-3)', color: 'var(--color-gray-9)' }}>
                Effective Date: {new Date(requirement.effective_date).toLocaleDateString()}
              </Text>
              {requirement.superseded_date && (
                <Text style={{ fontSize: 'var(--font-size-3)', color: 'var(--color-orange-9)' }}>
                  Superseded: {new Date(requirement.superseded_date).toLocaleDateString()}
                </Text>
              )}
            </Stack>
            {requirement.description && (
              <Text style={{ marginTop: 'var(--space-4)', color: 'var(--color-gray-11)' }}>{requirement.description}</Text>
            )}
          </Stack>
          <Row style={{ gap: 'var(--space-2)' }}>
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
          </Row>
        </Row>
      </Card>

      {/* Coverage Limits */}
      <Card style={{ backgroundColor: 'var(--color-background)', borderRadius: 'var(--radius-4)', boxShadow: '0 2px 8px var(--color-shadow)', padding: 'var(--space-6)' }}>
        <h3 style={{ fontSize: 'var(--font-size-6)', fontWeight: 600, color: 'var(--color-gray-12)', marginBottom: 'var(--space-4)', margin: 0 }}>Coverage Limits</h3>
        {Object.keys(requirement_definition.coverage_limits).length === 0 ? (
          <Text style={{ color: 'var(--color-gray-9)' }}>Statutory or per policy</Text>
        ) : (
          <Row style={{ flexWrap: 'wrap', gap: 'var(--space-4)' }}>
            {Object.entries(requirement_definition.coverage_limits).map(([key, value]) => {
              if (value === undefined) return null;
              return (
                <Stack key={key} style={{ flex: 1, minWidth: 200 }}>
                  <Text style={{ fontSize: 'var(--font-size-3)', fontWeight: 500, color: 'var(--color-gray-9)', textTransform: 'capitalize' }}>
                    {key.replace(/_/g, ' ')}
                  </Text>
                  <Text style={{ fontSize: 'var(--font-size-6)', fontWeight: 600, color: 'var(--color-gray-12)' }}>{formatCurrency(value)}</Text>
                </Stack>
              );
            })}
          </Row>
        )}
      </Card>

      {/* Required Endorsements */}
      <Card style={{ backgroundColor: 'var(--color-background)', borderRadius: 'var(--radius-4)', boxShadow: '0 2px 8px var(--color-shadow)', padding: 'var(--space-6)' }}>
        <h3 style={{ fontSize: 'var(--font-size-6)', fontWeight: 600, color: 'var(--color-gray-12)', marginBottom: 'var(--space-4)', margin: 0 }}>Required Endorsements</h3>
        {requirement_definition.required_endorsements.length === 0 ? (
          <Text style={{ color: 'var(--color-gray-9)' }}>No endorsements required</Text>
        ) : (
          <Stack style={{ gap: 'var(--space-4)' }}>
            {requirement_definition.required_endorsements.map((endorsement, index) => (
              <Stack key={index} style={{ borderLeftWidth: 4, borderLeftStyle: 'solid', borderColor: 'var(--color-blue-9)', paddingLeft: 'var(--space-4)' }}>
                <Text style={{ fontWeight: 500, color: 'var(--color-gray-12)' }}>{endorsement.endorsement_type}</Text>
                <Text style={{ fontSize: 'var(--font-size-3)', color: 'var(--color-gray-10)', marginTop: 4 }}>{endorsement.description}</Text>
              </Stack>
            ))}
          </Stack>
        )}
      </Card>

      {/* Policy Conditions */}
      <Card style={{ backgroundColor: 'var(--color-background)', borderRadius: 'var(--radius-4)', boxShadow: '0 2px 8px var(--color-shadow)', padding: 'var(--space-6)' }}>
        <h3 style={{ fontSize: 'var(--font-size-6)', fontWeight: 600, color: 'var(--color-gray-12)', marginBottom: 'var(--space-4)', margin: 0 }}>Policy Conditions</h3>
        {requirement_definition.policy_conditions.length === 0 ? (
          <Text style={{ color: 'var(--color-gray-9)' }}>No special conditions</Text>
        ) : (
          <Stack style={{ gap: 'var(--space-4)' }}>
            {requirement_definition.policy_conditions.map((condition, index) => (
              <Stack key={index} style={{ borderLeftWidth: 4, borderLeftStyle: 'solid', borderColor: 'var(--color-green-9)', paddingLeft: 'var(--space-4)' }}>
                <Text style={{ fontWeight: 500, color: 'var(--color-gray-12)' }}>{condition.condition_type}</Text>
                <Text style={{ fontSize: 'var(--font-size-3)', color: 'var(--color-gray-10)', marginTop: 4 }}>{condition.description}</Text>
              </Stack>
            ))}
          </Stack>
        )}
      </Card>

      {/* Documentation Requirements */}
      <Card style={{ backgroundColor: 'var(--color-background)', borderRadius: 'var(--radius-4)', boxShadow: '0 2px 8px var(--color-shadow)', padding: 'var(--space-6)' }}>
        <h3 style={{ fontSize: 'var(--font-size-6)', fontWeight: 600, color: 'var(--color-gray-12)', marginBottom: 'var(--space-4)', margin: 0 }}>Documentation Requirements</h3>
        {requirement_definition.documentation_requirements.length === 0 ? (
          <Text style={{ color: 'var(--color-gray-9)' }}>No documentation specified</Text>
        ) : (
          <Stack style={{ gap: 'var(--space-2)' }}>
            {requirement_definition.documentation_requirements.map((doc, index) => (
              <Row key={index} style={{ alignItems: 'center', gap: 'var(--space-2)' }}>
                <Text style={{ color: doc.is_required ? 'var(--color-red-9)' : 'var(--color-gray-7)', fontWeight: doc.is_required ? 700 : 400 }}>
                  {doc.is_required ? '* Required' : 'Optional'}
                </Text>
                <Text style={{ color: 'var(--color-gray-12)' }}>{doc.document_type}</Text>
              </Row>
            ))}
          </Stack>
        )}
      </Card>

      {/* Version History */}
      {versions.length > 1 && (
        <Card style={{ backgroundColor: 'var(--color-background)', borderRadius: 'var(--radius-4)', boxShadow: '0 2px 8px var(--color-shadow)', padding: 'var(--space-6)' }}>
          <Row style={{ alignItems: 'center', justifyContent: 'space-between', marginBottom: 'var(--space-4)' }}>
            <h3 style={{ fontSize: 'var(--font-size-6)', fontWeight: 600, color: 'var(--color-gray-12)', margin: 0 }}>Version History</h3>
            <button
              style={{
                fontSize: 'var(--font-size-3)',
                color: 'var(--color-blue-9)',
                background: 'transparent',
                border: 'none',
                cursor: 'pointer',
              }}
              onClick={() => setShowVersions(!showVersions)}
            >
              {showVersions ? 'Hide' : 'Show'} Versions ({versions.length})
            </button>
          </Row>
          {showVersions && (
            <Stack style={{ gap: 'var(--space-2)' }}>
              {versions.map((version) => (
                <Card
                  key={version.id}
                  style={{
                    padding: 'var(--space-3)',
                    borderColor: version.id === requirement.id ? 'var(--color-blue-9)' : 'var(--color-gray-5)',
                    backgroundColor: version.id === requirement.id ? 'var(--color-blue-2)' : 'var(--color-background)',
                    borderRadius: 'var(--radius-2)',
                  }}
                >
                  <Row style={{ alignItems: 'center', justifyContent: 'space-between' }}>
                    <Stack>
                      <Row style={{ alignItems: 'center', gap: 'var(--space-2)' }}>
                        <Text style={{ fontWeight: 500 }}>Version {version.version}</Text>
                        {version.id === requirement.id && (
                          <Text style={{ fontSize: 'var(--font-size-3)', color: 'var(--color-blue-9)' }}>(Current)</Text>
                        )}
                        {version.superseded_date && (
                          <Text style={{ fontSize: 'var(--font-size-3)', color: 'var(--color-gray-9)' }}>
                            (Superseded {new Date(version.superseded_date).toLocaleDateString()})
                          </Text>
                        )}
                      </Row>
                      {version.change_summary && (
                        <Text style={{ fontSize: 'var(--font-size-3)', color: 'var(--color-gray-10)', marginTop: 4 }}>{version.change_summary}</Text>
                      )}
                      <Text style={{ fontSize: 'var(--font-size-2)', color: 'var(--color-gray-9)', marginTop: 4 }}>
                        Effective: {new Date(version.effective_date).toLocaleDateString()}
                      </Text>
                    </Stack>
                    {onViewVersion && version.id !== requirement.id && (
                      <button
                        style={{
                          fontSize: 'var(--font-size-3)',
                          color: 'var(--color-blue-9)',
                          background: 'transparent',
                          border: 'none',
                          cursor: 'pointer',
                        }}
                        onClick={() => onViewVersion(version.id)}
                      >
                        View
                      </button>
                    )}
                  </Row>
                </Card>
              ))}
            </Stack>
          )}
        </Card>
      )}
    </Stack>
  );
}
