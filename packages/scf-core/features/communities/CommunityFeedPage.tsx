import { useCallback, useMemo } from 'react'
import { FlatList } from 'react-native'
import { Text, Stack, Row, Button, Spinner, Separator } from '@scaffald/ui'
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
        <Spinner size="lg" />
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
        <Row align="center" justify="space-between">
          <Stack gap={2}>
            <Text style={{ fontSize: 24, fontWeight: '700' }}>{community.name}</Text>
            <Text color="$gray11">{community.description}</Text>
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
          <Text color="$gray11">{community.member_count} members</Text>
          <Text color="$gray11">{community.post_count} posts</Text>
          {community.is_verified && <Text color="$green11">Verified</Text>}
        </Row>
      </Stack>

      <Separator />

      {/* Feed */}
      {isFeedLoading ? (
        <Stack align="center" style={{ paddingVertical: 40 }}>
          <Spinner />
        </Stack>
      ) : posts.length === 0 ? (
        <Stack gap={12} align="center" justify="center" style={{ minHeight: 200, padding: 24 }}>
          <Text color="$gray11">No posts yet</Text>
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
        <FlatList
          data={posts}
          keyExtractor={(item) => item.id}
          renderItem={({ item }) => (
            <PostCard
              post={item}
              onPress={() => router.push(RouteBuilder.communityPostDetail(slug, item.id) as Href)}
            />
          )}
          ItemSeparatorComponent={() => <Stack style={{ height: 12 }} />}
          onEndReached={handleLoadMore}
          onEndReachedThreshold={0.5}
          ListFooterComponent={
            isFetchingNextPage ? (
              <Stack align="center" style={{ paddingVertical: 16 }}>
                <Spinner size="sm" />
              </Stack>
            ) : null
          }
        />
      )}
    </Stack>
  )
}
