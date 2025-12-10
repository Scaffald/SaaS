import React, { useState } from 'react';
import { Clock, CheckCircle } from 'lucide-react';
import { Task } from '../../types';
import { formatDate, isOverdue } from '../../utils/dateHelpers';
import TaskDetailModal from './TaskDetailModal';

interface ManagerTasksPanelProps {
  tasks: Task[];
  onTaskClick?: (task: Task) => void;
  onUpdateTask?: (taskId: string, updates: Partial<Task>) => void;
}

export default function ManagerTasksPanel({
  tasks,
  onUpdateTask,
}: ManagerTasksPanelProps) {
  const [activeView, setActiveView] = useState<
    'action_required' | 'delegated' | 'completed'
  >('action_required');
  const [selectedTask, setSelectedTask] = useState<Task | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);

  const actionRequiredTasks = tasks.filter(
    (t) =>
      (t.status === 'pending' || t.status === 'in_progress') &&
      t.target_role === 'manager'
  );

  const delegatedTasks = tasks.filter(
    (t) =>
      t.origin_role === 'manager' &&
      t.target_role !== 'manager' &&
      t.status !== 'completed' &&
      t.status !== 'cancelled'
  );

  const completedTasks = tasks.filter((t) => t.status === 'completed');

  const getDisplayTasks = () => {
    switch (activeView) {
      case 'action_required':
        return actionRequiredTasks;
      case 'delegated':
        return delegatedTasks;
      case 'completed':
        return completedTasks;
    }
  };

  const getPriorityBadge = (priority: string) => {
    switch (priority) {
      case 'urgent':
        return 'bg-error-100 text-error-700';
      case 'high':
        return 'bg-warning-100 text-warning-700';
      default:
        return 'bg-primary-100 text-primary-700';
    }
  };

  const displayTasks = getDisplayTasks();

  const handleTaskClick = (task: Task) => {
    setSelectedTask(task);
    setIsModalOpen(true);
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setSelectedTask(null);
  };

  const handleUpdateTask = (taskId: string, updates: Partial<Task>) => {
    onUpdateTask?.(taskId, updates);
  };

  return (
    <div className="bg-surface rounded-lg shadow-sm border border-border">
      <div className="p-6 border-b border-border">
        <h2 className="text-lg font-semibold text-text-primary mb-4">
          Task Management
        </h2>

        <div className="flex space-x-2">
          <button
            onClick={() => setActiveView('action_required')}
            className={`px-4 py-2 text-sm font-medium rounded-lg transition-colors ${
              activeView === 'action_required'
                ? 'bg-primary-500 text-white'
                : 'text-text-secondary hover:bg-surface-hover'
            }`}
          >
            Action Required ({actionRequiredTasks.length})
          </button>
          <button
            onClick={() => setActiveView('delegated')}
            className={`px-4 py-2 text-sm font-medium rounded-lg transition-colors ${
              activeView === 'delegated'
                ? 'bg-primary-500 text-white'
                : 'text-text-secondary hover:bg-surface-hover'
            }`}
          >
            Delegated ({delegatedTasks.length})
          </button>
          <button
            onClick={() => setActiveView('completed')}
            className={`px-4 py-2 text-sm font-medium rounded-lg transition-colors ${
              activeView === 'completed'
                ? 'bg-primary-500 text-white'
                : 'text-text-secondary hover:bg-surface-hover'
            }`}
          >
            Completed ({completedTasks.length})
          </button>
        </div>
      </div>

      <div className="overflow-x-auto">
        {displayTasks.length > 0 ? (
          <table className="w-full">
            <thead className="bg-bg-secondary border-b border-border">
              <tr>
                <th className="text-left py-3 px-4 text-xs font-medium text-text-secondary uppercase tracking-wider">
                  Task
                </th>
                <th className="text-left py-3 px-4 text-xs font-medium text-text-secondary uppercase tracking-wider">
                  Priority
                </th>
                <th className="text-left py-3 px-4 text-xs font-medium text-text-secondary uppercase tracking-wider">
                  Type
                </th>
                <th className="text-left py-3 px-4 text-xs font-medium text-text-secondary uppercase tracking-wider">
                  Assigned To
                </th>
                <th className="text-left py-3 px-4 text-xs font-medium text-text-secondary uppercase tracking-wider">
                  Due Date
                </th>
                <th className="text-left py-3 px-4 text-xs font-medium text-text-secondary uppercase tracking-wider">
                  Status
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {displayTasks.map((task) => (
                <tr
                  key={task.id}
                  onClick={() => handleTaskClick(task)}
                  className="hover:bg-bg-secondary cursor-pointer transition-colors"
                >
                  <td className="py-3 px-4">
                    <div>
                      <p className="text-sm font-medium text-text-primary">
                        {task.title}
                      </p>
                      {task.description && (
                        <p className="text-xs text-text-secondary line-clamp-1 mt-0.5">
                          {task.description}
                        </p>
                      )}
                    </div>
                  </td>
                  <td className="py-3 px-4">
                    <span
                      className={`inline-flex items-center px-2 py-1 rounded text-xs font-medium ${getPriorityBadge(task.priority)}`}
                    >
                      {task.priority}
                    </span>
                  </td>
                  <td className="py-3 px-4">
                    <span className="text-sm text-text-primary capitalize">
                      {task.task_type || 'General'}
                    </span>
                  </td>
                  <td className="py-3 px-4">
                    <div className="flex items-center space-x-2">
                      <div className="w-7 h-7 bg-primary-500 rounded-full flex items-center justify-center">
                        <span className="text-xs font-semibold text-white">
                          {task.assigned_to
                            ? task.assigned_to.name
                                .split(' ')
                                .map((n) => n[0])
                                .join('')
                            : 'UN'}
                        </span>
                      </div>
                      <span className="text-sm text-text-primary">
                        {task.assigned_to
                          ? task.assigned_to.name
                          : 'Unassigned'}
                      </span>
                    </div>
                  </td>
                  <td className="py-3 px-4">
                    {task.due_date && (
                      <div
                        className={`flex items-center text-sm ${isOverdue(task.due_date) ? 'text-error-600 font-medium' : 'text-text-primary'}`}
                      >
                        <Clock size={14} className="mr-1.5" />
                        {formatDate(task.due_date)}
                      </div>
                    )}
                  </td>
                  <td className="py-3 px-4">
                    <span
                      className={`inline-flex items-center px-2 py-1 rounded text-xs font-medium ${
                        task.status === 'completed'
                          ? 'bg-success-100 text-success-700'
                          : task.status === 'in_progress'
                            ? 'bg-primary-100 text-primary-700'
                            : 'bg-gray-100 text-gray-700'
                      }`}
                    >
                      {task.status.replace('_', ' ')}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        ) : (
          <div className="text-center py-12">
            <CheckCircle
              className="mx-auto text-text-tertiary mb-3"
              size={48}
            />
            <p className="text-text-secondary">
              No {activeView.replace('_', ' ')} tasks
            </p>
          </div>
        )}
      </div>

      <TaskDetailModal
        task={selectedTask}
        isOpen={isModalOpen}
        onClose={handleCloseModal}
        onUpdateTask={handleUpdateTask}
        availableUsers={[
          { id: 'user-manager-1', name: 'Steve Massei', role: 'Manager' },
          { id: 'user-sub-1', name: 'Chris Cutler', role: 'Subcontractor' },
          { id: 'user-sub-2', name: 'Gale Baldwin', role: 'Subcontractor' },
          { id: 'user-sub-3', name: 'Troy Sprague', role: 'Subcontractor' },
        ]}
      />
    </div>
  );
}
