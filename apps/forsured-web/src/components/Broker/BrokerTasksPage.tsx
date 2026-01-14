import { useState, useMemo, useEffect, useRef, useCallback } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import {
  Search,
  Filter,
  Calendar,
  CheckCircle,
  ChevronDown,
  X,
  Building2,
  HardHat,
  Inbox,
  Send,
  List,
  Plus,
} from 'lucide-react';
import { Stack, Row, Text, H1, H3, Card, Input } from '@unicornlove/beyond-ui';
import { useTasks } from '../../hooks/useTasks';
import { useProjects } from '../../hooks/useProjects';
import { useClients } from '../../hooks/useClients';
import { useUser } from '../../contexts/UserContext';
import Button from '../Common/Button';
import { DashboardSkeleton } from '../Common/SkeletonLoader';
import TaskModal from './TaskModal';
import TaskStatusBadge from '../Common/TaskStatusBadge';
import { Task } from '../../types';
import { filterTasksForInbox, filterTasksForAssignedByMe } from '../../lib/tasks/taskAssignmentTypeService';

type TaskStatus = 'pending' | 'in_progress' | 'completed' | 'overdue';
type TaskPriority = 'critical' | 'high' | 'medium' | 'low';

/**
 * REQ-260: Task Assignment Workflow
 * View types for task list filtering based on assignment
 */
type TaskViewType = 'inbox' | 'assigned_by_me' | 'all';

// Local storage key for persisting filter preferences
const FILTER_PREFERENCES_KEY = 'broker_task_filters';

interface FilterPreferences {
  priority?: TaskPriority | 'all';
  status?: TaskStatus | 'all';
  client?: string;
  project?: string;
  view?: TaskViewType;
}

// Load saved filter preferences from localStorage
const loadFilterPreferences = (): FilterPreferences | null => {
  try {
    const saved = localStorage.getItem(FILTER_PREFERENCES_KEY);
    return saved ? JSON.parse(saved) : null;
  } catch {
    return null;
  }
};

// Save filter preferences to localStorage
const saveFilterPreferences = (prefs: FilterPreferences): void => {
  try {
    localStorage.setItem(FILTER_PREFERENCES_KEY, JSON.stringify(prefs));
  } catch {
    // Silently fail if localStorage is unavailable
  }
};

