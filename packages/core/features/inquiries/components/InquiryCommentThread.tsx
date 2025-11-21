import { api } from '@app/core/utils/api'
import { useUser } from '@app/core/utils/useUser'
import type { InquirySectionName } from '@app/schemas'
import { Button, Input, Text, XStack, YStack } from '@app/ui'
import { MessageSquare, Send } from '@tamagui/lucide-icons'
import { useToastController } from '@tamagui/toast'
import { useMemo, useState } from 'react'
import { Avatar } from 'tamagui'

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
  const toast = useToastController()
  const { user: currentUser } = useUser()
  const [newComment, setNewComment] = useState('')

  const addCommentMutation = api.inquiries.addComment.useMutation({
    onSuccess: () => {
      setNewComment('')
      toast.show('Comment added', {
        message: 'Your comment has been added to this section.',
      })
    },
    onError: (error: { message?: string }) => {
      toast.show('Failed to add comment', {
        message: error.message ?? 'Please try again.',
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
    <YStack gap="$3">
      {/* Comments List */}
      {comments.length > 0 && (
        <YStack gap="$3">
          {comments.map((comment) => {
            const isUnread =
              currentUser &&
              comment.sender_id !== currentUser.id &&
              !comment.read_by?.includes(currentUser.id)
            const isFromCurrentUser = currentUser && comment.sender_id === currentUser.id

            return (
              <XStack
                key={comment.id}
                gap="$3"
                p="$3"
                bg={isUnread ? '$blue2' : '$color2'}
                rounded="$3"
                borderWidth={1}
                borderColor={isUnread ? '$blue9' : '$borderColor'}
              >
                <Avatar circular size="$3">
                  <Avatar.Fallback bg="$blue9">
                    <Text color="white" fontSize="$2">
                      {comment.sender_id.charAt(0).toUpperCase()}
                    </Text>
                  </Avatar.Fallback>
                </Avatar>
                <YStack flex={1} gap="$1">
                  <XStack justify="space-between" items="center">
                    <Text fontSize="$2" fontWeight="600" color="$color11">
                      {isFromCurrentUser ? 'You' : 'Organization'}
                    </Text>
                    <Text fontSize="$1" color="$color10">
                      {formatTimestamp(comment.created_at)}
                    </Text>
                  </XStack>
                  <Text fontSize="$3" color="$color12">
                    {comment.content}
                  </Text>
                  {isUnread && (
                    <Button
                      size="$2"
                      variant="outlined"
                      onPress={() => handleMarkRead(comment.id)}
                      mt="$1"
                    >
                      Mark as read
                    </Button>
                  )}
                </YStack>
              </XStack>
            )
          })}
        </YStack>
      )}

      {/* Unread Indicator */}
      {unreadComments.length > 0 && (
        <XStack items="center" gap="$2" p="$2" bg="$blue2" rounded="$3">
          <MessageSquare size={16} color="$blue10" />
          <Text fontSize="$2" color="$blue11" fontWeight="600">
            {unreadComments.length} new comment{unreadComments.length > 1 ? 's' : ''}
          </Text>
        </XStack>
      )}

      {/* Add Comment Input */}
      <YStack gap="$2">
        <XStack gap="$2" items="flex-end">
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
            disabled={!newComment.trim() || addCommentMutation.isLoading}
            theme="blue"
          >
            {addCommentMutation.isLoading ? 'Sending...' : 'Send'}
          </Button>
        </XStack>
      </YStack>
    </YStack>
  )
}
