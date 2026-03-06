import { ROUTES, buildPath } from '@scf/core/constants/routes'
import {
  useFollowers,
  usePendingConnections,
  useAcceptConnectionMutation,
  useDeclineConnectionMutation,
} from '@scf/core/utils/engagement-sdk-hooks'
import { useProfileViews, useViewAnalytics } from '@scf/core/utils/profile-views-sdk-hooks'
import {
  Avatar,
  Button,
  DashboardWidget,
  H4,
  Skeleton,
  SkeletonAvatar,
  SkeletonBox,
  Text,
  Row,
  Stack,
  useThemeContext,
} from '@scaffald/ui'
import { colors } from '@scaffald/ui/tokens'
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
import { useQueryClient } from '@tanstack/react-query'

// ─── Skeleton ────────────────────────────────────────────────────────────────

function ProfileActivityWidgetSkeleton() {
  return (
    <DashboardWidget gap={16}>
      {/* Header */}
      <Row align="center" gap={8}>
        <Skeleton width={130} height={16} shape="text" />
      </Row>

      {/* Analytics card */}
      <SkeletonBox width="100%" height={72} borderRadius={12} />

      {/* Recent Views */}
      <Stack gap={10}>
        <Row align="center" justify="space-between">
          <Row align="center" gap={6}>
            <Skeleton width={14} height={14} shape="circle" />
            <Skeleton width={100} height={13} shape="text" />
          </Row>
          <SkeletonBox width={60} height={28} borderRadius={6} />
        </Row>
        {[0, 1, 2].map((i) => (
          <Row key={i} align="center" gap={10}>
            <SkeletonAvatar size={36} />
            <Stack gap={4} style={{ flex: 1 }}>
              <Skeleton width="55%" height={13} shape="text" />
              <Skeleton width="30%" height={11} shape="text" />
            </Stack>
          </Row>
        ))}
      </Stack>

      {/* Followers */}
      <Stack gap={10}>
        <Row align="center" gap={6}>
          <Skeleton width={14} height={14} shape="circle" />
          <Skeleton width={100} height={13} shape="text" />
        </Row>
        {[0, 1, 2].map((i) => (
          <Row key={i} align="center" gap={10}>
            <SkeletonAvatar size={36} />
            <Stack gap={4} style={{ flex: 1 }}>
              <Skeleton width="50%" height={13} shape="text" />
              <Skeleton width="25%" height={11} shape="text" />
            </Stack>
          </Row>
        ))}
      </Stack>

      {/* Pending requests */}
      <Stack gap={10}>
        <Row align="center" justify="space-between">
          <Row align="center" gap={6}>
            <Skeleton width={14} height={14} shape="circle" />
            <Skeleton width={120} height={13} shape="text" />
          </Row>
          <SkeletonBox width={70} height={28} borderRadius={6} />
        </Row>
        {[0, 1].map((i) => (
          <Row key={i} align="center" gap={10} justify="space-between">
            <Row align="center" gap={10} style={{ flex: 1 }}>
              <SkeletonAvatar size={36} />
              <Skeleton width="50%" height={13} shape="text" />
            </Row>
            <Row gap={6}>
              <SkeletonBox width={32} height={32} borderRadius={6} />
              <SkeletonBox width={32} height={32} borderRadius={6} />
            </Row>
          </Row>
        ))}
      </Stack>
    </DashboardWidget>
  )
}

// ─── Sub-components ───────────────────────────────────────────────────────────

function SectionHeader({
  icon,
  label,
  theme,
  action,
}: {
  icon: React.ReactNode
  label: string
  theme: 'light' | 'dark'
  action?: React.ReactNode
}) {
  return (
    <Row align="center" justify="space-between">
      <Row align="center" gap={6}>
        {icon}
        <Text size="md" weight="semibold" style={{ color: colors.text[theme].secondary }}>
          {label}
        </Text>
      </Row>
      {action}
    </Row>
  )
}

function EmptyRow({ label, theme }: { label: string; theme: 'light' | 'dark' }) {
  return (
    <Text size="sm" style={{ color: colors.text[theme].tertiary, fontStyle: 'italic' }}>
      {label}
    </Text>
  )
}

// ─── Widget ───────────────────────────────────────────────────────────────────

/**
 * Profile Activity Widget
 * Shows 30-day view analytics, recent profile views, new followers, and pending connection requests.
 */
