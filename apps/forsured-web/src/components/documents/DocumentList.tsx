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

import { useState, useCallback, useEffect, useMemo } from 'react';
import { Search, FileText, AlertCircle, RefreshCw } from 'lucide-react';
import { YStack, XStack, Text, Card, Button, Spinner } from '@unicornlove/ui';
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

// Status badge color mapping - now using inline Tamagui props

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

  // Get status badge props for Tamagui
  const getStatusBadgeProps = (status: string) => {
    const color = DOCUMENT_STATUS_COLORS[status as keyof typeof DOCUMENT_STATUS_COLORS] || 'gray';
    const colorMap: Record<string, { bg: string; text: string }> = {
      green: { bg: '$green2', text: '$green11' },
      yellow: { bg: '$yellow2', text: '$yellow11' },
      orange: { bg: '$orange2', text: '$orange11' },
      red: { bg: '$red2', text: '$red11' },
    };
    return colorMap[color] || { bg: '$gray2', text: '$gray11' };
  };

  const isLoading = clientsLoading || projectsLoading || documentsLoading;
  const documents = documentsData?.documents || [];
  const totalCount = documentsData?.total || 0;

  return (
    <YStack gap="$4">
      {/* Filter Panel */}
      <DocumentFilterPanel
        filters={filters}
        onFiltersChange={handleFiltersChange}
        clients={clientOptions}
        projects={projectOptions}
        loading={isLoading}
      />

      {/* Search Bar */}
      <XStack position="relative" alignItems="center">
        <XStack
          position="absolute"
          left="$3"
          alignItems="center"
          justifyContent="center"
          pointerEvents="none"
          zIndex={1}
        >
          <Search size={16} color="$color10" />
        </XStack>
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
      </XStack>

      {/* Results Summary */}
      <XStack alignItems="center" justifyContent="space-between" fontSize="$3" color="$color10">
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
          <XStack
            as="button"
            alignItems="center"
            color="$teal9"
            hoverStyle={{ color: '$teal11' }}
            onClick={handleRetry}
            cursor="pointer"
          >
            <RefreshCw size={16} />
            <Text marginLeft="$1">Refresh</Text>
          </XStack>
        )}
      </XStack>

      {/* Error State */}
      {documentsError && (
        <Card
          backgroundColor="$red2"
          borderWidth={1}
          borderColor="$red6"
          borderRadius="$4"
          padding="$4"
        >
          <XStack alignItems="center" marginBottom="$3">
            <AlertCircle size={20} color="$red10" marginRight="$2" />
            <YStack>
              <Text fontSize="$3" fontWeight="500" color="$red12">
                Failed to load documents
              </Text>
              <Text fontSize="$3" color="$red11" marginTop="$1">
                {documentsError.message || 'An unexpected error occurred'}
              </Text>
            </YStack>
          </XStack>
          <Button
            onClick={handleRetry}
            marginTop="$3"
            paddingHorizontal="$4"
            paddingVertical="$2"
            backgroundColor="$red3"
            color="$red11"
            hoverStyle={{ backgroundColor: '$red4' }}
            fontSize="$3"
            fontWeight="500"
            borderRadius="$4"
          >
            Try Again
          </Button>
        </Card>
      )}

      {/* Loading State */}
      {isLoading && !documentsError && (
        <Card
          backgroundColor="$background"
          borderRadius="$4"
          elevation={1}
          borderWidth={1}
          borderColor="$borderColor"
          padding="$8"
        >
          <YStack alignItems="center" justifyContent="center" gap="$3">
            <Spinner size="large" color="$teal9" />
            <Text fontSize="$3" color="$color10">
              Loading documents...
            </Text>
          </YStack>
        </Card>
      )}

      {/* Empty State */}
      {!isLoading && !documentsError && documents.length === 0 && (
        <Card
          backgroundColor="$background"
          borderRadius="$4"
          elevation={1}
          borderWidth={1}
          borderColor="$borderColor"
          padding="$8"
        >
          <YStack alignItems="center" justifyContent="center" gap="$3">
            <FileText size={48} color="$color10" />
            <Text color="$color12" fontWeight="500">
              No documents found
            </Text>
            <Text fontSize="$3" color="$color10" marginTop="$1">
              {Object.keys(filters).length > 0 || searchTerm
                ? 'Try adjusting your filters or search term'
                : 'No documents have been uploaded yet'}
            </Text>
          </YStack>
        </Card>
      )}

      {/* Document List */}
      {!isLoading && !documentsError && documents.length > 0 && (
        <Card
          backgroundColor="$background"
          borderRadius="$4"
          elevation={1}
          borderWidth={1}
          borderColor="$borderColor"
          overflow="hidden"
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
                const badgeProps = getStatusBadgeProps(document.status);
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
                      <XStack alignItems="center">
                        <FileText size={20} color="$color10" marginRight="$3" />
                        <Text fontSize="$3" fontWeight="500" color="$color12">
                          {document.filename}
                        </Text>
                      </XStack>
                    </td>
                    <td style={{ padding: '16px 24px', whiteSpace: 'nowrap' }}>
                      <Text fontSize="$3" color="$color11">
                        {DOCUMENT_TYPE_LABELS[document.docType as keyof typeof DOCUMENT_TYPE_LABELS] ||
                          document.docType}
                      </Text>
                    </td>
                    <td style={{ padding: '16px 24px', whiteSpace: 'nowrap' }}>
                      <Text
                        display="inline-flex"
                        paddingHorizontal="$2"
                        paddingVertical="$1"
                        fontSize="$1"
                        fontWeight="500"
                        borderRadius={9999}
                        backgroundColor={badgeProps.bg}
                        color={badgeProps.text}
                      >
                        {DOCUMENT_STATUS_LABELS[document.status as keyof typeof DOCUMENT_STATUS_LABELS] ||
                          document.status}
                      </Text>
                    </td>
                    <td style={{ padding: '16px 24px', whiteSpace: 'nowrap' }}>
                      <Text fontSize="$3" color="$color11">
                        {document.clientName}
                      </Text>
                    </td>
                    <td style={{ padding: '16px 24px', whiteSpace: 'nowrap' }}>
                      <Text fontSize="$3" color="$color11">
                        {document.projectName || '-'}
                      </Text>
                    </td>
                    <td style={{ padding: '16px 24px', whiteSpace: 'nowrap' }}>
                      <Text fontSize="$3" color="$color11">
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
    </YStack>
  );
}

export default DocumentList;
