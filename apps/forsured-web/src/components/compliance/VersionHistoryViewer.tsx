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
import { trpc } from '../../lib/trpc';
import Button from '../Common/Button';

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
    <div
      className={`p-4 border rounded-lg transition-colors ${
        isSelected
          ? 'border-primary-500 bg-primary-50'
          : 'border-border bg-surface hover:border-primary-200'
      }`}
    >
      <div className="flex items-start justify-between">
        <div className="flex-1">
          <div className="flex items-center gap-2">
            <span className="font-medium text-text-primary">
              Version {version.version}
            </span>
            {version.version === 1 && (
              <span className="px-1.5 py-0.5 text-xs bg-success-100 text-success-700 rounded">
                Initial
              </span>
            )}
          </div>
          {version.change_summary && (
            <p className="text-sm text-text-secondary mt-1">{version.change_summary}</p>
          )}
          <div className="flex items-center gap-4 mt-2 text-xs text-text-tertiary">
            <span className="flex items-center gap-1">
              <Clock size={12} />
              {formatDate(version.changed_at)}
            </span>
            {version.changed_by && (
              <span className="flex items-center gap-1">
                <User size={12} />
                {version.changed_by}
              </span>
            )}
          </div>
        </div>

        <div className="flex items-center gap-2">
          {/* Compare selection buttons */}
          {selectionMode && (
            <>
              <Button
                variant={isFromSelected ? 'primary' : 'secondary'}
                size="xs"
                onClick={() => onSelect(version.version, 'from')}
                disabled={isToSelected}
              >
                From
              </Button>
              <Button
                variant={isToSelected ? 'primary' : 'secondary'}
                size="xs"
                onClick={() => onSelect(version.version, 'to')}
                disabled={isFromSelected}
              >
                To
              </Button>
            </>
          )}

          {/* Restore button (not for current version) */}
          {version.version > 1 && !selectionMode && (
            <Button
              variant="secondary"
              size="xs"
              onClick={() => onRestore(version.version)}
              disabled={isRestoring}
              title="Restore this version"
            >
              <RotateCcw size={14} />
            </Button>
          )}
        </div>
      </div>
    </div>
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
    <div className="border border-border rounded-lg overflow-hidden">
      {/* Header */}
      <div className="flex items-center justify-between p-4 bg-bg-secondary border-b border-border">
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2">
            <GitCompare size={18} className="text-text-tertiary" />
            <span className="font-medium text-text-primary">
              Version {comparison.from_version.version} → Version{' '}
              {comparison.to_version.version}
            </span>
          </div>
        </div>

        <div className="flex items-center gap-3 text-xs">
          {changeStats.added > 0 && (
            <span className="flex items-center gap-1 text-success-600">
              <Plus size={12} />
              {changeStats.added} added
            </span>
          )}
          {changeStats.removed > 0 && (
            <span className="flex items-center gap-1 text-error-600">
              <Minus size={12} />
              {changeStats.removed} removed
            </span>
          )}
          {changeStats.modified > 0 && (
            <span className="flex items-center gap-1 text-warning-600">
              <Edit3 size={12} />
              {changeStats.modified} modified
            </span>
          )}
        </div>
      </div>

      {/* Changes list */}
      <div className="divide-y divide-border">
        {sortedChanges.map((change) => {
          const isExpanded = expandedFields.has(change.field);
          const hasLongValue =
            formatValue(change.oldValue).length > 50 ||
            formatValue(change.newValue).length > 50;

          return (
            <div key={change.field} className="bg-surface">
              {/* Field header */}
              <button
                type="button"
                onClick={() => toggleField(change.field)}
                className="w-full flex items-center justify-between p-3 hover:bg-bg-secondary transition-colors"
              >
                <div className="flex items-center gap-3">
                  {/* Change type icon */}
                  {change.type === 'added' && (
                    <Plus size={16} className="text-success-600" />
                  )}
                  {change.type === 'removed' && (
                    <Minus size={16} className="text-error-600" />
                  )}
                  {change.type === 'modified' && (
                    <Edit3 size={16} className="text-warning-600" />
                  )}
                  {change.type === 'unchanged' && (
                    <span className="w-4 h-4 text-text-tertiary">—</span>
                  )}

                  <span
                    className={`font-medium ${
                      change.type === 'unchanged'
                        ? 'text-text-tertiary'
                        : 'text-text-primary'
                    }`}
                  >
                    {formatFieldName(change.field)}
                  </span>
                </div>

                {(hasLongValue || change.type !== 'unchanged') && (
                  isExpanded ? (
                    <ChevronUp size={16} className="text-text-tertiary" />
                  ) : (
                    <ChevronDown size={16} className="text-text-tertiary" />
                  )
                )}
              </button>

              {/* Expanded diff content */}
              {isExpanded && change.type !== 'unchanged' && (
                <div className="grid grid-cols-2 gap-0 border-t border-border">
                  {/* Old value */}
                  <div className="p-3 bg-error-50/50 border-r border-border">
                    <span className="text-xs font-medium text-error-700 mb-2 block">
                      Version {comparison.from_version.version}
                    </span>
                    <pre className="text-sm text-error-800 whitespace-pre-wrap font-mono">
                      {change.type === 'added'
                        ? '(not present)'
                        : formatValue(change.oldValue)}
                    </pre>
                  </div>

                  {/* New value */}
                  <div className="p-3 bg-success-50/50">
                    <span className="text-xs font-medium text-success-700 mb-2 block">
                      Version {comparison.to_version.version}
                    </span>
                    <pre className="text-sm text-success-800 whitespace-pre-wrap font-mono">
                      {change.type === 'removed'
                        ? '(removed)'
                        : formatValue(change.newValue)}
                    </pre>
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* No changes message */}
      {sortedChanges.every((c) => c.type === 'unchanged') && (
        <div className="p-8 text-center">
          <p className="text-text-secondary">No differences between these versions</p>
        </div>
      )}
    </div>
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
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-500" />
      </div>
    );
  }

  // Error state
  if (historyError) {
    return (
      <div className="flex flex-col items-center justify-center h-64 bg-error-50 rounded-lg border border-error-200">
        <AlertCircle className="text-error-500 mb-2" size={32} />
        <p className="text-error-700 font-medium">Failed to load version history</p>
        <p className="text-error-600 text-sm mt-1">{historyError.message}</p>
      </div>
    );
  }

  const versions = historyData?.versions ?? [];
  const pagination = historyData?.pagination;

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <History size={20} className="text-text-tertiary" />
          <h3 className="font-medium text-text-primary">Version History</h3>
          {pagination && (
            <span className="text-sm text-text-tertiary">
              ({pagination.total} version{pagination.total !== 1 ? 's' : ''})
            </span>
          )}
        </div>

        <Button
          variant={isCompareMode ? 'primary' : 'secondary'}
          size="sm"
          onClick={toggleCompareMode}
        >
          <GitCompare size={16} className="mr-1" />
          {isCompareMode ? 'Exit Compare' : 'Compare'}
        </Button>
      </div>

      {/* Compare mode instructions */}
      {isCompareMode && (
        <div className="p-3 bg-primary-50 border border-primary-200 rounded-lg">
          <p className="text-sm text-primary-700">
            Select a &quot;From&quot; and &quot;To&quot; version to compare changes
            {selectedFrom && selectedTo && ' - viewing comparison below'}
          </p>
        </div>
      )}

      {/* Comparison view */}
      {isCompareMode && selectedFrom && selectedTo && (
        <div className="mb-4">
          {isLoadingComparison ? (
            <div className="flex items-center justify-center h-32 bg-bg-secondary rounded-lg">
              <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-primary-500" />
            </div>
          ) : comparisonData ? (
            <DiffView comparison={comparisonData as VersionComparison} />
          ) : null}
        </div>
      )}

      {/* Version list */}
      <div className="space-y-2">
        {versions.length === 0 ? (
          <div className="p-8 text-center bg-bg-secondary rounded-lg">
            <p className="text-text-secondary">No version history available</p>
          </div>
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
      </div>

      {/* Pagination */}
      {pagination && pagination.totalPages > 1 && (
        <div className="flex items-center justify-center gap-2 pt-4">
          <Button
            variant="secondary"
            size="sm"
            onClick={() => setPage((p) => Math.max(1, p - 1))}
            disabled={page === 1}
          >
            Previous
          </Button>
          <span className="text-sm text-text-secondary">
            Page {page} of {pagination.totalPages}
          </span>
          <Button
            variant="secondary"
            size="sm"
            onClick={() => setPage((p) => Math.min(pagination.totalPages, p + 1))}
            disabled={page === pagination.totalPages}
          >
            Next
          </Button>
        </div>
      )}
    </div>
  );
}

export default VersionHistoryViewer;
