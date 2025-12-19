/**
 * REQ-165: Compliance Requirements Management System
 * List view for compliance requirements with filtering and actions
 */

import { useState, useEffect, useCallback } from 'react';
import { YStack, XStack, Text, Button, Card, H2, Input, Select, Spinner } from '@unicornlove/ui';
import {
  ComplianceRequirement,
  CoverageType,
  RequirementStatus,
  RequirementFilters
} from '../../lib/compliance/types';
import { listRequirements, deleteRequirement } from '../../lib/compliance/requirementService';

interface RequirementListProps {
  organizationId: string;
  onViewRequirement?: (requirement: ComplianceRequirement) => void;
  onEditRequirement?: (requirement: ComplianceRequirement) => void;
  onCloneRequirement?: (requirement: ComplianceRequirement) => void;
  onCreateNew?: () => void;
}

export default function RequirementList({
  organizationId,
  onViewRequirement,
  onEditRequirement,
  onCloneRequirement,
  onCreateNew
}: RequirementListProps) {
  const [requirements, setRequirements] = useState<ComplianceRequirement[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [filters, setFilters] = useState<RequirementFilters>({
    organization_id: organizationId
  });
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [searchTerm, setSearchTerm] = useState('');

  const loadRequirements = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      const result = await listRequirements({
        filters: {
          ...filters,
          search: searchTerm || undefined
        },
        page,
        limit: 20,
        sort_by: 'created_at',
        ascending: false
      });

      setRequirements(result.data);
      setTotalPages(result.pagination.total_pages);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load requirements');
    } finally {
      setLoading(false);
    }
  }, [filters, page, searchTerm]);

  useEffect(() => {
    loadRequirements();
  }, [loadRequirements]);

  function handleSearch(e: React.FormEvent) {
    e.preventDefault();
    setPage(1);
    loadRequirements();
  }

  async function handleDelete(requirement: ComplianceRequirement) {
    if (!confirm(`Are you sure you want to archive "${requirement.name}"?`)) {
      return;
    }

    try {
      await deleteRequirement(requirement.id);
      loadRequirements();
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Failed to archive requirement');
    }
  }

  function getTypeLabel(type: CoverageType): string {
    const labels = {
      [CoverageType.GENERAL_LIABILITY]: 'General Liability',
      [CoverageType.WORKERS_COMP]: 'Workers Comp',
      [CoverageType.AUTO_LIABILITY]: 'Auto Liability',
      [CoverageType.UMBRELLA]: 'Umbrella',
      [CoverageType.CUSTOM]: 'Custom'
    };
    return labels[type];
  }

  function getStatusBadge(status: RequirementStatus) {
    const colorMap = {
      [RequirementStatus.ACTIVE]: { bg: '$green2', text: '$green11' },
      [RequirementStatus.DRAFT]: { bg: '$yellow2', text: '$yellow11' },
      [RequirementStatus.ARCHIVED]: { bg: '$gray2', text: '$gray11' }
    };

    const colors = colorMap[status];

    return (
      <Text
        paddingHorizontal="$2"
        paddingVertical="$1"
        fontSize="$1"
        fontWeight="500"
        borderRadius="$10"
        backgroundColor={colors.bg}
        color={colors.text}
      >
        {status.charAt(0).toUpperCase() + status.slice(1)}
      </Text>
    );
  }

  if (loading && requirements.length === 0) {
    return (
      <YStack alignItems="center" justifyContent="center" height={256}>
        <Spinner size="large" />
        <Text color="$color10" marginTop="$4">Loading requirements...</Text>
      </YStack>
    );
  }

  if (error) {
    return (
      <Card backgroundColor="$red2" borderColor="$red5" borderRadius="$4" padding="$4">
        <Text color="$red11" marginBottom="$2">Error: {error}</Text>
        <Button
          onPress={() => loadRequirements()}
          fontSize="$3"
          color="$red10"
          hoverStyle={{ color: '$red11' }}
          backgroundColor="transparent"
          borderWidth={0}
          textDecorationLine="underline"
        >
          Retry
        </Button>
      </Card>
    );
  }

  return (
    <YStack gap="$4">
      {/* Header */}
      <XStack alignItems="center" justifyContent="space-between">
        <H2 fontSize="$7" fontWeight="700" color="$color12">Compliance Requirements</H2>
        {onCreateNew && (
          <Button
            onPress={onCreateNew}
            paddingHorizontal="$4"
            paddingVertical="$2"
            backgroundColor="$blue9"
            color="white"
            borderRadius="$4"
            hoverStyle={{ backgroundColor: '$blue10' }}
            focusStyle={{ borderWidth: 2, borderColor: '$blue9' }}
          >
            Create Requirement
          </Button>
        )}
      </XStack>

      {/* Search and Filters */}
      <Card backgroundColor="$background" borderRadius="$4" shadowColor="$shadowColor" shadowOpacity={0.1} shadowRadius={2} padding="$4">
        <YStack as="form" onSubmit={handleSearch} gap="$4">
          <Input
              type="text"
              placeholder="Search requirements..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            width="100%"
            paddingHorizontal="$4"
            paddingVertical="$2"
            borderColor="$borderColor"
            borderRadius="$4"
            focusStyle={{ borderWidth: 2, borderColor: '$blue9' }}
          />

          <XStack flexWrap="wrap" gap="$4">
            {/* Type Filter */}
            <YStack flex={1} minWidth="200px">
              <Text fontSize="$3" fontWeight="500" color="$color11" marginBottom="$1">
                Type
              </Text>
              <select
                value={filters.type || ''}
                onChange={(e) =>
                  setFilters({ ...filters, type: e.target.value as CoverageType || undefined })
                }
                style={{
                  width: '100%',
                  padding: '8px 12px',
                  border: '1px solid var(--borderColor)',
                  borderRadius: '6px',
                  fontSize: '14px',
                }}
              >
                <option value="">All Types</option>
                <option value={CoverageType.GENERAL_LIABILITY}>General Liability</option>
                <option value={CoverageType.WORKERS_COMP}>Workers Comp</option>
                <option value={CoverageType.AUTO_LIABILITY}>Auto Liability</option>
                <option value={CoverageType.UMBRELLA}>Umbrella</option>
                <option value={CoverageType.CUSTOM}>Custom</option>
              </select>
            </YStack>

            {/* Status Filter */}
            <YStack flex={1} minWidth="200px">
              <Text fontSize="$3" fontWeight="500" color="$color11" marginBottom="$1">
                Status
              </Text>
              <select
                value={filters.status || ''}
                onChange={(e) =>
                  setFilters({ ...filters, status: e.target.value as RequirementStatus || undefined })
                }
                style={{
                  width: '100%',
                  padding: '8px 12px',
                  border: '1px solid var(--borderColor)',
                  borderRadius: '6px',
                  fontSize: '14px',
                }}
              >
                <option value="">All Statuses</option>
                <option value={RequirementStatus.ACTIVE}>Active</option>
                <option value={RequirementStatus.DRAFT}>Draft</option>
                <option value={RequirementStatus.ARCHIVED}>Archived</option>
              </select>
            </YStack>

            {/* Template Filter */}
            <YStack flex={1} minWidth="200px">
              <Text fontSize="$3" fontWeight="500" color="$color11" marginBottom="$1">
                Type
              </Text>
              <select
                value={filters.is_template === undefined ? '' : filters.is_template.toString()}
                onChange={(e) => {
                  const value = e.target.value;
                  setFilters({
                    ...filters,
                    is_template: value === '' ? undefined : value === 'true'
                  });
                }}
                style={{
                  width: '100%',
                  padding: '8px 12px',
                  border: '1px solid var(--borderColor)',
                  borderRadius: '6px',
                  fontSize: '14px',
                }}
              >
                <option value="">All</option>
                <option value="true">Templates Only</option>
                <option value="false">Requirements Only</option>
              </select>
            </YStack>

            {/* Search Button */}
            <XStack alignItems="flex-end" flex={1} minWidth="200px">
              <Button
                type="submit"
                width="100%"
                paddingHorizontal="$4"
                paddingVertical="$2"
                backgroundColor="$gray9"
                color="white"
                borderRadius="$4"
                hoverStyle={{ backgroundColor: '$gray10' }}
                focusStyle={{ borderWidth: 2, borderColor: '$gray9' }}
              >
                Search
              </Button>
            </XStack>
          </XStack>
        </YStack>
      </Card>

      {/* Requirements Table */}
      {requirements.length === 0 ? (
        <Card backgroundColor="$background" borderRadius="$4" shadowColor="$shadowColor" shadowOpacity={0.1} shadowRadius={2} padding="$8">
          <YStack alignItems="center" gap="$4">
            <Text color="$color10" marginBottom="$4">No requirements found. Create your first requirement or load from templates.</Text>
          {onCreateNew && (
              <Button
                onPress={onCreateNew}
                paddingHorizontal="$4"
                paddingVertical="$2"
                backgroundColor="$blue9"
                color="white"
                borderRadius="$4"
                hoverStyle={{ backgroundColor: '$blue10' }}
                focusStyle={{ borderWidth: 2, borderColor: '$blue9' }}
            >
              Create Requirement
              </Button>
            )}
          </YStack>
        </Card>
      ) : (
        <Card backgroundColor="$background" borderRadius="$4" shadowColor="$shadowColor" shadowOpacity={0.1} shadowRadius={2} overflow="hidden">
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead style={{ backgroundColor: 'var(--gray2)' }}>
              <tr>
                <th style={{ padding: '12px 24px', textAlign: 'left', fontSize: '12px', fontWeight: '500', color: 'var(--color10)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                  Name
                </th>
                <th style={{ padding: '12px 24px', textAlign: 'left', fontSize: '12px', fontWeight: '500', color: 'var(--color10)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                  Type
                </th>
                <th style={{ padding: '12px 24px', textAlign: 'left', fontSize: '12px', fontWeight: '500', color: 'var(--color10)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                  Status
                </th>
                <th style={{ padding: '12px 24px', textAlign: 'left', fontSize: '12px', fontWeight: '500', color: 'var(--color10)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                  Version
                </th>
                <th style={{ padding: '12px 24px', textAlign: 'left', fontSize: '12px', fontWeight: '500', color: 'var(--color10)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                  Template
                </th>
                <th style={{ padding: '12px 24px', textAlign: 'right', fontSize: '12px', fontWeight: '500', color: 'var(--color10)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                  Actions
                </th>
              </tr>
            </thead>
            <tbody style={{ backgroundColor: 'var(--background)' }}>
              {requirements.map((requirement) => (
                <tr
                  key={requirement.id}
                  style={{
                    cursor: 'pointer',
                    borderBottom: '1px solid var(--borderColor)',
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.backgroundColor = 'var(--backgroundHover)';
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.backgroundColor = 'var(--background)';
                  }}
                  onClick={() => onViewRequirement?.(requirement)}
                >
                  <td style={{ padding: '16px 24px' }}>
                    <Text fontSize="$3" fontWeight="500" color="$color12">{requirement.name}</Text>
                    {requirement.description && (
                      <Text fontSize="$3" color="$color10" marginTop="$1" style={{ maxWidth: '28rem', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                        {requirement.description}
                      </Text>
                    )}
                  </td>
                  <td style={{ padding: '16px 24px', whiteSpace: 'nowrap' }}>
                    <Text fontSize="$3" color="$color12">{getTypeLabel(requirement.type)}</Text>
                  </td>
                  <td style={{ padding: '16px 24px', whiteSpace: 'nowrap' }}>
                    {getStatusBadge(requirement.status)}
                  </td>
                  <td style={{ padding: '16px 24px', whiteSpace: 'nowrap' }}>
                    <Text fontSize="$3" color="$color10">v{requirement.version}</Text>
                  </td>
                  <td style={{ padding: '16px 24px', whiteSpace: 'nowrap' }}>
                    <Text fontSize="$3" color="$color10">{requirement.is_template ? 'Yes' : 'No'}</Text>
                  </td>
                  <td style={{ padding: '16px 24px', whiteSpace: 'nowrap', textAlign: 'right' }}>
                    <XStack alignItems="center" justifyContent="flex-end" gap="$2">
                      {onEditRequirement && (
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            onEditRequirement(requirement);
                          }}
                          style={{
                            color: 'var(--blue10)',
                            background: 'transparent',
                            border: 'none',
                            fontSize: '14px',
                            fontWeight: '500',
                            cursor: 'pointer',
                            padding: '4px 8px',
                          }}
                          onMouseEnter={(e) => {
                            e.currentTarget.style.color = 'var(--blue11)';
                          }}
                          onMouseLeave={(e) => {
                            e.currentTarget.style.color = 'var(--blue10)';
                          }}
                        >
                          Edit
                        </button>
                      )}
                      {onCloneRequirement && (
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            onCloneRequirement(requirement);
                          }}
                          style={{
                            color: 'var(--green10)',
                            background: 'transparent',
                            border: 'none',
                            fontSize: '14px',
                            fontWeight: '500',
                            cursor: 'pointer',
                            padding: '4px 8px',
                          }}
                          onMouseEnter={(e) => {
                            e.currentTarget.style.color = 'var(--green11)';
                          }}
                          onMouseLeave={(e) => {
                            e.currentTarget.style.color = 'var(--green10)';
                          }}
                        >
                          Clone
                        </button>
                      )}
                      {requirement.status !== RequirementStatus.ARCHIVED && (
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            handleDelete(requirement);
                          }}
                          style={{
                            color: 'var(--red10)',
                            background: 'transparent',
                            border: 'none',
                            fontSize: '14px',
                            fontWeight: '500',
                            cursor: 'pointer',
                            padding: '4px 8px',
                          }}
                          onMouseEnter={(e) => {
                            e.currentTarget.style.color = 'var(--red11)';
                          }}
                          onMouseLeave={(e) => {
                            e.currentTarget.style.color = 'var(--red10)';
                          }}
                        >
                          Archive
                        </button>
                      )}
                    </XStack>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>

          {/* Pagination */}
          {totalPages > 1 && (
            <XStack
              backgroundColor="$gray2"
              paddingHorizontal="$6"
              paddingVertical="$3"
              alignItems="center"
              justifyContent="space-between"
              borderTopWidth={1}
              borderColor="$borderColor"
            >
              <Text fontSize="$3" color="$color11">
                Page {page} of {totalPages}
              </Text>
              <XStack gap="$2">
                <Button
                  onPress={() => setPage(Math.max(1, page - 1))}
                  disabled={page === 1}
                  paddingHorizontal="$3"
                  paddingVertical="$1"
                  borderWidth={1}
                  borderColor="$borderColor"
                  borderRadius="$4"
                  fontSize="$3"
                  fontWeight="500"
                  color="$color11"
                  hoverStyle={{ backgroundColor: '$backgroundHover' }}
                  disabledStyle={{ opacity: 0.5, cursor: 'not-allowed' }}
                  backgroundColor="transparent"
                >
                  Previous
                </Button>
                <Button
                  onPress={() => setPage(Math.min(totalPages, page + 1))}
                  disabled={page === totalPages}
                  paddingHorizontal="$3"
                  paddingVertical="$1"
                  borderWidth={1}
                  borderColor="$borderColor"
                  borderRadius="$4"
                  fontSize="$3"
                  fontWeight="500"
                  color="$color11"
                  hoverStyle={{ backgroundColor: '$backgroundHover' }}
                  disabledStyle={{ opacity: 0.5, cursor: 'not-allowed' }}
                  backgroundColor="transparent"
                >
                  Next
                </Button>
              </XStack>
            </XStack>
          )}
        </Card>
      )}
    </YStack>
  );
}
