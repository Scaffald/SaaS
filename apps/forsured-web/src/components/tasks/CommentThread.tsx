/**
 * Task Management Workflow & UI
 * CommentThread component with rich text, mentions, and real-time updates
 */

import { useState, useEffect } from 'react'
import type { User } from '../../types'
import type { TaskComment } from '../../lib/api/taskService'
import { Stack, Row, Button, Card, Text } from '@unicornlove/beyond-ui'
import Textarea from '../Common/Textarea'
import { Loader2 } from 'lucide-react'

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
    <Stack style={{ gap: '24px' }}>
      {/* Comment List */}
      <Stack style={{ gap: '16px' }}>
        {comments.length === 0 ? (
          <Stack style={{ alignItems: 'center', paddingTop: '32px', paddingBottom: '32px' }}>
            <Text style={{ fontSize: '14px', color: 'var(--color-color10)', textAlign: 'center' }}>
              No comments yet. Be the first to comment!
            </Text>
          </Stack>
        ) : (
          comments.map((comment) => {
            const user = getUserById(comment.user_id)
            return (
              <Row key={comment.id} style={{ gap: '12px' }}>
                <div
                  style={{
                    width: '32px',
                    height: '32px',
                    borderRadius: '50%',
                    backgroundColor: 'var(--color-blue10)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    flexShrink: 0,
                  }}
                >
                  <Text style={{ fontSize: '14px', fontWeight: 500, color: 'white' }}>
                    {user?.name.charAt(0) || '?'}
                  </Text>
                </div>
                <Stack style={{ flex: 1 }}>
                  <Row style={{ alignItems: 'baseline', gap: '8px' }}>
                    <Text style={{ fontSize: '14px', fontWeight: 500, color: 'var(--color-color12)' }}>
                      {user?.name || 'Unknown User'}
                    </Text>
                    <Text style={{ fontSize: '12px', color: 'var(--color-color10)' }}>
                      {formatTimestamp(comment.created_at)}
                    </Text>
                  </Row>
                  <Text style={{ fontSize: '14px', color: 'var(--color-color11)', marginTop: '4px', whiteSpace: 'pre-wrap' }}>
                    {comment.content}
                  </Text>
                  {comment.mentions.length > 0 && (
                    <Row style={{ marginTop: '8px', flexWrap: 'wrap', gap: '4px' }}>
                      {comment.mentions.map((mentionId) => {
                        const mentionedUser = getUserById(mentionId)
                        return (
                          <Stack
                            key={mentionId}
                            style={{
                              alignItems: 'center',
                              paddingLeft: '8px',
                              paddingRight: '8px',
                              paddingTop: '2px',
                              paddingBottom: '2px',
                              borderRadius: '6px',
                              backgroundColor: 'var(--color-blue2)',
                            }}
                          >
                            <Text style={{ fontSize: '12px', fontWeight: 500, color: 'var(--color-blue11)' }}>
                              @{mentionedUser?.name || 'Unknown'}
                            </Text>
                          </Stack>
                        )
                      })}
                    </Row>
                  )}
                </Stack>
              </Row>
            )
          })
        )}
      </Stack>

      {/* New Comment Form */}
      <form onSubmit={handleSubmit} style={{ position: 'relative' }}>
        <Card
          style={{
            borderWidth: '1px',
            borderStyle: 'solid',
            borderColor: 'var(--color-border)',
            borderRadius: '12px',
            overflow: 'hidden',
          }}
        >
          <Textarea
            value={newComment}
            onChange={(e) => handleTextChange(e.target.value)}
            placeholder="Add a comment... Use @ to mention someone"
            rows={4}
            style={{
              width: '100%',
              padding: '12px',
              paddingLeft: '16px',
              paddingRight: '16px',
              fontSize: '14px',
              borderWidth: 0,
              resize: 'none',
            }}
          />

          {/* Mention Dropdown */}
          {showMentions && filteredUsers.length > 0 && (
            <Card
              style={{
                position: 'absolute',
                zIndex: 10,
                bottom: '100%',
                marginBottom: '8px',
                backgroundColor: 'var(--color-background)',
                borderWidth: '1px',
                borderStyle: 'solid',
                borderColor: 'var(--color-border)',
                borderRadius: '12px',
                boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)',
                maxHeight: '192px',
                overflow: 'auto',
                width: '256px',
              }}
            >
              {filteredUsers.map((user) => (
                <button
                  key={user.id}
                  type="button"
                  onClick={() => insertMention(user)}
                  style={{
                    display: 'flex',
                    width: '100%',
                    justifyContent: 'flex-start',
                    paddingLeft: '16px',
                    paddingRight: '16px',
                    paddingTop: '8px',
                    paddingBottom: '8px',
                    background: 'none',
                    border: 'none',
                    cursor: 'pointer',
                  }}
                >
                  <Row style={{ alignItems: 'center', gap: '8px', width: '100%' }}>
                    <div
                      style={{
                        width: '24px',
                        height: '24px',
                        borderRadius: '50%',
                        backgroundColor: 'var(--color-blue10)',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                      }}
                    >
                      <Text style={{ fontSize: '12px', color: 'white' }}>
                        {user.name.charAt(0)}
                      </Text>
                    </div>
                    <Stack>
                      <Text style={{ fontSize: '14px', fontWeight: 500, color: 'var(--color-color12)' }}>
                        {user.name}
                      </Text>
                      <Text style={{ fontSize: '12px', color: 'var(--color-color10)' }}>
                        {user.email}
                      </Text>
                    </Stack>
                  </Row>
                </button>
              ))}
            </Card>
          )}

          <Row
            style={{
              paddingLeft: '16px',
              paddingRight: '16px',
              paddingTop: '8px',
              paddingBottom: '8px',
              backgroundColor: 'var(--color-color2)',
              borderTop: '1px solid var(--color-border)',
              alignItems: 'center',
              justifyContent: 'space-between',
            }}
          >
            <Row style={{ alignItems: 'center', gap: '16px' }}>
              <Text style={{ fontSize: '12px', color: 'var(--color-color10)' }}>
                {newComment.length} / {CHARACTER_LIMIT}
              </Text>
              {newComment.trim() && (
                <Text style={{ fontSize: '12px', color: 'var(--color-color10)' }}>
                  Draft auto-saved
                </Text>
              )}
            </Row>
            <Button
              type="submit"
              disabled={!newComment.trim() || submitting}
              style={{
                backgroundColor: 'var(--color-blue10)',
                color: 'white',
                opacity: !newComment.trim() || submitting ? 0.5 : 1,
              }}
              size="sm"
            >
              {submitting ? (
                <Row style={{ alignItems: 'center', gap: '8px' }}>
                  <Loader2 size={16} className="animate-spin" style={{ color: 'white' }} />
                  <Text style={{ fontSize: '14px', color: 'white' }}>
                    Posting...
                  </Text>
                </Row>
              ) : (
                'Post Comment'
              )}
            </Button>
          </Row>
        </Card>

        <Text style={{ fontSize: '12px', color: 'var(--color-color10)', marginTop: '8px' }}>
          Markdown formatting supported: **bold**, *italic*, - lists
        </Text>
      </form>
    </Stack>
  )
}
