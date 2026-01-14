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

import React, { useState, useMemo, useCallback } from 'react'
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
  Stack,
  Row,
  Text,
  Input,
  Button,
  H2,
  Card,
} from '@unicornlove/beyond-ui'
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

function getStatusColors(status: RequirementStatus): { bg: string; color: string } {
  switch (status) {
    case 'active':
      return { bg: 'var(--color-green-2)', color: 'var(--color-green-10)' }
    case 'draft':
      return { bg: 'var(--color-yellow-2)', color: 'var(--color-yellow-10)' }
    case 'archived':
      return { bg: 'var(--color-gray-2)', color: 'var(--color-gray-10)' }
    default:
      return { bg: 'var(--color-gray-2)', color: 'var(--color-gray-10)' }
  }
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
          <Text style={{ fontFamily: 'monospace', fontSize: 14, fontWeight: 600 }}>
            {row.original.code}
          </Text>
        ),
      },
      {
        accessorKey: 'name',
        header: 'Name',
        cell: ({ row }) => (
          <Row style={{ alignItems: 'center', gap: 8 }}>
            <Text style={{ fontWeight: 600 }}>{row.original.name}</Text>
            {row.original.is_template && (
              <Text
                style={{
                  fontSize: 11,
                  backgroundColor: 'var(--color-purple-2)',
                  color: 'var(--color-purple-10)',
                  paddingLeft: 8,
                  paddingRight: 8,
                  paddingTop: 4,
                  paddingBottom: 4,
                  borderRadius: 6,
                }}
              >
                Template
              </Text>
            )}
          </Row>
        ),
      },
      {
        accessorKey: 'type',
        header: 'Type',
        cell: ({ row }) => <Text style={{ fontSize: 14 }}>{TYPE_LABELS[row.original.type]}</Text>,
      },
      {
        accessorKey: 'status',
        header: 'Status',
        cell: ({ row }) => {
          const statusColors = getStatusColors(row.original.status)
          return (
            <Text
              style={{
                paddingLeft: 8,
                paddingRight: 8,
                paddingTop: 4,
                paddingBottom: 4,
                borderRadius: 9999,
                fontSize: 11,
                fontWeight: 600,
                backgroundColor: statusColors.bg,
                color: statusColors.color,
              }}
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
          <Text style={{ fontSize: 14, color: 'var(--color-gray-11)' }}>
            {new Date(row.original.effective_date).toLocaleDateString()}
          </Text>
        ),
      },
      {
        accessorKey: 'current_version',
        header: 'Version',
        cell: ({ row }) => (
          <Text style={{ fontSize: 14, color: 'var(--color-gray-10)' }}>v{row.original.current_version}</Text>
        ),
      },
      {
        id: 'actions',
        header: '',
        cell: ({ row }) => (
          <Row style={{ alignItems: 'center', gap: 4 }}>
            <Button
              variant="ghost"
              style={{ padding: 6, color: 'var(--color-gray-11)', borderRadius: 6 }}
              onClick={() => onEdit(row.original)}
              title="Edit"
            >
              <Edit size={16} />
            </Button>
            <Button
              variant="ghost"
              style={{ padding: 6, color: 'var(--color-gray-11)', borderRadius: 6 }}
              onClick={() => onViewDependencies(row.original)}
              title="View Dependencies"
            >
              <Eye size={16} />
            </Button>
            <Button
              variant="ghost"
              style={{ padding: 6, color: 'var(--color-gray-11)', borderRadius: 6 }}
              onClick={() => onViewVersions(row.original)}
              title="Version History"
            >
              <MoreVertical size={16} />
            </Button>
            {row.original.status !== 'archived' && (
              <Button
                variant="ghost"
                style={{ padding: 6, color: 'var(--color-gray-11)', borderRadius: 6 }}
                onClick={() => handleArchive(row.original)}
                title="Archive"
              >
                <Archive size={16} />
              </Button>
            )}
          </Row>
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
    <Stack style={{ gap: 16 }}>
      {/* Header */}
      <Row style={{ alignItems: 'center', justifyContent: 'space-between' }}>
        <Row style={{ alignItems: 'center', gap: 8 }}>
          <H2 style={{ fontWeight: 600 }}>Compliance Requirements</H2>
          {isFetching && <LoadingSpinner size="sm" />}
        </Row>
        <Row style={{ alignItems: 'center', gap: 8 }}>
          <Button
            variant="ghost"
            style={{ padding: 8, color: 'var(--color-gray-11)', borderRadius: 6 }}
            onClick={() => refetch()}
            title="Refresh"
          >
            <RefreshCcw size={18} />
          </Button>
          <Button onClick={onCreateNew}>
            <Row style={{ alignItems: 'center', gap: 4 }}>
              <Plus size={16} />
              <Text>New Requirement</Text>
            </Row>
          </Button>
        </Row>
      </Row>

      {/* Search and Filters */}
      <Row style={{ alignItems: 'center', gap: 16 }}>
        <Row style={{ position: 'relative', flex: 1, maxWidth: '28rem' }}>
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
            <Search size={18} style={{ color: 'var(--color-gray-10)' }} />
          </Stack>
          <Input
            style={{
              flex: 1,
              paddingLeft: 40,
              paddingRight: 16,
              paddingTop: 8,
              paddingBottom: 8,
              borderWidth: 1,
              borderColor: 'var(--color-gray-8)',
              borderRadius: 12,
            }}
            placeholder="Search by code, name, or description..."
            value={search}
            onChange={(e) => {
              setSearch(e.target.value)
              setPage(1)
            }}
          />
        </Row>

        <Button
          variant="ghost"
          style={{
            flexDirection: 'row',
            alignItems: 'center',
            gap: 8,
            paddingLeft: 12,
            paddingRight: 12,
            paddingTop: 8,
            paddingBottom: 8,
            borderWidth: 1,
            borderRadius: 12,
            borderColor: hasFilters ? 'var(--color-blue-8)' : 'var(--color-gray-8)',
            backgroundColor: hasFilters ? 'var(--color-blue-2)' : 'transparent',
            color: hasFilters ? 'var(--color-blue-11)' : 'var(--color-12)',
          }}
          onClick={() => setShowFilters(!showFilters)}
        >
          <Filter size={18} />
          <Text>Filters</Text>
          {hasFilters && (
            <Text
              style={{
                backgroundColor: 'var(--color-blue-10)',
                color: 'white',
                fontSize: 11,
                paddingLeft: 6,
                paddingRight: 6,
                paddingTop: 4,
                paddingBottom: 4,
                borderRadius: 9999,
              }}
            >
              {[typeFilter, statusFilter].filter(Boolean).length}
            </Text>
          )}
        </Button>

        {hasFilters && (
          <Button
            variant="ghost"
            style={{
              flexDirection: 'row',
              alignItems: 'center',
              gap: 4,
              fontSize: 14,
              color: 'var(--color-gray-11)',
            }}
            onClick={clearFilters}
          >
            <X size={14} />
            <Text>Clear</Text>
          </Button>
        )}
      </Row>

      {/* Filter Panel */}
      {showFilters && (
        <Row style={{ alignItems: 'center', gap: 16, padding: 16, backgroundColor: 'var(--color-gray-2)', borderRadius: 12 }}>
          <Row style={{ alignItems: 'center', gap: 8 }}>
            <Text style={{ fontSize: 14, fontWeight: 600, color: 'var(--color-11)' }}>Type:</Text>
            <select
              value={typeFilter}
              onChange={(e) => {
                setTypeFilter(e.target.value as CoverageType | '')
                setPage(1)
              }}
              style={{
                padding: '6px 12px',
                border: '1px solid var(--color-gray-8)',
                borderRadius: 6,
                fontSize: 14,
              }}
            >
              <option value="">All Types</option>
              {COVERAGE_TYPE_OPTIONS.map((opt) => (
                <option key={opt.value} value={opt.value}>
                  {opt.label}
                </option>
              ))}
            </select>
          </Row>

          <Row style={{ alignItems: 'center', gap: 8 }}>
            <Text style={{ fontSize: 14, fontWeight: 600, color: 'var(--color-11)' }}>Status:</Text>
            <select
              value={statusFilter}
              onChange={(e) => {
                setStatusFilter(e.target.value as RequirementStatus | '')
                setPage(1)
              }}
              style={{
                padding: '6px 12px',
                border: '1px solid var(--color-gray-8)',
                borderRadius: 6,
                fontSize: 14,
              }}
            >
              <option value="">All Statuses</option>
              {STATUS_OPTIONS.map((opt) => (
                <option key={opt.value} value={opt.value}>
                  {opt.label}
                </option>
              ))}
            </select>
          </Row>
        </Row>
      )}

      {/* Table */}
      {isLoading ? (
        <Row style={{ alignItems: 'center', justifyContent: 'center', paddingTop: 48, paddingBottom: 48 }}>
          <LoadingSpinner />
          <Text style={{ marginLeft: 8, color: 'var(--color-gray-11)' }}>Loading requirements...</Text>
        </Row>
      ) : (
        <Stack style={{ borderWidth: 1, borderColor: 'var(--color-gray-6)', borderRadius: 12, overflow: 'hidden' }}>
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
                        fontSize: 14,
                        fontWeight: 600,
                        color: 'var(--color-gray-12)',
                        cursor: header.column.getCanSort() ? 'pointer' : 'default',
                        userSelect: header.column.getCanSort() ? 'none' : 'auto',
                      }}
                      onClick={header.column.getToggleSortingHandler()}
                    >
                      <Row style={{ alignItems: 'center', gap: 4 }}>
                        {flexRender(header.column.columnDef.header, header.getContext())}
                        {header.column.getIsSorted() === 'asc' && <ChevronUp size={14} />}
                        {header.column.getIsSorted() === 'desc' && <ChevronDown size={14} />}
                      </Row>
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
        </Stack>
      )}

      {/* Pagination */}
      {pagination && pagination.totalPages > 1 && (
        <Row style={{ alignItems: 'center', justifyContent: 'space-between' }}>
          <Text style={{ fontSize: 14, color: 'var(--color-gray-11)' }}>
            Showing {(page - 1) * 20 + 1} to {Math.min(page * 20, pagination.total)} of{' '}
            {pagination.total} requirements
          </Text>
          <Row style={{ alignItems: 'center', gap: 8 }}>
            <Button
              variant="ghost"
              style={{
                padding: 8,
                borderWidth: 1,
                borderColor: 'var(--color-gray-8)',
                borderRadius: 6,
                opacity: page === 1 ? 0.5 : 1,
                cursor: page === 1 ? 'not-allowed' : 'pointer',
              }}
              disabled={page === 1}
              onClick={() => setPage((p) => Math.max(1, p - 1))}
            >
              <ChevronLeft size={18} />
            </Button>
            <Text style={{ fontSize: 14, color: 'var(--color-gray-11)' }}>
              Page {page} of {pagination.totalPages}
            </Text>
            <Button
              variant="ghost"
              style={{
                padding: 8,
                borderWidth: 1,
                borderColor: 'var(--color-gray-8)',
                borderRadius: 6,
                opacity: page === pagination.totalPages ? 0.5 : 1,
                cursor: page === pagination.totalPages ? 'not-allowed' : 'pointer',
              }}
              disabled={page === pagination.totalPages}
              onClick={() => setPage((p) => Math.min(pagination.totalPages, p + 1))}
            >
              <ChevronRight size={18} />
            </Button>
          </Row>
        </Row>
      )}
    </Stack>
  )
}

export default RequirementsList
