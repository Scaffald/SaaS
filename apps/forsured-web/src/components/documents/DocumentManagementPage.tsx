/**
 * REQ-124: Document Upload & Storage - DocumentManagementPage
 * Complete document management page with upload, table, and RBAC
 */

import React, { useState, useEffect } from 'react';
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
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900">Documents</h1>
        <p className="mt-2 text-sm text-gray-600">
          Upload and manage insurance certificates for this project.
        </p>
      </div>

      {error && (
        <div className="mb-6 bg-red-50 border border-red-200 rounded-lg p-4">
          <div className="flex">
            <div className="flex-shrink-0">
              <svg
                className="h-5 w-5 text-red-400"
                viewBox="0 0 20 20"
                fill="currentColor"
              >
                <path
                  fillRule="evenodd"
                  d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z"
                  clipRule="evenodd"
                />
              </svg>
            </div>
            <div className="ml-3">
              <h3 className="text-sm font-medium text-red-800">{error}</h3>
            </div>
            <div className="ml-auto pl-3">
              <button
                onClick={() => setError(null)}
                className="inline-flex text-red-400 hover:text-red-500"
              >
                <svg className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                  <path
                    fillRule="evenodd"
                    d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z"
                    clipRule="evenodd"
                  />
                </svg>
              </button>
            </div>
          </div>
        </div>
      )}

      {canUpload() && (
        <div className="mb-8">
          <FileUploadZone
            projectId={projectId}
            uploaderId={currentUser.id}
            onUpload={handleUpload}
            onError={handleUploadError}
          />
        </div>
      )}

      {loading ? (
        <div className="flex justify-center items-center py-12">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div>
        </div>
      ) : (
        <DocumentTable
          documents={documents}
          onDelete={handleDelete}
          onReprocess={handleReprocess}
          canDelete={canDelete}
          canReprocess={canReprocess}
        />
      )}
    </div>
  );
};
