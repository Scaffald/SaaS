import { ROUTES, buildPath } from '@scf/core/constants/routes'
import { api } from '@scf/core/utils/api'
import {
  useFollowers,
  usePendingConnections,
  useAcceptConnectionMutation,
  useDeclineConnectionMutation,
} from '@scf/core/utils/engagement-sdk-hooks'
import { Card } from '@unicornlove/beyond-ui'
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
import { Avatar, Button, Separator, Spinner, Text, Row, Stack } from '@unicornlove/beyond-ui'
import { useQueryClient } from '@tanstack/react-query'

/**
 * Profile Activity Widget
 * Displays recent profile views, new followers, pending connection requests, and 30-day view trends
 */
export function ProfileActivityWidget() {
  const router = useRouter()
  const queryClient = useQueryClient()

  // Fetch data
  const { data: profileViews, isLoading: viewsLoading } = api.profileViews.getProfileViews.useQuery(
    { limit: 10 }
  )

  const { data: viewAnalytics, isLoading: analyticsLoading } =
    api.profileViews.getViewAnalytics.useQuery()

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
      <Text fontSize="$5" fontWeight="600" color="$color12">
        Profile Activity
      </Text>
      {isLoading ? (
        <Stack alignItems="center" justifyContent="center" paddingVertical="$4" gap="$2">
          <Spinner size="large" />
          <Text color="$color11">Loading activity...</Text>
        </Stack>
      ) : (
        <Stack gap="$4">
          {/* 30-Day View Trend */}
          {viewAnalytics && (
            <Stack
              gap="$2"
              backgroundColor="$blue2"
              padding="$3"
              borderRadius="$4"
              borderWidth={1}
              borderColor="$blue6"
            >
              <Row alignItems="center" gap="$2">
                <Eye size={18} color="$blue10" />
                <Text fontSize="$4" fontWeight="600" color="$blue11">
                  Profile Views (30 days)
                </Text>
              </Row>
              <Row alignItems="baseline" gap="$2">
                <Text fontSize="$7" fontWeight="700" color="$blue11">
                  {viewAnalytics.views30d}
                </Text>
                {viewAnalytics.trend !== 0 && (
                  <Row alignItems="center" gap="$1">
                    {viewAnalytics.trend > 0 ? (
                      <ArrowUp size={16} color="$green10" />
                    ) : (
                      <ArrowDown size={16} color="$red10" />
                    )}
                    <Text
                      fontSize="$3"
                      fontWeight="600"
                      color={viewAnalytics.trend > 0 ? '$green11' : '$red11'}
                    >
                      {Math.abs(viewAnalytics.trend).toFixed(1)}%
                    </Text>
                  </Row>
                )}
              </Row>
              {viewAnalytics.viewsTotal > 0 && (
                <Text fontSize="$2" color="$blue10">
                  {viewAnalytics.viewsTotal} total views
                </Text>
              )}
            </Stack>
          )}

          {/* Recent Profile Views */}
          <Stack gap="$2">
            <Row justifyContent="space-between" alignItems="center">
              <Row alignItems="center" gap="$2">
                <Eye size={18} color="$color12" />
                <Text fontSize="$5" fontWeight="600" color="$color12">
                  Recent Views
                </Text>
              </Row>
              {profileViews && profileViews.total > 0 && (
                <Button size="$2" variant="outlined" onPress={handleViewAllProfileViews}>
                  View All
                </Button>
              )}
            </Row>

            {!profileViews || profileViews.views.length === 0 ? (
              <Text fontSize="$3" color="$color10" fontStyle="italic">
                No profile views yet
              </Text>
            ) : (
              <Stack gap="$2">
                {profileViews.views.slice(0, 5).map(
                  (view: {
                    id: string
                    viewer?: {
                      avatar_url: string | null
                      display_name?: string | null
                      username?: string | null
                    } | null
                    viewed_at?: string
                  }) => (
                    <Row key={view.id} alignItems="center" gap="$2">
                      <Avatar circular size={32}>
                        {view.viewer?.avatar_url ? (
                          <Avatar.Image source={{ uri: view.viewer.avatar_url }} />
                        ) : (
                          <Avatar.Fallback backgroundColor="$blue4">
                            <Text fontSize="$3" fontWeight="600" color="$blue10">
                              {view.viewer?.display_name?.charAt(0) ||
                                view.viewer?.username?.charAt(0) ||
                                '?'}
                            </Text>
                          </Avatar.Fallback>
                        )}
                      </Avatar>
                      <Stack flex={1} gap="$1">
                        <Text fontSize="$3" fontWeight="600" color="$color12">
                          {view.viewer?.display_name || view.viewer?.username || 'Anonymous'}
                        </Text>
                        {view.viewed_at && (
                          <Text fontSize="$2" color="$color10">
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
          <Stack gap="$2">
            <Row justifyContent="space-between" alignItems="center">
              <Row alignItems="center" gap="$2">
                <UserPlus size={18} color="$color12" />
                <Text fontSize="$5" fontWeight="600" color="$color12">
                  New Followers
                </Text>
              </Row>
            </Row>

            {!followers || followers.length === 0 ? (
              <Text fontSize="$3" color="$color10" fontStyle="italic">
                No followers yet
              </Text>
            ) : (
              <Stack gap="$2">
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
                    <Row key={follow.id} alignItems="center" gap="$2">
                      <Avatar circular size={32}>
                        {follow.user?.avatar_url ? (
                          <Avatar.Image source={{ uri: follow.user.avatar_url }} />
                        ) : (
                          <Avatar.Fallback backgroundColor="$green4">
                            <Text fontSize="$3" fontWeight="600" color="$green10">
                              {follow.user?.display_name?.charAt(0) ||
                                follow.user?.username?.charAt(0) ||
                                '?'}
                            </Text>
                          </Avatar.Fallback>
                        )}
                      </Avatar>
                      <Stack flex={1} gap="$1">
                        <Text fontSize="$3" fontWeight="600" color="$color12">
                          {follow.user?.display_name || follow.user?.username || 'User'}
                        </Text>
                        {follow.created_at && (
                          <Text fontSize="$2" color="$color10">
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
          <Stack gap="$2">
            <Row justifyContent="space-between" alignItems="center">
              <Row alignItems="center" gap="$2">
                <Users size={18} color="$color12" />
                <Text fontSize="$5" fontWeight="600" color="$color12">
                  Pending Requests
                </Text>
                {pendingRequests && pendingRequests.received.length > 0 && (
                  <Row
                    backgroundColor="$orange3"
                    paddingHorizontal="$2"
                    paddingVertical="$0.5"
                    borderRadius="$10"
                    alignItems="center"
                    justifyContent="center"
                  >
                    <Text fontSize="$2" fontWeight="700" color="$orange11">
                      {pendingRequests.received.length}
                    </Text>
                  </Row>
                )}
              </Row>
              <Button size="$2" variant="outlined" onPress={handleManageConnections}>
                Manage
              </Button>
            </Row>

            {!pendingRequests || pendingRequests.received.length === 0 ? (
              <Text fontSize="$3" color="$color10" fontStyle="italic">
                No pending requests
              </Text>
            ) : (
              <Stack gap="$2">
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
                    <Row
                      key={request.id}
                      alignItems="center"
                      gap="$2"
                      justifyContent="space-between"
                    >
                      <Row alignItems="center" gap="$2" flex={1}>
                        <Avatar circular size={32}>
                          {request.user?.avatar_url ? (
                            <Avatar.Image source={{ uri: request.user.avatar_url }} />
                          ) : (
                            <Avatar.Fallback backgroundColor="$purple4">
                              <Text fontSize="$3" fontWeight="600" color="$purple10">
                                {request.user?.display_name?.charAt(0) ||
                                  request.user?.username?.charAt(0) ||
                                  '?'}
                              </Text>
                            </Avatar.Fallback>
                          )}
                        </Avatar>
                        <Stack flex={1} gap="$1">
                          <Text fontSize="$3" fontWeight="600" color="$color12">
                            {request.user?.display_name || request.user?.username || 'User'}
                          </Text>
                          {request.created_at && (
                            <Text fontSize="$2" color="$color10">
                              {new Date(request.created_at).toLocaleDateString('en-US', {
                                month: 'short',
                                day: 'numeric',
                              })}
                            </Text>
                          )}
                        </Stack>
                      </Row>
                      <Row gap="$1">
                        <Button
                          size="$2"
                          circular
                          icon={acceptRequestMutation.isPending ? Loader2 : CheckCircle2}
                          theme="success"
                          onPress={() => handleAcceptRequest(request.id)}
                          disabled={
                            acceptRequestMutation.isPending || declineRequestMutation.isPending
                          }
                        />
                        <Button
                          size="$2"
                          circular
                          icon={declineRequestMutation.isPending ? Loader2 : X}
                          variant="outlined"
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
                    <Text fontSize="$3" color="$color11">
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
