/**
 * Client Profile Page
 * Clickable Client Navigation
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
import { Stack, Row, Text, Button, Card, Heading, colors, spacing } from '@scaffald/ui';
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
      <Stack
        style={{ minHeight: '100vh', backgroundColor: colors.gray[100] }}
        data-testid="client-profile-container"
      >
        <Stack
          style={{
            maxWidth: 1120,
            marginHorizontal: 'auto',
            paddingHorizontal: spacing[16],
            paddingVertical: spacing[32],
            '@media (min-width: 640px)': { paddingHorizontal: spacing[24] },
            '@media (min-width: 1024px)': { paddingHorizontal: spacing[32] },
          }}
          data-testid="client-profile-content"
        >
          <Stack style={{ opacity: 0.5 }}>
            <Stack style={{ height: 32, backgroundColor: colors.gray[200], borderRadius: 8, width: '25%', marginBottom: spacing[16] }} />
            <Stack style={{ height: 16, backgroundColor: colors.gray[200], borderRadius: 8, width: '50%', marginBottom: spacing[32] }} />
            <Card style={{ padding: spacing[24], marginBottom: spacing[24] }}>
              <Stack style={{ height: 24, backgroundColor: colors.gray[200], borderRadius: 8, width: '33%', marginBottom: spacing[16] }} />
              <Stack style={{ height: 16, backgroundColor: colors.gray[200], borderRadius: 8, width: '100%', marginBottom: spacing[8] }} />
              <Stack style={{ height: 16, backgroundColor: colors.gray[200], borderRadius: 8, width: '75%' }} />
            </Card>
          </Stack>
        </Stack>
      </Stack>
    );
  }

  // Error state
  if (error) {
    return (
      <Stack
        style={{ minHeight: '100vh', backgroundColor: colors.gray[100] }}
        data-testid="client-profile-container"
      >
        <Stack
          style={{
            maxWidth: 1120,
            marginHorizontal: 'auto',
            paddingHorizontal: spacing[16],
            paddingVertical: spacing[32],
            '@media (min-width: 640px)': { paddingHorizontal: spacing[24] },
            '@media (min-width: 1024px)': { paddingHorizontal: spacing[32] },
          }}
          data-testid="client-profile-content"
        >
          <Button
            onPress={handleBack}
            variant="text"
            color="gray"
            style={{ marginBottom: spacing[16] }}
          >
            <Row alignItems="center" gap={spacing[4]}>
              <ArrowLeft size={16} />
              <Text size="xs">Back</Text>
            </Row>
          </Button>
          <Stack style={{ backgroundColor: colors.error[200], borderWidth: 1, borderColor: colors.error[400], borderRadius: spacing[16], padding: spacing[24] }}>
            <Row alignItems="center" gap={spacing[8]}>
              <AlertCircle size={20} color={colors.error[600]} />
              <Heading level={3} color={colors.error[600]}>
                Error Loading Client
              </Heading>
            </Row>
            <Text style={{ marginTop: spacing[8] }} size="xs" color={colors.error[600]}>
              {error.message || 'Failed to load client profile'}
            </Text>
          </Stack>
        </Stack>
      </Stack>
    );
  }

  const clientName = profileData?.client.name || 'Unknown Client';
  const gcRelationships = profileData?.gcRelationships || [];
  const recentActivity = profileData?.recentActivity || [];

  return (
    <Stack
      style={{ minHeight: '100vh', backgroundColor: colors.gray[100] }}
      data-testid="client-profile-container"
    >
      <Stack
        style={{
          maxWidth: 1120,
          marginHorizontal: 'auto',
          paddingHorizontal: spacing[16],
          paddingVertical: spacing[32],
          '@media (min-width: 640px)': { paddingHorizontal: spacing[24] },
          '@media (min-width: 1024px)': { paddingHorizontal: spacing[32] },
        }}
        data-testid="client-profile-content"
      >
        {/* Header */}
        <Stack style={{ marginBottom: spacing[32] }}>
          <Button
            onPress={handleBack}
            variant="text"
            color="gray"
            style={{ marginBottom: spacing[16] }}
          >
            <Row alignItems="center" gap={spacing[4]}>
              <ArrowLeft size={16} />
              <Text size="xs">Back</Text>
            </Row>
          </Button>
          <Heading level={1}>Client Profile</Heading>
          <Text style={{ marginTop: spacing[8] }} size="lg" color={colors.text.light.primary} as="div" data-testid="client-name">
            {clientName}
          </Text>
          <Text style={{ marginTop: spacing[4] }} size="xs" color={colors.text.light.tertiary} data-testid="client-id">
            {clientId}
          </Text>
        </Stack>

        {/* GC Relationships Section */}
        <Card style={{ padding: spacing[24], marginBottom: spacing[24] }}>
          <Heading level={3} style={{ marginBottom: spacing[16] }}>
            GC Relationships
          </Heading>
          {gcRelationships.length > 0 ? (
            <Stack gap={spacing[12]} data-testid="gc-relationships-list">
              {gcRelationships.map((relationship) => (
                <Row
                  key={relationship.gcId}
                  alignItems="center"
                  justifyContent="space-between"
                  style={{
                    padding: spacing[16],
                    backgroundColor: colors.gray[100],
                    borderRadius: spacing[16],
                    borderWidth: 1,
                    borderColor: colors.gray[200],
                  }}
                  data-testid="gc-relationship-item"
                >
                  <Row alignItems="center" gap={spacing[12]}>
                    <Stack style={{ width: 40, height: 40, borderRadius: 9999, backgroundColor: colors.primary[200], alignItems: 'center', justifyContent: 'center' }}>
                      <Building2 size={20} color={colors.primary[600]} />
                    </Stack>
                    <Stack>
                      <Link
                        to={`/clients/${relationship.gcId}`}
                        data-testid="gc-name-link"
                      >
                        <Text weight="medium" color={colors.primary[600]} style={{ textDecorationLine: 'underline' }}>
                          {relationship.gcName}
                        </Text>
                      </Link>
                      <Text size="xs" color={colors.text.light.secondary}>
                        Compliance Score: {relationship.complianceScore}%
                      </Text>
                    </Stack>
                  </Row>
                  <StatusBadge
                    status={relationship.complianceStatus as 'compliant' | 'warning' | 'critical'}
                    size="sm"
                    data-testid="compliance-badge"
                  />
                </Row>
              ))}
            </Stack>
          ) : (
            <Text size="xs" color={colors.text.light.secondary} style={{ textAlign: 'center', paddingVertical: spacing[16] }}>
              No GC relationships found for this client
            </Text>
          )}
        </Card>

        {/* Compliance Status Section - Summary view */}
        <Card style={{ padding: spacing[24], marginBottom: spacing[24] }}>
          <Heading level={3} style={{ marginBottom: spacing[16] }}>
            Compliance Status
          </Heading>
          {gcRelationships.length > 0 ? (
            <Row style={{ flexWrap: 'wrap', gap: spacing[16] }} data-testid="compliance-summary">
              <Card style={{ padding: spacing[16], backgroundColor: colors.success[200], borderWidth: 1, borderColor: colors.success[400], flex: 1, minWidth: 200 }}>
                <Text size="xs" color={colors.success[600]} weight="medium">Compliant</Text>
                <Text style={{ fontSize: 32, fontWeight: '700' }} color={colors.success[700]}>
                  {gcRelationships.filter((r) => r.complianceStatus === 'compliant').length}
                </Text>
              </Card>
              <Card style={{ padding: spacing[16], backgroundColor: colors.warning[200], borderWidth: 1, borderColor: colors.warning[400], flex: 1, minWidth: 200 }}>
                <Text size="xs" color={colors.warning[600]} weight="medium">Warning</Text>
                <Text style={{ fontSize: 32, fontWeight: '700' }} color={colors.warning[700]}>
                  {gcRelationships.filter((r) => r.complianceStatus === 'warning').length}
                </Text>
              </Card>
              <Card style={{ padding: spacing[16], backgroundColor: colors.error[200], borderWidth: 1, borderColor: colors.error[400], flex: 1, minWidth: 200 }}>
                <Text size="xs" color={colors.error[600]} weight="medium">Critical</Text>
                <Text style={{ fontSize: 32, fontWeight: '700' }} color={colors.error[700]}>
                  {gcRelationships.filter((r) => r.complianceStatus === 'critical').length}
                </Text>
              </Card>
            </Row>
          ) : (
            <Text size="xs" color={colors.text.light.secondary} style={{ textAlign: 'center', paddingVertical: spacing[16] }}>
              No compliance data available
            </Text>
          )}
        </Card>

        {/* Recent Activity Section */}
        <Card style={{ padding: spacing[24] }}>
          <Heading level={3} style={{ marginBottom: spacing[16] }}>
            Recent Activity
          </Heading>
          {recentActivity.length > 0 ? (
            <Stack style={{ gap: 0, maxHeight: 320, overflowY: 'auto' }} data-testid="activity-feed">
              {recentActivity.map((activity, index) => (
                <Row
                  key={activity.id}
                  alignItems="flex-start"
                  gap={spacing[12]}
                  style={{
                    paddingVertical: spacing[12],
                    borderBottomWidth: index !== recentActivity.length - 1 ? 1 : 0,
                    borderBottomColor: colors.gray[200],
                  }}
                  data-testid="activity-item"
                >
                  <Stack style={{ flexShrink: 0, width: 32, height: 32, borderRadius: 9999, backgroundColor: colors.gray[150], alignItems: 'center', justifyContent: 'center' }}>
                    <Clock size={16} color={colors.text.light.secondary} />
                  </Stack>
                  <Stack style={{ flex: 1, minWidth: 0 }}>
                    <Text size="xs" color={colors.text.light.primary}>{activity.description}</Text>
                    <Text size="xs" color={colors.text.light.secondary}>
                      {formatTimestamp(activity.timestamp)}
                    </Text>
                  </Stack>
                </Row>
              ))}
            </Stack>
          ) : (
            <Text size="xs" color={colors.text.light.secondary} style={{ textAlign: 'center', paddingVertical: spacing[16] }}>
              No recent activity
            </Text>
          )}
        </Card>
      </Stack>
    </Stack>
  );
}
