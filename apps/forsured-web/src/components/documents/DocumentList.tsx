/**
 * DocumentList - Document list with filtering and search
 * REQ-284: Document Organization by Client/Project/GC
 * TASK-2: Build Document List with Filtering and Search
 *
 * Displays documents in a list/table format with:
 * - Filter panel integration
 * - Search functionality
 * - Loading and error states
 */

'use client';

import React, { useState, useCallback, useEffect, useMemo } from 'react';
import { Search, FileText, AlertCircle, RefreshCw } from 'lucide-react';
import { DocumentFilterPanel } from './DocumentFilterPanel';
import type {
  DocumentFilterState,
  ClientOption,
  ProjectOption,
} from '../../types/document-filters';
import {
  DOCUMENT_TYPE_LABELS,
  DOCUMENT_STATUS_LABELS,
  DOCUMENT_STATUS_COLORS,
} from '../../types/document-filters';
import type { DocumentListItem } from '../../types/document';
import { trpc } from '../../lib/trpc';

// Status badge color mapping
const STATUS_BADGE_CLASSES: Record<string, string> = {
  green: 'bg-green-100 text-green-800',
  yellow: 'bg-yellow-100 text-yellow-800',
  orange: 'bg-orange-100 text-orange-800',
  red: 'bg-red-100 text-red-800',
};

interface DocumentListProps {
  /** Organization ID for data fetching */
  organizationId: string;
  /** Callback when a document is clicked */
  onDocumentClick?: (document: DocumentListItem) => void;
}

/**
 * Debounce hook for search input
 */
function useDebounce<T>(value: T, delay: number): T {
  const [debouncedValue, setDebouncedValue] = useState<T>(value);

  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedValue(value);
    }, delay);

    return () => {
      clearTimeout(handler);
    };
  }, [value, delay]);

  return debouncedValue;
}

