import { useState, useEffect, useCallback } from 'react';
import { X, Info } from 'lucide-react';
import { Stack, Row, Text, H2, Input, Card } from '@unicornlove/beyond-ui';
import Textarea from '../Common/Textarea';
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

  // Task Type integration state
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

  // Fetch task types on mount
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

  // Group task types by category
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

  // Handle task type selection and auto-populate defaults
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

  const labelStyle: React.CSSProperties = {
    fontSize: 14,
    fontWeight: 500,
    color: 'var(--color-text)',
    marginBottom: 8,
    display: 'block',
  };

  const inputStyle: React.CSSProperties = {
    width: '100%',
    padding: '8px 16px',
    border: '1px solid var(--color-border)',
    borderRadius: 8,
    fontSize: 14,
  };

  const selectStyle: React.CSSProperties = {
    width: '100%',
    padding: '8px 16px',
    border: '1px solid var(--color-border)',
    borderRadius: 8,
    fontSize: 14,
    backgroundColor: 'var(--color-background)',
  };

  return (
    <Stack
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        backgroundColor: 'rgba(0,0,0,0.5)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 50,
        padding: 16,
      }}
    >
      <Card
        style={{
          backgroundColor: 'var(--color-background)',
          borderRadius: 12,
          maxWidth: 672,
          width: '100%',
          maxHeight: '90vh',
          overflowY: 'auto',
        }}
      >
        <Row
          alignItems="center"
          justifyContent="space-between"
          style={{
            position: 'sticky',
            top: 0,
            backgroundColor: 'var(--color-background)',
            borderBottom: '1px solid var(--color-border)',
            padding: 24,
            zIndex: 1,
          }}
        >
          <H2 style={{ fontSize: 24, fontWeight: 600, color: 'var(--color-text)' }}>
            {task ? 'Edit Task' : 'Create New Task'}
          </H2>
          <button
            onClick={onClose}
            style={{
              background: 'none',
              border: 'none',
              cursor: 'pointer',
              color: 'var(--color-text-muted)',
              padding: 4,
            }}
          >
            <X size={24} />
          </button>
        </Row>

        <form onSubmit={handleSubmit} style={{ padding: 24 }}>
          <Stack gap={24}>
            {error && (
              <Stack
                style={{
                  backgroundColor: 'var(--color-red-2)',
                  border: '1px solid var(--color-red-6)',
                  padding: '12px 16px',
                  borderRadius: 8,
                }}
              >
                <Text style={{ color: 'var(--color-red-11)' }}>{error}</Text>
              </Stack>
            )}

            <Stack>
              <label style={labelStyle}>Task Title *</label>
              <Input
                type="text"
                value={formData.title}
                onChange={(e) =>
                  setFormData({ ...formData, title: e.target.value })
                }
                placeholder="Enter task title"
                required
                style={inputStyle}
              />
            </Stack>

            <Stack>
              <label style={labelStyle}>Description</label>
              <Textarea
                value={formData.description}
                onChange={(e) =>
                  setFormData({ ...formData, description: e.target.value })
                }
                placeholder="Provide additional details about the task"
                style={{ ...inputStyle, minHeight: 80 }}
              />
            </Stack>

            {/* Task Type selection with descriptions */}
            <Stack gap={8}>
              <label style={labelStyle}>Task Type</label>
              <select
                value={selectedTaskType?.id || ''}
                onChange={(e) => handleTaskTypeChange(e.target.value)}
                style={selectStyle}
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
                <Row
                  alignItems="flex-start"
                  gap={8}
                  style={{
                    padding: 12,
                    backgroundColor: 'var(--color-blue-2)',
                    border: '1px solid var(--color-blue-4)',
                    borderRadius: 8,
                  }}
                >
                  <Info size={16} style={{ color: 'var(--color-blue-10)', marginTop: 2, flexShrink: 0 }} />
                  <Text size="sm" style={{ color: 'var(--color-blue-12)' }}>{selectedTaskType.description}</Text>
                </Row>
              )}
              {selectedTaskType && (
                <Text size="xs" muted>
                  Defaults applied: Priority = {selectedTaskType.default_priority}, Due in {selectedTaskType.default_due_date_offset} days
                </Text>
              )}
            </Stack>

            <Row gap={16} style={{ flexWrap: 'wrap' }}>
              <Stack style={{ flex: 1, minWidth: '45%' }}>
                <label style={labelStyle}>Priority</label>
                <select
                  value={formData.priority}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      priority: e.target.value as Task['priority'],
                    })
                  }
                  style={selectStyle}
                >
                  <option value="urgent">Urgent</option>
                  <option value="high">High</option>
                  <option value="normal">Normal</option>
                  <option value="low">Low</option>
                </select>
              </Stack>
            </Row>

            <Row gap={16} style={{ flexWrap: 'wrap' }}>
              <Stack style={{ flex: 1, minWidth: '45%' }}>
                <label style={labelStyle}>Status</label>
                <select
                  value={formData.status}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      status: e.target.value as Task['status'],
                    })
                  }
                  style={selectStyle}
                >
                  <option value="draft">Draft</option>
                  <option value="pending">Pending</option>
                  <option value="in_progress">In Progress</option>
                  <option value="awaiting_response">Awaiting Response</option>
                  <option value="completed">Completed</option>
                  <option value="escalated">Escalated</option>
                </select>
              </Stack>

              <Stack style={{ flex: 1, minWidth: '45%' }}>
                <label style={labelStyle}>Assign To *</label>
                <select
                  value={formData.assigned_to_user_id}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      assigned_to_user_id: e.target.value,
                    })
                  }
                  style={selectStyle}
                  required
                >
                  <option value="">Select user</option>
                  {(users || []).map((user) => (
                    <option key={user.id} value={user.id}>
                      {user.name} ({user.role})
                    </option>
                  ))}
                </select>
              </Stack>
            </Row>

            <Stack>
              <label style={labelStyle}>Client</label>
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
                style={selectStyle}
              >
                <option value="">Select client (optional)</option>
                {(clients || []).map((client) => (
                  <option key={client.id} value={client.id}>
                    {client.company_name}
                  </option>
                ))}
              </select>
            </Stack>

            {formData.client_id && (
              <>
                <Stack>
                  <label style={labelStyle}>Project</label>
                  <select
                    value={formData.project_id}
                    onChange={(e) =>
                      setFormData({ ...formData, project_id: e.target.value })
                    }
                    style={selectStyle}
                  >
                    <option value="">Select project (optional)</option>
                    {filteredProjects.map((project) => (
                      <option key={project.id} value={project.id}>
                        {project.name}
                      </option>
                    ))}
                  </select>
                </Stack>

                <Stack>
                  <label style={labelStyle}>Related Policy</label>
                  <select
                    value={formData.policy_id}
                    onChange={(e) =>
                      setFormData({ ...formData, policy_id: e.target.value })
                    }
                    style={selectStyle}
                  >
                    <option value="">Select policy (optional)</option>
                    {filteredPolicies.map((policy) => (
                      <option key={policy.id} value={policy.id}>
                        {policy.policy_type.replace('_', ' ')} -{' '}
                        {policy.policy_number}
                      </option>
                    ))}
                  </select>
                </Stack>
              </>
            )}

            <Stack>
              <label style={labelStyle}>Due Date</label>
              <Input
                type="date"
                value={formData.due_date}
                onChange={(e) =>
                  setFormData({ ...formData, due_date: e.target.value })
                }
                style={inputStyle}
              />
            </Stack>

            <Stack>
              <label style={labelStyle}>Document Link</label>
              <Input
                type="url"
                value={formData.document_link}
                onChange={(e) =>
                  setFormData({ ...formData, document_link: e.target.value })
                }
                placeholder="https://example.com/document.pdf"
                style={inputStyle}
              />
            </Stack>

            <Row
              alignItems="center"
              justifyContent="flex-end"
              gap={12}
              style={{
                paddingTop: 24,
                borderTop: '1px solid var(--color-border)',
              }}
            >
              <Button
                type="button"
                variant="ghost"
                onPress={onClose}
                disabled={isSaving}
              >
                Cancel
              </Button>
              <Button type="submit" disabled={isSaving}>
                {isSaving ? 'Saving...' : task ? 'Update Task' : 'Create Task'}
              </Button>
            </Row>
          </Stack>
        </form>
      </Card>
    </Stack>
  );
}
