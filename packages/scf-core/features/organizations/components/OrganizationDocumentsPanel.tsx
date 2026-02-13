import { Table } from '@unicornlove/beyond-ui'
import { useMemo } from 'react'
import { Button, Card, H4, Paragraph, Separator, Spinner, Text, Row } from '@unicornlove/beyond-ui'
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
  const { data: documents, isLoading } = useOrganizationDocuments(organizationId)
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

  const handleDownload = async (documentId: string) => {
    const result = await downloadMutation.mutateAsync({ organizationId, documentId })
    if (result.downloadUrl) {
      console.log('Document download URL ready', result.downloadUrl)
    }
  }

  return (
    <Card bordered padding="md" gap={12}>
      <Row justify="space-between" align="center">
        <H4>Documents</H4>
        <Button
          size="sm"
          onPress={() => {
            uploadSession.mutate({
              organizationId,
              name: 'New Document',
              fileName: 'placeholder.pdf',
              mimeType: 'application/pdf',
              fileSize: 10,
            })
          }}
        >
          Upload Placeholder
        </Button>
      </Row>
      <Separator />
      {isLoading ? (
        <Spinner />
      ) : !documents || documents.length === 0 ? (
        <Paragraph color="$gray11">No documents uploaded yet.</Paragraph>
      ) : (
        <Table>
          <Table.Head>
            <Table.Row>
              <Table.HeaderCell>Name</Table.HeaderCell>
              <Table.HeaderCell>Folder</Table.HeaderCell>
              <Table.HeaderCell>Last Updated</Table.HeaderCell>
              <Table.HeaderCell>Actions</Table.HeaderCell>
            </Table.Row>
          </Table.Head>
          <Table.Body>
            {documents.map(
              (document: {
                id: string
                name: string
                category: string
                folder_id: string | null
                updated_at: string
              }) => (
                <Table.Row key={document.id}>
                  <Table.Cell>
                    <Text>{document.name}</Text>
                    <Paragraph color="$gray11">{document.category}</Paragraph>
                  </Table.Cell>
                  <Table.Cell>
                    {document.folder_id ? (folderLookup.get(document.folder_id) ?? '—') : '—'}
                  </Table.Cell>
                  <Table.Cell>{new Date(document.updated_at).toLocaleDateString()}</Table.Cell>
                  <Table.Cell>
                    <Button
                      size="xs"
                      onPress={() => handleDownload(document.id)}
                      disabled={downloadMutation.isPending}
                    >
                      Download
                    </Button>
                  </Table.Cell>
                </Table.Row>
              )
            )}
          </Table.Body>
        </Table>
      )}
    </Card>
  )
}
