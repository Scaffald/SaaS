/**
 * DocumentFilterPanel - Filter panel for document library
 * REQ-284: Document Organization by Client/Project/GC
 * TASK-1: Create Document Filter Panel Component
 *
 * Allows filtering documents by:
 * - Client (GC or Sub)
 * - Project
 * - Document Type
 * - Status
 */

'use client';

import { useCallback, useMemo } from 'react';
import { YStack, XStack, Text, Card, Spinner } from '@unicornlove/ui';
import {
  DocumentFilterPanelProps,
  DocumentFilterState,
  DocumentType,
  DocumentStatus,
  DOCUMENT_TYPE_LABELS,
  DOCUMENT_STATUS_LABELS,
} from '../../types/document-filters';

/**
 * All document type options for filter dropdown
 */
const DOCUMENT_TYPE_OPTIONS: { value: DocumentType; label: string }[] = [
  { value: 'coi', label: DOCUMENT_TYPE_LABELS.coi },
  { value: 'license', label: DOCUMENT_TYPE_LABELS.license },
  { value: 'contract', label: DOCUMENT_TYPE_LABELS.contract },
  { value: 'w9', label: DOCUMENT_TYPE_LABELS.w9 },
  { value: 'endorsement', label: DOCUMENT_TYPE_LABELS.endorsement },
  { value: 'other', label: DOCUMENT_TYPE_LABELS.other },
];

/**
 * All document status options for filter dropdown
 */
const DOCUMENT_STATUS_OPTIONS: { value: DocumentStatus; label: string }[] = [
  { value: 'verified', label: DOCUMENT_STATUS_LABELS.verified },
  { value: 'pending', label: DOCUMENT_STATUS_LABELS.pending },
  { value: 'expiring', label: DOCUMENT_STATUS_LABELS.expiring },
  { value: 'expired', label: DOCUMENT_STATUS_LABELS.expired },
];

