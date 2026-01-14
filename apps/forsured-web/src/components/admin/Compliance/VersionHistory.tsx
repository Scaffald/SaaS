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

import React, { useState, useMemo } from 'react'
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
  Stack,
  Row,
  Text,
  Input,
  Button,
  H3,
  H4,
} from '@unicornlove/beyond-ui'
import {
  useComplianceRequirements,
  useRequirementVersionHistory,
  type ComplianceRequirement,
} from '../../../hooks/useComplianceRequirements'
import { trpc } from '../../../lib/trpc'
import { LoadingSpinner } from '../../Common/LoadingSpinner'

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

function getDiffColors(changeType: string): { bg: string; border: string; badgeBg: string; badgeColor: string } {
  switch (changeType) {
    case 'added':
      return {
        bg: 'var(--color-green-2)',
        border: 'var(--color-green-6)',
        badgeBg: 'var(--color-green-4)',
        badgeColor: 'var(--color-green-11)',
      }
    case 'removed':
      return {
        bg: 'var(--color-red-2)',
        border: 'var(--color-red-6)',
        badgeBg: 'var(--color-red-4)',
        badgeColor: 'var(--color-red-11)',
      }
    default:
      return {
        bg: 'var(--color-yellow-2)',
        border: 'var(--color-yellow-6)',
        badgeBg: 'var(--color-yellow-4)',
        badgeColor: 'var(--color-yellow-11)',
      }
  }
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
  const borderColor = isSelected
    ? 'var(--color-blue-8)'
    : isCompareFrom || isCompareTo
      ? 'var(--color-purple-8)'
      : 'var(--color-gray-6)'

  const backgroundColor = isSelected
    ? 'var(--color-blue-2)'
    : isCompareFrom || isCompareTo
      ? 'var(--color-purple-2)'
      : 'transparent'

  return (
    <Stack
      style={{
        padding: 12,
        borderWidth: 1,
        borderRadius: 12,
        cursor: 'pointer',
        borderColor,
        backgroundColor,
      }}
      onClick={onSelect}
    >
      <Row style={{ alignItems: 'center', justifyContent: 'space-between', marginBottom: 4 }}>
        <Text style={{ fontWeight: 600, fontSize: 14 }}>Version {version.version_number}</Text>
        <Text style={{ fontSize: 11, color: 'var(--color-gray-11)' }}>{formatDate(version.created_at)}</Text>
      </Row>

      {version.change_summary && (
        <Text style={{ fontSize: 14, color: 'var(--color-gray-11)', marginBottom: 8 }}>{version.change_summary}</Text>
      )}

      {version.changed_fields && version.changed_fields.length > 0 && (
        <Row style={{ flexWrap: 'wrap', gap: 4, marginBottom: 8 }}>
          {version.changed_fields.slice(0, 3).map((field) => (
            <Text
              key={field}
              style={{
                fontSize: 11,
                paddingLeft: 6,
                paddingRight: 6,
                paddingTop: 4,
                paddingBottom: 4,
                backgroundColor: 'var(--color-gray-3)',
                color: 'var(--color-gray-11)',
                borderRadius: 6,
              }}
            >
              {field}
            </Text>
          ))}
          {version.changed_fields.length > 3 && (
            <Text style={{ fontSize: 11, color: 'var(--color-gray-11)' }}>
              +{version.changed_fields.length - 3} more
            </Text>
          )}
        </Row>
      )}

      <Row style={{ alignItems: 'center', gap: 8, marginTop: 8 }}>
        <Button
          variant="ghost"
          style={{
            fontSize: 11,
            paddingLeft: 8,
            paddingRight: 8,
            paddingTop: 4,
            paddingBottom: 4,
            borderRadius: 6,
            backgroundColor: isCompareFrom ? 'var(--color-purple-10)' : 'var(--color-gray-3)',
            color: isCompareFrom ? 'white' : 'var(--color-gray-11)',
          }}
          onClick={(e) => {
            e.stopPropagation()
            onSetCompareFrom()
          }}
        >
          <Text>From</Text>
        </Button>
        <Button
          variant="ghost"
          style={{
            fontSize: 11,
            paddingLeft: 8,
            paddingRight: 8,
            paddingTop: 4,
            paddingBottom: 4,
            borderRadius: 6,
            backgroundColor: isCompareTo ? 'var(--color-purple-10)' : 'var(--color-gray-3)',
            color: isCompareTo ? 'white' : 'var(--color-gray-11)',
          }}
          onClick={(e) => {
            e.stopPropagation()
            onSetCompareTo()
          }}
        >
          <Text>To</Text>
        </Button>
      </Row>
    </Stack>
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
    <Stack style={{ backgroundColor: 'var(--color-background)', borderRadius: 12, borderWidth: 1, borderColor: 'var(--color-border)' }}>
      <Row style={{ height: 600 }}>
        {/* Requirement Selector */}
        <Stack style={{ padding: 16, overflow: 'auto', flex: 1, borderRight: '1px solid var(--color-border)' }}>
          <H3 style={{ fontWeight: 600, color: 'var(--color-12)', marginBottom: 12 }}>Select Requirement</H3>

          <Row style={{ position: 'relative', marginBottom: 12 }}>
            <Stack
              style={{
                position: 'absolute',
                left: 12,
                top: '50%',
                transform: 'translateY(-50%)',
                zIndex: 1,
                pointerEvents: 'none',
              }}
            >
              <Search size={16} style={{ color: 'var(--color-gray-10)' }} />
            </Stack>
            <Input
              style={{
                flex: 1,
                paddingLeft: 36,
                paddingRight: 12,
                paddingTop: 8,
                paddingBottom: 8,
                fontSize: 14,
                borderWidth: 1,
                borderColor: 'var(--color-gray-8)',
                borderRadius: 12,
              }}
              placeholder="Search requirements..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </Row>

          {isLoadingRequirements ? (
            <Stack style={{ alignItems: 'center', justifyContent: 'center', paddingTop: 32, paddingBottom: 32 }}>
              <LoadingSpinner size="sm" />
            </Stack>
          ) : (
            <Stack style={{ gap: 4 }}>
              {filteredRequirements.map((req) => (
                <Button
                  key={req.id}
                  variant="ghost"
                  style={{
                    width: '100%',
                    textAlign: 'left',
                    paddingLeft: 12,
                    paddingRight: 12,
                    paddingTop: 8,
                    paddingBottom: 8,
                    borderRadius: 12,
                    backgroundColor: selectedRequirement?.id === req.id ? 'var(--color-blue-3)' : 'transparent',
                  }}
                  onClick={() => {
                    onSelectRequirement(req)
                    setSelectedVersion(null)
                    setCompareFrom(null)
                    setCompareTo(null)
                  }}
                >
                  <Stack>
                    <Text style={{ fontWeight: 600, fontSize: 14, color: selectedRequirement?.id === req.id ? 'var(--color-blue-11)' : 'var(--color-12)' }}>
                      {req.name}
                    </Text>
                    <Text style={{ fontSize: 11, color: 'var(--color-gray-11)' }}>{req.code}</Text>
                  </Stack>
                </Button>
              ))}
            </Stack>
          )}
        </Stack>

        {/* Version Timeline */}
        <Stack style={{ padding: 16, overflow: 'auto', flex: 1, borderRight: '1px solid var(--color-border)' }}>
          <H3 style={{ fontWeight: 600, color: 'var(--color-12)', marginBottom: 12 }}>Version History</H3>

          {!selectedRequirement ? (
            <Stack
              style={{
                flex: 1,
                alignItems: 'center',
                justifyContent: 'center',
                color: 'var(--color-gray-11)',
              }}
            >
              <Stack style={{ marginBottom: 16 }}>
                <History size={48} style={{ color: 'var(--color-gray-8)' }} />
              </Stack>
              <Text style={{ fontSize: 14 }}>Select a requirement</Text>
            </Stack>
          ) : versionsQuery.isLoading ? (
            <Stack style={{ flex: 1, alignItems: 'center', justifyContent: 'center' }}>
              <LoadingSpinner size="sm" />
            </Stack>
          ) : (
            <Stack style={{ gap: 8 }}>
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
                <Text style={{ fontSize: 14, color: 'var(--color-gray-11)', textAlign: 'center', paddingTop: 16, paddingBottom: 16 }}>
                  No version history
                </Text>
              )}
            </Stack>
          )}
        </Stack>

        {/* Diff View */}
        <Stack style={{ flex: 2, padding: 16, overflow: 'auto' }}>
          <Row style={{ alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
            <H3 style={{ fontWeight: 600, color: 'var(--color-12)' }}>
              {compareFrom && compareTo ? 'Version Comparison' : 'Version Details'}
            </H3>
            {selectedVersion && !compareFrom && !compareTo && (
              <Button
                size="sm"
                variant="outlined"
                onClick={() => handleRestore(selectedVersion)}
                disabled={
                  restoreMutation.isPending ||
                  selectedVersion.version_number === versions[0]?.version_number
                }
              >
                <Row style={{ alignItems: 'center', gap: 4 }}>
                  <RotateCcw size={14} />
                  <Text>Restore</Text>
                </Row>
              </Button>
            )}
          </Row>

          {compareFrom && compareTo ? (
            /* Comparison View */
            <Stack>
              <Row style={{ alignItems: 'center', gap: 8, marginBottom: 16, fontSize: 14, color: 'var(--color-gray-11)' }}>
                <Text
                  style={{
                    paddingLeft: 8,
                    paddingRight: 8,
                    paddingTop: 4,
                    paddingBottom: 4,
                    backgroundColor: 'var(--color-purple-2)',
                    borderRadius: 6,
                  }}
                >
                  v{compareFrom.version_number}
                </Text>
                <ArrowRight size={16} />
                <Text
                  style={{
                    paddingLeft: 8,
                    paddingRight: 8,
                    paddingTop: 4,
                    paddingBottom: 4,
                    backgroundColor: 'var(--color-purple-2)',
                    borderRadius: 6,
                  }}
                >
                  v{compareTo.version_number}
                </Text>
              </Row>

              {versionDiff && versionDiff.length > 0 ? (
                <Stack style={{ gap: 12 }}>
                  {versionDiff.map((diff) => {
                    const colors = getDiffColors(diff.changeType)

                    return (
                      <Stack
                        key={diff.field}
                        style={{
                          padding: 12,
                          borderRadius: 12,
                          borderWidth: 1,
                          backgroundColor: colors.bg,
                          borderColor: colors.border,
                        }}
                      >
                        <Row style={{ alignItems: 'center', gap: 8, marginBottom: 8 }}>
                          <Text style={{ fontWeight: 600, fontSize: 14 }}>{diff.field}</Text>
                          <Text
                            style={{
                              fontSize: 11,
                              paddingLeft: 6,
                              paddingRight: 6,
                              paddingTop: 4,
                              paddingBottom: 4,
                              borderRadius: 6,
                              backgroundColor: colors.badgeBg,
                              color: colors.badgeColor,
                            }}
                          >
                            {diff.changeType}
                          </Text>
                        </Row>
                        <Row style={{ gap: 8, flexWrap: 'wrap' }}>
                          <Stack style={{ flex: 1, minWidth: 200 }}>
                            <Text style={{ fontSize: 11, color: 'var(--color-gray-11)' }}>Old:</Text>
                            <Stack
                              style={{
                                marginTop: 4,
                                padding: 8,
                                backgroundColor: 'var(--color-background)',
                                borderRadius: 6,
                                borderWidth: 1,
                                borderColor: 'var(--color-border)',
                                overflow: 'auto',
                              }}
                            >
                              <Text style={{ fontFamily: 'monospace', fontSize: 11 }}>
                                {formatValue(diff.oldValue)}
                              </Text>
                            </Stack>
                          </Stack>
                          <Stack style={{ flex: 1, minWidth: 200 }}>
                            <Text style={{ fontSize: 11, color: 'var(--color-gray-11)' }}>New:</Text>
                            <Stack
                              style={{
                                marginTop: 4,
                                padding: 8,
                                backgroundColor: 'var(--color-background)',
                                borderRadius: 6,
                                borderWidth: 1,
                                borderColor: 'var(--color-border)',
                                overflow: 'auto',
                              }}
                            >
                              <Text style={{ fontFamily: 'monospace', fontSize: 11 }}>
                                {formatValue(diff.newValue)}
                              </Text>
                            </Stack>
                          </Stack>
                        </Row>
                      </Stack>
                    )
                  })}
                </Stack>
              ) : (
                <Text style={{ fontSize: 14, color: 'var(--color-gray-11)' }}>No differences found</Text>
              )}
            </Stack>
          ) : selectedVersion ? (
            /* Single Version View */
            <Stack>
              <Stack style={{ marginBottom: 16, padding: 12, backgroundColor: 'var(--color-gray-2)', borderRadius: 12 }}>
                <Text style={{ fontSize: 14, color: 'var(--color-gray-11)' }}>
                  <Text style={{ fontWeight: 600 }}>Version:</Text> {selectedVersion.version_number}
                </Text>
                <Text style={{ fontSize: 14, color: 'var(--color-gray-11)' }}>
                  <Text style={{ fontWeight: 600 }}>Created:</Text> {formatDate(selectedVersion.created_at)}
                </Text>
                {selectedVersion.change_summary && (
                  <Text style={{ fontSize: 14, color: 'var(--color-gray-11)', marginTop: 8 }}>
                    <Text style={{ fontWeight: 600 }}>Summary:</Text> {selectedVersion.change_summary}
                  </Text>
                )}
              </Stack>

              <H4 style={{ fontWeight: 600, fontSize: 14, color: 'var(--color-11)', marginBottom: 8 }}>Snapshot</H4>
              <Stack
                style={{
                  padding: 12,
                  backgroundColor: 'var(--color-gray-2)',
                  borderRadius: 12,
                  overflow: 'auto',
                }}
              >
                <Text style={{ fontFamily: 'monospace', fontSize: 11 }}>
                  {JSON.stringify(selectedVersion.snapshot, null, 2)}
                </Text>
              </Stack>
            </Stack>
          ) : (
            <Stack
              style={{
                flex: 1,
                alignItems: 'center',
                justifyContent: 'center',
                color: 'var(--color-gray-11)',
              }}
            >
              <Stack style={{ marginBottom: 16 }}>
                <Info size={48} style={{ color: 'var(--color-gray-8)' }} />
              </Stack>
              <Text style={{ fontSize: 14 }}>Select a version or choose two versions to compare</Text>
            </Stack>
          )}
        </Stack>
      </Row>
    </Stack>
  )
}

export default VersionHistory
