import { useMemo } from 'react'
import { Button, Card, H4, Paragraph, Separator, Spinner, Table, Text, XStack, YStack } from 'tamagui'
import {
  useCommitDocumentVersion,
  useDocumentDownloadUrl,
  useDocumentShares,
  useDocumentUploadSession,
  useOrganizationDocuments,
  useOrganizationFolders,
  useSearchOrganizationDocuments,
} from '../api'

type OrganizationDocumentsPanelProps = {
  organizationId: string
}

export function OrganizationDocumentsPanel({ organizationId }: OrganizationDocumentsPanelProps) {
  const { data: documents, isLoading } = useOrganizationDocuments(organizationId)
  const { data: folders } = useOrganizationFolders(organizationId)
  const downloadMutation = useDocumentDownloadUrl()
  const uploadSession = useDocumentUploadSession()
  const folderLookup = useMemo(() => new Map((folders ?? []).map((folder) => [folder.id, folder.name])), [folders])

  const handleDownload = async (documentId: string) => {
    const result = await downloadMutation.mutateAsync({ organizationId, documentId })
    if (result.downloadUrl) {
      console.log('Document download URL ready', result.downloadUrl)
    }
  }

  return (
    <Card bordered padding="$4" gap="$3">
      <XStack justifyContent="space-between" alignItems="center">
        <H4>Documents</H4>
        <Button
          size="$3"
          onPress={() => {
            uploadSession.mutate({ organizationId, name: 'New Document', fileName: 'placeholder.pdf', mimeType: 'application/pdf', fileSize: 10 })
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
              <Table.Header>Name</Table.Header>
              <Table.Header>Folder</Table.Header>
              <Table.Header>Last Updated</Table.Header>
              <Table.Header>Actions</Table.Header>
            </Table.Row>
          </Table.Head>
          <Table.Body>
            {documents.map((document) => (
              <Table.Row key={document.id}>
                <Table.Cell>
                  <Text fontWeight="600">{document.name}</Text>
                  <Paragraph color="$color10">{document.category}</Paragraph>
                </Table.Cell>
                <Table.Cell>{document.folder_id ? folderLookup.get(document.folder_id) ?? '—' : '—'}</Table.Cell>
                <Table.Cell>{new Date(document.updated_at).toLocaleDateString()}</Table.Cell>
                <Table.Cell>
                  <Button size="$2" onPress={() => handleDownload(document.id)} disabled={downloadMutation.isLoading}>
                    Download
                  </Button>
                </Table.Cell>
              </Table.Row>
            ))}
          </Table.Body>
        </Table>
      )}
    </Card>
  )
}

