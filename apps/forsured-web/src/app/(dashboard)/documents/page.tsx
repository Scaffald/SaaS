/**
 * Documents Page
 * REQ-284: Document Organization by Client/Project/GC
 * TASK-4: Integrate Document Organization Page with All Components
 *
 * Main document organization page with:
 * - Breadcrumb navigation showing hierarchy
 * - Filter panel for client, project, type, and status
 * - Searchable document list
 * - Summary statistics
 */

'use client';

import React, { useState, useCallback, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import {
  DocumentList,
  DocumentBreadcrumb,
} from '../../../components/documents';
import type { DocumentListItem } from '../../../types/document';
import { trpc } from '../../../lib/trpc';

// TODO: Replace with real organization ID from auth context
const MOCK_ORG_ID = '00000000-0000-0000-0000-000000000001';

export default function DocumentsPage() {
  const router = useRouter();
  const searchParams = useSearchParams();

  // Extract filter values from URL query parameters
  const clientIdFromUrl = searchParams.get('clientId') || undefined;
  const projectIdFromUrl = searchParams.get('projectId') || undefined;

  // State for selected client/project names (for breadcrumb)
  const [selectedClientName, setSelectedClientName] = useState<string | undefined>();
  const [selectedProjectName, setSelectedProjectName] = useState<string | undefined>();

  // Fetch document summary
  const { data: summaryData } = trpc.documents.getSummary.useQuery(
    {
      organizationId: MOCK_ORG_ID,
      clientId: clientIdFromUrl,
      projectId: projectIdFromUrl,
    },
    {
      enabled: !!MOCK_ORG_ID,
    }
  );

  // Fetch client name for breadcrumb
  const { data: clientsData } = trpc.documents.getClients.useQuery(
    { organizationId: MOCK_ORG_ID },
    { enabled: !!MOCK_ORG_ID && !!clientIdFromUrl }
  );

  // Fetch project name for breadcrumb
  const { data: projectsData } = trpc.documents.getProjects.useQuery(
    { organizationId: MOCK_ORG_ID, clientId: clientIdFromUrl },
    { enabled: !!MOCK_ORG_ID && !!clientIdFromUrl && !!projectIdFromUrl }
  );

  // Update client/project names when data is loaded
  useEffect(() => {
    if (clientsData && clientIdFromUrl) {
      const client = clientsData.find((c) => c.id === clientIdFromUrl);
      setSelectedClientName(client?.name);
    } else {
      setSelectedClientName(undefined);
    }
  }, [clientsData, clientIdFromUrl]);

  useEffect(() => {
    if (projectsData && projectIdFromUrl) {
      const project = projectsData.find((p) => p.id === projectIdFromUrl);
      setSelectedProjectName(project?.name);
    } else {
      setSelectedProjectName(undefined);
    }
  }, [projectsData, projectIdFromUrl]);

  // Handle document click
  const handleDocumentClick = useCallback(
    (document: DocumentListItem) => {
      // Navigate to document detail (could be a modal or separate page)
      console.log('Document clicked:', document.id);
      // TODO: Implement document detail view
    },
    []
  );

  // Handle breadcrumb navigation
  const handleBreadcrumbNavigate = useCallback(
    (path: string) => {
      router.push(path);
    },
    [router]
  );

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="mb-8">
          <DocumentBreadcrumb
            clientId={clientIdFromUrl}
            clientName={selectedClientName}
            projectId={projectIdFromUrl}
            projectName={selectedProjectName}
            basePath="/dashboard"
            onNavigate={handleBreadcrumbNavigate}
          />
          <h1 className="text-3xl font-bold text-gray-900 mt-4">Documents</h1>
          <p className="mt-2 text-sm text-gray-600">
            Browse and manage your organization's documents by client, project, type, and status
          </p>
        </div>

        {/* Summary Cards */}
        {summaryData && (
          <div className="grid grid-cols-2 md:grid-cols-5 gap-4 mb-8">
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
              <p className="text-sm text-gray-600">Total Documents</p>
              <p className="text-2xl font-bold text-gray-900">{summaryData.total}</p>
            </div>
            <div className="bg-white rounded-lg shadow-sm border border-green-200 p-4">
              <p className="text-sm text-green-600">Verified</p>
              <p className="text-2xl font-bold text-green-700">
                {summaryData.byStatus.verified}
              </p>
            </div>
            <div className="bg-white rounded-lg shadow-sm border border-yellow-200 p-4">
              <p className="text-sm text-yellow-600">Pending</p>
              <p className="text-2xl font-bold text-yellow-700">
                {summaryData.byStatus.pending}
              </p>
            </div>
            <div className="bg-white rounded-lg shadow-sm border border-orange-200 p-4">
              <p className="text-sm text-orange-600">Expiring Soon</p>
              <p className="text-2xl font-bold text-orange-700">
                {summaryData.byStatus.expiring}
              </p>
            </div>
            <div className="bg-white rounded-lg shadow-sm border border-red-200 p-4">
              <p className="text-sm text-red-600">Expired</p>
              <p className="text-2xl font-bold text-red-700">
                {summaryData.byStatus.expired}
              </p>
            </div>
          </div>
        )}

        {/* Document List (includes filter panel and search) */}
        <DocumentList
          organizationId={MOCK_ORG_ID}
          onDocumentClick={handleDocumentClick}
        />
      </div>
    </div>
  );
}
