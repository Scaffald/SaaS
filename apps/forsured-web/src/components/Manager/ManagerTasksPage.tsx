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
} from 'lucide-react';
import { YStack, XStack, Text, H1, H2, H3, Card, Spinner, Circle } from '@unicornlove/ui';
import Button from '../Common/Button';
import EnhancedTaskDetailModal from './EnhancedTaskDetailModal';
import { useMockDatabase } from '../../contexts/DatabaseContext';
import { toast } from 'sonner';
import { useEnums } from '../../hooks/useEnums';

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
  target_role: string;
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

export default function ManagerTasksPage() {
  const db = useMockDatabase();

  // Fetch enums
  const { data: taskStatuses, isLoading: loadingStatuses } = useEnums('task_status');
  const { data: taskPriorities, isLoading: loadingPriorities } = useEnums('task_priority');

  // State for data fetching
  const [tasks, setTasks] = useState<Task[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

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

  // Fetch tasks from database on mount
  useEffect(() => {
    async function fetchTasks() {
      setLoading(true);
      setError(null);

      try {
        const { data, error: queryError } = await db
          .from('tasks')
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
  }, [db]);

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

  const getPriorityColorProps = (priority: string) => {
    const priorityEnum = taskPriorities?.find(p => p.value === priority);
    if (!priorityEnum) return { color: '$color10', backgroundColor: '$gray2', borderColor: '$gray8' };

    switch (priorityEnum.value) {
      case 'urgent':
        return { color: '$red10', backgroundColor: '$red2', borderColor: '$red8' };
      case 'high':
        return { color: '$orange10', backgroundColor: '$orange2', borderColor: '$orange8' };
      case 'medium':
        return { color: '$blue10', backgroundColor: '$blue2', borderColor: '$blue8' };
      case 'low':
        return { color: '$color10', backgroundColor: '$gray2', borderColor: '$gray8' };
      default:
        return { color: '$color10', backgroundColor: '$gray2', borderColor: '$gray8' };
    }
  };

  const getStatusColorProps = (status: string) => {
    const statusEnum = taskStatuses?.find(s => s.value === status);
    if (!statusEnum) return { color: '$color11', backgroundColor: '$gray2' };

    switch (statusEnum.value) {
      case 'pending':
        return { color: '$blue10', backgroundColor: '$blue2' };
      case 'in_progress':
        return { color: '$blue10', backgroundColor: '$blue2' };
      case 'submitted':
        return { color: '$blue9', backgroundColor: '$blue2' };
      case 'in_review':
        return { color: '$purple10', backgroundColor: '$purple2' };
      case 'approved':
        return { color: '$green10', backgroundColor: '$green2' };
      case 'rejected':
        return { color: '$red10', backgroundColor: '$red2' };
      case 'needs_info':
        return { color: '$orange10', backgroundColor: '$orange2' };
      case 'completed':
        return { color: '$green10', backgroundColor: '$green2' };
      case 'cancelled':
        return { color: '$color10', backgroundColor: '$gray2' };
      default:
        return { color: '$color11', backgroundColor: '$gray2' };
    }
  };

  const formatDueDate = (dueAt: string) => {
    const date = new Date(dueAt);
    const now = new Date();
    const diffTime = date.getTime() - now.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

    if (diffDays < 0)
      return {
        text: `${Math.abs(diffDays)}d overdue`,
        color: '$red10',
      };
    if (diffDays === 0) return { text: 'Due today', color: '$orange10' };
    if (diffDays === 1)
      return { text: 'Due tomorrow', color: '$orange10' };
    if (diffDays <= 3)
      return { text: `Due in ${diffDays}d`, color: '$orange10' };
    return { text: date.toLocaleDateString(), color: '$color11' };
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
      <YStack alignItems="center" justifyContent="center" minHeight={400}>
        <YStack alignItems="center" gap="$4">
          <Spinner size="large" color="$blue10" />
          <Text color="$color11">Loading tasks and filters...</Text>
        </YStack>
      </YStack>
    );
  }

  // Show error state
  if (error) {
    return (
      <YStack alignItems="center" justifyContent="center" minHeight={400}>
        <YStack alignItems="center">
          <YStack alignItems="center" marginBottom="$4">
            <AlertCircle color="$red10" size={48} />
          </YStack>
          <H3 fontSize="$6" fontWeight="600" color="$color12" marginBottom="$2">
            Failed to load tasks
          </H3>
          <Text color="$color11">{error.message}</Text>
        </YStack>
      </YStack>
    );
  }

  return (
    <YStack gap="$6">
      <XStack alignItems="center" justifyContent="space-between">
        <YStack>
          <H1 fontSize="$10" fontWeight="700" color="$color12" fontFamily="$heading">
            Tasks
          </H1>
          <Text color="$color11" fontSize="$6" marginTop="$1">
            Manage compliance tasks across {allProjects.length} active projects
          </Text>
        </YStack>
        <Button variant="primary">Create Task</Button>
      </XStack>

      <XStack alignItems="center" gap="$4" fontSize="$3">
        <XStack alignItems="center" gap="$2">
          <Circle size={12} backgroundColor="$blue10" />
          <Text fontWeight="600" color="$color12">
            {statusCounts.pending}
          </Text>
          <Text color="$color11">Pending</Text>
        </XStack>
        <YStack height={16} width={1} backgroundColor="$borderColor" />
        <XStack alignItems="center" gap="$2">
          <Circle size={12} backgroundColor="$blue10" />
          <Text fontWeight="600" color="$color12">
            {statusCounts.in_progress}
          </Text>
          <Text color="$color11">In Progress</Text>
        </XStack>
        <YStack height={16} width={1} backgroundColor="$borderColor" />
        <XStack alignItems="center" gap="$2">
          <Circle size={12} backgroundColor="$red10" />
          <Text fontWeight="600" color="$color12">
            {statusCounts.needs_attention}
          </Text>
          <Text color="$color11">Needs Attention</Text>
        </XStack>
        <YStack height={16} width={1} backgroundColor="$borderColor" />
        <XStack alignItems="center" gap="$2">
          <Circle size={12} backgroundColor="$green10" />
          <Text fontWeight="600" color="$color12">
            {statusCounts.completed}
          </Text>
          <Text color="$color11">Completed</Text>
        </XStack>
      </XStack>

      <Card backgroundColor="$background" borderRadius="$4" borderWidth={1} borderColor="$borderColor" padding="$4" elevation={1} gap="$4">
        <XStack alignItems="center" gap="$3">
          <YStack flex={1} position="relative">
            <YStack position="absolute" left="$3" top="50%" transform="translateY(-50%)" zIndex={1}>
              <Search
                color="$color10"
                size={20}
              />
            </YStack>
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
                backgroundColor: 'var(--background)',
                border: '1px solid var(--borderColor)',
                borderRadius: '8px',
                fontSize: '14px',
                color: 'var(--color12)',
                fontFamily: 'inherit',
              }}
            />
          </YStack>
          <XStack
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
            borderColor={showFilters ? '$blue10' : '$borderColor'}
            color={showFilters ? '$blue10' : '$color11'}
            hoverStyle={{ backgroundColor: '$backgroundHover' }}
            cursor="pointer"
          >
            <Filter size={18} />
            <Text fontSize="$3" fontWeight="500" color={showFilters ? '$blue10' : '$color11'}>
              Filters
            </Text>
            {activeFilterCount > 0 && (
              <Text
                marginLeft="$1"
                paddingHorizontal="$2"
                paddingVertical="$0.5"
                backgroundColor="$blue10"
                color="white"
                fontSize="$1"
                borderRadius={9999}
              >
                {activeFilterCount}
              </Text>
            )}
          </XStack>
        </XStack>

        {showFilters && (
          <YStack borderTopWidth={1} borderColor="$borderColor" paddingTop="$4" gap="$4">
            <XStack flexWrap="wrap" gap="$4" $gtMd={{ flexWrap: 'wrap' }}>
              <YStack flex={1} minWidth="calc(33.333% - 11px)" $gtMd={{ minWidth: 'calc(33.333% - 11px)' }}>
                <Text
                  as="label"
                  display="block"
                  fontSize="$1"
                  fontWeight="500"
                  color="$color11"
                  marginBottom="$2"
                >
                  Status
                </Text>
                <select
                  value={selectedStatus}
                  onChange={(e) =>
                    setSelectedStatus(e.target.value as string)
                  }
                  style={{
                    width: '100%',
                    padding: '8px 12px',
                    backgroundColor: 'var(--background)',
                    border: '1px solid var(--borderColor)',
                    borderRadius: '8px',
                    fontSize: '14px',
                    color: 'var(--color12)',
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
              </YStack>

              <YStack flex={1} minWidth="calc(33.333% - 11px)" $gtMd={{ minWidth: 'calc(33.333% - 11px)' }}>
                <Text
                  as="label"
                  display="block"
                  fontSize="$1"
                  fontWeight="500"
                  color="$color11"
                  marginBottom="$2"
                >
                  Priority
                </Text>
                <select
                  value={selectedPriority}
                  onChange={(e) =>
                    setSelectedPriority(e.target.value as string)
                  }
                  style={{
                    width: '100%',
                    padding: '8px 12px',
                    backgroundColor: 'var(--background)',
                    border: '1px solid var(--borderColor)',
                    borderRadius: '8px',
                    fontSize: '14px',
                    color: 'var(--color12)',
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
              </YStack>

              <YStack flex={1} minWidth="calc(33.333% - 11px)" $gtMd={{ minWidth: 'calc(33.333% - 11px)' }}>
                <Text
                  as="label"
                  display="block"
                  fontSize="$1"
                  fontWeight="500"
                  color="$color11"
                  marginBottom="$2"
                >
                  Project
                </Text>
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
              </YStack>
            </XStack>

            <YStack>
              <Text
                as="label"
                display="block"
                fontSize="$1"
                fontWeight="500"
                color="$color11"
                marginBottom="$2"
              >
                Tags
              </Text>
              <XStack flexWrap="wrap" gap="$2">
                {alls.map((tag) => (
                  <XStack
                    key={tag}
                    onPress={() => toggle(tag)}
                    paddingHorizontal="$3"
                    paddingVertical="$1.5"
                    fontSize="$1"
                    fontWeight="500"
                    borderRadius={9999}
                    borderWidth={1}
                    backgroundColor={selecteds.includes(tag) ? '$blue10' : '$background'}
                    borderColor={selecteds.includes(tag) ? '$blue10' : '$borderColor'}
                    color={selecteds.includes(tag) ? 'white' : '$color11'}
                    hoverStyle={{ backgroundColor: selecteds.includes(tag) ? '$blue11' : '$backgroundHover' }}
                    cursor="pointer"
                  >
                    <Text fontSize="$1" fontWeight="500" color={selecteds.includes(tag) ? 'white' : '$color11'}>
                      {tag}
                    </Text>
                  </XStack>
                ))}
              </XStack>
            </YStack>

            {activeFilterCount > 0 && (
              <XStack
                onPress={clearFilters}
                alignItems="center"
                gap="$2"
                fontSize="$3"
                color="$color11"
                hoverStyle={{ color: '$color12' }}
                cursor="pointer"
              >
                <X size={16} />
                <Text fontSize="$3" color="$color11">Clear all filters</Text>
              </XStack>
            )}
          </YStack>
        )}

        <XStack alignItems="center" justifyContent="space-between" borderTopWidth={1} borderColor="$borderColor" paddingTop="$4">
          <Text fontSize="$3" color="$color11">
            Showing{' '}
            <Text fontWeight="600" color="$color12">
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
                fontFamily: 'inherit',
              }}
            >
              <option value="due_date">Due Date</option>
              <option value="priority">Priority</option>
              <option value="status">Status</option>
            </select>
            <XStack
              onPress={() =>
                setSortOrder((prev) => (prev === 'asc' ? 'desc' : 'asc'))
              }
              padding="$1.5"
              borderWidth={1}
              borderColor="$borderColor"
              borderRadius="$2"
              hoverStyle={{ backgroundColor: '$backgroundHover' }}
              cursor="pointer"
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
      </Card>

      <YStack gap="$3">
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
              backgroundColor="$background"
              borderRadius="$4"
              borderWidth={1}
              borderColor="$borderColor"
              hoverStyle={{ borderColor: '$blue8' }}
              cursor="pointer"
              onPress={() => setSelectedTask(task)}
              elevation={1}
            >
              <YStack padding="$5">
                <XStack alignItems="flex-start" justifyContent="space-between" marginBottom="$3">
                  <YStack flex={1}>
                    <XStack alignItems="center" gap="$3" marginBottom="$2">
                      <H3 fontSize="$5" fontWeight="600" color="$color12">
                        {task.title}
                      </H3>
                      <Text
                        paddingHorizontal="$2"
                        paddingVertical="$0.5"
                        fontSize="$1"
                        fontWeight="500"
                        borderRadius="$2"
                        borderWidth={1}
                        {...getPriorityColorProps(task.priority)}
                      >
                        {formatLabel(task.priority)}
                      </Text>
                      <Text
                        paddingHorizontal="$2"
                        paddingVertical="$0.5"
                        fontSize="$1"
                        fontWeight="500"
                        borderRadius="$2"
                        {...getStatusColorProps(task.status)}
                      >
                        {formatLabel(task.status)}
                      </Text>
                    </XStack>
                    <Text fontSize="$3" color="$color11" marginBottom="$3">
                      {task.description}
                    </Text>
                    <XStack alignItems="center" gap="$4" fontSize="$1" color="$color10">
                      <XStack alignItems="center" gap="$1">
                        <Calendar size={14} />
                        <Text fontSize="$1" color={dueDate.color}>
                          {dueDate.text}
                        </Text>
                      </XStack>
                      <Text fontSize="$1" color="$color10">•</Text>
                      <Text fontSize="$1" color="$color10">{projectName}</Text>
                      {taskBlockers.length > 0 && (
                        <>
                          <Text fontSize="$1" color="$color10">•</Text>
                          <XStack alignItems="center" gap="$1" fontSize="$1" color="$red10">
                            <AlertCircle size={14} />
                            <Text fontSize="$1" color="$red10">
                              {taskBlockers.length} blocker
                              {taskBlockers.length > 1 ? 's' : ''}
                            </Text>
                          </XStack>
                        </>
                      )}
                    </XStack>
                  </YStack>
                </XStack>

                <XStack alignItems="center" justifyContent="space-between">
                  <XStack flexWrap="wrap" gap="$1.5">
                    {taskTags.map((tag) => (
                      <Text
                        key={tag}
                        paddingHorizontal="$2"
                        paddingVertical="$1"
                        backgroundColor="$backgroundHover"
                        color="$color10"
                        fontSize="$1"
                        borderRadius="$2"
                        borderWidth={1}
                        borderColor="$borderColor"
                      >
                        {tag}
                      </Text>
                    ))}
                  </XStack>
                  <XStack alignItems="center" gap="$2">
                    {taskQuickActions.slice(0, 3).map((action) => (
                      <XStack
                        key={action}
                        onPress={(e) => {
                          e.stopPropagation();
                        }}
                        paddingHorizontal="$3"
                        paddingVertical="$1.5"
                        fontSize="$1"
                        fontWeight="500"
                        color="$blue10"
                        borderWidth={1}
                        borderColor="$blue10"
                        borderRadius="$2"
                        hoverStyle={{ backgroundColor: '$blue2' }}
                        cursor="pointer"
                      >
                        <Text fontSize="$1" fontWeight="500" color="$blue10">
                          {action.replace('_', ' ')}
                        </Text>
                      </XStack>
                    ))}
                  </XStack>
                </XStack>
              </YStack>
            </Card>
          );
        })}
      </YStack>

      {filteredAndSortedTasks.length === 0 && (
        <Card alignItems="center" paddingVertical="$16" backgroundColor="$background" borderRadius="$4" borderWidth={1} borderColor="$borderColor">
          <YStack alignItems="center" marginBottom="$4">
            <CheckCircle color="$color10" size={64} />
          </YStack>
          <H3 fontSize="$6" fontWeight="600" color="$color12" marginBottom="$2">
            No tasks found
          </H3>
          <Text color="$color11">
            Try adjusting your filters or search criteria
          </Text>
        </Card>
      )}

      <EnhancedTaskDetailModal
        task={selectedTask}
        isOpen={!!selectedTask}
        onClose={() => setSelectedTask(null)}
        onUpdateTask={(taskId, updates) => {
          console.log('Updating task:', taskId, updates);
          setSelectedTask(null);
        }}
      />
    </YStack>
  );
}
