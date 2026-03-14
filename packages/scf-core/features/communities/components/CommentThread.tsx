import { Text, Stack, Row, Avatar, useThemeContext } from '@scaffald/ui'
import { colors } from '@scaffald/ui/tokens'
import { UpvoteButton } from './UpvoteButton'
import type { CommunityComment } from '@scaffald/sdk/resources/community-comments'

interface Props {
  comments: CommunityComment[]
  postId: string
  depth?: number
}

export function CommentThread({ comments }: Props) {
  const { theme } = useThemeContext()
  const t = theme === 'dark' ? 'dark' : 'light'
  // Group comments by parent
  const topLevel = comments.filter((c) => !c.parent_comment_id)
  const childrenMap = new Map<string, CommunityComment[]>()
  for (const c of comments) {
    if (c.parent_comment_id) {
      const existing = childrenMap.get(c.parent_comment_id) || []
      existing.push(c)
      childrenMap.set(c.parent_comment_id, existing)
    }
  }

  const renderComment = (comment: CommunityComment, level: number) => (
    <Stack
      key={comment.id}
      gap={8}
      style={{
        paddingLeft: level * 24,
        paddingVertical: 8,
        borderBottomWidth: 1,
        borderBottomColor: '#f0f0f0',
      }}
    >
      <Row align="center" gap={8}>
        <Avatar
          src={comment.author?.avatar_url ?? undefined}
          initials={comment.author?.display_name?.[0] || '?'}
          size={24}
        />
        <Text style={{ fontWeight: '600', fontSize: 14 }}>
          {comment.author?.display_name || 'Anonymous'}
        </Text>
        {comment.is_pinned && (
          <Stack
            style={{
              paddingHorizontal: 6,
              paddingVertical: 1,
              borderRadius: 4,
              backgroundColor: '#dbeafe',
            }}
          >
            <Text style={{ fontSize: 11, fontWeight: '500' }}>Pinned</Text>
          </Stack>
        )}
        <Text style={{ fontSize: 12, color: colors.text[t].secondary }}>
          {new Date(comment.created_at).toLocaleDateString()}
        </Text>
      </Row>

      <Text>{comment.body}</Text>

      <Row align="center" gap={12}>
        <UpvoteButton
          targetType="comment"
          targetId={comment.id}
          count={comment.upvote_count}
          hasUpvoted={comment.has_upvoted ?? false}
        />
      </Row>

      {/* Render children (max 2 levels deep in UI) */}
      {level < 2 && childrenMap.has(comment.id) && (
        <Stack>
          {childrenMap.get(comment.id)?.map((child) => renderComment(child, level + 1))}
        </Stack>
      )}
    </Stack>
  )

  return <Stack>{topLevel.map((comment) => renderComment(comment, 0))}</Stack>
}
