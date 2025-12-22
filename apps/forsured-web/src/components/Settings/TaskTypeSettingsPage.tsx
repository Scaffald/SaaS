/**
 * REQ-261: Task Type Definitions & Settings Page
 * TASK-3: Build Task Type Settings Page UI
 *
 * Admin interface for managing task types with table view, create/edit forms,
 * and visual distinction through icons and colors.
 */

import React, { useState, useMemo, useCallback, useEffect } from 'react';
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
} from 'lucide-react';
import { YStack, XStack, Text, H1, Card, Button } from '@unicornlove/ui';
import ButtonCommon from '../Common/Button';
import CardCommon from '../Common/Card';
import Select from '../Common/Select';
import Modal from '../Common/Modal';
import TaskTypeForm, { TaskTypeFormData } from './TaskTypeForm';
import { TaskType, TaskTypeCategory } from '../../types';
import {
  getAllTaskTypes,
  createTaskType,
  updateTaskType,
  deleteTaskType,
  VALID_CATEGORIES,
  CreateTaskTypeInput,
  UpdateTaskTypeInput,
  UserContext,
} from '../../lib/tasks/taskTypeService';

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
};

// Priority display config
const PRIORITY_CONFIG: Record<string, { label: string; backgroundColor: string; color: string }> = {
  low: { label: 'Low', backgroundColor: '$gray2', color: '$gray11' },
  medium: { label: 'Medium', backgroundColor: '$blue2', color: '$blue11' },
  high: { label: 'High', backgroundColor: '$orange2', color: '$orange11' },
  urgent: { label: 'Urgent', backgroundColor: '$red2', color: '$red11' },
};

// Toast notification type
interface Toast {
  id: string;
  type: 'success' | 'error';
  message: string;
}

interface TaskTypeSettingsPageProps {
  currentUser?: UserContext;
}

