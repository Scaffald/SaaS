/**
 * CommentThread - Threaded comments component
 */

import { Stack, Row, Box, Text } from '@scaffald/ui'
import { colors, spacing, borderRadius } from '@scaffald/ui/tokens'
import type { StackProps } from '@scaffald/ui'
import { Send, MoreHorizontal, Reply, Heart } from 'lucide-react-native'
import { useState } from 'react'
import { Pressable, TextInput } from 'react-native'

export interface Comment {
  id: string
  author: string
  authorAvatar?: string
  content: string
  createdAt: string
  edited?: boolean
  likes?: number
  liked?: boolean
  replies?: Comment[]
}

export interface CommentThreadProps extends Omit<StackProps, 'children'> {
  comments: Comment[]
  title?: string
  placeholder?: string
  currentUser?: string
  onSubmit?: (content: string, parentId?: string) => void
  onLike?: (commentId: string) => void
  showInput?: boolean
  maxNestingLevel?: number
}

function formatTimeAgo(dateString: string): string {
  const date = new Date(dateString)
  const now = new Date()
  const diffMs = now.getTime() - date.getTime()
  const diffMins = Math.floor(diffMs / 60000)
  const diffHours = Math.floor(diffMs / 3600000)
  const diffDays = Math.floor(diffMs / 86400000)

  if (diffMins < 1) return 'Just now'
  if (diffMins < 60) return `${diffMins}m ago`
  if (diffHours < 24) return `${diffHours}h ago`
  if (diffDays < 7) return `${diffDays}d ago`
  return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
}

function getInitials(name: string): string {
  return name
    .split(' ')
    .map((n) => n[0])
    .join('')
    .toUpperCase()
    .slice(0, 2)
}

function countComments(comments: Comment[]): number {
  return comments.reduce((count, comment) => {
    return count + 1 + (comment.replies ? countComments(comment.replies) : 0)
  }, 0)
}

function CommentItem({
  comment,
  nestingLevel = 0,
  maxNestingLevel = 3,
  onLike,
  onReply,
}: {
  comment: Comment
  nestingLevel?: number
  maxNestingLevel?: number
  onLike?: (commentId: string) => void
  onReply?: (commentId: string) => void
}) {
  return (
    <Stack gap={spacing[8]}>
      <Row gap={spacing[12]} align="flex-start">
        <Box
          style={{
            width: 36,
            height: 36,
            borderRadius: borderRadius.max,
            backgroundColor: colors.gray[200],
            alignItems: 'center',
            justifyContent: 'center',
            overflow: 'hidden',
          }}
        >
          <Text size="md" weight="semibold" style={{ color: colors.gray[700] }}>
            {comment.authorAvatar ? '' : getInitials(comment.author)}
          </Text>
        </Box>

        <Stack flex={1} gap={spacing[4]}>
          <Row align="center" gap={spacing[8]}>
            <Text size="md" weight="semibold" style={{ color: colors.gray[800] }}>
              {comment.author}
            </Text>
            <Text size="sm" style={{ color: colors.gray[500] }}>
              {formatTimeAgo(comment.createdAt)}
            </Text>
            {comment.edited && (
              <Text size="xs" style={{ color: colors.gray[400], fontStyle: 'italic' }}>
                (edited)
              </Text>
            )}
          </Row>

          <Text size="md" style={{ color: colors.gray[700], lineHeight: 22 }}>
            {comment.content}
          </Text>

          <Row gap={spacing[12]} style={{ marginTop: spacing[4] }}>
            <Pressable onPress={() => onLike?.(comment.id)}>
              <Row align="center" gap={spacing[4]}>
                <Heart
                  size={14}
                  color={comment.liked ? colors.error[600] : colors.gray[500]}
                  fill={comment.liked ? colors.error[600] : 'transparent'}
                />
                <Text
                  size="sm"
                  style={{ color: comment.liked ? colors.error[600] : colors.gray[500] }}
                >
                  {comment.likes || 0} {comment.likes === 1 ? 'like' : 'likes'}
                </Text>
              </Row>
            </Pressable>
            {nestingLevel < maxNestingLevel && (
              <Pressable onPress={() => onReply?.(comment.id)}>
                <Row align="center" gap={spacing[4]}>
                  <Reply size={14} color={colors.gray[500]} />
                  <Text size="sm" style={{ color: colors.gray[500] }}>
                    Reply
                  </Text>
                </Row>
              </Pressable>
            )}
            <Pressable>
              <MoreHorizontal size={14} color={colors.gray[500]} />
            </Pressable>
          </Row>
        </Stack>
      </Row>

      {comment.replies && comment.replies.length > 0 && (
        <Stack
          gap={spacing[12]}
          style={{
            marginLeft: spacing[24],
            paddingLeft: spacing[12],
            borderLeftWidth: 2,
            borderLeftColor: colors.border?.default ?? colors.gray[200],
          }}
        >
          {comment.replies.map((reply) => (
            <CommentItem
              key={reply.id}
              comment={reply}
              nestingLevel={nestingLevel + 1}
              maxNestingLevel={maxNestingLevel}
              onLike={onLike}
              onReply={onReply}
            />
          ))}
        </Stack>
      )}
    </Stack>
  )
}

