import { Text, Stack, Row, Avatar } from '@scaffald/ui'
import { useQueryClient } from '@tanstack/react-query'
import {
  useDeleteCommentMutation,
  usePinCommentMutation,
} from '@scf/core/utils/communities-sdk-hooks'
import { UpvoteButton } from './UpvoteButton'
import type { CommunityComment } from '@scaffald/sdk/resources/community-comments'

interface Props {
  comments: CommunityComment[]
  postId: string
  depth?: number
}

export function CommentThread({ comments, postId, depth = 0 }: Props) {
  const queryClient = useQueryClient()

  const _deleteComment = useDeleteCommentMutation({
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['communities', 'comments', postId] })
    },
  })

  const _pinComment = usePinCommentMutation({
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['communities', 'comments', postId] })
    },
  })

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
        <Text color="$gray11" style={{ fontSize: 12 }}>
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
