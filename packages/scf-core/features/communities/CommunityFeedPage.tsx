import { useCallback, useMemo } from 'react'
import { Text, Stack, Row, Button, Spinner, Separator, useThemeContext } from '@scaffald/ui'
import { colors } from '@scaffald/ui/tokens'
import { useRouter } from 'expo-router'
import type { Href } from 'expo-router'
import { RouteBuilder } from '@scf/core/constants/routes'
import {
  useCommunity,
  useCommunityFeed,
  useJoinCommunityMutation,
  useLeaveCommunityMutation,
} from '@scf/core/utils/communities-sdk-hooks'
import { useQueryClient } from '@tanstack/react-query'
import { PostCard } from './components/PostCard'

interface Props {
  slug: string
}

export function CommunityFeedPage({ slug }: Props) {
  const { theme } = useThemeContext()
  const t = theme === 'dark' ? 'dark' : 'light'
  const router = useRouter()
  const queryClient = useQueryClient()
  const { data: communityData, isLoading: isCommunityLoading } = useCommunity(slug)
  const community = communityData?.data

  const {
    data: feedData,
    isLoading: isFeedLoading,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
  } = useCommunityFeed(community?.id, { limit: 20 }, { enabled: !!community?.id })

  const posts = useMemo(() => feedData?.pages.flatMap((page) => page.data) ?? [], [feedData])

  const joinMutation = useJoinCommunityMutation({
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['communities'] })
    },
  })

  const leaveMutation = useLeaveCommunityMutation({
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['communities'] })
    },
  })

  const handleLoadMore = useCallback(() => {
    if (hasNextPage && !isFetchingNextPage) {
      fetchNextPage()
    }
  }, [hasNextPage, isFetchingNextPage, fetchNextPage])

  if (isCommunityLoading) {
    return (
      <Stack align="center" justify="center" style={{ minHeight: 200 }}>
        <Spinner variant="ios" size="lg" />
      </Stack>
    )
  }

  if (!community) {
    return (
      <Stack align="center" justify="center" style={{ minHeight: 200 }}>
        <Text>Community not found</Text>
      </Stack>
    )
  }

  return (
    <Stack gap={16}>
      {/* Community Header */}
      <Stack gap={8}>
        <Row align="center" justify="space-between" style={{ flexWrap: 'wrap', gap: 12 }}>
          <Stack gap={2} style={{ flex: 1, minWidth: 200 }}>
            <Text style={{ fontSize: 24, fontWeight: '700' }}>{community.name}</Text>
            <Text style={{ color: colors.text[t].secondary }}>{community.description}</Text>
          </Stack>
          {community.is_member ? (
            <Row gap={8}>
              <Button
                variant="outline"
                size="sm"
                onPress={() => router.push(RouteBuilder.communityPostCreate(slug) as Href)}
              >
                New Post
              </Button>
              <Button
                variant="outline"
                size="sm"
                onPress={() => leaveMutation.mutate(community.id)}
              >
                Leave
              </Button>
            </Row>
          ) : (
            <Button
              variant="filled"
              size="sm"
              onPress={() => joinMutation.mutate({ communityId: community.id })}
            >
              Join Community
            </Button>
          )}
        </Row>
        <Row gap={16}>
          <Text style={{ color: colors.text[t].secondary }}>{community.member_count} members</Text>
          <Text style={{ color: colors.text[t].secondary }}>{community.post_count} posts</Text>
          {community.is_verified && <Text style={{ color: colors.text[t].primary }}>Verified</Text>}
        </Row>
      </Stack>

      <Separator />

      {/* Feed */}
      {isFeedLoading ? (
        <Stack align="center" style={{ paddingVertical: 40 }}>
          <Spinner variant="ios" />
        </Stack>
      ) : posts.length === 0 ? (
        <Stack gap={12} align="center" justify="center" style={{ minHeight: 200, padding: 24 }}>
          <Text style={{ color: colors.text[t].secondary }}>No posts yet</Text>
          {community.is_member && (
            <Button
              variant="filled"
              size="sm"
              onPress={() => router.push(RouteBuilder.communityPostCreate(slug) as Href)}
            >
              Create First Post
            </Button>
          )}
        </Stack>
      ) : (
        <Stack gap={12}>
          {posts.map((item) => (
            <PostCard
              key={item.id}
              post={item}
              onPress={() => router.push(RouteBuilder.communityPostDetail(slug, item.id) as Href)}
            />
          ))}
          {isFetchingNextPage && (
            <Stack align="center" style={{ paddingVertical: 16 }}>
              <Spinner variant="ios" size="sm" />
            </Stack>
          )}
          {hasNextPage && !isFetchingNextPage && (
            <Button variant="outline" size="sm" onPress={handleLoadMore} style={{ alignSelf: 'center' }}>
              Load More
            </Button>
          )}
        </Stack>
      )}
    </Stack>
  )
}
