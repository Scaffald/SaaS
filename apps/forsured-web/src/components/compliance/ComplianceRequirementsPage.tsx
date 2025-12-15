/**
 * Compliance Requirements Page
 * REQ-2, TASK-13: Requirements List View with Filtering and Search
 *
 * Admin page for managing compliance requirements with:
 * - Search and filtering
 * - Sortable columns
 * - Pagination
 * - Status management
 * - Template vs requirement distinction
 */

import { useState, useMemo, useCallback, useEffect } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import {
  Search,
  Filter,
  Plus,
  ChevronDown,
  ChevronUp,
  X,
  FileText,
  Copy,
  Archive,
  RotateCcw,
  MoreHorizontal,
  CheckCircle,
  Download,
  Upload,
} from 'lucide-react';
import { useComplianceRequirements, type CoverageType, type RequirementStatus } from '../../hooks/useComplianceRequirements';
import { useUser } from '../../contexts/UserContext';
import Button from '../Common/Button';
import { DashboardSkeleton } from '../Common/SkeletonLoader';
import EmptyState from '../Common/EmptyState';
import RequirementStatusBadge from './RequirementStatusBadge';
import RequirementTypeBadge from './RequirementTypeBadge';

// Filter options
const coverageTypes: { value: CoverageType; label: string }[] = [
  { value: 'general_liability', label: 'General Liability' },
  { value: 'umbrella_liability', label: 'Umbrella Liability' },
  { value: 'auto_liability', label: 'Auto Liability' },
  { value: 'workers_comp', label: 'Workers Comp' },
  { value: 'professional_liability', label: 'Professional Liability' },
  { value: 'excess_liability', label: 'Excess Liability' },
];

const requirementStatuses: { value: RequirementStatus; label: string }[] = [
  { value: 'draft', label: 'Draft' },
  { value: 'pending_approval', label: 'Pending Approval' },
  { value: 'active', label: 'Active' },
  { value: 'deprecated', label: 'Deprecated' },
  { value: 'archived', label: 'Archived' },
];

type ViewType = 'all' | 'templates' | 'requirements';
type SortField = 'code' | 'name' | 'type' | 'status' | 'effective_date' | 'created_at';

interface FilterState {
  types: CoverageType[];
  statuses: RequirementStatus[];
  search: string;
  includeArchived: boolean;
}

