/**
 * Version History Viewer
 * REQ-2, TASK-16: Version history with side-by-side diff view
 *
 * Features:
 * - List of version history entries with metadata
 * - Version selection for comparison
 * - Side-by-side diff view showing field-level changes
 * - Visual indicators for added/removed/modified content
 * - Restore version functionality
 */

import { useState, useCallback, useMemo } from 'react';
import {
  History,
  GitCompare,
  ChevronDown,
  ChevronUp,
  RotateCcw,
  Clock,
  User,
  AlertCircle,
  Plus,
  Minus,
  Edit3,
  Loader2,
} from 'lucide-react';
import { Stack, Row, Text, Button, Card } from '@unicornlove/beyond-ui';
import { trpc } from '../../lib/trpc';

// =============================================================================
// Types
// =============================================================================

interface VersionHistoryViewerProps {
  organizationId: string;
  requirementId: string;
  onRestore?: () => void;
}

interface VersionEntry {
  id: string;
  requirement_id: string;
  version: number;
  snapshot: Record<string, unknown>;
  change_summary: string | null;
  changed_by: string | null;
  changed_at: string;
  parent_version_id: string | null;
}

interface FieldChange {
  field: string;
  type: 'added' | 'removed' | 'modified' | 'unchanged';
  oldValue: unknown;
  newValue: unknown;
}

interface VersionComparison {
  from_version: {
    version: number;
    changed_at: string;
    change_summary: string | null;
  };
  to_version: {
    version: number;
    changed_at: string;
    change_summary: string | null;
  };
  changes: FieldChange[];
}

// =============================================================================
// Helper Functions
// =============================================================================

