/**
 * REQ-124: Document Upload & Storage - DocumentManagementPage
 * Complete document management page with upload, table, and RBAC
 */

import React, { useState, useEffect } from 'react';
import { X, Loader2 } from 'lucide-react';
import { Stack, Row, Text, H1, Card } from '@unicornlove/beyond-ui';
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
    <Stack
      style={{
        maxWidth: '1280px',
        marginLeft: 'auto',
        marginRight: 'auto',
        paddingLeft: '32px',
        paddingRight: '32px',
        paddingTop: '32px',
        paddingBottom: '32px',
      }}
    >
      <Stack style={{ marginBottom: '32px' }}>
        <H1 style={{ fontSize: '32px', fontWeight: 'bold', color: 'var(--color-gray-12)' }}>
          Documents
        </H1>
        <Text style={{ marginTop: '8px', fontSize: '14px', color: 'var(--color-gray-11)' }}>
          Upload and manage insurance certificates for this project.
        </Text>
      </Stack>

      {error && (
        <Card
          style={{
            marginBottom: '24px',
            backgroundColor: 'var(--color-red-2)',
            borderWidth: 1,
            borderStyle: 'solid',
            borderColor: 'var(--color-red-6)',
            borderRadius: '8px',
            padding: '16px',
          }}
        >
          <Row style={{ alignItems: 'flex-start' }}>
            <Row style={{ flexShrink: 0 }}>
              <X size={20} color="var(--color-red-10)" />
            </Row>
            <Row style={{ flex: 1, marginLeft: '12px' }}>
              <Text style={{ fontSize: '14px', fontWeight: 500, color: 'var(--color-red-12)' }}>
                {error}
              </Text>
            </Row>
            <Row style={{ marginLeft: 'auto', paddingLeft: '12px' }}>
              <button
                style={{
                  display: 'inline-flex',
                  color: 'var(--color-red-10)',
                  cursor: 'pointer',
                  background: 'none',
                  border: 'none',
                  padding: 0,
                }}
                onClick={() => setError(null)}
              >
                <X size={20} />
              </button>
            </Row>
          </Row>
        </Card>
      )}

      {canUpload() && (
        <Stack style={{ marginBottom: '32px' }}>
          <FileUploadZone
            projectId={projectId}
            uploaderId={currentUser.id}
            onUpload={handleUpload}
            onError={handleUploadError}
          />
        </Stack>
      )}

      {loading ? (
        <Stack style={{ alignItems: 'center', justifyContent: 'center', paddingTop: '48px', paddingBottom: '48px' }}>
          <Loader2 size={32} color="var(--color-teal-9)" className="animate-spin" />
        </Stack>
      ) : (
        <DocumentTable
          documents={documents}
          onDelete={handleDelete}
          onReprocess={handleReprocess}
          canDelete={canDelete}
          canReprocess={canReprocess}
        />
      )}
    </Stack>
  );
};