export function ComplianceRequirementsPage() {
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const { currentUser } = useUser();

  // Get organization ID from current user context
  const organizationId = currentUser?.organization_id || '';

  // Initialize state from URL params
  const getInitialView = (): ViewType => {
    const param = searchParams.get('view');
    if (param && ['all', 'templates', 'requirements'].includes(param)) {
      return param as ViewType;
    }
    return 'all';
  };

  const getInitialFilters = (): FilterState => {
    return {
      types: searchParams.getAll('type') as CoverageType[],
      statuses: searchParams.getAll('status') as RequirementStatus[],
      search: searchParams.get('search') || '',
      includeArchived: searchParams.get('includeArchived') === 'true',
    };
  };

  const getInitialSort = (): { field: SortField; order: 'asc' | 'desc' } => {
    const field = (searchParams.get('sortBy') || 'created_at') as SortField;
    const order = (searchParams.get('sortOrder') || 'desc') as 'asc' | 'desc';
    return { field, order };
  };

  // State
  const [view, setView] = useState<ViewType>(getInitialView());
  const [filters, setFilters] = useState<FilterState>(getInitialFilters());
  const [sort, setSort] = useState(getInitialSort());
  const [page, setPage] = useState(Number(searchParams.get('page')) || 1);
  const [showFilters, setShowFilters] = useState(
    filters.types.length > 0 || filters.statuses.length > 0 || filters.includeArchived
  );
  const [selectedIds, setSelectedIds] = useState<string[]>([]);

  const pageSize = 20;

  // Determine isTemplate filter based on view
  const isTemplateFilter = view === 'templates' ? true : view === 'requirements' ? false : undefined;

  // Fetch requirements
  const {
    data,
    isLoading,
    error,
  } = useComplianceRequirements({
    organizationId,
    page,
    pageSize,
    types: filters.types.length > 0 ? filters.types : undefined,
    statuses: filters.statuses.length > 0 ? filters.statuses : undefined,
    search: filters.search || undefined,
    sortBy: sort.field,
    sortOrder: sort.order,
    includeArchived: filters.includeArchived,
    isTemplate: isTemplateFilter,
  });

  const requirements = data?.requirements || [];
  const totalCount = data?.pagination?.total || 0;
  const totalPages = data?.pagination?.totalPages || 1;

  // Update URL when filters change
  useEffect(() => {
    const params = new URLSearchParams();

    if (view !== 'all') params.set('view', view);
    if (filters.search) params.set('search', filters.search);
    if (filters.includeArchived) params.set('includeArchived', 'true');
    if (sort.field !== 'created_at') params.set('sortBy', sort.field);
    if (sort.order !== 'desc') params.set('sortOrder', sort.order);
    if (page > 1) params.set('page', String(page));

    filters.types.forEach((t) => params.append('type', t));
    filters.statuses.forEach((s) => params.append('status', s));

    const newSearch = params.toString();
    const currentSearch = searchParams.toString();
    if (newSearch !== currentSearch) {
      setSearchParams(params, { replace: true });
    }
  }, [view, filters, sort, page, setSearchParams, searchParams]);

  // Handlers
  const handleSearch = useCallback((value: string) => {
    setFilters((prev) => ({ ...prev, search: value }));
    setPage(1);
  }, []);

  const handleTypeToggle = useCallback((type: CoverageType) => {
    setFilters((prev) => ({
      ...prev,
      types: prev.types.includes(type)
        ? prev.types.filter((t) => t !== type)
        : [...prev.types, type],
    }));
    setPage(1);
  }, []);

  const handleStatusToggle = useCallback((status: RequirementStatus) => {
    setFilters((prev) => ({
      ...prev,
      statuses: prev.statuses.includes(status)
        ? prev.statuses.filter((s) => s !== status)
        : [...prev.statuses, status],
    }));
    setPage(1);
  }, []);

  const handleSort = useCallback((field: SortField) => {
    setSort((prev) => ({
      field,
      order: prev.field === field && prev.order === 'asc' ? 'desc' : 'asc',
    }));
    setPage(1);
  }, []);

  const clearFilters = useCallback(() => {
    setFilters({
      types: [],
      statuses: [],
      search: '',
      includeArchived: false,
    });
    setPage(1);
  }, []);

  const activeFilterCount = useMemo(() => {
    return [
      filters.types.length > 0,
      filters.statuses.length > 0,
      filters.includeArchived,
    ].filter(Boolean).length;
  }, [filters]);

  const handleCreateRequirement = () => {
    navigate('/admin/compliance/requirements/new', {
      state: { isTemplate: view === 'templates' },
    });
  };

  const handleRowClick = (id: string) => {
    navigate(`/admin/compliance/requirements/${id}`);
  };

  const handleSelectAll = useCallback(() => {
    if (selectedIds.length === requirements.length) {
      setSelectedIds([]);
    } else {
      setSelectedIds(requirements.map((r) => r.id));
    }
  }, [selectedIds.length, requirements]);

  const handleSelectRow = useCallback((id: string) => {
    setSelectedIds((prev) =>
      prev.includes(id) ? prev.filter((i) => i !== id) : [...prev, id]
    );
  }, []);

  // Compute view counts (approximate based on current data)
  const viewCounts = useMemo(() => ({
    all: totalCount,
    templates: requirements.filter((r) => r.is_template).length,
    requirements: requirements.filter((r) => !r.is_template).length,
  }), [totalCount, requirements]);

  // Format date for display
  const formatDate = (dateString: string | null) => {
    if (!dateString) return '—';
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  };

  // Column sort indicator
  const SortIndicator = ({ field }: { field: SortField }) => {
    if (sort.field !== field) return null;
    return sort.order === 'asc' ? (
      <ChevronUp size={14} className="ml-1" />
    ) : (
      <ChevronDown size={14} className="ml-1" />
    );
  };

  if (!organizationId) {
    return (
      <div className="p-8 text-center">
        <p className="text-text-secondary">Please select an organization to manage compliance requirements.</p>
      </div>
    );
  }

  if (isLoading) {
    return <DashboardSkeleton />;
  }

  if (error) {
    return (
      <div className="p-8 text-center">
        <p className="text-error-600">Error loading requirements: {error.message}</p>
        <Button variant="secondary" className="mt-4" onClick={() => window.location.reload()}>
          Retry
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-display text-3xl font-bold text-text-primary">
            Compliance Requirements
          </h1>
          <p className="text-text-secondary text-lg mt-1">
            Manage insurance compliance requirements and templates
          </p>
        </div>
        <div className="flex items-center gap-3">
          <Button variant="secondary" onClick={() => navigate('/admin/compliance/requirements/import')}>
            <Upload size={18} className="mr-2" />
            Import
          </Button>
          <Button variant="secondary" onClick={() => navigate('/admin/compliance/requirements/export')}>
            <Download size={18} className="mr-2" />
            Export
          </Button>
          <Button variant="primary" onClick={handleCreateRequirement}>
            <Plus size={18} className="mr-2" />
            Create {view === 'templates' ? 'Template' : 'Requirement'}
          </Button>
        </div>
      </div>

      {/* View Tabs */}
      <div className="flex items-center border-b border-border">
        <button
          onClick={() => { setView('all'); setPage(1); }}
          className={`flex items-center space-x-2 px-4 py-3 text-sm font-medium border-b-2 transition-colors ${
            view === 'all'
              ? 'border-primary-500 text-primary-600'
              : 'border-transparent text-text-secondary hover:text-text-primary hover:border-border'
          }`}
        >
          <FileText size={18} />
          <span>All</span>
          <span className={`ml-1 px-2 py-0.5 text-xs rounded-full ${
            view === 'all' ? 'bg-primary-100 text-primary-700' : 'bg-gray-100 text-text-secondary'
          }`}>
            {viewCounts.all}
          </span>
        </button>
        <button
          onClick={() => { setView('templates'); setPage(1); }}
          className={`flex items-center space-x-2 px-4 py-3 text-sm font-medium border-b-2 transition-colors ${
            view === 'templates'
              ? 'border-primary-500 text-primary-600'
              : 'border-transparent text-text-secondary hover:text-text-primary hover:border-border'
          }`}
        >
          <Copy size={18} />
          <span>Templates</span>
        </button>
        <button
          onClick={() => { setView('requirements'); setPage(1); }}
          className={`flex items-center space-x-2 px-4 py-3 text-sm font-medium border-b-2 transition-colors ${
            view === 'requirements'
              ? 'border-primary-500 text-primary-600'
              : 'border-transparent text-text-secondary hover:text-text-primary hover:border-border'
          }`}
        >
          <CheckCircle size={18} />
          <span>Requirements</span>
        </button>
      </div>

      {/* Search and Filters */}
      <div className="bg-surface rounded-lg shadow-sm border border-border p-4 space-y-4">
        <div className="flex items-center space-x-3">
          <div className="flex-1 relative">
            <Search
              className="absolute left-3 top-1/2 transform -translate-y-1/2 text-text-tertiary"
              size={20}
            />
            <input
              type="text"
              placeholder="Search by code, name, or description..."
              value={filters.search}
              onChange={(e) => handleSearch(e.target.value)}
              className="w-full pl-10 pr-4 py-2.5 bg-bg-primary border border-border rounded-lg text-sm text-text-primary placeholder-text-tertiary focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
            />
          </div>
          <button
            onClick={() => setShowFilters(!showFilters)}
            className={`flex items-center space-x-2 px-4 py-2.5 border rounded-lg text-sm font-medium transition-colors ${
              showFilters
                ? 'bg-primary-50 border-primary-500 text-primary-700'
                : 'bg-surface border-border text-text-secondary hover:bg-bg-secondary'
            }`}
          >
            <Filter size={18} />
            <span>Filters</span>
            {activeFilterCount > 0 && (
              <span className="ml-1 px-2 py-0.5 bg-primary-500 text-white text-xs rounded-full">
                {activeFilterCount}
              </span>
            )}
          </button>
        </div>

        {/* Expanded Filters */}
        {showFilters && (
          <div className="border-t border-border pt-4 space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {/* Coverage Type Filter */}
              <div>
                <label className="block text-xs font-medium text-text-secondary mb-2">
                  Coverage Type
                </label>
                <div className="flex flex-wrap gap-2">
                  {coverageTypes.map((type) => (
                    <button
                      key={type.value}
                      onClick={() => handleTypeToggle(type.value)}
                      className={`px-2 py-1 text-xs rounded border transition-colors ${
                        filters.types.includes(type.value)
                          ? 'bg-primary-50 border-primary-500 text-primary-700'
                          : 'bg-bg-primary border-border text-text-secondary hover:border-primary-300'
                      }`}
                    >
                      {type.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Status Filter */}
              <div>
                <label className="block text-xs font-medium text-text-secondary mb-2">
                  Status
                </label>
                <div className="flex flex-wrap gap-2">
                  {requirementStatuses.map((status) => (
                    <button
                      key={status.value}
                      onClick={() => handleStatusToggle(status.value)}
                      className={`px-2 py-1 text-xs rounded border transition-colors ${
                        filters.statuses.includes(status.value)
                          ? 'bg-primary-50 border-primary-500 text-primary-700'
                          : 'bg-bg-primary border-border text-text-secondary hover:border-primary-300'
                      }`}
                    >
                      {status.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Include Archived Toggle */}
              <div>
                <label className="block text-xs font-medium text-text-secondary mb-2">
                  Options
                </label>
                <label className="flex items-center space-x-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={filters.includeArchived}
                    onChange={(e) => {
                      setFilters((prev) => ({ ...prev, includeArchived: e.target.checked }));
                      setPage(1);
                    }}
                    className="rounded border-border text-primary-500 focus:ring-primary-500"
                  />
                  <span className="text-sm text-text-secondary">Include archived</span>
                </label>
              </div>
            </div>

            {activeFilterCount > 0 && (
              <button
                onClick={clearFilters}
                className="flex items-center space-x-2 text-sm text-text-secondary hover:text-text-primary transition-colors"
              >
                <X size={16} />
                <span>Clear all filters</span>
              </button>
            )}
          </div>
        )}

        {/* Results count */}
        <div className="flex items-center justify-between border-t border-border pt-4">
          <div className="text-sm text-text-secondary">
            Showing{' '}
            <span className="font-semibold text-text-primary">
              {requirements.length}
            </span>{' '}
            of {totalCount} requirements
          </div>
          {selectedIds.length > 0 && (
            <div className="flex items-center gap-2">
              <span className="text-sm text-text-secondary">
                {selectedIds.length} selected
              </span>
              <Button size="sm" variant="secondary">
                <Archive size={14} className="mr-1" />
                Archive Selected
              </Button>
            </div>
          )}
        </div>
      </div>

      {/* Requirements Table */}
      {requirements.length === 0 ? (
        <EmptyState
          icon={<FileText size={48} />}
          title={filters.search || activeFilterCount > 0 ? 'No requirements found' : 'No requirements yet'}
          description={
            filters.search || activeFilterCount > 0
              ? 'Try adjusting your search or filters'
              : 'Create your first compliance requirement to get started'
          }
          primaryAction={
            filters.search || activeFilterCount > 0
              ? { label: 'Clear Filters', onClick: clearFilters }
              : { label: 'Create Requirement', onClick: handleCreateRequirement }
          }
        />
      ) : (
        <div className="bg-surface rounded-lg shadow-sm border border-border overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-bg-secondary border-b border-border">
                <tr>
                  <th className="w-10 px-4 py-3">
                    <input
                      type="checkbox"
                      checked={selectedIds.length === requirements.length && requirements.length > 0}
                      onChange={handleSelectAll}
                      className="rounded border-border text-primary-500 focus:ring-primary-500"
                    />
                  </th>
                  <th
                    className="px-4 py-3 text-left text-xs font-medium text-text-secondary uppercase tracking-wider cursor-pointer hover:bg-bg-primary"
                    onClick={() => handleSort('code')}
                  >
                    <div className="flex items-center">
                      Code
                      <SortIndicator field="code" />
                    </div>
                  </th>
                  <th
                    className="px-4 py-3 text-left text-xs font-medium text-text-secondary uppercase tracking-wider cursor-pointer hover:bg-bg-primary"
                    onClick={() => handleSort('name')}
                  >
                    <div className="flex items-center">
                      Name
                      <SortIndicator field="name" />
                    </div>
                  </th>
                  <th
                    className="px-4 py-3 text-left text-xs font-medium text-text-secondary uppercase tracking-wider cursor-pointer hover:bg-bg-primary"
                    onClick={() => handleSort('type')}
                  >
                    <div className="flex items-center">
                      Type
                      <SortIndicator field="type" />
                    </div>
                  </th>
                  <th
                    className="px-4 py-3 text-left text-xs font-medium text-text-secondary uppercase tracking-wider cursor-pointer hover:bg-bg-primary"
                    onClick={() => handleSort('status')}
                  >
                    <div className="flex items-center">
                      Status
                      <SortIndicator field="status" />
                    </div>
                  </th>
                  <th
                    className="px-4 py-3 text-left text-xs font-medium text-text-secondary uppercase tracking-wider cursor-pointer hover:bg-bg-primary"
                    onClick={() => handleSort('effective_date')}
                  >
                    <div className="flex items-center">
                      Effective Date
                      <SortIndicator field="effective_date" />
                    </div>
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-text-secondary uppercase tracking-wider">
                    Version
                  </th>
                  <th className="w-10 px-4 py-3"></th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {requirements.map((requirement) => (
                  <tr
                    key={requirement.id}
                    className="hover:bg-bg-secondary cursor-pointer transition-colors"
                    onClick={() => handleRowClick(requirement.id)}
                  >
                    <td className="px-4 py-4" onClick={(e) => e.stopPropagation()}>
                      <input
                        type="checkbox"
                        checked={selectedIds.includes(requirement.id)}
                        onChange={() => handleSelectRow(requirement.id)}
                        className="rounded border-border text-primary-500 focus:ring-primary-500"
                      />
                    </td>
                    <td className="px-4 py-4">
                      <div className="flex items-center gap-2">
                        <span className="font-mono text-sm font-medium text-text-primary">
                          {requirement.code}
                        </span>
                        {requirement.is_template && (
                          <span className="px-1.5 py-0.5 text-xs bg-purple-50 text-purple-700 rounded">
                            Template
                          </span>
                        )}
                      </div>
                    </td>
                    <td className="px-4 py-4">
                      <div>
                        <div className="text-sm font-medium text-text-primary">
                          {requirement.name}
                        </div>
                        {requirement.description && (
                          <div className="text-xs text-text-tertiary mt-0.5 truncate max-w-xs">
                            {requirement.description}
                          </div>
                        )}
                      </div>
                    </td>
                    <td className="px-4 py-4">
                      <RequirementTypeBadge type={requirement.type} size="xs" />
                    </td>
                    <td className="px-4 py-4">
                      <RequirementStatusBadge status={requirement.status} size="xs" />
                    </td>
                    <td className="px-4 py-4 text-sm text-text-secondary">
                      {formatDate(requirement.effective_date)}
                    </td>
                    <td className="px-4 py-4 text-sm text-text-tertiary">
                      v{requirement.current_version}
                    </td>
                    <td className="px-4 py-4" onClick={(e) => e.stopPropagation()}>
                      <button className="p-1 rounded hover:bg-bg-primary transition-colors">
                        <MoreHorizontal size={16} className="text-text-tertiary" />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="flex items-center justify-between px-4 py-3 bg-bg-secondary border-t border-border">
              <div className="text-sm text-text-secondary">
                Page {page} of {totalPages}
              </div>
              <div className="flex items-center gap-2">
                <Button
                  size="sm"
                  variant="secondary"
                  onClick={() => setPage((p) => Math.max(1, p - 1))}
                  disabled={page === 1}
                >
                  Previous
                </Button>
                <Button
                  size="sm"
                  variant="secondary"
                  onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                  disabled={page === totalPages}
                >
                  Next
                </Button>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

export default ComplianceRequirementsPage;
