/**
 * DocumentTable - document upload and storage
 * Display and manage uploaded documents with filtering and actions
 * Migrated to use Beyond UI Table component
 */

import React, { useMemo } from 'react'
import { Download, RotateCw, Trash2, FileText } from 'lucide-react'
import { Stack, Row, Text, Card, Table, TableCell } from '@unicornlove/beyond-ui'
import type { Document, DocumentStatus } from '../../types/document'
import type { TableColumn, TableRowData } from '@unicornlove/beyond-ui'

interface DocumentTableProps {
  documents: Document[]
  onDownload?: (document: Document) => void
  onDelete?: (documentId: string) => void
  onReprocess?: (documentId: string) => void
  canDelete?: (document: Document) => boolean
  canReprocess?: (document: Document) => boolean
}

const getStatusBadgeStyles = (status: DocumentStatus): React.CSSProperties => {
  const badgeMap: Record<DocumentStatus, { bg: string; text: string }> = {
    pending: { bg: 'var(--color-yellow-2)', text: 'var(--color-yellow-11)' },
    processing: { bg: 'var(--color-blue-2)', text: 'var(--color-blue-11)' },
    completed: { bg: 'var(--color-green-2)', text: 'var(--color-green-11)' },
    error: { bg: 'var(--color-red-2)', text: 'var(--color-red-11)' },
  }
  const colors = badgeMap[status] || { bg: 'var(--color-gray-2)', text: 'var(--color-gray-11)' }
  return {
    backgroundColor: colors.bg,
    color: colors.text,
  }
}

export const DocumentTable: React.FC<DocumentTableProps> = ({
  documents,
  onDownload,
  onDelete,
  onReprocess,
  canDelete = () => true,
  canReprocess = () => true,
}) => {
  const formatDate = (dateString: string) => {
    const date = new Date(dateString)
    return date.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
      hour: 'numeric',
      minute: '2-digit',
    })
  }

  const formatFileSize = (bytes: number) => {
    if (bytes < 1024) return `${bytes} B`
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`
  }

  const handleDownload = (document: Document) => {
    // Decode Base64 and trigger download
    const byteCharacters = atob(document.file_data)
    const byteNumbers = new Array(byteCharacters.length)
    for (let i = 0; i < byteCharacters.length; i++) {
      byteNumbers[i] = byteCharacters.charCodeAt(i)
    }
    const byteArray = new Uint8Array(byteNumbers)
    const blob = new Blob([byteArray], { type: 'application/pdf' })
    const url = window.URL.createObjectURL(blob)
    const link = window.document.createElement('a')
    link.href = url
    link.download = document.file_name
    link.click()
    window.URL.revokeObjectURL(url)

    onDownload?.(document)
  }

  const handleDelete = (documentId: string) => {
    if (
      window.confirm('Are you sure you want to delete this document? This action cannot be undone.')
    ) {
      onDelete?.(documentId)
    }
  }

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
          <Text
            style={{
              marginTop: '8px',
              fontSize: '14px',
              fontWeight: 500,
              color: 'var(--color-gray-12)',
            }}
          >
            No documents
          </Text>
          <Text style={{ marginTop: '4px', fontSize: '14px', color: 'var(--color-gray-10)' }}>
            Upload your first document to get started.
          </Text>
        </Stack>
      </Card>
    )
  }

  // Convert documents to table data format
  const tableData = useMemo<TableRowData[]>(
    () =>
      documents.map((doc) => ({
        id: doc.id,
        fileName: doc.file_name,
        fileSize: doc.file_size,
        uploadDate: doc.upload_date,
        status: doc.status,
        errorMessage: doc.error_message,
        document: doc, // Keep full document for handlers
      })),
    [documents]
  )

  // Define table columns
  const columns: TableColumn[] = useMemo(
    () => [
      {
        id: 'fileName',
        title: 'File Name',
        width: 300,
        render: (value, row) => (
          <TableCell
            type="file"
            text={String(value)}
            fileSize={formatFileSize((row as any).fileSize)}
            fileType="PDF"
          />
        ),
      },
      {
        id: 'fileSize',
        title: 'Size',
        width: 120,
        render: (value) => <TableCell type="text-default" text={formatFileSize(Number(value))} />,
      },
      {
        id: 'uploadDate',
        title: 'Upload Date',
        width: 180,
        render: (value) => <TableCell type="text-default" text={formatDate(String(value))} />,
      },
      {
        id: 'status',
        title: 'Status',
        width: 120,
        cellType: 'status',
        render: (value, row) => {
          const status = String(value) as DocumentStatus
          const statusMap: Record<
            DocumentStatus,
            'success' | 'error' | 'warning' | 'info' | 'in-progress'
          > = {
            completed: 'success',
            error: 'error',
            pending: 'warning',
            processing: 'in-progress',
          }
          return (
            <TableCell
              type="status"
              statusType={statusMap[status] || 'info'}
              statusLabel={status.charAt(0).toUpperCase() + status.slice(1)}
            />
          )
        },
      },
      {
        id: 'actions',
        title: 'Actions',
        width: 150,
        align: 'right',
        render: (_value, row) => {
          const doc = (row as any).document as Document
          const actions = []
          if (onDownload) {
            actions.push({
              icon: Download,
              onPress: () => handleDownload(doc),
              label: 'Download',
            })
          }
          if (doc.status === 'error' && canReprocess(doc) && onReprocess) {
            actions.push({
              icon: RotateCw,
              onPress: () => onReprocess(doc.id),
              label: 'Re-process',
            })
          }
          if (canDelete(doc) && onDelete) {
            actions.push({
              icon: Trash2,
              onPress: () => handleDelete(doc.id),
              label: 'Delete',
            })
          }
          return <TableCell type="actions" actions={actions} />
        },
      },
    ],
    [onDownload, onDelete, onReprocess, canDelete, canReprocess]
  )

  return (
    <Card
      style={{
        overflowX: 'auto',
        borderWidth: 1,
        borderStyle: 'solid',
        borderColor: 'var(--color-border)',
        borderRadius: '8px',
        padding: 0,
      }}
    >
      <Table
        columns={columns}
        data={tableData}
        showHeader={true}
        emptyMessage="No documents found"
        renderEmpty={() => (
          <Stack style={{ alignItems: 'center', gap: '8px', padding: '48px' }}>
            <FileText size={48} color="var(--color-gray-10)" />
            <Text
              style={{
                marginTop: '8px',
                fontSize: '14px',
                fontWeight: 500,
                color: 'var(--color-gray-12)',
              }}
            >
              No documents
            </Text>
            <Text style={{ marginTop: '4px', fontSize: '14px', color: 'var(--color-gray-10)' }}>
              Upload your first document to get started.
            </Text>
          </Stack>
        )}
      />
    </Card>
  )
}
