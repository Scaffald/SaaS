import React, { useState, useEffect, useCallback } from 'react';
import { X, Info } from 'lucide-react';
import { Task, BrokerClient, PolicyData, Project, User, TaskType, TaskTypeCategory } from '../../types';
import Button from '../Common/Button';
import { getActiveTaskTypes } from '../../lib/tasks/taskTypeService';

interface TaskModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (task: Partial<Task>) => Promise<void>;
  task?: Task;
  clients: BrokerClient[];
  policies: PolicyData[];
  projects: Project[];
  users: User[];
  currentUserId?: string;
}

export default function TaskModal({
  isOpen,
  onClose,
  onSave,
  task,
  clients,
  policies,
  projects,
  users,
  currentUserId,
}: TaskModalProps) {
  const [formData, setFormData] = useState<Partial<Task>>({
    title: '',
    description: '',
    task_type: 'general',
    priority: 'normal',
    status: 'pending',
    origin_role: 'broker',
    target_role: 'subcontractor',
    client_id: '',
    project_id: '',
    policy_id: '',
    assigned_to_user_id: '',
    due_date: '',
    document_link: '',
  });

  const [filteredPolicies, setFilteredPolicies] = useState<PolicyData[]>([]);
  const [filteredProjects, setFilteredProjects] = useState<Project[]>([]);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // REQ-261: Task Type integration state
  const [taskTypes, setTaskTypes] = useState<TaskType[]>([]);
  const [taskTypesLoading, setTaskTypesLoading] = useState(true);
  const [selectedTaskType, setSelectedTaskType] = useState<TaskType | null>(null);

  // Category display names for grouping
  const CATEGORY_LABELS: Record<TaskTypeCategory, string> = {
    document_review: 'Document Review',
    policy_management: 'Policy Management',
    compliance: 'Compliance',
    onboarding: 'Onboarding',
    custom: 'Custom',
  };

  // REQ-261: Fetch task types on mount
  const fetchTaskTypes = useCallback(async () => {
    setTaskTypesLoading(true);
    const response = await getActiveTaskTypes();
    if (response.success && response.data) {
      setTaskTypes(response.data);
    }
    setTaskTypesLoading(false);
  }, []);

  useEffect(() => {
    fetchTaskTypes();
  }, [fetchTaskTypes]);

  // REQ-261: Group task types by category
  const taskTypesByCategory = taskTypes.reduce<Record<TaskTypeCategory, TaskType[]>>(
    (acc, tt) => {
      if (!acc[tt.category]) {
        acc[tt.category] = [];
      }
      acc[tt.category].push(tt);
      return acc;
    },
    {} as Record<TaskTypeCategory, TaskType[]>
  );

  // REQ-261: Handle task type selection and auto-populate defaults
  const handleTaskTypeChange = (taskTypeId: string) => {
    const selectedType = taskTypes.find((tt) => tt.id === taskTypeId);
    setSelectedTaskType(selectedType || null);

    if (selectedType) {
      // Calculate due date from offset
      let newDueDate = formData.due_date;
      if (selectedType.default_due_date_offset) {
        const dueDate = new Date();
        dueDate.setDate(dueDate.getDate() + selectedType.default_due_date_offset);
        newDueDate = dueDate.toISOString().split('T')[0];
      }

      // Map TaskType priority to Task priority (handle 'urgent' -> 'urgent', 'high' -> 'high', etc.)
      const priorityMap: Record<string, Task['priority']> = {
        low: 'low',
        medium: 'normal',
        high: 'high',
        urgent: 'urgent',
      };

      setFormData((prev) => ({
        ...prev,
        task_type_id: selectedType.id,
        task_type: selectedType.name.toLowerCase().replace(/\s+/g, '_') as Task['task_type'],
        priority: priorityMap[selectedType.default_priority] || prev.priority,
        due_date: newDueDate || prev.due_date,
      }));
    } else {
      setFormData((prev) => ({
        ...prev,
        task_type_id: undefined,
      }));
    }
  };

  useEffect(() => {
    if (task) {
      setFormData({
        title: task.title,
        description: task.description || '',
        task_type: task.task_type,
        priority: task.priority,
        status: task.status,
        origin_role: task.origin_role,
        target_role: task.target_role,
        client_id: task.client_id || '',
        project_id: task.project_id || '',
        policy_id: task.policy_id || '',
        assigned_to_user_id: task.assigned_to_user_id || '',
        due_date: task.due_date
          ? new Date(task.due_date).toISOString().split('T')[0]
          : '',
        document_link: task.document_link || '',
      });
    } else {
      setFormData({
        title: '',
        description: '',
        task_type: 'general',
        priority: 'normal',
        status: 'pending',
        origin_role: 'broker',
        target_role: 'subcontractor',
        client_id: '',
        project_id: '',
        policy_id: '',
        assigned_to_user_id: '',
        due_date: '',
        document_link: '',
        created_by_user_id: currentUserId,
      });
    }
  }, [task, isOpen, currentUserId]);

  useEffect(() => {
    if (formData.client_id) {
      setFilteredPolicies(
        policies.filter((p) => p.client_id === formData.client_id)
      );
      setFilteredProjects(
        projects.filter((p) => p.client_id === formData.client_id)
      );
    } else {
      setFilteredPolicies([]);
      setFilteredProjects([]);
    }
  }, [formData.client_id, policies, projects]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!formData.title?.trim()) {
      setError('Title is required');
      return;
    }

    if (!formData.assigned_to_user_id) {
      setError('Please assign this task to someone');
      return;
    }

    setIsSaving(true);
    try {
      await onSave(formData);
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to save task');
    } finally {
      setIsSaving(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-surface rounded-lg shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        <div className="sticky top-0 bg-surface border-b border-border p-6 flex items-center justify-between">
          <h2 className="text-xl font-semibold text-text-primary">
            {task ? 'Edit Task' : 'Create New Task'}
          </h2>
          <button
            onClick={onClose}
            className="text-text-secondary hover:text-text-primary transition-colors"
          >
            <X size={24} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          {error && (
            <div className="bg-error-50 border border-error-300 text-error-700 px-4 py-3 rounded">
              {error}
            </div>
          )}

          <div>
            <label className="block text-sm font-medium text-text-primary mb-2">
              Task Title *
            </label>
            <input
              type="text"
              value={formData.title}
              onChange={(e) =>
                setFormData({ ...formData, title: e.target.value })
              }
              className="w-full px-4 py-2 border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
              placeholder="Enter task title"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-text-primary mb-2">
              Description
            </label>
            <textarea
              value={formData.description}
              onChange={(e) =>
                setFormData({ ...formData, description: e.target.value })
              }
              className="w-full px-4 py-2 border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
              rows={3}
              placeholder="Provide additional details about the task"
            />
          </div>

          {/* REQ-261: Task Type selection with descriptions */}
          <div className="space-y-2">
            <label className="block text-sm font-medium text-text-primary">
              Task Type
            </label>
            <select
              value={selectedTaskType?.id || ''}
              onChange={(e) => handleTaskTypeChange(e.target.value)}
              className="w-full px-4 py-2 border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
              disabled={taskTypesLoading}
            >
              <option value="">
                {taskTypesLoading ? 'Loading task types...' : 'Select task type (optional)'}
              </option>
              {Object.entries(taskTypesByCategory).map(([category, types]) => (
                <optgroup key={category} label={CATEGORY_LABELS[category as TaskTypeCategory]}>
                  {types.map((tt) => (
                    <option key={tt.id} value={tt.id}>
                      {tt.name}
                    </option>
                  ))}
                </optgroup>
              ))}
            </select>
            {selectedTaskType?.description && (
              <div className="flex items-start gap-2 p-3 bg-primary-50 border border-primary-100 rounded-lg text-sm">
                <Info size={16} className="text-primary-600 mt-0.5 flex-shrink-0" />
                <span className="text-primary-800">{selectedTaskType.description}</span>
              </div>
            )}
            {selectedTaskType && (
              <p className="text-xs text-text-tertiary">
                Defaults applied: Priority = {selectedTaskType.default_priority}, Due in {selectedTaskType.default_due_date_offset} days
              </p>
            )}
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-text-primary mb-2">
                Priority
              </label>
              <select
                value={formData.priority}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    priority: e.target.value as Task['priority'],
                  })
                }
                className="w-full px-4 py-2 border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
              >
                <option value="urgent">Urgent</option>
                <option value="high">High</option>
                <option value="normal">Normal</option>
                <option value="low">Low</option>
              </select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-text-primary mb-2">
                Status
              </label>
              <select
                value={formData.status}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    status: e.target.value as Task['status'],
                  })
                }
                className="w-full px-4 py-2 border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
              >
                <option value="draft">Draft</option>
                <option value="pending">Pending</option>
                <option value="in_progress">In Progress</option>
                <option value="awaiting_response">Awaiting Response</option>
                <option value="completed">Completed</option>
                <option value="escalated">Escalated</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-text-primary mb-2">
                Assign To *
              </label>
              <select
                value={formData.assigned_to_user_id}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    assigned_to_user_id: e.target.value,
                  })
                }
                className="w-full px-4 py-2 border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
                required
              >
                <option value="">Select user</option>
                {users.map((user) => (
                  <option key={user.id} value={user.id}>
                    {user.name} ({user.role})
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-text-primary mb-2">
              Client
            </label>
            <select
              value={formData.client_id}
              onChange={(e) =>
                setFormData({
                  ...formData,
                  client_id: e.target.value,
                  project_id: '',
                  policy_id: '',
                })
              }
              className="w-full px-4 py-2 border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
            >
              <option value="">Select client (optional)</option>
              {clients.map((client) => (
                <option key={client.id} value={client.id}>
                  {client.company_name}
                </option>
              ))}
            </select>
          </div>

          {formData.client_id && (
            <>
              <div>
                <label className="block text-sm font-medium text-text-primary mb-2">
                  Project
                </label>
                <select
                  value={formData.project_id}
                  onChange={(e) =>
                    setFormData({ ...formData, project_id: e.target.value })
                  }
                  className="w-full px-4 py-2 border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
                >
                  <option value="">Select project (optional)</option>
                  {filteredProjects.map((project) => (
                    <option key={project.id} value={project.id}>
                      {project.name}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-text-primary mb-2">
                  Related Policy
                </label>
                <select
                  value={formData.policy_id}
                  onChange={(e) =>
                    setFormData({ ...formData, policy_id: e.target.value })
                  }
                  className="w-full px-4 py-2 border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
                >
                  <option value="">Select policy (optional)</option>
                  {filteredPolicies.map((policy) => (
                    <option key={policy.id} value={policy.id}>
                      {policy.policy_type.replace('_', ' ')} -{' '}
                      {policy.policy_number}
                    </option>
                  ))}
                </select>
              </div>
            </>
          )}

          <div>
            <label className="block text-sm font-medium text-text-primary mb-2">
              Due Date
            </label>
            <input
              type="date"
              value={formData.due_date}
              onChange={(e) =>
                setFormData({ ...formData, due_date: e.target.value })
              }
              className="w-full px-4 py-2 border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-text-primary mb-2">
              Document Link
            </label>
            <input
              type="url"
              value={formData.document_link}
              onChange={(e) =>
                setFormData({ ...formData, document_link: e.target.value })
              }
              className="w-full px-4 py-2 border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
              placeholder="https://example.com/document.pdf"
            />
          </div>

          <div className="flex items-center justify-end space-x-3 pt-6 border-t border-border">
            <Button
              type="button"
              variant="ghost"
              onClick={onClose}
              disabled={isSaving}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={isSaving}>
              {isSaving ? 'Saving...' : task ? 'Update Task' : 'Create Task'}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}
