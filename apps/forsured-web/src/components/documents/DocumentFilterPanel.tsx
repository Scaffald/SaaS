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
    <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-sm font-medium text-gray-900">Filters</h3>
        {hasActiveFilters && (
          <button
            type="button"
            onClick={handleClearFilters}
            disabled={isDisabled}
            className="text-sm text-blue-600 hover:text-blue-800 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Clear all
          </button>
        )}
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Client Filter */}
        <div className="space-y-1">
          <label
            htmlFor="filter-client"
            className="block text-xs font-medium text-gray-700"
          >
            Client
          </label>
          <select
            id="filter-client"
            value={filters.clientId || ''}
            onChange={handleClientChange}
            disabled={isDisabled}
            className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:bg-gray-100 disabled:cursor-not-allowed"
          >
            <option value="">All Clients</option>
            {clients.map((client) => (
              <option key={client.id} value={client.id}>
                {client.name} ({client.type === 'gc' ? 'GC' : 'Sub'})
              </option>
            ))}
          </select>
        </div>

        {/* Project Filter */}
        <div className="space-y-1">
          <label
            htmlFor="filter-project"
            className="block text-xs font-medium text-gray-700"
          >
            Project
          </label>
          <select
            id="filter-project"
            value={filters.projectId || ''}
            onChange={handleProjectChange}
            disabled={isDisabled}
            className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:bg-gray-100 disabled:cursor-not-allowed"
          >
            <option value="">All Projects</option>
            {filteredProjects.map((project) => (
              <option key={project.id} value={project.id}>
                {project.name}
              </option>
            ))}
          </select>
        </div>

        {/* Document Type Filter */}
        <div className="space-y-1">
          <label
            htmlFor="filter-doc-type"
            className="block text-xs font-medium text-gray-700"
          >
            Document Type
          </label>
          <select
            id="filter-doc-type"
            value={filters.docType || ''}
            onChange={handleDocTypeChange}
            disabled={isDisabled}
            className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:bg-gray-100 disabled:cursor-not-allowed"
          >
            <option value="">All Types</option>
            {DOCUMENT_TYPE_OPTIONS.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
        </div>

        {/* Status Filter */}
        <div className="space-y-1">
          <label
            htmlFor="filter-status"
            className="block text-xs font-medium text-gray-700"
          >
            Status
          </label>
          <select
            id="filter-status"
            value={filters.status || ''}
            onChange={handleStatusChange}
            disabled={isDisabled}
            className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:bg-gray-100 disabled:cursor-not-allowed"
          >
            <option value="">All Statuses</option>
            {DOCUMENT_STATUS_OPTIONS.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Loading indicator */}
      {loading && (
        <div className="mt-3 flex items-center text-sm text-gray-500">
          <svg
            className="animate-spin h-4 w-4 mr-2"
            viewBox="0 0 24 24"
            fill="none"
          >
            <circle
              className="opacity-25"
              cx="12"
              cy="12"
              r="10"
              stroke="currentColor"
              strokeWidth="4"
            />
            <path
              className="opacity-75"
              fill="currentColor"
              d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
            />
          </svg>
          Updating filters...
        </div>
      )}
    </div>
  );
}

export default DocumentFilterPanel;
