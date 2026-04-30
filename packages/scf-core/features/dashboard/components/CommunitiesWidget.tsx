import { ROUTES, buildPath } from '@scf/core/constants/routes'
import {
  useCommunities,
  useCommunityFeed,
  useJoinCommunityMutation,
  useMyCommunities,
} from '@scf/core/utils/communities-sdk-hooks'
import {
  Button,
  DashboardWidget,
  Row,
  Skeleton,
  SkeletonGroup,
  Stack,
  Text,
  useThemeContext,
} from '@scaffald/ui'
import { colors } from '@scaffald/ui/tokens'
import { useQueryClient } from '@tanstack/react-query'
import { useRouter } from 'expo-router'
import { MessageCircle, ThumbsUp, Users } from 'lucide-react-native'
import { useEffect, useMemo, useState } from 'react'
import { Image, Pressable, ScrollView, View } from 'react-native'

interface Community {
  id: string
  slug: string
  name: string
  icon_url: string | null
  member_count: number
}

interface MyCommunityItem {
  community_id: string
}

interface PostAuthor {
  display_name?: string | null
  avatar_url?: string | null
}

interface CommunityPostLite {
  id: string
  title: string | null
  body: string | null
  media_thumbnails?: string[] | null
  media_urls?: string[] | null
  upvote_count: number
  comment_count: number
  author?: PostAuthor | null
}

const PREVIEW_LIMIT = 3

