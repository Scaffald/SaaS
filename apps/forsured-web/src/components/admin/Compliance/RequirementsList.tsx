/**
 * RequirementsList Component
 * REQ-2, TASK-13: Requirements List View with Filtering and Search
 *
 * Displays a data table of compliance requirements with:
 * - Column sorting
 * - Filtering by type, status
 * - Search by name/code/description
 * - Pagination
 * - Row actions (edit, view, archive)
 */

import { useState, useMemo, useCallback } from 'react'
import {
  useReactTable,
  getCoreRowModel,
  getSortedRowModel,
  flexRender,
  type ColumnDef,
  type SortingState,
} from '@tanstack/react-table'
import {
  Search,
  Filter,
  ChevronUp,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  Edit,
  Eye,
  Archive,
  MoreVertical,
  RefreshCcw,
  Plus,
  X,
} from 'lucide-react'
import {
  YStack,
  XStack,
  Text,
  Input,
  Button,
  H2,
  Card,
} from '@unicornlove/ui'
import {
  useComplianceRequirements,
  useArchiveComplianceRequirement,
  type ComplianceRequirement,
  type CoverageType,
  type RequirementStatus,
} from '../../../hooks/useComplianceRequirements'
import { Badge } from '../../Common/Badge'
import { LoadingSpinner } from '../../Common/LoadingSpinner'

// =============================================================================
// Types
// =============================================================================

interface RequirementsListProps {
  organizationId: string
  onCreateNew: () => void
  onEdit: (requirement: ComplianceRequirement) => void
  onViewDependencies: (requirement: ComplianceRequirement) => void
  onViewVersions: (requirement: ComplianceRequirement) => void
}

// =============================================================================
// Constants
// =============================================================================

const COVERAGE_TYPE_OPTIONS: { value: CoverageType; label: string }[] = [
  { value: 'general_liability', label: 'General Liability' },
  { value: 'workers_comp', label: 'Workers Comp' },
  { value: 'auto_liability', label: 'Auto Liability' },
  { value: 'umbrella', label: 'Umbrella' },
  { value: 'professional_liability', label: 'Professional Liability' },
  { value: 'custom', label: 'Custom' },
]

const STATUS_OPTIONS: { value: RequirementStatus; label: string }[] = [
  { value: 'active', label: 'Active' },
  { value: 'draft', label: 'Draft' },
  { value: 'archived', label: 'Archived' },
]

const STATUS_COLORS: Record<RequirementStatus, { bg: string; color: string }> = {
  active: { bg: '$green2', color: '$green10' },
  draft: { bg: '$yellow2', color: '$yellow10' },
  archived: { bg: '$gray2', color: '$gray10' },
}

const TYPE_LABELS: Record<CoverageType, string> = {
  general_liability: 'GL',
  workers_comp: 'WC',
  auto_liability: 'Auto',
  umbrella: 'Umbrella',
  professional_liability: 'Prof. Liability',
  custom: 'Custom',
}

// =============================================================================
// Component
// =============================================================================

