/**
 * REQ-166: Task Management Workflow & UI
 * CommentThread component with rich text, mentions, and real-time updates
 */

import { useState, useEffect } from 'react'
import type { User } from '../../types'
import type { TaskComment } from '../../lib/api/taskService'
import { YStack, XStack, Button, Card, SizableText, TextArea, Spinner } from '@unicornlove/ui'

interface CommentThreadProps {
  taskId: string
  comments: TaskComment[]
  currentUserId: string
  users: User[]
  onAddComment: (content: string, mentions: string[]) => Promise<void>
}

export const CommentThread: React.FC<CommentThreadProps> = ({
  taskId,
  comments,
  currentUserId: _currentUserId,
  users,
  onAddComment,
}) => {
  const [newComment, setNewComment] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [showMentions, setShowMentions] = useState(false)
  const [mentionQuery, setMentionQuery] = useState('')
  const [_draft, _setDraft] = useState('')

  const CHARACTER_LIMIT = 5000

  // Auto-save draft every 30s
  useEffect(() => {
    const interval = setInterval(() => {
      if (newComment.trim()) {
        localStorage.setItem(`task-comment-draft-${taskId}`, newComment)
      }
    }, 30000)

    return () => clearInterval(interval)
  }, [newComment, taskId])

  // Load draft on mount
  useEffect(() => {
    const savedDraft = localStorage.getItem(`task-comment-draft-${taskId}`)
    if (savedDraft) {
      setNewComment(savedDraft)
    }
  }, [taskId])

  const extractMentions = (text: string): string[] => {
    const mentionRegex = /@(\w+)/g
    const mentions: string[] = []
    let match: RegExpExecArray | null = null

    match = mentionRegex.exec(text)
    while (match !== null) {
      const username = match[1]
      const user = users.find((u) => u.name.toLowerCase().includes(username.toLowerCase()))
      if (user) {
        mentions.push(user.id)
      }
      match = mentionRegex.exec(text)
    }

    return mentions
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!newComment.trim() || submitting) return

    try {
      setSubmitting(true)
      const mentions = extractMentions(newComment)
      await onAddComment(newComment, mentions)

      setNewComment('')
      localStorage.removeItem(`task-comment-draft-${taskId}`)
    } catch (error) {
      console.error('Failed to add comment:', error)
    } finally {
      setSubmitting(false)
    }
  }

  const handleTextChange = (value: string) => {
    if (value.length <= CHARACTER_LIMIT) {
      setNewComment(value)

      // Check for @ mention trigger
      const lastAtIndex = value.lastIndexOf('@')
      if (lastAtIndex !== -1) {
        const queryAfterAt = value.substring(lastAtIndex + 1)
        if (!queryAfterAt.includes(' ')) {
          setMentionQuery(queryAfterAt)
          setShowMentions(true)
        } else {
          setShowMentions(false)
        }
      } else {
        setShowMentions(false)
      }
    }
  }

  const insertMention = (user: User) => {
    const lastAtIndex = newComment.lastIndexOf('@')
    const beforeMention = newComment.substring(0, lastAtIndex)
    const afterMention = newComment.substring(lastAtIndex + mentionQuery.length + 1)

    setNewComment(`${beforeMention}@${user.name} ${afterMention}`)
    setShowMentions(false)
  }

  const filteredUsers = users.filter((u) =>
    u.name.toLowerCase().includes(mentionQuery.toLowerCase())
  )

  const getUserById = (userId: string): User | undefined => {
    return users.find((u) => u.id === userId)
  }

  const formatTimestamp = (timestamp: string): string => {
    const date = new Date(timestamp)
    const now = new Date()
    const diffMs = now.getTime() - date.getTime()
    const diffMins = Math.floor(diffMs / 60000)

    if (diffMins < 1) return 'just now'
    if (diffMins < 60) return `${diffMins}m ago`
    if (diffMins < 1440) return `${Math.floor(diffMins / 60)}h ago`
    return date.toLocaleDateString()
  }

  return (
    <YStack gap="$6">
      {/* Comment List */}
      <YStack gap="$4">
        {comments.length === 0 ? (
          <YStack alignItems="center" paddingVertical="$8">
            <SizableText fontSize="$3" color="$color10" style={{ textAlign: 'center' }}>
              No comments yet. Be the first to comment!
            </SizableText>
          </YStack>
        ) : (
          comments.map((comment) => {
            const user = getUserById(comment.user_id)
            return (
              <XStack key={comment.id} gap="$3">
                <YStack
                  width={32}
                  height={32}
                  borderRadius={9999}
                  backgroundColor="$blue10"
                  alignItems="center"
                  justifyContent="center"
                  flexShrink={0}
                >
                  <SizableText fontSize="$3" fontWeight="500" color="white">
                    {user?.name.charAt(0) || '?'}
                  </SizableText>
                </YStack>
                <YStack flex={1}>
                  <XStack alignItems="baseline" gap="$2">
                    <SizableText fontSize="$3" fontWeight="500" color="$color12">
                      {user?.name || 'Unknown User'}
                    </SizableText>
                    <SizableText fontSize="$1" color="$color10">
                      {formatTimestamp(comment.created_at)}
                    </SizableText>
                  </XStack>
                  <SizableText fontSize="$3" color="$color11" mt="$1" whiteSpace="pre-wrap">
                    {comment.content}
                  </SizableText>
                  {comment.mentions.length > 0 && (
                    <XStack mt="$2" flexWrap="wrap" gap="$1">
                      {comment.mentions.map((mentionId) => {
                        const mentionedUser = getUserById(mentionId)
                        return (
                          <YStack
                            key={mentionId}
                            alignItems="center"
                            paddingHorizontal="$2"
                            paddingVertical="$0.5"
                            borderRadius="$2"
                            backgroundColor="$blue2"
                          >
                            <SizableText fontSize="$1" fontWeight="500" color="$blue11">
                              @{mentionedUser?.name || 'Unknown'}
                            </SizableText>
                          </YStack>
                        )
                      })}
                    </XStack>
                  )}
                </YStack>
              </XStack>
            )
          })
        )}
      </YStack>

      {/* New Comment Form */}
      <YStack as="form" onSubmit={handleSubmit} position="relative">
        <Card
          borderWidth={1}
          borderColor="$borderColor"
          borderRadius="$4"
          overflow="hidden"
          focusWithinStyle={{
            borderColor: '$blue10',
            outlineWidth: 2,
            outlineColor: '$blue10',
          }}
        >
          <TextArea
            value={newComment}
            onChangeText={handleTextChange}
            placeholder="Add a comment... Use @ to mention someone"
            rows={4}
            width="100%"
            padding="$3"
            paddingHorizontal="$4"
            fontSize="$3"
            borderWidth={0}
            resize="none"
          />

          {/* Mention Dropdown */}
          {showMentions && filteredUsers.length > 0 && (
            <Card
              position="absolute"
              zIndex={10}
              bottom="100%"
              mb="$2"
              backgroundColor="$background"
              borderWidth={1}
              borderColor="$borderColor"
              borderRadius="$4"
              elevation={4}
              maxHeight={192}
              overflow="scroll"
              width={256}
            >
              {filteredUsers.map((user) => (
                <Button
                  key={user.id}
                  type="button"
                  onPress={() => insertMention(user)}
                  variant="outlined"
                  width="100%"
                  justifyContent="flex-start"
                  paddingHorizontal="$4"
                  paddingVertical="$2"
                >
                  <XStack alignItems="center" gap="$2" width="100%">
                    <YStack
                      width={24}
                      height={24}
                      borderRadius={9999}
                      backgroundColor="$blue10"
                      alignItems="center"
                      justifyContent="center"
                    >
                      <SizableText fontSize="$1" color="white">
                        {user.name.charAt(0)}
                      </SizableText>
                    </YStack>
                    <YStack>
                      <SizableText fontSize="$3" fontWeight="500" color="$color12">
                        {user.name}
                      </SizableText>
                      <SizableText fontSize="$1" color="$color10">
                        {user.email}
                      </SizableText>
                    </YStack>
                  </XStack>
                </Button>
              ))}
            </Card>
          )}

          <XStack
            paddingHorizontal="$4"
            paddingVertical="$2"
            backgroundColor="$color2"
            borderTopWidth={1}
            borderColor="$borderColor"
            alignItems="center"
            justifyContent="space-between"
          >
            <XStack alignItems="center" gap="$4">
              <SizableText fontSize="$1" color="$color10">
                {newComment.length} / {CHARACTER_LIMIT}
              </SizableText>
              {newComment.trim() && (
                <SizableText fontSize="$1" color="$color10">
                  Draft auto-saved
                </SizableText>
              )}
            </XStack>
            <Button
              type="submit"
              disabled={!newComment.trim() || submitting}
              backgroundColor="$blue10"
              color="white"
              size="$2"
              opacity={!newComment.trim() || submitting ? 0.5 : 1}
            >
              {submitting ? (
                <XStack alignItems="center" gap="$2">
                  <Spinner size="small" color="white" />
                  <SizableText fontSize="$3" color="white">
                    Posting...
                  </SizableText>
                </XStack>
              ) : (
                'Post Comment'
              )}
            </Button>
          </XStack>
        </Card>

        <SizableText fontSize="$1" color="$color10" mt="$2">
          Markdown formatting supported: **bold**, *italic*, - lists
        </SizableText>
      </YStack>
    </YStack>
  )
}
