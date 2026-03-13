import { useMemo, useCallback } from 'react'
import { FlatList } from 'react-native'
import { Text, Stack, Spinner } from '@scaffald/ui'
import { useRouter } from 'expo-router'
import type { Href } from 'expo-router'
import { useBookmarks } from '@scf/core/utils/communities-sdk-hooks'
import { RouteBuilder } from '@scf/core/constants/routes'
import { PostCard } from './components/PostCard'

export function BookmarksPage() {
  const router = useRouter()
  const { data, isLoading, fetchNextPage, hasNextPage, isFetchingNextPage } = useBookmarks()

  const posts = useMemo(() => data?.pages.flatMap((page) => page.data) ?? [], [data])

  const handleLoadMore = useCallback(() => {
    if (hasNextPage && !isFetchingNextPage) fetchNextPage()
  }, [hasNextPage, isFetchingNextPage, fetchNextPage])

  return (
    <Stack gap={16}>
      <Stack gap={4}>
        <Text style={{ fontSize: 20, fontWeight: '600' }}>Bookmarks</Text>
        <Text color="$gray11">Posts you've saved for later.</Text>
      </Stack>

      {isLoading ? (
        <Stack align="center" style={{ paddingVertical: 40 }}>
          <Spinner />
        </Stack>
      ) : posts.length === 0 ? (
        <Stack align="center" style={{ paddingVertical: 40 }}>
          <Text color="$gray11">No bookmarks yet</Text>
        </Stack>
      ) : (
        <FlatList
          data={posts}
          keyExtractor={(item) => item.id}
          renderItem={({ item }) => (
            <PostCard
              post={item}
              onPress={() =>
                router.push(RouteBuilder.communityPostDetail(item.community_id, item.id) as Href)
              }
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
