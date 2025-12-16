import { useState, useEffect, useCallback } from 'react';
import { X, Info } from 'lucide-react';
import { YStack, XStack, Text, H2, Input, TextArea, Card, Label } from '@unicornlove/ui';
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
    <YStack
      position="fixed"
      top={0}
      left={0}
      right={0}
      bottom={0}
      backgroundColor="rgba(0,0,0,0.5)"
      alignItems="center"
      justifyContent="center"
      zIndex={50}
      padding="$4"
    >
      <Card
        backgroundColor="$background"
        borderRadius="$4"
        elevation={5}
        maxWidth={672}
        width="100%"
        maxHeight="90vh"
        overflowY="auto"
      >
        <XStack
          position="sticky"
          top={0}
          backgroundColor="$background"
          borderBottomWidth={1}
          borderColor="$borderColor"
          padding="$6"
          alignItems="center"
          justifyContent="space-between"
        >
          <H2 fontSize="$7" fontWeight="600" color="$color12">
            {task ? 'Edit Task' : 'Create New Task'}
          </H2>
          <XStack
            cursor="pointer"
            color="$color11"
            hoverStyle={{ color: '$color12' }}
            onClick={onClose}
          >
            <X size={24} />
          </XStack>
        </XStack>

        <YStack component="form" onSubmit={handleSubmit} padding="$6" gap="$6">
          {error && (
            <YStack
              backgroundColor="$red2"
              borderWidth={1}
              borderColor="$red6"
              color="$red11"
              paddingHorizontal="$4"
              paddingVertical="$3"
              borderRadius="$2"
            >
              <Text color="$red11">{error}</Text>
            </YStack>
          )}

          <YStack>
            <Label fontSize="$3" fontWeight="500" color="$color12" marginBottom="$2">
              Task Title *
            </Label>
            <Input
              type="text"
              value={formData.title}
              onChange={(e) =>
                setFormData({ ...formData, title: e.target.value })
              }
              width="100%"
              paddingHorizontal="$4"
              paddingVertical="$2"
              borderWidth={1}
              borderColor="$borderColor"
              borderRadius="$4"
              placeholder="Enter task title"
              required
            />
          </YStack>

          <YStack>
            <Label fontSize="$3" fontWeight="500" color="$color12" marginBottom="$2">
              Description
            </Label>
            <TextArea
              value={formData.description}
              onChange={(e) =>
                setFormData({ ...formData, description: e.target.value })
              }
              width="100%"
              paddingHorizontal="$4"
              paddingVertical="$2"
              borderWidth={1}
              borderColor="$borderColor"
              borderRadius="$4"
              minHeight={80}
              placeholder="Provide additional details about the task"
            />
          </YStack>

          {/* REQ-261: Task Type selection with descriptions */}
          <YStack gap="$2">
            <Label fontSize="$3" fontWeight="500" color="$color12">
              Task Type
            </Label>
            <select
              value={selectedTaskType?.id || ''}
              onChange={(e) => handleTaskTypeChange(e.target.value)}
              style={{
                width: '100%',
                padding: '8px 16px',
                border: '1px solid var(--borderColor)',
                borderRadius: '8px',
                fontSize: '14px',
              }}
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
              <XStack
                alignItems="flex-start"
                gap="$2"
                padding="$3"
                backgroundColor="$blue2"
                borderWidth={1}
                borderColor="$blue4"
                borderRadius="$4"
              >
                <Info size={16} color="$blue10" marginTop={2} flexShrink={0} />
                <Text fontSize="$3" color="$blue12">{selectedTaskType.description}</Text>
              </XStack>
            )}
            {selectedTaskType && (
              <Text fontSize="$1" color="$color10">
                Defaults applied: Priority = {selectedTaskType.default_priority}, Due in {selectedTaskType.default_due_date_offset} days
              </Text>
            )}
          </YStack>

          <XStack gap="$4" flexWrap="wrap">
            <YStack flex={1} minWidth="45%">
              <Label fontSize="$3" fontWeight="500" color="$color12" marginBottom="$2">
                Priority
              </Label>
              <select
                value={formData.priority}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    priority: e.target.value as Task['priority'],
                  })
                }
                style={{
                  width: '100%',
                  padding: '8px 16px',
                  border: '1px solid var(--borderColor)',
                  borderRadius: '8px',
                  fontSize: '14px',
                }}
              >
                <option value="urgent">Urgent</option>
                <option value="high">High</option>
                <option value="normal">Normal</option>
                <option value="low">Low</option>
              </select>
            </YStack>
          </XStack>

          <XStack gap="$4" flexWrap="wrap">
            <YStack flex={1} minWidth="45%">
              <Label fontSize="$3" fontWeight="500" color="$color12" marginBottom="$2">
                Status
              </Label>
              <select
                value={formData.status}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    status: e.target.value as Task['status'],
                  })
                }
                style={{
                  width: '100%',
                  padding: '8px 16px',
                  border: '1px solid var(--borderColor)',
                  borderRadius: '8px',
                  fontSize: '14px',
                }}
              >
                <option value="draft">Draft</option>
                <option value="pending">Pending</option>
                <option value="in_progress">In Progress</option>
                <option value="awaiting_response">Awaiting Response</option>
                <option value="completed">Completed</option>
                <option value="escalated">Escalated</option>
              </select>
            </YStack>

            <YStack flex={1} minWidth="45%">
              <Label fontSize="$3" fontWeight="500" color="$color12" marginBottom="$2">
                Assign To *
              </Label>
              <select
                value={formData.assigned_to_user_id}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    assigned_to_user_id: e.target.value,
                  })
                }
                style={{
                  width: '100%',
                  padding: '8px 16px',
                  border: '1px solid var(--borderColor)',
                  borderRadius: '8px',
                  fontSize: '14px',
                }}
                required
              >
                <option value="">Select user</option>
                {users.map((user) => (
                  <option key={user.id} value={user.id}>
                    {user.name} ({user.role})
                  </option>
                ))}
              </select>
            </YStack>
          </XStack>

          <YStack>
            <Label fontSize="$3" fontWeight="500" color="$color12" marginBottom="$2">
              Client
            </Label>
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
              style={{
                width: '100%',
                padding: '8px 16px',
                border: '1px solid var(--borderColor)',
                borderRadius: '8px',
                fontSize: '14px',
              }}
            >
              <option value="">Select client (optional)</option>
              {clients.map((client) => (
                <option key={client.id} value={client.id}>
                  {client.company_name}
                </option>
              ))}
            </select>
          </YStack>

          {formData.client_id && (
            <>
              <YStack>
                <Label fontSize="$3" fontWeight="500" color="$color12" marginBottom="$2">
                  Project
                </Label>
                <select
                  value={formData.project_id}
                  onChange={(e) =>
                    setFormData({ ...formData, project_id: e.target.value })
                  }
                  style={{
                    width: '100%',
                    padding: '8px 16px',
                    border: '1px solid var(--borderColor)',
                    borderRadius: '8px',
                    fontSize: '14px',
                  }}
                >
                  <option value="">Select project (optional)</option>
                  {filteredProjects.map((project) => (
                    <option key={project.id} value={project.id}>
                      {project.name}
                    </option>
                  ))}
                </select>
              </YStack>

              <YStack>
                <Label fontSize="$3" fontWeight="500" color="$color12" marginBottom="$2">
                  Related Policy
                </Label>
                <select
                  value={formData.policy_id}
                  onChange={(e) =>
                    setFormData({ ...formData, policy_id: e.target.value })
                  }
                  style={{
                    width: '100%',
                    padding: '8px 16px',
                    border: '1px solid var(--borderColor)',
                    borderRadius: '8px',
                    fontSize: '14px',
                  }}
                >
                  <option value="">Select policy (optional)</option>
                  {filteredPolicies.map((policy) => (
                    <option key={policy.id} value={policy.id}>
                      {policy.policy_type.replace('_', ' ')} -{' '}
                      {policy.policy_number}
                    </option>
                  ))}
                </select>
              </YStack>
            </>
          )}

          <YStack>
            <Label fontSize="$3" fontWeight="500" color="$color12" marginBottom="$2">
              Due Date
            </Label>
            <Input
              type="date"
              value={formData.due_date}
              onChange={(e) =>
                setFormData({ ...formData, due_date: e.target.value })
              }
              width="100%"
              paddingHorizontal="$4"
              paddingVertical="$2"
              borderWidth={1}
              borderColor="$borderColor"
              borderRadius="$4"
            />
          </YStack>

          <YStack>
            <Label fontSize="$3" fontWeight="500" color="$color12" marginBottom="$2">
              Document Link
            </Label>
            <Input
              type="url"
              value={formData.document_link}
              onChange={(e) =>
                setFormData({ ...formData, document_link: e.target.value })
              }
              width="100%"
              paddingHorizontal="$4"
              paddingVertical="$2"
              borderWidth={1}
              borderColor="$borderColor"
              borderRadius="$4"
              placeholder="https://example.com/document.pdf"
            />
          </YStack>

          <XStack
            alignItems="center"
            justifyContent="flex-end"
            gap="$3"
            paddingTop="$6"
            borderTopWidth={1}
            borderColor="$borderColor"
          >
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
          </XStack>
        </YStack>
      </Card>
    </YStack>
  );
}
