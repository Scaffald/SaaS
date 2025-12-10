import React, { useState } from 'react';
import {
  Clock,
  Building,
  FileText,
  CheckCircle,
  Upload,
  AlertCircle,
  XCircle,
  Eye,
  Mail,
  DollarSign,
} from 'lucide-react';
import { Task, SeverityLevel, SubcontractorTaskMetadata } from '../../types';
import { formatDate, isOverdue } from '../../utils/dateHelpers';
import Button from '../Common/Button';

interface SubcontractorTasksPanelProps {
  tasks: Task[];
  onTaskClick?: (task: Task) => void;
  onCompleteTask?: (taskId: string) => void;
  onViewRequirements?: (task: Task) => void;
  onContactBroker?: (task: Task) => void;
  onUploadDocument?: (task: Task) => void;
  onRequestQuote?: (task: Task) => void;
}

const severityOrder: Record<SeverityLevel, number> = {
  critical: 0,
  high: 1,
  medium: 2,
  low: 3,
};

const getSeverityLevel = (task: Task): SeverityLevel => {
  const metadata = task.metadata as SubcontractorTaskMetadata | undefined;
  return metadata?.severity_level || 'medium';
};

const sortTasksBySeverity = (tasks: Task[]): Task[] => {
  return [...tasks].sort((a, b) => {
    const severityA = severityOrder[getSeverityLevel(a)];
    const severityB = severityOrder[getSeverityLevel(b)];

    if (severityA !== severityB) {
      return severityA - severityB;
    }

    // Secondary sort by due date (earliest first)
    if (a.due_date && b.due_date) {
      return new Date(a.due_date).getTime() - new Date(b.due_date).getTime();
    }
    if (a.due_date) return -1;
    if (b.due_date) return 1;
    return 0;
  });
};

