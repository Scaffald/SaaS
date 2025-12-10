import React, { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  ArrowLeft,
  Calendar,
  User,
  Building,
  AlertCircle,
  CheckCircle,
  Clock,
  MessageSquare,
  Paperclip,
  MoreHorizontal,
} from 'lucide-react';
import { useTasks } from '../../hooks/useTasks';
import { useProjects } from '../../hooks/useProjects';
import { useUsers } from '../../hooks/useUsers';
import Button from '../Common/Button';
import { DashboardSkeleton } from '../Common/SkeletonLoader';

export default function BrokerTaskDetailPage() {
  const { taskId } = useParams<{ taskId: string }>();
  const navigate = useNavigate();
  const { tasks, loading: tasksLoading, updateTask } = useTasks();
  const { projects, loading: projectsLoading } = useProjects();
  const { users, loading: usersLoading } = useUsers();
  const [isUpdating, setIsUpdating] = useState(false);

  const task = tasks.find((t) => t.id === taskId);
  const project = projects.find((p) => p.id === task?.project_id);
  const assignee = users.find((u) => u.id === task?.assigned_to);

  const isLoading = tasksLoading || projectsLoading || usersLoading;

  if (isLoading) {
    return <DashboardSkeleton />;
  }

  if (!task) {
    return (
      <div className="space-y-6">
        <button
          onClick={() => navigate(-1)}
          className="flex items-center space-x-2 text-text-secondary hover:text-text-primary transition-colors"
        >
          <ArrowLeft size={20} />
          <span>Back</span>
        </button>
        <div className="text-center py-16 bg-surface rounded-lg border border-border">
          <AlertCircle className="mx-auto text-error-500 mb-4" size={64} />
          <h3 className="text-lg font-semibold text-text-primary mb-2">
            Task Not Found
          </h3>
          <p className="text-text-secondary">
            The task you're looking for doesn't exist or has been deleted.
          </p>
        </div>
      </div>
    );
  }

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

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'pending':
        return 'text-primary-600 bg-primary-50';
      case 'in_progress':
        return 'text-blue-600 bg-blue-50';
      case 'overdue':
        return 'text-error-600 bg-error-50';
      case 'completed':
        return 'text-success-600 bg-success-50';
      default:
        return 'text-text-tertiary bg-gray-50';
    }
  };

  const handleStatusChange = async (newStatus: string) => {
    setIsUpdating(true);
    try {
      await updateTask(task.id, { status: newStatus as Task['status'] });
    } finally {
      setIsUpdating(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <button
          onClick={() => navigate(-1)}
          className="flex items-center space-x-2 text-text-secondary hover:text-text-primary transition-colors"
        >
          <ArrowLeft size={20} />
          <span>Back to Tasks</span>
        </button>
        <div className="flex items-center space-x-3">
          <Button variant="outline" size="sm">
            <Paperclip size={16} className="mr-2" />
            Attachments
          </Button>
          <Button variant="outline" size="sm">
            <MessageSquare size={16} className="mr-2" />
            Comments
          </Button>
          <Button variant="ghost" size="sm">
            <MoreHorizontal size={16} />
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
          <div className="bg-surface rounded-lg shadow-sm border border-border p-6">
            <div className="flex items-start justify-between mb-4">
              <div className="flex-1">
                <div className="flex items-center space-x-3 mb-3">
                  <span
                    className={`px-3 py-1 text-sm font-medium rounded border ${getPriorityColor(task.priority)}`}
                  >
                    {task.priority?.toUpperCase()}
                  </span>
                  <span
                    className={`px-3 py-1 text-sm font-medium rounded ${getStatusColor(task.status)}`}
                  >
                    {task.status?.replace('_', ' ').toUpperCase()}
                  </span>
                </div>
                <h1 className="text-2xl font-bold text-text-primary mb-2">
                  {task.title}
                </h1>
              </div>
            </div>

            <div className="prose prose-sm max-w-none text-text-secondary">
              <p>{task.description || 'No description provided.'}</p>
            </div>
          </div>

          <div className="bg-surface rounded-lg shadow-sm border border-border p-6">
            <h2 className="text-lg font-semibold text-text-primary mb-4">
              Activity
            </h2>
            <div className="text-center py-8 text-text-secondary">
              <Clock size={32} className="mx-auto mb-2 opacity-50" />
              <p>No activity recorded yet</p>
            </div>
          </div>
        </div>

        <div className="space-y-6">
          <div className="bg-surface rounded-lg shadow-sm border border-border p-6">
            <h2 className="text-lg font-semibold text-text-primary mb-4">
              Details
            </h2>
            <dl className="space-y-4">
              <div>
                <dt className="text-xs font-medium text-text-secondary uppercase mb-1">
                  Project
                </dt>
                <dd className="flex items-center space-x-2 text-text-primary">
                  <Building size={16} className="text-text-tertiary" />
                  <span>{project?.name ?? 'Not assigned'}</span>
                </dd>
              </div>

              <div>
                <dt className="text-xs font-medium text-text-secondary uppercase mb-1">
                  Assigned To
                </dt>
                <dd className="flex items-center space-x-2 text-text-primary">
                  <User size={16} className="text-text-tertiary" />
                  <span>{assignee?.name ?? 'Unassigned'}</span>
                </dd>
              </div>

              <div>
                <dt className="text-xs font-medium text-text-secondary uppercase mb-1">
                  Due Date
                </dt>
                <dd className="flex items-center space-x-2 text-text-primary">
                  <Calendar size={16} className="text-text-tertiary" />
                  <span>
                    {task.due_date
                      ? new Date(task.due_date).toLocaleDateString()
                      : 'No due date'}
                  </span>
                </dd>
              </div>

              <div>
                <dt className="text-xs font-medium text-text-secondary uppercase mb-1">
                  Created
                </dt>
                <dd className="text-text-primary">
                  {task.created_at
                    ? new Date(task.created_at).toLocaleDateString()
                    : 'Unknown'}
                </dd>
              </div>
            </dl>
          </div>

          <div className="bg-surface rounded-lg shadow-sm border border-border p-6">
            <h2 className="text-lg font-semibold text-text-primary mb-4">
              Actions
            </h2>
            <div className="space-y-2">
              {task.status !== 'completed' && (
                <Button
                  variant="primary"
                  className="w-full"
                  onClick={() => handleStatusChange('completed')}
                  disabled={isUpdating}
                >
                  <CheckCircle size={16} className="mr-2" />
                  Mark Complete
                </Button>
              )}
              {task.status === 'pending' && (
                <Button
                  variant="outline"
                  className="w-full"
                  onClick={() => handleStatusChange('in_progress')}
                  disabled={isUpdating}
                >
                  <Clock size={16} className="mr-2" />
                  Start Task
                </Button>
              )}
              {task.status === 'completed' && (
                <Button
                  variant="outline"
                  className="w-full"
                  onClick={() => handleStatusChange('pending')}
                  disabled={isUpdating}
                >
                  Reopen Task
                </Button>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

interface Task {
  id: string;
  title: string;
  description?: string;
  status: 'pending' | 'in_progress' | 'completed' | 'overdue';
  priority: 'critical' | 'high' | 'medium' | 'low';
  due_date?: string;
  created_at?: string;
  project_id?: string;
  assigned_to?: string;
}