export function DocumentList({ organizationId, onDocumentClick }: DocumentListProps) {
  // Filter state
  const [filters, setFilters] = useState<DocumentFilterState>({});
  const [searchTerm, setSearchTerm] = useState('');
  const debouncedSearch = useDebounce(searchTerm, 300);

  // Fetch clients for filter dropdown
  const {
    data: clients,
    isLoading: clientsLoading,
  } = trpc.documents.getClients.useQuery(
    { organizationId },
    { enabled: !!organizationId }
  );

  // Fetch projects for filter dropdown
  const {
    data: projects,
    isLoading: projectsLoading,
  } = trpc.documents.getProjects.useQuery(
    { organizationId, clientId: filters.clientId },
    { enabled: !!organizationId }
  );

  // Fetch documents with current filters
  const {
    data: documentsData,
    isLoading: documentsLoading,
    error: documentsError,
    refetch: refetchDocuments,
  } = trpc.documents.list.useQuery(
    {
      organizationId,
      clientId: filters.clientId,
      projectId: filters.projectId,
      docType: filters.docType,
      status: filters.status,
      search: debouncedSearch || undefined,
      limit: 100,
      offset: 0,
    },
    { enabled: !!organizationId }
  );

  // Map clients to filter options
  const clientOptions: ClientOption[] = useMemo(
    () =>
      clients?.map((c) => ({
        id: c.id,
        name: c.name,
        type: c.type,
      })) || [],
    [clients]
  );

  // Map projects to filter options
  const projectOptions: ProjectOption[] = useMemo(
    () =>
      projects?.map((p) => ({
        id: p.id,
        name: p.name,
        clientId: p.clientId,
      })) || [],
    [projects]
  );

  // Handle filter changes
  const handleFiltersChange = useCallback((newFilters: DocumentFilterState) => {
    setFilters(newFilters);
  }, []);

  // Handle search input change
  const handleSearchChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchTerm(e.target.value);
  }, []);

  // Handle document click
  const handleDocumentClick = useCallback(
    (document: DocumentListItem) => {
      onDocumentClick?.(document);
    },
    [onDocumentClick]
  );

  // Handle retry on error
  const handleRetry = useCallback(() => {
    refetchDocuments();
  }, [refetchDocuments]);

  // Format date for display
  const formatDate = (dateString: string): string => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  };

  // Get status badge classes
  const getStatusBadgeClasses = (status: string): string => {
    const color = DOCUMENT_STATUS_COLORS[status as keyof typeof DOCUMENT_STATUS_COLORS] || 'gray';
    return STATUS_BADGE_CLASSES[color] || 'bg-gray-100 text-gray-800';
  };

  const isLoading = clientsLoading || projectsLoading || documentsLoading;
  const documents = documentsData?.documents || [];
  const totalCount = documentsData?.total || 0;

  return (
    <div className="space-y-4">
      {/* Filter Panel */}
      <DocumentFilterPanel
        filters={filters}
        onFiltersChange={handleFiltersChange}
        clients={clientOptions}
        projects={projectOptions}
        loading={isLoading}
      />

      {/* Search Bar */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
        <input
          type="text"
          placeholder="Search by filename..."
          value={searchTerm}
          onChange={handleSearchChange}
          disabled={isLoading}
          className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:bg-gray-100 disabled:cursor-not-allowed"
        />
      </div>

      {/* Results Summary */}
      <div className="flex items-center justify-between text-sm text-gray-600">
        <span>
          {isLoading ? (
            'Loading documents...'
          ) : documentsError ? (
            'Error loading documents'
          ) : (
            `${totalCount} document${totalCount !== 1 ? 's' : ''} found`
          )}
        </span>
        {!isLoading && !documentsError && (
          <button
            onClick={handleRetry}
            className="flex items-center text-blue-600 hover:text-blue-800"
          >
            <RefreshCw className="h-4 w-4 mr-1" />
            Refresh
          </button>
        )}
      </div>

      {/* Error State */}
      {documentsError && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4">
          <div className="flex items-center">
            <AlertCircle className="h-5 w-5 text-red-500 mr-2" />
            <div>
              <p className="text-sm font-medium text-red-800">Failed to load documents</p>
              <p className="text-sm text-red-600 mt-1">
                {documentsError.message || 'An unexpected error occurred'}
              </p>
            </div>
          </div>
          <button
            onClick={handleRetry}
            className="mt-3 px-4 py-2 bg-red-100 text-red-700 rounded-lg hover:bg-red-200 text-sm font-medium"
          >
            Try Again
          </button>
        </div>
      )}

      {/* Loading State */}
      {isLoading && !documentsError && (
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-8">
          <div className="flex flex-col items-center justify-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mb-3" />
            <p className="text-sm text-gray-600">Loading documents...</p>
          </div>
        </div>
      )}

      {/* Empty State */}
      {!isLoading && !documentsError && documents.length === 0 && (
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-8">
          <div className="flex flex-col items-center justify-center text-center">
            <FileText className="h-12 w-12 text-gray-400 mb-3" />
            <p className="text-gray-900 font-medium">No documents found</p>
            <p className="text-sm text-gray-600 mt-1">
              {Object.keys(filters).length > 0 || searchTerm
                ? 'Try adjusting your filters or search term'
                : 'No documents have been uploaded yet'}
            </p>
          </div>
        </div>
      )}

      {/* Document List */}
      {!isLoading && !documentsError && documents.length > 0 && (
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th
                  scope="col"
                  className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                >
                  Document
                </th>
                <th
                  scope="col"
                  className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                >
                  Type
                </th>
                <th
                  scope="col"
                  className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                >
                  Status
                </th>
                <th
                  scope="col"
                  className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                >
                  Client
                </th>
                <th
                  scope="col"
                  className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                >
                  Project
                </th>
                <th
                  scope="col"
                  className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                >
                  Updated
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {documents.map((document) => (
                <tr
                  key={document.id}
                  onClick={() => handleDocumentClick(document)}
                  className="hover:bg-gray-50 cursor-pointer transition-colors"
                >
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center">
                      <FileText className="h-5 w-5 text-gray-400 mr-3" />
                      <div className="text-sm font-medium text-gray-900">
                        {document.filename}
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className="text-sm text-gray-600">
                      {DOCUMENT_TYPE_LABELS[document.docType as keyof typeof DOCUMENT_TYPE_LABELS] ||
                        document.docType}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span
                      className={`inline-flex px-2 py-1 text-xs font-medium rounded-full ${getStatusBadgeClasses(document.status)}`}
                    >
                      {DOCUMENT_STATUS_LABELS[document.status as keyof typeof DOCUMENT_STATUS_LABELS] ||
                        document.status}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className="text-sm text-gray-600">{document.clientName}</span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className="text-sm text-gray-600">
                      {document.projectName || '-'}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className="text-sm text-gray-600">
                      {formatDate(document.updatedAt)}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

export default DocumentList;
