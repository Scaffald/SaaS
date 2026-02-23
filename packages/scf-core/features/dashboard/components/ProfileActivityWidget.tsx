import { ROUTES, buildPath } from '@scf/core/constants/routes'
import {
  useFollowers,
  usePendingConnections,
  useAcceptConnectionMutation,
  useDeclineConnectionMutation,
} from '@scf/core/utils/engagement-sdk-hooks'
import { useProfileViews, useViewAnalytics } from '@scf/core/utils/profile-views-sdk-hooks'
import { Card } from '@scaffald/ui'
import {
  ArrowDown,
  ArrowUp,
  CheckCircle2,
  Eye,
  Loader2,
  UserPlus,
  Users,
  X,
} from 'lucide-react-native'
import { useRouter } from 'expo-router'
import { Avatar, Button, Separator, Spinner, Text, Row, Stack } from '@scaffald/ui'
import { useQueryClient } from '@tanstack/react-query'

/**
 * Profile Activity Widget
 * Displays recent profile views, new followers, pending connection requests, and 30-day view trends
 */
export function ProfileActivityWidget() {
  const router = useRouter()
  const queryClient = useQueryClient()

  // Fetch data
  const { data: profileViewsData, isLoading: viewsLoading } = useProfileViews({ limit: 10 })
  const profileViewsList = profileViewsData?.views ?? []
  const profileViewsTotal = profileViewsData?.total ?? 0

  const { data: viewAnalytics, isLoading: analyticsLoading } = useViewAnalytics()

  const { data: followersData, isLoading: followersLoading } = useFollowers()
  const followers = followersData?.data

  const { data: pendingData, isLoading: requestsLoading } = usePendingConnections()
  const pendingRequests = pendingData

  // Connection mutations for quick actions
  const acceptRequestMutation = useAcceptConnectionMutation({
    onMutate: async () => {
      await queryClient.cancelQueries({ queryKey: ['connections', 'pending'] })
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['connections', 'pending'] })
      queryClient.invalidateQueries({ queryKey: ['connections', 'list'] })
    },
  })

  const declineRequestMutation = useDeclineConnectionMutation({
    onMutate: async () => {
      await queryClient.cancelQueries({ queryKey: ['connections', 'pending'] })
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['connections', 'pending'] })
    },
  })

  const handleAcceptRequest = (connectionId: string) => {
    acceptRequestMutation.mutate(connectionId)
  }

  const handleDeclineRequest = (connectionId: string) => {
    declineRequestMutation.mutate(connectionId)
  }

  const handleViewAllProfileViews = () => {
    router.push(buildPath(ROUTES.DASHBOARD.CONNECTIONS, {}))
  }

  const handleManageConnections = () => {
    router.push(buildPath(ROUTES.DASHBOARD.CONNECTIONS, {}))
  }

  const isLoading = viewsLoading || analyticsLoading || followersLoading || requestsLoading

  return (
    <Card>
      <Text color="$gray11">Profile Activity</Text>
      {isLoading ? (
        <Stack align="center" justify="center" paddingVertical={16} gap={8}>
          <Spinner size="lg" />
          <Text color="$gray11">Loading activity...</Text>
        </Stack>
      ) : (
        <Stack gap={16}>
          {/* 30-Day View Trend */}
          {viewAnalytics && (
            <Stack
              gap={8}
              backgroundColor="$blue2"
              padding="sm"
              borderRadius={16}
              borderWidth={1}
              borderColor="$blue6"
            >
              <Row align="center" gap={8}>
                <Eye size={18} color="$blue10" />
                <Text color="$blue11">Profile Views (30 days)</Text>
              </Row>
              <Row align="baseline" gap={8}>
                <Text color="$blue11">{viewAnalytics.views30d}</Text>
                {viewAnalytics.trend !== 0 && (
                  <Row align="center" gap={4}>
                    {viewAnalytics.trend > 0 ? (
                      <ArrowUp size="md" color="$green10" />
                    ) : (
                      <ArrowDown size="md" color="$red10" />
                    )}
                    <Text color={viewAnalytics.trend > 0 ? '$green11' : '$red11'}>
                      {Math.abs(viewAnalytics.trend).toFixed(1)}%
                    </Text>
                  </Row>
                )}
              </Row>
              {viewAnalytics.viewsTotal > 0 && (
                <Text color="$blue10">{viewAnalytics.viewsTotal} total views</Text>
              )}
            </Stack>
          )}

          {/* Recent Profile Views */}
          <Stack gap={8}>
            <Row justify="space-between" align="center">
              <Row align="center" gap={8}>
                <Eye size={18} color="$gray11" />
                <Text color="$gray11">Recent Views</Text>
              </Row>
              {profileViewsTotal > 0 && (
                <Button size="sm" variant="outline" onPress={handleViewAllProfileViews}>
                  View All
                </Button>
              )}
            </Row>

            {profileViewsList.length === 0 ? (
              <Text color="$gray11" style={{ fontStyle: 'italic' }}>
                No profile views yet
              </Text>
            ) : (
              <Stack gap={8}>
                {profileViewsList.slice(0, 5).map(
                  (view: {
                    id: string
                    viewer?: {
                      avatar_url: string | null
                      display_name?: string | null
                      username?: string | null
                    } | null
                    viewed_at?: string
                  }) => (
                    <Row key={view.id} align="center" gap={8}>
                      <Avatar
                        size={32}
                        src={view.viewer?.avatar_url ? { uri: view.viewer.avatar_url } : undefined}
                        initials={
                          view.viewer?.display_name?.charAt(0) ||
                          view.viewer?.username?.charAt(0) ||
                          '?'
                        }
                        color="info"
                      />
                      <Stack style={{ flex: 1 }} gap={4}>
                        <Text color="$gray11">
                          {view.viewer?.display_name || view.viewer?.username || 'Anonymous'}
                        </Text>
                        {view.viewed_at && (
                          <Text color="$gray11">
                            {new Date(view.viewed_at).toLocaleDateString('en-US', {
                              month: 'short',
                              day: 'numeric',
                            })}
                          </Text>
                        )}
                      </Stack>
                    </Row>
                  )
                )}
              </Stack>
            )}
          </Stack>

          <Separator />

          {/* New Followers */}
          <Stack gap={8}>
            <Row justify="space-between" align="center">
              <Row align="center" gap={8}>
                <UserPlus size={18} color="$gray11" />
                <Text color="$gray11">New Followers</Text>
              </Row>
            </Row>

            {!followers || followers.length === 0 ? (
              <Text color="$gray11" style={{ fontStyle: 'italic' }}>
                No followers yet
              </Text>
            ) : (
              <Stack gap={8}>
                {followers.slice(0, 5).map(
                  (follow: {
                    id: string
                    user?: {
                      avatar_url: string | null
                      display_name?: string | null
                      username?: string | null
                    } | null
                    created_at?: string
                  }) => (
                    <Row key={follow.id} align="center" gap={8}>
                      <Avatar
                        size={32}
                        src={follow.user?.avatar_url ? { uri: follow.user.avatar_url } : undefined}
                        initials={
                          follow.user?.display_name?.charAt(0) ||
                          follow.user?.username?.charAt(0) ||
                          '?'
                        }
                        color="success"
                      />
                      <Stack style={{ flex: 1 }} gap={4}>
                        <Text color="$gray11">
                          {follow.user?.display_name || follow.user?.username || 'User'}
                        </Text>
                        {follow.created_at && (
                          <Text color="$gray11">
                            {new Date(follow.created_at).toLocaleDateString('en-US', {
                              month: 'short',
                              day: 'numeric',
                            })}
                          </Text>
                        )}
                      </Stack>
                    </Row>
                  )
                )}
              </Stack>
            )}
          </Stack>

          <Separator />

          {/* Pending Connection Requests */}
          <Stack gap={8}>
            <Row justify="space-between" align="center">
              <Row align="center" gap={8}>
                <Users size={18} color="$gray11" />
                <Text color="$gray11">Pending Requests</Text>
                {pendingRequests && pendingRequests.received.length > 0 && (
                  <Row
                    backgroundColor="$orange3"
                    paddingHorizontal={8}
                    paddingVertical={2}
                    borderRadius={10}
                    align="center"
                    justify="center"
                  >
                    <Text color="$orange11">{pendingRequests.received.length}</Text>
                  </Row>
                )}
              </Row>
              <Button size="sm" variant="outline" onPress={handleManageConnections}>
                Manage
              </Button>
            </Row>

            {!pendingRequests || pendingRequests.received.length === 0 ? (
              <Text color="$gray11" style={{ fontStyle: 'italic' }}>
                No pending requests
              </Text>
            ) : (
              <Stack gap={8}>
                {pendingRequests.received.slice(0, 3).map(
                  (request: {
                    id: string
                    user?: {
                      avatar_url: string | null
                      display_name?: string | null
                      username?: string | null
                    } | null
                    created_at?: string
                  }) => (
                    <Row key={request.id} align="center" gap={8} justify="space-between">
                      <Row align="center" gap={8} style={{ flex: 1 }}>
                        <Avatar
                          size={32}
                          src={
                            request.user?.avatar_url ? { uri: request.user.avatar_url } : undefined
                          }
                          initials={
                            request.user?.display_name?.charAt(0) ||
                            request.user?.username?.charAt(0) ||
                            '?'
                          }
                          color="primary"
                        />
                        <Stack style={{ flex: 1 }} gap={4}>
                          <Text color="$gray11">
                            {request.user?.display_name || request.user?.username || 'User'}
                          </Text>
                          {request.created_at && (
                            <Text color="$gray11">
                              {new Date(request.created_at).toLocaleDateString('en-US', {
                                month: 'short',
                                day: 'numeric',
                              })}
                            </Text>
                          )}
                        </Stack>
                      </Row>
                      <Row gap={4}>
                        <Button
                          size="sm"
                          iconStart={acceptRequestMutation.isPending ? Loader2 : CheckCircle2}
                          color="success"
                          onPress={() => handleAcceptRequest(request.id)}
                          disabled={
                            acceptRequestMutation.isPending || declineRequestMutation.isPending
                          }
                        />
                        <Button
                          size="sm"
                          iconStart={declineRequestMutation.isPending ? Loader2 : X}
                          variant="outline"
                          onPress={() => handleDeclineRequest(request.id)}
                          disabled={
                            acceptRequestMutation.isPending || declineRequestMutation.isPending
                          }
                        />
                      </Row>
                    </Row>
                  )
                )}
                {pendingRequests.received.length > 3 && (
                  <>
                    <Separator />
                    <Text color="$gray11">
                      {pendingRequests.received.length - 3} more request
                      {pendingRequests.received.length - 3 === 1 ? '' : 's'}
                    </Text>
                  </>
                )}
              </Stack>
            )}
          </Stack>
        </Stack>
      )}
    </Card>
  )
}
