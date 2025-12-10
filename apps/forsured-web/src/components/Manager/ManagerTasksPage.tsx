/* eslint-disable react-hooks/exhaustive-deps */
import React, { useState, useMemo, useEffect } from 'react';
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

  const getPriorityColor = (priority: string) => { // Changed type to string
    const priorityEnum = taskPriorities?.find(p => p.value === priority);
    if (!priorityEnum) return 'text-text-tertiary bg-gray-50 border-gray-200';

    switch (priorityEnum.value) {
      case 'urgent':
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

  const getStatusColor = (status: string) => { // Changed type to string
    const statusEnum = taskStatuses?.find(s => s.value === status);
    if (!statusEnum) return 'text-text-secondary bg-gray-50';

    switch (statusEnum.value) {
      case 'pending':
        return 'text-primary-600 bg-primary-50';
      case 'in_progress':
        return 'text-blue-600 bg-blue-50';
      case 'submitted':
        return 'text-blue-500 bg-blue-50';
      case 'in_review':
        return 'text-purple-600 bg-purple-50';
      case 'approved':
        return 'text-success-600 bg-success-50';
      case 'rejected':
        return 'text-error-600 bg-error-50';
      case 'needs_info':
        return 'text-warning-600 bg-warning-50';
      case 'completed':
        return 'text-success-600 bg-success-50';
      case 'cancelled':
        return 'text-text-tertiary bg-gray-50';
      default:
        return 'text-text-secondary bg-gray-50';
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
        color: 'text-error-600',
      };
    if (diffDays === 0) return { text: 'Due today', color: 'text-warning-600' };
    if (diffDays === 1)
      return { text: 'Due tomorrow', color: 'text-warning-600' };
    if (diffDays <= 3)
      return { text: `Due in ${diffDays}d`, color: 'text-warning-600' };
    return { text: date.toLocaleDateString(), color: 'text-text-secondary' };
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
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="flex flex-col items-center space-y-4">
          <Loader2 className="h-8 w-8 animate-spin text-primary-500" />
          <p className="text-text-secondary">Loading tasks and filters...</p>
        </div>
      </div>
    );
  }

  // Show error state
  if (error) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <AlertCircle className="mx-auto text-error-500 mb-4" size={48} />
          <h3 className="text-lg font-semibold text-text-primary mb-2">
            Failed to load tasks
          </h3>
          <p className="text-text-secondary">{error.message}</p>
        </div>
      </div>
    );
  }

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
        <Button variant="primary">Create Task</Button>
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
            {statusCounts.needs_attention}
          </span>
          <span className="text-text-secondary">Needs Attention</span>
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
              placeholder="Search tasks by title, description, or tags..."
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
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label className="block text-xs font-medium text-text-secondary mb-2">
                  Status
                </label>
                <select
                  value={selectedStatus}
                  onChange={(e) =>
                    setSelectedStatus(e.target.value as string)
                  }
                  className="w-full px-3 py-2 bg-bg-primary border border-border rounded-lg text-sm text-text-primary focus:outline-none focus:ring-2 focus:ring-primary-500"
                >
                  <option value="ALL">All Statuses</option>
                  {taskStatuses?.map((status) => (
                    <option key={status.value} value={status.value}>
                      {status.display_name}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-medium text-text-secondary mb-2">
                  Priority
                </label>
                <select
                  value={selectedPriority}
                  onChange={(e) =>
                    setSelectedPriority(e.target.value as string)
                  }
                  className="w-full px-3 py-2 bg-bg-primary border border-border rounded-lg text-sm text-text-primary focus:outline-none focus:ring-2 focus:ring-primary-500"
                >
                  <option value="ALL">All Priorities</option>
                  {taskPriorities?.map((priority) => (
                    <option key={priority.value} value={priority.value}>
                      {priority.display_name}
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
                  <option value="ALL">All Projects</option>
                  {allProjects.map((project) => (
                    <option key={project} value={project}>
                      {project}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div>
              <label className="block text-xs font-medium text-text-secondary mb-2">
                s
              </label>
              <div className="flex flex-wrap gap-2">
                {alls.map((tag) => (
                  <button
                    key={tag}
                    onClick={() => toggle(tag)}
                    className={`px-3 py-1.5 text-xs font-medium rounded-full border transition-colors ${
                      selecteds.includes(tag)
                        ? 'bg-primary-500 border-primary-500 text-white'
                        : 'bg-surface border-border text-text-secondary hover:bg-bg-secondary'
                    }`}
                  >
                    {tag}
                  </button>
                ))}
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
            <div
              key={task.id}
              className="bg-surface rounded-lg shadow-sm border border-border hover:border-primary-300 transition-all cursor-pointer group"
              onClick={() => setSelectedTask(task)}
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
                        {formatLabel(task.priority)}
                      </span>
                      <span
                        className={`px-2 py-0.5 text-xs font-medium rounded ${getStatusColor(task.status)}`}
                      >
                        {formatLabel(task.status)}
                      </span>
                    </div>
                    <p className="text-sm text-text-secondary mb-3">
                      {task.description}
                    </p>
                    <div className="flex items-center space-x-4 text-xs text-text-tertiary">
                      <span className="flex items-center space-x-1">
                        <Calendar size={14} />
                        <span className={dueDate.color}>{dueDate.text}</span>
                      </span>
                      <span>•</span>
                      <span>{projectName}</span>
                      {taskBlockers.length > 0 && (
                        <>
                          <span>•</span>
                          <span className="flex items-center space-x-1 text-error-600">
                            <AlertCircle size={14} />
                            <span>
                              {taskBlockers.length} blocker
                              {taskBlockers.length > 1 ? 's' : ''}
                            </span>
                          </span>
                        </>
                      )}
                    </div>
                  </div>
                </div>

                <div className="flex items-center justify-between">
                  <div className="flex flex-wrap gap-1.5">
                    {taskTags.map((tag) => (
                      <span
                        key={tag}
                        className="px-2 py-1 bg-bg-secondary text-text-tertiary text-xs rounded border border-border"
                      >
                        {tag}
                      </span>
                    ))}
                  </div>
                  <div className="flex items-center space-x-2">
                    {taskQuickActions.slice(0, 3).map((action) => (
                      <button
                        key={action}
                        onClick={(e) => {
                          e.stopPropagation();
                        }}
                        className="px-3 py-1.5 text-xs font-medium text-primary-600 border border-primary-600 rounded hover:bg-primary-50 transition-colors"
                      >
                        {action.replace('_', ' ')}
                      </button>
                    ))}
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

      <EnhancedTaskDetailModal
        task={selectedTask}
        isOpen={!!selectedTask}
        onClose={() => setSelectedTask(null)}
        onUpdateTask={(taskId, updates) => {
          console.log('Updating task:', taskId, updates);
          setSelectedTask(null);
        }}
      />
    </div>
  );
}
