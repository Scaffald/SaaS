/**
 * REQ-124: Document Upload & Storage - DocumentManagementPage
 * Complete document management page with upload, table, and RBAC
 */

import { useState, useEffect } from 'react';
import { X } from 'lucide-react';
import { YStack, XStack, Text, H1, Card, Spinner } from '@unicornlove/ui';
import { FileUploadZone } from './FileUploadZone';
import { DocumentTable } from './DocumentTable';
import { DocumentService } from '../../lib/documents/documentService';
import type { Document, DocumentFilter } from '../../types/document';

interface User {
  id: string;
  role: 'manager' | 'subcontractor' | 'broker';
  managed_projects?: string[];
  assigned_projects?: string[];
}

interface DocumentManagementPageProps {
  projectId: string;
  currentUser: User;
}

export const DocumentManagementPage: React.FC<DocumentManagementPageProps> = ({
  projectId,
  currentUser
}) => {
  const [documents, setDocuments] = useState<Document[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const documentService = new DocumentService();

  const loadDocuments = async () => {
    try {
      setLoading(true);
      setError(null);

      // Apply RBAC filtering
      const filters: DocumentFilter = {
        project_id: projectId
      };

      // Subcontractors can only see their own documents
      if (currentUser.role === 'subcontractor') {
        filters.uploader_id = currentUser.id;
      }

      const docs = await documentService.getDocuments(filters);
      setDocuments(docs);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load documents');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadDocuments();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [projectId]);

  const handleUpload = async (document: Document) => {
    // Add the new document to the list
    setDocuments(prev => [document, ...prev]);
  };

  const handleUploadError = (errorMessage: string) => {
    setError(errorMessage);
    // Clear error after 5 seconds
    setTimeout(() => setError(null), 5000);
  };

  const handleDelete = async (documentId: string) => {
    try {
      await documentService.deleteDocument(documentId);
      setDocuments(prev => prev.filter(doc => doc.id !== documentId));
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to delete document');
    }
  };

  const handleReprocess = async (documentId: string) => {
    try {
      await documentService.updateDocumentStatus(documentId, 'pending');
      // Reload documents to show updated status
      await loadDocuments();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to re-process document');
    }
  };

  // RBAC: Determine permissions
  const canUpload = () => {
    if (currentUser.role === 'manager') {
      return currentUser.managed_projects?.includes(projectId) ?? false;
    }
    if (currentUser.role === 'subcontractor') {
      return currentUser.assigned_projects?.includes(projectId) ?? false;
    }
    if (currentUser.role === 'broker') {
      return true; // Brokers can upload for their clients
    }
    return false;
  };

  const canDelete = (document: Document) => {
    if (currentUser.role === 'manager') {
      return currentUser.managed_projects?.includes(document.project_id) ?? false;
    }
    if (currentUser.role === 'subcontractor') {
      return document.uploader_id === currentUser.id;
    }
    if (currentUser.role === 'broker') {
      return document.uploader_id === currentUser.id;
    }
    return false;
  };

  const canReprocess = (document: Document) => {
    // Same logic as delete for MVP
    return canDelete(document);
  };

  return (
    <YStack
      maxWidth={1280}
      marginHorizontal="auto"
      paddingHorizontal={{ sm: '$4', md: '$6', lg: '$8' }}
      paddingVertical="$8"
    >
      <YStack marginBottom="$8">
        <H1 fontSize="$9" fontWeight="bold" color="$color12">
          Documents
        </H1>
        <Text marginTop="$2" fontSize="$3" color="$color11">
          Upload and manage insurance certificates for this project.
        </Text>
      </YStack>

      {error && (
        <Card
          marginBottom="$6"
          backgroundColor="$red2"
          borderWidth={1}
          borderColor="$red6"
          borderRadius="$4"
          padding="$4"
        >
          <XStack alignItems="flex-start">
            <XStack flexShrink={0}>
              <X size={20} color="$red10" />
            </XStack>
            <XStack flex={1} marginLeft="$3">
              <Text fontSize="$3" fontWeight="500" color="$red12">
                {error}
              </Text>
            </XStack>
            <XStack marginLeft="auto" paddingLeft="$3">
              <XStack
                as="button"
                display="inline-flex"
                color="$red10"
                hoverStyle={{ color: '$red11' }}
                onClick={() => setError(null)}
                cursor="pointer"
              >
                <X size={20} />
              </XStack>
            </XStack>
          </XStack>
        </Card>
      )}

      {canUpload() && (
        <YStack marginBottom="$8">
          <FileUploadZone
            projectId={projectId}
            uploaderId={currentUser.id}
            onUpload={handleUpload}
            onError={handleUploadError}
          />
        </YStack>
      )}

      {loading ? (
        <YStack alignItems="center" justifyContent="center" paddingVertical="$12">
          <Spinner size="large" color="$teal9" />
        </YStack>
      ) : (
        <DocumentTable
          documents={documents}
          onDelete={handleDelete}
          onReprocess={handleReprocess}
          canDelete={canDelete}
          canReprocess={canReprocess}
        />
      )}
    </YStack>
  );
};
