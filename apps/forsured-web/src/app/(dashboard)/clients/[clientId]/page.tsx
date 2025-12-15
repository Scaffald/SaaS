/**
 * Client Profile Page
 * REQ-274: Clickable Client Navigation
 * TASK-1: Create Client Profile Route and Page Component
 * TASK-2: Implement Client Profile Data Fetching
 * TASK-3: Render GC Relationships with Compliance Status and Activity Feed
 *
 * Displays client profile with:
 * - Client header with name
 * - GC Relationships section with compliance status
 * - Recent Activity feed
 */

import React from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { ArrowLeft, AlertCircle, Building2, Clock } from 'lucide-react';
import { YStack, XStack, Text, Button, Card, H1, H2, H3 } from '@unicornlove/ui';
import { trpc } from '../../../../lib/trpc';
import StatusBadge from '../../../../components/Common/StatusBadge';

// TODO: Replace with real organization ID from auth context
const MOCK_ORG_ID = '00000000-0000-0000-0000-000000000001';

/**
 * Format timestamp for display
 */
function formatTimestamp(timestamp: string): string {
  const date = new Date(timestamp);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffMins = Math.floor(diffMs / 60000);
  const diffHours = Math.floor(diffMs / 3600000);
  const diffDays = Math.floor(diffMs / 86400000);

  if (diffMins < 1) {
    return 'Just now';
  } else if (diffMins < 60) {
    return `${diffMins} minute${diffMins !== 1 ? 's' : ''} ago`;
  } else if (diffHours < 24) {
    return `${diffHours} hour${diffHours !== 1 ? 's' : ''} ago`;
  } else if (diffDays < 7) {
    return `${diffDays} day${diffDays !== 1 ? 's' : ''} ago`;
  } else {
    return date.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: date.getFullYear() !== now.getFullYear() ? 'numeric' : undefined,
    });
  }
}

