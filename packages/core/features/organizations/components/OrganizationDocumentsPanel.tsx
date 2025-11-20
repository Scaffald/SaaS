import { Table } from '@app/ui'
import { useMemo } from 'react'
import { Button, Card, H4, Paragraph, Separator, Spinner, Text, XStack } from 'tamagui'
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
    <Card bordered padding="$4" gap="$3">
      <XStack justify="space-between" items="center">
        <H4>Documents</H4>
        <Button
          size="$3"
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
      </XStack>
      <Separator />
      {isLoading ? (
        <Spinner />
      ) : !documents || documents.length === 0 ? (
        <Paragraph color="$color10">No documents uploaded yet.</Paragraph>
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
                    <Text fontWeight="600">{document.name}</Text>
                    <Paragraph color="$color10">{document.category}</Paragraph>
                  </Table.Cell>
                  <Table.Cell>
                    {document.folder_id ? (folderLookup.get(document.folder_id) ?? '—') : '—'}
                  </Table.Cell>
                  <Table.Cell>{new Date(document.updated_at).toLocaleDateString()}</Table.Cell>
                  <Table.Cell>
                    <Button
                      size="$2"
                      onPress={() => handleDownload(document.id)}
                      disabled={downloadMutation.isLoading}
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
