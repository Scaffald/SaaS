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
import { YStack, XStack, Text, Card, H1, H2, H3 } from '@unicornlove/ui';
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
    <YStack minHeight="100vh" backgroundColor="$gray2">
      <YStack maxWidth={1120} marginHorizontal="auto" paddingHorizontal="$4" paddingVertical="$8" $gtSm={{ paddingHorizontal: '$6' }} $gtLg={{ paddingHorizontal: '$8' }}>
        {/* Header */}
        <YStack marginBottom="$8">
          <DocumentBreadcrumb
            clientId={clientIdFromUrl}
            clientName={selectedClientName}
            projectId={projectIdFromUrl}
            projectName={selectedProjectName}
            basePath="/dashboard"
            onNavigate={handleBreadcrumbNavigate}
          />
          <H1 marginTop="$4">Documents</H1>
          <Text marginTop="$2" fontSize="$2" color="$gray11">
            Browse and manage your organization's documents by client, project, type, and status
          </Text>
        </YStack>

        {/* Summary Cards */}
        {summaryData && (
          <XStack flexWrap="wrap" gap="$4" marginBottom="$8">
            <Card flex={1} minWidth={150} padding="$4" borderWidth={1} borderColor="$gray6">
              <Text fontSize="$2" color="$gray11">Total Documents</Text>
              <Text fontSize="$8" fontWeight="700" color="$gray12">{summaryData.total}</Text>
            </Card>
            <Card flex={1} minWidth={150} padding="$4" borderWidth={1} borderColor="$green6">
              <Text fontSize="$2" color="$green11">Verified</Text>
              <Text fontSize="$8" fontWeight="700" color="$green12">
                {summaryData.byStatus.verified}
              </Text>
            </Card>
            <Card flex={1} minWidth={150} padding="$4" borderWidth={1} borderColor="$yellow6">
              <Text fontSize="$2" color="$yellow11">Pending</Text>
              <Text fontSize="$8" fontWeight="700" color="$yellow12">
                {summaryData.byStatus.pending}
              </Text>
            </Card>
            <Card flex={1} minWidth={150} padding="$4" borderWidth={1} borderColor="$orange6">
              <Text fontSize="$2" color="$orange11">Expiring Soon</Text>
              <Text fontSize="$8" fontWeight="700" color="$orange12">
                {summaryData.byStatus.expiring}
              </Text>
            </Card>
            <Card flex={1} minWidth={150} padding="$4" borderWidth={1} borderColor="$red6">
              <Text fontSize="$2" color="$red11">Expired</Text>
              <Text fontSize="$8" fontWeight="700" color="$red12">
                {summaryData.byStatus.expired}
              </Text>
            </Card>
          </XStack>
        )}

        {/* Document List (includes filter panel and search) */}
        <DocumentList
          organizationId={MOCK_ORG_ID}
          onDocumentClick={handleDocumentClick}
        />
      </YStack>
    </YStack>
  );
}
