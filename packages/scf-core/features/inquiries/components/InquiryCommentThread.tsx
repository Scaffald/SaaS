import { api } from '@scf/core/utils/api'
import { useUser } from '@scf/core/utils/useUser'
import type { InquirySectionName } from '@scf/schemas'
import { Button, Input, Text, Row, Stack } from '@unicornlove/beyond-ui'
import { MessageSquare, Send } from 'lucide-react-native'
import { useToast } from '@unicornlove/beyond-ui'
import { useMemo, useState } from 'react'
import { Avatar } from '@unicornlove/beyond-ui'

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

  const addCommentMutation = api.inquiries.addComment.useMutation({
    onSuccess: () => {
      setNewComment('')
      toast.show({
          title: 'Comment added',
          message: 'Your comment has been added to this section.',
        })
    },
    onError: (error: { message?: string }) => {
      toast.show({
          title: 'Failed to add comment',
          message: error.message ?? 'Please try again.',
          variant: 'error',
        })
    },
  })

  const markReadMutation = api.inquiries.markCommentRead.useMutation({
    onError: (error: { message?: string }) => {
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
      await markReadMutation.mutateAsync({ commentId })
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
    <Stack gap="$3">
      {/* Comments List */}
      {comments.length > 0 && (
        <Stack gap="$3">
          {comments.map((comment) => {
            const isUnread =
              currentUser &&
              comment.sender_id !== currentUser.id &&
              !comment.read_by?.includes(currentUser.id)
            const isFromCurrentUser = currentUser && comment.sender_id === currentUser.id

            return (
              <Row
                key={comment.id}
                gap="$3"
                padding="$3"
                backgroundColor={isUnread ? '$blue2' : '$color2'}
                borderRadius="$3"
                borderWidth={1}
                borderColor={isUnread ? '$blue9' : '$borderColor'}
              >
                <Avatar circular size="$3">
                  <Avatar.Fallback backgroundColor="$blue9">
                    <Text color="white" fontSize="$2">
                      {comment.sender_id.charAt(0).toUpperCase()}
                    </Text>
                  </Avatar.Fallback>
                </Avatar>
                <Stack flex={1} gap="$1">
                  <Row justifyContent="space-between" alignItems="center">
                    <Text fontSize="$2" fontWeight="600" color="$color11">
                      {isFromCurrentUser ? 'You' : 'Organization'}
                    </Text>
                    <Text fontSize="$1" color="$color10">
                      {formatTimestamp(comment.created_at)}
                    </Text>
                  </Row>
                  <Text fontSize="$3" color="$color12">
                    {comment.content}
                  </Text>
                  {isUnread && (
                    <Button
                      size="$2"
                      variant="outlined"
                      onPress={() => handleMarkRead(comment.id)}
                      marginTop="$1"
                    >
                      Mark as read
                    </Button>
                  )}
                </Stack>
              </Row>
            )
          })}
        </Stack>
      )}

      {/* Unread Indicator */}
      {unreadComments.length > 0 && (
        <Row
          alignItems="center"
          gap="$2"
          padding="$2"
          backgroundColor="$blue2"
          borderRadius="$3"
        >
          <MessageSquare size={16} color="$blue10" />
          <Text fontSize="$2" color="$blue11" fontWeight="600">
            {unreadComments.length} new comment{unreadComments.length > 1 ? 's' : ''}
          </Text>
        </Row>
      )}

      {/* Add Comment Input */}
      <Stack gap="$2">
        <Row gap="$2" alignItems="flex-end">
          <Input
            flex={1}
            placeholder="Add a comment..."
            value={newComment}
            onChangeText={setNewComment}
            multiline
            height={60}
            maxLength={2000}
          />
          <Button
            icon={Send}
            onPress={handleAddComment}
            disabled={!newComment.trim() || addCommentMutation.isPending}
            theme="blue"
          >
            {addCommentMutation.isPending ? 'Sending...' : 'Send'}
          </Button>
        </Row>
      </Stack>
    </Stack>
  )
}
