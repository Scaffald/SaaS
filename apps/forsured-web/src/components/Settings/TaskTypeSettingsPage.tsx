/**
 * Task type definitions and settings page
 *
 * Admin interface for managing task types with table view, create/edit forms,
 * and visual distinction through icons and colors.
 */

import React, { useState, useMemo, useCallback, useEffect } from 'react'
import {
  Plus,
  Search,
  Edit2,
  Trash2,
  FileText,
  Shield,
  Clipboard,
  UserPlus,
  Settings,
  Filter,
} from 'lucide-react'
import { Stack, Row, Text, H1, Card, Button } from '@unicornlove/beyond-ui'
import ButtonCommon from '../Common/Button'
import CardCommon from '../Common/Card'
import Select from '../Common/Select'
import Modal from '../Common/Modal'
import TaskTypeForm, { TaskTypeFormData } from './TaskTypeForm'
import { TaskType, TaskTypeCategory } from '../../types'
import {
  getAllTaskTypes,
  createTaskType,
  updateTaskType,
  deleteTaskType,
  VALID_CATEGORIES,
  CreateTaskTypeInput,
  UpdateTaskTypeInput,
  UserContext,
} from '../../lib/tasks/taskTypeService'

// Category display names and icons
const CATEGORY_CONFIG: Record<
  TaskTypeCategory,
  { label: string; icon: React.ComponentType<{ size?: number; className?: string }> }
> = {
  document_review: { label: 'Document Review', icon: FileText },
  policy_management: { label: 'Policy Management', icon: Shield },
  compliance: { label: 'Compliance', icon: Clipboard },
  onboarding: { label: 'Onboarding', icon: UserPlus },
  custom: { label: 'Custom', icon: Settings },
}

// Priority display config - returns CSS properties
const getPriorityStyle = (priority: string): React.CSSProperties => {
  const config: Record<string, { backgroundColor: string; color: string }> = {
    low: { backgroundColor: 'var(--color-gray2)', color: 'var(--color-gray11)' },
    medium: { backgroundColor: 'var(--color-blue2)', color: 'var(--color-blue11)' },
    high: { backgroundColor: 'var(--color-orange2)', color: 'var(--color-orange11)' },
    urgent: { backgroundColor: 'var(--color-red2)', color: 'var(--color-red11)' },
  }
  return config[priority] || { backgroundColor: 'var(--color-gray2)', color: 'var(--color-gray11)' }
}

const PRIORITY_LABELS: Record<string, string> = {
  low: 'Low',
  medium: 'Medium',
  high: 'High',
  urgent: 'Urgent',
}

// Toast notification type
interface Toast {
  id: string
  type: 'success' | 'error'
  message: string
}

interface TaskTypeSettingsPageProps {
  currentUser?: UserContext
}

