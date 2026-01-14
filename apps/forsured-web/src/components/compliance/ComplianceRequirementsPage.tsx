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
  MoreHorizontal,
  CheckCircle,
  Download,
  Upload,
} from 'lucide-react';
import { Stack, Row, Text, Button, Card } from '@unicornlove/beyond-ui';
import { useComplianceRequirements, type CoverageType, type RequirementStatus } from '../../hooks/useComplianceRequirements';
import { useUser } from '../../contexts/UserContext';
import { DashboardSkeleton } from '../Common/SkeletonLoader';
import { EmptyState } from '../../ui/EmptyState';
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
    if (!dateString) return '-';
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
      <ChevronUp size={14} style={{ marginLeft: '4px' }} />
    ) : (
      <ChevronDown size={14} style={{ marginLeft: '4px' }} />
    );
  };

  if (!organizationId) {
    return (
      <Stack style={{ padding: 'var(--space-8)', alignItems: 'center' }}>
        <Text style={{ color: 'var(--color-11)' }}>Please select an organization to manage compliance requirements.</Text>
      </Stack>
    );
  }

  if (isLoading) {
    return <DashboardSkeleton />;
  }

  if (error) {
    return (
      <Stack style={{ padding: 'var(--space-8)', alignItems: 'center' }}>
        <Text style={{ color: 'var(--color-red-9)' }}>Error loading requirements: {error.message}</Text>
        <Button variant="outlined" style={{ marginTop: 'var(--space-4)' }} onClick={() => window.location.reload()}>
          Retry
        </Button>
      </Stack>
    );
  }

  return (
    <Stack style={{ gap: 'var(--space-6)' }}>
      {/* Header */}
      <Row style={{ alignItems: 'center', justifyContent: 'space-between' }}>
        <Stack>
          <h1 style={{ fontSize: 'var(--font-size-10)', fontWeight: 700, color: 'var(--color-12)', margin: 0 }}>
            Compliance Requirements
          </h1>
          <Text style={{ fontSize: 'var(--font-size-6)', color: 'var(--color-11)', marginTop: 4 }}>
            Manage insurance compliance requirements and templates
          </Text>
        </Stack>
        <Row style={{ alignItems: 'center', gap: 'var(--space-3)' }}>
          <Button variant="outlined" onClick={() => navigate('/admin/compliance/requirements/import')}>
            <Row style={{ alignItems: 'center', gap: 8 }}>
              <Upload size={18} />
              Import
            </Row>
          </Button>
          <Button variant="outlined" onClick={() => navigate('/admin/compliance/requirements/export')}>
            <Row style={{ alignItems: 'center', gap: 8 }}>
              <Download size={18} />
              Export
            </Row>
          </Button>
          <Button variant="solid" onClick={handleCreateRequirement}>
            <Row style={{ alignItems: 'center', gap: 8 }}>
              <Plus size={18} />
              Create {view === 'templates' ? 'Template' : 'Requirement'}
            </Row>
          </Button>
        </Row>
      </Row>

      {/* View Tabs */}
      <Row style={{ alignItems: 'center', borderBottomWidth: 1, borderBottomStyle: 'solid', borderColor: 'var(--color-border)' }}>
        <button
          style={{
            display: 'flex',
            flexDirection: 'row',
            alignItems: 'center',
            gap: 8,
            paddingLeft: 'var(--space-4)',
            paddingRight: 'var(--space-4)',
            paddingTop: 'var(--space-3)',
            paddingBottom: 'var(--space-3)',
            fontSize: 'var(--font-size-3)',
            fontWeight: 500,
            borderBottomWidth: 2,
            borderBottomStyle: 'solid',
            borderBottomColor: view === 'all' ? 'var(--color-blue-9)' : 'transparent',
            color: view === 'all' ? 'var(--color-blue-9)' : 'var(--color-11)',
            background: 'transparent',
            border: 'none',
            cursor: 'pointer',
          }}
          onClick={() => { setView('all'); setPage(1); }}
        >
          <FileText size={18} />
          <Text>All</Text>
          <Text
            style={{
              marginLeft: 4,
              paddingLeft: 8,
              paddingRight: 8,
              paddingTop: 4,
              paddingBottom: 4,
              fontSize: 'var(--font-size-2)',
              borderRadius: 9999,
              backgroundColor: view === 'all' ? 'var(--color-blue-3)' : 'var(--color-gray-3)',
              color: view === 'all' ? 'var(--color-blue-10)' : 'var(--color-11)',
            }}
          >
            {viewCounts.all}
          </Text>
        </button>
        <button
          style={{
            display: 'flex',
            flexDirection: 'row',
            alignItems: 'center',
            gap: 8,
            paddingLeft: 'var(--space-4)',
            paddingRight: 'var(--space-4)',
            paddingTop: 'var(--space-3)',
            paddingBottom: 'var(--space-3)',
            fontSize: 'var(--font-size-3)',
            fontWeight: 500,
            borderBottomWidth: 2,
            borderBottomStyle: 'solid',
            borderBottomColor: view === 'templates' ? 'var(--color-blue-9)' : 'transparent',
            color: view === 'templates' ? 'var(--color-blue-9)' : 'var(--color-11)',
            background: 'transparent',
            border: 'none',
            cursor: 'pointer',
          }}
          onClick={() => { setView('templates'); setPage(1); }}
        >
          <Copy size={18} />
          <Text>Templates</Text>
        </button>
        <button
          style={{
            display: 'flex',
            flexDirection: 'row',
            alignItems: 'center',
            gap: 8,
            paddingLeft: 'var(--space-4)',
            paddingRight: 'var(--space-4)',
            paddingTop: 'var(--space-3)',
            paddingBottom: 'var(--space-3)',
            fontSize: 'var(--font-size-3)',
            fontWeight: 500,
            borderBottomWidth: 2,
            borderBottomStyle: 'solid',
            borderBottomColor: view === 'requirements' ? 'var(--color-blue-9)' : 'transparent',
            color: view === 'requirements' ? 'var(--color-blue-9)' : 'var(--color-11)',
            background: 'transparent',
            border: 'none',
            cursor: 'pointer',
          }}
          onClick={() => { setView('requirements'); setPage(1); }}
        >
          <CheckCircle size={18} />
          <Text>Requirements</Text>
        </button>
      </Row>

      {/* Search and Filters */}
      <Card style={{ backgroundColor: 'var(--color-background)', borderRadius: 'var(--radius-4)', boxShadow: '0 1px 2px var(--color-shadow)', borderColor: 'var(--color-border)', padding: 'var(--space-4)' }}>
        <Stack style={{ gap: 'var(--space-4)' }}>
          <Row style={{ alignItems: 'center', gap: 'var(--space-3)' }}>
            <Row style={{ flex: 1, position: 'relative' }}>
              <Search
                style={{
                  position: 'absolute',
                  left: '12px',
                  top: '50%',
                  transform: 'translateY(-50%)',
                  color: '#9CA3AF',
                }}
                size={20}
              />
              <input
                type="text"
                placeholder="Search by code, name, or description..."
                value={filters.search}
                onChange={(e) => handleSearch(e.target.value)}
                style={{
                  width: '100%',
                  paddingLeft: '40px',
                  paddingRight: '16px',
                  paddingTop: '10px',
                  paddingBottom: '10px',
                  backgroundColor: 'var(--color-background)',
                  border: '1px solid var(--color-border)',
                  borderRadius: '8px',
                  fontSize: '14px',
                  color: 'var(--color-12)',
                }}
              />
            </Row>
            <button
              onClick={() => setShowFilters(!showFilters)}
              style={{
                display: 'flex',
                flexDirection: 'row',
                alignItems: 'center',
                gap: 8,
                paddingLeft: 'var(--space-4)',
                paddingRight: 'var(--space-4)',
                paddingTop: 10,
                paddingBottom: 10,
                fontSize: 'var(--font-size-3)',
                fontWeight: 500,
                backgroundColor: showFilters ? 'var(--color-blue-2)' : 'var(--color-background)',
                borderColor: showFilters ? 'var(--color-blue-9)' : 'var(--color-border)',
                borderWidth: 1,
                borderStyle: 'solid',
                borderRadius: 'var(--radius-4)',
                color: showFilters ? 'var(--color-blue-10)' : 'var(--color-11)',
                cursor: 'pointer',
              }}
            >
              <Filter size={18} />
              <Text>Filters</Text>
              {activeFilterCount > 0 && (
                <Text
                  style={{
                    marginLeft: 4,
                    paddingLeft: 8,
                    paddingRight: 8,
                    paddingTop: 4,
                    paddingBottom: 4,
                    backgroundColor: 'var(--color-blue-9)',
                    color: 'var(--color-background)',
                    fontSize: 'var(--font-size-2)',
                    borderRadius: 9999,
                  }}
                >
                  {activeFilterCount}
                </Text>
              )}
            </button>
          </Row>

          {/* Expanded Filters */}
          {showFilters && (
            <Stack style={{ borderTopWidth: 1, borderTopStyle: 'solid', borderColor: 'var(--color-border)', paddingTop: 'var(--space-4)', gap: 'var(--space-4)' }}>
              <Row style={{ flexWrap: 'wrap', gap: 'var(--space-4)' }}>
                {/* Coverage Type Filter */}
                <Stack style={{ flex: 1, minWidth: 200 }}>
                  <Text style={{ fontSize: 'var(--font-size-2)', fontWeight: 500, color: 'var(--color-11)', marginBottom: 8 }}>
                    Coverage Type
                  </Text>
                  <Row style={{ flexWrap: 'wrap', gap: 8 }}>
                    {coverageTypes.map((type) => (
                      <button
                        key={type.value}
                        onClick={() => handleTypeToggle(type.value)}
                        style={{
                          paddingLeft: 8,
                          paddingRight: 8,
                          paddingTop: 4,
                          paddingBottom: 4,
                          fontSize: 'var(--font-size-2)',
                          borderRadius: 'var(--radius-2)',
                          borderWidth: 1,
                          borderStyle: 'solid',
                          backgroundColor: filters.types.includes(type.value) ? 'var(--color-blue-2)' : 'var(--color-background)',
                          borderColor: filters.types.includes(type.value) ? 'var(--color-blue-9)' : 'var(--color-border)',
                          color: filters.types.includes(type.value) ? 'var(--color-blue-10)' : 'var(--color-11)',
                          cursor: 'pointer',
                        }}
                      >
                        {type.label}
                      </button>
                    ))}
                  </Row>
                </Stack>

                {/* Status Filter */}
                <Stack style={{ flex: 1, minWidth: 200 }}>
                  <Text style={{ fontSize: 'var(--font-size-2)', fontWeight: 500, color: 'var(--color-11)', marginBottom: 8 }}>
                    Status
                  </Text>
                  <Row style={{ flexWrap: 'wrap', gap: 8 }}>
                    {requirementStatuses.map((status) => (
                      <button
                        key={status.value}
                        onClick={() => handleStatusToggle(status.value)}
                        style={{
                          paddingLeft: 8,
                          paddingRight: 8,
                          paddingTop: 4,
                          paddingBottom: 4,
                          fontSize: 'var(--font-size-2)',
                          borderRadius: 'var(--radius-2)',
                          borderWidth: 1,
                          borderStyle: 'solid',
                          backgroundColor: filters.statuses.includes(status.value) ? 'var(--color-blue-2)' : 'var(--color-background)',
                          borderColor: filters.statuses.includes(status.value) ? 'var(--color-blue-9)' : 'var(--color-border)',
                          color: filters.statuses.includes(status.value) ? 'var(--color-blue-10)' : 'var(--color-11)',
                          cursor: 'pointer',
                        }}
                      >
                        {status.label}
                      </button>
                    ))}
                  </Row>
                </Stack>

                {/* Include Archived Toggle */}
                <Stack style={{ flex: 1, minWidth: 200 }}>
                  <Text style={{ fontSize: 'var(--font-size-2)', fontWeight: 500, color: 'var(--color-11)', marginBottom: 8 }}>
                    Options
                  </Text>
                  <Row style={{ alignItems: 'center', gap: 8, cursor: 'pointer' }}>
                    <input
                      type="checkbox"
                      checked={filters.includeArchived}
                      onChange={(e) => {
                        setFilters((prev) => ({ ...prev, includeArchived: e.target.checked }));
                        setPage(1);
                      }}
                      style={{
                        borderRadius: '4px',
                        border: '1px solid var(--color-border)',
                        accentColor: 'var(--color-blue-9)',
                      }}
                    />
                    <Text style={{ fontSize: 'var(--font-size-3)', color: 'var(--color-11)' }}>Include archived</Text>
                  </Row>
                </Stack>
              </Row>

              {activeFilterCount > 0 && (
                <button
                  onClick={clearFilters}
                  style={{
                    display: 'flex',
                    flexDirection: 'row',
                    alignItems: 'center',
                    gap: 8,
                    fontSize: 'var(--font-size-3)',
                    color: 'var(--color-11)',
                    background: 'transparent',
                    border: 'none',
                    cursor: 'pointer',
                  }}
                >
                  <X size={16} />
                  <Text>Clear all filters</Text>
                </button>
              )}
            </Stack>
          )}

          {/* Results count */}
          <Row style={{ alignItems: 'center', justifyContent: 'space-between', borderTopWidth: 1, borderTopStyle: 'solid', borderColor: 'var(--color-border)', paddingTop: 'var(--space-4)' }}>
            <Text style={{ fontSize: 'var(--font-size-3)', color: 'var(--color-11)' }}>
              Showing{' '}
              <Text style={{ fontWeight: 600, color: 'var(--color-12)' }}>
                {requirements.length}
              </Text>{' '}
              of {totalCount} requirements
            </Text>
            {selectedIds.length > 0 && (
              <Row style={{ alignItems: 'center', gap: 8 }}>
                <Text style={{ fontSize: 'var(--font-size-3)', color: 'var(--color-11)' }}>
                  {selectedIds.length} selected
                </Text>
                <Button size="$3" variant="outlined">
                  <Row style={{ alignItems: 'center', gap: 4 }}>
                    <Archive size={14} />
                    Archive Selected
                  </Row>
                </Button>
              </Row>
            )}
          </Row>
        </Stack>
      </Card>

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
        <Card style={{ backgroundColor: 'var(--color-background)', borderRadius: 'var(--radius-4)', boxShadow: '0 1px 2px var(--color-shadow)', borderColor: 'var(--color-border)', overflow: 'hidden' }}>
          <Stack style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%' }}>
              <thead style={{ backgroundColor: 'var(--color-gray-2)', borderBottom: '1px solid var(--color-border)' }}>
                <tr>
                  <th style={{ width: '40px', padding: '12px 16px' }}>
                    <input
                      type="checkbox"
                      checked={selectedIds.length === requirements.length && requirements.length > 0}
                      onChange={handleSelectAll}
                      style={{
                        borderRadius: '4px',
                        border: '1px solid var(--color-border)',
                        accentColor: 'var(--color-blue-9)',
                      }}
                    />
                  </th>
                  <th
                    style={{
                      padding: '12px 16px',
                      textAlign: 'left',
                      fontSize: '12px',
                      fontWeight: '500',
                      color: 'var(--color-11)',
                      textTransform: 'uppercase',
                      letterSpacing: '0.05em',
                      cursor: 'pointer',
                    }}
                    onClick={() => handleSort('code')}
                  >
                    <Row style={{ alignItems: 'center' }}>
                      <Text>Code</Text>
                      <SortIndicator field="code" />
                    </Row>
                  </th>
                  <th
                    style={{
                      padding: '12px 16px',
                      textAlign: 'left',
                      fontSize: '12px',
                      fontWeight: '500',
                      color: 'var(--color-11)',
                      textTransform: 'uppercase',
                      letterSpacing: '0.05em',
                      cursor: 'pointer',
                    }}
                    onClick={() => handleSort('name')}
                  >
                    <Row style={{ alignItems: 'center' }}>
                      <Text>Name</Text>
                      <SortIndicator field="name" />
                    </Row>
                  </th>
                  <th
                    style={{
                      padding: '12px 16px',
                      textAlign: 'left',
                      fontSize: '12px',
                      fontWeight: '500',
                      color: 'var(--color-11)',
                      textTransform: 'uppercase',
                      letterSpacing: '0.05em',
                      cursor: 'pointer',
                    }}
                    onClick={() => handleSort('type')}
                  >
                    <Row style={{ alignItems: 'center' }}>
                      <Text>Type</Text>
                      <SortIndicator field="type" />
                    </Row>
                  </th>
                  <th
                    style={{
                      padding: '12px 16px',
                      textAlign: 'left',
                      fontSize: '12px',
                      fontWeight: '500',
                      color: 'var(--color-11)',
                      textTransform: 'uppercase',
                      letterSpacing: '0.05em',
                      cursor: 'pointer',
                    }}
                    onClick={() => handleSort('status')}
                  >
                    <Row style={{ alignItems: 'center' }}>
                      <Text>Status</Text>
                      <SortIndicator field="status" />
                    </Row>
                  </th>
                  <th
                    style={{
                      padding: '12px 16px',
                      textAlign: 'left',
                      fontSize: '12px',
                      fontWeight: '500',
                      color: 'var(--color-11)',
                      textTransform: 'uppercase',
                      letterSpacing: '0.05em',
                      cursor: 'pointer',
                    }}
                    onClick={() => handleSort('effective_date')}
                  >
                    <Row style={{ alignItems: 'center' }}>
                      <Text>Effective Date</Text>
                      <SortIndicator field="effective_date" />
                    </Row>
                  </th>
                  <th style={{
                    padding: '12px 16px',
                    textAlign: 'left',
                    fontSize: '12px',
                    fontWeight: '500',
                    color: 'var(--color-11)',
                    textTransform: 'uppercase',
                    letterSpacing: '0.05em',
                  }}>
                    Version
                  </th>
                  <th style={{ width: '40px', padding: '12px 16px' }}></th>
                </tr>
              </thead>
              <tbody>
                {requirements.map((requirement, idx) => (
                  <tr
                    key={requirement.id}
                    style={{
                      borderBottom: idx < requirements.length - 1 ? '1px solid var(--color-border)' : 'none',
                      cursor: 'pointer',
                    }}
                    onMouseEnter={(e) => { e.currentTarget.style.backgroundColor = 'var(--color-gray-2)'; }}
                    onMouseLeave={(e) => { e.currentTarget.style.backgroundColor = 'transparent'; }}
                    onClick={() => handleRowClick(requirement.id)}
                  >
                    <td style={{ padding: '16px' }} onClick={(e) => e.stopPropagation()}>
                      <input
                        type="checkbox"
                        checked={selectedIds.includes(requirement.id)}
                        onChange={() => handleSelectRow(requirement.id)}
                        style={{
                          borderRadius: '4px',
                          border: '1px solid var(--color-border)',
                          accentColor: 'var(--color-blue-9)',
                        }}
                      />
                    </td>
                    <td style={{ padding: '16px' }}>
                      <Row style={{ alignItems: 'center', gap: 8 }}>
                        <Text style={{ fontFamily: 'monospace', fontSize: 'var(--font-size-3)', fontWeight: 500, color: 'var(--color-12)' }}>
                          {requirement.code}
                        </Text>
                        {requirement.is_template && (
                          <Text
                            style={{
                              paddingLeft: 6,
                              paddingRight: 6,
                              paddingTop: 4,
                              paddingBottom: 4,
                              fontSize: 'var(--font-size-2)',
                              backgroundColor: 'var(--color-purple-2)',
                              color: 'var(--color-purple-10)',
                              borderRadius: 'var(--radius-2)',
                            }}
                          >
                            Template
                          </Text>
                        )}
                      </Row>
                    </td>
                    <td style={{ padding: '16px' }}>
                      <Stack>
                        <Text style={{ fontSize: 'var(--font-size-3)', fontWeight: 500, color: 'var(--color-12)' }}>
                          {requirement.name}
                        </Text>
                        {requirement.description && (
                          <Text
                            style={{
                              fontSize: 'var(--font-size-2)',
                              color: 'var(--color-10)',
                              marginTop: 2,
                              maxWidth: '300px',
                              overflow: 'hidden',
                              textOverflow: 'ellipsis',
                              whiteSpace: 'nowrap',
                            }}
                          >
                            {requirement.description}
                          </Text>
                        )}
                      </Stack>
                    </td>
                    <td style={{ padding: '16px' }}>
                      <RequirementTypeBadge type={requirement.type} size="xs" />
                    </td>
                    <td style={{ padding: '16px' }}>
                      <RequirementStatusBadge status={requirement.status} size="xs" />
                    </td>
                    <td style={{ padding: '16px' }}>
                      <Text style={{ fontSize: 'var(--font-size-3)', color: 'var(--color-11)' }}>
                        {formatDate(requirement.effective_date)}
                      </Text>
                    </td>
                    <td style={{ padding: '16px' }}>
                      <Text style={{ fontSize: 'var(--font-size-3)', color: 'var(--color-10)' }}>
                        v{requirement.current_version}
                      </Text>
                    </td>
                    <td style={{ padding: '16px' }} onClick={(e) => e.stopPropagation()}>
                      <button
                        style={{
                          padding: 4,
                          borderRadius: 'var(--radius-2)',
                          background: 'transparent',
                          border: 'none',
                          cursor: 'pointer',
                        }}
                      >
                        <MoreHorizontal size={16} style={{ color: 'var(--color-10)' }} />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </Stack>

          {/* Pagination */}
          {totalPages > 1 && (
            <Row
              style={{
                alignItems: 'center',
                justifyContent: 'space-between',
                paddingLeft: 'var(--space-4)',
                paddingRight: 'var(--space-4)',
                paddingTop: 'var(--space-3)',
                paddingBottom: 'var(--space-3)',
                backgroundColor: 'var(--color-gray-2)',
                borderTopWidth: 1,
                borderTopStyle: 'solid',
                borderColor: 'var(--color-border)',
              }}
            >
              <Text style={{ fontSize: 'var(--font-size-3)', color: 'var(--color-11)' }}>
                Page {page} of {totalPages}
              </Text>
              <Row style={{ alignItems: 'center', gap: 8 }}>
                <Button
                  size="$3"
                  variant="outlined"
                  onClick={() => setPage((p) => Math.max(1, p - 1))}
                  disabled={page === 1}
                >
                  Previous
                </Button>
                <Button
                  size="$3"
                  variant="outlined"
                  onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                  disabled={page === totalPages}
                >
                  Next
                </Button>
              </Row>
            </Row>
          )}
        </Card>
      )}
    </Stack>
  );
}

export default ComplianceRequirementsPage;
