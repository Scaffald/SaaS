/**
 * DocumentList - Document list with filtering and search
 * Document Organization by Client/Project/GC
 * TASK-2: Build Document List with Filtering and Search
 *
 * Displays documents in a list/table format with:
 * - Filter panel integration
 * - Search functionality
 * - Loading and error states
 */

'use client';

import React, { useState, useCallback, useEffect, useMemo } from 'react';
import { Search, FileText, AlertCircle, RefreshCw, Loader2 } from 'lucide-react';
import { Stack, Row, Text, Card, Button } from '@unicornlove/beyond-ui';
import Input from '../Common/Input';
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

// Get status badge styles
const getStatusBadgeStyles = (status: string): React.CSSProperties => {
  const color = DOCUMENT_STATUS_COLORS[status as keyof typeof DOCUMENT_STATUS_COLORS] || 'gray';
  const colorMap: Record<string, { bg: string; text: string }> = {
    green: { bg: 'var(--color-green-2)', text: 'var(--color-green-11)' },
    yellow: { bg: 'var(--color-yellow-2)', text: 'var(--color-yellow-11)' },
    orange: { bg: 'var(--color-orange-2)', text: 'var(--color-orange-11)' },
    red: { bg: 'var(--color-red-2)', text: 'var(--color-red-11)' },
  };
  const styles = colorMap[color] || { bg: 'var(--color-gray-2)', text: 'var(--color-gray-11)' };
  return {
    backgroundColor: styles.bg,
    color: styles.text,
  };
};

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

  const isLoading = clientsLoading || projectsLoading || documentsLoading;
  const documents = documentsData?.documents || [];
  const totalCount = documentsData?.total || 0;

  return (
    <Stack gap="md">
      {/* Filter Panel */}
      <DocumentFilterPanel
        filters={filters}
        onFiltersChange={handleFiltersChange}
        clients={clientOptions}
        projects={projectOptions}
        loading={isLoading}
      />

      {/* Search Bar */}
      <Row style={{ position: 'relative', alignItems: 'center' }}>
        <Row
          style={{
            position: 'absolute',
            left: '12px',
            alignItems: 'center',
            justifyContent: 'center',
            pointerEvents: 'none',
            zIndex: 1,
          }}
        >
          <Search size={16} color="var(--color-gray-10)" />
        </Row>
        <Input
          type="text"
          placeholder="Search by filename..."
          value={searchTerm}
          onChange={handleSearchChange}
          disabled={isLoading}
          style={{
            width: '100%',
            paddingLeft: '40px',
            paddingRight: '16px',
            paddingTop: '8px',
            paddingBottom: '8px',
          }}
        />
      </Row>

      {/* Results Summary */}
      <Row style={{ alignItems: 'center', justifyContent: 'space-between', fontSize: '14px', color: 'var(--color-gray-10)' }}>
        <Text>
          {isLoading ? (
            'Loading documents...'
          ) : documentsError ? (
            'Error loading documents'
          ) : (
            `${totalCount} document${totalCount !== 1 ? 's' : ''} found`
          )}
        </Text>
        {!isLoading && !documentsError && (
          <button
            style={{
              display: 'flex',
              alignItems: 'center',
              color: 'var(--color-teal-9)',
              cursor: 'pointer',
              background: 'none',
              border: 'none',
              padding: 0,
            }}
            onClick={handleRetry}
          >
            <RefreshCw size={16} />
            <Text style={{ marginLeft: '4px' }}>Refresh</Text>
          </button>
        )}
      </Row>

      {/* Error State */}
      {documentsError && (
        <Card
          style={{
            backgroundColor: 'var(--color-red-2)',
            borderWidth: 1,
            borderStyle: 'solid',
            borderColor: 'var(--color-red-6)',
            borderRadius: '8px',
            padding: '16px',
          }}
        >
          <Row style={{ alignItems: 'center', marginBottom: '12px' }}>
            <AlertCircle size={20} color="var(--color-red-10)" style={{ marginRight: '8px' }} />
            <Stack>
              <Text style={{ fontSize: '14px', fontWeight: 500, color: 'var(--color-red-12)' }}>
                Failed to load documents
              </Text>
              <Text style={{ fontSize: '14px', color: 'var(--color-red-11)', marginTop: '4px' }}>
                {documentsError.message || 'An unexpected error occurred'}
              </Text>
            </Stack>
          </Row>
          <Button
            onPress={handleRetry}
            style={{
              marginTop: '12px',
              paddingLeft: '16px',
              paddingRight: '16px',
              paddingTop: '8px',
              paddingBottom: '8px',
              backgroundColor: 'var(--color-red-3)',
              color: 'var(--color-red-11)',
              fontSize: '14px',
              fontWeight: 500,
              borderRadius: '8px',
            }}
          >
            Try Again
          </Button>
        </Card>
      )}

      {/* Loading State */}
      {isLoading && !documentsError && (
        <Card
          style={{
            backgroundColor: 'var(--color-background)',
            borderRadius: '8px',
            borderWidth: 1,
            borderStyle: 'solid',
            borderColor: 'var(--color-border)',
            padding: '32px',
          }}
        >
          <Stack style={{ alignItems: 'center', justifyContent: 'center', gap: '12px' }}>
            <Loader2 size={32} color="var(--color-teal-9)" className="animate-spin" />
            <Text style={{ fontSize: '14px', color: 'var(--color-gray-10)' }}>
              Loading documents...
            </Text>
          </Stack>
        </Card>
      )}

      {/* Empty State */}
      {!isLoading && !documentsError && documents.length === 0 && (
        <Card
          style={{
            backgroundColor: 'var(--color-background)',
            borderRadius: '8px',
            borderWidth: 1,
            borderStyle: 'solid',
            borderColor: 'var(--color-border)',
            padding: '32px',
          }}
        >
          <Stack style={{ alignItems: 'center', justifyContent: 'center', gap: '12px' }}>
            <FileText size={48} color="var(--color-gray-10)" />
            <Text style={{ color: 'var(--color-gray-12)', fontWeight: 500 }}>
              No documents found
            </Text>
            <Text style={{ fontSize: '14px', color: 'var(--color-gray-10)', marginTop: '4px' }}>
              {Object.keys(filters).length > 0 || searchTerm
                ? 'Try adjusting your filters or search term'
                : 'No documents have been uploaded yet'}
            </Text>
          </Stack>
        </Card>
      )}

      {/* Document List */}
      {!isLoading && !documentsError && documents.length > 0 && (
        <Card
          style={{
            backgroundColor: 'var(--color-background)',
            borderRadius: '8px',
            borderWidth: 1,
            borderStyle: 'solid',
            borderColor: 'var(--color-border)',
            overflow: 'hidden',
          }}
        >
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr style={{ backgroundColor: 'var(--color-gray-2)' }}>
                <th
                  scope="col"
                  style={{
                    padding: '12px 24px',
                    textAlign: 'left',
                    fontSize: '11px',
                    fontWeight: 500,
                    color: 'var(--color-gray-10)',
                    textTransform: 'uppercase',
                    letterSpacing: '0.05em',
                  }}
                >
                  Document
                </th>
                <th
                  scope="col"
                  style={{
                    padding: '12px 24px',
                    textAlign: 'left',
                    fontSize: '11px',
                    fontWeight: 500,
                    color: 'var(--color-gray-10)',
                    textTransform: 'uppercase',
                    letterSpacing: '0.05em',
                  }}
                >
                  Type
                </th>
                <th
                  scope="col"
                  style={{
                    padding: '12px 24px',
                    textAlign: 'left',
                    fontSize: '11px',
                    fontWeight: 500,
                    color: 'var(--color-gray-10)',
                    textTransform: 'uppercase',
                    letterSpacing: '0.05em',
                  }}
                >
                  Status
                </th>
                <th
                  scope="col"
                  style={{
                    padding: '12px 24px',
                    textAlign: 'left',
                    fontSize: '11px',
                    fontWeight: 500,
                    color: 'var(--color-gray-10)',
                    textTransform: 'uppercase',
                    letterSpacing: '0.05em',
                  }}
                >
                  Client
                </th>
                <th
                  scope="col"
                  style={{
                    padding: '12px 24px',
                    textAlign: 'left',
                    fontSize: '11px',
                    fontWeight: 500,
                    color: 'var(--color-gray-10)',
                    textTransform: 'uppercase',
                    letterSpacing: '0.05em',
                  }}
                >
                  Project
                </th>
                <th
                  scope="col"
                  style={{
                    padding: '12px 24px',
                    textAlign: 'left',
                    fontSize: '11px',
                    fontWeight: 500,
                    color: 'var(--color-gray-10)',
                    textTransform: 'uppercase',
                    letterSpacing: '0.05em',
                  }}
                >
                  Updated
                </th>
              </tr>
            </thead>
            <tbody>
              {documents.map((document) => {
                const badgeStyles = getStatusBadgeStyles(document.status);
                return (
                  <tr
                    key={document.id}
                    onClick={() => handleDocumentClick(document)}
                    style={{
                      cursor: 'pointer',
                      borderTop: '1px solid var(--color-border)',
                    }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.backgroundColor = 'var(--color-background-hover)';
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.backgroundColor = 'transparent';
                    }}
                  >
                    <td style={{ padding: '16px 24px', whiteSpace: 'nowrap' }}>
                      <Row style={{ alignItems: 'center' }}>
                        <FileText size={20} color="var(--color-gray-10)" style={{ marginRight: '12px' }} />
                        <Text style={{ fontSize: '14px', fontWeight: 500, color: 'var(--color-gray-12)' }}>
                          {document.filename}
                        </Text>
                      </Row>
                    </td>
                    <td style={{ padding: '16px 24px', whiteSpace: 'nowrap' }}>
                      <Text style={{ fontSize: '14px', color: 'var(--color-gray-11)' }}>
                        {DOCUMENT_TYPE_LABELS[document.docType as keyof typeof DOCUMENT_TYPE_LABELS] ||
                          document.docType}
                      </Text>
                    </td>
                    <td style={{ padding: '16px 24px', whiteSpace: 'nowrap' }}>
                      <Text
                        style={{
                          display: 'inline-flex',
                          paddingLeft: '8px',
                          paddingRight: '8px',
                          paddingTop: '4px',
                          paddingBottom: '4px',
                          fontSize: '11px',
                          fontWeight: 500,
                          borderRadius: '9999px',
                          ...badgeStyles,
                        }}
                      >
                        {DOCUMENT_STATUS_LABELS[document.status as keyof typeof DOCUMENT_STATUS_LABELS] ||
                          document.status}
                      </Text>
                    </td>
                    <td style={{ padding: '16px 24px', whiteSpace: 'nowrap' }}>
                      <Text style={{ fontSize: '14px', color: 'var(--color-gray-11)' }}>
                        {document.clientName}
                      </Text>
                    </td>
                    <td style={{ padding: '16px 24px', whiteSpace: 'nowrap' }}>
                      <Text style={{ fontSize: '14px', color: 'var(--color-gray-11)' }}>
                        {document.projectName || '-'}
                      </Text>
                    </td>
                    <td style={{ padding: '16px 24px', whiteSpace: 'nowrap' }}>
                      <Text style={{ fontSize: '14px', color: 'var(--color-gray-11)' }}>
                        {formatDate(document.updatedAt)}
                      </Text>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </Card>
      )}
    </Stack>
  );
}

export default DocumentList;