export default function BrokerTasksPage() {
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const { tasks, loading: tasksLoading, createTask, updateTask, fetchTasks } = useTasks();
  const { projects, loading: projectsLoading } = useProjects();
  const { clients, loading: clientsLoading } = useClients();
  const { currentUser } = useUser();

  // Check if URL has filter params (URL params take precedence over saved preferences)
  const hasUrlFilters = searchParams.get('priority') || searchParams.get('status') ||
    searchParams.get('client') || searchParams.get('project') || searchParams.get('search') ||
    searchParams.get('view');

  // Load saved preferences (only used if no URL params)
  const savedPrefs = !hasUrlFilters ? loadFilterPreferences() : null;

  // Initialize filter states from URL parameters, falling back to saved preferences
  const getInitialPriority = (): TaskPriority | 'all' => {
    const param = searchParams.get('priority');
    if (param && ['critical', 'high', 'medium', 'low'].includes(param)) {
      return param as TaskPriority;
    }
    // Fall back to saved preference
    if (savedPrefs?.priority && savedPrefs.priority !== 'all') {
      return savedPrefs.priority;
    }
    return 'all';
  };

  const getInitialStatus = (): TaskStatus | 'all' => {
    const param = searchParams.get('status');
    if (param && ['pending', 'in_progress', 'completed', 'overdue'].includes(param)) {
      return param as TaskStatus;
    }
    // Fall back to saved preference
    if (savedPrefs?.status && savedPrefs.status !== 'all') {
      return savedPrefs.status;
    }
    return 'all';
  };

  const getInitialClient = (): string => {
    const param = searchParams.get('client');
    if (param) return param;
    if (savedPrefs?.client && savedPrefs.client !== 'all') return savedPrefs.client;
    return 'all';
  };

  const getInitialProject = (): string => {
    const param = searchParams.get('project');
    if (param) return param;
    if (savedPrefs?.project && savedPrefs.project !== 'all') return savedPrefs.project;
    return 'all';
  };

  /**
   * REQ-260: Get initial view type from URL params or saved preferences
   * Defaults to 'inbox' to show user's assigned tasks first
   */
  const getInitialView = (): TaskViewType => {
    const param = searchParams.get('view');
    if (param && ['inbox', 'assigned_by_me', 'all'].includes(param)) {
      return param as TaskViewType;
    }
    if (savedPrefs?.view) {
      return savedPrefs.view;
    }
    return 'inbox'; // Default to inbox view
  };

  const [searchQuery, setSearchQuery] = useState(searchParams.get('search') || '');
  // REQ-260: Task view state for inbox vs assigned-by-me filtering
  const [selectedView, setSelectedView] = useState<TaskViewType>(getInitialView());
  const [selectedStatus, setSelectedStatus] = useState<TaskStatus | 'all'>(getInitialStatus());
  const [selectedPriority, setSelectedPriority] = useState<TaskPriority | 'all'>(getInitialPriority());
  const [selectedProject, setSelectedProject] = useState<string>(getInitialProject());
  const [selectedClient, setSelectedClient] = useState<string>(getInitialClient());
  const [sortBy, setSortBy] = useState<'due_date' | 'priority' | 'status'>(
    'due_date'
  );
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('asc');
  // Auto-show filters if URL has filter params or saved preferences have non-default values
  const hasSavedFilters = savedPrefs && (
    (savedPrefs.priority && savedPrefs.priority !== 'all') ||
    (savedPrefs.status && savedPrefs.status !== 'all') ||
    (savedPrefs.client && savedPrefs.client !== 'all') ||
    (savedPrefs.project && savedPrefs.project !== 'all')
  );
  const [showFilters, setShowFilters] = useState(!!hasUrlFilters || !!hasSavedFilters);
  const [selectedTask, setSelectedTask] = useState<Task | null>(null);
  const [isTaskModalOpen, setIsTaskModalOpen] = useState(false);

  // Debounce timer ref for saving preferences
  const saveTimeoutRef = useRef<NodeJS.Timeout>();

  // Debounced save preferences function
  const debouncedSavePreferences = useCallback((prefs: FilterPreferences) => {
    if (saveTimeoutRef.current) {
      clearTimeout(saveTimeoutRef.current);
    }
    saveTimeoutRef.current = setTimeout(() => {
      saveFilterPreferences(prefs);
    }, 500); // 500ms debounce
  }, []);

  // Update URL and save preferences when filters change
  useEffect(() => {
    const params = new URLSearchParams();
    if (selectedPriority !== 'all') params.set('priority', selectedPriority);
    if (selectedStatus !== 'all') params.set('status', selectedStatus);
    if (selectedClient !== 'all') params.set('client', selectedClient);
    if (selectedProject !== 'all') params.set('project', selectedProject);
    if (searchQuery) params.set('search', searchQuery);
    // REQ-260: Include view in URL params (don't include if 'inbox' since it's the default)
    if (selectedView !== 'inbox') params.set('view', selectedView);

    // Only update if params actually changed to avoid infinite loops
    const newSearch = params.toString();
    const currentSearch = searchParams.toString();
    if (newSearch !== currentSearch) {
      setSearchParams(params, { replace: true });
    }

    // Save filter preferences (debounced)
    debouncedSavePreferences({
      priority: selectedPriority,
      status: selectedStatus,
      client: selectedClient,
      project: selectedProject,
      view: selectedView,
    });
  }, [selectedPriority, selectedStatus, selectedClient, selectedProject, searchQuery, selectedView, setSearchParams, searchParams, debouncedSavePreferences]);

  // Cleanup timeout on unmount
  useEffect(() => {
    return () => {
      if (saveTimeoutRef.current) {
        clearTimeout(saveTimeoutRef.current);
      }
    };
  }, []);

  const allProjects = useMemo(() => {
    return projects.map((p) => ({ id: p.id, name: p.name }));
  }, [projects]);

  // Compute filter counts based on current filter selections
  // Each count reflects tasks that match ALL other active filters (AND logic)
  const filterCounts = useMemo(() => {
    // Helper to get tasks matching all filters except one
    const getFilteredTasks = (excludeFilter: 'priority' | 'status' | 'client' | 'project') => {
      return tasks.filter((task) => {
        const matchesSearch =
          searchQuery === '' ||
          task.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
          task.description?.toLowerCase().includes(searchQuery.toLowerCase());
        const matchesPriority =
          excludeFilter === 'priority' || selectedPriority === 'all' || task.priority === selectedPriority;
        const matchesStatus =
          excludeFilter === 'status' || selectedStatus === 'all' || task.status === selectedStatus;
        const matchesClient =
          excludeFilter === 'client' || selectedClient === 'all' || task.client_id === selectedClient;
        const matchesProject =
          excludeFilter === 'project' || selectedProject === 'all' || task.project_id === selectedProject;
        return matchesSearch && matchesPriority && matchesStatus && matchesClient && matchesProject;
      });
    };

    // Count by priority (considering other active filters)
    const tasksForPriorityCounts = getFilteredTasks('priority');
    const priorityCounts = {
      critical: tasksForPriorityCounts.filter((t) => t.priority === 'critical').length,
      high: tasksForPriorityCounts.filter((t) => t.priority === 'high').length,
      medium: tasksForPriorityCounts.filter((t) => t.priority === 'medium').length,
      low: tasksForPriorityCounts.filter((t) => t.priority === 'low').length,
    };

    // Count by status (considering other active filters)
    const tasksForStatusCounts = getFilteredTasks('status');
    const statusCountsMap = {
      pending: tasksForStatusCounts.filter((t) => t.status === 'pending').length,
      in_progress: tasksForStatusCounts.filter((t) => t.status === 'in_progress').length,
      overdue: tasksForStatusCounts.filter((t) => t.status === 'overdue').length,
      completed: tasksForStatusCounts.filter((t) => t.status === 'completed').length,
    };

    // Count by client (considering other active filters), sorted by count descending
    const tasksForClientCounts = getFilteredTasks('client');
    const clientCountsMap: Record<string, number> = {};
    tasksForClientCounts.forEach((task) => {
      if (task.client_id) {
        clientCountsMap[task.client_id] = (clientCountsMap[task.client_id] || 0) + 1;
      }
    });

    // Get client options sorted by task count descending
    const clientOptions = clients
      .map((client) => ({
        id: client.id,
        name: client.company_name,
        count: clientCountsMap[client.id] || 0,
      }))
      .sort((a, b) => b.count - a.count);

    return {
      priority: priorityCounts,
      status: statusCountsMap,
      clientOptions,
      totalFiltered: getFilteredTasks('priority').length, // For "All" option
    };
  }, [tasks, clients, searchQuery, selectedPriority, selectedStatus, selectedClient, selectedProject]);

  const filteredAndSortedTasks = useMemo(() => {
    // REQ-260: Apply view-based filtering first using taskAssignmentTypeService
    const userId = currentUser?.id || '';
    let viewFilteredTasks: Task[];

    switch (selectedView) {
      case 'inbox':
        viewFilteredTasks = filterTasksForInbox(tasks, userId);
        break;
      case 'assigned_by_me':
        viewFilteredTasks = filterTasksForAssignedByMe(tasks, userId);
        break;
      case 'all':
      default:
        viewFilteredTasks = tasks;
        break;
    }

    // Apply additional filters on top of view filtering
    const filtered = viewFilteredTasks.filter((task) => {
      const matchesSearch =
        searchQuery === '' ||
        task.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        task.description?.toLowerCase().includes(searchQuery.toLowerCase());

      const matchesStatus =
        selectedStatus === 'all' || task.status === selectedStatus;
      const matchesPriority =
        selectedPriority === 'all' || task.priority === selectedPriority;
      const matchesProject =
        selectedProject === 'all' || task.project_id === selectedProject;
      const matchesClient =
        selectedClient === 'all' || task.client_id === selectedClient;

      return matchesSearch && matchesStatus && matchesPriority && matchesProject && matchesClient;
    });

    filtered.sort((a, b) => {
      let comparison = 0;

      if (sortBy === 'due_date') {
        const aDate = a.due_date ? new Date(a.due_date).getTime() : Infinity;
        const bDate = b.due_date ? new Date(b.due_date).getTime() : Infinity;
        comparison = aDate - bDate;
      } else if (sortBy === 'priority') {
        const priorityOrder = { critical: 0, high: 1, medium: 2, low: 3 };
        comparison =
          (priorityOrder[a.priority as TaskPriority] ?? 2) -
          (priorityOrder[b.priority as TaskPriority] ?? 2);
      } else if (sortBy === 'status') {
        const statusOrder = {
          overdue: 0,
          pending: 1,
          in_progress: 2,
          completed: 3,
        };
        comparison =
          (statusOrder[a.status as TaskStatus] ?? 1) -
          (statusOrder[b.status as TaskStatus] ?? 1);
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
    selectedClient,
    sortBy,
    sortOrder,
    selectedView,
    currentUser?.id,
  ]);

  const getPriorityStyle = (priority: string): React.CSSProperties => {
    switch (priority) {
      case 'critical':
        return { color: 'var(--color-red-10)', backgroundColor: 'var(--color-red-2)', borderColor: 'var(--color-red-6)' };
      case 'high':
        return { color: 'var(--color-yellow-10)', backgroundColor: 'var(--color-yellow-2)', borderColor: 'var(--color-yellow-6)' };
      case 'medium':
        return { color: 'var(--color-blue-10)', backgroundColor: 'var(--color-blue-2)', borderColor: 'var(--color-blue-6)' };
      case 'low':
        return { color: 'var(--color-text)', backgroundColor: 'var(--color-gray-2)', borderColor: 'var(--color-gray-6)' };
      default:
        return { color: 'var(--color-text)', backgroundColor: 'var(--color-gray-2)', borderColor: 'var(--color-gray-6)' };
    }
  };


  const formatDueDate = (dueAt: string | undefined) => {
    if (!dueAt) return { text: 'No due date', color: 'var(--color-text-muted)' };
    const date = new Date(dueAt);
    const now = new Date();
    const diffTime = date.getTime() - now.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

    if (diffDays < 0)
      return {
        text: `${Math.abs(diffDays)}d overdue`,
        color: 'var(--color-red-10)',
      };
    if (diffDays === 0) return { text: 'Due today', color: 'var(--color-yellow-10)' };
    if (diffDays === 1)
      return { text: 'Due tomorrow', color: 'var(--color-yellow-10)' };
    if (diffDays <= 3)
      return { text: `Due in ${diffDays}d`, color: 'var(--color-yellow-10)' };
    return { text: date.toLocaleDateString(), color: 'var(--color-text-muted)' };
  };

  const clearFilters = () => {
    setSearchQuery('');
    setSelectedStatus('all');
    setSelectedPriority('all');
    setSelectedProject('all');
    setSelectedClient('all');
  };

  const activeFilterCount = [
    selectedStatus !== 'all',
    selectedPriority !== 'all',
    selectedProject !== 'all',
    selectedClient !== 'all',
    searchQuery !== '',
  ].filter(Boolean).length;

  const statusCounts = useMemo(() => {
    return {
      pending: tasks.filter((t) => t.status === 'pending').length,
      in_progress: tasks.filter((t) => t.status === 'in_progress').length,
      overdue: tasks.filter((t) => t.status === 'overdue').length,
      completed: tasks.filter((t) => t.status === 'completed').length,
    };
  }, [tasks]);

  /**
   * REQ-260: Compute view counts for tab badges
   */
  const viewCounts = useMemo(() => {
    const userId = currentUser?.id || '';
    return {
      inbox: filterTasksForInbox(tasks, userId).length,
      assigned_by_me: filterTasksForAssignedByMe(tasks, userId).length,
      all: tasks.length,
    };
  }, [tasks, currentUser?.id]);

  const handleCreateTask = () => {
    setSelectedTask(null);
    setIsTaskModalOpen(true);
  };

  const handleTaskClick = (task: Task) => {
    setSelectedTask(task);
    setIsTaskModalOpen(true);
  };

  const handleSaveTask = async (taskData: Partial<Task>) => {
    if (selectedTask) {
      await updateTask(selectedTask.id, taskData);

      // REQ-260: If task was assigned to someone else, switch to "assigned by me" view
      if (
        taskData.assigned_to_user_id &&
        taskData.assigned_to_user_id !== currentUser?.id &&
        selectedView === 'inbox'
      ) {
        setSelectedView('assigned_by_me');
      }
    } else {
      await createTask(taskData as Omit<Task, 'id'>);

      // REQ-260: If new task is self-assigned, stay in inbox
      // If delegated to someone else, switch to "assigned by me" view
      if (
        taskData.assigned_to_user_id &&
        taskData.assigned_to_user_id !== currentUser?.id
      ) {
        setSelectedView('assigned_by_me');
      }
    }

    // Refresh task list to ensure view counts are updated
    await fetchTasks();
    setIsTaskModalOpen(false);
    setSelectedTask(null);
  };

  if (tasksLoading || projectsLoading || clientsLoading) {
    return <DashboardSkeleton />;
  }

  // Helper function to get client name from client_id
  const getClientName = (clientId: string | undefined) => {
    if (!clientId) return null;
    const client = clients.find((c) => c.id === clientId);
    return client?.company_name || null;
  };

  // Handle client name click - navigate to client profile
  const handleClientClick = (e: React.MouseEvent, clientId: string) => {
    e.stopPropagation(); // Prevent task modal from opening
    navigate(`/broker/clients/${clientId}`);
  };

  const tabButtonStyle = (isSelected: boolean): React.CSSProperties => ({
    display: 'flex',
    alignItems: 'center',
    gap: 8,
    paddingLeft: 16,
    paddingRight: 16,
    paddingTop: 12,
    paddingBottom: 12,
    fontSize: 14,
    fontWeight: 500,
    borderBottom: `2px solid ${isSelected ? 'var(--color-blue-9)' : 'transparent'}`,
    color: isSelected ? 'var(--color-blue-10)' : 'var(--color-text-muted)',
    backgroundColor: 'transparent',
    cursor: 'pointer',
    border: 'none',
  });

  const tabBadgeStyle = (isSelected: boolean): React.CSSProperties => ({
    marginLeft: 4,
    paddingLeft: 8,
    paddingRight: 8,
    paddingTop: 2,
    paddingBottom: 2,
    fontSize: 12,
    borderRadius: 9999,
    backgroundColor: isSelected ? 'var(--color-blue-2)' : 'var(--color-gray-2)',
    color: isSelected ? 'var(--color-blue-11)' : 'var(--color-text-muted)',
  });

  return (
    <Stack gap={24}>
      <Row alignItems="center" justifyContent="space-between">
        <Stack>
          <H1 style={{ fontSize: 28, fontWeight: 'bold', color: 'var(--color-text)' }}>
            Tasks
          </H1>
          <Text muted style={{ marginTop: 4 }}>
            Manage compliance tasks across {allProjects.length} active projects
          </Text>
        </Stack>
        <Button color="primary" iconStart={Plus} onPress={handleCreateTask}>
          Create Task
        </Button>
      </Row>

      {/* REQ-260: View navigation tabs */}
      <Row alignItems="center" style={{ borderBottom: '1px solid var(--color-border)' }}>
        <button
          onPress={() => setSelectedView('inbox')}
          style={tabButtonStyle(selectedView === 'inbox')}
        >
          <Inbox size={18} />
          <Text>Inbox</Text>
          <span style={tabBadgeStyle(selectedView === 'inbox')}>
            {viewCounts.inbox}
          </span>
        </button>
        <button
          onPress={() => setSelectedView('assigned_by_me')}
          style={tabButtonStyle(selectedView === 'assigned_by_me')}
        >
          <Send size={18} />
          <Text>Assigned by Me</Text>
          <span style={tabBadgeStyle(selectedView === 'assigned_by_me')}>
            {viewCounts.assigned_by_me}
          </span>
        </button>
        <button
          onPress={() => setSelectedView('all')}
          style={tabButtonStyle(selectedView === 'all')}
        >
          <List size={18} />
          <Text>All Tasks</Text>
          <span style={tabBadgeStyle(selectedView === 'all')}>
            {viewCounts.all}
          </span>
        </button>
      </Row>

      <Row alignItems="center" gap={16} style={{ fontSize: 14 }}>
        <Row alignItems="center" gap={8}>
          <div style={{ width: 12, height: 12, borderRadius: 9999, backgroundColor: 'var(--color-blue-9)' }} />
          <Text weight="semibold">{statusCounts.pending}</Text>
          <Text muted>Pending</Text>
        </Row>
        <div style={{ height: 16, width: 1, backgroundColor: 'var(--color-border)' }} />
        <Row alignItems="center" gap={8}>
          <div style={{ width: 12, height: 12, borderRadius: 9999, backgroundColor: 'var(--color-blue-9)' }} />
          <Text weight="semibold">{statusCounts.in_progress}</Text>
          <Text muted>In Progress</Text>
        </Row>
        <div style={{ height: 16, width: 1, backgroundColor: 'var(--color-border)' }} />
        <Row alignItems="center" gap={8}>
          <div style={{ width: 12, height: 12, borderRadius: 9999, backgroundColor: 'var(--color-red-9)' }} />
          <Text weight="semibold">{statusCounts.overdue}</Text>
          <Text muted>Overdue</Text>
        </Row>
        <div style={{ height: 16, width: 1, backgroundColor: 'var(--color-border)' }} />
        <Row alignItems="center" gap={8}>
          <div style={{ width: 12, height: 12, borderRadius: 9999, backgroundColor: 'var(--color-green-9)' }} />
          <Text weight="semibold">{statusCounts.completed}</Text>
          <Text muted>Completed</Text>
        </Row>
      </Row>

      <Card
        style={{
          backgroundColor: 'var(--color-background)',
          borderRadius: 12,
          border: '1px solid var(--color-border)',
          padding: 16,
        }}
      >
        <Stack gap={16}>
          <Row alignItems="center" gap={12}>
            <Stack style={{ flex: 1, position: 'relative' }}>
              <div
                style={{
                  position: 'absolute',
                  left: 12,
                  top: '50%',
                  transform: 'translateY(-50%)',
                  zIndex: 1,
                }}
              >
                <Search color="var(--color-text-muted)" size={20} />
              </div>
              <Input
                type="text"
                placeholder="Search tasks by title or description..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                style={{
                  width: '100%',
                  paddingLeft: 40,
                  paddingRight: 16,
                  paddingTop: 10,
                  paddingBottom: 10,
                  backgroundColor: 'var(--color-background)',
                  border: '1px solid var(--color-border)',
                  borderRadius: 8,
                  fontSize: 14,
                }}
              />
            </Stack>
            <button
              onPress={() => setShowFilters(!showFilters)}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 8,
                paddingLeft: 16,
                paddingRight: 16,
                paddingTop: 10,
                paddingBottom: 10,
                border: `1px solid ${showFilters ? 'var(--color-blue-9)' : 'var(--color-border)'}`,
                borderRadius: 8,
                fontSize: 14,
                fontWeight: 500,
                backgroundColor: showFilters ? 'var(--color-blue-2)' : 'var(--color-background)',
                color: showFilters ? 'var(--color-blue-11)' : 'var(--color-text-muted)',
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
                    backgroundColor: 'var(--color-blue-9)',
                    color: 'white',
                    fontSize: 12,
                    borderRadius: 9999,
                  }}
                >
                  {activeFilterCount}
                </span>
              )}
            </button>
          </Row>

          {showFilters && (
            <Stack style={{ borderTop: '1px solid var(--color-border)', paddingTop: 16 }} gap={16}>
              <Row gap={16} style={{ flexWrap: 'wrap' }}>
                <Stack style={{ flex: 1, minWidth: '20%' }}>
                  <Text size="xs" weight="medium" muted style={{ marginBottom: 8 }}>
                    Priority
                  </Text>
                  <select
                    value={selectedPriority}
                    onChange={(e) =>
                      setSelectedPriority(e.target.value as TaskPriority | 'all')
                    }
                    style={{
                      width: '100%',
                      padding: '8px 12px',
                      backgroundColor: 'var(--color-background)',
                      border: '1px solid var(--color-border)',
                      borderRadius: 8,
                      fontSize: 14,
                      color: 'var(--color-text)',
                    }}
                  >
                    <option value="all">All Priorities ({tasks.length})</option>
                    <option value="critical">Critical ({filterCounts.priority.critical})</option>
                    <option value="high">High ({filterCounts.priority.high})</option>
                    <option value="medium">Medium ({filterCounts.priority.medium})</option>
                    <option value="low">Low ({filterCounts.priority.low})</option>
                  </select>
                </Stack>

                <Stack style={{ flex: 1, minWidth: '20%' }}>
                  <Text size="xs" weight="medium" muted style={{ marginBottom: 8 }}>
                    Status
                  </Text>
                  <select
                    value={selectedStatus}
                    onChange={(e) =>
                      setSelectedStatus(e.target.value as TaskStatus | 'all')
                    }
                    style={{
                      width: '100%',
                      padding: '8px 12px',
                      backgroundColor: 'var(--color-background)',
                      border: '1px solid var(--color-border)',
                      borderRadius: 8,
                      fontSize: 14,
                      color: 'var(--color-text)',
                    }}
                  >
                    <option value="all">All Statuses ({tasks.length})</option>
                    <option value="pending">Pending ({filterCounts.status.pending})</option>
                    <option value="in_progress">In Progress ({filterCounts.status.in_progress})</option>
                    <option value="overdue">Overdue ({filterCounts.status.overdue})</option>
                    <option value="completed">Completed ({filterCounts.status.completed})</option>
                  </select>
                </Stack>

                <Stack style={{ flex: 1, minWidth: '20%' }}>
                  <Text size="xs" weight="medium" muted style={{ marginBottom: 8 }}>
                    Client
                  </Text>
                  <select
                    value={selectedClient}
                    onChange={(e) => setSelectedClient(e.target.value)}
                    style={{
                      width: '100%',
                      padding: '8px 12px',
                      backgroundColor: 'var(--color-background)',
                      border: '1px solid var(--color-border)',
                      borderRadius: 8,
                      fontSize: 14,
                      color: 'var(--color-text)',
                    }}
                  >
                    <option value="all">All Clients ({tasks.length})</option>
                    {filterCounts.clientOptions.map((client) => (
                      <option key={client.id} value={client.id}>
                        {client.name} ({client.count})
                      </option>
                    ))}
                  </select>
                </Stack>

                <Stack style={{ flex: 1, minWidth: '20%' }}>
                  <Text size="xs" weight="medium" muted style={{ marginBottom: 8 }}>
                    Project
                  </Text>
                  <select
                    value={selectedProject}
                    onChange={(e) => setSelectedProject(e.target.value)}
                    style={{
                      width: '100%',
                      padding: '8px 12px',
                      backgroundColor: 'var(--color-background)',
                      border: '1px solid var(--color-border)',
                      borderRadius: 8,
                      fontSize: 14,
                      color: 'var(--color-text)',
                    }}
                  >
                    <option value="all">All Projects</option>
                    {allProjects.map((project) => (
                      <option key={project.id} value={project.id}>
                        {project.name}
                      </option>
                    ))}
                  </select>
                </Stack>
              </Row>

              {activeFilterCount > 0 && (
                <button
                  onPress={clearFilters}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: 8,
                    fontSize: 14,
                    color: 'var(--color-text-muted)',
                    backgroundColor: 'transparent',
                    border: 'none',
                    cursor: 'pointer',
                  }}
                >
                  <X size={16} />
                  <span>Clear all filters</span>
                </button>
              )}
            </Stack>
          )}

          <Row
            alignItems="center"
            justifyContent="space-between"
            style={{ borderTop: '1px solid var(--color-border)', paddingTop: 16 }}
          >
            <Text size="sm" muted>
              Showing{' '}
              <Text size="sm" weight="semibold">
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
                  borderRadius: 4,
                  fontSize: 14,
                  color: 'var(--color-text)',
                }}
              >
                <option value="due_date">Due Date</option>
                <option value="priority">Priority</option>
                <option value="status">Status</option>
              </select>
              <button
                onPress={() =>
                  setSortOrder((prev) => (prev === 'asc' ? 'desc' : 'asc'))
                }
                style={{
                  padding: 6,
                  border: '1px solid var(--color-border)',
                  borderRadius: 4,
                  backgroundColor: 'transparent',
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
              </button>
            </Row>
          </Row>
        </Stack>
      </Card>

      <Stack gap={12}>
        {filteredAndSortedTasks.map((task) => {
          const dueDate = formatDueDate(task.due_date);
          const projectName =
            projects.find((p) => p.id === task.project_id)?.name ?? 'Unknown';
          const clientName = getClientName(task.client_id);
          const priorityStyle = getPriorityStyle(task.priority);
          return (
            <Card
              key={task.id}
              onPress={() => handleTaskClick(task)}
              style={{
                backgroundColor: 'var(--color-background)',
                borderRadius: 12,
                border: '1px solid var(--color-border)',
                cursor: 'pointer',
              }}
            >
              <Stack padding={20}>
                <Row alignItems="flex-start" justifyContent="space-between" style={{ marginBottom: 12 }}>
                  <Stack style={{ flex: 1 }}>
                    <Row alignItems="center" gap={12} style={{ marginBottom: 8 }}>
                      <Text size="md" weight="semibold">
                        {task.title}
                      </Text>
                      <span
                        style={{
                          paddingLeft: 8,
                          paddingRight: 8,
                          paddingTop: 2,
                          paddingBottom: 2,
                          fontSize: 12,
                          fontWeight: 500,
                          borderRadius: 4,
                          border: `1px solid ${priorityStyle.borderColor}`,
                          backgroundColor: priorityStyle.backgroundColor,
                          color: priorityStyle.color,
                        }}
                      >
                        {task.priority?.toUpperCase()}
                      </span>
                      {/* REQ-282: Use TaskStatusBadge with tooltip and rejection reason */}
                      <TaskStatusBadge
                        status={task.status}
                        rejectionReason={task.rejection_reason}
                        size="xs"
                      />
                    </Row>
                    <Text size="sm" muted style={{ marginBottom: 12 }}>
                      {task.description}
                    </Text>
                    <Row
                      alignItems="center"
                      style={{ flexWrap: 'wrap', gap: '4px 16px', fontSize: 12 }}
                    >
                      <Row alignItems="center" gap={4}>
                        <Calendar size={14} color="var(--color-text-muted)" />
                        <Text size="xs" style={{ color: dueDate.color }}>
                          {dueDate.text}
                        </Text>
                      </Row>
                      <Text size="xs" muted>•</Text>
                      <Text size="xs" muted>{projectName}</Text>
                      {clientName && task.client_id && (
                        <>
                          <Text size="xs" muted>•</Text>
                          <button
                            onPress={(e) => handleClientClick(e, task.client_id!)}
                            style={{
                              display: 'flex',
                              alignItems: 'center',
                              gap: 4,
                              color: 'var(--color-blue-10)',
                              backgroundColor: 'transparent',
                              border: 'none',
                              cursor: 'pointer',
                              fontSize: 12,
                            }}
                          >
                            <Building2 size={14} />
                            <span>{clientName}</span>
                          </button>
                        </>
                      )}
                      {/* REQ-282 TASK-4: Display sub company context */}
                      {task.sub_company_name && (
                        <>
                          <Text size="xs" muted>•</Text>
                          <Row alignItems="center" gap={4} style={{ color: 'var(--color-purple-10)' }}>
                            <HardHat size={14} />
                            <Text size="xs" style={{ color: 'var(--color-purple-10)' }}>{task.sub_company_name}</Text>
                          </Row>
                        </>
                      )}
                    </Row>
                  </Stack>
                </Row>
              </Stack>
            </Card>
          );
        })}
      </Stack>

      {filteredAndSortedTasks.length === 0 && (
        <Card
          style={{
            backgroundColor: 'var(--color-background)',
            borderRadius: 12,
            border: '1px solid var(--color-border)',
            padding: 48,
            textAlign: 'center',
          }}
        >
          <Stack alignItems="center">
            <CheckCircle color="var(--color-text-muted)" size={64} style={{ marginBottom: 16 }} />
            <H3 style={{ fontSize: 18, fontWeight: 600, marginBottom: 8 }}>
              No tasks found
            </H3>
            <Text muted>
              Try adjusting your filters or search criteria
            </Text>
          </Stack>
        </Card>
      )}

      <TaskModal
        isOpen={isTaskModalOpen}
        onClose={() => {
          setIsTaskModalOpen(false);
          setSelectedTask(null);
        }}
        task={selectedTask ?? undefined}
        onSave={handleSaveTask}
        projects={projects}
      />
    </Stack>
  );
}
