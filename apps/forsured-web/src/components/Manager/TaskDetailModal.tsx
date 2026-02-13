/* eslint-disable @typescript-eslint/no-unused-vars */
import { useState } from 'react'
import { X, Calendar, User, MessageSquare, CheckCircle2 } from 'lucide-react'
import { Stack, Row, Text, H2, H3, Card, Grid } from '@scaffald/ui'
import { Task } from '../../types'
import Modal from '../Common/Modal'
import Button from '../Common/Button'
import Textarea from '../Common/Textarea'
import Select from '../Common/Select'
import { formatDate } from '../../utils/dateHelpers'

interface TaskDetailModalProps {
  task: Task | null
  isOpen: boolean
  onClose: () => void
  onUpdateTask: (taskId: string, updates: Partial<Task>) => void
  availableUsers?: Array<{ id: string; name: string; role: string }>
}

export default function TaskDetailModal({
  task,
  isOpen,
  onClose,
  onUpdateTask,
  availableUsers = [],
}: TaskDetailModalProps) {
  const [comment, setComment] = useState('')
  const [completionNote, setCompletionNote] = useState('')
  const [selectedAssignee, setSelectedAssignee] = useState(task?.assigned_to_user_id || '')
  const [showCompletionForm, setShowCompletionForm] = useState(false)

  if (!task) return null

  const handleReassign = () => {
    if (selectedAssignee && selectedAssignee !== task.assigned_to_user_id) {
      onUpdateTask(task.id, { assigned_to_user_id: selectedAssignee })
      onClose()
    }
  }

  const handleComplete = () => {
    onUpdateTask(task.id, {
      status: 'completed' as any,
      metadata: {
        ...task.metadata,
        completion_note: completionNote,
        completed_at: new Date().toISOString(),
      },
    })
    setShowCompletionForm(false)
    setCompletionNote('')
    onClose()
  }

  const handleAddComment = () => {
    if (comment.trim()) {
      const comments = task.metadata?.comments || []
      onUpdateTask(task.id, {
        metadata: {
          ...task.metadata,
          comments: [
            ...comments,
            {
              id: Date.now().toString(),
              text: comment,
              author: 'Current User',
              timestamp: new Date().toISOString(),
            },
          ],
        },
      })
      setComment('')
    }
  }

  const getPriorityColorProps = (priority: string): React.CSSProperties => {
    switch (priority) {
      case 'urgent':
        return { color: 'var(--color-red-10)', backgroundColor: 'var(--color-red-2)' }
      case 'high':
        return { color: 'var(--color-orange-10)', backgroundColor: 'var(--color-orange-2)' }
      default:
        return { color: 'var(--color-blue-10)', backgroundColor: 'var(--color-blue-2)' }
    }
  }

  const getStatusColorProps = (status: string): React.CSSProperties => {
    switch (status) {
      case 'completed':
        return { color: 'var(--color-green-10)', backgroundColor: 'var(--color-green-2)' }
      case 'in_progress':
        return { color: 'var(--color-blue-10)', backgroundColor: 'var(--color-blue-2)' }
      case 'pending':
        return { color: 'var(--color-text-muted)', backgroundColor: 'var(--color-gray-2)' }
      default:
        return { color: 'var(--color-text-muted)', backgroundColor: 'var(--color-gray-2)' }
    }
  }

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="">
      <Stack gap={24}>
        <Row alignItems="flex-start" justifyContent="space-between">
          <Stack style={{ flex: 1 }}>
            <H2 style={{ fontSize: 28, fontWeight: 600, marginBottom: 8 }}>{task.title}</H2>
            <Row alignItems="center" gap={8}>
              <span
                style={{
                  paddingLeft: 8,
                  paddingRight: 8,
                  paddingTop: 4,
                  paddingBottom: 4,
                  fontSize: 12,
                  fontWeight: 500,
                  borderRadius: 8,
                  ...getPriorityColorProps(task.priority),
                }}
              >
                {task.priority}
              </span>
              <span
                style={{
                  paddingLeft: 8,
                  paddingRight: 8,
                  paddingTop: 4,
                  paddingBottom: 4,
                  fontSize: 12,
                  fontWeight: 500,
                  borderRadius: 8,
                  ...getStatusColorProps(task.status),
                }}
              >
                {task.status.replace('_', ' ')}
              </span>
            </Row>
          </Stack>
          <div onClick={onClose} style={{ cursor: 'pointer' }}>
            <X size={20} color="var(--color-text-muted)" />
          </div>
        </Row>

        {task.description && (
          <Stack>
            <H3 style={{ fontSize: 14, fontWeight: 500, marginBottom: 8 }}>Description</H3>
            <Text size="sm" muted>
              {task.description}
            </Text>
          </Stack>
        )}

        <Grid columns={{ base: 1, sm: 2 }} gap={16}>
          {task.due_date && (
            <Stack>
              <H3
                style={{
                  fontSize: 12,
                  fontWeight: 500,
                  color: 'var(--color-text-muted)',
                  marginBottom: 4,
                }}
              >
                Due Date
              </H3>
              <Row alignItems="center" gap={8}>
                <Calendar size={14} />
                <Text size="sm">{formatDate(task.due_date)}</Text>
              </Row>
            </Stack>
          )}

          <Stack>
            <H3
              style={{
                fontSize: 12,
                fontWeight: 500,
                color: 'var(--color-text-muted)',
                marginBottom: 4,
              }}
            >
              Task Type
            </H3>
            <Text size="sm" style={{ textTransform: 'capitalize' }}>
              {task.task_type || 'General'}
            </Text>
          </Stack>
        </Grid>

        {task.status !== 'completed' && (
          <>
            <Stack>
              <H3 style={{ fontSize: 14, fontWeight: 500, marginBottom: 8 }}>Reassign Task</H3>
              <Row alignItems="center" gap={8}>
                <Select
                  value={selectedAssignee}
                  onChange={(e) => setSelectedAssignee(e.target.value)}
                  style={{ flex: 1 }}
                  options={[
                    { value: '', label: 'Select assignee' },
                    ...availableUsers.map((user) => ({
                      value: user.id,
                      label: `${user.name} (${user.role})`,
                    })),
                  ]}
                />
                <Button
                  onPress={handleReassign}
                  disabled={!selectedAssignee || selectedAssignee === task.assigned_to_user_id}
                  size="sm"
                >
                  Reassign
                </Button>
              </Row>
            </Stack>

            <Stack>
              <H3 style={{ fontSize: 14, fontWeight: 500, marginBottom: 8 }}>Mark as Complete</H3>
              {!showCompletionForm ? (
                <Button
                  onPress={() => setShowCompletionForm(true)}
                  variant="secondary"
                  leftIcon={CheckCircle2}
                  fullWidth
                >
                  Complete Task
                </Button>
              ) : (
                <Card
                  style={{
                    padding: 16,
                    backgroundColor: 'var(--color-green-2)',
                    border: '1px solid var(--color-green-8)',
                    borderRadius: 12,
                  }}
                >
                  <Stack gap={12}>
                    <Textarea
                      value={completionNote}
                      onChange={(e) => setCompletionNote(e.target.value)}
                      placeholder="Add completion notes (optional)"
                      rows={3}
                    />
                    <Row gap={8}>
                      <Button onPress={handleComplete} variant="primary" style={{ flex: 1 }}>
                        Confirm Complete
                      </Button>
                      <Button
                        onPress={() => {
                          setShowCompletionForm(false)
                          setCompletionNote('')
                        }}
                        variant="ghost"
                        style={{ flex: 1 }}
                      >
                        Cancel
                      </Button>
                    </Row>
                  </Stack>
                </Card>
              )}
            </Stack>
          </>
        )}

        <Stack>
          <Row alignItems="center" gap={8} style={{ marginBottom: 8 }}>
            <MessageSquare size={16} />
            <H3 style={{ fontSize: 14, fontWeight: 500 }}>Comments</H3>
          </Row>

          <Stack gap={12} style={{ marginBottom: 12, maxHeight: 160, overflowY: 'auto' }}>
            {task.metadata?.comments?.length > 0 ? (
              task.metadata.comments.map((comment: any) => (
                <Card
                  key={comment.id}
                  style={{
                    padding: 12,
                    backgroundColor: 'var(--color-gray-2)',
                    borderRadius: 12,
                  }}
                >
                  <Row
                    alignItems="center"
                    justifyContent="space-between"
                    style={{ marginBottom: 4 }}
                  >
                    <Text size="xs" weight="medium">
                      {comment.author}
                    </Text>
                    <Text size="xs" muted>
                      {formatDate(comment.timestamp)}
                    </Text>
                  </Row>
                  <Text size="sm" muted>
                    {comment.text}
                  </Text>
                </Card>
              ))
            ) : (
              <Text size="sm" muted style={{ fontStyle: 'italic' }}>
                No comments yet
              </Text>
            )}
          </Stack>

          <Row gap={8}>
            <Textarea
              value={comment}
              onChange={(e) => setComment(e.target.value)}
              placeholder="Add a comment..."
              rows={2}
              style={{ flex: 1 }}
            />
            <Button onPress={handleAddComment} disabled={!comment.trim()} size="sm">
              Add
            </Button>
          </Row>
        </Stack>

        {task.metadata?.completion_note && (
          <Card
            style={{
              padding: 16,
              backgroundColor: 'var(--color-green-2)',
              border: '1px solid var(--color-green-8)',
              borderRadius: 12,
            }}
          >
            <H3
              style={{
                fontSize: 14,
                fontWeight: 500,
                color: 'var(--color-green-10)',
                marginBottom: 8,
              }}
            >
              Completion Notes
            </H3>
            <Text size="sm" muted>
              {task.metadata.completion_note}
            </Text>
          </Card>
        )}
      </Stack>
    </Modal>
  )
}
