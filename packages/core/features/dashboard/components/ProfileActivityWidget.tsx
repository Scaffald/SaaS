import { ROUTES, buildPath } from '@app/core/constants/routes'
import { api } from '@app/core/utils/api'
import { DashboardWidget } from '@app/ui'
import {
  ArrowDown,
  ArrowUp,
  CheckCircle2,
  Eye,
  Loader2,
  UserPlus,
  Users,
  X,
} from '@tamagui/lucide-icons'
import { useRouter } from 'expo-router'
import { Avatar, Button, Separator, Spinner, Text, XStack, YStack } from 'tamagui'

/**
 * Profile Activity Widget
 * Displays recent profile views, new followers, pending connection requests, and 30-day view trends
 */
export function ProfileActivityWidget() {
  const router = useRouter()

  // Fetch data
  const { data: profileViews, isLoading: viewsLoading } = api.profileViews.getProfileViews.useQuery(
    { limit: 10 }
  )

  const { data: viewAnalytics, isLoading: analyticsLoading } =
    api.profileViews.getViewAnalytics.useQuery()

  const { data: followers, isLoading: followersLoading } = api.follows.getFollowers.useQuery()

  const { data: pendingRequests, isLoading: requestsLoading } =
    api.connections.getPendingRequests.useQuery()

  // Connection mutations for quick actions
  const utils = api.useUtils()

  const acceptRequestMutation = api.connections.acceptRequest.useMutation({
    onMutate: async () => {
      await utils.connections.getPendingRequests.cancel()
    },
    onSuccess: () => {
      utils.connections.getPendingRequests.invalidate()
      utils.connections.getConnections.invalidate()
    },
  })

  const declineRequestMutation = api.connections.declineRequest.useMutation({
    onMutate: async () => {
      await utils.connections.getPendingRequests.cancel()
    },
    onSuccess: () => {
      utils.connections.getPendingRequests.invalidate()
    },
  })

  const handleAcceptRequest = (connectionId: string) => {
    acceptRequestMutation.mutate({ connectionId })
  }

  const handleDeclineRequest = (connectionId: string) => {
    declineRequestMutation.mutate({ connectionId })
  }

  const handleViewAllProfileViews = () => {
    router.push(buildPath(ROUTES.DASHBOARD.CONNECTIONS, {}))
  }

  const handleManageConnections = () => {
    router.push(buildPath(ROUTES.DASHBOARD.CONNECTIONS, {}))
  }

  const isLoading = viewsLoading || analyticsLoading || followersLoading || requestsLoading

  return (
    <DashboardWidget title="Profile Activity">
      {isLoading ? (
        <YStack items="center" justify="center" py="$4" gap="$2">
          <Spinner size="large" />
          <Text color="$color11">Loading activity...</Text>
        </YStack>
      ) : (
        <YStack gap="$4">
          {/* 30-Day View Trend */}
          {viewAnalytics && (
            <YStack gap="$2" bg="$blue2" p="$3" rounded="$4" borderWidth={1} borderColor="$blue6">
              <XStack items="center" gap="$2">
                <Eye size={18} color="$blue10" />
                <Text fontSize="$4" fontWeight="600" color="$blue11">
                  Profile Views (30 days)
                </Text>
              </XStack>
              <XStack items="baseline" gap="$2">
                <Text fontSize="$7" fontWeight="700" color="$blue11">
                  {viewAnalytics.views30d}
                </Text>
                {viewAnalytics.trend !== 0 && (
                  <XStack items="center" gap="$1">
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
                  </XStack>
                )}
              </XStack>
              {viewAnalytics.viewsTotal > 0 && (
                <Text fontSize="$2" color="$blue10">
                  {viewAnalytics.viewsTotal} total views
                </Text>
              )}
            </YStack>
          )}

          {/* Recent Profile Views */}
          <YStack gap="$2">
            <XStack justify="space-between" items="center">
              <XStack items="center" gap="$2">
                <Eye size={18} color="$color12" />
                <Text fontSize="$5" fontWeight="600" color="$color12">
                  Recent Views
                </Text>
              </XStack>
              {profileViews && profileViews.total > 0 && (
                <Button size="$2" variant="outlined" onPress={handleViewAllProfileViews}>
                  View All
                </Button>
              )}
            </XStack>

            {!profileViews || profileViews.views.length === 0 ? (
              <Text fontSize="$3" color="$color10" fontStyle="italic">
                No profile views yet
              </Text>
            ) : (
              <YStack gap="$2">
                {profileViews.views.slice(0, 5).map((view) => (
                  <XStack key={view.id} items="center" gap="$2">
                    <Avatar circular size={32}>
                      {view.viewer?.avatar_url ? (
                        <Avatar.Image source={{ uri: view.viewer.avatar_url }} />
                      ) : (
                        <Avatar.Fallback bg="$blue4">
                          <Text fontSize="$3" fontWeight="600" color="$blue10">
                            {view.viewer?.display_name?.charAt(0) ||
                              view.viewer?.username?.charAt(0) ||
                              '?'}
                          </Text>
                        </Avatar.Fallback>
                      )}
                    </Avatar>
                    <YStack flex={1} gap="$1">
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
                    </YStack>
                  </XStack>
                ))}
              </YStack>
            )}
          </YStack>

          <Separator />

          {/* New Followers */}
          <YStack gap="$2">
            <XStack justify="space-between" items="center">
              <XStack items="center" gap="$2">
                <UserPlus size={18} color="$color12" />
                <Text fontSize="$5" fontWeight="600" color="$color12">
                  New Followers
                </Text>
              </XStack>
            </XStack>

            {!followers || followers.length === 0 ? (
              <Text fontSize="$3" color="$color10" fontStyle="italic">
                No followers yet
              </Text>
            ) : (
              <YStack gap="$2">
                {followers.slice(0, 5).map((follow) => (
                  <XStack key={follow.id} items="center" gap="$2">
                    <Avatar circular size={32}>
                      {follow.user?.avatar_url ? (
                        <Avatar.Image source={{ uri: follow.user.avatar_url }} />
                      ) : (
                        <Avatar.Fallback bg="$green4">
                          <Text fontSize="$3" fontWeight="600" color="$green10">
                            {follow.user?.display_name?.charAt(0) ||
                              follow.user?.username?.charAt(0) ||
                              '?'}
                          </Text>
                        </Avatar.Fallback>
                      )}
                    </Avatar>
                    <YStack flex={1} gap="$1">
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
                    </YStack>
                  </XStack>
                ))}
              </YStack>
            )}
          </YStack>

          <Separator />

          {/* Pending Connection Requests */}
          <YStack gap="$2">
            <XStack justify="space-between" items="center">
              <XStack items="center" gap="$2">
                <Users size={18} color="$color12" />
                <Text fontSize="$5" fontWeight="600" color="$color12">
                  Pending Requests
                </Text>
                {pendingRequests && pendingRequests.received.length > 0 && (
                  <XStack
                    bg="$orange3"
                    px="$2"
                    py="$0.5"
                    rounded="$10"
                    items="center"
                    justify="center"
                  >
                    <Text fontSize="$2" fontWeight="700" color="$orange11">
                      {pendingRequests.received.length}
                    </Text>
                  </XStack>
                )}
              </XStack>
              <Button size="$2" variant="outlined" onPress={handleManageConnections}>
                Manage
              </Button>
            </XStack>

            {!pendingRequests || pendingRequests.received.length === 0 ? (
              <Text fontSize="$3" color="$color10" fontStyle="italic">
                No pending requests
              </Text>
            ) : (
              <YStack gap="$2">
                {pendingRequests.received.slice(0, 3).map((request) => (
                  <XStack key={request.id} items="center" gap="$2" justify="space-between">
                    <XStack items="center" gap="$2" flex={1}>
                      <Avatar circular size={32}>
                        {request.user?.avatar_url ? (
                          <Avatar.Image source={{ uri: request.user.avatar_url }} />
                        ) : (
                          <Avatar.Fallback bg="$purple4">
                            <Text fontSize="$3" fontWeight="600" color="$purple10">
                              {request.user?.display_name?.charAt(0) ||
                                request.user?.username?.charAt(0) ||
                                '?'}
                            </Text>
                          </Avatar.Fallback>
                        )}
                      </Avatar>
                      <YStack flex={1} gap="$1">
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
                      </YStack>
                    </XStack>
                    <XStack gap="$1">
                      <Button
                        size="$2"
                        circular
                        icon={
                          acceptRequestMutation.isPending ? Loader2 : CheckCircle2
                        }
                        theme="success"
                        onPress={() => handleAcceptRequest(request.id)}
                        disabled={acceptRequestMutation.isPending || declineRequestMutation.isPending}
                      />
                      <Button
                        size="$2"
                        circular
                        icon={declineRequestMutation.isPending ? Loader2 : X}
                        variant="outlined"
                        onPress={() => handleDeclineRequest(request.id)}
                        disabled={acceptRequestMutation.isPending || declineRequestMutation.isPending}
                      />
                    </XStack>
                  </XStack>
                ))}
                {pendingRequests.received.length > 3 && (
                  <>
                    <Separator />
                    <Text fontSize="$3" color="$color11">
                      {pendingRequests.received.length - 3} more request
                      {pendingRequests.received.length - 3 === 1 ? '' : 's'}
                    </Text>
                  </>
                )}
              </YStack>
            )}
          </YStack>
        </YStack>
      )}
    </DashboardWidget>
  )
}

