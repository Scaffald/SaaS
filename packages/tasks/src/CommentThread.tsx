/**
 * CommentThread - Threaded comments component
 */

import { styled, YStack, XStack, Text, View, type YStackProps, TextArea } from 'tamagui'
import { Send, MoreHorizontal, Reply, Heart } from '@tamagui/lucide-icons'
import { useState } from 'react'

export interface Comment {
  id: string
  /** Author name */
  author: string
  /** Author avatar URL */
  authorAvatar?: string
  /** Comment content */
  content: string
  /** Creation timestamp */
  createdAt: string
  /** Whether the comment is edited */
  edited?: boolean
  /** Number of likes */
  likes?: number
  /** Whether current user liked this comment */
  liked?: boolean
  /** Nested replies */
  replies?: Comment[]
}

export interface CommentThreadProps extends Omit<YStackProps, 'children'> {
  /** Array of comments */
  comments: Comment[]
  /** Title for the thread */
  title?: string
  /** Placeholder for new comment input */
  placeholder?: string
  /** Current user name */
  currentUser?: string
  /** Callback when a new comment is submitted */
  onSubmit?: (content: string, parentId?: string) => void
  /** Callback when a comment is liked */
  onLike?: (commentId: string) => void
  /** Whether to show the input field */
  showInput?: boolean
  /** Maximum nesting level for replies */
  maxNestingLevel?: number
}

const ThreadContainer = styled(YStack, {
  name: 'CommentThread',
  backgroundColor: '$background',
  borderRadius: '$lg',
  borderWidth: 1,
  borderColor: '$borderColor',
  overflow: 'hidden',
})

const ThreadHeader = styled(XStack, {
  name: 'CommentThreadHeader',
  padding: '$3',
  backgroundColor: '$color2',
  borderBottomWidth: 1,
  borderBottomColor: '$borderColor',
  alignItems: 'center',
  justifyContent: 'space-between',
})

const ThreadTitle = styled(Text, {
  name: 'CommentThreadTitle',
  fontSize: '$4',
  fontWeight: '600',
  color: '$color12',
})

const CommentCount = styled(Text, {
  name: 'CommentCount',
  fontSize: '$2',
  color: '$color9',
  backgroundColor: '$color4',
  paddingHorizontal: '$2',
  paddingVertical: '$1',
  borderRadius: '$full',
})

const CommentsList = styled(YStack, {
  name: 'CommentsList',
  padding: '$3',
  gap: '$3',
})

const CommentContainer = styled(YStack, {
  name: 'CommentContainer',
  gap: '$2',
})

const CommentRow = styled(XStack, {
  name: 'CommentRow',
  gap: '$3',
  alignItems: 'flex-start',
})

const Avatar = styled(View, {
  name: 'CommentAvatar',
  width: 36,
  height: 36,
  borderRadius: '$full',
  backgroundColor: '$color4',
  alignItems: 'center',
  justifyContent: 'center',
  overflow: 'hidden',
})

const AvatarImage = styled(View, {
  name: 'CommentAvatarImage',
  width: '100%',
  height: '100%',
})

const AvatarFallback = styled(Text, {
  name: 'CommentAvatarFallback',
  fontSize: '$3',
  fontWeight: '600',
  color: '$color11',
})

const CommentContent = styled(YStack, {
  name: 'CommentContent',
  flex: 1,
  gap: '$1',
})

const CommentHeader = styled(XStack, {
  name: 'CommentHeader',
  alignItems: 'center',
  gap: '$2',
})

const AuthorName = styled(Text, {
  name: 'CommentAuthorName',
  fontSize: '$3',
  fontWeight: '600',
  color: '$color12',
})

const CommentTime = styled(Text, {
  name: 'CommentTime',
  fontSize: '$2',
  color: '$color9',
})

const EditedBadge = styled(Text, {
  name: 'CommentEditedBadge',
  fontSize: '$1',
  color: '$color8',
  fontStyle: 'italic',
})

const CommentText = styled(Text, {
  name: 'CommentText',
  fontSize: '$3',
  color: '$color11',
  lineHeight: 22,
})

const CommentActions = styled(XStack, {
  name: 'CommentActions',
  gap: '$3',
  marginTop: '$1',
})

const ActionButton = styled(XStack, {
  name: 'CommentActionButton',
  alignItems: 'center',
  gap: '$1',
  cursor: 'pointer',

  hoverStyle: {
    opacity: 0.7,
  },
})

const ActionText = styled(Text, {
  name: 'CommentActionText',
  fontSize: '$2',
  color: '$color9',
})

const LikeText = styled(Text, {
  name: 'CommentLikeText',
  fontSize: '$2',

  variants: {
    liked: {
      true: {
        color: '$red10',
      },
      false: {
        color: '$color9',
      },
    },
  } as const,
})

