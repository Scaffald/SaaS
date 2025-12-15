/**
 * VersionHistory Component
 * REQ-2, TASK-16: Version History Viewer with Side-by-Side Diff
 *
 * Displays version history for a requirement with:
 * - Timeline view of all versions
 * - Side-by-side diff comparison
 * - Version metadata (author, timestamp, changes)
 * - Rollback capability
 */

import { useState, useMemo } from 'react'
import {
  History,
  ChevronRight,
  RotateCcw,
  Search,
  Info,
  AlertTriangle,
  Check,
  X,
  ArrowRight,
} from 'lucide-react'
import {
  useComplianceRequirements,
  useRequirementVersionHistory,
  type ComplianceRequirement,
} from '../../../hooks/useComplianceRequirements'
import { trpc } from '../../../lib/trpc'
import { LoadingSpinner } from '../../Common/LoadingSpinner'
import { Button } from '../../Common/Button'

// =============================================================================
// Types
// =============================================================================

interface VersionHistoryProps {
  organizationId: string
  selectedRequirement: ComplianceRequirement | null
  onSelectRequirement: (requirement: ComplianceRequirement | null) => void
}

interface Version {
  id: string
  requirement_id: string
  version_number: number
  snapshot: Record<string, unknown>
  changed_fields: string[]
  change_summary: string | null
  changed_by: string | null
  created_at: string
}

interface FieldDiff {
  field: string
  oldValue: unknown
  newValue: unknown
  changeType: 'added' | 'removed' | 'modified'
}

// =============================================================================
// Helper Functions
// =============================================================================

function formatDate(dateStr: string): string {
  return new Date(dateStr).toLocaleString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  })
}

function formatValue(value: unknown): string {
  if (value === null || value === undefined) return '(empty)'
  if (typeof value === 'object') return JSON.stringify(value, null, 2)
  return String(value)
}

function computeDiff(
  oldSnapshot: Record<string, unknown>,
  newSnapshot: Record<string, unknown>
): FieldDiff[] {
  const diffs: FieldDiff[] = []
  const allKeys = new Set([...Object.keys(oldSnapshot), ...Object.keys(newSnapshot)])

  for (const key of allKeys) {
    const oldVal = oldSnapshot[key]
    const newVal = newSnapshot[key]

    if (!(key in oldSnapshot)) {
      diffs.push({ field: key, oldValue: undefined, newValue: newVal, changeType: 'added' })
    } else if (!(key in newSnapshot)) {
      diffs.push({ field: key, oldValue: oldVal, newValue: undefined, changeType: 'removed' })
    } else if (JSON.stringify(oldVal) !== JSON.stringify(newVal)) {
      diffs.push({ field: key, oldValue: oldVal, newValue: newVal, changeType: 'modified' })
    }
  }

  return diffs
}

// =============================================================================
// Version Item Component
// =============================================================================

interface VersionItemProps {
  version: Version
  isSelected: boolean
  isCompareFrom: boolean
  isCompareTo: boolean
  onSelect: () => void
  onSetCompareFrom: () => void
  onSetCompareTo: () => void
}

function VersionItem({
  version,
  isSelected,
  isCompareFrom,
  isCompareTo,
  onSelect,
  onSetCompareFrom,
  onSetCompareTo,
}: VersionItemProps) {
  return (
    <div
      className={`p-3 border rounded-lg cursor-pointer transition-colors ${
        isSelected
          ? 'border-blue-500 bg-blue-50'
          : isCompareFrom || isCompareTo
            ? 'border-purple-500 bg-purple-50'
            : 'border-gray-200 hover:border-gray-300 hover:bg-gray-50'
      }`}
      onClick={onSelect}
    >
      <div className="flex items-center justify-between mb-1">
        <span className="font-semibold text-sm">Version {version.version_number}</span>
        <span className="text-xs text-gray-500">{formatDate(version.created_at)}</span>
      </div>

      {version.change_summary && (
        <p className="text-sm text-gray-600 mb-2">{version.change_summary}</p>
      )}

      {version.changed_fields && version.changed_fields.length > 0 && (
        <div className="flex flex-wrap gap-1 mb-2">
          {version.changed_fields.slice(0, 3).map((field) => (
            <span key={field} className="text-xs px-1.5 py-0.5 bg-gray-100 text-gray-600 rounded">
              {field}
            </span>
          ))}
          {version.changed_fields.length > 3 && (
            <span className="text-xs text-gray-500">+{version.changed_fields.length - 3} more</span>
          )}
        </div>
      )}

      <div className="flex items-center gap-2 mt-2">
        <button
          onClick={(e) => {
            e.stopPropagation()
            onSetCompareFrom()
          }}
          className={`text-xs px-2 py-1 rounded ${
            isCompareFrom
              ? 'bg-purple-600 text-white'
              : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
          }`}
        >
          From
        </button>
        <button
          onClick={(e) => {
            e.stopPropagation()
            onSetCompareTo()
          }}
          className={`text-xs px-2 py-1 rounded ${
            isCompareTo ? 'bg-purple-600 text-white' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
          }`}
        >
          To
        </button>
      </div>
    </div>
  )
}

