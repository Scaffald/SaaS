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
import Button from '../Common/Button';
import Card from '../Common/Card';
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
const PRIORITY_CONFIG: Record<string, { label: string; color: string }> = {
  low: { label: 'Low', color: 'bg-slate-100 text-slate-700' },
  medium: { label: 'Medium', color: 'bg-blue-100 text-blue-700' },
  high: { label: 'High', color: 'bg-orange-100 text-orange-700' },
  urgent: { label: 'Urgent', color: 'bg-red-100 text-red-700' },
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
    <div className="space-y-6">
      {/* Toast notifications */}
      <div className="fixed top-4 right-4 z-50 space-y-2">
        {toasts.map((toast) => (
          <div
            key={toast.id}
            className={`px-4 py-3 rounded-lg shadow-lg text-sm font-medium ${
              toast.type === 'success'
                ? 'bg-success-100 text-success-800 border border-success-200'
                : 'bg-error-100 text-error-800 border border-error-200'
            }`}
          >
            {toast.message}
          </div>
        ))}
      </div>

      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-display text-3xl font-bold text-text-primary">
            Task Type Settings
          </h1>
          <p className="text-text-secondary text-lg mt-1">
            Manage task types and their default configurations
          </p>
        </div>
        <Button variant="primary" leftIcon={Plus} onClick={() => setShowForm(true)}>
          Create Task Type
        </Button>
      </div>

      {/* Filters */}
      <Card className="p-4">
        <div className="flex flex-col sm:flex-row gap-4">
          <div className="flex-1 relative">
            <Search
              className="absolute left-3 top-1/2 -translate-y-1/2 text-text-tertiary"
              size={20}
            />
            <input
              type="text"
              placeholder="Search task types..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2 bg-bg-primary border border-border rounded-lg text-text-primary placeholder-text-tertiary focus:outline-none focus:ring-2 focus:ring-primary-500"
            />
          </div>
          <div className="flex items-center gap-2">
            <Filter size={20} className="text-text-tertiary" />
            <Select
              options={categoryOptions}
              value={selectedCategory}
              onChange={(e) =>
                setSelectedCategory(e.target.value as TaskTypeCategory | 'all')
              }
              className="w-48"
            />
          </div>
        </div>
      </Card>

      {/* Task Types Table */}
      <Card>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-border">
                <th className="text-left px-4 py-3 text-sm font-semibold text-text-secondary">
                  Name
                </th>
                <th className="text-left px-4 py-3 text-sm font-semibold text-text-secondary">
                  Category
                </th>
                <th className="text-left px-4 py-3 text-sm font-semibold text-text-secondary">
                  Description
                </th>
                <th className="text-left px-4 py-3 text-sm font-semibold text-text-secondary">
                  Default Priority
                </th>
                <th className="text-left px-4 py-3 text-sm font-semibold text-text-secondary">
                  Due Date Offset
                </th>
                <th className="text-left px-4 py-3 text-sm font-semibold text-text-secondary">
                  Status
                </th>
                <th className="text-right px-4 py-3 text-sm font-semibold text-text-secondary">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody>
              {isLoading ? (
                <tr>
                  <td colSpan={7} className="px-4 py-8 text-center text-text-tertiary">
                    Loading task types...
                  </td>
                </tr>
              ) : filteredTaskTypes.length === 0 ? (
                <tr>
                  <td colSpan={7} className="px-4 py-8 text-center text-text-tertiary">
                    {searchQuery
                      ? 'No task types match your search'
                      : 'No task types found. Create your first one!'}
                  </td>
                </tr>
              ) : (
                filteredTaskTypes.map((taskType) => (
                  <tr
                    key={taskType.id}
                    className="border-b border-border hover:bg-bg-secondary/50 transition-colors"
                  >
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-3">
                        {taskType.color && (
                          <div
                            className="w-3 h-3 rounded-full"
                            style={{ backgroundColor: taskType.color }}
                          />
                        )}
                        <span className="font-medium text-text-primary">
                          {taskType.name}
                        </span>
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2 text-text-secondary">
                        {getCategoryIcon(taskType.category)}
                        <span>{CATEGORY_CONFIG[taskType.category].label}</span>
                      </div>
                    </td>
                    <td className="px-4 py-3 text-text-secondary max-w-xs truncate">
                      {taskType.description || '-'}
                    </td>
                    <td className="px-4 py-3">
                      <span
                        className={`px-2 py-1 rounded-full text-xs font-medium ${
                          PRIORITY_CONFIG[taskType.default_priority]?.color ||
                          'bg-slate-100 text-slate-700'
                        }`}
                      >
                        {PRIORITY_CONFIG[taskType.default_priority]?.label ||
                          taskType.default_priority}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-text-secondary">
                      {taskType.default_due_date_offset} days
                    </td>
                    <td className="px-4 py-3">
                      <span
                        className={`px-2 py-1 rounded-full text-xs font-medium ${
                          taskType.is_active
                            ? 'bg-success-100 text-success-700'
                            : 'bg-slate-100 text-slate-600'
                        }`}
                      >
                        {taskType.is_active ? 'Active' : 'Inactive'}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center justify-end gap-2">
                        <button
                          onClick={() => setEditingTaskType(taskType)}
                          className="p-2 text-text-tertiary hover:text-primary-600 hover:bg-primary-50 rounded-lg transition-colors"
                          title="Edit"
                        >
                          <Edit2 size={16} />
                        </button>
                        <button
                          onClick={() => setDeleteConfirm(taskType)}
                          className="p-2 text-text-tertiary hover:text-error-600 hover:bg-error-50 rounded-lg transition-colors"
                          title="Delete"
                        >
                          <Trash2 size={16} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </Card>

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
        <div className="space-y-4">
          <p className="text-text-secondary">
            Are you sure you want to delete{' '}
            <span className="font-semibold text-text-primary">
              {deleteConfirm?.name}
            </span>
            ? This action cannot be undone.
          </p>
          <div className="flex justify-end gap-3">
            <Button
              variant="ghost"
              onClick={() => setDeleteConfirm(null)}
              disabled={isSubmitting}
            >
              Cancel
            </Button>
            <Button
              variant="danger"
              onClick={handleDelete}
              disabled={isSubmitting}
            >
              {isSubmitting ? 'Deleting...' : 'Delete'}
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
