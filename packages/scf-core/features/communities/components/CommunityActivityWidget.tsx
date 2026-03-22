import { ROUTES } from '@scf/core/constants/routes'
import {
  useCommunities,
  usePublishedFeed,
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
import { MessageSquare, ThumbsUp } from 'lucide-react-native'
import { useRouter } from 'expo-router'
import { Pressable } from 'react-native'
import { useMemo } from 'react'
import type { CommunityPost } from '@scaffald/sdk/resources/community-posts'

function CommunityActivityWidgetSkeleton() {
  return (
    <DashboardWidget gap={12}>
      <Row align="center" justify="space-between">
        <Skeleton width={120} height={16} shape="text" />
      </Row>
      {[0, 1, 2].map((i) => (
        <SkeletonBox key={i} width="100%" height={64} borderRadius={8} />
      ))}
    </DashboardWidget>
  )
}

/**
 * Shows recent posts across all communities.
 * Designed for the right column of /communities and /dashboard pages.
 */
export function CommunityActivityWidget({ maxItems = 5 }: { maxItems?: number }) {
  const router = useRouter()
  const { theme } = useThemeContext()
  const t = theme === 'dark' ? 'dark' : 'light'

  const { data, isLoading } = usePublishedFeed({ limit: maxItems })
  const { data: communitiesData } = useCommunities()

  const communityMap = useMemo(() => {
    const map = new Map<string, { name: string; slug: string }>()
    for (const c of communitiesData?.data ?? []) {
      map.set(c.id, { name: c.name, slug: c.slug })
    }
    return map
  }, [communitiesData])

  if (isLoading) return <CommunityActivityWidgetSkeleton />

  const posts: CommunityPost[] = data?.pages?.[0]?.data ?? []

  if (posts.length === 0) return null

  return (
    <DashboardWidget gap={0}>
      <DashboardWidgetHeader
        title="Recent Activity"
        action={
          <Button
            variant="text"
            color="primary"
            size="sm"
            onPress={() => router.push(ROUTES.COMMUNITIES.path)}
          >
            View All
          </Button>
        }
      />

      <Stack gap={0}>
        {posts.slice(0, maxItems).map((post: CommunityPost, index: number) => {
          const community = communityMap.get(post.community_id)
          return (
            <Pressable
              key={post.id}
              onPress={() => {
                if (community?.slug) {
                  router.push(
                    `/communities/${community.slug}/post/${post.id}` as never
                  )
                }
              }}
            >
              <Stack
                gap={6}
                style={{
                  paddingVertical: 12,
                  borderTopWidth: index > 0 ? 1 : 0,
                  borderTopColor: colors.border[t].default,
                }}
              >
                <Row align="center" gap={6}>
                  <Avatar
                    size={20}
                    src={post.author?.avatar_url ?? undefined}
                    initials={post.author?.display_name?.[0] || '?'}
                  />
                  <Text
                    size="sm"
                    weight="medium"
                    style={{ color: colors.text[t].secondary }}
                    numberOfLines={1}
                  >
                    {post.author?.display_name || 'Anonymous'}
                  </Text>
                  {community?.name && (
                    <>
                      <Text size="sm" style={{ color: colors.text[t].tertiary }}>
                        in
                      </Text>
                      <Text
                        size="sm"
                        weight="medium"
                        style={{ color: colors.text[t].secondary }}
                        numberOfLines={1}
                      >
                        {community.name}
                      </Text>
                    </>
                  )}
                </Row>

                <Text
                  size="md"
                  weight="semibold"
                  style={{ color: colors.text[t].primary }}
                  numberOfLines={1}
                >
                  {post.title}
                </Text>

                <Row align="center" gap={12}>
                  <Row align="center" gap={4}>
                    <ThumbsUp size={12} color={colors.text[t].tertiary} />
                    <Text size="sm" style={{ color: colors.text[t].tertiary }}>
                      {post.upvote_count ?? 0}
                    </Text>
                  </Row>
                  <Row align="center" gap={4}>
                    <MessageSquare size={12} color={colors.text[t].tertiary} />
                    <Text size="sm" style={{ color: colors.text[t].tertiary }}>
                      {post.comment_count ?? 0}
                    </Text>
                  </Row>
                  <Text
                    size="sm"
                    style={{ color: colors.text[t].tertiary, marginLeft: 'auto' }}
                  >
                    {new Date(post.created_at).toLocaleDateString('en-US', {
                      month: 'short',
                      day: 'numeric',
                    })}
                  </Text>
                </Row>
              </Stack>
            </Pressable>
          )
        })}
      </Stack>
    </DashboardWidget>
  )
}
