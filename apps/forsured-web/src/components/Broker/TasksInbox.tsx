import React, { useState, useMemo } from 'react';
import {
  Clock,
  Calendar,
  User,
  FileText,
  Building2,
  Plus,
} from 'lucide-react';
import { Task } from '../../types';
import { formatDate, getDaysUntil, isOverdue } from '../../utils/dateHelpers';
import Button from '../Common/Button';
import TaskStatusBadge from '../Common/TaskStatusBadge';
import { TaskViewToggle } from '../tasks/TaskViewToggle';
import { useTaskViewFilter, TaskViewType } from '../../hooks/useTaskViewFilter';

interface TasksInboxProps {
  tasks: Task[];
  /** All tasks for counting (before role filtering) - needed for "Assigned by Me" count */
  allTasks?: Task[];
  /** Current user ID for filtering */
  currentUserId?: string;
  onTaskClick?: (task: Task) => void;
  onCreateTask?: () => void;
  onUpdateTaskStatus?: (taskId: string, status: string) => void;
}

export default function TasksInbox({
  tasks,
  allTasks,
  currentUserId,
  onTaskClick,
  onCreateTask,
  onUpdateTaskStatus,
}: TasksInboxProps) {
  const [activeTab, setActiveTab] = useState<'urgent' | 'upcoming'>('urgent');
  const { currentView, setView } = useTaskViewFilter();

  // REQ-268: Calculate counts for view toggle
  // Use allTasks if provided (for accurate counts across both views)
  // Otherwise fall back to tasks array
  const tasksForCounting = allTasks || tasks;

  const { inboxCount, assignedByMeCount } = useMemo(() => {
    if (!currentUserId) {
      return { inboxCount: tasks.length, assignedByMeCount: 0 };
    }

    const inbox = tasksForCounting.filter(
      (t) =>
        t.assigned_to_user_id === currentUserId &&
        t.status !== 'completed' &&
        t.status !== 'cancelled'
    );
    const assignedByMe = tasksForCounting.filter(
      (t) =>
        t.created_by_user_id === currentUserId &&
        t.assigned_to_user_id !== currentUserId && // Exclude self-assigned
        t.status !== 'completed' &&
        t.status !== 'cancelled'
    );

    return {
      inboxCount: inbox.length,
      assignedByMeCount: assignedByMe.length,
    };
  }, [tasksForCounting, currentUserId, tasks.length]);

  // REQ-268: Get header text based on current view
  const getHeaderText = () => {
    if (currentView === 'assigned-by-me') {
      return {
        title: 'Tasks Assigned by You',
        subtitle: 'Track tasks you delegated to others',
      };
    }
    return {
      title: 'Your Tasks Inbox',
      subtitle: 'View, resolve, or delegate issues',
    };
  };

  const headerText = getHeaderText();

  const urgentTasks = tasks.filter(
    (t) =>
      t.status !== 'completed' &&
      t.status !== 'cancelled' &&
      (t.priority === 'urgent' ||
        t.priority === 'high' ||
        (t.due_date && isOverdue(t.due_date)))
  );

  const upcomingTasks = tasks.filter(
    (t) =>
      t.status !== 'completed' &&
      t.status !== 'cancelled' &&
      t.priority !== 'urgent' &&
      t.priority !== 'high' &&
      (!t.due_date || !isOverdue(t.due_date))
  );

  const displayedTasks = activeTab === 'urgent' ? urgentTasks : upcomingTasks;

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'urgent':
        return 'bg-error-100 text-error-700 border-error-300';
      case 'high':
        return 'bg-warning-100 text-warning-700 border-warning-300';
      case 'normal':
        return 'bg-primary-100 text-primary-700 border-primary-300';
      default:
        return 'bg-neutral-100 text-neutral-700 border-neutral-300';
    }
  };


  const getDueDateBadge = (dueDate?: string) => {
    if (!dueDate) return null;

    const daysLeft = getDaysUntil(dueDate);
    if (isOverdue(dueDate)) {
      return (
        <span className="text-xs font-medium text-error-600">Overdue</span>
      );
    } else if (daysLeft === 0) {
      return (
        <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-error-100 text-error-700 border border-error-300">
          Due Today
        </span>
      );
    } else if (daysLeft <= 3) {
      return (
        <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-warning-100 text-warning-700 border border-warning-300">
          Due in {daysLeft}d
        </span>
      );
    }
    return (
      <span className="text-xs text-text-secondary">{formatDate(dueDate)}</span>
    );
  };

  return (
    <div className="bg-surface rounded-lg shadow-sm border border-border">
      <div className="p-6 border-b border-border">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h2 className="text-lg font-semibold text-text-primary">
              {headerText.title}
            </h2>
            <p className="text-sm text-text-secondary">
              {headerText.subtitle}
            </p>
          </div>
          <Button
            onClick={onCreateTask}
            className="flex items-center space-x-2"
          >
            <Plus size={18} />
            <span>New Task</span>
          </Button>
        </div>

        {/* REQ-268: View Toggle - My Inbox vs Assigned by Me */}
        <div className="mb-4">
          <TaskViewToggle
            currentView={currentView}
            onViewChange={setView}
            inboxCount={inboxCount}
            assignedByMeCount={assignedByMeCount}
          />
        </div>

        <div className="flex space-x-4">
          <button
            onClick={() => setActiveTab('urgent')}
            className={`px-4 py-2 text-sm font-medium rounded-lg transition-colors ${
              activeTab === 'urgent'
                ? 'bg-primary-500 text-white'
                : 'text-text-secondary hover:text-text-primary hover:bg-surface-hover'
            }`}
          >
            Urgent ({urgentTasks.length})
          </button>
          <button
            onClick={() => setActiveTab('upcoming')}
            className={`px-4 py-2 text-sm font-medium rounded-lg transition-colors ${
              activeTab === 'upcoming'
                ? 'bg-primary-500 text-white'
                : 'text-text-secondary hover:text-text-primary hover:bg-surface-hover'
            }`}
          >
            Upcoming ({upcomingTasks.length})
          </button>
        </div>
      </div>

      <div className="p-6" id="task-list" role="tabpanel">
        <div className="space-y-4">
          {displayedTasks.map((task) => (
            <div
              key={task.id}
              className="border border-border rounded-lg p-4 hover:border-primary-500 transition-colors cursor-pointer"
              onClick={() => onTaskClick?.(task)}
            >
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <div className="flex items-center space-x-2 mb-2">
                    <span
                      className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium border ${getPriorityColor(task.priority)}`}
                    >
                      {task.priority}
                    </span>
                    {task.due_date && getDueDateBadge(task.due_date)}
                  </div>

                  <h3 className="text-sm font-medium text-text-primary mb-1">
                    {task.title}
                  </h3>
                  {task.description && (
                    <p className="text-sm text-text-secondary mb-2">
                      {task.description}
                    </p>
                  )}

                  <div className="flex items-center flex-wrap gap-x-4 gap-y-1 text-xs text-text-secondary">
                    {task.assigned_to && (
                      <div className="flex items-center">
                        <User size={12} className="mr-1" />
                        {task.assigned_to.name}
                      </div>
                    )}
                    {task.client && (
                      <div className="flex items-center">
                        <FileText size={12} className="mr-1" />
                        {task.client.company_name}
                      </div>
                    )}
                    {/* REQ-282 TASK-4: Display sub company context */}
                    {task.sub_company_name && (
                      <div className="flex items-center">
                        <Building2 size={12} className="mr-1" />
                        <span className="text-primary-600">{task.sub_company_name}</span>
                      </div>
                    )}
                    {task.due_date && (
                      <div className="flex items-center">
                        <Calendar size={12} className="mr-1" />
                        Due: {formatDate(task.due_date)}
                      </div>
                    )}
                  </div>

                  {task.document_link && (
                    <div className="mt-2">
                      <a
                        href={task.document_link}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-xs text-primary-600 hover:text-primary-700 flex items-center"
                        onClick={(e) => e.stopPropagation()}
                      >
                        <FileText size={12} className="mr-1" />
                        View Document
                      </a>
                    </div>
                  )}
                </div>

                <div className="flex flex-col items-end space-y-2 ml-4">
                  {/* REQ-282: Use TaskStatusBadge with tooltip and rejection reason */}
                  <TaskStatusBadge
                    status={task.status}
                    rejectionReason={task.rejection_reason}
                    size="sm"
                  />

                  <div className="relative">
                    <select
                      value={task.status}
                      onChange={(e) => {
                        e.stopPropagation();
                        onUpdateTaskStatus?.(task.id, e.target.value);
                      }}
                      className="text-xs border border-border rounded px-2 py-1 focus:outline-none focus:ring-2 focus:ring-primary-500"
                    >
                      <option value="pending">Pending</option>
                      <option value="in_progress">In Progress</option>
                      <option value="submitted">Submitted</option>
                      <option value="in_review">In Review</option>
                      <option value="approved">Approved</option>
                      <option value="rejected">Rejected</option>
                      <option value="needs_info">Needs Info</option>
                      <option value="awaiting_response">
                        Awaiting Response
                      </option>
                      <option value="completed">Completed</option>
                      <option value="escalated">Escalated</option>
                    </select>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>

        {displayedTasks.length === 0 && (
          <div className="text-center py-12">
            <Clock className="mx-auto text-text-tertiary mb-3" size={48} />
            <p className="text-text-secondary">No {activeTab} tasks</p>
          </div>
        )}
      </div>
    </div>
  );
}
