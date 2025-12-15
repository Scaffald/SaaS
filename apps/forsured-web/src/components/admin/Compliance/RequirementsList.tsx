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
  useComplianceRequirements,
  useArchiveComplianceRequirement,
  type ComplianceRequirement,
  type CoverageType,
  type RequirementStatus,
} from '../../../hooks/useComplianceRequirements'
import { Badge } from '../../Common/Badge'
import { Button } from '../../Common/Button'
import { Input } from '../../Common/Input'
import { Select } from '../../Common/Select'
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

const STATUS_COLORS: Record<RequirementStatus, string> = {
  active: 'bg-green-100 text-green-800',
  draft: 'bg-yellow-100 text-yellow-800',
  archived: 'bg-gray-100 text-gray-800',
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
          <span className="font-mono text-sm font-medium">{row.original.code}</span>
        ),
      },
      {
        accessorKey: 'name',
        header: 'Name',
        cell: ({ row }) => (
          <div>
            <span className="font-medium">{row.original.name}</span>
            {row.original.is_template && (
              <span className="ml-2 text-xs bg-purple-100 text-purple-800 px-2 py-0.5 rounded">
                Template
              </span>
            )}
          </div>
        ),
      },
      {
        accessorKey: 'type',
        header: 'Type',
        cell: ({ row }) => <span className="text-sm">{TYPE_LABELS[row.original.type]}</span>,
      },
      {
        accessorKey: 'status',
        header: 'Status',
        cell: ({ row }) => (
          <span
            className={`px-2 py-1 rounded-full text-xs font-medium ${STATUS_COLORS[row.original.status]}`}
          >
            {row.original.status}
          </span>
        ),
      },
      {
        accessorKey: 'effective_date',
        header: 'Effective',
        cell: ({ row }) => (
          <span className="text-sm text-gray-600">
            {new Date(row.original.effective_date).toLocaleDateString()}
          </span>
        ),
      },
      {
        accessorKey: 'current_version',
        header: 'Version',
        cell: ({ row }) => (
          <span className="text-sm text-gray-500">v{row.original.current_version}</span>
        ),
      },
      {
        id: 'actions',
        header: '',
        cell: ({ row }) => (
          <div className="flex items-center gap-1">
            <button
              onClick={() => onEdit(row.original)}
              className="p-1.5 text-gray-500 hover:text-blue-600 hover:bg-blue-50 rounded"
              title="Edit"
            >
              <Edit size={16} />
            </button>
            <button
              onClick={() => onViewDependencies(row.original)}
              className="p-1.5 text-gray-500 hover:text-green-600 hover:bg-green-50 rounded"
              title="View Dependencies"
            >
              <Eye size={16} />
            </button>
            <button
              onClick={() => onViewVersions(row.original)}
              className="p-1.5 text-gray-500 hover:text-purple-600 hover:bg-purple-50 rounded"
              title="Version History"
            >
              <MoreVertical size={16} />
            </button>
            {row.original.status !== 'archived' && (
              <button
                onClick={() => handleArchive(row.original)}
                className="p-1.5 text-gray-500 hover:text-red-600 hover:bg-red-50 rounded"
                title="Archive"
              >
                <Archive size={16} />
              </button>
            )}
          </div>
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
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <h2 className="text-lg font-semibold">Compliance Requirements</h2>
          {isFetching && <LoadingSpinner size="sm" />}
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => refetch()}
            className="p-2 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded"
            title="Refresh"
          >
            <RefreshCcw size={18} />
          </button>
          <Button onClick={onCreateNew}>
            <Plus size={16} className="mr-1" />
            New Requirement
          </Button>
        </div>
      </div>

      {/* Search and Filters */}
      <div className="flex items-center gap-4">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
          <input
            type="text"
            placeholder="Search by code, name, or description..."
            value={search}
            onChange={(e) => {
              setSearch(e.target.value)
              setPage(1)
            }}
            className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>

        <button
          onClick={() => setShowFilters(!showFilters)}
          className={`flex items-center gap-2 px-3 py-2 border rounded-lg ${
            hasFilters
              ? 'border-blue-500 bg-blue-50 text-blue-700'
              : 'border-gray-300 hover:bg-gray-50'
          }`}
        >
          <Filter size={18} />
          Filters
          {hasFilters && (
            <span className="bg-blue-500 text-white text-xs px-1.5 py-0.5 rounded-full">
              {[typeFilter, statusFilter].filter(Boolean).length}
            </span>
          )}
        </button>

        {hasFilters && (
          <button
            onClick={clearFilters}
            className="flex items-center gap-1 text-sm text-gray-500 hover:text-gray-700"
          >
            <X size={14} />
            Clear
          </button>
        )}
      </div>

      {/* Filter Panel */}
      {showFilters && (
        <div className="flex items-center gap-4 p-4 bg-gray-50 rounded-lg">
          <div className="flex items-center gap-2">
            <label className="text-sm font-medium text-gray-700">Type:</label>
            <select
              value={typeFilter}
              onChange={(e) => {
                setTypeFilter(e.target.value as CoverageType | '')
                setPage(1)
              }}
              className="px-3 py-1.5 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="">All Types</option>
              {COVERAGE_TYPE_OPTIONS.map((opt) => (
                <option key={opt.value} value={opt.value}>
                  {opt.label}
                </option>
              ))}
            </select>
          </div>

          <div className="flex items-center gap-2">
            <label className="text-sm font-medium text-gray-700">Status:</label>
            <select
              value={statusFilter}
              onChange={(e) => {
                setStatusFilter(e.target.value as RequirementStatus | '')
                setPage(1)
              }}
              className="px-3 py-1.5 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="">All Statuses</option>
              {STATUS_OPTIONS.map((opt) => (
                <option key={opt.value} value={opt.value}>
                  {opt.label}
                </option>
              ))}
            </select>
          </div>
        </div>
      )}

      {/* Table */}
      {isLoading ? (
        <div className="flex items-center justify-center py-12">
          <LoadingSpinner />
          <span className="ml-2 text-gray-500">Loading requirements...</span>
        </div>
      ) : (
        <div className="border border-gray-200 rounded-lg overflow-hidden">
          <table className="w-full">
            <thead className="bg-gray-50 border-b border-gray-200">
              {table.getHeaderGroups().map((headerGroup) => (
                <tr key={headerGroup.id}>
                  {headerGroup.headers.map((header) => (
                    <th
                      key={header.id}
                      className={`px-4 py-3 text-left text-sm font-medium text-gray-700 ${
                        header.column.getCanSort()
                          ? 'cursor-pointer select-none hover:bg-gray-100'
                          : ''
                      }`}
                      onClick={header.column.getToggleSortingHandler()}
                    >
                      <div className="flex items-center gap-1">
                        {flexRender(header.column.columnDef.header, header.getContext())}
                        {header.column.getIsSorted() === 'asc' && <ChevronUp size={14} />}
                        {header.column.getIsSorted() === 'desc' && <ChevronDown size={14} />}
                      </div>
                    </th>
                  ))}
                </tr>
              ))}
            </thead>
            <tbody>
              {table.getRowModel().rows.length === 0 ? (
                <tr>
                  <td colSpan={columns.length} className="px-4 py-12 text-center text-gray-500">
                    {hasFilters
                      ? 'No requirements match your filters'
                      : 'No compliance requirements yet'}
                  </td>
                </tr>
              ) : (
                table.getRowModel().rows.map((row) => (
                  <tr key={row.id} className="border-b border-gray-100 hover:bg-gray-50">
                    {row.getVisibleCells().map((cell) => (
                      <td key={cell.id} className="px-4 py-3">
                        {flexRender(cell.column.columnDef.cell, cell.getContext())}
                      </td>
                    ))}
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      )}

      {/* Pagination */}
      {pagination && pagination.totalPages > 1 && (
        <div className="flex items-center justify-between">
          <span className="text-sm text-gray-600">
            Showing {(page - 1) * 20 + 1} to {Math.min(page * 20, pagination.total)} of{' '}
            {pagination.total} requirements
          </span>
          <div className="flex items-center gap-2">
            <button
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              disabled={page === 1}
              className="p-2 border border-gray-300 rounded hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <ChevronLeft size={18} />
            </button>
            <span className="text-sm text-gray-600">
              Page {page} of {pagination.totalPages}
            </span>
            <button
              onClick={() => setPage((p) => Math.min(pagination.totalPages, p + 1))}
              disabled={page === pagination.totalPages}
              className="p-2 border border-gray-300 rounded hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <ChevronRight size={18} />
            </button>
          </div>
        </div>
      )}
    </div>
  )
}

export default RequirementsList
