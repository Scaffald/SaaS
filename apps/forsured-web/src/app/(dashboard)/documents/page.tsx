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
import { Stack, Row, Text, Card, H1 } from '@unicornlove/beyond-ui';
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
    <Stack style={{ minHeight: '100vh', backgroundColor: 'var(--color-gray-2)' }}>
      <Stack style={{ maxWidth: 1120, marginLeft: 'auto', marginRight: 'auto', paddingLeft: 'var(--space-4)', paddingRight: 'var(--space-4)', paddingTop: 'var(--space-8)', paddingBottom: 'var(--space-8)' }}>
        {/* Header */}
        <Stack style={{ marginBottom: 'var(--space-8)' }}>
          <DocumentBreadcrumb
            clientId={clientIdFromUrl}
            clientName={selectedClientName}
            projectId={projectIdFromUrl}
            projectName={selectedProjectName}
            basePath="/dashboard"
            onNavigate={handleBreadcrumbNavigate}
          />
          <H1 style={{ marginTop: 'var(--space-4)' }}>Documents</H1>
          <Text style={{ marginTop: 'var(--space-2)', fontSize: 'var(--font-size-2)', color: 'var(--color-gray-11)' }}>
            Browse and manage your organization's documents by client, project, type, and status
          </Text>
        </Stack>

        {/* Summary Cards */}
        {summaryData && (
          <Row style={{ flexWrap: 'wrap', gap: 'var(--space-4)', marginBottom: 'var(--space-8)' }}>
            <Card style={{ flex: 1, minWidth: 150, padding: 'var(--space-4)', borderWidth: 1, borderColor: 'var(--color-gray-6)' }}>
              <Text style={{ fontSize: 'var(--font-size-2)', color: 'var(--color-gray-11)' }}>Total Documents</Text>
              <Text style={{ fontSize: 'var(--font-size-8)', fontWeight: 700, color: 'var(--color-gray-12)' }}>{summaryData.total}</Text>
            </Card>
            <Card style={{ flex: 1, minWidth: 150, padding: 'var(--space-4)', borderWidth: 1, borderColor: 'var(--color-green-6)' }}>
              <Text style={{ fontSize: 'var(--font-size-2)', color: 'var(--color-green-11)' }}>Verified</Text>
              <Text style={{ fontSize: 'var(--font-size-8)', fontWeight: 700, color: 'var(--color-green-12)' }}>
                {summaryData.byStatus.verified}
              </Text>
            </Card>
            <Card style={{ flex: 1, minWidth: 150, padding: 'var(--space-4)', borderWidth: 1, borderColor: 'var(--color-yellow-6)' }}>
              <Text style={{ fontSize: 'var(--font-size-2)', color: 'var(--color-yellow-11)' }}>Pending</Text>
              <Text style={{ fontSize: 'var(--font-size-8)', fontWeight: 700, color: 'var(--color-yellow-12)' }}>
                {summaryData.byStatus.pending}
              </Text>
            </Card>
            <Card style={{ flex: 1, minWidth: 150, padding: 'var(--space-4)', borderWidth: 1, borderColor: 'var(--color-orange-6)' }}>
              <Text style={{ fontSize: 'var(--font-size-2)', color: 'var(--color-orange-11)' }}>Expiring Soon</Text>
              <Text style={{ fontSize: 'var(--font-size-8)', fontWeight: 700, color: 'var(--color-orange-12)' }}>
                {summaryData.byStatus.expiring}
              </Text>
            </Card>
            <Card style={{ flex: 1, minWidth: 150, padding: 'var(--space-4)', borderWidth: 1, borderColor: 'var(--color-red-6)' }}>
              <Text style={{ fontSize: 'var(--font-size-2)', color: 'var(--color-red-11)' }}>Expired</Text>
              <Text style={{ fontSize: 'var(--font-size-8)', fontWeight: 700, color: 'var(--color-red-12)' }}>
                {summaryData.byStatus.expired}
              </Text>
            </Card>
          </Row>
        )}

        {/* Document List (includes filter panel and search) */}
        <DocumentList
          organizationId={MOCK_ORG_ID}
          onDocumentClick={handleDocumentClick}
        />
      </Stack>
    </Stack>
  );
}
