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
  YStack,
  XStack,
  Text,
  Input,
  Button,
  H3,
  H4,
} from '@unicornlove/ui'
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
    <YStack
      padding="$3"
      borderWidth={1}
      borderRadius="$4"
      cursor="pointer"
      borderColor={
        isSelected
          ? '$blue8'
          : isCompareFrom || isCompareTo
            ? '$purple8'
            : '$gray6'
      }
      backgroundColor={
        isSelected
          ? '$blue2'
          : isCompareFrom || isCompareTo
            ? '$purple2'
            : 'transparent'
      }
      hoverStyle={{
        borderColor: isSelected ? '$blue8' : '$gray8',
        backgroundColor: isSelected ? '$blue2' : '$gray2',
      }}
      onPress={onSelect}
    >
      <XStack alignItems="center" justifyContent="space-between" mb="$1">
        <Text fontWeight="600" fontSize="$3">Version {version.version_number}</Text>
        <Text fontSize="$1" color="$gray11">{formatDate(version.created_at)}</Text>
      </XStack>

      {version.change_summary && (
        <Text fontSize="$3" color="$gray11" mb="$2">{version.change_summary}</Text>
      )}

      {version.changed_fields && version.changed_fields.length > 0 && (
        <XStack flexWrap="wrap" gap="$1" mb="$2">
          {version.changed_fields.slice(0, 3).map((field) => (
            <Text
              key={field}
              fontSize="$1"
              paddingHorizontal="$1.5"
              paddingVertical="$1"
              backgroundColor="$gray3"
              color="$gray11"
              borderRadius="$2"
            >
              {field}
            </Text>
          ))}
          {version.changed_fields.length > 3 && (
            <Text fontSize="$1" color="$gray11">
              +{version.changed_fields.length - 3} more
            </Text>
          )}
        </XStack>
      )}

      <XStack alignItems="center" gap="$2" mt="$2">
        <Button
          unstyled
          fontSize="$1"
          paddingHorizontal="$2"
          paddingVertical="$1"
          borderRadius="$2"
          backgroundColor={isCompareFrom ? '$purple10' : '$gray3'}
          color={isCompareFrom ? 'white' : '$gray11'}
          hoverStyle={{ backgroundColor: isCompareFrom ? '$purple10' : '$gray4' }}
          onPress={(e) => {
            e.stopPropagation()
            onSetCompareFrom()
          }}
        >
          <Text>From</Text>
        </Button>
        <Button
          unstyled
          fontSize="$1"
          paddingHorizontal="$2"
          paddingVertical="$1"
          borderRadius="$2"
          backgroundColor={isCompareTo ? '$purple10' : '$gray3'}
          color={isCompareTo ? 'white' : '$gray11'}
          hoverStyle={{ backgroundColor: isCompareTo ? '$purple10' : '$gray4' }}
          onPress={(e) => {
            e.stopPropagation()
            onSetCompareTo()
          }}
        >
          <Text>To</Text>
        </Button>
      </XStack>
    </YStack>
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
    <YStack backgroundColor="$background" borderRadius="$4" borderWidth={1} borderColor="$borderColor">
      <XStack height={600}>
        {/* Requirement Selector */}
        <YStack padding="$4" overflow="scroll" flex={1} borderRightWidth={1} borderColor="$borderColor">
          <H3 fontWeight="600" color="$color12" mb="$3">Select Requirement</H3>

          <XStack position="relative" mb="$3">
            <YStack
              position="absolute"
              left="$3"
              top="50%"
              zIndex={1}
              pointerEvents="none"
            >
              <Search size={16} style={{ color: 'var(--color-gray-10)' }} />
            </YStack>
            <Input
              flex={1}
              paddingLeft="$9"
              paddingRight="$3"
              paddingVertical="$2"
              fontSize="$3"
              borderWidth={1}
              borderColor="$gray8"
              borderRadius="$4"
              placeholder="Search requirements..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </XStack>

          {isLoadingRequirements ? (
            <YStack alignItems="center" justifyContent="center" paddingVertical="$8">
              <LoadingSpinner size="sm" />
            </YStack>
          ) : (
            <YStack gap="$1">
              {filteredRequirements.map((req) => (
                <Button
                  key={req.id}
                  unstyled
                  width="100%"
                  style={{ textAlign: 'left' }}
                  paddingHorizontal="$3"
                  paddingVertical="$2"
                  borderRadius="$4"
                  backgroundColor={selectedRequirement?.id === req.id ? '$blue3' : 'transparent'}
                  hoverStyle={{ backgroundColor: '$gray2' }}
                  onPress={() => {
                    onSelectRequirement(req)
                    setSelectedVersion(null)
                    setCompareFrom(null)
                    setCompareTo(null)
                  }}
                >
                  <YStack>
                    <Text fontWeight="600" fontSize="$3" color={selectedRequirement?.id === req.id ? '$blue11' : '$color12'}>
                      {req.name}
                    </Text>
                    <Text fontSize="$1" color="$gray11">{req.code}</Text>
                  </YStack>
                </Button>
              ))}
            </YStack>
          )}
        </YStack>

        {/* Version Timeline */}
        <YStack padding="$4" overflow="scroll" flex={1} borderRightWidth={1} borderColor="$borderColor">
          <H3 fontWeight="600" color="$color12" mb="$3">Version History</H3>

          {!selectedRequirement ? (
            <YStack
              flex={1}
              alignItems="center"
              justifyContent="center"
              color="$gray11"
            >
              <YStack mb="$4">
                <History size={48} style={{ color: 'var(--color-gray-8)' }} />
              </YStack>
              <Text fontSize="$3">Select a requirement</Text>
            </YStack>
          ) : versionsQuery.isLoading ? (
            <YStack flex={1} alignItems="center" justifyContent="center">
              <LoadingSpinner size="sm" />
            </YStack>
          ) : (
            <YStack gap="$2">
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
                <Text fontSize="$3" color="$gray11" style={{ textAlign: 'center' }} paddingVertical="$4">
                  No version history
                </Text>
              )}
            </YStack>
          )}
        </YStack>

        {/* Diff View */}
        <YStack flex={2} padding="$4" overflow="scroll">
          <XStack alignItems="center" justifyContent="space-between" mb="$3">
            <H3 fontWeight="600" color="$color12">
              {compareFrom && compareTo ? 'Version Comparison' : 'Version Details'}
            </H3>
            {selectedVersion && !compareFrom && !compareTo && (
              <Button
                size="$3"
                variant="outlined"
                onPress={() => handleRestore(selectedVersion)}
                disabled={
                  restoreMutation.isPending ||
                  selectedVersion.version_number === versions[0]?.version_number
                }
              >
                <XStack alignItems="center" gap="$1">
                  <RotateCcw size={14} />
                  <Text>Restore</Text>
                </XStack>
              </Button>
            )}
          </XStack>

          {compareFrom && compareTo ? (
            /* Comparison View */
            <YStack>
              <XStack alignItems="center" gap="$2" mb="$4" fontSize="$3" color="$gray11">
                <Text
                  paddingHorizontal="$2"
                  paddingVertical="$1"
                  backgroundColor="$purple2"
                  borderRadius="$2"
                >
                  v{compareFrom.version_number}
                </Text>
                <ArrowRight size={16} />
                <Text
                  paddingHorizontal="$2"
                  paddingVertical="$1"
                  backgroundColor="$purple2"
                  borderRadius="$2"
                >
                  v{compareTo.version_number}
                </Text>
              </XStack>

              {versionDiff && versionDiff.length > 0 ? (
                <YStack gap="$3">
                  {versionDiff.map((diff) => {
                    const bgColor =
                      diff.changeType === 'added'
                        ? '$green2'
                        : diff.changeType === 'removed'
                          ? '$red2'
                          : '$yellow2'
                    const borderColor =
                      diff.changeType === 'added'
                        ? '$green6'
                        : diff.changeType === 'removed'
                          ? '$red6'
                          : '$yellow6'
                    const badgeBg =
                      diff.changeType === 'added'
                        ? '$green4'
                        : diff.changeType === 'removed'
                          ? '$red4'
                          : '$yellow4'
                    const badgeColor =
                      diff.changeType === 'added'
                        ? '$green11'
                        : diff.changeType === 'removed'
                          ? '$red11'
                          : '$yellow11'

                    return (
                      <YStack
                        key={diff.field}
                        padding="$3"
                        borderRadius="$4"
                        borderWidth={1}
                        backgroundColor={bgColor}
                        borderColor={borderColor}
                      >
                        <XStack alignItems="center" gap="$2" mb="$2">
                          <Text fontWeight="600" fontSize="$3">{diff.field}</Text>
                          <Text
                            fontSize="$1"
                            paddingHorizontal="$1.5"
                            paddingVertical="$1"
                            borderRadius="$2"
                            backgroundColor={badgeBg}
                            color={badgeColor}
                          >
                            {diff.changeType}
                          </Text>
                        </XStack>
                        <XStack gap="$2" flexWrap="wrap">
                          <YStack flex={1} minWidth="200px">
                            <Text fontSize="$1" color="$gray11">Old:</Text>
                            <YStack
                              mt="$1"
                              padding="$2"
                              backgroundColor="$background"
                              borderRadius="$2"
                              borderWidth={1}
                              borderColor="$borderColor"
                              overflow="scroll"
                            >
                              <Text fontFamily="$mono" fontSize="$1">
                                {formatValue(diff.oldValue)}
                              </Text>
                            </YStack>
                          </YStack>
                          <YStack flex={1} minWidth="200px">
                            <Text fontSize="$1" color="$gray11">New:</Text>
                            <YStack
                              mt="$1"
                              padding="$2"
                              backgroundColor="$background"
                              borderRadius="$2"
                              borderWidth={1}
                              borderColor="$borderColor"
                              overflow="scroll"
                            >
                              <Text fontFamily="$mono" fontSize="$1">
                                {formatValue(diff.newValue)}
                              </Text>
                            </YStack>
                          </YStack>
                        </XStack>
                      </YStack>
                    )
                  })}
                </YStack>
              ) : (
                <Text fontSize="$3" color="$gray11">No differences found</Text>
              )}
            </YStack>
          ) : selectedVersion ? (
            /* Single Version View */
            <YStack>
              <YStack mb="$4" padding="$3" backgroundColor="$gray2" borderRadius="$4">
                <Text fontSize="$3" color="$gray11">
                  <Text fontWeight="600">Version:</Text> {selectedVersion.version_number}
                </Text>
                <Text fontSize="$3" color="$gray11">
                  <Text fontWeight="600">Created:</Text> {formatDate(selectedVersion.created_at)}
                </Text>
                {selectedVersion.change_summary && (
                  <Text fontSize="$3" color="$gray11" mt="$2">
                    <Text fontWeight="600">Summary:</Text> {selectedVersion.change_summary}
                  </Text>
                )}
              </YStack>

              <H4 fontWeight="600" fontSize="$3" color="$color11" mb="$2">Snapshot</H4>
              <YStack
                padding="$3"
                backgroundColor="$gray2"
                borderRadius="$4"
                overflow="scroll"
              >
                <Text fontFamily="$mono" fontSize="$1">
                  {JSON.stringify(selectedVersion.snapshot, null, 2)}
                </Text>
              </YStack>
            </YStack>
          ) : (
            <YStack
              flex={1}
              alignItems="center"
              justifyContent="center"
              color="$gray11"
            >
              <YStack mb="$4">
                <Info size={48} style={{ color: 'var(--color-gray-8)' }} />
              </YStack>
              <Text fontSize="$3">Select a version or choose two versions to compare</Text>
            </YStack>
          )}
        </YStack>
      </XStack>
    </YStack>
  )
}

export default VersionHistory
