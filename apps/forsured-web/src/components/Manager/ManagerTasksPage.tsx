/* eslint-disable react-hooks/exhaustive-deps */
import { useState, useMemo, useEffect } from 'react';
import {
  Search,
  Filter,
  Calendar,
  AlertCircle,
  CheckCircle,
  ChevronDown,
  X,
  Loader2,
  Plus,
} from 'lucide-react';
import {
  Stack,
  Row,
  Text,
  H1,
  H2,
  H3,
  Card,
  Button,
  Input,
  SearchSelect,
  Modal,
  ModalHeader,
  ModalContent,
  ModalActions,
  FormField,
  Chip,
  Spinner,
} from '@unicornlove/beyond-ui';
import EnhancedTaskDetailModal from './EnhancedTaskDetailModal';
import { useDatabase } from '../../contexts/DatabaseContext';
import { useAuth } from '../../contexts/AuthContext';
import { toast } from 'sonner';
import { useEnums } from '../../hooks/useEnums';
import { useProjects } from '../../hooks/useProjects';

// New database schema types
type TaskStatus = 'pending' | 'in_progress' | 'completed' | 'cancelled' | 'submitted' | 'in_review' | 'approved' | 'rejected' | 'needs_info';
type TaskPriority = 'urgent' | 'high' | 'medium' | 'low';

interface Task {
  id: string;
  project_id: string;
  subcontractor_id: string | null;
  assigned_to_user_id: string | null;
  created_by_user_id: string;
  title: string;
  description: string;
  status: TaskStatus;
  priority: TaskPriority;
  due_date: string;
  task_type: string;
  origin_role: string;
  metadata?: {
    blockers?: string[];
    quick_actions?: string[];
    tags?: string[];
    project_name?: string;
    [key: string]: unknown;
  };
  created_at: string;
  updated_at: string;
}

// Interface for project dropdown (includes organization_id for task creation)
interface ProjectOption {
  id: string;
  name: string;
  organization_id: string;
}

// Interface for subcontractor dropdown
interface Subcontractor {
  id: string;
  name: string;
}

// Interface for new task form
interface NewTaskForm {
  title: string;
  description: string;
  project_id: string;
  subcontractor_id: string;
  priority: TaskPriority;
  due_date: string;
}

const initialFormState: NewTaskForm = {
  title: '',
  description: '',
  project_id: '',
  subcontractor_id: '',
  priority: 'medium',
  due_date: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0], // Default to 1 week from now
};