const RepliesContainer = styled(YStack, {
  name: 'CommentRepliesContainer',
  marginLeft: '$6',
  paddingLeft: '$3',
  borderLeftWidth: 2,
  borderLeftColor: '$borderColor',
  gap: '$3',
})

const InputContainer = styled(XStack, {
  name: 'CommentInputContainer',
  padding: '$3',
  borderTopWidth: 1,
  borderTopColor: '$borderColor',
  gap: '$3',
  alignItems: 'flex-start',
})

const InputWrapper = styled(YStack, {
  name: 'CommentInputWrapper',
  flex: 1,
  gap: '$2',
})

const StyledTextArea = styled(TextArea, {
  name: 'CommentTextArea',
  backgroundColor: '$color2',
  borderWidth: 1,
  borderColor: '$borderColor',
  borderRadius: '$md',
  padding: '$3',
  fontSize: '$3',
  minHeight: 80,

  focusStyle: {
    borderColor: '$blue7',
  },
})

const SubmitButton = styled(XStack, {
  name: 'CommentSubmitButton',
  width: 36,
  height: 36,
  borderRadius: '$full',
  backgroundColor: '$blue7',
  alignItems: 'center',
  justifyContent: 'center',
  cursor: 'pointer',

  variants: {
    disabled: {
      true: {
        opacity: 0.5,
        cursor: 'not-allowed',
      },
    },
  } as const,

  hoverStyle: {
    backgroundColor: '$blue8',
  },

  pressStyle: {
    scale: 0.95,
    backgroundColor: '$blue9',
  },
})

const EmptyState = styled(YStack, {
  name: 'CommentEmptyState',
  padding: '$6',
  alignItems: 'center',
  gap: '$2',
})

const EmptyText = styled(Text, {
  name: 'CommentEmptyText',
  fontSize: '$3',
  color: '$color9',
})

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
    <CommentContainer>
      <CommentRow>
        <Avatar>
          {comment.authorAvatar ? (
            <AvatarImage />
          ) : (
            <AvatarFallback>{getInitials(comment.author)}</AvatarFallback>
          )}
        </Avatar>

        <CommentContent>
          <CommentHeader>
            <AuthorName>{comment.author}</AuthorName>
            <CommentTime>{formatTimeAgo(comment.createdAt)}</CommentTime>
            {comment.edited && <EditedBadge>(edited)</EditedBadge>}
          </CommentHeader>

          <CommentText>{comment.content}</CommentText>

          <CommentActions>
            <ActionButton onPress={() => onLike?.(comment.id)}>
              <Heart
                size={14}
                color={comment.liked ? '$red10' : '$color9'}
                fill={comment.liked ? '$red10' : 'transparent'}
              />
              <LikeText liked={comment.liked}>
                {comment.likes || 0} {comment.likes === 1 ? 'like' : 'likes'}
              </LikeText>
            </ActionButton>
            {nestingLevel < maxNestingLevel && (
              <ActionButton onPress={() => onReply?.(comment.id)}>
                <Reply size={14} color="$color9" />
                <ActionText>Reply</ActionText>
              </ActionButton>
            )}
            <ActionButton>
              <MoreHorizontal size={14} color="$color9" />
            </ActionButton>
          </CommentActions>
        </CommentContent>
      </CommentRow>

      {comment.replies && comment.replies.length > 0 && (
        <RepliesContainer>
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
        </RepliesContainer>
      )}
    </CommentContainer>
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
    <ThreadContainer {...props}>
      <ThreadHeader>
        <ThreadTitle>{title}</ThreadTitle>
        <CommentCount>{totalComments}</CommentCount>
      </ThreadHeader>

      {comments.length === 0 ? (
        <EmptyState>
          <EmptyText>No comments yet. Be the first to comment!</EmptyText>
        </EmptyState>
      ) : (
        <CommentsList>
          {comments.map((comment) => (
            <CommentItem
              key={comment.id}
              comment={comment}
              maxNestingLevel={maxNestingLevel}
              onLike={onLike}
              onReply={handleReply}
            />
          ))}
        </CommentsList>
      )}

      {showInput && (
        <InputContainer>
          <Avatar>
            <AvatarFallback>{getInitials(currentUser)}</AvatarFallback>
          </Avatar>
          <InputWrapper>
            {replyingTo && (
              <XStack alignItems="center" gap="$2">
                <Reply size={12} color="$color9" />
                <Text fontSize="$2" color="$color9">
                  Replying to comment
                </Text>
                <ActionButton onPress={() => setReplyingTo(null)}>
                  <Text fontSize="$2" color="$blue10">
                    Cancel
                  </Text>
                </ActionButton>
              </XStack>
            )}
            <StyledTextArea
              placeholder={placeholder}
              value={newComment}
              onChangeText={setNewComment}
            />
          </InputWrapper>
          <SubmitButton disabled={!newComment.trim()} onPress={handleSubmit}>
            <Send size={16} color="white" />
          </SubmitButton>
        </InputContainer>
      )}
    </ThreadContainer>
  )
}
