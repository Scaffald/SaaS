/* eslint-disable react-hooks/exhaustive-deps */
import { useState, useMemo, useEffect } from 'react';
import { createPortal } from 'react-dom';
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
import { Stack, Row, Text, H1, H2, H3, Card } from '@unicornlove/beyond-ui';
import Button from '../Common/Button';
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
      <Stack alignItems="center" justifyContent="center" style={{ minHeight: 400 }}>
        <Stack alignItems="center" gap={16}>
          <Loader2 size={32} color="var(--color-blue-10)" className="animate-spin" />
          <Text muted>Loading tasks and filters...</Text>
        </Stack>
      </Stack>
    );
  }

  // Show error state
  if (error) {
    return (
      <Stack alignItems="center" justifyContent="center" style={{ minHeight: 400 }}>
        <Stack alignItems="center">
          <Stack alignItems="center" style={{ marginBottom: 16 }}>
            <AlertCircle color="var(--color-red-10)" size={48} />
          </Stack>
          <H3 style={{ fontSize: 18, fontWeight: 600, marginBottom: 8 }}>
            Failed to load tasks
          </H3>
          <Text muted>{error.message}</Text>
        </Stack>
      </Stack>
    );
  }

  return (
    <Stack gap={24}>
      <Row alignItems="center" justifyContent="space-between">
        <Stack>
          <H1 style={{ fontSize: 32, fontWeight: 700 }}>
            Tasks
          </H1>
          <Text muted style={{ fontSize: 18, marginTop: 4 }}>
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

      <Row alignItems="center" gap={16} style={{ fontSize: 12 }}>
        <Row alignItems="center" gap={8}>
          <div style={{ width: 12, height: 12, borderRadius: '50%', backgroundColor: 'var(--color-blue-10)' }} />
          <Text weight="semibold">
            {statusCounts.pending}
          </Text>
          <Text muted>Pending</Text>
        </Row>
        <Stack style={{ height: 16, width: 1, backgroundColor: 'var(--color-border)' }} />
        <Row alignItems="center" gap={8}>
          <div style={{ width: 12, height: 12, borderRadius: '50%', backgroundColor: 'var(--color-blue-10)' }} />
          <Text weight="semibold">
            {statusCounts.in_progress}
          </Text>
          <Text muted>In Progress</Text>
        </Row>
        <Stack style={{ height: 16, width: 1, backgroundColor: 'var(--color-border)' }} />
        <Row alignItems="center" gap={8}>
          <div style={{ width: 12, height: 12, borderRadius: '50%', backgroundColor: 'var(--color-red-10)' }} />
          <Text weight="semibold">
            {statusCounts.needs_attention}
          </Text>
          <Text muted>Needs Attention</Text>
        </Row>
        <Stack style={{ height: 16, width: 1, backgroundColor: 'var(--color-border)' }} />
        <Row alignItems="center" gap={8}>
          <div style={{ width: 12, height: 12, borderRadius: '50%', backgroundColor: 'var(--color-green-10)' }} />
          <Text weight="semibold">
            {statusCounts.completed}
          </Text>
          <Text muted>Completed</Text>
        </Row>
      </Row>

      <Card style={{ backgroundColor: 'var(--color-background)', borderRadius: 16, border: '1px solid var(--color-border)', padding: 16 }}>
        <Stack gap={16}>
          <Row alignItems="center" gap={12}>
            <Stack style={{ flex: 1, position: 'relative' }}>
              <div style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', zIndex: 1 }}>
                <Search
                  color="var(--color-text-muted)"
                  size={20}
                />
              </div>
              <input
                type="text"
                placeholder="Search tasks by title, description, or tags..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                style={{
                  width: '100%',
                  paddingLeft: '40px',
                  paddingRight: '16px',
                  paddingTop: '10px',
                  paddingBottom: '10px',
                  backgroundColor: 'var(--color-background)',
                  border: '1px solid var(--color-border)',
                  borderRadius: '8px',
                  fontSize: '14px',
                  color: 'var(--color-text)',
                  fontFamily: 'inherit',
                }}
              />
            </Stack>
            <div
              onClick={() => setShowFilters(!showFilters)}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 8,
                paddingLeft: 16,
                paddingRight: 16,
                paddingTop: 10,
                paddingBottom: 10,
                border: '1px solid',
                borderRadius: 16,
                fontSize: 12,
                fontWeight: 500,
                backgroundColor: showFilters ? 'var(--color-blue-2)' : 'var(--color-background)',
                borderColor: showFilters ? 'var(--color-blue-10)' : 'var(--color-border)',
                color: showFilters ? 'var(--color-blue-10)' : 'var(--color-text-muted)',
                cursor: 'pointer',
              }}
            >
              <Filter size={18} />
              <span>Filters</span>
              {activeFilterCount > 0 && (
                <span
                  style={{
                    marginLeft: 4,
                    paddingLeft: 8,
                    paddingRight: 8,
                    paddingTop: 2,
                    paddingBottom: 2,
                    backgroundColor: 'var(--color-blue-10)',
                    color: 'white',
                    fontSize: 10,
                    borderRadius: 9999,
                  }}
                >
                  {activeFilterCount}
                </span>
              )}
            </div>
          </Row>

          {showFilters && (
            <Stack style={{ borderTop: '1px solid var(--color-border)', paddingTop: 16 }} gap={16}>
              <Row style={{ flexWrap: 'wrap' }} gap={16}>
                <Stack style={{ flex: 1, minWidth: 'calc(33.333% - 11px)' }}>
                  <label
                    style={{
                      display: 'block',
                      fontSize: 10,
                      fontWeight: 500,
                      color: 'var(--color-text-muted)',
                      marginBottom: 8,
                    }}
                  >
                    Status
                  </label>
                  <select
                    value={selectedStatus}
                    onChange={(e) =>
                      setSelectedStatus(e.target.value as string)
                    }
                    style={{
                      width: '100%',
                      padding: '8px 12px',
                      backgroundColor: 'var(--color-background)',
                      border: '1px solid var(--color-border)',
                      borderRadius: '8px',
                      fontSize: '14px',
                      color: 'var(--color-text)',
                      fontFamily: 'inherit',
                    }}
                  >
                    <option value="ALL">All Statuses</option>
                    {taskStatuses?.map((status) => (
                      <option key={status.value} value={status.value}>
                        {status.display_name}
                      </option>
                    ))}
                  </select>
                </Stack>

                <Stack style={{ flex: 1, minWidth: 'calc(33.333% - 11px)' }}>
                  <label
                    style={{
                      display: 'block',
                      fontSize: 10,
                      fontWeight: 500,
                      color: 'var(--color-text-muted)',
                      marginBottom: 8,
                    }}
                  >
                    Priority
                  </label>
                  <select
                    value={selectedPriority}
                    onChange={(e) =>
                      setSelectedPriority(e.target.value as string)
                    }
                    style={{
                      width: '100%',
                      padding: '8px 12px',
                      backgroundColor: 'var(--color-background)',
                      border: '1px solid var(--color-border)',
                      borderRadius: '8px',
                      fontSize: '14px',
                      color: 'var(--color-text)',
                      fontFamily: 'inherit',
                    }}
                  >
                    <option value="ALL">All Priorities</option>
                    {taskPriorities?.map((priority) => (
                      <option key={priority.value} value={priority.value}>
                        {priority.display_name}
                      </option>
                    ))}
                  </select>
                </Stack>

                <Stack style={{ flex: 1, minWidth: 'calc(33.333% - 11px)' }}>
                  <label
                    style={{
                      display: 'block',
                      fontSize: 10,
                      fontWeight: 500,
                      color: 'var(--color-text-muted)',
                      marginBottom: 8,
                    }}
                  >
                    Project
                  </label>
                  <select
                    value={selectedProject}
                    onChange={(e) => setSelectedProject(e.target.value)}
                    style={{
                      width: '100%',
                      padding: '8px 12px',
                      backgroundColor: 'var(--color-background)',
                      border: '1px solid var(--color-border)',
                      borderRadius: '8px',
                      fontSize: '14px',
                      color: 'var(--color-text)',
                      fontFamily: 'inherit',
                    }}
                  >
                    <option value="ALL">All Projects</option>
                    {allProjects.map((project) => (
                      <option key={project} value={project}>
                        {project}
                      </option>
                    ))}
                  </select>
                </Stack>
              </Row>

              <Stack>
                <label
                  style={{
                    display: 'block',
                    fontSize: 10,
                    fontWeight: 500,
                    color: 'var(--color-text-muted)',
                    marginBottom: 8,
                  }}
                >
                  Tags
                </label>
                <Row style={{ flexWrap: 'wrap' }} gap={8}>
                  {alls.map((tag) => (
                    <div
                      key={tag}
                      onClick={() => toggle(tag)}
                      style={{
                        paddingLeft: 12,
                        paddingRight: 12,
                        paddingTop: 6,
                        paddingBottom: 6,
                        fontSize: 10,
                        fontWeight: 500,
                        borderRadius: 9999,
                        border: '1px solid',
                        backgroundColor: selecteds.includes(tag) ? 'var(--color-blue-10)' : 'var(--color-background)',
                        borderColor: selecteds.includes(tag) ? 'var(--color-blue-10)' : 'var(--color-border)',
                        color: selecteds.includes(tag) ? 'white' : 'var(--color-text-muted)',
                        cursor: 'pointer',
                      }}
                    >
                      {tag}
                    </div>
                  ))}
                </Row>
              </Stack>

              {activeFilterCount > 0 && (
                <div
                  onClick={clearFilters}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: 8,
                    fontSize: 12,
                    color: 'var(--color-text-muted)',
                    cursor: 'pointer',
                  }}
                >
                  <X size={16} />
                  <span>Clear all filters</span>
                </div>
              )}
            </Stack>
          )}

          <Row alignItems="center" justifyContent="space-between" style={{ borderTop: '1px solid var(--color-border)', paddingTop: 16 }}>
            <Text size="sm" muted>
              Showing{' '}
              <Text weight="semibold">
                {filteredAndSortedTasks.length}
              </Text>{' '}
              of {tasks.length} tasks
            </Text>
            <Row alignItems="center" gap={12}>
              <Text size="xs" muted>Sort by:</Text>
              <select
                value={sortBy}
                onChange={(e) =>
                  setSortBy(e.target.value as 'due_date' | 'priority' | 'status')
                }
                style={{
                  padding: '6px 12px',
                  backgroundColor: 'var(--color-background)',
                  border: '1px solid var(--color-border)',
                  borderRadius: '4px',
                  fontSize: '14px',
                  color: 'var(--color-text)',
                  fontFamily: 'inherit',
                }}
              >
                <option value="due_date">Due Date</option>
                <option value="priority">Priority</option>
                <option value="status">Status</option>
              </select>
              <div
                onClick={() =>
                  setSortOrder((prev) => (prev === 'asc' ? 'desc' : 'asc'))
                }
                style={{
                  padding: 6,
                  border: '1px solid var(--color-border)',
                  borderRadius: 8,
                  cursor: 'pointer',
                }}
              >
                <ChevronDown
                  size={16}
                  color="var(--color-text-muted)"
                  style={{
                    transform: sortOrder === 'desc' ? 'rotate(180deg)' : 'none',
                    transition: 'transform 0.2s',
                  }}
                />
              </div>
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
              <Stack style={{ padding: 20 }}>
                <Row alignItems="flex-start" justifyContent="space-between" style={{ marginBottom: 12 }}>
                  <Stack style={{ flex: 1 }}>
                    <Row alignItems="center" gap={12} style={{ marginBottom: 8 }}>
                      <H3 style={{ fontSize: 16, fontWeight: 600 }}>
                        {task.title}
                      </H3>
                      <span
                        style={{
                          paddingLeft: 8,
                          paddingRight: 8,
                          paddingTop: 2,
                          paddingBottom: 2,
                          fontSize: 10,
                          fontWeight: 500,
                          borderRadius: 8,
                          border: '1px solid',
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
                          fontSize: 10,
                          fontWeight: 500,
                          borderRadius: 8,
                          ...getStatusColorProps(task.status),
                        }}
                      >
                        {formatLabel(task.status)}
                      </span>
                    </Row>
                    <Text size="sm" muted style={{ marginBottom: 12 }}>
                      {task.description}
                    </Text>
                    <Row alignItems="center" gap={16} style={{ fontSize: 10 }}>
                      <Row alignItems="center" gap={4}>
                        <Calendar size={14} />
                        <Text size="xs" style={{ color: dueDate.color }}>
                          {dueDate.text}
                        </Text>
                      </Row>
                      <Text size="xs" muted>-</Text>
                      <Text size="xs" muted>{projectName}</Text>
                      {taskBlockers.length > 0 && (
                        <>
                          <Text size="xs" muted>-</Text>
                          <Row alignItems="center" gap={4} style={{ color: 'var(--color-red-10)' }}>
                            <AlertCircle size={14} />
                            <Text size="xs" style={{ color: 'var(--color-red-10)' }}>
                              {taskBlockers.length} blocker
                              {taskBlockers.length > 1 ? 's' : ''}
                            </Text>
                          </Row>
                        </>
                      )}
                    </Row>
                  </Stack>
                </Row>

                <Row alignItems="center" justifyContent="space-between">
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
                  <Row alignItems="center" gap={8}>
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
          <Stack alignItems="center" style={{ marginBottom: 16 }}>
            <CheckCircle color="var(--color-text-muted)" size={64} />
          </Stack>
          <H3 style={{ fontSize: 18, fontWeight: 600, marginBottom: 8 }}>
            No tasks found
          </H3>
          <Text muted>
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

      {/* Create Task Modal - using React portal to avoid nested button/z-index issues */}
      {showCreateTask && createPortal(
        <div
          style={{
            position: 'fixed',
            inset: 0,
            backgroundColor: 'rgba(0, 0, 0, 0.5)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 9999,
          }}
          onClick={handleCloseCreateTask}
          role="dialog"
          aria-modal="true"
          aria-labelledby="create-task-modal-title"
          data-testid="task-modal"
        >
          <div
            style={{
              backgroundColor: '#ffffff',
              borderRadius: 16,
              width: 560,
              maxWidth: '90vw',
              maxHeight: '90vh',
              overflow: 'hidden',
              boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25)',
            }}
            onClick={(e: React.MouseEvent) => e.stopPropagation()}
          >
            {/* Modal Header */}
            <Row
              alignItems="center"
              justifyContent="space-between"
              style={{
                padding: 24,
                borderBottom: '1px solid var(--color-border)',
              }}
            >
              <H2 id="create-task-modal-title" style={{ fontSize: 18, fontWeight: 600 }}>
                Create New Task
              </H2>
              <button
                onClick={handleCloseCreateTask}
                style={{
                  background: 'none',
                  border: 'none',
                  padding: 8,
                  borderRadius: 8,
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
                aria-label="Close modal"
              >
                <X size={20} color="var(--color-text-muted)" />
              </button>
            </Row>

            {/* Modal Content */}
            <div style={{ padding: 24, overflowY: 'auto', maxHeight: 'calc(90vh - 160px)' }}>
              <Stack gap={20}>
                {/* Title Field */}
                <Stack gap={8}>
                  <label style={{ fontSize: 12, fontWeight: 500, color: 'var(--color-text-muted)' }}>
                    Title <span style={{ color: 'var(--color-red-10)' }}>*</span>
                  </label>
                  <input
                    type="text"
                    placeholder="Enter task title..."
                    value={newTaskForm.title}
                    onChange={(e) => handleFormChange('title', e.target.value)}
                    data-testid="task-title-input"
                    style={{
                      width: '100%',
                      padding: '10px 12px',
                      backgroundColor: 'var(--color-background)',
                      border: formErrors.title ? '1px solid var(--color-red-8)' : '1px solid var(--color-border)',
                      borderRadius: '8px',
                      fontSize: '14px',
                      color: 'var(--color-text)',
                      fontFamily: 'inherit',
                    }}
                  />
                  {formErrors.title && (
                    <Text size="xs" style={{ color: 'var(--color-red-10)' }}>{formErrors.title}</Text>
                  )}
                </Stack>

                {/* Description Field */}
                <Stack gap={8}>
                  <label style={{ fontSize: 12, fontWeight: 500, color: 'var(--color-text-muted)' }}>
                    Description
                  </label>
                  <textarea
                    placeholder="Enter task description (optional)..."
                    value={newTaskForm.description}
                    onChange={(e) => handleFormChange('description', e.target.value)}
                    data-testid="task-description-input"
                    rows={3}
                    style={{
                      width: '100%',
                      padding: '10px 12px',
                      backgroundColor: 'var(--color-background)',
                      border: '1px solid var(--color-border)',
                      borderRadius: '8px',
                      fontSize: '14px',
                      color: 'var(--color-text)',
                      fontFamily: 'inherit',
                      resize: 'vertical',
                    }}
                  />
                </Stack>

                {/* Project and Subcontractor Row */}
                <Row gap={16}>
                  <Stack gap={8} style={{ flex: 1 }}>
                    <label style={{ fontSize: 12, fontWeight: 500, color: 'var(--color-text-muted)' }}>
                      Project <span style={{ color: 'var(--color-red-10)' }}>*</span>
                    </label>
                    <select
                      value={newTaskForm.project_id}
                      onChange={(e) => handleFormChange('project_id', e.target.value)}
                      data-testid="task-project-select"
                      style={{
                        width: '100%',
                        padding: '10px 12px',
                        backgroundColor: 'var(--color-background)',
                        border: formErrors.project_id ? '1px solid var(--color-red-8)' : '1px solid var(--color-border)',
                        borderRadius: '8px',
                        fontSize: '14px',
                        color: 'var(--color-text)',
                        fontFamily: 'inherit',
                      }}
                    >
                      <option value="">Select a project...</option>
                      {projects.map((project) => (
                        <option key={project.id} value={project.id}>
                          {project.name}
                        </option>
                      ))}
                    </select>
                    {formErrors.project_id && (
                      <Text size="xs" style={{ color: 'var(--color-red-10)' }}>{formErrors.project_id}</Text>
                    )}
                  </Stack>

                  <Stack gap={8} style={{ flex: 1 }}>
                    <label style={{ fontSize: 12, fontWeight: 500, color: 'var(--color-text-muted)' }}>
                      Subcontractor
                    </label>
                    <select
                      value={newTaskForm.subcontractor_id}
                      onChange={(e) => handleFormChange('subcontractor_id', e.target.value)}
                      data-testid="task-subcontractor-select"
                      style={{
                        width: '100%',
                        padding: '10px 12px',
                        backgroundColor: 'var(--color-background)',
                        border: '1px solid var(--color-border)',
                        borderRadius: '8px',
                        fontSize: '14px',
                        color: 'var(--color-text)',
                        fontFamily: 'inherit',
                      }}
                    >
                      <option value="">None (optional)</option>
                      {subcontractors.map((sub) => (
                        <option key={sub.id} value={sub.id}>
                          {sub.name}
                        </option>
                      ))}
                    </select>
                  </Stack>
                </Row>

                {/* Priority and Due Date Row */}
                <Row gap={16}>
                  <Stack gap={8} style={{ flex: 1 }}>
                    <label style={{ fontSize: 12, fontWeight: 500, color: 'var(--color-text-muted)' }}>
                      Priority
                    </label>
                    <select
                      value={newTaskForm.priority}
                      onChange={(e) => handleFormChange('priority', e.target.value)}
                      data-testid="task-priority-select"
                      style={{
                        width: '100%',
                        padding: '10px 12px',
                        backgroundColor: 'var(--color-background)',
                        border: '1px solid var(--color-border)',
                        borderRadius: '8px',
                        fontSize: '14px',
                        color: 'var(--color-text)',
                        fontFamily: 'inherit',
                      }}
                    >
                      {taskPriorities?.map((priority) => (
                        <option key={priority.value} value={priority.value}>
                          {priority.display_name}
                        </option>
                      ))}
                    </select>
                  </Stack>

                  <Stack gap={8} style={{ flex: 1 }}>
                    <label style={{ fontSize: 12, fontWeight: 500, color: 'var(--color-text-muted)' }}>
                      Due Date <span style={{ color: 'var(--color-red-10)' }}>*</span>
                    </label>
                    <input
                      type="date"
                      value={newTaskForm.due_date}
                      onChange={(e) => handleFormChange('due_date', e.target.value)}
                      data-testid="task-due-date-input"
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
                    {formErrors.due_date && (
                      <Text size="xs" style={{ color: 'var(--color-red-10)' }}>{formErrors.due_date}</Text>
                    )}
                  </Stack>
                </Row>
              </Stack>
            </div>

            {/* Modal Actions */}
            <Row
              alignItems="center"
              justifyContent="flex-end"
              gap={12}
              style={{
                padding: 24,
                borderTop: '1px solid var(--color-border)',
              }}
            >
              <Button
                variant="outlined"
                onPress={handleCloseCreateTask}
                disabled={isCreatingTask}
              >
                Cancel
              </Button>
              <Button
                variant="primary"
                onPress={handleCreateTask}
                disabled={isCreatingTask}
                data-testid="submit-create-task-btn"
              >
                {isCreatingTask ? (
                  <Row alignItems="center" gap={8}>
                    <Loader2 size={16} className="animate-spin" />
                    <span>Creating...</span>
                  </Row>
                ) : (
                  'Create Task'
                )}
              </Button>
            </Row>
          </div>
        </div>,
        document.body
      )}
    </Stack>
  );
}