// =============================================================================
// Main Component
// =============================================================================

export function VersionHistory({
  organizationId,
  selectedRequirement,
  onSelectRequirement,
}: VersionHistoryProps) {
  const [searchQuery, setSearchQuery] = useState('')
  const [selectedVersion, setSelectedVersion] = useState<Version | null>(null)
  const [compareFrom, setCompareFrom] = useState<Version | null>(null)
  const [compareTo, setCompareTo] = useState<Version | null>(null)

  // Fetch all requirements for selection
  const { data: requirementsData, isLoading: isLoadingRequirements } = useComplianceRequirements({
    organizationId,
    pageSize: 100,
  })

  // Fetch version history
  const versionsQuery = trpc.complianceRequirements.getVersions.useQuery(
    {
      organizationId,
      requirementId: selectedRequirement?.id ?? '',
    },
    {
      enabled: !!selectedRequirement?.id,
    }
  )

  // Restore mutation
  const restoreMutation = trpc.complianceRequirements.restoreVersion.useMutation({
    onSuccess: () => {
      versionsQuery.refetch()
    },
  })

  // Filter requirements by search
  const filteredRequirements = useMemo(() => {
    const requirements = requirementsData?.data ?? []
    if (!searchQuery) return requirements
    const query = searchQuery.toLowerCase()
    return requirements.filter(
      (r) => r.name.toLowerCase().includes(query) || r.code.toLowerCase().includes(query)
    )
  }, [requirementsData?.data, searchQuery])

  // Compute diff between versions
  const versionDiff = useMemo((): FieldDiff[] | null => {
    if (!compareFrom || !compareTo) return null
    return computeDiff(
      compareFrom.snapshot as Record<string, unknown>,
      compareTo.snapshot as Record<string, unknown>
    )
  }, [compareFrom, compareTo])

  // Handle restore
  const handleRestore = async (version: Version) => {
    if (!selectedRequirement) return

    const confirmed = window.confirm(
      `Are you sure you want to restore to version ${version.version_number}? This will create a new version with the old data.`
    )
    if (!confirmed) return

    try {
      await restoreMutation.mutateAsync({
        organizationId,
        requirementId: selectedRequirement.id,
        versionNumber: version.version_number,
        change_summary: `Restored to version ${version.version_number}`,
      })
    } catch (error) {
      console.error('Failed to restore version:', error)
    }
  }

  const versions = (versionsQuery.data?.versions ?? []) as Version[]

  return (
    <div className="bg-white rounded-lg border">
      <div className="grid grid-cols-4 divide-x h-[600px]">
        {/* Requirement Selector */}
        <div className="p-4 overflow-y-auto">
          <h3 className="font-semibold text-gray-900 mb-3">Select Requirement</h3>

          <div className="relative mb-3">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={16} />
            <input
              type="text"
              placeholder="Search requirements..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-3 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          {isLoadingRequirements ? (
            <div className="flex items-center justify-center py-8">
              <LoadingSpinner size="sm" />
            </div>
          ) : (
            <div className="space-y-1">
              {filteredRequirements.map((req) => (
                <button
                  key={req.id}
                  onClick={() => {
                    onSelectRequirement(req)
                    setSelectedVersion(null)
                    setCompareFrom(null)
                    setCompareTo(null)
                  }}
                  className={`w-full text-left px-3 py-2 rounded-lg text-sm ${
                    selectedRequirement?.id === req.id
                      ? 'bg-blue-100 text-blue-700'
                      : 'hover:bg-gray-50'
                  }`}
                >
                  <div className="font-medium">{req.name}</div>
                  <div className="text-xs text-gray-500">{req.code}</div>
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Version Timeline */}
        <div className="p-4 overflow-y-auto">
          <h3 className="font-semibold text-gray-900 mb-3">Version History</h3>

          {!selectedRequirement ? (
            <div className="flex flex-col items-center justify-center h-full text-gray-500">
              <History size={48} className="mb-4 text-gray-300" />
              <p className="text-sm">Select a requirement</p>
            </div>
          ) : versionsQuery.isLoading ? (
            <div className="flex items-center justify-center h-full">
              <LoadingSpinner size="sm" />
            </div>
          ) : (
            <div className="space-y-2">
              {versions.map((version) => (
                <VersionItem
                  key={version.id}
                  version={version}
                  isSelected={selectedVersion?.id === version.id}
                  isCompareFrom={compareFrom?.id === version.id}
                  isCompareTo={compareTo?.id === version.id}
                  onSelect={() => setSelectedVersion(version)}
                  onSetCompareFrom={() => setCompareFrom(version)}
                  onSetCompareTo={() => setCompareTo(version)}
                />
              ))}
              {versions.length === 0 && (
                <p className="text-sm text-gray-500 text-center py-4">No version history</p>
              )}
            </div>
          )}
        </div>

        {/* Diff View */}
        <div className="col-span-2 p-4 overflow-y-auto">
          <div className="flex items-center justify-between mb-3">
            <h3 className="font-semibold text-gray-900">
              {compareFrom && compareTo ? 'Version Comparison' : 'Version Details'}
            </h3>
            {selectedVersion && !compareFrom && !compareTo && (
              <Button
                size="sm"
                variant="secondary"
                onClick={() => handleRestore(selectedVersion)}
                disabled={
                  restoreMutation.isPending ||
                  selectedVersion.version_number === versions[0]?.version_number
                }
              >
                <RotateCcw size={14} className="mr-1" />
                Restore
              </Button>
            )}
          </div>

          {compareFrom && compareTo ? (
            /* Comparison View */
            <div>
              <div className="flex items-center gap-2 mb-4 text-sm text-gray-600">
                <span className="px-2 py-1 bg-purple-100 rounded">
                  v{compareFrom.version_number}
                </span>
                <ArrowRight size={16} />
                <span className="px-2 py-1 bg-purple-100 rounded">v{compareTo.version_number}</span>
              </div>

              {versionDiff && versionDiff.length > 0 ? (
                <div className="space-y-3">
                  {versionDiff.map((diff) => (
                    <div
                      key={diff.field}
                      className={`p-3 rounded-lg border ${
                        diff.changeType === 'added'
                          ? 'bg-green-50 border-green-200'
                          : diff.changeType === 'removed'
                            ? 'bg-red-50 border-red-200'
                            : 'bg-yellow-50 border-yellow-200'
                      }`}
                    >
                      <div className="flex items-center gap-2 mb-2">
                        <span className="font-medium text-sm">{diff.field}</span>
                        <span
                          className={`text-xs px-1.5 py-0.5 rounded ${
                            diff.changeType === 'added'
                              ? 'bg-green-200 text-green-800'
                              : diff.changeType === 'removed'
                                ? 'bg-red-200 text-red-800'
                                : 'bg-yellow-200 text-yellow-800'
                          }`}
                        >
                          {diff.changeType}
                        </span>
                      </div>
                      <div className="grid grid-cols-2 gap-2 text-xs font-mono">
                        <div>
                          <span className="text-gray-500">Old:</span>
                          <pre className="mt-1 p-2 bg-white rounded border overflow-x-auto">
                            {formatValue(diff.oldValue)}
                          </pre>
                        </div>
                        <div>
                          <span className="text-gray-500">New:</span>
                          <pre className="mt-1 p-2 bg-white rounded border overflow-x-auto">
                            {formatValue(diff.newValue)}
                          </pre>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-sm text-gray-500">No differences found</p>
              )}
            </div>
          ) : selectedVersion ? (
            /* Single Version View */
            <div>
              <div className="mb-4 p-3 bg-gray-50 rounded-lg">
                <div className="text-sm text-gray-600">
                  <strong>Version:</strong> {selectedVersion.version_number}
                </div>
                <div className="text-sm text-gray-600">
                  <strong>Created:</strong> {formatDate(selectedVersion.created_at)}
                </div>
                {selectedVersion.change_summary && (
                  <div className="text-sm text-gray-600 mt-2">
                    <strong>Summary:</strong> {selectedVersion.change_summary}
                  </div>
                )}
              </div>

              <h4 className="font-medium text-sm text-gray-700 mb-2">Snapshot</h4>
              <pre className="p-3 bg-gray-50 rounded-lg text-xs font-mono overflow-x-auto">
                {JSON.stringify(selectedVersion.snapshot, null, 2)}
              </pre>
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center h-full text-gray-500">
              <Info size={48} className="mb-4 text-gray-300" />
              <p className="text-sm">Select a version or choose two versions to compare</p>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

export default VersionHistory