export function DocumentFilterPanel({
  filters,
  onFiltersChange,
  clients,
  projects,
  loading = false,
  disabled = false,
}: DocumentFilterPanelProps) {
  // Filter projects based on selected client
  const filteredProjects = useMemo(() => {
    if (!filters.clientId) {
      return projects;
    }
    return projects.filter((project) => project.clientId === filters.clientId);
  }, [projects, filters.clientId]);

  // Handle client filter change
  const handleClientChange = useCallback(
    (e: React.ChangeEvent<HTMLSelectElement>) => {
      const clientId = e.target.value || undefined;
      // Reset project filter when client changes
      onFiltersChange({
        ...filters,
        clientId,
        projectId: undefined,
      });
    },
    [filters, onFiltersChange]
  );

  // Handle project filter change
  const handleProjectChange = useCallback(
    (e: React.ChangeEvent<HTMLSelectElement>) => {
      const projectId = e.target.value || undefined;
      onFiltersChange({
        ...filters,
        projectId,
      });
    },
    [filters, onFiltersChange]
  );

  // Handle document type filter change
  const handleDocTypeChange = useCallback(
    (e: React.ChangeEvent<HTMLSelectElement>) => {
      const docType = (e.target.value as DocumentType) || undefined;
      onFiltersChange({
        ...filters,
        docType,
      });
    },
    [filters, onFiltersChange]
  );

  // Handle status filter change
  const handleStatusChange = useCallback(
    (e: React.ChangeEvent<HTMLSelectElement>) => {
      const status = (e.target.value as DocumentStatus) || undefined;
      onFiltersChange({
        ...filters,
        status,
      });
    },
    [filters, onFiltersChange]
  );

  // Handle clear all filters
  const handleClearFilters = useCallback(() => {
    onFiltersChange({});
  }, [onFiltersChange]);

  // Check if any filters are active
  const hasActiveFilters =
    filters.clientId || filters.projectId || filters.docType || filters.status;

  const isDisabled = disabled || loading;

  return (
    <Card
      backgroundColor="$background"
      borderRadius="$4"
      elevation={1}
      borderWidth={1}
      borderColor="$borderColor"
      padding="$4"
    >
      <XStack alignItems="center" justifyContent="space-between" mb="$4">
        <Text fontSize="$3" fontWeight="500" color="$color12">
          Filters
        </Text>
        {hasActiveFilters && (
          <Text
            as="button"
            type="button"
            onClick={handleClearFilters}
            disabled={isDisabled}
            fontSize="$3"
            color="$teal9"
            hoverStyle={{ color: '$teal11' }}
            disabledStyle={{
              opacity: 0.5,
              cursor: 'not-allowed',
            }}
            cursor="pointer"
          >
            Clear all
          </Text>
        )}
      </XStack>

      <XStack
        flexWrap="wrap"
        gap="$4"
        $sm={{ flexDirection: 'row' }}
        $lg={{ flexDirection: 'row' }}
      >
        {/* Client Filter */}
        <YStack flex={1} minWidth={{ sm: '50%', lg: '25%' }} gap="$1">
          <Text
            as="label"
            htmlFor="filter-client"
            display="block"
            fontSize="$1"
            fontWeight="500"
            color="$color11"
          >
            Client
          </Text>
          <select
            id="filter-client"
            value={filters.clientId || ''}
            onChange={handleClientChange}
            disabled={isDisabled}
            style={{
              width: '100%',
              padding: '8px 12px',
              fontSize: '13px',
              border: '1px solid var(--color-gray-6)',
              borderRadius: '8px',
              outline: 'none',
            }}
            onFocus={(e) => {
              e.currentTarget.style.borderColor = 'var(--color-teal-9)';
              e.currentTarget.style.borderWidth = '2px';
            }}
            onBlur={(e) => {
              e.currentTarget.style.borderColor = 'var(--color-gray-6)';
              e.currentTarget.style.borderWidth = '1px';
            }}
          >
            <option value="">All Clients</option>
            {clients.map((client) => (
              <option key={client.id} value={client.id}>
                {client.name} ({client.type === 'gc' ? 'GC' : 'Sub'})
              </option>
            ))}
          </select>
        </YStack>

        {/* Project Filter */}
        <YStack flex={1} minWidth={{ sm: '50%', lg: '25%' }} gap="$1">
          <Text
            as="label"
            htmlFor="filter-project"
            display="block"
            fontSize="$1"
            fontWeight="500"
            color="$color11"
          >
            Project
          </Text>
          <select
            id="filter-project"
            value={filters.projectId || ''}
            onChange={handleProjectChange}
            disabled={isDisabled}
            style={{
              width: '100%',
              padding: '8px 12px',
              fontSize: '13px',
              border: '1px solid var(--color-gray-6)',
              borderRadius: '8px',
              outline: 'none',
            }}
            onFocus={(e) => {
              e.currentTarget.style.borderColor = 'var(--color-teal-9)';
              e.currentTarget.style.borderWidth = '2px';
            }}
            onBlur={(e) => {
              e.currentTarget.style.borderColor = 'var(--color-gray-6)';
              e.currentTarget.style.borderWidth = '1px';
            }}
          >
            <option value="">All Projects</option>
            {filteredProjects.map((project) => (
              <option key={project.id} value={project.id}>
                {project.name}
              </option>
            ))}
          </select>
        </YStack>

        {/* Document Type Filter */}
        <YStack flex={1} minWidth={{ sm: '50%', lg: '25%' }} gap="$1">
          <Text
            as="label"
            htmlFor="filter-doc-type"
            display="block"
            fontSize="$1"
            fontWeight="500"
            color="$color11"
          >
            Document Type
          </Text>
          <select
            id="filter-doc-type"
            value={filters.docType || ''}
            onChange={handleDocTypeChange}
            disabled={isDisabled}
            style={{
              width: '100%',
              padding: '8px 12px',
              fontSize: '13px',
              border: '1px solid var(--color-gray-6)',
              borderRadius: '8px',
              outline: 'none',
            }}
            onFocus={(e) => {
              e.currentTarget.style.borderColor = 'var(--color-teal-9)';
              e.currentTarget.style.borderWidth = '2px';
            }}
            onBlur={(e) => {
              e.currentTarget.style.borderColor = 'var(--color-gray-6)';
              e.currentTarget.style.borderWidth = '1px';
            }}
          >
            <option value="">All Types</option>
            {DOCUMENT_TYPE_OPTIONS.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
        </YStack>

        {/* Status Filter */}
        <YStack flex={1} minWidth={{ sm: '50%', lg: '25%' }} gap="$1">
          <Text
            as="label"
            htmlFor="filter-status"
            display="block"
            fontSize="$1"
            fontWeight="500"
            color="$color11"
          >
            Status
          </Text>
          <select
            id="filter-status"
            value={filters.status || ''}
            onChange={handleStatusChange}
            disabled={isDisabled}
            style={{
              width: '100%',
              padding: '8px 12px',
              fontSize: '13px',
              border: '1px solid var(--color-gray-6)',
              borderRadius: '8px',
              outline: 'none',
            }}
            onFocus={(e) => {
              e.currentTarget.style.borderColor = 'var(--color-teal-9)';
              e.currentTarget.style.borderWidth = '2px';
            }}
            onBlur={(e) => {
              e.currentTarget.style.borderColor = 'var(--color-gray-6)';
              e.currentTarget.style.borderWidth = '1px';
            }}
          >
            <option value="">All Statuses</option>
            {DOCUMENT_STATUS_OPTIONS.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
        </YStack>
      </XStack>

      {/* Loading indicator */}
      {loading && (
        <XStack alignItems="center" mt="$3" fontSize="$3" color="$color10" gap="$2">
          <Spinner size="small" color="$teal9" />
          <Text>Updating filters...</Text>
        </XStack>
      )}
    </Card>
  );
}

export default DocumentFilterPanel;
