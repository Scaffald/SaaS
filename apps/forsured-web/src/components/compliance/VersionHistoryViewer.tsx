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
} from 'lucide-react';
import { YStack, XStack, Text, Button, Card, H3, H4, Spinner } from '@unicornlove/ui';
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
      padding="$4"
      borderColor={isSelected ? '$blue9' : '$borderColor'}
      backgroundColor={isSelected ? '$blue2' : '$background'}
      borderRadius="$4"
      hoverStyle={{ borderColor: '$blue7' }}
    >
      <XStack alignItems="flex-start" justifyContent="space-between">
        <YStack flex={1}>
          <XStack alignItems="center" gap="$2">
            <Text fontWeight="500" color="$color12">
              Version {version.version}
            </Text>
            {version.version === 1 && (
              <Text
                paddingHorizontal="$1.5"
                paddingVertical="$1"
                fontSize="$2"
                backgroundColor="$green3"
                color="$green10"
                borderRadius="$2"
              >
                Initial
              </Text>
            )}
          </XStack>
          {version.change_summary && (
            <Text fontSize="$3" color="$color11" mt="$1">{version.change_summary}</Text>
          )}
          <XStack alignItems="center" gap="$4" mt="$2">
            <XStack alignItems="center" gap="$1">
              <Clock size={12} />
              <Text fontSize="$2" color="$color10">{formatDate(version.changed_at)}</Text>
            </XStack>
            {version.changed_by && (
              <XStack alignItems="center" gap="$1">
                <User size={12} />
                <Text fontSize="$2" color="$color10">{version.changed_by}</Text>
              </XStack>
            )}
          </XStack>
        </YStack>

        <XStack alignItems="center" gap="$2">
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
        </XStack>
      </XStack>
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
    <Card borderColor="$borderColor" borderRadius="$4" overflow="hidden">
      {/* Header */}
      <XStack alignItems="center" justifyContent="space-between" padding="$4" backgroundColor="$gray2" borderBottomWidth={1} borderColor="$borderColor">
        <XStack alignItems="center" gap="$4">
          <XStack alignItems="center" gap="$2">
            <GitCompare size={18} color="var(--color10)" />
            <Text fontWeight="500" color="$color12">
              Version {comparison.from_version.version} → Version{' '}
              {comparison.to_version.version}
            </Text>
          </XStack>
        </XStack>

        <XStack alignItems="center" gap="$3">
          {changeStats.added > 0 && (
            <XStack alignItems="center" gap="$1">
              <Plus size={12} color="var(--green9)" />
              <Text fontSize="$2" color="$green9">
                {changeStats.added} added
              </Text>
            </XStack>
          )}
          {changeStats.removed > 0 && (
            <XStack alignItems="center" gap="$1">
              <Minus size={12} color="var(--red9)" />
              <Text fontSize="$2" color="$red9">
                {changeStats.removed} removed
              </Text>
            </XStack>
          )}
          {changeStats.modified > 0 && (
            <XStack alignItems="center" gap="$1">
              <Edit3 size={12} color="var(--yellow9)" />
              <Text fontSize="$2" color="$yellow9">
                {changeStats.modified} modified
              </Text>
            </XStack>
          )}
        </XStack>
      </XStack>

      {/* Changes list */}
      <YStack>
        {sortedChanges.map((change, idx) => {
          const isExpanded = expandedFields.has(change.field);
          const hasLongValue =
            formatValue(change.oldValue).length > 50 ||
            formatValue(change.newValue).length > 50;

          return (
            <YStack key={change.field} backgroundColor="$background" borderTopWidth={idx > 0 ? 1 : 0} borderColor="$borderColor">
              {/* Field header */}
              <Button
                unstyled
                width="100%"
                flexDirection="row"
                alignItems="center"
                justifyContent="space-between"
                padding="$3"
                hoverStyle={{ backgroundColor: '$gray2' }}
                onPress={() => toggleField(change.field)}
              >
                <XStack alignItems="center" gap="$3">
                  {/* Change type icon */}
                  {change.type === 'added' && (
                    <Plus size={16} color="var(--green9)" />
                  )}
                  {change.type === 'removed' && (
                    <Minus size={16} color="var(--red9)" />
                  )}
                  {change.type === 'modified' && (
                    <Edit3 size={16} color="var(--yellow9)" />
                  )}
                  {change.type === 'unchanged' && (
                    <Text width={16} height={16} color="$color10">—</Text>
                  )}

                  <Text
                    fontWeight="500"
                    color={change.type === 'unchanged' ? '$color10' : '$color12'}
                  >
                    {formatFieldName(change.field)}
                  </Text>
                </XStack>

                {(hasLongValue || change.type !== 'unchanged') && (
                  isExpanded ? (
                    <ChevronUp size={16} color="var(--color10)" />
                  ) : (
                    <ChevronDown size={16} color="var(--color10)" />
                  )
                )}
              </Button>

              {/* Expanded diff content */}
              {isExpanded && change.type !== 'unchanged' && (
                <XStack borderTopWidth={1} borderColor="$borderColor">
                  {/* Old value */}
                  <YStack flex={1} padding="$3" backgroundColor="rgba(239, 68, 68, 0.1)" borderRightWidth={1} borderColor="$borderColor">
                    <Text fontSize="$2" fontWeight="500" color="$red10" mb="$2">
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
                  </YStack>

                  {/* New value */}
                  <YStack flex={1} padding="$3" backgroundColor="rgba(16, 185, 129, 0.1)">
                    <Text fontSize="$2" fontWeight="500" color="$green10" mb="$2">
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
                  </YStack>
                </XStack>
              )}
            </YStack>
          );
        })}
      </YStack>

      {/* No changes message */}
      {sortedChanges.every((c) => c.type === 'unchanged') && (
        <YStack padding="$8" alignItems="center">
          <Text color="$color11">No differences between these versions</Text>
        </YStack>
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
      <YStack alignItems="center" justifyContent="center" height={256}>
        <Spinner size="large" color="$blue9" />
      </YStack>
    );
  }

  // Error state
  if (historyError) {
    return (
      <YStack
        alignItems="center"
        justifyContent="center"
        height={256}
        backgroundColor="$red2"
        borderRadius="$4"
        borderColor="$red5"
        borderWidth={1}
      >
        <AlertCircle color="var(--red9)" mb="$2" size={32} />
        <Text color="$red10" fontWeight="500">Failed to load version history</Text>
        <Text color="$red9" fontSize="$3" mt="$1">{historyError.message}</Text>
      </YStack>
    );
  }

  const versions = historyData?.versions ?? [];
  const pagination = historyData?.pagination;

  return (
    <YStack gap="$4">
      {/* Header */}
      <XStack alignItems="center" justifyContent="space-between">
        <XStack alignItems="center" gap="$2">
          <History size={20} color="var(--color10)" />
          <H3 fontWeight="500" color="$color12">Version History</H3>
          {pagination && (
            <Text fontSize="$3" color="$color10">
              ({pagination.total} version{pagination.total !== 1 ? 's' : ''})
            </Text>
          )}
        </XStack>

        <Button
          variant={isCompareMode ? 'solid' : 'outlined'}
          size="$3"
          onPress={toggleCompareMode}
        >
          <GitCompare size={16} style={{ marginRight: '4px' }} />
          {isCompareMode ? 'Exit Compare' : 'Compare'}
        </Button>
      </XStack>

      {/* Compare mode instructions */}
      {isCompareMode && (
        <Card padding="$3" backgroundColor="$blue2" borderColor="$blue5" borderRadius="$4">
          <Text fontSize="$3" color="$blue10">
            Select a &quot;From&quot; and &quot;To&quot; version to compare changes
            {selectedFrom && selectedTo && ' - viewing comparison below'}
          </Text>
        </Card>
      )}

      {/* Comparison view */}
      {isCompareMode && selectedFrom && selectedTo && (
        <YStack mb="$4">
          {isLoadingComparison ? (
            <YStack alignItems="center" justifyContent="center" height={128} backgroundColor="$gray2" borderRadius="$4">
              <Spinner size="small" color="$blue9" />
            </YStack>
          ) : comparisonData ? (
            <DiffView comparison={comparisonData as VersionComparison} />
          ) : null}
        </YStack>
      )}

      {/* Version list */}
      <YStack gap="$2">
        {versions.length === 0 ? (
          <YStack padding="$8" alignItems="center" backgroundColor="$gray2" borderRadius="$4">
            <Text color="$color11">No version history available</Text>
          </YStack>
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
      </YStack>

      {/* Pagination */}
      {pagination && pagination.totalPages > 1 && (
        <XStack alignItems="center" justifyContent="center" gap="$2" paddingTop="$4">
          <Button
            variant="outlined"
            size="$3"
            onPress={() => setPage((p) => Math.max(1, p - 1))}
            disabled={page === 1}
          >
            Previous
          </Button>
          <Text fontSize="$3" color="$color11">
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
        </XStack>
      )}
    </YStack>
  );
}

export default VersionHistoryViewer;
