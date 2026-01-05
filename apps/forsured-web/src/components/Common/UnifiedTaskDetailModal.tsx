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
  Block,
} from 'lucide-react'
import { YStack, XStack, Text, H2 } from '@unicornlove/ui'
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
        return { color: '$red11', backgroundColor: '$red3', borderColor: '$red6' }
      case 'high':
        return { color: '$orange11', backgroundColor: '$orange3', borderColor: '$orange6' }
      case 'medium':
        return { color: '$blue11', backgroundColor: '$blue3', borderColor: '$blue6' }
      case 'low':
        return { color: '$gray11', backgroundColor: '$gray3', borderColor: '$gray6' }
      default:
        return { color: '$gray11', backgroundColor: '$gray3', borderColor: '$gray6' }
    }
  }

  const getStatusStyles = (status: string) => {
    switch (status) {
      case 'pending':
        return { backgroundColor: '$blue3', color: '$blue11' }
      case 'in_progress':
        return { backgroundColor: '$blue3', color: '$blue11' }
      case 'blocked':
        return { backgroundColor: '$red3', color: '$red11' }
      case 'completed':
        return { backgroundColor: '$green3', color: '$green11' }
      case 'cancelled':
        return { backgroundColor: '$gray3', color: '$gray11' }
      default:
        return { backgroundColor: '$gray3', color: '$gray11' }
    }
  }

  const formatDueDate = (dueDate?: string) => {
    if (!dueDate)
      return {
        text: 'No due date',
        color: '$gray11',
        isOverdue: false,
      }
    const date = new Date(dueDate)
    const now = new Date()
    const diffTime = date.getTime() - now.getTime()
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24))

    if (diffDays < 0)
      return {
        text: `${Math.abs(diffDays)} days overdue`,
        color: '$red11',
        isOverdue: true,
      }
    if (diffDays === 0) return { text: 'Due today', color: '$orange11', isOverdue: false }
    if (diffDays === 1)
      return {
        text: 'Due tomorrow',
        color: '$orange11',
        isOverdue: false,
      }
    return {
      text: `Due in ${diffDays} days`,
      color: '$gray11',
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
        <YStack gap="$6">
          {/* Header */}
          <XStack alignItems="flex-start" justifyContent="space-between">
            <YStack flex={1}>
              <XStack alignItems="center" gap="$3" mb="$2">
                <H2 fontSize="$8" fontWeight="bold" color="$color12">
                  {task.title}
                </H2>
                <Text
                  paddingHorizontal="$2.5"
                  paddingVertical="$1"
                  fontSize="$1"
                  fontWeight="500"
                  borderRadius="$2"
                  borderWidth={1}
                  {...getPriorityStyles(task.priority)}
                >
                  {task.priority.toUpperCase()}
                </Text>
                <Text
                  paddingHorizontal="$2.5"
                  paddingVertical="$1"
                  fontSize="$1"
                  fontWeight="500"
                  borderRadius="$2"
                  {...getStatusStyles(task.status)}
                >
                  {task.status.replace('_', ' ').toUpperCase()}
                </Text>
              </XStack>
              {task.description && <Text color="$color11">{task.description}</Text>}
            </YStack>
          </XStack>

          {/* Task Info */}
          <XStack gap="$4" flexWrap="wrap">
            <XStack
              alignItems="center"
              gap="$3"
              padding="$3"
              backgroundColor="$backgroundHover"
              borderRadius="$4"
              flex={1}
              minWidth={200}
            >
              <Calendar color="$color10" size={20} />
              <YStack>
                <Text fontSize="$1" color="$color10">
                  Due Date
                </Text>
                <XStack alignItems="center" gap="$2">
                  <Text fontSize="$3" fontWeight="500" color={dueDate.color}>
                    {dueDate.text}
                  </Text>
                  {dueDate.isOverdue && <Text ml="$2">⚠️</Text>}
                </XStack>
              </YStack>
            </XStack>
            {task.project_id && (
              <XStack
                alignItems="center"
                gap="$3"
                padding="$3"
                backgroundColor="$backgroundHover"
                borderRadius="$4"
                flex={1}
                minWidth={200}
              >
                <Building color="$color10" size={20} />
                <YStack>
                  <Text fontSize="$1" color="$color10">
                    Project
                  </Text>
                  <Text fontSize="$3" fontWeight="500" color="$color12">
                    {task.project_name || 'Project'}
                  </Text>
                </YStack>
              </XStack>
            )}
          </XStack>

          {/* Assigned To */}
          {task.assigned_to_user_id && (
            <YStack gap="$3">
              <XStack alignItems="center" justifyContent="space-between">
                <Text fontSize="$3" fontWeight="600" color="$color12">
                  Assigned To
                </Text>
                <Button
                  onPress={() => setShowReassignModal(true)}
                  variant="ghost"
                  size="$2"
                  fontSize="$1"
                  color="$blue9"
                >
                  Reassign
                </Button>
              </XStack>
              <XStack
                alignItems="center"
                gap="$3"
                padding="$3"
                backgroundColor="$backgroundHover"
                borderRadius="$4"
              >
                <XStack
                  width={40}
                  height={40}
                  backgroundColor="$blue9"
                  borderRadius={9999}
                  alignItems="center"
                  justifyContent="center"
                >
                  <Text fontSize="$3" fontWeight="600" color="white">
                    {getUserName(task.assigned_to_user_id)
                      .split(' ')
                      .map((n) => n[0])
                      .join('')}
                  </Text>
                </XStack>
                <YStack>
                  <Text fontSize="$3" fontWeight="500" color="$color12">
                    {getUserName(task.assigned_to_user_id)}
                  </Text>
                  <Text fontSize="$1" color="$color10">
                    {allUsers.find((u) => u.id === task.assigned_to_user_id)?.email || ''}
                  </Text>
                </YStack>
              </XStack>
            </YStack>
          )}

          {/* Tabs */}
          <YStack borderBottomWidth={1} borderColor="$borderColor">
            <XStack gap="$6">
              {(['details', 'comments', 'attachments', 'history'] as const).map((tab) => (
                <Button
                  key={tab}
                  onPress={() => setActiveTab(tab)}
                  variant="ghost"
                  paddingBottom="$3"
                  paddingHorizontal="$1"
                  fontSize="$3"
                  fontWeight="500"
                  borderBottomWidth={2}
                  borderBottomColor={activeTab === tab ? '$blue9' : 'transparent'}
                  color={activeTab === tab ? '$blue9' : '$color10'}
                  hoverStyle={{
                    color: '$color12',
                  }}
                >
                  {tab.charAt(0).toUpperCase() + tab.slice(1)}
                </Button>
              ))}
            </XStack>
          </YStack>

          {/* Tab Content */}
          <YStack minHeight={300}>
            {activeTab === 'details' && (
              <YStack gap="$4">
                {/* Quick Actions */}
                <YStack gap="$3">
                  <Text fontSize="$3" fontWeight="600" color="$color12">
                    Quick Actions
                  </Text>
                  <XStack gap="$2" flexWrap="wrap">
                    {task.status === 'pending' && (
                      <Button
                        variant="primary"
                        onClick={() => handleStatusChange('in_progress')}
                        leftIcon={Clock}
                        fullWidth
                      >
                        Start Task
                      </Button>
                    )}
                    {task.status === 'in_progress' && (
                      <Button
                        variant="success"
                        onClick={() => handleStatusChange('completed')}
                        leftIcon={CheckCircle}
                        fullWidth
                      >
                        Complete Task
                      </Button>
                    )}
                    {task.status !== 'blocked' && task.status !== 'completed' && (
                      <Button
                        variant="danger"
                        onClick={() => setShowBlockModal(true)}
                        leftIcon={Block}
                        fullWidth
                      >
                        Block Task
                      </Button>
                    )}
                    <Button
                      variant="secondary"
                      onClick={() => setShowEditModal(true)}
                      leftIcon={Edit}
                      fullWidth
                    >
                      Edit Details
                    </Button>
                  </XStack>

                  {/* Quick Actions from task */}
                  {task.quick_actions && task.quick_actions.length > 0 && (
                    <YStack
                      mt="$4"
                      paddingTop="$4"
                      borderTopWidth={1}
                      borderColor="$borderColor"
                    >
                      <Text fontSize="$3" fontWeight="600" color="$color12" mb="$3">
                        Additional Actions
                      </Text>
                      <XStack flexWrap="wrap" gap="$2">
                        {task.quick_actions.map((action) => {
                          if (action === 'open_coi' || action === 'compare_to_req') {
                            return (
                              <Button
                                key={action}
                                variant="outline"
                                onPress={() => setShowCOIComparison(true)}
                                leftIcon={FileText}
                              >
                                {action === 'open_coi' ? 'Open COI' : 'Compare To Req'}
                              </Button>
                            )
                          }
                          return null
                        })}
                      </XStack>
                    </YStack>
                  )}
                </YStack>
              </YStack>
            )}

            {activeTab === 'comments' && (
              <YStack gap="$4">
                <YStack gap="$3">
                  <Text fontSize="$3" fontWeight="600" color="$color12">
                    Comments
                  </Text>
                  {commentsLoading ? (
                    <YStack alignItems="center" paddingVertical="$8">
                      <Text color="$color10">Loading comments...</Text>
                    </YStack>
                  ) : comments.length === 0 ? (
                    <YStack alignItems="center" paddingVertical="$8">
                      <Text color="$color10">No comments yet</Text>
                    </YStack>
                  ) : (
                    <YStack gap="$4">
                      {comments.map((comment) => (
                        <XStack key={comment.id} gap="$3">
                          <XStack
                            width={32}
                            height={32}
                            backgroundColor="$blue9"
                            borderRadius={9999}
                            alignItems="center"
                            justifyContent="center"
                            flexShrink={0}
                          >
                            <Text fontSize="$1" fontWeight="600" color="white">
                              {getUserName(comment.user_id)
                                .split(' ')
                                .map((n) => n[0])
                                .join('')}
                            </Text>
                          </XStack>
                          <YStack flex={1}>
                            <XStack alignItems="center" gap="$2" mb="$1">
                              <Text fontSize="$3" fontWeight="500" color="$color12">
                                {getUserName(comment.user_id)}
                              </Text>
                              <Text fontSize="$1" color="$color10">
                                {formatDate(comment.created_at)}
                              </Text>
                              {comment.edited_at && (
                                <Text fontSize="$1" color="$color10">
                                  (edited)
                                </Text>
                              )}
                            </XStack>
                            <Text fontSize="$3" color="$color11" whiteSpace="pre-wrap">
                              {comment.content}
                            </Text>
                            {comment.mentions && comment.mentions.length > 0 && (
                              <XStack mt="$2" flexWrap="wrap" gap="$1">
                                {comment.mentions.map((userId) => (
                                  <Text
                                    key={userId}
                                    fontSize="$1"
                                    paddingHorizontal="$2"
                                    paddingVertical="$0.5"
                                    backgroundColor="$blue3"
                                    color="$blue10"
                                    borderRadius="$2"
                                  >
                                    @{getUserName(userId)}
                                  </Text>
                                ))}
                              </XStack>
                            )}
                          </YStack>
                        </XStack>
                      ))}
                    </YStack>
                  )}
                </YStack>

                {/* Add Comment */}
                <YStack borderTopWidth={1} borderColor="$borderColor" paddingTop="$4">
                  <YStack position="relative">
                    <Textarea
                      label="Add a comment"
                      value={commentText}
                      onChange={(e) => handleCommentInputChange(e.target.value)}
                      placeholder="Type @ to mention someone..."
                      rows={3}
                      fullWidth
                    />
                    {showMentions && (
                      <YStack
                        position="absolute"
                        zIndex={10}
                        width="100%"
                        mt="$1"
                        backgroundColor="$background"
                        borderWidth={1}
                        borderColor="$borderColor"
                        borderRadius="$4"
                        shadowColor="$shadowColor"
                        shadowRadius="$4"
                        maxHeight={192}
                        overflow="hidden"
                      >
                        {filteredUsers.map((user) => (
                          <Button
                            key={user.id}
                            onPress={() => insertMention(user)}
                            variant="ghost"
                            width="100%"
                            paddingHorizontal="$4"
                            paddingVertical="$2"
                            justifyContent="flex-start"
                            alignItems="center"
                            gap="$2"
                            hoverStyle={{ backgroundColor: '$backgroundHover' }}
                          >
                            <XStack
                              width={32}
                              height={32}
                              backgroundColor="$blue9"
                              borderRadius={9999}
                              alignItems="center"
                              justifyContent="center"
                            >
                              <Text fontSize="$1" fontWeight="600" color="white">
                                {user.name
                                  .split(' ')
                                  .map((n) => n[0])
                                  .join('')}
                              </Text>
                            </XStack>
                            <YStack>
                              <Text fontSize="$3" fontWeight="500" color="$color12">
                                {user.name}
                              </Text>
                              <Text fontSize="$1" color="$color10">
                                {user.email}
                              </Text>
                            </YStack>
                          </Button>
                        ))}
                      </YStack>
                    )}
                  </YStack>
                  <XStack mt="$3" justifyContent="flex-end">
                    <Button onPress={handleAddComment} disabled={!commentText.trim()}>
                      Add Comment
                    </Button>
                  </XStack>
                </YStack>
              </YStack>
            )}

            {activeTab === 'attachments' && (
              <YStack gap="$4">
                <YStack gap="$3">
                  <XStack alignItems="center" justifyContent="space-between">
                    <Text fontSize="$3" fontWeight="600" color="$color12">
                      Attachments
                    </Text>
                    <label style={{ cursor: 'pointer' }}>
                      <input type="file" style={{ display: 'none' }} onChange={handleFileUpload} />
                      <Button variant="secondary" leftIcon={Upload} size="$2">
                        Upload File
                      </Button>
                    </label>
                  </XStack>
                  {attachmentsLoading ? (
                    <YStack alignItems="center" paddingVertical="$8">
                      <Text color="$color10">Loading attachments...</Text>
                    </YStack>
                  ) : attachments.length === 0 ? (
                    <YStack alignItems="center" paddingVertical="$8">
                      <Text color="$color10">No attachments yet</Text>
                    </YStack>
                  ) : (
                    <YStack gap="$2">
                      {attachments.map((attachment) => (
                        <XStack
                          key={attachment.id}
                          alignItems="center"
                          justifyContent="space-between"
                          padding="$3"
                          backgroundColor="$backgroundHover"
                          borderRadius="$4"
                        >
                          <XStack alignItems="center" gap="$3" flex={1}>
                            <FileText color="$color10" size={20} />
                            <YStack flex={1}>
                              <Text fontSize="$3" fontWeight="500" color="$color12">
                                {attachment.file_name}
                              </Text>
                              <Text fontSize="$1" color="$color10">
                                {formatFileSize(attachment.file_size)} •{' '}
                                {formatDate(attachment.created_at)}
                              </Text>
                            </YStack>
                          </XStack>
                          <XStack alignItems="center" gap="$2">
                            {attachment.file_url && (
                              <Button
                                asChild
                                size="$2"
                                variant="ghost"
                                color="$blue9"
                                padding="$2"
                                hoverStyle={{ backgroundColor: '$blue3' }}
                              >
                                <a href={attachment.file_url} download={attachment.file_name}>
                                  <Download size={16} />
                                </a>
                              </Button>
                            )}
                            <Button
                              onPress={() => handleDeleteAttachment(attachment.id)}
                              size="$2"
                              variant="ghost"
                              color="$red9"
                              padding="$2"
                              hoverStyle={{ backgroundColor: '$red3' }}
                            >
                              <X size={16} />
                            </Button>
                          </XStack>
                        </XStack>
                      ))}
                    </YStack>
                  )}
                </YStack>
              </YStack>
            )}

            {activeTab === 'history' && (
              <YStack gap="$4">
                <Text fontSize="$3" fontWeight="600" color="$color12">
                  Status History
                </Text>
                {historyLoading ? (
                  <YStack alignItems="center" paddingVertical="$8">
                    <Text color="$color10">Loading history...</Text>
                  </YStack>
                ) : history.length === 0 ? (
                  <YStack alignItems="center" paddingVertical="$8">
                    <Text color="$color10">No history yet</Text>
                  </YStack>
                ) : (
                  <YStack gap="$3">
                    {history.map((entry) => (
                      <XStack
                        key={entry.id}
                        gap="$3"
                        padding="$3"
                        backgroundColor="$backgroundHover"
                        borderRadius="$4"
                      >
                        <History color="$color10" size={16} mt={2} />
                        <YStack flex={1}>
                          <XStack alignItems="center" gap="$2" mb="$1">
                            <Text fontSize="$3" fontWeight="500" color="$color12">
                              {getUserName(entry.changed_by)}
                            </Text>
                            <Text fontSize="$1" color="$color10">
                              changed status
                            </Text>
                            <Text
                              fontSize="$1"
                              paddingHorizontal="$2"
                              paddingVertical="$0.5"
                              backgroundColor="$gray3"
                              borderRadius="$2"
                            >
                              {entry.old_status}
                            </Text>
                            <Text fontSize="$1" color="$color10">
                              →
                            </Text>
                            <Text
                              fontSize="$1"
                              paddingHorizontal="$2"
                              paddingVertical="$0.5"
                              borderRadius="$2"
                              {...getStatusStyles(entry.new_status)}
                            >
                              {entry.new_status}
                            </Text>
                          </XStack>
                          {entry.reason && (
                            <Text fontSize="$1" color="$color11" mt="$1">
                              Reason: {entry.reason}
                            </Text>
                          )}
                          <Text fontSize="$1" color="$color10" mt="$1">
                            {formatDate(entry.created_at)}
                          </Text>
                        </YStack>
                      </XStack>
                    ))}
                  </YStack>
                )}
              </YStack>
            )}
          </YStack>
        </YStack>
      </Modal>

      {/* Reassign Modal */}
      <Modal
        isOpen={showReassignModal}
        onClose={() => setShowReassignModal(false)}
        title="Reassign Task"
        size="sm"
      >
        <YStack gap="$4">
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
          <XStack gap="$3">
            <Button variant="secondary" onPress={() => setShowReassignModal(false)} fullWidth>
              Cancel
            </Button>
            <Button variant="primary" onPress={handleReassign} fullWidth>
              Reassign
            </Button>
          </XStack>
        </YStack>
      </Modal>

      {/* Block Modal */}
      <Modal
        isOpen={showBlockModal}
        onClose={() => {
          setShowBlockModal(false)
          setBlockReason('')
        }}
        title="Block Task"
        size="sm"
      >
        <YStack gap="$4">
          <Textarea
            label="Reason for blocking"
            value={blockReason}
            onChange={(e) => setBlockReason(e.target.value)}
            placeholder="Enter the reason why this task is blocked..."
            rows={4}
            fullWidth
            required
          />
          <XStack gap="$3">
            <Button
              variant="secondary"
              onPress={() => {
                setShowBlockModal(false)
                setBlockReason('')
              }}
              fullWidth
            >
              Cancel
            </Button>
            <Button
              variant="danger"
              onPress={() => handleStatusChange('blocked', blockReason)}
              disabled={!blockReason.trim()}
              fullWidth
            >
              Block Task
            </Button>
          </XStack>
        </YStack>
      </Modal>

      {/* Edit Modal */}
      <Modal
        isOpen={showEditModal}
        onClose={() => setShowEditModal(false)}
        title="Edit Task Details"
        size="sm"
      >
        <YStack gap="$4">
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
          <XStack gap="$3">
            <Button variant="secondary" onPress={() => setShowEditModal(false)} fullWidth>
              Cancel
            </Button>
            <Button variant="primary" onPress={handleEditTask} fullWidth>
              Save Changes
            </Button>
          </XStack>
        </YStack>
      </Modal>

      {/* COI Comparison Viewer */}
      {task.document_link && (
        <COIComparisonViewer
          documentId={task.document_link} // Using document_link as document ID for now
          projectId={task.project_id}
          documentName={task.title}
          documentUrl={task.document_link}
          isOpen={showCOIComparison}
          onClose={() => setShowCOIComparison(false)}
          onApprove={() => {
            console.log('Document approved')
            // Could update task status here
          }}
          onRequestChanges={(comments) => {
            console.log('Request changes:', comments)
            // Could create a comment or task here
          }}
          onOverride={(reason) => {
            console.log('Override with reason:', reason)
            // Could update task/document status here
          }}
        />
      )}
    </>
  )
}