export function ProfileActivityWidget() {
  const router = useRouter()
  const queryClient = useQueryClient()
  const { theme } = useThemeContext()

  const { data: profileViewsData, isLoading: viewsLoading } = useProfileViews({ limit: 10 })
  const profileViewsList = profileViewsData?.views ?? []
  const profileViewsTotal = profileViewsData?.total ?? 0

  const { data: viewAnalytics, isLoading: analyticsLoading } = useViewAnalytics()

  const { data: followersData, isLoading: followersLoading } = useFollowers()
  const followers = followersData?.data

  const { data: pendingData, isLoading: requestsLoading } = usePendingConnections()
  const pendingRequests = pendingData

  const acceptMutation = useAcceptConnectionMutation({
    onMutate: async () => {
      await queryClient.cancelQueries({ queryKey: ['connections', 'pending'] })
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['connections', 'pending'] })
      queryClient.invalidateQueries({ queryKey: ['connections', 'list'] })
    },
  })

  const declineMutation = useDeclineConnectionMutation({
    onMutate: async () => {
      await queryClient.cancelQueries({ queryKey: ['connections', 'pending'] })
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['connections', 'pending'] })
    },
  })

  if (viewsLoading || analyticsLoading || followersLoading || requestsLoading) {
    return <ProfileActivityWidgetSkeleton />
  }

  const trendPositive = viewAnalytics && viewAnalytics.trend > 0

  return (
    <DashboardWidget gap={0}>
      {/* ── Widget header ── */}
      <Row align="center" style={{ paddingBottom: 4 }}>
        <H4 style={{ color: colors.text[theme].primary }}>Activity</H4>
      </Row>

      {/* ── 30-Day analytics banner ── */}
      {viewAnalytics && (
        <Stack
          style={{
            marginBottom: 12,
            padding: 12,
            backgroundColor: theme === 'dark' ? colors.bg[theme].selected : colors.primary[50],
            borderRadius: 10,
            borderWidth: 1,
            borderColor: theme === 'dark' ? colors.primary[700] : colors.primary[200],
          }}
        >
          <Row align="center" justify="space-between">
            <Row align="center" gap={6}>
              <Eye size={16} color={colors.primary[500]} />
              <Text size="sm" weight="semibold" style={{ color: colors.primary[600] }}>
                Views · 30 days
              </Text>
            </Row>
            {viewAnalytics.trend !== 0 && (
              <Row align="center" gap={3}>
                {trendPositive ? (
                  <ArrowUp size={14} color={colors.success[500]} />
                ) : (
                  <ArrowDown size={14} color={colors.error[500]} />
                )}
                <Text
                  size="sm"
                  weight="semibold"
                  style={{
                    color: trendPositive ? colors.success[600] : colors.error[600],
                  }}
                >
                  {Math.abs(viewAnalytics.trend).toFixed(1)}%
                </Text>
              </Row>
            )}
          </Row>
          <Row align="baseline" gap={6} style={{ marginTop: 4 }}>
            <Text size="2xl" weight="bold" style={{ color: colors.primary[700] }}>
              {viewAnalytics.views30d}
            </Text>
            {viewAnalytics.viewsTotal > 0 && (
              <Text size="sm" style={{ color: colors.primary[500] }}>
                of {viewAnalytics.viewsTotal} total
              </Text>
            )}
          </Row>
        </Stack>
      )}

      {/* ── Recent profile views ── */}
      <Stack style={{ paddingVertical: 14 }} gap={10}>
        <SectionHeader
          theme={theme}
          icon={<Eye size={14} color={colors.text[theme].tertiary} />}
          label="Recent Views"
          action={
            profileViewsTotal > 0 ? (
              <Button
                variant="text"
                color="primary"
                size="sm"
                onPress={() => router.push(buildPath(ROUTES.DASHBOARD.CONNECTIONS, {}))}
              >
                View All
              </Button>
            ) : undefined
          }
        />

        {profileViewsList.length === 0 ? (
          <EmptyRow label="No profile views yet" theme={theme} />
        ) : (
          <Stack gap={10}>
            {profileViewsList.slice(0, 5).map(
              (view: {
                id: string
                viewer?: { avatar_url: string | null; display_name?: string | null; username?: string | null } | null
                viewed_at?: string
              }) => (
                <Row key={view.id} align="center" gap={10}>
                  <Avatar
                    size={36}
                    src={view.viewer?.avatar_url ? { uri: view.viewer.avatar_url } : undefined}
                    initials={view.viewer?.display_name?.charAt(0) || view.viewer?.username?.charAt(0) || '?'}
                    color="info"
                  />
                  <Stack style={{ flex: 1 }} gap={2}>
                    <Text size="md" weight="medium" style={{ color: colors.text[theme].secondary }}>
                      {view.viewer?.display_name || view.viewer?.username || 'Anonymous'}
                    </Text>
                    {view.viewed_at && (
                      <Text size="sm" style={{ color: colors.text[theme].tertiary }}>
                        {new Date(view.viewed_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                      </Text>
                    )}
                  </Stack>
                </Row>
              )
            )}
          </Stack>
        )}
      </Stack>

      {/* ── New followers ── */}
      <Stack style={{ paddingVertical: 14 }} gap={10}>
        <SectionHeader
          theme={theme}
          icon={<UserPlus size={14} color={colors.text[theme].tertiary} />}
          label="New Followers"
        />

        {!followers || followers.length === 0 ? (
          <EmptyRow label="No followers yet" theme={theme} />
        ) : (
          <Stack gap={10}>
            {followers.slice(0, 5).map(
              (follow: {
                id: string
                user?: { avatar_url: string | null; display_name?: string | null; username?: string | null } | null
                created_at?: string
              }) => (
                <Row key={follow.id} align="center" gap={10}>
                  <Avatar
                    size={36}
                    src={follow.user?.avatar_url ? { uri: follow.user.avatar_url } : undefined}
                    initials={follow.user?.display_name?.charAt(0) || follow.user?.username?.charAt(0) || '?'}
                    color="success"
                  />
                  <Stack style={{ flex: 1 }} gap={2}>
                    <Text size="md" weight="medium" style={{ color: colors.text[theme].secondary }}>
                      {follow.user?.display_name || follow.user?.username || 'User'}
                    </Text>
                    {follow.created_at && (
                      <Text size="sm" style={{ color: colors.text[theme].tertiary }}>
                        {new Date(follow.created_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                      </Text>
                    )}
                  </Stack>
                </Row>
              )
            )}
          </Stack>
        )}
      </Stack>

      {/* ── Pending connection requests ── */}
      <Stack style={{ paddingVertical: 14 }} gap={10}>
        <SectionHeader
          theme={theme}
          icon={<Users size={14} color={colors.text[theme].tertiary} />}
          label={
            pendingRequests && pendingRequests.received.length > 0
              ? `Pending Requests (${pendingRequests.received.length})`
              : 'Pending Requests'
          }
          action={
            <Button
              variant="text"
              color="primary"
              size="sm"
              onPress={() => router.push(buildPath(ROUTES.DASHBOARD.CONNECTIONS, {}))}
            >
              Manage
            </Button>
          }
        />

        {!pendingRequests || pendingRequests.received.length === 0 ? (
          <EmptyRow label="No pending requests" theme={theme} />
        ) : (
          <Stack gap={10}>
            {pendingRequests.received.slice(0, 3).map(
              (request: {
                id: string
                user?: { avatar_url: string | null; display_name?: string | null; username?: string | null } | null
                created_at?: string
              }) => (
                <Row key={request.id} align="center" gap={10} justify="space-between">
                  <Row align="center" gap={10} style={{ flex: 1, minWidth: 0 }}>
                    <Avatar
                      size={36}
                      src={request.user?.avatar_url ? { uri: request.user.avatar_url } : undefined}
                      initials={request.user?.display_name?.charAt(0) || request.user?.username?.charAt(0) || '?'}
                      color="primary"
                    />
                    <Stack style={{ flex: 1, minWidth: 0 }} gap={2}>
                      <Text
                        size="md"
                        weight="medium"
                        style={{ color: colors.text[theme].secondary }}
                        numberOfLines={1}
                      >
                        {request.user?.display_name || request.user?.username || 'User'}
                      </Text>
                      {request.created_at && (
                        <Text size="sm" style={{ color: colors.text[theme].tertiary }}>
                          {new Date(request.created_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                        </Text>
                      )}
                    </Stack>
                  </Row>
                  <Row gap={6}>
                    <Button
                      size="sm"
                      iconStart={acceptMutation.isPending ? Loader2 : CheckCircle2}
                      color="success"
                      onPress={() => acceptMutation.mutate(request.id)}
                      disabled={acceptMutation.isPending || declineMutation.isPending}
                    />
                    <Button
                      size="sm"
                      iconStart={declineMutation.isPending ? Loader2 : X}
                      variant="outline"
                      onPress={() => declineMutation.mutate(request.id)}
                      disabled={acceptMutation.isPending || declineMutation.isPending}
                    />
                  </Row>
                </Row>
              )
            )}
            {pendingRequests.received.length > 3 && (
              <Text size="sm" style={{ color: colors.text[theme].tertiary }}>
                +{pendingRequests.received.length - 3} more request{pendingRequests.received.length - 3 === 1 ? '' : 's'}
              </Text>
            )}
          </Stack>
        )}
      </Stack>
    </DashboardWidget>
  )
}