function formatDate(dateString: string): string {
  return new Date(dateString).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

function formatValue(value: unknown): string {
  if (value === null || value === undefined) {
    return '(empty)';
  }
  if (typeof value === 'object') {
    return JSON.stringify(value, null, 2);
  }
  return String(value);
}

function formatFieldName(field: string): string {
  return field
    .replace(/_/g, ' ')
    .replace(/([A-Z])/g, ' $1')
    .replace(/^./, (str) => str.toUpperCase())
    .trim();
}

// =============================================================================
// Components
// =============================================================================

interface VersionListItemProps {
  version: VersionEntry;
  isSelected: boolean;
  selectionMode: 'from' | 'to' | null;
  selectedFrom: number | null;
  selectedTo: number | null;
  onSelect: (version: number, mode: 'from' | 'to') => void;
  onRestore: (version: number) => void;
  isRestoring: boolean;
}

function VersionListItem({
  version,
  isSelected,
  selectionMode,
  selectedFrom,
  selectedTo,
  onSelect,
  onRestore,
  isRestoring,
}: VersionListItemProps) {
  const isFromSelected = selectedFrom === version.version;
  const isToSelected = selectedTo === version.version;

  return (
    <Card
      style={{
        padding: 'var(--space-4)',
        borderColor: isSelected ? 'var(--color-blue-9)' : 'var(--color-border)',
        backgroundColor: isSelected ? 'var(--color-blue-2)' : 'var(--color-background)',
        borderRadius: 'var(--radius-4)',
      }}
    >
      <Row style={{ alignItems: 'flex-start', justifyContent: 'space-between' }}>
        <Stack style={{ flex: 1 }}>
          <Row style={{ alignItems: 'center', gap: 8 }}>
            <Text style={{ fontWeight: 500, color: 'var(--color-12)' }}>
              Version {version.version}
            </Text>
            {version.version === 1 && (
              <Text
                style={{
                  paddingLeft: 6,
                  paddingRight: 6,
                  paddingTop: 4,
                  paddingBottom: 4,
                  fontSize: 'var(--font-size-2)',
                  backgroundColor: 'var(--color-green-3)',
                  color: 'var(--color-green-10)',
                  borderRadius: 'var(--radius-2)',
                }}
              >
                Initial
              </Text>
            )}
          </Row>
          {version.change_summary && (
            <Text style={{ fontSize: 'var(--font-size-3)', color: 'var(--color-11)', marginTop: 4 }}>{version.change_summary}</Text>
          )}
          <Row style={{ alignItems: 'center', gap: 'var(--space-4)', marginTop: 8 }}>
            <Row style={{ alignItems: 'center', gap: 4 }}>
              <Clock size={12} />
              <Text style={{ fontSize: 'var(--font-size-2)', color: 'var(--color-10)' }}>{formatDate(version.changed_at)}</Text>
            </Row>
            {version.changed_by && (
              <Row style={{ alignItems: 'center', gap: 4 }}>
                <User size={12} />
                <Text style={{ fontSize: 'var(--font-size-2)', color: 'var(--color-10)' }}>{version.changed_by}</Text>
              </Row>
            )}
          </Row>
        </Stack>

        <Row style={{ alignItems: 'center', gap: 8 }}>
          {/* Compare selection buttons */}
          {selectionMode && (
            <>
              <Button
                variant={isFromSelected ? 'solid' : 'outlined'}
                size="$2"
                onPress={() => onSelect(version.version, 'from')}
                disabled={isToSelected}
              >
                From
              </Button>
              <Button
                variant={isToSelected ? 'solid' : 'outlined'}
                size="$2"
                onPress={() => onSelect(version.version, 'to')}
                disabled={isFromSelected}
              >
                To
              </Button>
            </>
          )}

          {/* Restore button (not for current version) */}
          {version.version > 1 && !selectionMode && (
            <Button
              variant="outlined"
              size="$2"
              onPress={() => onRestore(version.version)}
              disabled={isRestoring}
              title="Restore this version"
            >
              <RotateCcw size={14} />
            </Button>
          )}
        </Row>
      </Row>
    </Card>
  );
}

interface DiffViewProps {
  comparison: VersionComparison;
}

function DiffView({ comparison }: DiffViewProps) {
  const [expandedFields, setExpandedFields] = useState<Set<string>>(new Set());

  const toggleField = useCallback((field: string) => {
    setExpandedFields((prev) => {
      const next = new Set(prev);
      if (next.has(field)) {
        next.delete(field);
      } else {
        next.add(field);
      }
      return next;
    });
  }, []);

  const sortedChanges = useMemo(() => {
    return [...comparison.changes].sort((a, b) => {
      // Show changes first, then unchanged
      if (a.type === 'unchanged' && b.type !== 'unchanged') return 1;
      if (a.type !== 'unchanged' && b.type === 'unchanged') return -1;
      return a.field.localeCompare(b.field);
    });
  }, [comparison.changes]);

  const changeStats = useMemo(() => {
    return {
      added: comparison.changes.filter((c) => c.type === 'added').length,
      removed: comparison.changes.filter((c) => c.type === 'removed').length,
      modified: comparison.changes.filter((c) => c.type === 'modified').length,
    };
  }, [comparison.changes]);

  return (
    <Card style={{ borderColor: 'var(--color-border)', borderRadius: 'var(--radius-4)', overflow: 'hidden' }}>
      {/* Header */}
      <Row style={{ alignItems: 'center', justifyContent: 'space-between', padding: 'var(--space-4)', backgroundColor: 'var(--color-gray-2)', borderBottomWidth: 1, borderBottomStyle: 'solid', borderColor: 'var(--color-border)' }}>
        <Row style={{ alignItems: 'center', gap: 'var(--space-4)' }}>
          <Row style={{ alignItems: 'center', gap: 8 }}>
            <GitCompare size={18} style={{ color: 'var(--color-10)' }} />
            <Text style={{ fontWeight: 500, color: 'var(--color-12)' }}>
              Version {comparison.from_version.version} to Version{' '}
              {comparison.to_version.version}
            </Text>
          </Row>
        </Row>

        <Row style={{ alignItems: 'center', gap: 'var(--space-3)' }}>
          {changeStats.added > 0 && (
            <Row style={{ alignItems: 'center', gap: 4 }}>
              <Plus size={12} style={{ color: 'var(--color-green-9)' }} />
              <Text style={{ fontSize: 'var(--font-size-2)', color: 'var(--color-green-9)' }}>
                {changeStats.added} added
              </Text>
            </Row>
          )}
          {changeStats.removed > 0 && (
            <Row style={{ alignItems: 'center', gap: 4 }}>
              <Minus size={12} style={{ color: 'var(--color-red-9)' }} />
              <Text style={{ fontSize: 'var(--font-size-2)', color: 'var(--color-red-9)' }}>
                {changeStats.removed} removed
              </Text>
            </Row>
          )}
          {changeStats.modified > 0 && (
            <Row style={{ alignItems: 'center', gap: 4 }}>
              <Edit3 size={12} style={{ color: 'var(--color-yellow-9)' }} />
              <Text style={{ fontSize: 'var(--font-size-2)', color: 'var(--color-yellow-9)' }}>
                {changeStats.modified} modified
              </Text>
            </Row>
          )}
        </Row>
      </Row>

      {/* Changes list */}
      <Stack>
        {sortedChanges.map((change, idx) => {
          const isExpanded = expandedFields.has(change.field);
          const hasLongValue =
            formatValue(change.oldValue).length > 50 ||
            formatValue(change.newValue).length > 50;

          return (
            <Stack key={change.field} style={{ backgroundColor: 'var(--color-background)', borderTopWidth: idx > 0 ? 1 : 0, borderTopStyle: 'solid', borderColor: 'var(--color-border)' }}>
              {/* Field header */}
              <button
                style={{
                  width: '100%',
                  display: 'flex',
                  flexDirection: 'row',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  padding: 'var(--space-3)',
                  background: 'transparent',
                  border: 'none',
                  cursor: 'pointer',
                }}
                onClick={() => toggleField(change.field)}
              >
                <Row style={{ alignItems: 'center', gap: 'var(--space-3)' }}>
                  {/* Change type icon */}
                  {change.type === 'added' && (
                    <Plus size={16} style={{ color: 'var(--color-green-9)' }} />
                  )}
                  {change.type === 'removed' && (
                    <Minus size={16} style={{ color: 'var(--color-red-9)' }} />
                  )}
                  {change.type === 'modified' && (
                    <Edit3 size={16} style={{ color: 'var(--color-yellow-9)' }} />
                  )}
                  {change.type === 'unchanged' && (
                    <Text style={{ width: 16, height: 16, color: 'var(--color-10)' }}>-</Text>
                  )}

                  <Text
                    style={{
                      fontWeight: 500,
                      color: change.type === 'unchanged' ? 'var(--color-10)' : 'var(--color-12)',
                    }}
                  >
                    {formatFieldName(change.field)}
                  </Text>
                </Row>

                {(hasLongValue || change.type !== 'unchanged') && (
                  isExpanded ? (
                    <ChevronUp size={16} style={{ color: 'var(--color-10)' }} />
                  ) : (
                    <ChevronDown size={16} style={{ color: 'var(--color-10)' }} />
                  )
                )}
              </button>

              {/* Expanded diff content */}
              {isExpanded && change.type !== 'unchanged' && (
                <Row style={{ borderTopWidth: 1, borderTopStyle: 'solid', borderColor: 'var(--color-border)' }}>
                  {/* Old value */}
                  <Stack style={{ flex: 1, padding: 'var(--space-3)', backgroundColor: 'rgba(239, 68, 68, 0.1)', borderRightWidth: 1, borderRightStyle: 'solid', borderColor: 'var(--color-border)' }}>
                    <Text style={{ fontSize: 'var(--font-size-2)', fontWeight: 500, color: 'var(--color-red-10)', marginBottom: 8 }}>
                      Version {comparison.from_version.version}
                    </Text>
                    <pre style={{
                      fontSize: '14px',
                      color: '#991B1B',
                      whiteSpace: 'pre-wrap',
                      fontFamily: 'monospace',
                      margin: 0,
                    }}>
                      {change.type === 'added'
                        ? '(not present)'
                        : formatValue(change.oldValue)}
                    </pre>
                  </Stack>

                  {/* New value */}
                  <Stack style={{ flex: 1, padding: 'var(--space-3)', backgroundColor: 'rgba(16, 185, 129, 0.1)' }}>
                    <Text style={{ fontSize: 'var(--font-size-2)', fontWeight: 500, color: 'var(--color-green-10)', marginBottom: 8 }}>
                      Version {comparison.to_version.version}
                    </Text>
                    <pre style={{
                      fontSize: '14px',
                      color: '#065F46',
                      whiteSpace: 'pre-wrap',
                      fontFamily: 'monospace',
                      margin: 0,
                    }}>
                      {change.type === 'removed'
                        ? '(removed)'
                        : formatValue(change.newValue)}
                    </pre>
                  </Stack>
                </Row>
              )}
            </Stack>
          );
        })}
      </Stack>

      {/* No changes message */}
      {sortedChanges.every((c) => c.type === 'unchanged') && (
        <Stack style={{ padding: 'var(--space-8)', alignItems: 'center' }}>
          <Text style={{ color: 'var(--color-11)' }}>No differences between these versions</Text>
        </Stack>
      )}
    </Card>
  );
}

// =============================================================================
// Main Component
// =============================================================================

export function VersionHistoryViewer({
  organizationId,
  requirementId,
  onRestore,
}: VersionHistoryViewerProps) {
  const [page, setPage] = useState(1);
  const [isCompareMode, setIsCompareMode] = useState(false);
  const [selectedFrom, setSelectedFrom] = useState<number | null>(null);
  const [selectedTo, setSelectedTo] = useState<number | null>(null);

  // Fetch version history
  const {
    data: historyData,
    isLoading: isLoadingHistory,
    error: historyError,
  } = trpc.complianceRequirements.listVersions.useQuery(
    {
      organizationId,
      requirementId,
      page,
      pageSize: 10,
    },
    {
      enabled: !!organizationId && !!requirementId,
    }
  );

  // Fetch comparison when both versions selected
  const {
    data: comparisonData,
    isLoading: isLoadingComparison,
  } = trpc.complianceRequirements.compareVersions.useQuery(
    {
      organizationId,
      requirementId,
      fromVersionNumber: selectedFrom!,
      toVersionNumber: selectedTo!,
    },
    {
      enabled: !!organizationId && !!requirementId && !!selectedFrom && !!selectedTo,
    }
  );

  // Restore mutation
  const restoreMutation = trpc.complianceRequirements.restoreVersion.useMutation({
    onSuccess: () => {
      onRestore?.();
    },
  });

  // Handle version selection for comparison
  const handleVersionSelect = useCallback((version: number, mode: 'from' | 'to') => {
    if (mode === 'from') {
      setSelectedFrom((prev) => (prev === version ? null : version));
    } else {
      setSelectedTo((prev) => (prev === version ? null : version));
    }
  }, []);

  // Handle restore
  const handleRestore = useCallback(
    async (versionNumber: number) => {
      if (!confirm(`Are you sure you want to restore to version ${versionNumber}? This will create a new version.`)) {
        return;
      }

      await restoreMutation.mutateAsync({
        organizationId,
        requirementId,
        versionNumber,
        change_summary: `Restored from version ${versionNumber}`,
      });
    },
    [organizationId, requirementId, restoreMutation]
  );

  // Toggle compare mode
  const toggleCompareMode = useCallback(() => {
    setIsCompareMode((prev) => {
      if (prev) {
        // Exiting compare mode, clear selections
        setSelectedFrom(null);
        setSelectedTo(null);
      }
      return !prev;
    });
  }, []);

  // Loading state
  if (isLoadingHistory) {
    return (
      <Stack style={{ alignItems: 'center', justifyContent: 'center', height: 256 }}>
        <Loader2 className="animate-spin" style={{ width: 32, height: 32, color: 'var(--color-blue-9)' }} />
      </Stack>
    );
  }

  // Error state
  if (historyError) {
    return (
      <Stack
        style={{
          alignItems: 'center',
          justifyContent: 'center',
          height: 256,
          backgroundColor: 'var(--color-red-2)',
          borderRadius: 'var(--radius-4)',
          borderColor: 'var(--color-red-5)',
          borderWidth: 1,
          borderStyle: 'solid',
        }}
      >
        <AlertCircle style={{ color: 'var(--color-red-9)', marginBottom: 8 }} size={32} />
        <Text style={{ color: 'var(--color-red-10)', fontWeight: 500 }}>Failed to load version history</Text>
        <Text style={{ color: 'var(--color-red-9)', fontSize: 'var(--font-size-3)', marginTop: 4 }}>{historyError.message}</Text>
      </Stack>
    );
  }

  const versions = historyData?.versions ?? [];
  const pagination = historyData?.pagination;

  return (
    <Stack style={{ gap: 'var(--space-4)' }}>
      {/* Header */}
      <Row style={{ alignItems: 'center', justifyContent: 'space-between' }}>
        <Row style={{ alignItems: 'center', gap: 8 }}>
          <History size={20} style={{ color: 'var(--color-10)' }} />
          <h3 style={{ fontWeight: 500, color: 'var(--color-12)', margin: 0 }}>Version History</h3>
          {pagination && (
            <Text style={{ fontSize: 'var(--font-size-3)', color: 'var(--color-10)' }}>
              ({pagination.total} version{pagination.total !== 1 ? 's' : ''})
            </Text>
          )}
        </Row>

        <Button
          variant={isCompareMode ? 'solid' : 'outlined'}
          size="$3"
          onPress={toggleCompareMode}
        >
          <Row style={{ alignItems: 'center', gap: 4 }}>
            <GitCompare size={16} />
            {isCompareMode ? 'Exit Compare' : 'Compare'}
          </Row>
        </Button>
      </Row>

      {/* Compare mode instructions */}
      {isCompareMode && (
        <Card style={{ padding: 'var(--space-3)', backgroundColor: 'var(--color-blue-2)', borderColor: 'var(--color-blue-5)', borderRadius: 'var(--radius-4)' }}>
          <Text style={{ fontSize: 'var(--font-size-3)', color: 'var(--color-blue-10)' }}>
            Select a "From" and "To" version to compare changes
            {selectedFrom && selectedTo && ' - viewing comparison below'}
          </Text>
        </Card>
      )}

      {/* Comparison view */}
      {isCompareMode && selectedFrom && selectedTo && (
        <Stack style={{ marginBottom: 'var(--space-4)' }}>
          {isLoadingComparison ? (
            <Stack style={{ alignItems: 'center', justifyContent: 'center', height: 128, backgroundColor: 'var(--color-gray-2)', borderRadius: 'var(--radius-4)' }}>
              <Loader2 className="animate-spin" style={{ width: 20, height: 20, color: 'var(--color-blue-9)' }} />
            </Stack>
          ) : comparisonData ? (
            <DiffView comparison={comparisonData as VersionComparison} />
          ) : null}
        </Stack>
      )}

      {/* Version list */}
      <Stack style={{ gap: 8 }}>
        {versions.length === 0 ? (
          <Stack style={{ padding: 'var(--space-8)', alignItems: 'center', backgroundColor: 'var(--color-gray-2)', borderRadius: 'var(--radius-4)' }}>
            <Text style={{ color: 'var(--color-11)' }}>No version history available</Text>
          </Stack>
        ) : (
          versions.map((version) => (
            <VersionListItem
              key={version.id}
              version={version as VersionEntry}
              isSelected={
                selectedFrom === version.version || selectedTo === version.version
              }
              selectionMode={isCompareMode ? 'from' : null}
              selectedFrom={selectedFrom}
              selectedTo={selectedTo}
              onSelect={handleVersionSelect}
              onRestore={handleRestore}
              isRestoring={restoreMutation.isLoading}
            />
          ))
        )}
      </Stack>

      {/* Pagination */}
      {pagination && pagination.totalPages > 1 && (
        <Row style={{ alignItems: 'center', justifyContent: 'center', gap: 8, paddingTop: 'var(--space-4)' }}>
          <Button
            variant="outlined"
            size="$3"
            onPress={() => setPage((p) => Math.max(1, p - 1))}
            disabled={page === 1}
          >
            Previous
          </Button>
          <Text style={{ fontSize: 'var(--font-size-3)', color: 'var(--color-11)' }}>
            Page {page} of {pagination.totalPages}
          </Text>
          <Button
            variant="outlined"
            size="$3"
            onPress={() => setPage((p) => Math.min(pagination.totalPages, p + 1))}
            disabled={page === pagination.totalPages}
          >
            Next
          </Button>
        </Row>
      )}
    </Stack>
  );
}

export default VersionHistoryViewer;
