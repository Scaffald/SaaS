import {
  useCommunities,
  useMyCommunities,
  useJoinCommunityMutation,
} from '@scf/core/utils/communities-sdk-hooks'
import {
  Avatar,
  Button,
  DashboardWidget,
  DashboardWidgetHeader,
  Skeleton,
  SkeletonBox,
  Text,
  Row,
  Stack,
  useThemeContext,
} from '@scaffald/ui'
import { colors } from '@scaffald/ui/tokens'
import { Loader2, UserPlus } from 'lucide-react-native'
import { useRouter } from 'expo-router'
import { useQueryClient } from '@tanstack/react-query'
import { useMemo } from 'react'

function SuggestedCommunitiesWidgetSkeleton() {
  return (
    <DashboardWidget gap={12}>
      <Skeleton width={160} height={16} shape="text" />
      {[0, 1, 2].map((i) => (
        <Row key={i} align="center" gap={10} justify="space-between">
          <Row align="center" gap={10} style={{ flex: 1 }}>
            <SkeletonBox width={36} height={36} borderRadius={18} />
            <Stack gap={4} style={{ flex: 1 }}>
              <Skeleton width="60%" height={13} shape="text" />
              <Skeleton width="40%" height={11} shape="text" />
            </Stack>
          </Row>
          <SkeletonBox width={56} height={32} borderRadius={6} />
        </Row>
      ))}
    </DashboardWidget>
  )
}

/**
 * Shows communities the user hasn't joined yet, with a quick "Join" action.
 */
export function SuggestedCommunitiesWidget({ maxItems = 3 }: { maxItems?: number }) {
  const router = useRouter()
  const queryClient = useQueryClient()
  const { theme } = useThemeContext()
  const t = theme === 'dark' ? 'dark' : 'light'

  const { data: allData, isLoading: allLoading } = useCommunities()
  const { data: myData, isLoading: myLoading } = useMyCommunities()

  const joinMutation = useJoinCommunityMutation({
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['communities', 'my'] })
      queryClient.invalidateQueries({ queryKey: ['communities', 'list'] })
    },
  })

  const suggested = useMemo(() => {
    if (!allData?.data || !myData?.data) return []
    const joinedIds = new Set(myData.data.map((m) => m.community_id))
    return allData.data
      .filter((c) => !joinedIds.has(c.id))
      .sort((a, b) => (b.member_count ?? 0) - (a.member_count ?? 0))
      .slice(0, maxItems)
  }, [allData, myData, maxItems])

  if (allLoading || myLoading) return <SuggestedCommunitiesWidgetSkeleton />
  if (suggested.length === 0) return null

  return (
    <DashboardWidget gap={0} elevated>
      <DashboardWidgetHeader title="Suggested Communities" />

      <Stack gap={0}>
        {suggested.map((community, index) => (
          <Row
            key={community.id}
            align="center"
            gap={10}
            justify="space-between"
            style={{
              paddingVertical: 10,
              borderTopWidth: index > 0 ? 1 : 0,
              borderTopColor: colors.border[t].default,
            }}
          >
            <Row
              align="center"
              gap={10}
              style={{ flex: 1, minWidth: 0 }}
            >
              <Avatar
                size={36}
                initials={community.name?.[0] || '?'}
                color="primary"
              />
              <Stack style={{ flex: 1, minWidth: 0 }} gap={2}>
                <Text
                  size="md"
                  weight="medium"
                  style={{ color: colors.text[t].primary }}
                  numberOfLines={1}
                >
                  {community.name}
                </Text>
                <Text size="sm" style={{ color: colors.text[t].tertiary }}>
                  {community.member_count ?? 0} members
                </Text>
              </Stack>
            </Row>
            <Button
              size="sm"
              variant="outline"
              iconStart={joinMutation.isPending ? Loader2 : UserPlus}
              onPress={() =>
                joinMutation.mutate({ communityId: community.id })
              }
              disabled={joinMutation.isPending}
            >
              Join
            </Button>
          </Row>
        ))}
      </Stack>
    </DashboardWidget>
  )
}
