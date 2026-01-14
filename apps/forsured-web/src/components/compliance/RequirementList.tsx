/**
 * REQ-165: Compliance Requirements Management System
 * List view for compliance requirements with filtering and actions
 */

import { useState, useEffect, useCallback } from 'react';
import { Loader2 } from 'lucide-react';
import { Stack, Row, Text, Button, Card } from '@unicornlove/beyond-ui';
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

  function getStatusBadgeStyles(status: RequirementStatus): React.CSSProperties {
    const colorMap = {
      [RequirementStatus.ACTIVE]: { backgroundColor: 'var(--color-green-2)', color: 'var(--color-green-11)' },
      [RequirementStatus.DRAFT]: { backgroundColor: 'var(--color-yellow-2)', color: 'var(--color-yellow-11)' },
      [RequirementStatus.ARCHIVED]: { backgroundColor: 'var(--color-gray-2)', color: 'var(--color-gray-11)' }
    };

    return colorMap[status] || colorMap[RequirementStatus.DRAFT];
  }

  function getStatusBadge(status: RequirementStatus) {
    return (
      <Text
        style={{
          paddingLeft: 'var(--space-2)',
          paddingRight: 'var(--space-2)',
          paddingTop: 4,
          paddingBottom: 4,
          fontSize: 'var(--font-size-1)',
          fontWeight: 500,
          borderRadius: 9999,
          ...getStatusBadgeStyles(status),
        }}
      >
        {status.charAt(0).toUpperCase() + status.slice(1)}
      </Text>
    );
  }

  if (loading && requirements.length === 0) {
    return (
      <Stack style={{ alignItems: 'center', justifyContent: 'center', height: 256 }}>
        <Loader2 className="animate-spin" style={{ width: 32, height: 32, color: 'var(--color-blue-10)' }} />
        <Text style={{ color: 'var(--color-10)', marginTop: 'var(--space-4)' }}>Loading requirements...</Text>
      </Stack>
    );
  }

  if (error) {
    return (
      <Card style={{ backgroundColor: 'var(--color-red-2)', borderColor: 'var(--color-red-5)', borderRadius: 'var(--radius-4)', padding: 'var(--space-4)' }}>
        <Text style={{ color: 'var(--color-red-11)', marginBottom: 8 }}>Error: {error}</Text>
        <button
          onPress={() => loadRequirements()}
          style={{
            fontSize: 'var(--font-size-3)',
            color: 'var(--color-red-10)',
            backgroundColor: 'transparent',
            border: 'none',
            textDecoration: 'underline',
            cursor: 'pointer',
          }}
        >
          Retry
        </button>
      </Card>
    );
  }

  return (
    <Stack style={{ gap: 'var(--space-4)' }}>
      {/* Header */}
      <Row style={{ alignItems: 'center', justifyContent: 'space-between' }}>
        <h2 style={{ fontSize: 'var(--font-size-7)', fontWeight: 700, color: 'var(--color-12)', margin: 0 }}>Compliance Requirements</h2>
        {onCreateNew && (
          <button
            onPress={onCreateNew}
            style={{
              paddingLeft: 'var(--space-4)',
              paddingRight: 'var(--space-4)',
              paddingTop: 8,
              paddingBottom: 8,
              backgroundColor: 'var(--color-blue-9)',
              color: 'white',
              borderRadius: 'var(--radius-4)',
              border: 'none',
              cursor: 'pointer',
            }}
          >
            Create Requirement
          </button>
        )}
      </Row>

      {/* Search and Filters */}
      <Card style={{ backgroundColor: 'var(--color-background)', borderRadius: 'var(--radius-4)', boxShadow: '0 1px 2px var(--color-shadow)', padding: 'var(--space-4)' }}>
        <form onSubmit={handleSearch}>
          <Stack style={{ gap: 'var(--space-4)' }}>
            <input
              type="text"
              placeholder="Search requirements..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              style={{
                width: '100%',
                paddingLeft: 'var(--space-4)',
                paddingRight: 'var(--space-4)',
                paddingTop: 8,
                paddingBottom: 8,
                borderRadius: 'var(--radius-4)',
                border: '1px solid var(--color-border)',
                fontSize: '14px',
              }}
            />

            <Row style={{ flexWrap: 'wrap', gap: 'var(--space-4)' }}>
              {/* Type Filter */}
              <Stack style={{ flex: 1, minWidth: 200 }}>
                <Text style={{ fontSize: 'var(--font-size-3)', fontWeight: 500, color: 'var(--color-11)', marginBottom: 4 }}>
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
                    border: '1px solid var(--color-border)',
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
              </Stack>

              {/* Status Filter */}
              <Stack style={{ flex: 1, minWidth: 200 }}>
                <Text style={{ fontSize: 'var(--font-size-3)', fontWeight: 500, color: 'var(--color-11)', marginBottom: 4 }}>
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
                    border: '1px solid var(--color-border)',
                    borderRadius: '6px',
                    fontSize: '14px',
                  }}
                >
                  <option value="">All Statuses</option>
                  <option value={RequirementStatus.ACTIVE}>Active</option>
                  <option value={RequirementStatus.DRAFT}>Draft</option>
                  <option value={RequirementStatus.ARCHIVED}>Archived</option>
                </select>
              </Stack>

              {/* Template Filter */}
              <Stack style={{ flex: 1, minWidth: 200 }}>
                <Text style={{ fontSize: 'var(--font-size-3)', fontWeight: 500, color: 'var(--color-11)', marginBottom: 4 }}>
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
                    border: '1px solid var(--color-border)',
                    borderRadius: '6px',
                    fontSize: '14px',
                  }}
                >
                  <option value="">All</option>
                  <option value="true">Templates Only</option>
                  <option value="false">Requirements Only</option>
                </select>
              </Stack>

              {/* Search Button */}
              <Row style={{ alignItems: 'flex-end', flex: 1, minWidth: 200 }}>
                <button
                  type="submit"
                  style={{
                    width: '100%',
                    paddingLeft: 'var(--space-4)',
                    paddingRight: 'var(--space-4)',
                    paddingTop: 8,
                    paddingBottom: 8,
                    backgroundColor: 'var(--color-gray-9)',
                    color: 'white',
                    borderRadius: 'var(--radius-4)',
                    border: 'none',
                    cursor: 'pointer',
                  }}
                >
                  Search
                </button>
              </Row>
            </Row>
          </Stack>
        </form>
      </Card>

      {/* Requirements Table */}
      {requirements.length === 0 ? (
        <Card style={{ backgroundColor: 'var(--color-background)', borderRadius: 'var(--radius-4)', boxShadow: '0 1px 2px var(--color-shadow)', padding: 'var(--space-8)' }}>
          <Stack style={{ alignItems: 'center', gap: 'var(--space-4)' }}>
            <Text style={{ color: 'var(--color-10)', marginBottom: 'var(--space-4)' }}>No requirements found. Create your first requirement or load from templates.</Text>
            {onCreateNew && (
              <button
                onPress={onCreateNew}
                style={{
                  paddingLeft: 'var(--space-4)',
                  paddingRight: 'var(--space-4)',
                  paddingTop: 8,
                  paddingBottom: 8,
                  backgroundColor: 'var(--color-blue-9)',
                  color: 'white',
                  borderRadius: 'var(--radius-4)',
                  border: 'none',
                  cursor: 'pointer',
                }}
              >
                Create Requirement
              </button>
            )}
          </Stack>
        </Card>
      ) : (
        <Card style={{ backgroundColor: 'var(--color-background)', borderRadius: 'var(--radius-4)', boxShadow: '0 1px 2px var(--color-shadow)', overflow: 'hidden' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead style={{ backgroundColor: 'var(--color-gray-2)' }}>
              <tr>
                <th style={{ padding: '12px 24px', textAlign: 'left', fontSize: '12px', fontWeight: 500, color: 'var(--color-10)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                  Name
                </th>
                <th style={{ padding: '12px 24px', textAlign: 'left', fontSize: '12px', fontWeight: 500, color: 'var(--color-10)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                  Type
                </th>
                <th style={{ padding: '12px 24px', textAlign: 'left', fontSize: '12px', fontWeight: 500, color: 'var(--color-10)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                  Status
                </th>
                <th style={{ padding: '12px 24px', textAlign: 'left', fontSize: '12px', fontWeight: 500, color: 'var(--color-10)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                  Version
                </th>
                <th style={{ padding: '12px 24px', textAlign: 'left', fontSize: '12px', fontWeight: 500, color: 'var(--color-10)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                  Template
                </th>
                <th style={{ padding: '12px 24px', textAlign: 'right', fontSize: '12px', fontWeight: 500, color: 'var(--color-10)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                  Actions
                </th>
              </tr>
            </thead>
            <tbody style={{ backgroundColor: 'var(--color-background)' }}>
              {requirements.map((requirement) => (
                <tr
                  key={requirement.id}
                  style={{
                    cursor: 'pointer',
                    borderBottom: '1px solid var(--color-border)',
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.backgroundColor = 'var(--color-background-hover)';
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.backgroundColor = 'var(--color-background)';
                  }}
                  onPress={() => onViewRequirement?.(requirement)}
                >
                  <td style={{ padding: '16px 24px' }}>
                    <Text style={{ fontSize: 'var(--font-size-3)', fontWeight: 500, color: 'var(--color-12)' }}>{requirement.name}</Text>
                    {requirement.description && (
                      <Text style={{ fontSize: 'var(--font-size-3)', color: 'var(--color-10)', marginTop: 4, maxWidth: '28rem', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                        {requirement.description}
                      </Text>
                    )}
                  </td>
                  <td style={{ padding: '16px 24px', whiteSpace: 'nowrap' }}>
                    <Text style={{ fontSize: 'var(--font-size-3)', color: 'var(--color-12)' }}>{getTypeLabel(requirement.type)}</Text>
                  </td>
                  <td style={{ padding: '16px 24px', whiteSpace: 'nowrap' }}>
                    {getStatusBadge(requirement.status)}
                  </td>
                  <td style={{ padding: '16px 24px', whiteSpace: 'nowrap' }}>
                    <Text style={{ fontSize: 'var(--font-size-3)', color: 'var(--color-10)' }}>v{requirement.version}</Text>
                  </td>
                  <td style={{ padding: '16px 24px', whiteSpace: 'nowrap' }}>
                    <Text style={{ fontSize: 'var(--font-size-3)', color: 'var(--color-10)' }}>{requirement.is_template ? 'Yes' : 'No'}</Text>
                  </td>
                  <td style={{ padding: '16px 24px', whiteSpace: 'nowrap', textAlign: 'right' }}>
                    <Row style={{ alignItems: 'center', justifyContent: 'flex-end', gap: 'var(--space-2)' }}>
                      {onEditRequirement && (
                        <button
                          onPress={(e) => {
                            e.stopPropagation();
                            onEditRequirement(requirement);
                          }}
                          style={{
                            color: 'var(--color-blue-10)',
                            background: 'transparent',
                            border: 'none',
                            fontSize: '14px',
                            fontWeight: 500,
                            cursor: 'pointer',
                            padding: '4px 8px',
                          }}
                        >
                          Edit
                        </button>
                      )}
                      {onCloneRequirement && (
                        <button
                          onPress={(e) => {
                            e.stopPropagation();
                            onCloneRequirement(requirement);
                          }}
                          style={{
                            color: 'var(--color-green-10)',
                            background: 'transparent',
                            border: 'none',
                            fontSize: '14px',
                            fontWeight: 500,
                            cursor: 'pointer',
                            padding: '4px 8px',
                          }}
                        >
                          Clone
                        </button>
                      )}
                      {requirement.status !== RequirementStatus.ARCHIVED && (
                        <button
                          onPress={(e) => {
                            e.stopPropagation();
                            handleDelete(requirement);
                          }}
                          style={{
                            color: 'var(--color-red-10)',
                            background: 'transparent',
                            border: 'none',
                            fontSize: '14px',
                            fontWeight: 500,
                            cursor: 'pointer',
                            padding: '4px 8px',
                          }}
                        >
                          Archive
                        </button>
                      )}
                    </Row>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>

          {/* Pagination */}
          {totalPages > 1 && (
            <Row
              style={{
                backgroundColor: 'var(--color-gray-2)',
                paddingLeft: 'var(--space-6)',
                paddingRight: 'var(--space-6)',
                paddingTop: 'var(--space-3)',
                paddingBottom: 'var(--space-3)',
                alignItems: 'center',
                justifyContent: 'space-between',
                borderTopWidth: 1,
                borderTopStyle: 'solid',
                borderColor: 'var(--color-border)',
              }}
            >
              <Text style={{ fontSize: 'var(--font-size-3)', color: 'var(--color-11)' }}>
                Page {page} of {totalPages}
              </Text>
              <Row style={{ gap: 'var(--space-2)' }}>
                <button
                  onPress={() => setPage(Math.max(1, page - 1))}
                  disabled={page === 1}
                  style={{
                    paddingLeft: 'var(--space-3)',
                    paddingRight: 'var(--space-3)',
                    paddingTop: 4,
                    paddingBottom: 4,
                    borderWidth: 1,
                    borderStyle: 'solid',
                    borderColor: 'var(--color-border)',
                    borderRadius: 'var(--radius-4)',
                    fontSize: 'var(--font-size-3)',
                    fontWeight: 500,
                    color: 'var(--color-11)',
                    backgroundColor: 'transparent',
                    cursor: page === 1 ? 'not-allowed' : 'pointer',
                    opacity: page === 1 ? 0.5 : 1,
                  }}
                >
                  Previous
                </button>
                <button
                  onPress={() => setPage(Math.min(totalPages, page + 1))}
                  disabled={page === totalPages}
                  style={{
                    paddingLeft: 'var(--space-3)',
                    paddingRight: 'var(--space-3)',
                    paddingTop: 4,
                    paddingBottom: 4,
                    borderWidth: 1,
                    borderStyle: 'solid',
                    borderColor: 'var(--color-border)',
                    borderRadius: 'var(--radius-4)',
                    fontSize: 'var(--font-size-3)',
                    fontWeight: 500,
                    color: 'var(--color-11)',
                    backgroundColor: 'transparent',
                    cursor: page === totalPages ? 'not-allowed' : 'pointer',
                    opacity: page === totalPages ? 0.5 : 1,
                  }}
                >
                  Next
                </button>
              </Row>
            </Row>
          )}
        </Card>
      )}
    </Stack>
  );
}
