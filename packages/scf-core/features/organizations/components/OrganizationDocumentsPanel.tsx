import { Table, type TableColumn, type TableRowData } from '@scaffald/ui'
import { useMemo } from 'react'
import { Button, Card, H4, Paragraph, Separator, Spinner, Text, Row, useThemeContext } from '@scaffald/ui'
import { colors } from '@scaffald/ui/tokens'
import {
  useDocumentDownloadUrl,
  useDocumentUploadSession,
  useOrganizationDocuments,
  useOrganizationFolders,
} from '../api'

type OrganizationDocumentsPanelProps = {
  organizationId: string
}

export function OrganizationDocumentsPanel({ organizationId }: OrganizationDocumentsPanelProps) {
  const { theme } = useThemeContext()
  const t = theme === 'dark' ? 'dark' : 'light'
  const { data: documentsResponse, isLoading } = useOrganizationDocuments(organizationId)
  const { data: folders } = useOrganizationFolders(organizationId)
  const downloadMutation = useDocumentDownloadUrl()
  const uploadSession = useDocumentUploadSession()
  const folderLookup = useMemo(
    () =>
      new Map(
        (folders ?? []).map((folder: { id: string; name: string }) => [folder.id, folder.name])
      ),
    [folders]
  )

  const documents = documentsResponse?.data ?? []

  const handleDownload = async (documentId: string) => {
    const result = await downloadMutation.mutateAsync({ organizationId, documentId })
    if (result.downloadUrl) {
      console.log('Document download URL ready', result.downloadUrl)
    }
  }

  const columns: TableColumn[] = [
    {
      id: 'name',
      title: 'Name',
      render: (_value, row) => (
        <>
          <Text>{String(row.name ?? '')}</Text>
          <Paragraph style={{ color: colors.text[t].secondary }}>{String(row.category ?? '')}</Paragraph>
        </>
      ),
    },
    {
      id: 'folder_id',
      title: 'Folder',
      render: (_value, row) => {
        const folderId = row.folder_id as string | null
        return <>{folderId ? (folderLookup.get(folderId) ?? '—') : '—'}</>
      },
    },
    {
      id: 'updated_at',
      title: 'Last Updated',
      render: (_value, row) => (
        <>{new Date(String(row.updated_at ?? '')).toLocaleDateString()}</>
      ),
    },
    {
      id: 'actions',
      title: 'Actions',
      render: (_value, row) => (
        <Button
          size="sm"
          onPress={() => void handleDownload(String(row.id ?? ''))}
          disabled={downloadMutation.isPending}
        >
          Download
        </Button>
      ),
    },
  ]

  const tableData: TableRowData[] = documents.map((document) => ({
    id: document.id,
    name: document.name,
    category: document.category,
    folder_id: document.folder_id,
    updated_at: document.updated_at,
  }))

  return (
    <Card variant="outlined" padding="md">
      <Row justify="space-between" align="center">
        <H4>Documents</H4>
        <Button
          size="sm"
          onPress={() => {
            uploadSession.mutate({
              organizationId,
              params: {
                name: 'New Document',
                fileName: 'placeholder.pdf',
                mimeType: 'application/pdf',
                fileSize: 10,
              },
            })
          }}
        >
          Upload Placeholder
        </Button>
      </Row>
      <Separator />
      {isLoading ? (
        <Spinner variant="ios" />
      ) : documents.length === 0 ? (
        <Paragraph style={{ color: colors.text[t].secondary }}>No documents uploaded yet.</Paragraph>
      ) : (
        <Table
          columns={columns}
          data={tableData}
          loading={isLoading}
          emptyMessage="No documents uploaded yet."
          showHeader={false}
        />
      )}
    </Card>
  )
}
