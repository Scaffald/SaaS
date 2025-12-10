/**
 * REQ-124: Document Upload & Storage - DocumentTable Component
 * Display and manage uploaded documents with filtering and actions
 */

import React from 'react';
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

  const getStatusBadge = (status: DocumentStatus) => {
    const badges = {
      pending: 'bg-yellow-100 text-yellow-800',
      processing: 'bg-blue-100 text-blue-800',
      completed: 'bg-green-100 text-green-800',
      error: 'bg-red-100 text-red-800'
    };

    return (
      <span
        className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${badges[status]}`}
      >
        {status.charAt(0).toUpperCase() + status.slice(1)}
      </span>
    );
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
      <div className="text-center py-12 bg-gray-50 rounded-lg">
        <svg
          className="mx-auto h-12 w-12 text-gray-400"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
          />
        </svg>
        <h3 className="mt-2 text-sm font-medium text-gray-900">No documents</h3>
        <p className="mt-1 text-sm text-gray-500">
          Upload your first document to get started.
        </p>
      </div>
    );
  }

  return (
    <div className="overflow-x-auto">
      <table className="min-w-full divide-y divide-gray-200">
        <thead className="bg-gray-50">
          <tr>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
              File Name
            </th>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
              Size
            </th>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
              Upload Date
            </th>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
              Status
            </th>
            <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
              Actions
            </th>
          </tr>
        </thead>
        <tbody className="bg-white divide-y divide-gray-200">
          {documents.map((document) => (
            <tr key={document.id} className="hover:bg-gray-50">
              <td className="px-6 py-4 whitespace-nowrap">
                <div className="text-sm font-medium text-gray-900">{document.file_name}</div>
                {document.error_message && (
                  <div className="text-xs text-red-600 mt-1">{document.error_message}</div>
                )}
              </td>
              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                {formatFileSize(document.file_size)}
              </td>
              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                {formatDate(document.upload_date)}
              </td>
              <td className="px-6 py-4 whitespace-nowrap">
                {getStatusBadge(document.status)}
              </td>
              <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                <div className="flex justify-end space-x-2">
                  <button
                    onClick={() => handleDownload(document)}
                    className="text-indigo-600 hover:text-indigo-900"
                    title="Download"
                  >
                    <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4"
                      />
                    </svg>
                  </button>

                  {document.status === 'error' && canReprocess(document) && onReprocess && (
                    <button
                      onClick={() => onReprocess(document.id)}
                      className="text-blue-600 hover:text-blue-900"
                      title="Re-process"
                    >
                      <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"
                        />
                      </svg>
                    </button>
                  )}

                  {canDelete(document) && onDelete && (
                    <button
                      onClick={() => handleDelete(document.id)}
                      className="text-red-600 hover:text-red-900"
                      title="Delete"
                    >
                      <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
                        />
                      </svg>
                    </button>
                  )}
                </div>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};