export default function ClientProfilePage() {
  const params = useParams<{ clientId: string }>();
  const navigate = useNavigate();
  const clientId = params.clientId as string;

  // Fetch client profile data
  const {
    data: profileData,
    isLoading,
    error,
  } = trpc.clientProfile.getProfile.useQuery(
    {
      organizationId: MOCK_ORG_ID,
      clientId,
    },
    {
      enabled: !!clientId,
    }
  );

  const handleBack = () => {
    navigate(-1);
  };

  // Loading state
  if (isLoading) {
    return (
      <YStack
        minHeight="100vh"
        backgroundColor="$gray2"
        data-testid="client-profile-container"
      >
        <YStack
          maxWidth={1120}
          marginHorizontal="auto"
          paddingHorizontal="$4"
          paddingVertical="$8"
          $gtSm={{ paddingHorizontal: '$6' }}
          $gtLg={{ paddingHorizontal: '$8' }}
          data-testid="client-profile-content"
        >
          <YStack opacity={0.5}>
            <YStack height={32} backgroundColor="$gray4" borderRadius="$2" width="25%" marginBottom="$4" />
            <YStack height={16} backgroundColor="$gray4" borderRadius="$2" width="50%" marginBottom="$8" />
            <Card padding="$6" marginBottom="$6">
              <YStack height={24} backgroundColor="$gray4" borderRadius="$2" width="33%" marginBottom="$4" />
              <YStack height={16} backgroundColor="$gray4" borderRadius="$2" width="100%" marginBottom="$2" />
              <YStack height={16} backgroundColor="$gray4" borderRadius="$2" width="75%" />
            </Card>
          </YStack>
        </YStack>
      </YStack>
    );
  }

  // Error state
  if (error) {
    return (
      <YStack
        minHeight="100vh"
        backgroundColor="$gray2"
        data-testid="client-profile-container"
      >
        <YStack
          maxWidth={1120}
          marginHorizontal="auto"
          paddingHorizontal="$4"
          paddingVertical="$8"
          $gtSm={{ paddingHorizontal: '$6' }}
          $gtLg={{ paddingHorizontal: '$8' }}
          data-testid="client-profile-content"
        >
          <Button
            onPress={handleBack}
            backgroundColor="transparent"
            color="$gray11"
            hoverStyle={{ color: '$gray12' }}
            marginBottom="$4"
          >
            <XStack alignItems="center" gap="$1">
              <ArrowLeft size={16} />
              <Text fontSize="$2">Back</Text>
            </XStack>
          </Button>
          <YStack backgroundColor="$red2" borderWidth={1} borderColor="$red6" borderRadius="$4" padding="$6">
            <XStack alignItems="center" gap="$2">
              <AlertCircle size={20} color="$red11" />
              <H3 color="$red11">
                Error Loading Client
              </H3>
            </XStack>
            <Text marginTop="$2" fontSize="$2" color="$red11">
              {error.message || 'Failed to load client profile'}
            </Text>
          </YStack>
        </YStack>
      </YStack>
    );
  }

  const clientName = profileData?.client.name || 'Unknown Client';
  const gcRelationships = profileData?.gcRelationships || [];
  const recentActivity = profileData?.recentActivity || [];

  return (
    <YStack
      minHeight="100vh"
      backgroundColor="$gray2"
      data-testid="client-profile-container"
    >
      <YStack
        maxWidth={1120}
        marginHorizontal="auto"
        paddingHorizontal="$4"
        paddingVertical="$8"
        $gtSm={{ paddingHorizontal: '$6' }}
        $gtLg={{ paddingHorizontal: '$8' }}
        data-testid="client-profile-content"
      >
        {/* Header */}
        <YStack marginBottom="$8">
          <Button
            onPress={handleBack}
            backgroundColor="transparent"
            color="$gray11"
            hoverStyle={{ color: '$gray12' }}
            marginBottom="$4"
          >
            <XStack alignItems="center" gap="$1">
              <ArrowLeft size={16} />
              <Text fontSize="$2">Back</Text>
            </XStack>
          </Button>
          <H1>Client Profile</H1>
          <Text marginTop="$2" fontSize="$5" color="$gray12" data-testid="client-name">
            {clientName}
          </Text>
          <Text marginTop="$1" fontSize="$1" color="$gray10" data-testid="client-id">
            {clientId}
          </Text>
        </YStack>

        {/* GC Relationships Section */}
        <Card padding="$6" marginBottom="$6">
          <H3 marginBottom="$4">
            GC Relationships
          </H3>
          {gcRelationships.length > 0 ? (
            <YStack gap="$3" data-testid="gc-relationships-list">
              {gcRelationships.map((relationship) => (
                <XStack
                  key={relationship.gcId}
                  alignItems="center"
                  justifyContent="space-between"
                  padding="$4"
                  backgroundColor="$gray2"
                  borderRadius="$4"
                  borderWidth={1}
                  borderColor="$gray4"
                  data-testid="gc-relationship-item"
                >
                  <XStack alignItems="center" gap="$3">
                    <YStack width={40} height={40} borderRadius={9999} backgroundColor="$blue2" alignItems="center" justifyContent="center">
                      <Building2 size={20} color="$blue11" />
                    </YStack>
                    <YStack>
                      <Link
                        to={`/clients/${relationship.gcId}`}
                        data-testid="gc-name-link"
                      >
                        <Text fontWeight="500" color="$blue11" hoverStyle={{ color: '$blue12', textDecorationLine: 'underline' }}>
                          {relationship.gcName}
                        </Text>
                      </Link>
                      <Text fontSize="$2" color="$gray11">
                        Compliance Score: {relationship.complianceScore}%
                      </Text>
                    </YStack>
                  </XStack>
                  <StatusBadge
                    status={relationship.complianceStatus as 'compliant' | 'warning' | 'critical'}
                    size="sm"
                    data-testid="compliance-badge"
                  />
                </XStack>
              ))}
            </YStack>
          ) : (
            <Text fontSize="$2" color="$gray11" textAlign="center" paddingVertical="$4">
              No GC relationships found for this client
            </Text>
          )}
        </Card>

        {/* Compliance Status Section - Summary view */}
        <Card padding="$6" marginBottom="$6">
          <H3 marginBottom="$4">
            Compliance Status
          </H3>
          {gcRelationships.length > 0 ? (
            <XStack flexWrap="wrap" gap="$4" data-testid="compliance-summary">
              <Card padding="$4" backgroundColor="$green2" borderWidth={1} borderColor="$green6" flex={1} minWidth={200}>
                <Text fontSize="$2" color="$green11" fontWeight="500">Compliant</Text>
                <Text fontSize="$8" fontWeight="700" color="$green12">
                  {gcRelationships.filter((r) => r.complianceStatus === 'compliant').length}
                </Text>
              </Card>
              <Card padding="$4" backgroundColor="$yellow2" borderWidth={1} borderColor="$yellow6" flex={1} minWidth={200}>
                <Text fontSize="$2" color="$yellow11" fontWeight="500">Warning</Text>
                <Text fontSize="$8" fontWeight="700" color="$yellow12">
                  {gcRelationships.filter((r) => r.complianceStatus === 'warning').length}
                </Text>
              </Card>
              <Card padding="$4" backgroundColor="$red2" borderWidth={1} borderColor="$red6" flex={1} minWidth={200}>
                <Text fontSize="$2" color="$red11" fontWeight="500">Critical</Text>
                <Text fontSize="$8" fontWeight="700" color="$red12">
                  {gcRelationships.filter((r) => r.complianceStatus === 'critical').length}
                </Text>
              </Card>
            </XStack>
          ) : (
            <Text fontSize="$2" color="$gray11" textAlign="center" paddingVertical="$4">
              No compliance data available
            </Text>
          )}
        </Card>

        {/* Recent Activity Section */}
        <Card padding="$6">
          <H3 marginBottom="$4">
            Recent Activity
          </H3>
          {recentActivity.length > 0 ? (
            <YStack gap={0} maxHeight={320} overflowY="auto" data-testid="activity-feed">
              {recentActivity.map((activity, index) => (
                <XStack
                  key={activity.id}
                  alignItems="flex-start"
                  gap="$3"
                  paddingVertical="$3"
                  borderBottomWidth={index !== recentActivity.length - 1 ? 1 : 0}
                  borderColor="$gray4"
                  data-testid="activity-item"
                >
                  <YStack flexShrink={0} width={32} height={32} borderRadius={9999} backgroundColor="$gray3" alignItems="center" justifyContent="center">
                    <Clock size={16} color="$gray11" />
                  </YStack>
                  <YStack flex={1} minWidth={0}>
                    <Text fontSize="$2" color="$gray12">{activity.description}</Text>
                    <Text fontSize="$1" color="$gray11">
                      {formatTimestamp(activity.timestamp)}
                    </Text>
                  </YStack>
                </XStack>
              ))}
            </YStack>
          ) : (
            <Text fontSize="$2" color="$gray11" textAlign="center" paddingVertical="$4">
              No recent activity
            </Text>
          )}
        </Card>
      </YStack>
    </YStack>
  );
}