export function CommentThread({
  comments,
  title = 'Comments',
  placeholder = 'Write a comment...',
  currentUser = 'You',
  onSubmit,
  onLike,
  showInput = true,
  maxNestingLevel = 3,
  ...props
}: CommentThreadProps) {
  const [newComment, setNewComment] = useState('')
  const [replyingTo, setReplyingTo] = useState<string | null>(null)

  const totalComments = countComments(comments)

  const handleSubmit = () => {
    if (newComment.trim()) {
      onSubmit?.(newComment.trim(), replyingTo ?? undefined)
      setNewComment('')
      setReplyingTo(null)
    }
  }

  const handleReply = (commentId: string) => {
    setReplyingTo(commentId)
  }

  return (
    <Stack
      style={{
        backgroundColor: colors.bg?.primary ?? colors.gray[50],
        borderRadius: borderRadius.l,
        borderWidth: 1,
        borderColor: colors.border?.default ?? colors.gray[200],
        overflow: 'hidden',
      }}
      {...props}
    >
      <Row
        align="center"
        justify="space-between"
        style={{
          padding: spacing[12],
          backgroundColor: colors.gray[100],
          borderBottomWidth: 1,
          borderBottomColor: colors.border?.default ?? colors.gray[200],
        }}
      >
        <Text size="lg" weight="semibold" style={{ color: colors.gray[800] }}>
          {title}
        </Text>
        <Box
          style={{
            backgroundColor: colors.gray[200],
            paddingHorizontal: spacing[8],
            paddingVertical: spacing[4],
            borderRadius: borderRadius.max,
          }}
        >
          <Text size="sm" style={{ color: colors.gray[500] }}>
            {totalComments}
          </Text>
        </Box>
      </Row>

      {comments.length === 0 ? (
        <Stack align="center" gap={spacing[8]} style={{ padding: spacing[24] }}>
          <Text size="md" style={{ color: colors.gray[500] }}>
            No comments yet. Be the first to comment!
          </Text>
        </Stack>
      ) : (
        <Stack gap={spacing[12]} style={{ padding: spacing[12] }}>
          {comments.map((comment) => (
            <CommentItem
              key={comment.id}
              comment={comment}
              maxNestingLevel={maxNestingLevel}
              onLike={onLike}
              onReply={handleReply}
            />
          ))}
        </Stack>
      )}

      {showInput && (
        <Row
          align="flex-start"
          gap={spacing[12]}
          style={{
            padding: spacing[12],
            borderTopWidth: 1,
            borderTopColor: colors.border?.default ?? colors.gray[200],
          }}
        >
          <Box
            style={{
              width: 36,
              height: 36,
              borderRadius: borderRadius.max,
              backgroundColor: colors.gray[200],
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <Text size="md" weight="semibold" style={{ color: colors.gray[700] }}>
              {getInitials(currentUser)}
            </Text>
          </Box>
          <Stack flex={1} gap={spacing[8]}>
            {replyingTo && (
              <Row align="center" gap={spacing[8]}>
                <Reply size={12} color={colors.gray[500]} />
                <Text size="sm" style={{ color: colors.gray[500] }}>
                  Replying to comment
                </Text>
                <Pressable onPress={() => setReplyingTo(null)}>
                  <Text size="sm" style={{ color: colors.info[600] }}>
                    Cancel
                  </Text>
                </Pressable>
              </Row>
            )}
            <TextInput
              placeholder={placeholder}
              value={newComment}
              onChangeText={setNewComment}
              multiline
              style={{
                backgroundColor: colors.gray[100],
                borderWidth: 1,
                borderColor: colors.border?.default ?? colors.gray[200],
                borderRadius: borderRadius.m,
                padding: spacing[12],
                fontSize: 14,
                minHeight: 80,
                color: colors.gray[800],
              }}
            />
          </Stack>
          <Pressable
            onPress={handleSubmit}
            disabled={!newComment.trim()}
            style={{
              width: 36,
              height: 36,
              borderRadius: borderRadius.max,
              backgroundColor: colors.info[600],
              alignItems: 'center',
              justifyContent: 'center',
              opacity: !newComment.trim() ? 0.5 : 1,
            }}
          >
            <Send size={16} color="white" />
          </Pressable>
        </Row>
      )}
    </Stack>
  )
}
