import { useState } from 'react'
import { Image, Pressable } from 'react-native'
import { Text, Stack, Row, H4, Spinner, DashboardWidget } from '@scaffald/ui'
import { useUserPortfolio } from '@scf/core/utils/communities-sdk-hooks'
import { StarRating } from './StarRating'
import type { CommunityPost } from '@scaffald/sdk/resources/community-posts'

interface Props {
  userId: string
  variant?: 'compact' | 'full'
  onPostPress?: (post: CommunityPost) => void
}

/**
 * PublishedPostsGallery — "Polaroid" gallery for published community posts.
 * Used on both private and public profile pages to display a user's
 * showcase/critique portfolio of published work.
 */
export function PublishedPostsGallery({ userId, variant = 'full', onPostPress }: Props) {
  const { data, isLoading, hasNextPage, fetchNextPage, isFetchingNextPage } = useUserPortfolio(
    userId,
    { limit: 12 }
  )

  const posts = data?.pages.flatMap((p) => p.data) ?? []

  if (isLoading) {
    return (
      <DashboardWidget>
        <Stack gap={16} align="center" style={{ paddingVertical: 32 }}>
          <Spinner size="lg" />
          <Text color="$gray11">Loading portfolio...</Text>
        </Stack>
      </DashboardWidget>
    )
  }

  if (posts.length === 0) {
    return null
  }

  return (
    <DashboardWidget>
      <Stack gap={16}>
        <Row align="center" justify="space-between">
          <H4>Community Portfolio</H4>
          <Text color="$gray11" style={{ fontSize: 13 }}>
            {posts.length} published
          </Text>
        </Row>

        {/* Polaroid Grid */}
        <Row gap={12} style={{ flexWrap: 'wrap' }}>
          {posts.map((post) => (
            <PolaroidCard
              key={post.id}
              post={post}
              compact={variant === 'compact'}
              onPress={() => onPostPress?.(post)}
            />
          ))}
        </Row>

        {hasNextPage && (
          <Pressable onPress={() => fetchNextPage()} disabled={isFetchingNextPage}>
            <Stack align="center" style={{ paddingVertical: 12 }}>
              {isFetchingNextPage ? (
                <Spinner size="sm" />
              ) : (
                <Text color="$gray11" style={{ fontSize: 13 }}>
                  Load more
                </Text>
              )}
            </Stack>
          </Pressable>
        )}
      </Stack>
    </DashboardWidget>
  )
}

function PolaroidCard({
  post,
  compact,
  onPress,
}: {
  post: CommunityPost
  compact: boolean
  onPress?: () => void
}) {
  const [imgError, setImgError] = useState(false)
  const thumbnail = post.media_thumbnails?.[0] || post.media_urls?.[0]
  const imageHeight = compact ? 140 : 200

  return (
    <Pressable
      onPress={onPress}
      style={{
        width: compact ? '48%' : '31%',
        minWidth: compact ? 150 : 200,
        marginBottom: 4,
      }}
    >
      <Stack
        style={{
          backgroundColor: '#fff',
          borderRadius: 4,
          padding: 8,
          paddingBottom: 12,
          // Polaroid shadow
          shadowColor: '#000',
          shadowOffset: { width: 0, height: 2 },
          shadowOpacity: 0.1,
          shadowRadius: 4,
          elevation: 3,
        }}
      >
        {/* Image area */}
        <Stack
          style={{
            height: imageHeight,
            borderRadius: 2,
            overflow: 'hidden',
            backgroundColor: '#f5f5f5',
            marginBottom: 8,
          }}
        >
          {thumbnail && !imgError ? (
            <Image
              source={{ uri: thumbnail }}
              style={{ width: '100%', height: '100%' }}
              resizeMode="cover"
              onError={() => setImgError(true)}
            />
          ) : (
            <Stack align="center" justify="center" style={{ flex: 1 }}>
              <Text color="$gray11" style={{ fontSize: 12 }}>
                {post.post_type === 'showcase' ? 'Showcase' : 'Critique'}
              </Text>
            </Stack>
          )}
        </Stack>

        {/* Caption area (bottom of polaroid) */}
        <Stack gap={4}>
          <Text numberOfLines={1} style={{ fontWeight: '600', fontSize: 13 }}>
            {post.title}
          </Text>

          <Row align="center" gap={6} style={{ flexWrap: 'wrap' }}>
            <Stack
              style={{
                paddingHorizontal: 6,
                paddingVertical: 1,
                borderRadius: 4,
                backgroundColor: post.post_type === 'showcase' ? '#dbeafe' : '#fef3c7',
              }}
            >
              <Text style={{ fontSize: 10, fontWeight: '500' }}>{post.post_type}</Text>
            </Stack>

            {post.rating_count > 0 && (
              <Row align="center" gap={2}>
                <StarRating value={post.rating_avg ?? 0} readonly size={12} />
                <Text color="$gray11" style={{ fontSize: 11 }}>
                  ({post.rating_count})
                </Text>
              </Row>
            )}
          </Row>

          {!compact && post.ai_feedback_summary && (
            <Text color="$gray11" numberOfLines={2} style={{ fontSize: 11 }}>
              {post.ai_feedback_summary}
            </Text>
          )}
        </Stack>
      </Stack>
    </Pressable>
  )
}