export default function SubcontractorTasksPanel({
  tasks,
  onTaskClick,
  onCompleteTask,
  onViewRequirements,
  onContactBroker,
  onUploadDocument,
  onRequestQuote,
}: SubcontractorTasksPanelProps) {
  const [filter, setFilter] = useState<'all' | 'broker' | 'manager'>('all');

  const activeTasks = tasks.filter(
    (t) =>
      t.status !== 'completed' &&
      t.status !== 'cancelled' &&
      t.status !== 'approved'
  );

  const filteredTasks =
    filter === 'all'
      ? activeTasks
      : activeTasks.filter((t) => t.origin_role === filter);

  const sortedTasks = sortTasksBySeverity(filteredTasks);

  const getSeverityColor = (severity: SeverityLevel) => {
    switch (severity) {
      case 'critical':
        return 'text-error-600 bg-error-50 border-error-200';
      case 'high':
        return 'text-warning-600 bg-warning-50 border-warning-200';
      case 'medium':
        return 'text-primary-600 bg-primary-50 border-primary-200';
      case 'low':
        return 'text-secondary-600 bg-secondary-50 border-secondary-200';
    }
  };

  const getSeverityBadgeColor = (severity: SeverityLevel) => {
    switch (severity) {
      case 'critical':
        return 'bg-error-600 text-white';
      case 'high':
        return 'bg-warning-600 text-white';
      case 'medium':
        return 'bg-primary-600 text-white';
      case 'low':
        return 'bg-secondary-600 text-white';
    }
  };

  const getTaskTypeLabel = (taskType: string | undefined) => {
    if (!taskType) return 'Task';
    const labels: Record<string, string> = {
      coi_upload: 'COI Upload',
      endorsement_correction: 'Endorsement Correction',
      auto_symbol_compliance: 'Auto Symbol',
      limit_inadequacy: 'Limit Inadequacy',
      operations_language: 'Operations Language',
    };
    return (
      labels[taskType] ||
      taskType
        .split('_')
        .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
        .join(' ')
    );
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'approved':
        return <CheckCircle className="text-success-600" size={16} />;
      case 'rejected':
        return <XCircle className="text-error-600" size={16} />;
      case 'submitted':
        return <Clock className="text-primary-600" size={16} />;
      default:
        return <AlertCircle className="text-warning-600" size={16} />;
    }
  };

  const getStatusLabel = (status: string) => {
    switch (status) {
      case 'pending':
        return 'Pending';
      case 'submitted':
        return 'Submitted';
      case 'approved':
        return 'Approved';
      case 'rejected':
        return 'Rejected';
      default:
        return status;
    }
  };

  const handleQuickAction = (
    action: string,
    task: Task,
    e: React.MouseEvent
  ) => {
    e.stopPropagation();
    switch (action) {
      case 'upload_document':
        onUploadDocument?.(task);
        break;
      case 'view_requirements':
        onViewRequirements?.(task);
        break;
      case 'contact_broker':
        onContactBroker?.(task);
        break;
      case 'request_quote':
      case 'view_quote':
        onRequestQuote?.(task);
        break;
    }
  };

  return (
    <div className="bg-surface rounded-lg shadow-sm border border-border">
      <div className="p-6 border-b border-border">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h2 className="text-lg font-semibold text-text-primary">
              My Tasks
            </h2>
            <p className="text-sm text-text-secondary">Tasks assigned to you</p>
          </div>
          <div className="flex items-center space-x-2">
            <button
              onClick={() => setFilter('all')}
              className={`px-3 py-1 text-xs font-medium rounded ${
                filter === 'all'
                  ? 'bg-primary-500 text-white'
                  : 'bg-neutral-100 text-text-secondary'
              }`}
            >
              All
            </button>
            <button
              onClick={() => setFilter('broker')}
              className={`px-3 py-1 text-xs font-medium rounded ${
                filter === 'broker'
                  ? 'bg-primary-500 text-white'
                  : 'bg-neutral-100 text-text-secondary'
              }`}
            >
              From Broker
            </button>
            <button
              onClick={() => setFilter('manager')}
              className={`px-3 py-1 text-xs font-medium rounded ${
                filter === 'manager'
                  ? 'bg-primary-500 text-white'
                  : 'bg-neutral-100 text-text-secondary'
              }`}
            >
              From Manager
            </button>
          </div>
        </div>
      </div>

      <div className="p-6">
        <div className="space-y-4">
          {sortedTasks.map((task) => {
            const metadata = task.metadata as
              | SubcontractorTaskMetadata
              | undefined;
            const severity = getSeverityLevel(task);

            return (
              <div
                key={task.id}
                className={`border-2 rounded-lg p-4 transition-all cursor-pointer hover:shadow-md ${getSeverityColor(severity)}`}
                onClick={() => onTaskClick?.(task)}
              >
                <div className="flex items-start justify-between mb-3">
                  <div className="flex-1">
                    <div className="flex items-center space-x-2 mb-2 flex-wrap">
                      <span
                        className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-bold uppercase ${getSeverityBadgeColor(severity)}`}
                      >
                        {severity}
                      </span>
                      <span
                        className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium ${
                          task.origin_role === 'broker'
                            ? 'bg-secondary-600 text-white'
                            : 'bg-primary-600 text-white'
                        }`}
                      >
                        {task.origin_role || 'manager'}
                      </span>
                      <span className="text-xs font-medium text-text-secondary px-2 py-0.5 bg-neutral-100 rounded">
                        {getTaskTypeLabel(task.task_type)}
                      </span>
                      <div className="flex items-center space-x-1 text-xs text-text-secondary">
                        {getStatusIcon(task.status)}
                        <span>{getStatusLabel(task.status)}</span>
                      </div>
                    </div>

                    <h3 className="text-sm font-semibold text-text-primary mb-1">
                      {task.title}
                    </h3>
                    {task.description && (
                      <p className="text-sm text-text-secondary mb-2">
                        {task.description}
                      </p>
                    )}

                    {/* Project and GC Info */}
                    {(task.project_name || task.gc_company_name) && (
                      <div className="flex items-center space-x-4 text-xs text-text-secondary mb-2">
                        {task.project_name && (
                          <span className="flex items-center">
                            <Building size={12} className="mr-1" />
                            {task.project_name}
                          </span>
                        )}
                        {task.gc_company_name && (
                          <span>{task.gc_company_name}</span>
                        )}
                      </div>
                    )}

                    {/* Policy Number */}
                    {task.policy_number && (
                      <div className="text-xs text-text-secondary mb-2">
                        Policy: {task.policy_number}
                      </div>
                    )}

                    {/* Metadata Details */}
                    {metadata && (
                      <div className="mt-2 space-y-1">
                        {metadata.missing_endorsement && (
                          <div className="text-xs text-text-secondary">
                            <strong>Missing:</strong>{' '}
                            {metadata.missing_endorsement}
                          </div>
                        )}
                        {metadata.required_endorsement_form && (
                          <div className="text-xs text-text-secondary">
                            <strong>Required Form:</strong>{' '}
                            {metadata.required_endorsement_form}
                          </div>
                        )}
                        {metadata.current_limit && metadata.required_limit && (
                          <div className="text-xs text-text-secondary">
                            <strong>Current:</strong> $
                            {(metadata.current_limit / 1000000).toFixed(1)}M |{' '}
                            <strong>Required:</strong> $
                            {(metadata.required_limit / 1000000).toFixed(1)}M
                          </div>
                        )}
                        {metadata.current_symbol &&
                          metadata.required_symbol && (
                            <div className="text-xs text-text-secondary">
                              <strong>Current:</strong>{' '}
                              {metadata.current_symbol} |{' '}
                              <strong>Required:</strong>{' '}
                              {metadata.required_symbol}
                            </div>
                          )}
                        {metadata.rejection_reason && (
                          <div className="text-xs text-error-600 bg-error-50 p-2 rounded mt-2">
                            <strong>Rejection Reason:</strong>{' '}
                            {metadata.rejection_reason}
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                </div>

                <div className="flex items-center justify-between mt-3 pt-3 border-t border-border/50">
                  <div className="flex items-center space-x-4 text-xs text-text-secondary">
                    {task.created_by && (
                      <div className="flex items-center">
                        <Building size={12} className="mr-1" />
                        {task.created_by.name}
                      </div>
                    )}
                    {task.due_date && (
                      <div className="flex items-center">
                        <Clock size={12} className="mr-1" />
                        {isOverdue(task.due_date) ? (
                          <span className="text-error-600 font-medium">
                            Overdue!
                          </span>
                        ) : (
                          <span>Due {formatDate(task.due_date)}</span>
                        )}
                      </div>
                    )}
                    {task.document_link && (
                      <a
                        href={task.document_link}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-center text-primary-600 hover:text-primary-700"
                        onClick={(e) => e.stopPropagation()}
                      >
                        <FileText size={12} className="mr-1" />
                        View Doc
                      </a>
                    )}
                  </div>

                  <div className="flex items-center space-x-2">
                    {/* Quick Actions */}
                    {task.quick_actions && task.quick_actions.length > 0 && (
                      <>
                        {task.quick_actions.includes('upload_document') && (
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={(e) =>
                              handleQuickAction('upload_document', task, e)
                            }
                            className="flex items-center space-x-1 text-xs"
                          >
                            <Upload size={14} />
                            <span>Upload</span>
                          </Button>
                        )}
                        {task.quick_actions.includes('view_requirements') && (
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={(e) =>
                              handleQuickAction('view_requirements', task, e)
                            }
                            className="flex items-center space-x-1 text-xs"
                          >
                            <Eye size={14} />
                            <span>Requirements</span>
                          </Button>
                        )}
                        {task.quick_actions.includes('contact_broker') && (
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={(e) =>
                              handleQuickAction('contact_broker', task, e)
                            }
                            className="flex items-center space-x-1 text-xs"
                          >
                            <Mail size={14} />
                            <span>Broker</span>
                          </Button>
                        )}
                        {(task.quick_actions.includes('request_quote') ||
                          task.quick_actions.includes('view_quote')) && (
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={(e) =>
                              handleQuickAction('request_quote', task, e)
                            }
                            className="flex items-center space-x-1 text-xs"
                          >
                            <DollarSign size={14} />
                            <span>
                              {task.quick_actions.includes('view_quote')
                                ? 'Quote'
                                : 'Request Quote'}
                            </span>
                          </Button>
                        )}
                      </>
                    )}

                    {/* Complete Button - only show for pending/submitted tasks */}
                    {(task.status === 'pending' ||
                      task.status === 'submitted') && (
                      <Button
                        size="sm"
                        onClick={(e) => {
                          e.stopPropagation();
                          onCompleteTask?.(task.id);
                        }}
                        className="text-xs"
                      >
                        <CheckCircle size={14} className="mr-1" />
                        Complete
                      </Button>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        {sortedTasks.length === 0 && (
          <div className="text-center py-12">
            <CheckCircle className="mx-auto text-success-500 mb-3" size={48} />
            <p className="text-text-primary font-medium">All caught up!</p>
            <p className="text-text-secondary text-sm">No pending tasks</p>
          </div>
        )}
      </div>
    </div>
  );
}
