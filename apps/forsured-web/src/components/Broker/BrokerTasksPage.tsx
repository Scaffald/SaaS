import React, { useState, useMemo, useEffect, useRef, useCallback } from 'react';
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
} from 'lucide-react';
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

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'critical':
        return 'text-error-600 bg-error-50 border-error-200';
      case 'high':
        return 'text-warning-600 bg-warning-50 border-warning-200';
      case 'medium':
        return 'text-primary-600 bg-primary-50 border-primary-200';
      case 'low':
        return 'text-text-tertiary bg-gray-50 border-gray-200';
      default:
        return 'text-text-tertiary bg-gray-50 border-gray-200';
    }
  };


  const formatDueDate = (dueAt: string | undefined) => {
    if (!dueAt) return { text: 'No due date', color: 'text-text-secondary' };
    const date = new Date(dueAt);
    const now = new Date();
    const diffTime = date.getTime() - now.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

    if (diffDays < 0)
      return {
        text: `${Math.abs(diffDays)}d overdue`,
        color: 'text-error-600',
      };
    if (diffDays === 0) return { text: 'Due today', color: 'text-warning-600' };
    if (diffDays === 1)
      return { text: 'Due tomorrow', color: 'text-warning-600' };
    if (diffDays <= 3)
      return { text: `Due in ${diffDays}d`, color: 'text-warning-600' };
    return { text: date.toLocaleDateString(), color: 'text-text-secondary' };
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

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-display text-3xl font-bold text-text-primary">
            Tasks
          </h1>
          <p className="text-text-secondary text-lg mt-1">
            Manage compliance tasks across {allProjects.length} active projects
          </p>
        </div>
        <Button variant="primary" onClick={handleCreateTask}>
          Create Task
        </Button>
      </div>

      {/* REQ-260: View navigation tabs */}
      <div className="flex items-center border-b border-border">
        <button
          onClick={() => setSelectedView('inbox')}
          className={`flex items-center space-x-2 px-4 py-3 text-sm font-medium border-b-2 transition-colors ${
            selectedView === 'inbox'
              ? 'border-primary-500 text-primary-600'
              : 'border-transparent text-text-secondary hover:text-text-primary hover:border-border'
          }`}
        >
          <Inbox size={18} />
          <span>Inbox</span>
          <span className={`ml-1 px-2 py-0.5 text-xs rounded-full ${
            selectedView === 'inbox'
              ? 'bg-primary-100 text-primary-700'
              : 'bg-gray-100 text-text-secondary'
          }`}>
            {viewCounts.inbox}
          </span>
        </button>
        <button
          onClick={() => setSelectedView('assigned_by_me')}
          className={`flex items-center space-x-2 px-4 py-3 text-sm font-medium border-b-2 transition-colors ${
            selectedView === 'assigned_by_me'
              ? 'border-primary-500 text-primary-600'
              : 'border-transparent text-text-secondary hover:text-text-primary hover:border-border'
          }`}
        >
          <Send size={18} />
          <span>Assigned by Me</span>
          <span className={`ml-1 px-2 py-0.5 text-xs rounded-full ${
            selectedView === 'assigned_by_me'
              ? 'bg-primary-100 text-primary-700'
              : 'bg-gray-100 text-text-secondary'
          }`}>
            {viewCounts.assigned_by_me}
          </span>
        </button>
        <button
          onClick={() => setSelectedView('all')}
          className={`flex items-center space-x-2 px-4 py-3 text-sm font-medium border-b-2 transition-colors ${
            selectedView === 'all'
              ? 'border-primary-500 text-primary-600'
              : 'border-transparent text-text-secondary hover:text-text-primary hover:border-border'
          }`}
        >
          <List size={18} />
          <span>All Tasks</span>
          <span className={`ml-1 px-2 py-0.5 text-xs rounded-full ${
            selectedView === 'all'
              ? 'bg-primary-100 text-primary-700'
              : 'bg-gray-100 text-text-secondary'
          }`}>
            {viewCounts.all}
          </span>
        </button>
      </div>

      <div className="flex items-center space-x-4 text-sm">
        <div className="flex items-center space-x-2">
          <div className="w-3 h-3 rounded-full bg-primary-500"></div>
          <span className="font-semibold text-text-primary">
            {statusCounts.pending}
          </span>
          <span className="text-text-secondary">Pending</span>
        </div>
        <div className="h-4 w-px bg-border"></div>
        <div className="flex items-center space-x-2">
          <div className="w-3 h-3 rounded-full bg-blue-500"></div>
          <span className="font-semibold text-text-primary">
            {statusCounts.in_progress}
          </span>
          <span className="text-text-secondary">In Progress</span>
        </div>
        <div className="h-4 w-px bg-border"></div>
        <div className="flex items-center space-x-2">
          <div className="w-3 h-3 rounded-full bg-error-500"></div>
          <span className="font-semibold text-text-primary">
            {statusCounts.overdue}
          </span>
          <span className="text-text-secondary">Overdue</span>
        </div>
        <div className="h-4 w-px bg-border"></div>
        <div className="flex items-center space-x-2">
          <div className="w-3 h-3 rounded-full bg-success-500"></div>
          <span className="font-semibold text-text-primary">
            {statusCounts.completed}
          </span>
          <span className="text-text-secondary">Completed</span>
        </div>
      </div>

      <div className="bg-surface rounded-lg shadow-sm border border-border p-4 space-y-4">
        <div className="flex items-center space-x-3">
          <div className="flex-1 relative">
            <Search
              className="absolute left-3 top-1/2 transform -translate-y-1/2 text-text-tertiary"
              size={20}
            />
            <input
              type="text"
              placeholder="Search tasks by title or description..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2.5 bg-bg-primary border border-border rounded-lg text-sm text-text-primary placeholder-text-tertiary focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
            />
          </div>
          <button
            onClick={() => setShowFilters(!showFilters)}
            className={`flex items-center space-x-2 px-4 py-2.5 border rounded-lg text-sm font-medium transition-colors ${
              showFilters
                ? 'bg-primary-50 border-primary-500 text-primary-700'
                : 'bg-surface border-border text-text-secondary hover:bg-bg-secondary'
            }`}
          >
            <Filter size={18} />
            <span>Filters</span>
            {activeFilterCount > 0 && (
              <span className="ml-1 px-2 py-0.5 bg-primary-500 text-white text-xs rounded-full">
                {activeFilterCount}
              </span>
            )}
          </button>
        </div>

        {showFilters && (
          <div className="border-t border-border pt-4 space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              <div>
                <label className="block text-xs font-medium text-text-secondary mb-2">
                  Priority
                </label>
                <select
                  value={selectedPriority}
                  onChange={(e) =>
                    setSelectedPriority(e.target.value as TaskPriority | 'all')
                  }
                  className="w-full px-3 py-2 bg-bg-primary border border-border rounded-lg text-sm text-text-primary focus:outline-none focus:ring-2 focus:ring-primary-500"
                >
                  <option value="all">All Priorities ({tasks.length})</option>
                  <option value="critical">Critical ({filterCounts.priority.critical})</option>
                  <option value="high">High ({filterCounts.priority.high})</option>
                  <option value="medium">Medium ({filterCounts.priority.medium})</option>
                  <option value="low">Low ({filterCounts.priority.low})</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-medium text-text-secondary mb-2">
                  Status
                </label>
                <select
                  value={selectedStatus}
                  onChange={(e) =>
                    setSelectedStatus(e.target.value as TaskStatus | 'all')
                  }
                  className="w-full px-3 py-2 bg-bg-primary border border-border rounded-lg text-sm text-text-primary focus:outline-none focus:ring-2 focus:ring-primary-500"
                >
                  <option value="all">All Statuses ({tasks.length})</option>
                  <option value="pending">Pending ({filterCounts.status.pending})</option>
                  <option value="in_progress">In Progress ({filterCounts.status.in_progress})</option>
                  <option value="overdue">Overdue ({filterCounts.status.overdue})</option>
                  <option value="completed">Completed ({filterCounts.status.completed})</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-medium text-text-secondary mb-2">
                  Client
                </label>
                <select
                  value={selectedClient}
                  onChange={(e) => setSelectedClient(e.target.value)}
                  className="w-full px-3 py-2 bg-bg-primary border border-border rounded-lg text-sm text-text-primary focus:outline-none focus:ring-2 focus:ring-primary-500"
                >
                  <option value="all">All Clients ({tasks.length})</option>
                  {filterCounts.clientOptions.map((client) => (
                    <option key={client.id} value={client.id}>
                      {client.name} ({client.count})
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-medium text-text-secondary mb-2">
                  Project
                </label>
                <select
                  value={selectedProject}
                  onChange={(e) => setSelectedProject(e.target.value)}
                  className="w-full px-3 py-2 bg-bg-primary border border-border rounded-lg text-sm text-text-primary focus:outline-none focus:ring-2 focus:ring-primary-500"
                >
                  <option value="all">All Projects</option>
                  {allProjects.map((project) => (
                    <option key={project.id} value={project.id}>
                      {project.name}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {activeFilterCount > 0 && (
              <button
                onClick={clearFilters}
                className="flex items-center space-x-2 text-sm text-text-secondary hover:text-text-primary transition-colors"
              >
                <X size={16} />
                <span>Clear all filters</span>
              </button>
            )}
          </div>
        )}

        <div className="flex items-center justify-between border-t border-border pt-4">
          <div className="text-sm text-text-secondary">
            Showing{' '}
            <span className="font-semibold text-text-primary">
              {filteredAndSortedTasks.length}
            </span>{' '}
            of {tasks.length} tasks
          </div>
          <div className="flex items-center space-x-3">
            <span className="text-xs text-text-secondary">Sort by:</span>
            <select
              value={sortBy}
              onChange={(e) =>
                setSortBy(e.target.value as 'due_date' | 'priority' | 'status')
              }
              className="px-3 py-1.5 bg-bg-primary border border-border rounded text-sm text-text-primary focus:outline-none focus:ring-2 focus:ring-primary-500"
            >
              <option value="due_date">Due Date</option>
              <option value="priority">Priority</option>
              <option value="status">Status</option>
            </select>
            <button
              onClick={() =>
                setSortOrder((prev) => (prev === 'asc' ? 'desc' : 'asc'))
              }
              className="p-1.5 border border-border rounded hover:bg-bg-secondary transition-colors"
            >
              <ChevronDown
                size={16}
                className={`text-text-secondary transform transition-transform ${
                  sortOrder === 'desc' ? 'rotate-180' : ''
                }`}
              />
            </button>
          </div>
        </div>
      </div>

      <div className="space-y-3">
        {filteredAndSortedTasks.map((task) => {
          const dueDate = formatDueDate(task.due_date);
          const projectName =
            projects.find((p) => p.id === task.project_id)?.name ?? 'Unknown';
          const clientName = getClientName(task.client_id);
          return (
            <div
              key={task.id}
              className="bg-surface rounded-lg shadow-sm border border-border hover:border-primary-300 transition-all cursor-pointer group"
              onClick={() => handleTaskClick(task)}
            >
              <div className="p-5">
                <div className="flex items-start justify-between mb-3">
                  <div className="flex-1">
                    <div className="flex items-center space-x-3 mb-2">
                      <h3 className="text-base font-semibold text-text-primary group-hover:text-primary-600 transition-colors">
                        {task.title}
                      </h3>
                      <span
                        className={`px-2 py-0.5 text-xs font-medium rounded border ${getPriorityColor(task.priority)}`}
                      >
                        {task.priority?.toUpperCase()}
                      </span>
                      {/* REQ-282: Use TaskStatusBadge with tooltip and rejection reason */}
                      <TaskStatusBadge
                        status={task.status}
                        rejectionReason={task.rejection_reason}
                        size="xs"
                      />
                    </div>
                    <p className="text-sm text-text-secondary mb-3">
                      {task.description}
                    </p>
                    <div className="flex items-center flex-wrap gap-x-4 gap-y-1 text-xs text-text-tertiary">
                      <span className="flex items-center space-x-1">
                        <Calendar size={14} />
                        <span className={dueDate.color}>{dueDate.text}</span>
                      </span>
                      <span>•</span>
                      <span>{projectName}</span>
                      {clientName && task.client_id && (
                        <>
                          <span>•</span>
                          <button
                            onClick={(e) => handleClientClick(e, task.client_id!)}
                            className="flex items-center space-x-1 text-primary-600 hover:text-primary-700 hover:underline transition-colors"
                          >
                            <Building2 size={14} />
                            <span>{clientName}</span>
                          </button>
                        </>
                      )}
                      {/* REQ-282 TASK-4: Display sub company context */}
                      {task.sub_company_name && (
                        <>
                          <span>•</span>
                          <span className="flex items-center space-x-1 text-secondary-600">
                            <HardHat size={14} />
                            <span>{task.sub_company_name}</span>
                          </span>
                        </>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {filteredAndSortedTasks.length === 0 && (
        <div className="text-center py-16 bg-surface rounded-lg border border-border">
          <CheckCircle className="mx-auto text-text-tertiary mb-4" size={64} />
          <h3 className="text-lg font-semibold text-text-primary mb-2">
            No tasks found
          </h3>
          <p className="text-text-secondary">
            Try adjusting your filters or search criteria
          </p>
        </div>
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
    </div>
  );
}
