import { Text, Stack, Row, Avatar } from '@scaffald/ui'
import { Pressable } from 'react-native'
import { StarRating } from './StarRating'
import type { CommunityPost } from '@scaffald/sdk/resources/community-posts'

interface Props {
  post: CommunityPost
  onPress?: () => void
}

export function PostCard({ post, onPress }: Props) {
  return (
    <Pressable onPress={onPress}>
      <Stack
        gap={8}
        style={{
          padding: 16,
          borderRadius: 12,
          borderWidth: 1,
          borderColor: '#e5e5e5',
        }}
      >
        {/* Author row */}
        <Row align="center" gap={8}>
          <Avatar
            src={post.author?.avatar_url ?? undefined}
            initials={post.author?.display_name?.[0] || '?'}
            size={24}
          />
          <Text style={{ fontWeight: '500', fontSize: 14 }}>
            {post.author?.display_name || 'Anonymous'}
          </Text>
          <Stack
            style={{
              paddingHorizontal: 8,
              paddingVertical: 2,
              borderRadius: 4,
              backgroundColor:
                post.post_type === 'showcase'
                  ? '#dbeafe'
                  : post.post_type === 'critique'
                    ? '#fef3c7'
                    : '#f3f4f6',
            }}
          >
            <Text style={{ fontSize: 11, fontWeight: '500' }}>{post.post_type}</Text>
          </Stack>
          <Text color="$gray11" style={{ fontSize: 12, marginLeft: 'auto' }}>
            {new Date(post.created_at).toLocaleDateString()}
          </Text>
        </Row>

        {/* Title */}
        <Text style={{ fontWeight: '600', fontSize: 16 }}>{post.title}</Text>

        {/* Body preview */}
        <Text color="$gray11" numberOfLines={2}>
          {post.body}
        </Text>

        {/* Media thumbnail (Polaroid style) */}
        {post.media_thumbnails && post.media_thumbnails.length > 0 && (
          <Stack
            style={{
              height: 180,
              borderRadius: 8,
              overflow: 'hidden',
              backgroundColor: '#f5f5f5',
            }}
          >
            {/* Image would render here */}
            <Text color="$gray11" style={{ padding: 8, fontSize: 12 }}>
              {post.media_thumbnails.length} media
            </Text>
          </Stack>
        )}

        {/* Stats row */}
        <Row align="center" gap={16}>
          <Text color="$gray11" style={{ fontSize: 13 }}>
            {post.upvote_count} upvotes
          </Text>
          <Text color="$gray11" style={{ fontSize: 13 }}>
            {post.comment_count} comments
          </Text>
          {post.rating_count > 0 && (
            <Row align="center" gap={4}>
              <StarRating value={post.rating_avg ?? 0} readonly size={14} />
              <Text color="$gray11" style={{ fontSize: 13 }}>
                ({post.rating_count})
              </Text>
            </Row>
          )}
          {post.is_published && (
            <Stack
              style={{
                marginLeft: 'auto',
                paddingHorizontal: 8,
                paddingVertical: 2,
                borderRadius: 4,
                backgroundColor: '#dcfce7',
              }}
            >
              <Text style={{ fontSize: 11, fontWeight: '500', color: '#16a34a' }}>Published</Text>
            </Stack>
          )}
        </Row>
      </Stack>
    </Pressable>
  )
}
