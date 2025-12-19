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
} from 'lucide-react';
import { YStack, XStack, Text, H1, H3, Card, Input, Label, Button as TamaguiButton } from '@unicornlove/ui';
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
        return { color: '$red10', backgroundColor: '$red2', borderColor: '$red6' };
      case 'high':
        return { color: '$yellow10', backgroundColor: '$yellow2', borderColor: '$yellow6' };
      case 'medium':
        return { color: '$blue10', backgroundColor: '$blue2', borderColor: '$blue6' };
      case 'low':
        return { color: '$color10', backgroundColor: '$gray2', borderColor: '$gray6' };
      default:
        return { color: '$color10', backgroundColor: '$gray2', borderColor: '$gray6' };
    }
  };


  const formatDueDate = (dueAt: string | undefined) => {
    if (!dueAt) return { text: 'No due date', color: '$color11' };
    const date = new Date(dueAt);
    const now = new Date();
    const diffTime = date.getTime() - now.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

    if (diffDays < 0)
      return {
        text: `${Math.abs(diffDays)}d overdue`,
        color: '$red10',
      };
    if (diffDays === 0) return { text: 'Due today', color: '$yellow10' };
    if (diffDays === 1)
      return { text: 'Due tomorrow', color: '$yellow10' };
    if (diffDays <= 3)
      return { text: `Due in ${diffDays}d`, color: '$yellow10' };
    return { text: date.toLocaleDateString(), color: '$color11' };
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
    <YStack gap="$6">
      <XStack alignItems="center" justifyContent="space-between">
        <YStack>
          <H1 fontSize="$9" fontWeight="bold" color="$color12">
            Tasks
          </H1>
          <Text color="$color11" fontSize="$6" marginTop="$1">
            Manage compliance tasks across {allProjects.length} active projects
          </Text>
        </YStack>
        <Button variant="primary" onClick={handleCreateTask}>
          Create Task
        </Button>
      </XStack>

      {/* REQ-260: View navigation tabs */}
      <XStack alignItems="center" borderBottomWidth={1} borderColor="$borderColor">
        <TamaguiButton
          onPress={() => setSelectedView('inbox')}
          alignItems="center"
          gap="$2"
          paddingHorizontal="$4"
          paddingVertical="$3"
          fontSize="$3"
          fontWeight="500"
          borderBottomWidth={2}
          borderColor={selectedView === 'inbox' ? '$blue9' : 'transparent'}
          color={selectedView === 'inbox' ? '$blue10' : '$color11'}
          hoverStyle={{
            color: selectedView === 'inbox' ? '$blue10' : '$color12',
            borderColor: selectedView === 'inbox' ? '$blue9' : '$borderColor',
          }}
          backgroundColor="transparent"
        >
          <Inbox size={18} />
          <Text>Inbox</Text>
          <XStack
            marginLeft="$1"
            paddingHorizontal="$2"
            paddingVertical="$0.5"
            fontSize="$1"
            borderRadius={9999}
            backgroundColor={selectedView === 'inbox' ? '$blue2' : '$gray2'}
            color={selectedView === 'inbox' ? '$blue11' : '$color11'}
          >
            <Text fontSize="$1" color={selectedView === 'inbox' ? '$blue11' : '$color11'}>
              {viewCounts.inbox}
            </Text>
          </XStack>
        </TamaguiButton>
        <TamaguiButton
          onPress={() => setSelectedView('assigned_by_me')}
          alignItems="center"
          gap="$2"
          paddingHorizontal="$4"
          paddingVertical="$3"
          fontSize="$3"
          fontWeight="500"
          borderBottomWidth={2}
          borderColor={selectedView === 'assigned_by_me' ? '$blue9' : 'transparent'}
          color={selectedView === 'assigned_by_me' ? '$blue10' : '$color11'}
          hoverStyle={{
            color: selectedView === 'assigned_by_me' ? '$blue10' : '$color12',
            borderColor: selectedView === 'assigned_by_me' ? '$blue9' : '$borderColor',
          }}
          backgroundColor="transparent"
        >
          <Send size={18} />
          <Text>Assigned by Me</Text>
          <XStack
            marginLeft="$1"
            paddingHorizontal="$2"
            paddingVertical="$0.5"
            fontSize="$1"
            borderRadius={9999}
            backgroundColor={selectedView === 'assigned_by_me' ? '$blue2' : '$gray2'}
            color={selectedView === 'assigned_by_me' ? '$blue11' : '$color11'}
          >
            <Text fontSize="$1" color={selectedView === 'assigned_by_me' ? '$blue11' : '$color11'}>
              {viewCounts.assigned_by_me}
            </Text>
          </XStack>
        </TamaguiButton>
        <TamaguiButton
          onPress={() => setSelectedView('all')}
          alignItems="center"
          gap="$2"
          paddingHorizontal="$4"
          paddingVertical="$3"
          fontSize="$3"
          fontWeight="500"
          borderBottomWidth={2}
          borderColor={selectedView === 'all' ? '$blue9' : 'transparent'}
          color={selectedView === 'all' ? '$blue10' : '$color11'}
          hoverStyle={{
            color: selectedView === 'all' ? '$blue10' : '$color12',
            borderColor: selectedView === 'all' ? '$blue9' : '$borderColor',
          }}
          backgroundColor="transparent"
        >
          <List size={18} />
          <Text>All Tasks</Text>
          <XStack
            marginLeft="$1"
            paddingHorizontal="$2"
            paddingVertical="$0.5"
            fontSize="$1"
            borderRadius={9999}
            backgroundColor={selectedView === 'all' ? '$blue2' : '$gray2'}
            color={selectedView === 'all' ? '$blue11' : '$color11'}
          >
            <Text fontSize="$1" color={selectedView === 'all' ? '$blue11' : '$color11'}>
              {viewCounts.all}
            </Text>
          </XStack>
        </TamaguiButton>
      </XStack>

      <XStack alignItems="center" gap="$4" fontSize="$3">
        <XStack alignItems="center" gap="$2">
          <YStack width={12} height={12} borderRadius={9999} backgroundColor="$blue9" />
          <Text fontWeight="600" color="$color12">
            {statusCounts.pending}
          </Text>
          <Text color="$color11">Pending</Text>
        </XStack>
        <YStack height={16} width={1} backgroundColor="$borderColor" />
        <XStack alignItems="center" gap="$2">
          <YStack width={12} height={12} borderRadius={9999} backgroundColor="$blue9" />
          <Text fontWeight="600" color="$color12">
            {statusCounts.in_progress}
          </Text>
          <Text color="$color11">In Progress</Text>
        </XStack>
        <YStack height={16} width={1} backgroundColor="$borderColor" />
        <XStack alignItems="center" gap="$2">
          <YStack width={12} height={12} borderRadius={9999} backgroundColor="$red9" />
          <Text fontWeight="600" color="$color12">
            {statusCounts.overdue}
          </Text>
          <Text color="$color11">Overdue</Text>
        </XStack>
        <YStack height={16} width={1} backgroundColor="$borderColor" />
        <XStack alignItems="center" gap="$2">
          <YStack width={12} height={12} borderRadius={9999} backgroundColor="$green9" />
          <Text fontWeight="600" color="$color12">
            {statusCounts.completed}
          </Text>
          <Text color="$color11">Completed</Text>
        </XStack>
      </XStack>

      <Card
        backgroundColor="$background"
        borderRadius="$4"
        elevation={1}
        borderWidth={1}
        borderColor="$borderColor"
        padding="$4"
      >
        <YStack gap="$4">
          <XStack alignItems="center" gap="$3">
            <YStack flex={1} position="relative">
              <YStack
                position="absolute"
                left="$3"
                top="50%"
                transform="translateY(-50%)"
                zIndex={1}
              >
                <Search color="$color10" size={20} />
              </YStack>
              <Input
                type="text"
                placeholder="Search tasks by title or description..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                width="100%"
                paddingLeft="$10"
                paddingRight="$4"
                paddingVertical="$2.5"
                backgroundColor="$background"
                borderWidth={1}
                borderColor="$borderColor"
                borderRadius="$4"
                fontSize="$3"
                color="$color12"
              />
            </YStack>
            <TamaguiButton
              onPress={() => setShowFilters(!showFilters)}
              alignItems="center"
              gap="$2"
              paddingHorizontal="$4"
              paddingVertical="$2.5"
              borderWidth={1}
              borderRadius="$4"
              fontSize="$3"
              fontWeight="500"
              backgroundColor={showFilters ? '$blue2' : '$background'}
              borderColor={showFilters ? '$blue9' : '$borderColor'}
              color={showFilters ? '$blue11' : '$color11'}
              hoverStyle={{
                backgroundColor: showFilters ? '$blue2' : '$gray2',
              }}
            >
              <Filter size={18} />
              <Text>Filters</Text>
              {activeFilterCount > 0 && (
                <XStack
                  marginLeft="$1"
                  paddingHorizontal="$2"
                  paddingVertical="$0.5"
                  backgroundColor="$blue9"
                  color="white"
                  fontSize="$1"
                  borderRadius={9999}
                >
                  <Text fontSize="$1" color="white">
                    {activeFilterCount}
                  </Text>
                </XStack>
              )}
            </TamaguiButton>
          </XStack>

          {showFilters && (
            <YStack borderTopWidth={1} borderColor="$borderColor" paddingTop="$4" gap="$4">
              <XStack
                flexDirection="column"
                $gtMd={{ flexDirection: 'row' }}
                $gtLg={{ flexDirection: 'row' }}
                gap="$4"
                flexWrap="wrap"
              >
                <YStack flex={1} minWidth="20%">
                  <Label fontSize="$1" fontWeight="500" color="$color11" marginBottom="$2">
                    Priority
                  </Label>
                  <select
                    value={selectedPriority}
                    onChange={(e) =>
                      setSelectedPriority(e.target.value as TaskPriority | 'all')
                    }
                    style={{
                      width: '100%',
                      padding: '8px 12px',
                      backgroundColor: 'var(--background)',
                      border: '1px solid var(--borderColor)',
                      borderRadius: '8px',
                      fontSize: '14px',
                      color: 'var(--color12)',
                    }}
                  >
                    <option value="all">All Priorities ({tasks.length})</option>
                    <option value="critical">Critical ({filterCounts.priority.critical})</option>
                    <option value="high">High ({filterCounts.priority.high})</option>
                    <option value="medium">Medium ({filterCounts.priority.medium})</option>
                    <option value="low">Low ({filterCounts.priority.low})</option>
                  </select>
                </YStack>

                <YStack flex={1} minWidth="20%">
                  <Label fontSize="$1" fontWeight="500" color="$color11" marginBottom="$2">
                    Status
                  </Label>
                  <select
                    value={selectedStatus}
                    onChange={(e) =>
                      setSelectedStatus(e.target.value as TaskStatus | 'all')
                    }
                    style={{
                      width: '100%',
                      padding: '8px 12px',
                      backgroundColor: 'var(--background)',
                      border: '1px solid var(--borderColor)',
                      borderRadius: '8px',
                      fontSize: '14px',
                      color: 'var(--color12)',
                    }}
                  >
                    <option value="all">All Statuses ({tasks.length})</option>
                    <option value="pending">Pending ({filterCounts.status.pending})</option>
                    <option value="in_progress">In Progress ({filterCounts.status.in_progress})</option>
                    <option value="overdue">Overdue ({filterCounts.status.overdue})</option>
                    <option value="completed">Completed ({filterCounts.status.completed})</option>
                  </select>
                </YStack>

                <YStack flex={1} minWidth="20%">
                  <Label fontSize="$1" fontWeight="500" color="$color11" marginBottom="$2">
                    Client
                  </Label>
                  <select
                    value={selectedClient}
                    onChange={(e) => setSelectedClient(e.target.value)}
                    style={{
                      width: '100%',
                      padding: '8px 12px',
                      backgroundColor: 'var(--background)',
                      border: '1px solid var(--borderColor)',
                      borderRadius: '8px',
                      fontSize: '14px',
                      color: 'var(--color12)',
                    }}
                  >
                    <option value="all">All Clients ({tasks.length})</option>
                    {filterCounts.clientOptions.map((client) => (
                      <option key={client.id} value={client.id}>
                        {client.name} ({client.count})
                      </option>
                    ))}
                  </select>
                </YStack>

                <YStack flex={1} minWidth="20%">
                  <Label fontSize="$1" fontWeight="500" color="$color11" marginBottom="$2">
                    Project
                  </Label>
                  <select
                    value={selectedProject}
                    onChange={(e) => setSelectedProject(e.target.value)}
                    style={{
                      width: '100%',
                      padding: '8px 12px',
                      backgroundColor: 'var(--background)',
                      border: '1px solid var(--borderColor)',
                      borderRadius: '8px',
                      fontSize: '14px',
                      color: 'var(--color12)',
                    }}
                  >
                    <option value="all">All Projects</option>
                    {allProjects.map((project) => (
                      <option key={project.id} value={project.id}>
                        {project.name}
                      </option>
                    ))}
                  </select>
                </YStack>
              </XStack>

              {activeFilterCount > 0 && (
                <XStack
                  as="button"
                  alignItems="center"
                  gap="$2"
                  fontSize="$3"
                  color="$color11"
                  hoverStyle={{ color: '$color12' }}
                  onClick={clearFilters}
                >
                  <X size={16} color="$color11" />
                  <Text fontSize="$3" color="$color11">Clear all filters</Text>
                </XStack>
              )}
            </YStack>
          )}

          <XStack
            alignItems="center"
            justifyContent="space-between"
            borderTopWidth={1}
            borderColor="$borderColor"
            paddingTop="$4"
          >
            <Text fontSize="$3" color="$color11">
              Showing{' '}
              <Text fontSize="$3" fontWeight="600" color="$color12">
                {filteredAndSortedTasks.length}
              </Text>{' '}
              of {tasks.length} tasks
            </Text>
            <XStack alignItems="center" gap="$3">
              <Text fontSize="$1" color="$color11">Sort by:</Text>
              <select
                value={sortBy}
                onChange={(e) =>
                  setSortBy(e.target.value as 'due_date' | 'priority' | 'status')
                }
                style={{
                  padding: '6px 12px',
                  backgroundColor: 'var(--background)',
                  border: '1px solid var(--borderColor)',
                  borderRadius: '4px',
                  fontSize: '14px',
                  color: 'var(--color12)',
                }}
              >
                <option value="due_date">Due Date</option>
                <option value="priority">Priority</option>
                <option value="status">Status</option>
              </select>
              <XStack
                as="button"
                padding="$1.5"
                borderWidth={1}
                borderColor="$borderColor"
                borderRadius="$2"
                hoverStyle={{ backgroundColor: '$gray2' }}
                onClick={() =>
                  setSortOrder((prev) => (prev === 'asc' ? 'desc' : 'asc'))
                }
              >
                <ChevronDown
                  size={16}
                  color="$color11"
                  style={{
                    transform: sortOrder === 'desc' ? 'rotate(180deg)' : 'none',
                    transition: 'transform 0.2s',
                  }}
                />
              </XStack>
            </XStack>
          </XStack>
        </YStack>
      </Card>

      <YStack gap="$3">
        {filteredAndSortedTasks.map((task) => {
          const dueDate = formatDueDate(task.due_date);
          const projectName =
            projects.find((p) => p.id === task.project_id)?.name ?? 'Unknown';
          const clientName = getClientName(task.client_id);
          const priorityColors = getPriorityColor(task.priority);
          return (
            <Card
              key={task.id}
              backgroundColor="$background"
              borderRadius="$4"
              elevation={1}
              borderWidth={1}
              borderColor="$borderColor"
              hoverStyle={{ borderColor: '$blue8' }}
              cursor="pointer"
              onClick={() => handleTaskClick(task)}
            >
              <YStack padding="$5">
                <XStack alignItems="flex-start" justifyContent="space-between" marginBottom="$3">
                  <YStack flex={1}>
                    <XStack alignItems="center" gap="$3" marginBottom="$2">
                      <Text
                        fontSize="$4"
                        fontWeight="600"
                        color="$color12"
                        hoverStyle={{ color: '$blue10' }}
                      >
                        {task.title}
                      </Text>
                      <XStack
                        paddingHorizontal="$2"
                        paddingVertical="$0.5"
                        fontSize="$1"
                        fontWeight="500"
                        borderRadius="$2"
                        borderWidth={1}
                        {...priorityColors}
                      >
                        <Text fontSize="$1" fontWeight="500" color={priorityColors.color}>
                          {task.priority?.toUpperCase()}
                        </Text>
                      </XStack>
                      {/* REQ-282: Use TaskStatusBadge with tooltip and rejection reason */}
                      <TaskStatusBadge
                        status={task.status}
                        rejectionReason={task.rejection_reason}
                        size="xs"
                      />
                    </XStack>
                    <Text fontSize="$3" color="$color11" marginBottom="$3">
                      {task.description}
                    </Text>
                    <XStack
                      alignItems="center"
                      flexWrap="wrap"
                      gapHorizontal="$4"
                      gapVertical="$1"
                      fontSize="$1"
                      color="$color10"
                    >
                      <XStack alignItems="center" gap="$1">
                        <Calendar size={14} color="$color10" />
                        <Text fontSize="$1" color={dueDate.color}>
                          {dueDate.text}
                        </Text>
                      </XStack>
                      <Text fontSize="$1" color="$color10">•</Text>
                      <Text fontSize="$1" color="$color10">{projectName}</Text>
                      {clientName && task.client_id && (
                        <>
                          <Text fontSize="$1" color="$color10">•</Text>
                          <XStack
                            as="button"
                            alignItems="center"
                            gap="$1"
                            color="$blue10"
                            hoverStyle={{ color: '$blue11', textDecoration: 'underline' }}
                            onClick={(e) => handleClientClick(e, task.client_id!)}
                          >
                            <Building2 size={14} color="$blue10" />
                            <Text fontSize="$1" color="$blue10">{clientName}</Text>
                          </XStack>
                        </>
                      )}
                      {/* REQ-282 TASK-4: Display sub company context */}
                      {task.sub_company_name && (
                        <>
                          <Text fontSize="$1" color="$color10">•</Text>
                          <XStack alignItems="center" gap="$1" color="$purple10">
                            <HardHat size={14} color="$purple10" />
                            <Text fontSize="$1" color="$purple10">{task.sub_company_name}</Text>
                          </XStack>
                        </>
                      )}
                    </XStack>
                  </YStack>
                </XStack>
              </YStack>
            </Card>
          );
        })}
      </YStack>

      {filteredAndSortedTasks.length === 0 && (
        <Card
          alignItems="center"
          paddingVertical="$12"
          backgroundColor="$background"
          borderRadius="$4"
          borderWidth={1}
          borderColor="$borderColor"
        >
          <CheckCircle color="$color10" size={64} marginBottom="$4" />
          <H3 fontSize="$6" fontWeight="600" color="$color12" marginBottom="$2">
            No tasks found
          </H3>
          <Text color="$color11">
            Try adjusting your filters or search criteria
          </Text>
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
    </YStack>
  );
}
