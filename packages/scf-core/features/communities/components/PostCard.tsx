import { FeedImage } from '@scf/core/components/FeedImage'
import { Text, Stack, Row, Card, Avatar, useThemeContext } from '@scaffald/ui'
import { colors } from '@scaffald/ui/tokens'
import { Image } from 'react-native'
import { StarRating } from './StarRating'
import type { CommunityPost } from '@scaffald/sdk/resources/community-posts'

interface Props {
  post: CommunityPost
  onPress?: () => void
}

export function PostCard({ post, onPress }: Props) {
  const { theme } = useThemeContext()
  const t = theme === 'dark' ? 'dark' : 'light'

  return (
    <Card pressable onPress={onPress} padding="md" variant="glass" glassMaterial="thin">
      <Stack gap={8}>
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
                  ? (t === 'dark' ? colors.blue[900] : colors.blue[100])
                  : post.post_type === 'critique'
                    ? (t === 'dark' ? colors.amber[900] : colors.amber[100])
                    : colors.bg[t].muted,
            }}
          >
            <Text style={{ fontSize: 11, fontWeight: '500' }}>{post.post_type}</Text>
          </Stack>
          <Text style={{ color: colors.text[t].secondary, fontSize: 12, marginLeft: 'auto' }}>
            {new Date(post.created_at).toLocaleDateString()}
          </Text>
        </Row>

        {/* Title */}
        <Text style={{ fontWeight: '600', fontSize: 16 }}>{post.title}</Text>

        {/* Body preview */}
        <Text numberOfLines={2} style={{ color: colors.text[t].secondary }}>
          {post.body}
        </Text>

        {/* Media thumbnails */}
        {post.media_thumbnails && post.media_thumbnails.length > 0 && (
          <Row gap={8} style={{ flexWrap: 'wrap' }}>
            {post.media_thumbnails.slice(0, 3).map((url, idx) => (
              <Stack
                key={idx}
                style={{
                  flex: post.media_thumbnails.length === 1 ? 1 : undefined,
                  width: post.media_thumbnails.length === 1 ? '100%' : 180,
                  height: 180,
                  borderRadius: 8,
                  overflow: 'hidden',
                  backgroundColor: colors.bg[t].muted,
                }}
              >
                <FeedImage
                  source={{ uri: url }}
                  style={{ width: '100%', height: '100%' }}
                  resizeMode="cover"
                />
              </Stack>
            ))}
            {post.media_thumbnails.length > 3 && (
              <Stack
                align="center"
                justify="center"
                style={{
                  width: 60,
                  height: 180,
                  borderRadius: 8,
                  backgroundColor: colors.bg[t].muted,
                }}
              >
                <Text style={{ fontSize: 14, fontWeight: '600', color: colors.text[t].secondary }}>
                  +{post.media_thumbnails.length - 3}
                </Text>
              </Stack>
            )}
          </Row>
        )}

        {/* Stats row */}
        <Row align="center" gap={16}>
          <Text style={{ color: colors.text[t].secondary, fontSize: 13 }}>
            {post.upvote_count} upvotes
          </Text>
          <Text style={{ color: colors.text[t].secondary, fontSize: 13 }}>
            {post.comment_count} comments
          </Text>
          {post.rating_count > 0 && (
            <Row align="center" gap={4}>
              <StarRating value={post.rating_avg ?? 0} readonly size={14} />
              <Text style={{ color: colors.text[t].secondary, fontSize: 13 }}>
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
                backgroundColor: t === 'dark' ? colors.green[900] : colors.green[100],
              }}
            >
              <Text style={{ fontSize: 11, fontWeight: '500', color: t === 'dark' ? colors.green[300] : colors.green[600] }}>Published</Text>
            </Stack>
          )}
        </Row>
      </Stack>
    </Card>
  )
}
