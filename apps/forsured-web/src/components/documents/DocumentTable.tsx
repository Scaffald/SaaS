/**
 * REQ-124: Document Upload & Storage - DocumentTable Component
 * Display and manage uploaded documents with filtering and actions
 */

import React from 'react';
import { Download, RotateCw, Trash2, FileText } from 'lucide-react';
import { Stack, Row, Text, Card } from '@unicornlove/beyond-ui';
import type { Document, DocumentStatus } from '../../types/document';

interface DocumentTableProps {
  documents: Document[];
  onDownload?: (document: Document) => void;
  onDelete?: (documentId: string) => void;
  onReprocess?: (documentId: string) => void;
  canDelete?: (document: Document) => boolean;
  canReprocess?: (document: Document) => boolean;
}

const getStatusBadgeStyles = (status: DocumentStatus): React.CSSProperties => {
  const badgeMap: Record<DocumentStatus, { bg: string; text: string }> = {
    pending: { bg: 'var(--color-yellow-2)', text: 'var(--color-yellow-11)' },
    processing: { bg: 'var(--color-blue-2)', text: 'var(--color-blue-11)' },
    completed: { bg: 'var(--color-green-2)', text: 'var(--color-green-11)' },
    error: { bg: 'var(--color-red-2)', text: 'var(--color-red-11)' },
  };
  const colors = badgeMap[status] || { bg: 'var(--color-gray-2)', text: 'var(--color-gray-11)' };
  return {
    backgroundColor: colors.bg,
    color: colors.text,
  };
};

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
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          paddingTop: '48px',
          paddingBottom: '48px',
          backgroundColor: 'var(--color-gray-2)',
          borderRadius: '8px',
        }}
      >
        <Stack style={{ alignItems: 'center', gap: '8px' }}>
          <FileText size={48} color="var(--color-gray-10)" />
          <Text style={{ marginTop: '8px', fontSize: '14px', fontWeight: 500, color: 'var(--color-gray-12)' }}>
            No documents
          </Text>
          <Text style={{ marginTop: '4px', fontSize: '14px', color: 'var(--color-gray-10)' }}>
            Upload your first document to get started.
          </Text>
        </Stack>
      </Card>
    );
  }

  return (
    <Card
      style={{
        overflowX: 'auto',
        borderWidth: 1,
        borderStyle: 'solid',
        borderColor: 'var(--color-border)',
        borderRadius: '8px',
      }}
    >
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
            const badgeStyles = getStatusBadgeStyles(document.status);
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
                  <Stack>
                    <Text style={{ fontSize: '14px', fontWeight: 500, color: 'var(--color-gray-12)' }}>
                      {document.file_name}
                    </Text>
                    {document.error_message && (
                      <Text style={{ fontSize: '11px', color: 'var(--color-red-10)', marginTop: '4px' }}>
                        {document.error_message}
                      </Text>
                    )}
                  </Stack>
                </td>
                <td style={{ padding: '16px 24px', whiteSpace: 'nowrap' }}>
                  <Text style={{ fontSize: '14px', color: 'var(--color-gray-10)' }}>
                    {formatFileSize(document.file_size)}
                  </Text>
                </td>
                <td style={{ padding: '16px 24px', whiteSpace: 'nowrap' }}>
                  <Text style={{ fontSize: '14px', color: 'var(--color-gray-10)' }}>
                    {formatDate(document.upload_date)}
                  </Text>
                </td>
                <td style={{ padding: '16px 24px', whiteSpace: 'nowrap' }}>
                  <Text
                    style={{
                      display: 'inline-flex',
                      alignItems: 'center',
                      paddingLeft: '10px',
                      paddingRight: '10px',
                      paddingTop: '2px',
                      paddingBottom: '2px',
                      borderRadius: '9999px',
                      fontSize: '11px',
                      fontWeight: 500,
                      ...badgeStyles,
                    }}
                  >
                    {document.status.charAt(0).toUpperCase() + document.status.slice(1)}
                  </Text>
                </td>
                <td style={{ padding: '16px 24px', whiteSpace: 'nowrap', textAlign: 'right' }}>
                  <Row style={{ justifyContent: 'flex-end', gap: '8px', fontSize: '14px', fontWeight: 500 }}>
                    <button
                      style={{
                        color: 'var(--color-teal-9)',
                        background: 'none',
                        border: 'none',
                        cursor: 'pointer',
                        padding: 0,
                      }}
                      onClick={() => handleDownload(document)}
                      title="Download"
                    >
                      <Download size={20} />
                    </button>

                    {document.status === 'error' && canReprocess(document) && onReprocess && (
                      <button
                        style={{
                          color: 'var(--color-blue-9)',
                          background: 'none',
                          border: 'none',
                          cursor: 'pointer',
                          padding: 0,
                        }}
                        onClick={() => onReprocess(document.id)}
                        title="Re-process"
                      >
                        <RotateCw size={20} />
                      </button>
                    )}

                    {canDelete(document) && onDelete && (
                      <button
                        style={{
                          color: 'var(--color-red-9)',
                          background: 'none',
                          border: 'none',
                          cursor: 'pointer',
                          padding: 0,
                        }}
                        onClick={() => handleDelete(document.id)}
                        title="Delete"
                      >
                        <Trash2 size={20} />
                      </button>
                    )}
                  </Row>
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </Card>
  );
};
