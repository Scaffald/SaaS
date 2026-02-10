/**
 * UnifiedTaskDetailModal - Task detail modal using Beyond UI

 */
import type React from 'react'
import { useState, useEffect } from 'react'
import {
  X,
  Clock,
  CheckCircle,
  FileText,
  Calendar,
  Building,
  Upload,
  Download,
  Edit,
  History,
  Ban,
} from 'lucide-react'
import { Stack, Row, Text, H2 } from '@unicornlove/beyond-ui'
import type { Task, User as UserType, EntityType } from '../../types'
import Modal from './Modal'
import Button from './Button'
import Input from './Input'
import Textarea from './Textarea'
import Select from './Select'
import { useComments } from '../../hooks/useComments'
import { useAttachments } from '../../hooks/useAttachments'
import { useStatusHistory } from '../../hooks/useStatusHistory'
import { useUsers } from '../../hooks/useUsers'
import COIComparisonViewer from '../Document/COIComparisonViewer'

interface UnifiedTaskDetailModalProps {
  task: Task
  isOpen: boolean
  onClose: () => void
  onUpdateTask: (taskId: string, updates: Partial<Task>) => Promise<void>
  currentUser: UserType
  availableUsers?: UserType[]
}

export default function UnifiedTaskDetailModal({
  task,
  isOpen,
  onClose,
  onUpdateTask,
  currentUser,
  availableUsers = [],
}: UnifiedTaskDetailModalProps) {
  const [activeTab, setActiveTab] = useState<'details' | 'comments' | 'attachments' | 'history'>(
    'details'
  )
  const [showReassignModal, setShowReassignModal] = useState(false)
  const [showBlockModal, setShowBlockModal] = useState(false)
  const [showEditModal, setShowEditModal] = useState(false)
  const [commentText, setCommentText] = useState('')
  const [blockReason, setBlockReason] = useState('')
  const [selectedAssignee, setSelectedAssignee] = useState(task.assigned_to_user_id || '')
  const [newDueDate, setNewDueDate] = useState(task.due_date || '')
  const [newPriority, setNewPriority] = useState(task.priority || 'medium')
  const [mentionQuery, setMentionQuery] = useState('')
  const [showMentions, setShowMentions] = useState(false)
  const [showCOIComparison, setShowCOIComparison] = useState(false)

  // Hooks for data fetching
  const {
    comments,
    loading: commentsLoading,
    createComment,
  } = useComments({
    entityType: 'task' as EntityType,
    entityId: task.id,
  })

  const {
    attachments,
    loading: attachmentsLoading,
    createAttachment,
    deleteAttachment,
  } = useAttachments({
    entityType: 'task' as EntityType,
    entityId: task.id,
  })

  const {
    history,
    loading: historyLoading,
    createHistoryEntry,
  } = useStatusHistory({
    entityType: 'task' as EntityType,
    entityId: task.id,
  })

  const { users } = useUsers()
  const allUsers = availableUsers.length > 0 ? availableUsers : users

  useEffect(() => {
    if (isOpen) {
      setSelectedAssignee(task.assigned_to_user_id || '')
      setNewDueDate(task.due_date || '')
      setNewPriority(task.priority || 'medium')
    }
  }, [isOpen, task])

  const getPriorityStyles = (priority: string) => {
    switch (priority) {
      case 'urgent':
        return {
          color: 'var(--color-red-11)',
          backgroundColor: 'var(--color-red-3)',
          borderColor: 'var(--color-red-6)',
        }
      case 'high':
        return {
          color: 'var(--color-orange-11)',
          backgroundColor: 'var(--color-orange-3)',
          borderColor: 'var(--color-orange-6)',
        }
      case 'medium':
        return {
          color: 'var(--color-blue-11)',
          backgroundColor: 'var(--color-blue-3)',
          borderColor: 'var(--color-blue-6)',
        }
      case 'low':
        return {
          color: 'var(--color-gray-11)',
          backgroundColor: 'var(--color-gray-3)',
          borderColor: 'var(--color-gray-6)',
        }
      default:
        return {
          color: 'var(--color-gray-11)',
          backgroundColor: 'var(--color-gray-3)',
          borderColor: 'var(--color-gray-6)',
        }
    }
  }

  const getStatusStyles = (status: string) => {
    switch (status) {
      case 'pending':
        return { backgroundColor: 'var(--color-blue-3)', color: 'var(--color-blue-11)' }
      case 'in_progress':
        return { backgroundColor: 'var(--color-blue-3)', color: 'var(--color-blue-11)' }
      case 'blocked':
        return { backgroundColor: 'var(--color-red-3)', color: 'var(--color-red-11)' }
      case 'completed':
        return { backgroundColor: 'var(--color-green-3)', color: 'var(--color-green-11)' }
      case 'cancelled':
        return { backgroundColor: 'var(--color-gray-3)', color: 'var(--color-gray-11)' }
      default:
        return { backgroundColor: 'var(--color-gray-3)', color: 'var(--color-gray-11)' }
    }
  }

  const formatDueDate = (dueDate?: string) => {
    if (!dueDate)
      return {
        text: 'No due date',
        color: 'var(--color-gray-11)',
        isOverdue: false,
      }
    const date = new Date(dueDate)
    const now = new Date()
    const diffTime = date.getTime() - now.getTime()
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24))

    if (diffDays < 0)
      return {
        text: `${Math.abs(diffDays)} days overdue`,
        color: 'var(--color-red-11)',
        isOverdue: true,
      }
    if (diffDays === 0)
      return { text: 'Due today', color: 'var(--color-orange-11)', isOverdue: false }
    if (diffDays === 1)
      return {
        text: 'Due tomorrow',
        color: 'var(--color-orange-11)',
        isOverdue: false,
      }
    return {
      text: `Due in ${diffDays} days`,
      color: 'var(--color-gray-11)',
      isOverdue: false,
    }
  }

  const dueDate = formatDueDate(task.due_date)

  const handleStatusChange = async (newStatus: Task['status'], reason?: string) => {
    const oldStatus = task.status

    try {
      await onUpdateTask(task.id, { status: newStatus })

      // Record status change in history
      await createHistoryEntry({
        entity_type: 'task' as EntityType,
        entity_id: task.id,
        old_status: oldStatus as string,
        new_status: newStatus as string,
        changed_by: currentUser.id,
        reason: reason,
      })

      if (newStatus === 'blocked') {
        setShowBlockModal(false)
        setBlockReason('')
      }
    } catch (error) {
      console.error('Failed to update task status:', error)
    }
  }

  const handleReassign = async () => {
    if (selectedAssignee && selectedAssignee !== task.assigned_to_user_id) {
      try {
        await onUpdateTask(task.id, { assigned_to_user_id: selectedAssignee })
        setShowReassignModal(false)
        setSelectedAssignee('')
      } catch (error) {
        console.error('Failed to reassign task:', error)
      }
    }
  }

  const handleEditTask = async () => {
    try {
      await onUpdateTask(task.id, {
        due_date: newDueDate || undefined,
        priority: newPriority as Task['priority'],
      })
      setShowEditModal(false)
    } catch (error) {
      console.error('Failed to update task:', error)
    }
  }

  const handleAddComment = async () => {
    if (!commentText.trim()) return

    // Extract mentions from comment text
    const mentionMatches = commentText.match(/@(\w+)/g)
    const mentions = mentionMatches
      ? (mentionMatches
          .map((m) => m.substring(1))
          .map((username) => {
            const user = allUsers.find((u) => u.name.toLowerCase().includes(username.toLowerCase()))
            return user?.id
          })
          .filter(Boolean) as string[])
      : []

    try {
      await createComment({
        entity_type: 'task' as EntityType,
        entity_id: task.id,
        user_id: currentUser.id,
        content: commentText,
        mentions: mentions.length > 0 ? mentions : undefined,
      })
      setCommentText('')
      setMentionQuery('')
      setShowMentions(false)
    } catch (error) {
      console.error('Failed to add comment:', error)
    }
  }

  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (!file) return

    try {
      await createAttachment({
        entity_type: 'task' as EntityType,
        entity_id: task.id,
        file_name: file.name,
        file_size: file.size,
        file_type: file.type,
        file_url: URL.createObjectURL(file), // Mock URL
        uploaded_by: currentUser.id,
      })
    } catch (error) {
      console.error('Failed to upload attachment:', error)
    }

    // Reset input
    event.target.value = ''
  }

  const handleDeleteAttachment = async (attachmentId: string) => {
    try {
      await deleteAttachment(attachmentId)
    } catch (error) {
      console.error('Failed to delete attachment:', error)
    }
  }

  const handleCommentInputChange = (value: string) => {
    setCommentText(value)

    // Check for @ mentions
    const lastAt = value.lastIndexOf('@')
    if (lastAt !== -1 && (value.length === lastAt + 1 || value[lastAt + 1] === ' ')) {
      setShowMentions(true)
      setMentionQuery(value.substring(lastAt + 1))
    } else {
      setShowMentions(false)
      setMentionQuery('')
    }
  }

  const insertMention = (user: UserType) => {
    const lastAt = commentText.lastIndexOf('@')
    if (lastAt !== -1) {
      const before = commentText.substring(0, lastAt)
      const after = commentText.substring(lastAt + 1)
      setCommentText(`${before}@${user.name} ${after}`)
      setShowMentions(false)
      setMentionQuery('')
    }
  }

  const filteredUsers = mentionQuery
    ? allUsers.filter(
        (u) =>
          u.name.toLowerCase().includes(mentionQuery.toLowerCase()) ||
          u.email.toLowerCase().includes(mentionQuery.toLowerCase())
      )
    : allUsers.slice(0, 5)

  const formatFileSize = (bytes: number) => {
    if (bytes < 1024) return `${bytes} B`
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`
  }

  const formatDate = (dateString: string) => {
    const date = new Date(dateString)
    return date.toLocaleString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
      hour: 'numeric',
      minute: '2-digit',
    })
  }

  const getUserName = (userId: string) => {
    return allUsers.find((u) => u.id === userId)?.name || 'Unknown User'
  }

  if (!task) return null

  return (
    <>
      <Modal isOpen={isOpen} onClose={onClose} title="" size="large">
        <Stack gap={24}>
          {/* Header */}
          <Row alignItems="flex-start" justifyContent="space-between">
            <Stack flex={1}>
              <Row alignItems="center" gap={12} style={{ marginBottom: 8 }}>
                <H2 style={{ fontWeight: 'bold' }}>{task.title}</H2>
                <Text
                  size="xs"
                  weight="medium"
                  style={{
                    paddingLeft: 10,
                    paddingRight: 10,
                    paddingTop: 4,
                    paddingBottom: 4,
                    borderRadius: 8,
                    border: '1px solid',
                    ...getPriorityStyles(task.priority),
                  }}
                >
                  {task.priority.toUpperCase()}
                </Text>
                <Text
                  size="xs"
                  weight="medium"
                  style={{
                    paddingLeft: 10,
                    paddingRight: 10,
                    paddingTop: 4,
                    paddingBottom: 4,
                    borderRadius: 8,
                    ...getStatusStyles(task.status),
                  }}
                >
                  {task.status.replace('_', ' ').toUpperCase()}
                </Text>
              </Row>
              {task.description && <Text>{task.description}</Text>}
            </Stack>
          </Row>

          {/* Task Info */}
          <Row gap={16} style={{ flexWrap: 'wrap' }}>
            <Row
              alignItems="center"
              gap={12}
              padding={12}
              flex={1}
              style={{
                backgroundColor: 'var(--color-background-hover)',
                borderRadius: 16,
                minWidth: 200,
              }}
            >
              <Calendar size={20} />
              <Stack>
                <Text size="xs" muted>
                  Due Date
                </Text>
                <Row alignItems="center" gap={8}>
                  <Text size="sm" weight="medium" style={{ color: dueDate.color }}>
                    {dueDate.text}
                  </Text>
                  {dueDate.isOverdue && <span style={{ marginLeft: 8 }}>⚠️</span>}
                </Row>
              </Stack>
            </Row>
            {task.project_id && (
              <Row
                alignItems="center"
                gap={12}
                padding={12}
                flex={1}
                style={{
                  backgroundColor: 'var(--color-background-hover)',
                  borderRadius: 16,
                  minWidth: 200,
                }}
              >
                <Building size={20} />
                <Stack>
                  <Text size="xs" muted>
                    Project
                  </Text>
                  <Text size="sm" weight="medium">
                    {task.project_name || 'Project'}
                  </Text>
                </Stack>
              </Row>
            )}
          </Row>

          {/* Assigned To */}
          {task.assigned_to_user_id && (
            <Stack gap={12}>
              <Row alignItems="center" justifyContent="space-between">
                <Text size="sm" weight="semibold">
                  Assigned To
                </Text>
                <Button
                  onPress={() => setShowReassignModal(true)}
                  variant="ghost"
                  size="sm"
                  style={{ color: 'var(--color-blue-9)' }}
                >
                  Reassign
                </Button>
              </Row>
              <Row
                alignItems="center"
                gap={12}
                padding={12}
                style={{
                  backgroundColor: 'var(--color-background-hover)',
                  borderRadius: 16,
                }}
              >
                <Row
                  alignItems="center"
                  justifyContent="center"
                  style={{
                    width: 40,
                    height: 40,
                    backgroundColor: 'var(--color-blue-9)',
                    borderRadius: '50%',
                  }}
                >
                  <Text size="sm" weight="semibold" style={{ color: 'white' }}>
                    {getUserName(task.assigned_to_user_id)
                      .split(' ')
                      .map((n) => n[0])
                      .join('')}
                  </Text>
                </Row>
                <Stack>
                  <Text size="sm" weight="medium">
                    {getUserName(task.assigned_to_user_id)}
                  </Text>
                  <Text size="xs" muted>
                    {allUsers.find((u) => u.id === task.assigned_to_user_id)?.email || ''}
                  </Text>
                </Stack>
              </Row>
            </Stack>
          )}

          {/* Tabs */}
          <Stack style={{ borderBottom: '1px solid var(--color-border)' }}>
            <Row gap={24}>
              {(['details', 'comments', 'attachments', 'history'] as const).map((tab) => (
                <Button
                  key={tab}
                  onPress={() => setActiveTab(tab)}
                  variant="ghost"
                  style={{
                    paddingBottom: 12,
                    paddingLeft: 4,
                    paddingRight: 4,
                    fontWeight: 500,
                    borderBottom: `2px solid ${activeTab === tab ? 'var(--color-blue-9)' : 'transparent'}`,
                    color: activeTab === tab ? 'var(--color-blue-9)' : 'var(--color-text-muted)',
                  }}
                >
                  {tab.charAt(0).toUpperCase() + tab.slice(1)}
                </Button>
              ))}
            </Row>
          </Stack>

          {/* Tab Content */}
          <Stack style={{ minHeight: 300 }}>
            {activeTab === 'details' && (
              <Stack gap={16}>
                {/* Quick Actions */}
                <Stack gap={12}>
                  <Text size="sm" weight="semibold">
                    Quick Actions
                  </Text>
                  <Row gap={8} style={{ flexWrap: 'wrap' }}>
                    {task.status === 'pending' && (
                      <Button
                        variant="primary"
                        onPress={() => handleStatusChange('in_progress')}
                        style={{ flex: 1 }}
                      >
                        <Clock size={16} style={{ marginRight: 8 }} />
                        Start Task
                      </Button>
                    )}
                    {task.status === 'in_progress' && (
                      <Button
                        variant="primary"
                        onPress={() => handleStatusChange('completed')}
                        style={{ flex: 1, backgroundColor: 'var(--color-green-9)' }}
                      >
                        <CheckCircle size={16} style={{ marginRight: 8 }} />
                        Complete Task
                      </Button>
                    )}
                    {task.status !== 'blocked' && task.status !== 'completed' && (
                      <Button
                        variant="secondary"
                        onPress={() => setShowBlockModal(true)}
                        style={{
                          flex: 1,
                          color: 'var(--color-red-9)',
                          borderColor: 'var(--color-red-9)',
                        }}
                      >
                        <Ban size={16} style={{ marginRight: 8 }} />
                        Block Task
                      </Button>
                    )}
                    <Button
                      variant="secondary"
                      onPress={() => setShowEditModal(true)}
                      style={{ flex: 1 }}
                    >
                      <Edit size={16} style={{ marginRight: 8 }} />
                      Edit Details
                    </Button>
                  </Row>

                  {/* Quick Actions from task */}
                  {task.quick_actions && task.quick_actions.length > 0 && (
                    <Stack
                      style={{
                        marginTop: 16,
                        paddingTop: 16,
                        borderTop: '1px solid var(--color-border)',
                      }}
                    >
                      <Text size="sm" weight="semibold" style={{ marginBottom: 12 }}>
                        Additional Actions
                      </Text>
                      <Row style={{ flexWrap: 'wrap', gap: 8 }}>
                        {task.quick_actions.map((action) => {
                          if (action === 'open_coi' || action === 'compare_to_req') {
                            return (
                              <Button
                                key={action}
                                variant="secondary"
                                onPress={() => setShowCOIComparison(true)}
                              >
                                <FileText size={16} style={{ marginRight: 8 }} />
                                {action === 'open_coi' ? 'Open COI' : 'Compare To Req'}
                              </Button>
                            )
                          }
                          return null
                        })}
                      </Row>
                    </Stack>
                  )}
                </Stack>
              </Stack>
            )}

            {activeTab === 'comments' && (
              <Stack gap={16}>
                <Stack gap={12}>
                  <Text size="sm" weight="semibold">
                    Comments
                  </Text>
                  {commentsLoading ? (
                    <Stack alignItems="center" style={{ paddingTop: 32, paddingBottom: 32 }}>
                      <Text muted>Loading comments...</Text>
                    </Stack>
                  ) : comments.length === 0 ? (
                    <Stack alignItems="center" style={{ paddingTop: 32, paddingBottom: 32 }}>
                      <Text muted>No comments yet</Text>
                    </Stack>
                  ) : (
                    <Stack gap={16}>
                      {comments.map((comment) => (
                        <Row key={comment.id} gap={12}>
                          <Row
                            alignItems="center"
                            justifyContent="center"
                            style={{
                              width: 32,
                              height: 32,
                              backgroundColor: 'var(--color-blue-9)',
                              borderRadius: '50%',
                              flexShrink: 0,
                            }}
                          >
                            <Text size="xs" weight="semibold" style={{ color: 'white' }}>
                              {getUserName(comment.user_id)
                                .split(' ')
                                .map((n) => n[0])
                                .join('')}
                            </Text>
                          </Row>
                          <Stack flex={1}>
                            <Row alignItems="center" gap={8} style={{ marginBottom: 4 }}>
                              <Text size="sm" weight="medium">
                                {getUserName(comment.user_id)}
                              </Text>
                              <Text size="xs" muted>
                                {formatDate(comment.created_at)}
                              </Text>
                              {comment.edited_at && (
                                <Text size="xs" muted>
                                  (edited)
                                </Text>
                              )}
                            </Row>
                            <Text size="sm" style={{ whiteSpace: 'pre-wrap' }}>
                              {comment.content}
                            </Text>
                            {comment.mentions && comment.mentions.length > 0 && (
                              <Row style={{ marginTop: 8, flexWrap: 'wrap', gap: 4 }}>
                                {comment.mentions.map((userId) => (
                                  <Text
                                    key={userId}
                                    size="xs"
                                    style={{
                                      paddingLeft: 8,
                                      paddingRight: 8,
                                      paddingTop: 2,
                                      paddingBottom: 2,
                                      backgroundColor: 'var(--color-blue-3)',
                                      color: 'var(--color-blue-10)',
                                      borderRadius: 8,
                                    }}
                                  >
                                    @{getUserName(userId)}
                                  </Text>
                                ))}
                              </Row>
                            )}
                          </Stack>
                        </Row>
                      ))}
                    </Stack>
                  )}
                </Stack>

                {/* Add Comment */}
                <Stack style={{ borderTop: '1px solid var(--color-border)', paddingTop: 16 }}>
                  <Stack style={{ position: 'relative' }}>
                    <Textarea
                      label="Add a comment"
                      value={commentText}
                      onChange={(e) => handleCommentInputChange(e.target.value)}
                      placeholder="Type @ to mention someone..."
                      rows={3}
                      fullWidth
                    />
                    {showMentions && (
                      <Stack
                        style={{
                          position: 'absolute',
                          zIndex: 10,
                          width: '100%',
                          marginTop: 4,
                          backgroundColor: 'var(--color-background)',
                          border: '1px solid var(--color-border)',
                          borderRadius: 16,
                          boxShadow: '0 4px 16px var(--color-shadow)',
                          maxHeight: 192,
                          overflow: 'hidden',
                        }}
                      >
                        {filteredUsers.map((user) => (
                          <Button
                            key={user.id}
                            onPress={() => insertMention(user)}
                            variant="ghost"
                            style={{
                              width: '100%',
                              paddingLeft: 16,
                              paddingRight: 16,
                              paddingTop: 8,
                              paddingBottom: 8,
                              justifyContent: 'flex-start',
                              alignItems: 'center',
                              gap: 8,
                            }}
                          >
                            <Row
                              alignItems="center"
                              justifyContent="center"
                              style={{
                                width: 32,
                                height: 32,
                                backgroundColor: 'var(--color-blue-9)',
                                borderRadius: '50%',
                              }}
                            >
                              <Text size="xs" weight="semibold" style={{ color: 'white' }}>
                                {user.name
                                  .split(' ')
                                  .map((n) => n[0])
                                  .join('')}
                              </Text>
                            </Row>
                            <Stack>
                              <Text size="sm" weight="medium">
                                {user.name}
                              </Text>
                              <Text size="xs" muted>
                                {user.email}
                              </Text>
                            </Stack>
                          </Button>
                        ))}
                      </Stack>
                    )}
                  </Stack>
                  <Row style={{ marginTop: 12 }} justifyContent="flex-end">
                    <Button onPress={handleAddComment} disabled={!commentText.trim()}>
                      Add Comment
                    </Button>
                  </Row>
                </Stack>
              </Stack>
            )}

            {activeTab === 'attachments' && (
              <Stack gap={16}>
                <Stack gap={12}>
                  <Row alignItems="center" justifyContent="space-between">
                    <Text size="sm" weight="semibold">
                      Attachments
                    </Text>
                    <label style={{ cursor: 'pointer' }}>
                      <input type="file" style={{ display: 'none' }} onChange={handleFileUpload} />
                      <Button variant="secondary" size="sm">
                        <Upload size={16} style={{ marginRight: 8 }} />
                        Upload File
                      </Button>
                    </label>
                  </Row>
                  {attachmentsLoading ? (
                    <Stack alignItems="center" style={{ paddingTop: 32, paddingBottom: 32 }}>
                      <Text muted>Loading attachments...</Text>
                    </Stack>
                  ) : attachments.length === 0 ? (
                    <Stack alignItems="center" style={{ paddingTop: 32, paddingBottom: 32 }}>
                      <Text muted>No attachments yet</Text>
                    </Stack>
                  ) : (
                    <Stack gap={8}>
                      {attachments.map((attachment) => (
                        <Row
                          key={attachment.id}
                          alignItems="center"
                          justifyContent="space-between"
                          padding={12}
                          style={{
                            backgroundColor: 'var(--color-background-hover)',
                            borderRadius: 16,
                          }}
                        >
                          <Row alignItems="center" gap={12} flex={1}>
                            <FileText size={20} />
                            <Stack flex={1}>
                              <Text size="sm" weight="medium">
                                {attachment.file_name}
                              </Text>
                              <Text size="xs" muted>
                                {formatFileSize(attachment.file_size)} •{' '}
                                {formatDate(attachment.created_at)}
                              </Text>
                            </Stack>
                          </Row>
                          <Row alignItems="center" gap={8}>
                            {attachment.file_url && (
                              <a href={attachment.file_url} download={attachment.file_name}>
                                <Button
                                  size="sm"
                                  variant="ghost"
                                  style={{ padding: 8, color: 'var(--color-blue-9)' }}
                                >
                                  <Download size={16} />
                                </Button>
                              </a>
                            )}
                            <Button
                              onPress={() => handleDeleteAttachment(attachment.id)}
                              size="sm"
                              variant="ghost"
                              style={{ padding: 8, color: 'var(--color-red-9)' }}
                            >
                              <X size={16} />
                            </Button>
                          </Row>
                        </Row>
                      ))}
                    </Stack>
                  )}
                </Stack>
              </Stack>
            )}

            {activeTab === 'history' && (
              <Stack gap={16}>
                <Text size="sm" weight="semibold">
                  Status History
                </Text>
                {historyLoading ? (
                  <Stack alignItems="center" style={{ paddingTop: 32, paddingBottom: 32 }}>
                    <Text muted>Loading history...</Text>
                  </Stack>
                ) : history.length === 0 ? (
                  <Stack alignItems="center" style={{ paddingTop: 32, paddingBottom: 32 }}>
                    <Text muted>No history yet</Text>
                  </Stack>
                ) : (
                  <Stack gap={12}>
                    {history.map((entry) => (
                      <Row
                        key={entry.id}
                        gap={12}
                        padding={12}
                        style={{
                          backgroundColor: 'var(--color-background-hover)',
                          borderRadius: 16,
                        }}
                      >
                        <History size={16} style={{ marginTop: 2 }} />
                        <Stack flex={1}>
                          <Row alignItems="center" gap={8} style={{ marginBottom: 4 }}>
                            <Text size="sm" weight="medium">
                              {getUserName(entry.changed_by)}
                            </Text>
                            <Text size="xs" muted>
                              changed status
                            </Text>
                            <Text
                              size="xs"
                              style={{
                                paddingLeft: 8,
                                paddingRight: 8,
                                paddingTop: 2,
                                paddingBottom: 2,
                                backgroundColor: 'var(--color-gray-3)',
                                borderRadius: 8,
                              }}
                            >
                              {entry.old_status}
                            </Text>
                            <Text size="xs" muted>
                              →
                            </Text>
                            <Text
                              size="xs"
                              style={{
                                paddingLeft: 8,
                                paddingRight: 8,
                                paddingTop: 2,
                                paddingBottom: 2,
                                borderRadius: 8,
                                ...getStatusStyles(entry.new_status),
                              }}
                            >
                              {entry.new_status}
                            </Text>
                          </Row>
                          {entry.reason && (
                            <Text size="xs" style={{ marginTop: 4 }}>
                              Reason: {entry.reason}
                            </Text>
                          )}
                          <Text size="xs" muted style={{ marginTop: 4 }}>
                            {formatDate(entry.created_at)}
                          </Text>
                        </Stack>
                      </Row>
                    ))}
                  </Stack>
                )}
              </Stack>
            )}
          </Stack>
        </Stack>
      </Modal>

      {/* Reassign Modal */}
      <Modal
        isOpen={showReassignModal}
        onClose={() => setShowReassignModal(false)}
        title="Reassign Task"
        size="small"
      >
        <Stack gap={16}>
          <Select
            label="Select Assignee"
            value={selectedAssignee}
            onChange={(e) => setSelectedAssignee(e.target.value)}
            options={allUsers.map((user) => ({
              value: user.id,
              label: `${user.name} (${user.email})`,
            }))}
            fullWidth
          />
          <Row gap={12}>
            <Button
              variant="secondary"
              onPress={() => setShowReassignModal(false)}
              style={{ flex: 1 }}
            >
              Cancel
            </Button>
            <Button variant="primary" onPress={handleReassign} style={{ flex: 1 }}>
              Reassign
            </Button>
          </Row>
        </Stack>
      </Modal>

      {/* Block Modal */}
      <Modal
        isOpen={showBlockModal}
        onClose={() => {
          setShowBlockModal(false)
          setBlockReason('')
        }}
        title="Block Task"
        size="small"
      >
        <Stack gap={16}>
          <Textarea
            label="Reason for blocking"
            value={blockReason}
            onChange={(e) => setBlockReason(e.target.value)}
            placeholder="Enter the reason why this task is blocked..."
            rows={4}
            fullWidth
            required
          />
          <Row gap={12}>
            <Button
              variant="secondary"
              onPress={() => {
                setShowBlockModal(false)
                setBlockReason('')
              }}
              style={{ flex: 1 }}
            >
              Cancel
            </Button>
            <Button
              variant="primary"
              onPress={() => handleStatusChange('blocked', blockReason)}
              disabled={!blockReason.trim()}
              style={{ flex: 1, backgroundColor: 'var(--color-red-9)' }}
            >
              Block Task
            </Button>
          </Row>
        </Stack>
      </Modal>

      {/* Edit Modal */}
      <Modal
        isOpen={showEditModal}
        onClose={() => setShowEditModal(false)}
        title="Edit Task Details"
        size="small"
      >
        <Stack gap={16}>
          <Input
            label="Due Date"
            type="datetime-local"
            value={newDueDate ? new Date(newDueDate).toISOString().slice(0, 16) : ''}
            onChange={(e) => {
              const value = e.target.value
              setNewDueDate(value ? new Date(value).toISOString() : '')
            }}
            fullWidth
          />
          <Select
            label="Priority"
            value={newPriority}
            onChange={(e) => setNewPriority(e.target.value)}
            options={[
              { value: 'low', label: 'Low' },
              { value: 'medium', label: 'Medium' },
              { value: 'high', label: 'High' },
              { value: 'urgent', label: 'Urgent' },
            ]}
            fullWidth
          />
          <Row gap={12}>
            <Button variant="secondary" onPress={() => setShowEditModal(false)} style={{ flex: 1 }}>
              Cancel
            </Button>
            <Button variant="primary" onPress={handleEditTask} style={{ flex: 1 }}>
              Save Changes
            </Button>
          </Row>
        </Stack>
      </Modal>

      {/* COI Comparison Viewer */}
      {task.document_link && (
        <COIComparisonViewer
          documentId={task.document_link}
          projectId={task.project_id}
          documentName={task.title}
          documentUrl={task.document_link}
          isOpen={showCOIComparison}
          onClose={() => setShowCOIComparison(false)}
          onApprove={() => {
            console.log('Document approved')
          }}
          onRequestChanges={(comments) => {
            console.log('Request changes:', comments)
          }}
          onOverride={(reason) => {
            console.log('Override with reason:', reason)
          }}
        />
      )}
    </>
  )
}