function formatMemberCount(n: number): string {
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1)}M`
  if (n >= 1_000) return `${(n / 1_000).toFixed(1)}K`
  return `${n}`
}

function CommunityBadge({
  community,
  selected,
  onPress,
}: {
  community: Community
  selected: boolean
  onPress: () => void
}) {
  const { theme } = useThemeContext()

  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => ({
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8,
        paddingLeft: 4,
        paddingRight: 12,
        paddingVertical: 4,
        borderRadius: 999,
        borderWidth: 1,
        borderColor: selected ? colors.primary[500] : colors.border[theme].default,
        backgroundColor: selected
          ? colors.primary[50]
          : pressed
            ? colors.bg[theme].subtle
            : colors.bg[theme].default,
      })}
    >
      <View
        style={{
          width: 28,
          height: 28,
          borderRadius: 14,
          backgroundColor: colors.bg[theme].subtle,
          alignItems: 'center',
          justifyContent: 'center',
          overflow: 'hidden',
        }}
      >
        {community.icon_url ? (
          <Image
            source={{ uri: community.icon_url }}
            style={{ width: 28, height: 28 }}
            resizeMode="cover"
          />
        ) : (
          <Users size={14} color={colors.icon[theme].default} />
        )}
      </View>
      <Text
        size="sm"
        weight="semibold"
        style={{
          color: selected ? colors.primary[700] : colors.text[theme].primary,
        }}
        numberOfLines={1}
      >
        {community.name}
      </Text>
    </Pressable>
  )
}

function PostPreview({
  post,
  onPress,
}: {
  post: CommunityPostLite
  onPress: () => void
}) {
  const { theme } = useThemeContext()
  const thumb = post.media_thumbnails?.[0] ?? post.media_urls?.[0] ?? null

  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => ({
        paddingVertical: 12,
        borderTopWidth: 1,
        borderTopColor: colors.border[theme].subtle,
        opacity: pressed ? 0.7 : 1,
      })}
    >
      {post.title ? (
        <Text
          style={{
            fontSize: 14,
            fontWeight: '700',
            color: colors.text[theme].primary,
            lineHeight: 19,
            marginBottom: 4,
          }}
          numberOfLines={2}
        >
          {post.title}
        </Text>
      ) : null}
      {post.body ? (
        <Text
          style={{
            fontSize: 13,
            color: colors.text[theme].secondary,
            lineHeight: 18,
          }}
          numberOfLines={2}
        >
          {post.body}
        </Text>
      ) : null}
      {thumb ? (
        <Image
          source={{ uri: thumb }}
          style={{
            width: '100%',
            height: 160,
            borderRadius: 10,
            marginTop: 10,
            backgroundColor: colors.bg[theme].muted,
          }}
          resizeMode="cover"
        />
      ) : null}
      <Row gap={16} align="center" style={{ marginTop: 8 }}>
        <Row gap={4} align="center">
          <ThumbsUp size={13} color={colors.icon[theme].muted} />
          <Text style={{ fontSize: 11, color: colors.text[theme].tertiary }}>
            {post.upvote_count}
          </Text>
        </Row>
        <Row gap={4} align="center">
          <MessageCircle size={13} color={colors.icon[theme].muted} />
          <Text style={{ fontSize: 11, color: colors.text[theme].tertiary }}>
            {post.comment_count}
          </Text>
        </Row>
      </Row>
    </Pressable>
  )
}

export function CommunitiesWidget() {
  const { theme } = useThemeContext()
  const router = useRouter()
  const queryClient = useQueryClient()

  const { data: communitiesData, isLoading: communitiesLoading } = useCommunities()
  const { data: myCommunitiesData } = useMyCommunities()

  const communities = useMemo<Community[]>(() => {
    return (communitiesData as { data?: Community[] } | undefined)?.data ?? []
  }, [communitiesData])

  const memberIds = useMemo<Set<string>>(() => {
    const items =
      (myCommunitiesData as { data?: MyCommunityItem[] } | undefined)?.data ?? []
    return new Set(items.map((i) => i.community_id))
  }, [myCommunitiesData])

  const [selectedId, setSelectedId] = useState<string | null>(null)

  useEffect(() => {
    if (selectedId && communities.some((c) => c.id === selectedId)) return
    if (communities.length === 0) {
      setSelectedId(null)
      return
    }
    const firstMember = communities.find((c) => memberIds.has(c.id))
    setSelectedId((firstMember ?? communities[0])?.id ?? null)
  }, [communities, memberIds, selectedId])

  const { data: feedData, isLoading: feedLoading } = useCommunityFeed(
    selectedId ?? undefined,
    { limit: PREVIEW_LIMIT }
  )

  const posts = useMemo<CommunityPostLite[]>(() => {
    const pages =
      (feedData as { pages?: { data?: CommunityPostLite[] }[] } | undefined)?.pages ?? []
    const all = pages.flatMap((p) => p.data ?? [])
    return all.slice(0, PREVIEW_LIMIT)
  }, [feedData])

  const joinMutation = useJoinCommunityMutation({
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['communities', 'list'] })
      queryClient.invalidateQueries({ queryKey: ['communities', 'my'] })
    },
  })

  const selected = communities.find((c) => c.id === selectedId) ?? null
  const isMember = selected ? memberIds.has(selected.id) : false
  const isJoiningSelected =
    joinMutation.isPending && joinMutation.variables?.communityId === selectedId

  if (communitiesLoading) {
    return (
      <DashboardWidget>
        <Row justify="space-between" align="center" paddingBottom={8}>
          <Text
            style={{ fontSize: 18, fontWeight: '700', color: colors.text[theme].primary }}
          >
            Communities
          </Text>
        </Row>
        <SkeletonGroup gap={10} animation="wave">
          <Row gap={10}>
            {[1, 2, 3].map((i) => (
              <Skeleton key={i} width={130} height={38} borderRadius={999} />
            ))}
          </Row>
        </SkeletonGroup>
      </DashboardWidget>
    )
  }

  if (communities.length === 0) return null

  return (
    <DashboardWidget>
      <Row justify="space-between" align="center" paddingBottom={8}>
        <Text
          style={{ fontSize: 18, fontWeight: '700', color: colors.text[theme].primary }}
        >
          Communities
        </Text>
        <Pressable
          onPress={() => router.push(ROUTES.COMMUNITIES.path)}
          hitSlop={8}
          style={({ pressed }) => ({ opacity: pressed ? 0.5 : 1 })}
        >
          <Text style={{ fontSize: 14, fontWeight: '600', color: colors.primary[600] }}>
            See all
          </Text>
        </Pressable>
      </Row>

      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={{ gap: 8, paddingVertical: 2 }}
      >
        {communities.map((c) => (
          <CommunityBadge
            key={c.id}
            community={c}
            selected={c.id === selectedId}
            onPress={() => setSelectedId(c.id)}
          />
        ))}
      </ScrollView>

      {selected ? (
        <Stack gap={0} style={{ marginTop: 8 }}>
          {feedLoading ? (
            <SkeletonGroup gap={8} animation="wave">
              {[1, 2].map((i) => (
                <View
                  key={i}
                  style={{
                    paddingVertical: 12,
                    borderTopWidth: 1,
                    borderTopColor: colors.border[theme].subtle,
                  }}
                >
                  <Skeleton width="40%" height={14} />
                  <Skeleton width="90%" height={16} style={{ marginTop: 8 }} />
                  <Skeleton width="70%" height={14} style={{ marginTop: 6 }} />
                </View>
              ))}
            </SkeletonGroup>
          ) : posts.length === 0 ? (
            <Stack
              gap={6}
              style={{
                paddingVertical: 24,
                alignItems: 'center',
                borderTopWidth: 1,
                borderTopColor: colors.border[theme].subtle,
                marginTop: 8,
              }}
            >
              <Text
                size="sm"
                weight="semibold"
                style={{ color: colors.text[theme].primary }}
              >
                No posts yet in {selected.name}
              </Text>
              <Text
                size="xs"
                style={{ color: colors.text[theme].secondary, textAlign: 'center' }}
              >
                Be the first to share something.
              </Text>
            </Stack>
          ) : (
            posts.map((post) => (
              <PostPreview
                key={post.id}
                post={post}
                onPress={() =>
                  router.push(buildPath(ROUTES.COMMUNITIES.DETAIL, { slug: selected.slug }))
                }
              />
            ))
          )}

          <View style={{ marginTop: 12 }}>
            <Row align="center" gap={8} style={{ marginBottom: 8 }}>
              <Text
                style={{ fontSize: 12, color: colors.text[theme].secondary, flex: 1 }}
              >
                {formatMemberCount(selected.member_count)} members
              </Text>
            </Row>
            {isMember ? (
              <Button
                variant="outline"
                color="gray"
                fullWidth
                onPress={() =>
                  router.push(buildPath(ROUTES.COMMUNITIES.DETAIL, { slug: selected.slug }))
                }
              >
                View {selected.name}
              </Button>
            ) : (
              <Button
                variant="filled"
                color="primary"
                fullWidth
                loading={isJoiningSelected}
                onPress={() => joinMutation.mutate({ communityId: selected.id })}
              >
                Join {selected.name}
              </Button>
            )}
          </View>
        </Stack>
      ) : null}
    </DashboardWidget>
  )
}
