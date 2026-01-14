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

import React, { useCallback, useMemo } from 'react';
import { Loader2 } from 'lucide-react';
import { Stack, Row, Text, Card } from '@unicornlove/beyond-ui';
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

  const selectStyle: React.CSSProperties = {
    width: '100%',
    padding: '8px 12px',
    fontSize: '13px',
    border: '1px solid var(--color-gray-6)',
    borderRadius: '8px',
    outline: 'none',
  };

  return (
    <Card
      style={{
        backgroundColor: 'var(--color-background)',
        borderRadius: '8px',
        borderWidth: 1,
        borderStyle: 'solid',
        borderColor: 'var(--color-border)',
        padding: '16px',
      }}
    >
      <Row style={{ alignItems: 'center', justifyContent: 'space-between', marginBottom: '16px' }}>
        <Text style={{ fontSize: '14px', fontWeight: 500, color: 'var(--color-gray-12)' }}>
          Filters
        </Text>
        {hasActiveFilters && (
          <button
            type="button"
            onClick={handleClearFilters}
            disabled={isDisabled}
            style={{
              fontSize: '14px',
              color: 'var(--color-teal-9)',
              cursor: isDisabled ? 'not-allowed' : 'pointer',
              opacity: isDisabled ? 0.5 : 1,
              background: 'none',
              border: 'none',
              padding: 0,
            }}
          >
            Clear all
          </button>
        )}
      </Row>

      <Row style={{ flexWrap: 'wrap', gap: '16px' }}>
        {/* Client Filter */}
        <Stack style={{ flex: 1, minWidth: '200px', gap: '4px' }}>
          <Text
            as="label"
            htmlFor="filter-client"
            style={{
              display: 'block',
              fontSize: '11px',
              fontWeight: 500,
              color: 'var(--color-gray-11)',
            }}
          >
            Client
          </Text>
          <select
            id="filter-client"
            value={filters.clientId || ''}
            onChange={handleClientChange}
            disabled={isDisabled}
            style={selectStyle}
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
        </Stack>

        {/* Project Filter */}
        <Stack style={{ flex: 1, minWidth: '200px', gap: '4px' }}>
          <Text
            as="label"
            htmlFor="filter-project"
            style={{
              display: 'block',
              fontSize: '11px',
              fontWeight: 500,
              color: 'var(--color-gray-11)',
            }}
          >
            Project
          </Text>
          <select
            id="filter-project"
            value={filters.projectId || ''}
            onChange={handleProjectChange}
            disabled={isDisabled}
            style={selectStyle}
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
        </Stack>

        {/* Document Type Filter */}
        <Stack style={{ flex: 1, minWidth: '200px', gap: '4px' }}>
          <Text
            as="label"
            htmlFor="filter-doc-type"
            style={{
              display: 'block',
              fontSize: '11px',
              fontWeight: 500,
              color: 'var(--color-gray-11)',
            }}
          >
            Document Type
          </Text>
          <select
            id="filter-doc-type"
            value={filters.docType || ''}
            onChange={handleDocTypeChange}
            disabled={isDisabled}
            style={selectStyle}
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
        </Stack>

        {/* Status Filter */}
        <Stack style={{ flex: 1, minWidth: '200px', gap: '4px' }}>
          <Text
            as="label"
            htmlFor="filter-status"
            style={{
              display: 'block',
              fontSize: '11px',
              fontWeight: 500,
              color: 'var(--color-gray-11)',
            }}
          >
            Status
          </Text>
          <select
            id="filter-status"
            value={filters.status || ''}
            onChange={handleStatusChange}
            disabled={isDisabled}
            style={selectStyle}
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
        </Stack>
      </Row>

      {/* Loading indicator */}
      {loading && (
        <Row style={{ alignItems: 'center', marginTop: '12px', fontSize: '14px', color: 'var(--color-gray-10)', gap: '8px' }}>
          <Loader2 size={16} color="var(--color-teal-9)" className="animate-spin" />
          <Text>Updating filters...</Text>
        </Row>
      )}
    </Card>
  );
}

export default DocumentFilterPanel;