export default function TaskTypeSettingsPage({
  currentUser = { id: 'admin-1', role: 'admin' },
}: TaskTypeSettingsPageProps) {
  const [taskTypes, setTaskTypes] = useState<TaskType[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState('')
  const [selectedCategory, setSelectedCategory] = useState<TaskTypeCategory | 'all'>('all')
  const [showForm, setShowForm] = useState(false)
  const [editingTaskType, setEditingTaskType] = useState<TaskType | null>(null)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [deleteConfirm, setDeleteConfirm] = useState<TaskType | null>(null)
  const [toasts, setToasts] = useState<Toast[]>([])

  // Add toast notification
  const addToast = useCallback((type: 'success' | 'error', message: string) => {
    const id = crypto.randomUUID()
    setToasts((prev) => [...prev, { id, type, message }])
    // Auto-remove after 5 seconds
    setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id))
    }, 5000)
  }, [])

  // Fetch task types
  const fetchTaskTypes = useCallback(async () => {
    setIsLoading(true)
    const response = await getAllTaskTypes(
      selectedCategory === 'all' ? undefined : selectedCategory
    )
    if (response.success && response.data) {
      setTaskTypes(response.data)
    } else {
      addToast('error', response.error || 'Failed to load task types')
    }
    setIsLoading(false)
  }, [selectedCategory, addToast])

  useEffect(() => {
    fetchTaskTypes()
  }, [fetchTaskTypes])

  // Filter task types by search
  const filteredTaskTypes = useMemo(() => {
    if (!searchQuery) return taskTypes
    const query = searchQuery.toLowerCase()
    return taskTypes.filter(
      (tt) => tt.name.toLowerCase().includes(query) || tt.description?.toLowerCase().includes(query)
    )
  }, [taskTypes, searchQuery])

  // Handle create task type
  const handleCreate = useCallback(
    async (data: TaskTypeFormData) => {
      setIsSubmitting(true)
      const input: CreateTaskTypeInput = {
        name: data.name,
        description: data.description || undefined,
        default_priority: data.default_priority,
        default_due_date_offset: data.default_due_date_offset,
        category: data.category,
        icon: data.icon || undefined,
        color: data.color || undefined,
        default_assignee_role: data.default_assignee_role || undefined,
        is_active: data.is_active,
      }

      const response = await createTaskType(input, currentUser)
      setIsSubmitting(false)

      if (response.success) {
        addToast('success', 'Task type created successfully')
        setShowForm(false)
        fetchTaskTypes()
      } else {
        addToast('error', response.error || 'Failed to create task type')
      }
    },
    [currentUser, addToast, fetchTaskTypes]
  )

  // Handle update task type
  const handleUpdate = useCallback(
    async (data: TaskTypeFormData) => {
      if (!editingTaskType) return

      setIsSubmitting(true)
      const input: UpdateTaskTypeInput = {
        name: data.name,
        description: data.description || undefined,
        default_priority: data.default_priority,
        default_due_date_offset: data.default_due_date_offset,
        category: data.category,
        icon: data.icon || undefined,
        color: data.color || undefined,
        default_assignee_role: data.default_assignee_role || undefined,
        is_active: data.is_active,
      }

      const response = await updateTaskType(editingTaskType.id, input, currentUser)
      setIsSubmitting(false)

      if (response.success) {
        addToast('success', 'Task type updated successfully')
        setEditingTaskType(null)
        fetchTaskTypes()
      } else {
        addToast('error', response.error || 'Failed to update task type')
      }
    },
    [editingTaskType, currentUser, addToast, fetchTaskTypes]
  )

  // Handle delete task type
  const handleDelete = useCallback(async () => {
    if (!deleteConfirm) return

    setIsSubmitting(true)
    const response = await deleteTaskType(deleteConfirm.id, currentUser)
    setIsSubmitting(false)

    if (response.success) {
      addToast('success', 'Task type deleted successfully')
      setDeleteConfirm(null)
      fetchTaskTypes()
    } else {
      addToast('error', response.error || 'Failed to delete task type')
    }
  }, [deleteConfirm, currentUser, addToast, fetchTaskTypes])

  // Category filter options
  const categoryOptions = [
    { value: 'all', label: 'All Categories' },
    ...VALID_CATEGORIES.map((cat) => ({
      value: cat,
      label: CATEGORY_CONFIG[cat].label,
    })),
  ]

  // Get icon for category
  const getCategoryIcon = (category: TaskTypeCategory) => {
    const Icon = CATEGORY_CONFIG[category].icon
    return <Icon size={16} />
  }

  return (
    <Stack style={{ gap: 24 }}>
      {/* Toast notifications */}
      <Stack style={{ position: 'fixed', top: 16, right: 16, zIndex: 50, gap: 8 }}>
        {toasts.map((toast) => (
          <Card
            key={toast.id}
            style={{
              padding: '12px 16px',
              borderRadius: 8,
              boxShadow: '0 4px 6px rgba(0, 0, 0, 0.1)',
              fontSize: 14,
              fontWeight: 500,
              backgroundColor:
                toast.type === 'success' ? 'var(--color-green2)' : 'var(--color-red2)',
              color: toast.type === 'success' ? 'var(--color-green11)' : 'var(--color-red11)',
              borderColor: toast.type === 'success' ? 'var(--color-green6)' : 'var(--color-red6)',
              borderWidth: 1,
              borderStyle: 'solid',
            }}
          >
            {toast.message}
          </Card>
        ))}
      </Stack>

      {/* Header */}
      <Row style={{ alignItems: 'center', justifyContent: 'flex-end' }}>
        <ButtonCommon variant="primary" leftIcon={Plus} onPress={() => setShowForm(true)}>
          Create Task Type
        </ButtonCommon>
      </Row>

      {/* Filters */}
      <CardCommon style={{ padding: 16 }}>
        <Row style={{ flexDirection: 'column', gap: 16 }}>
          <Row style={{ flex: 1, position: 'relative' }}>
            <Stack
              style={{
                position: 'absolute',
                left: 12,
                top: '50%',
                transform: 'translateY(-50%)',
                zIndex: 1,
                pointerEvents: 'none',
              }}
            >
              <Search size={20} color="var(--color-color10)" />
            </Stack>
            <input
              type="text"
              placeholder="Search task types..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              style={{
                width: '100%',
                paddingLeft: 40,
                paddingRight: 16,
                paddingTop: 8,
                paddingBottom: 8,
                backgroundColor: 'var(--color-background)',
                border: '1px solid var(--color-border)',
                borderRadius: 8,
                color: 'var(--color-color12)',
                flex: 1,
              }}
            />
          </Row>
          <Row style={{ alignItems: 'center', gap: 8 }}>
            <Filter size={20} color="var(--color-color10)" />
            <Select
              options={categoryOptions}
              value={selectedCategory}
              onChange={(e) => setSelectedCategory(e.target.value as TaskTypeCategory | 'all')}
              style={{ width: 192 }}
            />
          </Row>
        </Row>
      </CardCommon>

      {/* Task Types Table */}
      <CardCommon>
        <Stack style={{ overflowX: 'auto' }}>
          <Stack>
            <Row
              style={{
                padding: 16,
                paddingTop: 12,
                paddingBottom: 12,
                borderBottom: '1px solid var(--color-border)',
              }}
            >
              <Text
                style={{
                  flex: 1,
                  textAlign: 'left',
                  paddingLeft: 16,
                  paddingRight: 16,
                  fontSize: 14,
                  fontWeight: 600,
                  color: 'var(--color-color11)',
                }}
              >
                Name
              </Text>
              <Text
                style={{
                  flex: 1,
                  textAlign: 'left',
                  paddingLeft: 16,
                  paddingRight: 16,
                  fontSize: 14,
                  fontWeight: 600,
                  color: 'var(--color-color11)',
                }}
              >
                Category
              </Text>
              <Text
                style={{
                  flex: 1,
                  textAlign: 'left',
                  paddingLeft: 16,
                  paddingRight: 16,
                  fontSize: 14,
                  fontWeight: 600,
                  color: 'var(--color-color11)',
                }}
              >
                Description
              </Text>
              <Text
                style={{
                  flex: 1,
                  textAlign: 'left',
                  paddingLeft: 16,
                  paddingRight: 16,
                  fontSize: 14,
                  fontWeight: 600,
                  color: 'var(--color-color11)',
                }}
              >
                Default Priority
              </Text>
              <Text
                style={{
                  flex: 1,
                  textAlign: 'left',
                  paddingLeft: 16,
                  paddingRight: 16,
                  fontSize: 14,
                  fontWeight: 600,
                  color: 'var(--color-color11)',
                }}
              >
                Due Date Offset
              </Text>
              <Text
                style={{
                  flex: 1,
                  textAlign: 'left',
                  paddingLeft: 16,
                  paddingRight: 16,
                  fontSize: 14,
                  fontWeight: 600,
                  color: 'var(--color-color11)',
                }}
              >
                Status
              </Text>
              <Text
                style={{
                  flex: 1,
                  textAlign: 'right',
                  paddingLeft: 16,
                  paddingRight: 16,
                  fontSize: 14,
                  fontWeight: 600,
                  color: 'var(--color-color11)',
                }}
              >
                Actions
              </Text>
            </Row>
            <Stack>
              {isLoading ? (
                <Row
                  style={{
                    padding: 16,
                    paddingTop: 32,
                    paddingBottom: 32,
                    justifyContent: 'center',
                    alignItems: 'center',
                  }}
                >
                  <Text style={{ color: 'var(--color-color10)' }}>Loading task types...</Text>
                </Row>
              ) : filteredTaskTypes.length === 0 ? (
                <Row
                  style={{
                    padding: 16,
                    paddingTop: 32,
                    paddingBottom: 32,
                    justifyContent: 'center',
                    alignItems: 'center',
                  }}
                >
                  <Text style={{ color: 'var(--color-color10)' }}>
                    {searchQuery
                      ? 'No task types match your search'
                      : 'No task types found. Create your first one!'}
                  </Text>
                </Row>
              ) : (
                filteredTaskTypes.map((taskType) => (
                  <Row
                    key={taskType.id}
                    style={{
                      borderBottom: '1px solid var(--color-border)',
                      padding: 12,
                      alignItems: 'center',
                    }}
                  >
                    <Row
                      style={{
                        flex: 1,
                        paddingLeft: 16,
                        paddingRight: 16,
                        alignItems: 'center',
                        gap: 12,
                      }}
                    >
                      {taskType.color && (
                        <div
                          style={{
                            width: 12,
                            height: 12,
                            borderRadius: '50%',
                            backgroundColor: taskType.color,
                          }}
                        />
                      )}
                      <Text style={{ fontWeight: 500, color: 'var(--color-color12)' }}>
                        {taskType.name}
                      </Text>
                    </Row>
                    <Row
                      style={{
                        flex: 1,
                        paddingLeft: 16,
                        paddingRight: 16,
                        alignItems: 'center',
                        gap: 8,
                      }}
                    >
                      {getCategoryIcon(taskType.category)}
                      <Text style={{ color: 'var(--color-color11)' }}>
                        {CATEGORY_CONFIG[taskType.category].label}
                      </Text>
                    </Row>
                    <Text
                      style={{
                        flex: 1,
                        paddingLeft: 16,
                        paddingRight: 16,
                        color: 'var(--color-color11)',
                        maxWidth: 320,
                        overflow: 'hidden',
                        textOverflow: 'ellipsis',
                        whiteSpace: 'nowrap',
                      }}
                    >
                      {taskType.description || '-'}
                    </Text>
                    <Row style={{ flex: 1, paddingLeft: 16, paddingRight: 16 }}>
                      <Text
                        style={{
                          paddingLeft: 8,
                          paddingRight: 8,
                          paddingTop: 4,
                          paddingBottom: 4,
                          borderRadius: 9999,
                          fontSize: 12,
                          fontWeight: 500,
                          ...getPriorityStyle(taskType.default_priority),
                        }}
                      >
                        {PRIORITY_LABELS[taskType.default_priority] || taskType.default_priority}
                      </Text>
                    </Row>
                    <Text
                      style={{
                        flex: 1,
                        paddingLeft: 16,
                        paddingRight: 16,
                        color: 'var(--color-color11)',
                      }}
                    >
                      {taskType.default_due_date_offset} days
                    </Text>
                    <Row style={{ flex: 1, paddingLeft: 16, paddingRight: 16 }}>
                      <Text
                        style={{
                          paddingLeft: 8,
                          paddingRight: 8,
                          paddingTop: 4,
                          paddingBottom: 4,
                          borderRadius: 9999,
                          fontSize: 12,
                          fontWeight: 500,
                          backgroundColor: taskType.is_active
                            ? 'var(--color-green2)'
                            : 'var(--color-gray2)',
                          color: taskType.is_active
                            ? 'var(--color-green11)'
                            : 'var(--color-gray11)',
                        }}
                      >
                        {taskType.is_active ? 'Active' : 'Inactive'}
                      </Text>
                    </Row>
                    <Row
                      style={{
                        flex: 1,
                        paddingLeft: 16,
                        paddingRight: 16,
                        alignItems: 'center',
                        justifyContent: 'flex-end',
                        gap: 8,
                      }}
                    >
                      <Button
                        variant="ghost"
                        onPress={() => setEditingTaskType(taskType)}
                        style={{
                          padding: 8,
                          color: 'var(--color-color10)',
                          borderRadius: 8,
                        }}
                      >
                        <Edit2 size={16} />
                      </Button>
                      <Button
                        variant="ghost"
                        onPress={() => setDeleteConfirm(taskType)}
                        style={{
                          padding: 8,
                          color: 'var(--color-color10)',
                          borderRadius: 8,
                        }}
                      >
                        <Trash2 size={16} />
                      </Button>
                    </Row>
                  </Row>
                ))
              )}
            </Stack>
          </Stack>
        </Stack>
      </CardCommon>

      {/* Create Modal */}
      <Modal
        isOpen={showForm}
        onClose={() => setShowForm(false)}
        title="Create Task Type"
        size="lg"
      >
        <TaskTypeForm
          onSubmit={handleCreate}
          onCancel={() => setShowForm(false)}
          isSubmitting={isSubmitting}
        />
      </Modal>

      {/* Edit Modal */}
      <Modal
        isOpen={!!editingTaskType}
        onClose={() => setEditingTaskType(null)}
        title="Edit Task Type"
        size="lg"
      >
        {editingTaskType && (
          <TaskTypeForm
            initialData={editingTaskType}
            onSubmit={handleUpdate}
            onCancel={() => setEditingTaskType(null)}
            isSubmitting={isSubmitting}
          />
        )}
      </Modal>

      {/* Delete Confirmation Modal */}
      <Modal
        isOpen={!!deleteConfirm}
        onClose={() => setDeleteConfirm(null)}
        title="Delete Task Type"
        size="sm"
      >
        <Stack style={{ gap: 16 }}>
          <Text style={{ color: 'var(--color-color11)' }}>
            Are you sure you want to delete{' '}
            <Text style={{ fontWeight: 600, color: 'var(--color-color12)' }}>
              {deleteConfirm?.name}
            </Text>
            ? This action cannot be undone.
          </Text>
          <Row style={{ justifyContent: 'flex-end', gap: 12 }}>
            <ButtonCommon
              variant="ghost"
              onPress={() => setDeleteConfirm(null)}
              disabled={isSubmitting}
            >
              Cancel
            </ButtonCommon>
            <ButtonCommon variant="danger" onPress={handleDelete} disabled={isSubmitting}>
              {isSubmitting ? 'Deleting...' : 'Delete'}
            </ButtonCommon>
          </Row>
        </Stack>
      </Modal>
    </Stack>
  )
}