export default function ManagerTasksPage() {
  const { forsured } = useDatabase();
  const { user } = useAuth();
  const { projects: projectsData } = useProjects();

  // Fetch enums
  const { data: taskStatuses, isLoading: loadingStatuses } = useEnums('task_status');
  const { data: taskPriorities, isLoading: loadingPriorities } = useEnums('task_priority');

  // State for data fetching
  const [tasks, setTasks] = useState<Task[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  // Projects and subcontractors for form dropdowns
  const [projects, setProjects] = useState<ProjectOption[]>([]);
  const [subcontractors, setSubcontractors] = useState<Subcontractor[]>([]);

  // Create task form state
  const [newTaskForm, setNewTaskForm] = useState<NewTaskForm>(initialFormState);
  const [isCreatingTask, setIsCreatingTask] = useState(false);
  const [formErrors, setFormErrors] = useState<Partial<Record<keyof NewTaskForm, string>>>({});

  // Filter and sort state
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedStatus, setSelectedStatus] = useState<string>('ALL'); // Changed to string
  const [selectedPriority, setSelectedPriority] = useState<string>('ALL'); // Changed to string
  const [selectedProject, setSelectedProject] = useState<string>('ALL');
  const [selecteds, setSelecteds] = useState<string[]>([]);
  const [sortBy, setSortBy] = useState<'due_date' | 'priority' | 'status'>(
    'due_date'
  );
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('asc');
  const [showFilters, setShowFilters] = useState(false);
  const [selectedTask, setSelectedTask] = useState<Task | null>(null);
  const [showCreateTask, setShowCreateTask] = useState(false);

  // Fetch tasks from database on mount
  useEffect(() => {
    async function fetchTasks() {
      setLoading(true);
      setError(null);

      try {
        const { data, error: queryError } = await forsured('tasks')
          .select('*')
          .order('due_date', { ascending: true });

        if (queryError) {
          throw queryError;
        }

        setTasks(data || []);
      } catch (err) {
        const error = err as Error;
        setError(error);
        toast.error(error.message || 'Failed to load tasks');
      } finally {
        setLoading(false);
      }
    }

    fetchTasks();
  }, [forsured]);

  // Fetch subcontractors for the form dropdown
  useEffect(() => {
    async function fetchSubcontractors() {
      try {
        const { data, error: queryError } = await forsured('subcontractors')
          .select('id, company')
          .order('company', { ascending: true });

        if (queryError) {
          throw queryError;
        }

        // Map to our Subcontractor interface
        const mapped = (data || []).map((sub: { id: string; company: string }) => ({
          id: sub.id,
          name: sub.company,
        }));
        setSubcontractors(mapped);
      } catch (err) {
        console.error('Failed to fetch subcontractors:', err);
      }
    }

    fetchSubcontractors();
  }, [forsured]);

  // Map projects from useProjects hook to our Project interface
  useEffect(() => {
    if (projectsData) {
      const mapped = projectsData.map((p) => ({
        id: p.id,
        name: p.name,
        organization_id: p.organization_id,
      }));
      setProjects(mapped);
    }
  }, [projectsData]);

  // Form validation
  const validateForm = (): boolean => {
    const errors: Partial<Record<keyof NewTaskForm, string>> = {};

    if (!newTaskForm.title.trim()) {
      errors.title = 'Title is required';
    }
    if (!newTaskForm.project_id) {
      errors.project_id = 'Project is required';
    }
    if (!newTaskForm.due_date) {
      errors.due_date = 'Due date is required';
    }

    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  // Handle form field changes
  const handleFormChange = (field: keyof NewTaskForm, value: string) => {
    setNewTaskForm((prev) => ({ ...prev, [field]: value }));
    // Clear error for this field when user starts typing
    if (formErrors[field]) {
      setFormErrors((prev) => ({ ...prev, [field]: undefined }));
    }
  };

  // Handle task creation
  const handleCreateTask = async () => {
    if (!validateForm()) {
      return;
    }

    if (!user) {
      toast.error('You must be logged in to create a task');
      return;
    }

    // Get the selected project to get its organization_id
    const selectedProject = projects.find((p) => p.id === newTaskForm.project_id);
    if (!selectedProject) {
      toast.error('Please select a valid project');
      return;
    }

    setIsCreatingTask(true);

    try {
      const taskData = {
        project_id: newTaskForm.project_id,
        organization_id: selectedProject.organization_id,
        title: newTaskForm.title.trim(),
        description: newTaskForm.description.trim() || null,
        status: 'pending' as TaskStatus,
        priority: newTaskForm.priority,
        due_date: newTaskForm.due_date,
        subcontractor_id: newTaskForm.subcontractor_id || null,
        created_by_user_id: user.id,
        task_type: 'manual',
        origin_role: 'manager',
      };

      const { data, error: insertError } = await forsured('tasks')
        .insert(taskData)
        .select()
        .single();

      if (insertError) {
        throw insertError;
      }

      // Add the new task to the list
      setTasks((prev) => [data, ...prev]);

      // Reset form and close modal
      setNewTaskForm(initialFormState);
      setShowCreateTask(false);
      toast.success('Task created successfully');
    } catch (err) {
      const error = err as Error;
      console.error('Failed to create task:', error);
      toast.error(error.message || 'Failed to create task');
    } finally {
      setIsCreatingTask(false);
    }
  };

  // Reset form when modal closes
  const handleCloseCreateTask = () => {
    setShowCreateTask(false);
    setNewTaskForm(initialFormState);
    setFormErrors({});
  };

  const allProjects = useMemo(() => {
    const projects = new Set(
      tasks
        .map((t) => t.metadata?.project_name || t.project_id)
        .filter(Boolean)
    );
    return Array.from(projects);
  }, [tasks]);

  const alls = useMemo(() => {
    const tags = new Set(tasks.flatMap((t) => t.metadata?.tags || []));
    return Array.from(tags).sort();
  }, [tasks]);

  const filteredAndSortedTasks = useMemo(() => {
    const filtered = tasks.filter((task) => {
      const taskTags = task.metadata?.tags || [];
      const projectName = task.metadata?.project_name || task.project_id;

      const matchesSearch =
        searchQuery === '' ||
        task.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        task.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
        taskTags.some((tag) =>
          tag.toLowerCase().includes(searchQuery.toLowerCase())
        );

      const matchesStatus =
        selectedStatus === 'ALL' || task.status === selectedStatus;
      const matchesPriority =
        selectedPriority === 'ALL' || task.priority === selectedPriority;
      const matchesProject =
        selectedProject === 'ALL' || projectName === selectedProject;
      const matchess =
        selecteds.length === 0 ||
        selecteds.some((tag) => taskTags.includes(tag));

      return (
        matchesSearch &&
        matchesStatus &&
        matchesPriority &&
        matchesProject &&
        matchess
      );
    });

    filtered.sort((a, b) => {
      let comparison = 0;

      if (sortBy === 'due_date') {
        comparison =
          new Date(a.due_date).getTime() - new Date(b.due_date).getTime();
      } else if (sortBy === 'priority') {
        const priorityOrder: Record<string, number> = {}; // Changed to string
        taskPriorities?.forEach((p, index) => priorityOrder[p.value] = index);
        comparison = (priorityOrder[a.priority] ?? 999) - (priorityOrder[b.priority] ?? 999);
      } else if (sortBy === 'status') {
        const statusOrder: Record<string, number> = {}; // Changed to string
        taskStatuses?.forEach((s, index) => statusOrder[s.value] = index);
        comparison = (statusOrder[a.status] ?? 999) - (statusOrder[b.status] ?? 999);
      }

      return sortOrder === 'asc' ? comparison : -comparison;
    });

    return filtered;
  }, [
    tasks,
    searchQuery,
    selectedStatus,
    selectedPriority,
    selectedProject,
    selecteds,
    sortBy,
    sortOrder,
    taskPriorities, // Added dependency
    taskStatuses,   // Added dependency
  ]);

  const getPriorityColorProps = (priority: string): React.CSSProperties => {
    const priorityEnum = taskPriorities?.find(p => p.value === priority);
    if (!priorityEnum) return { color: 'var(--color-text)', backgroundColor: 'var(--color-gray-2)', borderColor: 'var(--color-gray-8)' };

    switch (priorityEnum.value) {
      case 'urgent':
        return { color: 'var(--color-red-10)', backgroundColor: 'var(--color-red-2)', borderColor: 'var(--color-red-8)' };
      case 'high':
        return { color: 'var(--color-orange-10)', backgroundColor: 'var(--color-orange-2)', borderColor: 'var(--color-orange-8)' };
      case 'medium':
        return { color: 'var(--color-blue-10)', backgroundColor: 'var(--color-blue-2)', borderColor: 'var(--color-blue-8)' };
      case 'low':
        return { color: 'var(--color-text)', backgroundColor: 'var(--color-gray-2)', borderColor: 'var(--color-gray-8)' };
      default:
        return { color: 'var(--color-text)', backgroundColor: 'var(--color-gray-2)', borderColor: 'var(--color-gray-8)' };
    }
  };

  const getStatusColorProps = (status: string): React.CSSProperties => {
    const statusEnum = taskStatuses?.find(s => s.value === status);
    if (!statusEnum) return { color: 'var(--color-text-muted)', backgroundColor: 'var(--color-gray-2)' };

    switch (statusEnum.value) {
      case 'pending':
        return { color: 'var(--color-blue-10)', backgroundColor: 'var(--color-blue-2)' };
      case 'in_progress':
        return { color: 'var(--color-blue-10)', backgroundColor: 'var(--color-blue-2)' };
      case 'submitted':
        return { color: 'var(--color-blue-9)', backgroundColor: 'var(--color-blue-2)' };
      case 'in_review':
        return { color: 'var(--color-purple-10)', backgroundColor: 'var(--color-purple-2)' };
      case 'approved':
        return { color: 'var(--color-green-10)', backgroundColor: 'var(--color-green-2)' };
      case 'rejected':
        return { color: 'var(--color-red-10)', backgroundColor: 'var(--color-red-2)' };
      case 'needs_info':
        return { color: 'var(--color-orange-10)', backgroundColor: 'var(--color-orange-2)' };
      case 'completed':
        return { color: 'var(--color-green-10)', backgroundColor: 'var(--color-green-2)' };
      case 'cancelled':
        return { color: 'var(--color-text)', backgroundColor: 'var(--color-gray-2)' };
      default:
        return { color: 'var(--color-text-muted)', backgroundColor: 'var(--color-gray-2)' };
    }
  };

  const formatDueDate = (dueAt: string): { text: string; color: string } => {
    const date = new Date(dueAt);
    const now = new Date();
    const diffTime = date.getTime() - now.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

    if (diffDays < 0)
      return {
        text: `${Math.abs(diffDays)}d overdue`,
        color: 'var(--color-red-10)',
      };
    if (diffDays === 0) return { text: 'Due today', color: 'var(--color-orange-10)' };
    if (diffDays === 1)
      return { text: 'Due tomorrow', color: 'var(--color-orange-10)' };
    if (diffDays <= 3)
      return { text: `Due in ${diffDays}d`, color: 'var(--color-orange-10)' };
    return { text: date.toLocaleDateString(), color: 'var(--color-text-muted)' };
  };

  const toggle = (tag: string) => {
    setSelecteds((prev) =>
      prev.includes(tag) ? prev.filter((t) => t !== tag) : [...prev, tag]
    );
  };

  const clearFilters = () => {
    setSearchQuery('');
    setSelectedStatus('ALL');
    setSelectedPriority('ALL');
    setSelectedProject('ALL');
    setSelecteds([]);
  };

  const activeFilterCount = [
    selectedStatus !== 'ALL',
    selectedPriority !== 'ALL',
    selectedProject !== 'ALL',
    selecteds.length > 0,
    searchQuery !== '',
  ].filter(Boolean).length;

  const statusCounts = useMemo(() => {
    return {
      pending: tasks.filter((t) => t.status === 'pending').length,
      in_progress: tasks.filter((t) => t.status === 'in_progress' || t.status === 'submitted' || t.status === 'in_review').length,
      needs_attention: tasks.filter((t) => t.status === 'rejected' || t.status === 'needs_info').length,
      completed: tasks.filter((t) => t.status === 'completed' || t.status === 'approved').length,
    };
  }, [tasks]);

  // Show loading state
  if (loading || loadingStatuses || loadingPriorities) {
    return (
      <Stack align="center" justify="center" style={{ minHeight: 400 }}>
        <Stack align="center" gap={16}>
          <Loader2 size={32} color="var(--color-blue-10)" className="animate-spin" />
          <Text color="secondary">Loading tasks and filters...</Text>
        </Stack>
      </Stack>
    );
  }

  // Show error state
  if (error) {
    return (
      <Stack align="center" justify="center" style={{ minHeight: 400 }}>
        <Stack align="center">
          <Stack align="center" style={{ marginBottom: 16 }}>
            <AlertCircle color="var(--color-red-10)" size={48} />
          </Stack>
          <H3 style={{ fontSize: 18, fontWeight: 600, marginBottom: 8 }}>
            Failed to load tasks
          </H3>
          <Text color="secondary">{error.message}</Text>
        </Stack>
      </Stack>
    );
  }

  return (
    <Stack gap={24}>
      <Row align="center" justify="space-between">
        <Stack>
          <H1 style={{ fontSize: 32, fontWeight: 700 }}>
            Tasks
          </H1>
          <Text color="secondary" style={{ fontSize: 18, marginTop: 4 }}>
            Manage compliance tasks across {allProjects.length} active projects
          </Text>
        </Stack>
        <Button
          color="primary"
          iconStart={Plus}
          onPress={() => setShowCreateTask(true)}
        >
          Create Task
        </Button>
      </Row>

      <Row align="center" gap={16} style={{ fontSize: 12 }}>
        <Row align="center" gap={8}>
          <div style={{ width: 12, height: 12, borderRadius: '50%', backgroundColor: 'var(--color-blue-10)' }} />
          <Text weight="semibold">
            {statusCounts.pending}
          </Text>
          <Text color="secondary">Pending</Text>
        </Row>
        <Stack style={{ height: 16, width: 1, backgroundColor: 'var(--color-border)' }} />
        <Row align="center" gap={8}>
          <div style={{ width: 12, height: 12, borderRadius: '50%', backgroundColor: 'var(--color-blue-10)' }} />
          <Text weight="semibold">
            {statusCounts.in_progress}
          </Text>
          <Text color="secondary">In Progress</Text>
        </Row>
        <Stack style={{ height: 16, width: 1, backgroundColor: 'var(--color-border)' }} />
        <Row align="center" gap={8}>
          <div style={{ width: 12, height: 12, borderRadius: '50%', backgroundColor: 'var(--color-red-10)' }} />
          <Text weight="semibold">
            {statusCounts.needs_attention}
          </Text>
          <Text color="secondary">Needs Attention</Text>
        </Row>
        <Stack style={{ height: 16, width: 1, backgroundColor: 'var(--color-border)' }} />
        <Row align="center" gap={8}>
          <div style={{ width: 12, height: 12, borderRadius: '50%', backgroundColor: 'var(--color-green-10)' }} />
          <Text weight="semibold">
            {statusCounts.completed}
          </Text>
          <Text color="secondary">Completed</Text>
        </Row>
      </Row>

      <Card style={{ backgroundColor: 'var(--color-background)', borderRadius: 16, border: '1px solid var(--color-border)', padding: 16 }}>
        <Stack gap={16}>
          <Row align="center" gap={12}>
            <Stack style={{ flex: 1 }}>
              <Input
                placeholder="Search tasks by title, description, or tags..."
                value={searchQuery}
                onChangeText={setSearchQuery}
                iconStart={Search}
                testID="task-search-input"
                accessibilityLabel="Search tasks"
              />
            </Stack>
            <Button
              variant={showFilters ? 'filled' : 'outline'}
              color={showFilters ? 'primary' : 'gray'}
              iconStart={Filter}
              onPress={() => setShowFilters(!showFilters)}
              accessibilityLabel={showFilters ? 'Hide filters' : 'Show filters'}
              testID="toggle-filters-btn"
            >
              Filters{activeFilterCount > 0 ? ` (${activeFilterCount})` : ''}
            </Button>
          </Row>

          {showFilters && (
            <Stack style={{ borderTop: '1px solid var(--color-border)', paddingTop: 16 }} gap={16}>
              <Row style={{ flexWrap: 'wrap' }} gap={16}>
                <Stack style={{ flex: 1, minWidth: 'calc(33.333% - 11px)' }}>
                  <SearchSelect
                    label="Status"
                    options={[
                      { value: 'ALL', label: 'All Statuses' },
                      ...(taskStatuses?.map(s => ({ value: s.value, label: s.display_name })) || [])
                    ]}
                    value={selectedStatus}
                    onChange={(value) => setSelectedStatus(value as string)}
                    searchable={false}
                    clearable={false}
                    testID="status-filter-select"
                  />
                </Stack>

                <Stack style={{ flex: 1, minWidth: 'calc(33.333% - 11px)' }}>
                  <SearchSelect
                    label="Priority"
                    options={[
                      { value: 'ALL', label: 'All Priorities' },
                      ...(taskPriorities?.map(p => ({ value: p.value, label: p.display_name })) || [])
                    ]}
                    value={selectedPriority}
                    onChange={(value) => setSelectedPriority(value as string)}
                    searchable={false}
                    clearable={false}
                    testID="priority-filter-select"
                  />
                </Stack>

                <Stack style={{ flex: 1, minWidth: 'calc(33.333% - 11px)' }}>
                  <SearchSelect
                    label="Project"
                    options={[
                      { value: 'ALL', label: 'All Projects' },
                      ...allProjects.map(p => ({ value: p, label: p }))
                    ]}
                    value={selectedProject}
                    onChange={(value) => setSelectedProject(value as string)}
                    searchable={allProjects.length > 5}
                    clearable={false}
                    testID="project-filter-select"
                  />
                </Stack>
              </Row>

              <Stack>
                <Text size="xs" weight="medium" color="secondary" style={{ marginBottom: 8 }}>
                  Tags
                </Text>
                <Row style={{ flexWrap: 'wrap' }} gap={8}>
                  {alls.map((tag) => (
                    <Chip
                      key={tag}
                      type={selecteds.includes(tag) ? 'filled' : 'outline'}
                      onPress={() => toggle(tag)}
                      testID={`tag-filter-${tag}`}
                    >
                      {tag}
                    </Chip>
                  ))}
                </Row>
              </Stack>

              {activeFilterCount > 0 && (
                <Button
                  variant="ghost"
                  color="gray"
                  size="sm"
                  iconStart={X}
                  onPress={clearFilters}
                  testID="clear-filters-btn"
                >
                  Clear all filters
                </Button>
              )}
            </Stack>
          )}

          <Row align="center" justify="space-between" style={{ borderTop: '1px solid var(--color-border)', paddingTop: 16 }}>
            <Text size="sm" color="secondary">
              Showing{' '}
              <Text weight="semibold">
                {filteredAndSortedTasks.length}
              </Text>{' '}
              of {tasks.length} tasks
            </Text>
            <Row align="center" gap={12}>
              <Text size="xs" color="secondary">Sort by:</Text>
              <SearchSelect
                options={[
                  { value: 'due_date', label: 'Due Date' },
                  { value: 'priority', label: 'Priority' },
                  { value: 'status', label: 'Status' },
                ]}
                value={sortBy}
                onChange={(value) => setSortBy(value as 'due_date' | 'priority' | 'status')}
                searchable={false}
                clearable={false}
                size="sm"
                testID="sort-by-select"
              />
              <Button
                variant="outline"
                color="gray"
                size="sm"
                iconStart={ChevronDown}
                onPress={() => setSortOrder((prev) => (prev === 'asc' ? 'desc' : 'asc'))}
                accessibilityLabel={sortOrder === 'asc' ? 'Sort descending' : 'Sort ascending'}
                testID="sort-order-btn"
                style={{
                  transform: [{ rotate: sortOrder === 'desc' ? '180deg' : '0deg' }],
                }}
              />
            </Row>
          </Row>
        </Stack>
      </Card>

      <Stack gap={12}>
        {filteredAndSortedTasks.map((task) => {
          const dueDate = formatDueDate(task.due_date);
          const taskTags = task.metadata?.tags || [];
          const taskBlockers = task.metadata?.blockers || [];
          const taskQuickActions = task.metadata?.quick_actions || [];
          const projectName = task.metadata?.project_name || task.project_id;

          // Format status for display (capitalize and replace underscores)
          const formatLabel = (value: string) => {
            const enumItem = [...(taskStatuses || []), ...(taskPriorities || [])].find(item => item.value === value);
            return enumItem ? enumItem.display_name : value
              .split('_')
              .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
              .join(' ');
          };

          return (
            <Card
              key={task.id}
              onPress={() => setSelectedTask(task)}
              style={{
                backgroundColor: 'var(--color-background)',
                borderRadius: 16,
                border: '1px solid var(--color-border)',
                cursor: 'pointer',
              }}
            >
              <Stack style={{ padding: 20 }} gap={12}>
                {/* Title row with badges */}
                <Row align="center" gap={12} wrap={false}>
                  <H3 style={{ fontSize: 16, fontWeight: 600, flex: 1 }}>
                    {task.title}
                  </H3>
                  <Row align="center" gap={8} style={{ flexShrink: 0 }}>
                    <span
                      style={{
                        paddingLeft: 8,
                        paddingRight: 8,
                        paddingTop: 2,
                        paddingBottom: 2,
                        fontSize: 11,
                        fontWeight: 500,
                        borderRadius: 6,
                        border: '1px solid',
                        whiteSpace: 'nowrap',
                        ...getPriorityColorProps(task.priority),
                      }}
                    >
                      {formatLabel(task.priority)}
                    </span>
                    <span
                      style={{
                        paddingLeft: 8,
                        paddingRight: 8,
                        paddingTop: 2,
                        paddingBottom: 2,
                        fontSize: 11,
                        fontWeight: 500,
                        borderRadius: 6,
                        whiteSpace: 'nowrap',
                        ...getStatusColorProps(task.status),
                      }}
                    >
                      {formatLabel(task.status)}
                    </span>
                  </Row>
                </Row>

                {/* Description */}
                <Text size="sm" color="secondary">
                  {task.description}
                </Text>

                {/* Metadata row */}
                <Row align="center" gap={16}>
                  <Row align="center" gap={4}>
                    <Calendar size={14} color="var(--color-text-muted)" />
                    <Text size="xs" style={{ color: dueDate.color }}>
                      {dueDate.text}
                    </Text>
                  </Row>
                  <Text size="xs" color="secondary">·</Text>
                  <Text size="xs" color="secondary">{projectName}</Text>
                  {taskBlockers.length > 0 && (
                    <>
                      <Text size="xs" color="secondary">·</Text>
                      <Row align="center" gap={4}>
                        <AlertCircle size={14} color="var(--color-red-10)" />
                        <Text size="xs" style={{ color: 'var(--color-red-10)' }}>
                          {taskBlockers.length} blocker{taskBlockers.length > 1 ? 's' : ''}
                        </Text>
                      </Row>
                    </>
                  )}
                </Row>

                {/* Tags and quick actions row */}
                <Row align="center" justify="space-between">
                  <Row style={{ flexWrap: 'wrap' }} gap={6}>
                    {taskTags.map((tag) => (
                      <span
                        key={tag}
                        style={{
                          paddingLeft: 8,
                          paddingRight: 8,
                          paddingTop: 4,
                          paddingBottom: 4,
                          backgroundColor: 'var(--color-gray-2)',
                          color: 'var(--color-text-muted)',
                          fontSize: 10,
                          borderRadius: 8,
                          border: '1px solid var(--color-border)',
                        }}
                      >
                        {tag}
                      </span>
                    ))}
                  </Row>
                  <Row align="center" gap={8}>
                    {taskQuickActions.slice(0, 3).map((action) => (
                      <div
                        key={action}
                        onClick={(e) => {
                          e.stopPropagation();
                        }}
                        style={{
                          paddingLeft: 12,
                          paddingRight: 12,
                          paddingTop: 6,
                          paddingBottom: 6,
                          fontSize: 10,
                          fontWeight: 500,
                          color: 'var(--color-blue-10)',
                          border: '1px solid var(--color-blue-10)',
                          borderRadius: 8,
                          cursor: 'pointer',
                        }}
                      >
                        {action.replace('_', ' ')}
                      </div>
                    ))}
                  </Row>
                </Row>
              </Stack>
            </Card>
          );
        })}
      </Stack>

      {filteredAndSortedTasks.length === 0 && (
        <Card style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', paddingTop: 64, paddingBottom: 64, backgroundColor: 'var(--color-background)', borderRadius: 16, border: '1px solid var(--color-border)' }}>
          <Stack align="center" style={{ marginBottom: 16 }}>
            <CheckCircle color="var(--color-text-muted)" size={64} />
          </Stack>
          <H3 style={{ fontSize: 18, fontWeight: 600, marginBottom: 8 }}>
            No tasks found
          </H3>
          <Text color="secondary">
            Try adjusting your filters or search criteria
          </Text>
        </Card>
      )}

      <EnhancedTaskDetailModal
        task={selectedTask}
        isOpen={!!selectedTask}
        onClose={() => setSelectedTask(null)}
        onUpdateTask={async (taskId, updates) => {
          try {
            const { error: updateError } = await forsured('tasks')
              .update({ ...updates, updated_at: new Date().toISOString() })
              .eq('id', taskId);

            if (updateError) {
              throw updateError;
            }

            // Update local state
            setTasks((prev) =>
              prev.map((t) => (t.id === taskId ? { ...t, ...updates } : t))
            );

            // Update selected task to reflect changes
            if (selectedTask && selectedTask.id === taskId) {
              setSelectedTask({ ...selectedTask, ...updates });
            }

            toast.success('Task updated successfully');
          } catch (err) {
            const error = err as Error;
            toast.error(error.message || 'Failed to update task');
          }
        }}
      />

      {/* Create Task Modal */}
      <Modal
        visible={showCreateTask}
        onClose={handleCloseCreateTask}
        width={560}
        testID="create-task-modal"
      >
        <ModalHeader
          title="Create New Task"
          onClose={handleCloseCreateTask}
        />
        <ModalContent>
          <Stack gap={20}>
            {/* Title Field */}
            <Input
              label="Title"
              required
              placeholder="Enter task title..."
              value={newTaskForm.title}
              onChangeText={(text) => handleFormChange('title', text)}
              error={formErrors.title}
              testID="task-title-input"
            />

            {/* Description Field */}
            <Input
              label="Description"
              placeholder="Enter task description (optional)..."
              value={newTaskForm.description}
              onChangeText={(text) => handleFormChange('description', text)}
              multiline
              numberOfLines={3}
              testID="task-description-input"
            />

            {/* Project and Subcontractor Row */}
            <Row gap={16}>
              <Stack style={{ flex: 1 }}>
                <SearchSelect
                  label="Project"
                  options={[
                    { value: '', label: 'Select a project...' },
                    ...projects.map(p => ({ value: p.id, label: p.name }))
                  ]}
                  value={newTaskForm.project_id}
                  onChange={(value) => handleFormChange('project_id', value as string)}
                  error={!!formErrors.project_id}
                  errorMessage={formErrors.project_id}
                  searchable={projects.length > 5}
                  clearable={false}
                  testID="task-project-select"
                />
              </Stack>

              <Stack style={{ flex: 1 }}>
                <SearchSelect
                  label="Subcontractor"
                  options={[
                    { value: '', label: 'None (optional)' },
                    ...subcontractors.map(s => ({ value: s.id, label: s.name }))
                  ]}
                  value={newTaskForm.subcontractor_id}
                  onChange={(value) => handleFormChange('subcontractor_id', value as string)}
                  searchable={subcontractors.length > 5}
                  clearable={false}
                  testID="task-subcontractor-select"
                />
              </Stack>
            </Row>

            {/* Priority and Due Date Row */}
            <Row gap={16}>
              <Stack style={{ flex: 1 }}>
                <SearchSelect
                  label="Priority"
                  options={taskPriorities?.map(p => ({ value: p.value, label: p.display_name })) || []}
                  value={newTaskForm.priority}
                  onChange={(value) => handleFormChange('priority', value as string)}
                  searchable={false}
                  clearable={false}
                  testID="task-priority-select"
                />
              </Stack>

              <Stack style={{ flex: 1 }}>
                <FormField
                  label="Due Date"
                  required
                  error={formErrors.due_date}
                >
                  <input
                    type="date"
                    value={newTaskForm.due_date}
                    onChange={(e) => handleFormChange('due_date', e.target.value)}
                    data-testid="task-due-date-input"
                    aria-label="Due Date"
                    style={{
                      width: '100%',
                      padding: '10px 12px',
                      backgroundColor: 'var(--color-background)',
                      border: formErrors.due_date ? '1px solid var(--color-red-8)' : '1px solid var(--color-border)',
                      borderRadius: '8px',
                      fontSize: '14px',
                      color: 'var(--color-text)',
                      fontFamily: 'inherit',
                    }}
                  />
                </FormField>
              </Stack>
            </Row>
          </Stack>
        </ModalContent>
        <ModalActions
          primaryAction={{
            label: isCreatingTask ? 'Creating...' : 'Create Task',
            onPress: handleCreateTask,
            disabled: isCreatingTask,
            loading: isCreatingTask,
          }}
          secondaryAction={{
            label: 'Cancel',
            onPress: handleCloseCreateTask,
            disabled: isCreatingTask,
          }}
        />
      </Modal>
    </Stack>
  );
}
