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
import { YStack, XStack, Text, Button, Card, H1, H2, H3 } from '@unicornlove/ui';
import { useComplianceRequirements, type CoverageType, type RequirementStatus } from '../../hooks/useComplianceRequirements';
import { useUser } from '../../contexts/UserContext';
import { DashboardSkeleton } from '../Common/SkeletonLoader';
import { EmptyState } from '@unicornlove/ui';
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
      <ChevronUp size={14} style={{ marginLeft: '4px' }} />
    ) : (
      <ChevronDown size={14} style={{ marginLeft: '4px' }} />
    );
  };

  if (!organizationId) {
    return (
      <YStack padding="$8" alignItems="center">
        <Text color="$color11">Please select an organization to manage compliance requirements.</Text>
      </YStack>
    );
  }

  if (isLoading) {
    return <DashboardSkeleton />;
  }

  if (error) {
    return (
      <YStack padding="$8" alignItems="center">
        <Text color="$red9">Error loading requirements: {error.message}</Text>
        <Button variant="outlined" mt="$4" onPress={() => window.location.reload()}>
          Retry
        </Button>
      </YStack>
    );
  }

  return (
    <YStack gap="$6">
      {/* Header */}
      <XStack alignItems="center" justifyContent="space-between">
        <YStack>
          <H1 fontSize="$10" fontWeight="700" color="$color12">
            Compliance Requirements
          </H1>
          <Text fontSize="$6" color="$color11" mt="$1">
            Manage insurance compliance requirements and templates
          </Text>
        </YStack>
        <XStack alignItems="center" gap="$3">
          <Button variant="outlined" onPress={() => navigate('/admin/compliance/requirements/import')}>
            <Upload size={18} style={{ marginRight: '8px' }} />
            Import
          </Button>
          <Button variant="outlined" onPress={() => navigate('/admin/compliance/requirements/export')}>
            <Download size={18} style={{ marginRight: '8px' }} />
            Export
          </Button>
          <Button variant="solid" onPress={handleCreateRequirement}>
            <Plus size={18} style={{ marginRight: '8px' }} />
            Create {view === 'templates' ? 'Template' : 'Requirement'}
          </Button>
        </XStack>
      </XStack>

      {/* View Tabs */}
      <XStack alignItems="center" borderBottomWidth={1} borderColor="$borderColor">
        <Button
          unstyled
          flexDirection="row"
          alignItems="center"
          gap="$2"
          paddingHorizontal="$4"
          paddingVertical="$3"
          fontSize="$3"
          fontWeight="500"
          borderBottomWidth={2}
          borderColor={view === 'all' ? '$blue9' : 'transparent'}
          color={view === 'all' ? '$blue9' : '$color11'}
          hoverStyle={{ color: '$color12', borderColor: '$borderColor' }}
          onPress={() => { setView('all'); setPage(1); }}
        >
          <FileText size={18} />
          <Text>All</Text>
          <Text
            ml="$1"
            paddingHorizontal="$2"
            paddingVertical="$1"
            fontSize="$2"
            borderRadius={9999}
            backgroundColor={view === 'all' ? '$blue3' : '$gray3'}
            color={view === 'all' ? '$blue10' : '$color11'}
          >
            {viewCounts.all}
          </Text>
        </Button>
        <Button
          unstyled
          flexDirection="row"
          alignItems="center"
          gap="$2"
          paddingHorizontal="$4"
          paddingVertical="$3"
          fontSize="$3"
          fontWeight="500"
          borderBottomWidth={2}
          borderColor={view === 'templates' ? '$blue9' : 'transparent'}
          color={view === 'templates' ? '$blue9' : '$color11'}
          hoverStyle={{ color: '$color12', borderColor: '$borderColor' }}
          onPress={() => { setView('templates'); setPage(1); }}
        >
          <Copy size={18} />
          <Text>Templates</Text>
        </Button>
        <Button
          unstyled
          flexDirection="row"
          alignItems="center"
          gap="$2"
          paddingHorizontal="$4"
          paddingVertical="$3"
          fontSize="$3"
          fontWeight="500"
          borderBottomWidth={2}
          borderColor={view === 'requirements' ? '$blue9' : 'transparent'}
          color={view === 'requirements' ? '$blue9' : '$color11'}
          hoverStyle={{ color: '$color12', borderColor: '$borderColor' }}
          onPress={() => { setView('requirements'); setPage(1); }}
        >
          <CheckCircle size={18} />
          <Text>Requirements</Text>
        </Button>
      </XStack>

      {/* Search and Filters */}
      <Card backgroundColor="$background" borderRadius="$4" elevation={1} borderColor="$borderColor" padding="$4">
        <YStack gap="$4">
          <XStack alignItems="center" gap="$3">
            <XStack flex={1} position="relative">
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
                  backgroundColor: 'var(--background)',
                  border: '1px solid var(--borderColor)',
                  borderRadius: '8px',
                  fontSize: '14px',
                  color: 'var(--color12)',
                }}
              />
            </XStack>
            <Button
              variant={showFilters ? 'solid' : 'outlined'}
              onPress={() => setShowFilters(!showFilters)}
              flexDirection="row"
              alignItems="center"
              gap="$2"
              paddingHorizontal="$4"
              paddingVertical="$2.5"
              fontSize="$3"
              fontWeight="500"
              backgroundColor={showFilters ? '$blue2' : '$background'}
              borderColor={showFilters ? '$blue9' : '$borderColor'}
              color={showFilters ? '$blue10' : '$color11'}
              hoverStyle={{ backgroundColor: '$gray2' }}
            >
              <Filter size={18} />
              <Text>Filters</Text>
              {activeFilterCount > 0 && (
                <Text
                  ml="$1"
                  paddingHorizontal="$2"
                  paddingVertical="$1"
                  backgroundColor="$blue9"
                  color="$background"
                  fontSize="$2"
                  borderRadius={9999}
                >
                  {activeFilterCount}
                </Text>
              )}
            </Button>
          </XStack>

          {/* Expanded Filters */}
          {showFilters && (
            <YStack borderTopWidth={1} borderColor="$borderColor" paddingTop="$4" gap="$4">
              <XStack flexWrap="wrap" gap="$4" $gtMd={{ flexDirection: 'row' }} $gtLg={{ flexDirection: 'row' }}>
                {/* Coverage Type Filter */}
                <YStack flex={1} minWidth="200px">
                  <Text fontSize="$2" fontWeight="500" color="$color11" mb="$2">
                    Coverage Type
                  </Text>
                  <XStack flexWrap="wrap" gap="$2">
                    {coverageTypes.map((type) => (
                      <Button
                        key={type.value}
                        unstyled
                        onPress={() => handleTypeToggle(type.value)}
                        paddingHorizontal="$2"
                        paddingVertical="$1"
                        fontSize="$2"
                        borderRadius="$2"
                        borderWidth={1}
                        backgroundColor={filters.types.includes(type.value) ? '$blue2' : '$background'}
                        borderColor={filters.types.includes(type.value) ? '$blue9' : '$borderColor'}
                        color={filters.types.includes(type.value) ? '$blue10' : '$color11'}
                        hoverStyle={{ borderColor: '$blue7' }}
                      >
                        {type.label}
                      </Button>
                    ))}
                  </XStack>
                </YStack>

                {/* Status Filter */}
                <YStack flex={1} minWidth="200px">
                  <Text fontSize="$2" fontWeight="500" color="$color11" mb="$2">
                    Status
                  </Text>
                  <XStack flexWrap="wrap" gap="$2">
                    {requirementStatuses.map((status) => (
                      <Button
                        key={status.value}
                        unstyled
                        onPress={() => handleStatusToggle(status.value)}
                        paddingHorizontal="$2"
                        paddingVertical="$1"
                        fontSize="$2"
                        borderRadius="$2"
                        borderWidth={1}
                        backgroundColor={filters.statuses.includes(status.value) ? '$blue2' : '$background'}
                        borderColor={filters.statuses.includes(status.value) ? '$blue9' : '$borderColor'}
                        color={filters.statuses.includes(status.value) ? '$blue10' : '$color11'}
                        hoverStyle={{ borderColor: '$blue7' }}
                      >
                        {status.label}
                      </Button>
                    ))}
                  </XStack>
                </YStack>

                {/* Include Archived Toggle */}
                <YStack flex={1} minWidth="200px">
                  <Text fontSize="$2" fontWeight="500" color="$color11" mb="$2">
                    Options
                  </Text>
                  <XStack alignItems="center" gap="$2" cursor="pointer">
                    <input
                      type="checkbox"
                      checked={filters.includeArchived}
                      onChange={(e) => {
                        setFilters((prev) => ({ ...prev, includeArchived: e.target.checked }));
                        setPage(1);
                      }}
                      style={{
                        borderRadius: '4px',
                        border: '1px solid var(--borderColor)',
                        accentColor: 'var(--blue9)',
                      }}
                    />
                    <Text fontSize="$3" color="$color11">Include archived</Text>
                  </XStack>
                </YStack>
              </XStack>

              {activeFilterCount > 0 && (
                <Button
                  unstyled
                  flexDirection="row"
                  alignItems="center"
                  gap="$2"
                  fontSize="$3"
                  color="$color11"
                  hoverStyle={{ color: '$color12' }}
                  onPress={clearFilters}
                >
                  <X size={16} />
                  <Text>Clear all filters</Text>
                </Button>
              )}
            </YStack>
          )}

          {/* Results count */}
          <XStack alignItems="center" justifyContent="space-between" borderTopWidth={1} borderColor="$borderColor" paddingTop="$4">
            <Text fontSize="$3" color="$color11">
              Showing{' '}
              <Text fontWeight="600" color="$color12">
                {requirements.length}
              </Text>{' '}
              of {totalCount} requirements
            </Text>
            {selectedIds.length > 0 && (
              <XStack alignItems="center" gap="$2">
                <Text fontSize="$3" color="$color11">
                  {selectedIds.length} selected
                </Text>
                <Button size="$3" variant="outlined">
                  <Archive size={14} style={{ marginRight: '4px' }} />
                  Archive Selected
                </Button>
              </XStack>
            )}
          </XStack>
        </YStack>
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
        <Card backgroundColor="$background" borderRadius="$4" elevation={1} borderColor="$borderColor" overflow="hidden">
          <YStack overflowX="auto">
            <table style={{ width: '100%' }}>
              <thead style={{ backgroundColor: 'var(--gray2)', borderBottom: '1px solid var(--borderColor)' }}>
                <tr>
                  <th style={{ width: '40px', padding: '12px 16px' }}>
                    <input
                      type="checkbox"
                      checked={selectedIds.length === requirements.length && requirements.length > 0}
                      onChange={handleSelectAll}
                      style={{
                        borderRadius: '4px',
                        border: '1px solid var(--borderColor)',
                        accentColor: 'var(--blue9)',
                      }}
                    />
                  </th>
                  <th
                    style={{
                      padding: '12px 16px',
                      textAlign: 'left',
                      fontSize: '12px',
                      fontWeight: '500',
                      color: 'var(--color11)',
                      textTransform: 'uppercase',
                      letterSpacing: '0.05em',
                      cursor: 'pointer',
                    }}
                    onMouseEnter={(e) => { e.currentTarget.style.backgroundColor = 'var(--background)'; }}
                    onMouseLeave={(e) => { e.currentTarget.style.backgroundColor = 'transparent'; }}
                    onClick={() => handleSort('code')}
                  >
                    <XStack alignItems="center">
                      <Text>Code</Text>
                      <SortIndicator field="code" />
                    </XStack>
                  </th>
                  <th
                    style={{
                      padding: '12px 16px',
                      textAlign: 'left',
                      fontSize: '12px',
                      fontWeight: '500',
                      color: 'var(--color11)',
                      textTransform: 'uppercase',
                      letterSpacing: '0.05em',
                      cursor: 'pointer',
                    }}
                    onMouseEnter={(e) => { e.currentTarget.style.backgroundColor = 'var(--background)'; }}
                    onMouseLeave={(e) => { e.currentTarget.style.backgroundColor = 'transparent'; }}
                    onClick={() => handleSort('name')}
                  >
                    <XStack alignItems="center">
                      <Text>Name</Text>
                      <SortIndicator field="name" />
                    </XStack>
                  </th>
                  <th
                    style={{
                      padding: '12px 16px',
                      textAlign: 'left',
                      fontSize: '12px',
                      fontWeight: '500',
                      color: 'var(--color11)',
                      textTransform: 'uppercase',
                      letterSpacing: '0.05em',
                      cursor: 'pointer',
                    }}
                    onMouseEnter={(e) => { e.currentTarget.style.backgroundColor = 'var(--background)'; }}
                    onMouseLeave={(e) => { e.currentTarget.style.backgroundColor = 'transparent'; }}
                    onClick={() => handleSort('type')}
                  >
                    <XStack alignItems="center">
                      <Text>Type</Text>
                      <SortIndicator field="type" />
                    </XStack>
                  </th>
                  <th
                    style={{
                      padding: '12px 16px',
                      textAlign: 'left',
                      fontSize: '12px',
                      fontWeight: '500',
                      color: 'var(--color11)',
                      textTransform: 'uppercase',
                      letterSpacing: '0.05em',
                      cursor: 'pointer',
                    }}
                    onMouseEnter={(e) => { e.currentTarget.style.backgroundColor = 'var(--background)'; }}
                    onMouseLeave={(e) => { e.currentTarget.style.backgroundColor = 'transparent'; }}
                    onClick={() => handleSort('status')}
                  >
                    <XStack alignItems="center">
                      <Text>Status</Text>
                      <SortIndicator field="status" />
                    </XStack>
                  </th>
                  <th
                    style={{
                      padding: '12px 16px',
                      textAlign: 'left',
                      fontSize: '12px',
                      fontWeight: '500',
                      color: 'var(--color11)',
                      textTransform: 'uppercase',
                      letterSpacing: '0.05em',
                      cursor: 'pointer',
                    }}
                    onMouseEnter={(e) => { e.currentTarget.style.backgroundColor = 'var(--background)'; }}
                    onMouseLeave={(e) => { e.currentTarget.style.backgroundColor = 'transparent'; }}
                    onClick={() => handleSort('effective_date')}
                  >
                    <XStack alignItems="center">
                      <Text>Effective Date</Text>
                      <SortIndicator field="effective_date" />
                    </XStack>
                  </th>
                  <th style={{
                    padding: '12px 16px',
                    textAlign: 'left',
                    fontSize: '12px',
                    fontWeight: '500',
                    color: 'var(--color11)',
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
                      borderBottom: idx < requirements.length - 1 ? '1px solid var(--borderColor)' : 'none',
                      cursor: 'pointer',
                    }}
                    onMouseEnter={(e) => { e.currentTarget.style.backgroundColor = 'var(--gray2)'; }}
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
                          border: '1px solid var(--borderColor)',
                          accentColor: 'var(--blue9)',
                        }}
                      />
                    </td>
                    <td style={{ padding: '16px' }}>
                      <XStack alignItems="center" gap="$2">
                        <Text fontFamily="$mono" fontSize="$3" fontWeight="500" color="$color12">
                          {requirement.code}
                        </Text>
                        {requirement.is_template && (
                          <Text
                            paddingHorizontal="$1.5"
                            paddingVertical="$1"
                            fontSize="$2"
                            backgroundColor="$purple2"
                            color="$purple10"
                            borderRadius="$2"
                          >
                            Template
                          </Text>
                        )}
                      </XStack>
                    </td>
                    <td style={{ padding: '16px' }}>
                      <YStack>
                        <Text fontSize="$3" fontWeight="500" color="$color12">
                          {requirement.name}
                        </Text>
                        {requirement.description && (
                          <Text
                            fontSize="$2"
                            color="$color10"
                            mt="$0.5"
                            numberOfLines={1}
                            maxWidth="300px"
                          >
                            {requirement.description}
                          </Text>
                        )}
                      </YStack>
                    </td>
                    <td style={{ padding: '16px' }}>
                      <RequirementTypeBadge type={requirement.type} size="xs" />
                    </td>
                    <td style={{ padding: '16px' }}>
                      <RequirementStatusBadge status={requirement.status} size="xs" />
                    </td>
                    <td style={{ padding: '16px' }}>
                      <Text fontSize="$3" color="$color11">
                        {formatDate(requirement.effective_date)}
                      </Text>
                    </td>
                    <td style={{ padding: '16px' }}>
                      <Text fontSize="$3" color="$color10">
                        v{requirement.current_version}
                      </Text>
                    </td>
                    <td style={{ padding: '16px' }} onClick={(e) => e.stopPropagation()}>
                      <Button
                        unstyled
                        padding="$1"
                        borderRadius="$2"
                        hoverStyle={{ backgroundColor: '$background' }}
                      >
                        <MoreHorizontal size={16} color="var(--color10)" />
                      </Button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </YStack>

          {/* Pagination */}
          {totalPages > 1 && (
            <XStack
              alignItems="center"
              justifyContent="space-between"
              paddingHorizontal="$4"
              paddingVertical="$3"
              backgroundColor="$gray2"
              borderTopWidth={1}
              borderColor="$borderColor"
            >
              <Text fontSize="$3" color="$color11">
                Page {page} of {totalPages}
              </Text>
              <XStack alignItems="center" gap="$2">
                <Button
                  size="$3"
                  variant="outlined"
                  onPress={() => setPage((p) => Math.max(1, p - 1))}
                  disabled={page === 1}
                >
                  Previous
                </Button>
                <Button
                  size="$3"
                  variant="outlined"
                  onPress={() => setPage((p) => Math.min(totalPages, p + 1))}
                  disabled={page === totalPages}
                >
                  Next
                </Button>
              </XStack>
            </XStack>
          )}
        </Card>
      )}
    </YStack>
  );
}

export default ComplianceRequirementsPage;