export default function TaskTypeSettingsPage({
  currentUser = { id: 'admin-1', role: 'admin' },
}: TaskTypeSettingsPageProps) {
  const [taskTypes, setTaskTypes] = useState<TaskType[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<TaskTypeCategory | 'all'>('all');
  const [showForm, setShowForm] = useState(false);
  const [editingTaskType, setEditingTaskType] = useState<TaskType | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [deleteConfirm, setDeleteConfirm] = useState<TaskType | null>(null);
  const [toasts, setToasts] = useState<Toast[]>([]);

  // Add toast notification
  const addToast = useCallback((type: 'success' | 'error', message: string) => {
    const id = crypto.randomUUID();
    setToasts((prev) => [...prev, { id, type, message }]);
    // Auto-remove after 5 seconds
    setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id));
    }, 5000);
  }, []);

  // Fetch task types
  const fetchTaskTypes = useCallback(async () => {
    setIsLoading(true);
    const response = await getAllTaskTypes(
      selectedCategory === 'all' ? undefined : selectedCategory
    );
    if (response.success && response.data) {
      setTaskTypes(response.data);
    } else {
      addToast('error', response.error || 'Failed to load task types');
    }
    setIsLoading(false);
  }, [selectedCategory, addToast]);

  useEffect(() => {
    fetchTaskTypes();
  }, [fetchTaskTypes]);

  // Filter task types by search
  const filteredTaskTypes = useMemo(() => {
    if (!searchQuery) return taskTypes;
    const query = searchQuery.toLowerCase();
    return taskTypes.filter(
      (tt) =>
        tt.name.toLowerCase().includes(query) ||
        tt.description?.toLowerCase().includes(query)
    );
  }, [taskTypes, searchQuery]);

  // Handle create task type
  const handleCreate = useCallback(
    async (data: TaskTypeFormData) => {
      setIsSubmitting(true);
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
      };

      const response = await createTaskType(input, currentUser);
      setIsSubmitting(false);

      if (response.success) {
        addToast('success', 'Task type created successfully');
        setShowForm(false);
        fetchTaskTypes();
      } else {
        addToast('error', response.error || 'Failed to create task type');
      }
    },
    [currentUser, addToast, fetchTaskTypes]
  );

  // Handle update task type
  const handleUpdate = useCallback(
    async (data: TaskTypeFormData) => {
      if (!editingTaskType) return;

      setIsSubmitting(true);
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
      };

      const response = await updateTaskType(editingTaskType.id, input, currentUser);
      setIsSubmitting(false);

      if (response.success) {
        addToast('success', 'Task type updated successfully');
        setEditingTaskType(null);
        fetchTaskTypes();
      } else {
        addToast('error', response.error || 'Failed to update task type');
      }
    },
    [editingTaskType, currentUser, addToast, fetchTaskTypes]
  );

  // Handle delete task type
  const handleDelete = useCallback(async () => {
    if (!deleteConfirm) return;

    setIsSubmitting(true);
    const response = await deleteTaskType(deleteConfirm.id, currentUser);
    setIsSubmitting(false);

    if (response.success) {
      addToast('success', 'Task type deleted successfully');
      setDeleteConfirm(null);
      fetchTaskTypes();
    } else {
      addToast('error', response.error || 'Failed to delete task type');
    }
  }, [deleteConfirm, currentUser, addToast, fetchTaskTypes]);

  // Category filter options
  const categoryOptions = [
    { value: 'all', label: 'All Categories' },
    ...VALID_CATEGORIES.map((cat) => ({
      value: cat,
      label: CATEGORY_CONFIG[cat].label,
    })),
  ];

  // Get icon for category
  const getCategoryIcon = (category: TaskTypeCategory) => {
    const Icon = CATEGORY_CONFIG[category].icon;
    return <Icon size={16} />;
  };

  return (
    <YStack gap="$6">
      {/* Toast notifications */}
      <YStack position="fixed" top="$4" right="$4" zIndex={50} gap="$2">
        {toasts.map((toast) => (
          <Card
            key={toast.id}
            padding="$4"
            paddingVertical="$3"
            borderRadius="$4"
            elevation={4}
            fontSize="$3"
            fontWeight="500"
            backgroundColor={toast.type === 'success' ? '$green2' : '$red2'}
            color={toast.type === 'success' ? '$green11' : '$red11'}
            borderColor={toast.type === 'success' ? '$green6' : '$red6'}
            borderWidth={1}
          >
            {toast.message}
          </Card>
        ))}
      </YStack>

      {/* Header */}
      <XStack alignItems="center" justifyContent="space-between">
        <YStack>
          <H1 fontSize="$9" fontWeight="bold" color="$color12">
            Task Type Settings
          </H1>
          <Text color="$color11" fontSize="$6" mt="$1">
            Manage task types and their default configurations
          </Text>
        </YStack>
        <ButtonCommon variant="primary" leftIcon={Plus} onClick={() => setShowForm(true)}>
          Create Task Type
        </ButtonCommon>
      </XStack>

      {/* Filters */}
      <CardCommon padding="$4">
        <XStack flexDirection="column" gap="$4" $gtSm={{ flexDirection: 'row' }}>
          <XStack flex={1} position="relative">
            <YStack position="absolute" left="$3" top="50%" style={{ transform: 'translateY(-50%)' }} zIndex={1} pointerEvents="none">
              <Search size={20} color="$color10" />
            </YStack>
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
                backgroundColor: 'var(--background)',
                border: '1px solid var(--borderColor)',
                borderRadius: 8,
                color: 'var(--color12)',
                flex: 1,
              }}
            />
          </XStack>
          <XStack alignItems="center" gap="$2">
            <Filter size={20} color="$color10" />
            <Select
              options={categoryOptions}
              value={selectedCategory}
              onChange={(e) =>
                setSelectedCategory(e.target.value as TaskTypeCategory | 'all')
              }
              style={{ width: 192 }}
            />
          </XStack>
        </XStack>
      </CardCommon>

      {/* Task Types Table */}
      <CardCommon>
        <YStack overflowX="auto">
          <YStack>
            <XStack padding="$4" paddingVertical="$3" borderBottomWidth={1} borderBottomColor="$borderColor">
              <Text flex={1} style={{ textAlign: 'left' }} paddingHorizontal="$4" fontSize="$3" fontWeight="600" color="$color11">Name</Text>
              <Text flex={1} style={{ textAlign: 'left' }} paddingHorizontal="$4" fontSize="$3" fontWeight="600" color="$color11">Category</Text>
              <Text flex={1} style={{ textAlign: 'left' }} paddingHorizontal="$4" fontSize="$3" fontWeight="600" color="$color11">Description</Text>
              <Text flex={1} style={{ textAlign: 'left' }} paddingHorizontal="$4" fontSize="$3" fontWeight="600" color="$color11">Default Priority</Text>
              <Text flex={1} style={{ textAlign: 'left' }} paddingHorizontal="$4" fontSize="$3" fontWeight="600" color="$color11">Due Date Offset</Text>
              <Text flex={1} style={{ textAlign: 'left' }} paddingHorizontal="$4" fontSize="$3" fontWeight="600" color="$color11">Status</Text>
              <Text flex={1} style={{ textAlign: 'right' }} paddingHorizontal="$4" fontSize="$3" fontWeight="600" color="$color11">Actions</Text>
            </XStack>
            <YStack>
              {isLoading ? (
                <XStack padding="$4" paddingVertical="$8" justifyContent="center" alignItems="center">
                  <Text color="$color10">Loading task types...</Text>
                </XStack>
              ) : filteredTaskTypes.length === 0 ? (
                <XStack padding="$4" paddingVertical="$8" justifyContent="center" alignItems="center">
                  <Text color="$color10">
                    {searchQuery
                      ? 'No task types match your search'
                      : 'No task types found. Create your first one!'}
                  </Text>
                </XStack>
              ) : (
                filteredTaskTypes.map((taskType, idx) => (
                  <XStack
                    key={taskType.id}
                    borderBottomWidth={1}
                    borderBottomColor="$borderColor"
                    hoverStyle={{ backgroundColor: '$backgroundHover' }}
                    padding="$3"
                    alignItems="center"
                  >
                    <XStack flex={1} paddingHorizontal="$4" alignItems="center" gap="$3">
                      {taskType.color && (
                        <YStack
                          width={12}
                          height={12}
                          borderRadius={9999}
                          style={{ backgroundColor: taskType.color }}
                        />
                      )}
                      <Text fontWeight="500" color="$color12">
                        {taskType.name}
                      </Text>
                    </XStack>
                    <XStack flex={1} paddingHorizontal="$4" alignItems="center" gap="$2">
                      {getCategoryIcon(taskType.category)}
                      <Text color="$color11">{CATEGORY_CONFIG[taskType.category].label}</Text>
                    </XStack>
                    <Text flex={1} paddingHorizontal="$4" color="$color11" maxWidth={320} numberOfLines={1}>
                      {taskType.description || '-'}
                    </Text>
                    <XStack flex={1} paddingHorizontal="$4">
                      <Text
                        paddingHorizontal="$2"
                        paddingVertical="$1"
                        borderRadius={9999}
                        fontSize="$2"
                        fontWeight="500"
                        backgroundColor={PRIORITY_CONFIG[taskType.default_priority]?.backgroundColor || '$gray2'}
                        color={PRIORITY_CONFIG[taskType.default_priority]?.color || '$gray11'}
                      >
                        {PRIORITY_CONFIG[taskType.default_priority]?.label ||
                          taskType.default_priority}
                      </Text>
                    </XStack>
                    <Text flex={1} paddingHorizontal="$4" color="$color11">
                      {taskType.default_due_date_offset} days
                    </Text>
                    <XStack flex={1} paddingHorizontal="$4">
                      <Text
                        paddingHorizontal="$2"
                        paddingVertical="$1"
                        borderRadius={9999}
                        fontSize="$2"
                        fontWeight="500"
                        backgroundColor={taskType.is_active ? '$green2' : '$gray2'}
                        color={taskType.is_active ? '$green11' : '$gray11'}
                      >
                        {taskType.is_active ? 'Active' : 'Inactive'}
                      </Text>
                    </XStack>
                    <XStack flex={1} paddingHorizontal="$4" alignItems="center" justifyContent="flex-end" gap="$2">
                      <Button
                        variant="ghost"
                        onPress={() => setEditingTaskType(taskType)}
                        padding="$2"
                        color="$color10"
                        hoverStyle={{ color: '$blue10', backgroundColor: '$blue2' }}
                        borderRadius="$4"
                      >
                        <Edit2 size={16} />
                      </Button>
                      <Button
                        variant="ghost"
                        onPress={() => setDeleteConfirm(taskType)}
                        padding="$2"
                        color="$color10"
                        hoverStyle={{ color: '$red10', backgroundColor: '$red2' }}
                        borderRadius="$4"
                      >
                        <Trash2 size={16} />
                      </Button>
                    </XStack>
                  </XStack>
                ))
              )}
            </YStack>
          </YStack>
        </YStack>
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
        <YStack gap="$4">
          <Text color="$color11">
            Are you sure you want to delete{' '}
            <Text fontWeight="600" color="$color12">
              {deleteConfirm?.name}
            </Text>
            ? This action cannot be undone.
          </Text>
          <XStack justifyContent="flex-end" gap="$3">
            <ButtonCommon
              variant="ghost"
              onClick={() => setDeleteConfirm(null)}
              disabled={isSubmitting}
            >
              Cancel
            </ButtonCommon>
            <ButtonCommon
              variant="danger"
              onClick={handleDelete}
              disabled={isSubmitting}
            >
              {isSubmitting ? 'Deleting...' : 'Delete'}
            </ButtonCommon>
          </XStack>
        </YStack>
      </Modal>
    </YStack>
  );
}