export function RequirementsList({
  organizationId,
  onCreateNew,
  onEdit,
  onViewDependencies,
  onViewVersions,
}: RequirementsListProps) {
  // Local state for filters
  const [search, setSearch] = useState('')
  const [typeFilter, setTypeFilter] = useState<CoverageType | ''>('')
  const [statusFilter, setStatusFilter] = useState<RequirementStatus | ''>('')
  const [page, setPage] = useState(1)
  const [sorting, setSorting] = useState<SortingState>([])
  const [showFilters, setShowFilters] = useState(false)

  // Build filter arrays
  const types = typeFilter ? [typeFilter] : undefined
  const statuses = statusFilter ? [statusFilter] : undefined

  // Fetch data
  const { data, isLoading, isFetching, refetch } = useComplianceRequirements({
    organizationId,
    page,
    pageSize: 20,
    types,
    statuses,
    search: search || undefined,
    sortBy: sorting[0]?.id || 'created_at',
    sortOrder: sorting[0]?.desc ? 'desc' : 'asc',
  })

  const archiveMutation = useArchiveComplianceRequirement()

  // Handle archive
  const handleArchive = useCallback(
    async (requirement: ComplianceRequirement) => {
      if (window.confirm(`Are you sure you want to archive "${requirement.name}"?`)) {
        await archiveMutation.mutateAsync({
          organizationId,
          requirementId: requirement.id,
        })
      }
    },
    [organizationId, archiveMutation]
  )

  // Table columns
  const columns = useMemo<ColumnDef<ComplianceRequirement>[]>(
    () => [
      {
        accessorKey: 'code',
        header: 'Code',
        cell: ({ row }) => (
          <Text fontFamily="$mono" fontSize="$3" fontWeight="600">
            {row.original.code}
          </Text>
        ),
      },
      {
        accessorKey: 'name',
        header: 'Name',
        cell: ({ row }) => (
          <XStack alignItems="center" gap="$2">
            <Text fontWeight="600">{row.original.name}</Text>
            {row.original.is_template && (
              <Text
                fontSize="$1"
                backgroundColor="$purple2"
                color="$purple10"
                paddingHorizontal="$2"
                paddingVertical="$1"
                borderRadius="$2"
              >
                Template
              </Text>
            )}
          </XStack>
        ),
      },
      {
        accessorKey: 'type',
        header: 'Type',
        cell: ({ row }) => <Text fontSize="$3">{TYPE_LABELS[row.original.type]}</Text>,
      },
      {
        accessorKey: 'status',
        header: 'Status',
        cell: ({ row }) => {
          const statusColors = STATUS_COLORS[row.original.status]
          return (
            <Text
              paddingHorizontal="$2"
              paddingVertical="$1"
              borderRadius={9999}
              fontSize="$1"
              fontWeight="600"
              backgroundColor={statusColors.bg}
              color={statusColors.color}
            >
              {row.original.status}
            </Text>
          )
        },
      },
      {
        accessorKey: 'effective_date',
        header: 'Effective',
        cell: ({ row }) => (
          <Text fontSize="$3" color="$gray11">
            {new Date(row.original.effective_date).toLocaleDateString()}
          </Text>
        ),
      },
      {
        accessorKey: 'current_version',
        header: 'Version',
        cell: ({ row }) => (
          <Text fontSize="$3" color="$gray10">v{row.original.current_version}</Text>
        ),
      },
      {
        id: 'actions',
        header: '',
        cell: ({ row }) => (
          <XStack alignItems="center" gap="$1">
            <Button
              unstyled
              padding="$1.5"
              color="$gray11"
              hoverStyle={{ color: '$blue10', backgroundColor: '$blue2' }}
              borderRadius="$2"
              onPress={() => onEdit(row.original)}
              title="Edit"
            >
              <Edit size={16} />
            </Button>
            <Button
              unstyled
              padding="$1.5"
              color="$gray11"
              hoverStyle={{ color: '$green10', backgroundColor: '$green2' }}
              borderRadius="$2"
              onPress={() => onViewDependencies(row.original)}
              title="View Dependencies"
            >
              <Eye size={16} />
            </Button>
            <Button
              unstyled
              padding="$1.5"
              color="$gray11"
              hoverStyle={{ color: '$purple10', backgroundColor: '$purple2' }}
              borderRadius="$2"
              onPress={() => onViewVersions(row.original)}
              title="Version History"
            >
              <MoreVertical size={16} />
            </Button>
            {row.original.status !== 'archived' && (
              <Button
                unstyled
                padding="$1.5"
                color="$gray11"
                hoverStyle={{ color: '$red10', backgroundColor: '$red2' }}
                borderRadius="$2"
                onPress={() => handleArchive(row.original)}
                title="Archive"
              >
                <Archive size={16} />
              </Button>
            )}
          </XStack>
        ),
      },
    ],
    [onEdit, onViewDependencies, onViewVersions, handleArchive]
  )

  // Table instance
  const table = useReactTable({
    data: data?.data ?? [],
    columns,
    state: { sorting },
    onSortingChange: setSorting,
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel(),
    manualPagination: true,
    manualSorting: true,
  })

  const pagination = data?.pagination
  const hasFilters = !!search || !!typeFilter || !!statusFilter

  // Clear filters
  const clearFilters = useCallback(() => {
    setSearch('')
    setTypeFilter('')
    setStatusFilter('')
    setPage(1)
  }, [])

  return (
    <YStack gap="$4">
      {/* Header */}
      <XStack alignItems="center" justifyContent="space-between">
        <XStack alignItems="center" gap="$2">
          <H2 fontWeight="600">Compliance Requirements</H2>
          {isFetching && <LoadingSpinner size="sm" />}
        </XStack>
        <XStack alignItems="center" gap="$2">
          <Button
            unstyled
            padding="$2"
            color="$gray11"
            hoverStyle={{ color: '$gray12', backgroundColor: '$gray2' }}
            borderRadius="$2"
            onPress={() => refetch()}
            title="Refresh"
          >
            <RefreshCcw size={18} />
          </Button>
          <Button onPress={onCreateNew}>
            <XStack alignItems="center" gap="$1">
              <Plus size={16} />
              <Text>New Requirement</Text>
            </XStack>
          </Button>
        </XStack>
      </XStack>

      {/* Search and Filters */}
      <XStack alignItems="center" gap="$4">
        <XStack position="relative" flex={1} maxWidth="28rem">
          <YStack
            position="absolute"
            left="$3"
            top="50%"
            zIndex={1}
            pointerEvents="none"
          >
            <Search size={18} style={{ color: 'var(--color-gray-10)' }} />
          </YStack>
          <Input
            flex={1}
            paddingLeft="$10"
            paddingRight="$4"
            paddingVertical="$2"
            borderWidth={1}
            borderColor="$gray8"
            borderRadius="$4"
            placeholder="Search by code, name, or description..."
            value={search}
            onChange={(e) => {
              setSearch(e.target.value)
              setPage(1)
            }}
          />
        </XStack>

        <Button
          unstyled
          flexDirection="row"
          alignItems="center"
          gap="$2"
          paddingHorizontal="$3"
          paddingVertical="$2"
          borderWidth={1}
          borderRadius="$4"
          borderColor={hasFilters ? '$blue8' : '$gray8'}
          backgroundColor={hasFilters ? '$blue2' : 'transparent'}
          color={hasFilters ? '$blue11' : '$color12'}
          hoverStyle={{ backgroundColor: '$gray2' }}
          onPress={() => setShowFilters(!showFilters)}
        >
          <Filter size={18} />
          <Text>Filters</Text>
          {hasFilters && (
            <Text
              backgroundColor="$blue10"
              color="white"
              fontSize="$1"
              paddingHorizontal="$1.5"
              paddingVertical="$1"
              borderRadius={9999}
            >
              {[typeFilter, statusFilter].filter(Boolean).length}
            </Text>
          )}
        </Button>

        {hasFilters && (
          <Button
            unstyled
            flexDirection="row"
            alignItems="center"
            gap="$1"
            fontSize="$3"
            color="$gray11"
            hoverStyle={{ color: '$gray12' }}
            onPress={clearFilters}
          >
            <X size={14} />
            <Text>Clear</Text>
          </Button>
        )}
      </XStack>

      {/* Filter Panel */}
      {showFilters && (
        <XStack alignItems="center" gap="$4" padding="$4" backgroundColor="$gray2" borderRadius="$4">
          <XStack alignItems="center" gap="$2">
            <Text fontSize="$3" fontWeight="600" color="$color11">Type:</Text>
            <select
              value={typeFilter}
              onChange={(e) => {
                setTypeFilter(e.target.value as CoverageType | '')
                setPage(1)
              }}
              style={{
                padding: '6px 12px',
                border: '1px solid var(--color-gray-8)',
                borderRadius: '6px',
                fontSize: '14px',
              }}
            >
              <option value="">All Types</option>
              {COVERAGE_TYPE_OPTIONS.map((opt) => (
                <option key={opt.value} value={opt.value}>
                  {opt.label}
                </option>
              ))}
            </select>
          </XStack>

          <XStack alignItems="center" gap="$2">
            <Text fontSize="$3" fontWeight="600" color="$color11">Status:</Text>
            <select
              value={statusFilter}
              onChange={(e) => {
                setStatusFilter(e.target.value as RequirementStatus | '')
                setPage(1)
              }}
              style={{
                padding: '6px 12px',
                border: '1px solid var(--color-gray-8)',
                borderRadius: '6px',
                fontSize: '14px',
              }}
            >
              <option value="">All Statuses</option>
              {STATUS_OPTIONS.map((opt) => (
                <option key={opt.value} value={opt.value}>
                  {opt.label}
                </option>
              ))}
            </select>
          </XStack>
        </XStack>
      )}

      {/* Table */}
      {isLoading ? (
        <XStack alignItems="center" justifyContent="center" paddingVertical="$12">
          <LoadingSpinner />
          <Text marginLeft="$2" color="$gray11">Loading requirements...</Text>
        </XStack>
      ) : (
        <YStack borderWidth={1} borderColor="$gray6" borderRadius="$4" overflow="hidden">
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead style={{ backgroundColor: 'var(--color-gray-2)', borderBottom: '1px solid var(--color-gray-6)' }}>
              {table.getHeaderGroups().map((headerGroup) => (
                <tr key={headerGroup.id}>
                  {headerGroup.headers.map((header) => (
                    <th
                      key={header.id}
                      style={{
                        padding: '12px 16px',
                        textAlign: 'left',
                        fontSize: '14px',
                        fontWeight: 600,
                        color: 'var(--color-gray-12)',
                        cursor: header.column.getCanSort() ? 'pointer' : 'default',
                        userSelect: header.column.getCanSort() ? 'none' : 'auto',
                      }}
                      onClick={header.column.getToggleSortingHandler()}
                      onMouseEnter={(e) => {
                        if (header.column.getCanSort()) {
                          e.currentTarget.style.backgroundColor = 'var(--color-gray-3)'
                        }
                      }}
                      onMouseLeave={(e) => {
                        if (header.column.getCanSort()) {
                          e.currentTarget.style.backgroundColor = 'var(--color-gray-2)'
                        }
                      }}
                    >
                      <XStack alignItems="center" gap="$1">
                        {flexRender(header.column.columnDef.header, header.getContext())}
                        {header.column.getIsSorted() === 'asc' && <ChevronUp size={14} />}
                        {header.column.getIsSorted() === 'desc' && <ChevronDown size={14} />}
                      </XStack>
                    </th>
                  ))}
                </tr>
              ))}
            </thead>
            <tbody>
              {table.getRowModel().rows.length === 0 ? (
                <tr>
                  <td colSpan={columns.length} style={{ padding: '48px 16px', textAlign: 'center', color: 'var(--color-gray-11)' }}>
                    {hasFilters
                      ? 'No requirements match your filters'
                      : 'No compliance requirements yet'}
                  </td>
                </tr>
              ) : (
                table.getRowModel().rows.map((row) => (
                  <tr
                    key={row.id}
                    style={{
                      borderBottom: '1px solid var(--color-gray-4)',
                    }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.backgroundColor = 'var(--color-gray-2)'
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.backgroundColor = 'transparent'
                    }}
                  >
                    {row.getVisibleCells().map((cell) => (
                      <td key={cell.id} style={{ padding: '12px 16px' }}>
                        {flexRender(cell.column.columnDef.cell, cell.getContext())}
                      </td>
                    ))}
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </YStack>
      )}

      {/* Pagination */}
      {pagination && pagination.totalPages > 1 && (
        <XStack alignItems="center" justifyContent="space-between">
          <Text fontSize="$3" color="$gray11">
            Showing {(page - 1) * 20 + 1} to {Math.min(page * 20, pagination.total)} of{' '}
            {pagination.total} requirements
          </Text>
          <XStack alignItems="center" gap="$2">
            <Button
              unstyled
              padding="$2"
              borderWidth={1}
              borderColor="$gray8"
              borderRadius="$2"
              hoverStyle={{ backgroundColor: '$gray2' }}
              opacity={page === 1 ? 0.5 : 1}
              cursor={page === 1 ? 'not-allowed' : 'pointer'}
              disabled={page === 1}
              onPress={() => setPage((p) => Math.max(1, p - 1))}
            >
              <ChevronLeft size={18} />
            </Button>
            <Text fontSize="$3" color="$gray11">
              Page {page} of {pagination.totalPages}
            </Text>
            <Button
              unstyled
              padding="$2"
              borderWidth={1}
              borderColor="$gray8"
              borderRadius="$2"
              hoverStyle={{ backgroundColor: '$gray2' }}
              opacity={page === pagination.totalPages ? 0.5 : 1}
              cursor={page === pagination.totalPages ? 'not-allowed' : 'pointer'}
              disabled={page === pagination.totalPages}
              onPress={() => setPage((p) => Math.min(pagination.totalPages, p + 1))}
            >
              <ChevronRight size={18} />
            </Button>
          </XStack>
        </XStack>
      )}
    </YStack>
  )
}

export default RequirementsList
