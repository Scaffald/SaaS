import {
  useAddInquiryCommentMutation,
  useMarkCommentReadMutation,
} from '@scf/core/utils/inquiries-sdk-hooks'
import { useUser } from '@scf/core/utils/useUser'
import type { InquirySectionName } from '@scf/schemas'
import { Button, Input, Text, Row, Stack } from '@scaffald/ui'
import { MessageSquare, Send } from 'lucide-react-native'
import { useToast } from '@scaffald/ui'
import { useMemo, useState } from 'react'
import { Avatar } from '@scaffald/ui'

interface InquiryCommentThreadProps {
  inquiryId: string
  sectionName: InquirySectionName
  comments: Array<{
    id: string
    sender_id: string
    content: string
    read_by: string[]
    created_at: string
  }>
}

export function InquiryCommentThread({
  inquiryId,
  sectionName,
  comments,
}: InquiryCommentThreadProps) {
  const toast = useToast()
  const { user: currentUser } = useUser()
  const [newComment, setNewComment] = useState('')

  const addCommentMutation = useAddInquiryCommentMutation({
    onSuccess: () => {
      setNewComment('')
      toast.show({
        title: 'Comment added',
        message: 'Your comment has been added to this section.',
      })
    },
    onError: (error) => {
      toast.show({
        title: 'Failed to add comment',
        message: error.message ?? 'Please try again.',
        variant: 'error',
      })
    },
  })

  const markReadMutation = useMarkCommentReadMutation({
    onError: (error) => {
      console.error('Failed to mark comment as read:', error)
    },
  })

  const handleAddComment = async () => {
    if (!newComment.trim()) return
    try {
      await addCommentMutation.mutateAsync({
        inquiryId,
        sectionName,
        content: newComment.trim(),
      })
    } catch (error) {
      console.error('Failed to add comment:', error)
    }
  }

  const handleMarkRead = async (commentId: string) => {
    try {
      await markReadMutation.mutateAsync(commentId)
    } catch (error) {
      console.error('Failed to mark comment as read:', error)
    }
  }

  // Check for unread comments
  const unreadComments = useMemo(() => {
    if (!currentUser) return []
    return comments.filter(
      (comment) =>
        comment.sender_id !== currentUser.id && !comment.read_by?.includes(currentUser.id)
    )
  }, [comments, currentUser])

  // Format timestamp
  const formatTimestamp = (timestamp: string) => {
    const date = new Date(timestamp)
    const now = new Date()
    const diffMs = now.getTime() - date.getTime()
    const diffMins = Math.floor(diffMs / 60000)
    const diffHours = Math.floor(diffMs / 3600000)
    const diffDays = Math.floor(diffMs / 86400000)

    if (diffMins < 1) return 'Just now'
    if (diffMins < 60) return `${diffMins}m ago`
    if (diffHours < 24) return `${diffHours}h ago`
    if (diffDays < 7) return `${diffDays}d ago`
    return date.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: date.getFullYear() !== now.getFullYear() ? 'numeric' : undefined,
    })
  }

  return (
    <Stack gap={12}>
      {/* Comments List */}
      {comments.length > 0 && (
        <Stack gap={12}>
          {comments.map((comment) => {
            const isUnread =
              currentUser &&
              comment.sender_id !== currentUser.id &&
              !comment.read_by?.includes(currentUser.id)
            const isFromCurrentUser = currentUser && comment.sender_id === currentUser.id

            return (
              <Row
                key={comment.id}
                gap={12}
                padding="sm"
                backgroundColor={isUnread ? '$blue2' : '$color2'}
                borderRadius={12}
                borderWidth={1}
                borderColor={isUnread ? '$blue9' : '$borderColor'}
              >
                <Avatar
                  size={32}
                  initials={comment.sender_id.charAt(0).toUpperCase()}
                />
                <Stack flex={1} gap={4}>
                  <Row justify="space-between" align="center">
                    <Text color="$gray11">{isFromCurrentUser ? 'You' : 'Organization'}</Text>
                    <Text color="$gray11">{formatTimestamp(comment.created_at)}</Text>
                  </Row>
                  <Text color="$gray11">{comment.content}</Text>
                  {isUnread && (
                    <Stack style={{ marginTop: 4 }}>
                      <Button
                        size="sm"
                        variant="outline"
                        onPress={() => handleMarkRead(comment.id)}
                      >
                        Mark as read
                      </Button>
                    </Stack>
                  )}
                </Stack>
              </Row>
            )
          })}
        </Stack>
      )}

      {/* Unread Indicator */}
      {unreadComments.length > 0 && (
        <Row align="center" gap={8} padding="xs" backgroundColor="$blue2" borderRadius={12}>
          <MessageSquare size="md" color="$blue10" />
          <Text color="$blue11">
            {unreadComments.length} new comment{unreadComments.length > 1 ? 's' : ''}
          </Text>
        </Row>
      )}

      {/* Add Comment Input */}
      <Stack gap={8}>
        <Row gap={8} align="flex-end">
          <Input
            placeholder="Add a comment..."
            value={newComment}
            onChangeText={setNewComment}
            multiline
            maxLength={2000}
            style={{ flex: 1, minHeight: 60 }}
          />
          <Button
            iconStart={Send}
            onPress={handleAddComment}
            disabled={!newComment.trim() || addCommentMutation.isPending}
            color="primary"
          >
            {addCommentMutation.isPending ? 'Sending...' : 'Send'}
          </Button>
        </Row>
      </Stack>
    </Stack>
  )
}
