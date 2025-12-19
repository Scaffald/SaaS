/**
 * REQ-124: Document Upload & Storage - DocumentTable Component
 * Display and manage uploaded documents with filtering and actions
 */

import { Download, RotateCw, Trash2, FileText } from 'lucide-react';
import { YStack, XStack, Text, Card } from '@unicornlove/ui';
import type { Document, DocumentStatus } from '../../types/document';

interface DocumentTableProps {
  documents: Document[];
  onDownload?: (document: Document) => void;
  onDelete?: (documentId: string) => void;
  onReprocess?: (documentId: string) => void;
  canDelete?: (document: Document) => boolean;
  canReprocess?: (document: Document) => boolean;
}

export const DocumentTable: React.FC<DocumentTableProps> = ({
  documents,
  onDownload,
  onDelete,
  onReprocess,
  canDelete = () => true,
  canReprocess = () => true
}) => {
  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
      hour: 'numeric',
      minute: '2-digit'
    });
  };

  const formatFileSize = (bytes: number) => {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  };

  const getStatusBadgeProps = (status: DocumentStatus) => {
    const badgeMap: Record<DocumentStatus, { bg: string; text: string }> = {
      pending: { bg: '$yellow2', text: '$yellow11' },
      processing: { bg: '$blue2', text: '$blue11' },
      completed: { bg: '$green2', text: '$green11' },
      error: { bg: '$red2', text: '$red11' },
    };
    return badgeMap[status] || { bg: '$gray2', text: '$gray11' };
  };

  const handleDownload = (document: Document) => {
    // Decode Base64 and trigger download
    const byteCharacters = atob(document.file_data);
    const byteNumbers = new Array(byteCharacters.length);
    for (let i = 0; i < byteCharacters.length; i++) {
      byteNumbers[i] = byteCharacters.charCodeAt(i);
    }
    const byteArray = new Uint8Array(byteNumbers);
    const blob = new Blob([byteArray], { type: 'application/pdf' });
    const url = window.URL.createObjectURL(blob);
    const link = window.document.createElement('a');
    link.href = url;
    link.download = document.file_name;
    link.click();
    window.URL.revokeObjectURL(url);

    onDownload?.(document);
  };

  const handleDelete = (documentId: string) => {
    if (window.confirm('Are you sure you want to delete this document? This action cannot be undone.')) {
      onDelete?.(documentId);
    }
  };

  if (documents.length === 0) {
    return (
      <Card
        alignItems="center"
        paddingVertical="$12"
        backgroundColor="$gray2"
        borderRadius="$4"
      >
        <YStack alignItems="center" gap="$2">
          <FileText size={48} color="$color10" />
          <Text marginTop="$2" fontSize="$3" fontWeight="500" color="$color12">
            No documents
          </Text>
          <Text marginTop="$1" fontSize="$3" color="$color10">
            Upload your first document to get started.
          </Text>
        </YStack>
      </Card>
    );
  }

  return (
    <Card overflowX="auto" borderWidth={1} borderColor="$borderColor" borderRadius="$4">
      <table style={{ width: '100%', borderCollapse: 'collapse' }}>
        <thead>
          <tr style={{ backgroundColor: 'var(--color-gray-2)' }}>
            <th
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
              File Name
            </th>
            <th
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
              Size
            </th>
            <th
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
              Upload Date
            </th>
            <th
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
              style={{
                padding: '12px 24px',
                textAlign: 'right',
                fontSize: '11px',
                fontWeight: 500,
                color: 'var(--color-gray-10)',
                textTransform: 'uppercase',
                letterSpacing: '0.05em',
              }}
            >
              Actions
            </th>
          </tr>
        </thead>
        <tbody>
          {documents.map((document) => {
            const badgeProps = getStatusBadgeProps(document.status);
            return (
              <tr
                key={document.id}
                style={{
                  borderTop: '1px solid var(--color-border)',
                  cursor: 'pointer',
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.backgroundColor = 'var(--color-background-hover)';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.backgroundColor = 'transparent';
                }}
              >
                <td style={{ padding: '16px 24px', whiteSpace: 'nowrap' }}>
                  <YStack>
                    <Text fontSize="$3" fontWeight="500" color="$color12">
                      {document.file_name}
                    </Text>
                    {document.error_message && (
                      <Text fontSize="$1" color="$red10" marginTop="$1">
                        {document.error_message}
                      </Text>
                    )}
                  </YStack>
                </td>
                <td style={{ padding: '16px 24px', whiteSpace: 'nowrap' }}>
                  <Text fontSize="$3" color="$color10">
                    {formatFileSize(document.file_size)}
                  </Text>
                </td>
                <td style={{ padding: '16px 24px', whiteSpace: 'nowrap' }}>
                  <Text fontSize="$3" color="$color10">
                    {formatDate(document.upload_date)}
                  </Text>
                </td>
                <td style={{ padding: '16px 24px', whiteSpace: 'nowrap' }}>
                  <Text
                    display="inline-flex"
                    alignItems="center"
                    paddingHorizontal="$2.5"
                    paddingVertical="$0.5"
                    borderRadius={9999}
                    fontSize="$1"
                    fontWeight="500"
                    backgroundColor={badgeProps.bg}
                    color={badgeProps.text}
                  >
                    {document.status.charAt(0).toUpperCase() + document.status.slice(1)}
                  </Text>
                </td>
                <td style={{ padding: '16px 24px', whiteSpace: 'nowrap', textAlign: 'right' }}>
                  <XStack justifyContent="flex-end" gap="$2" fontSize="$3" fontWeight="500">
                    <XStack
                      as="button"
                      color="$teal9"
                      hoverStyle={{ color: '$teal11' }}
                      onClick={() => handleDownload(document)}
                      title="Download"
                      cursor="pointer"
                    >
                      <Download size={20} />
                    </XStack>

                    {document.status === 'error' && canReprocess(document) && onReprocess && (
                      <XStack
                        as="button"
                        color="$blue9"
                        hoverStyle={{ color: '$blue11' }}
                        onClick={() => onReprocess(document.id)}
                        title="Re-process"
                        cursor="pointer"
                      >
                        <RotateCw size={20} />
                      </XStack>
                    )}

                    {canDelete(document) && onDelete && (
                      <XStack
                        as="button"
                        color="$red9"
                        hoverStyle={{ color: '$red11' }}
                        onClick={() => handleDelete(document.id)}
                        title="Delete"
                        cursor="pointer"
                      >
                        <Trash2 size={20} />
                      </XStack>
                    )}
                  </XStack>
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </Card>
  );
};
