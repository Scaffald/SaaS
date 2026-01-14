import { useState } from 'react';
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
import { Stack, Row, Text, Card, Button, H1 } from '@unicornlove/beyond-ui';
import { Task, SeverityLevel, SubcontractorTaskMetadata } from '../../types';
import { formatDate, isOverdue } from '../../utils/dateHelpers';
import CommonButton from '../Common/Button';

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

const getSeverityColors = (severity: SeverityLevel): React.CSSProperties => {
  switch (severity) {
    case 'critical':
      return {
        color: 'var(--color-red10)',
        backgroundColor: 'var(--color-red3)',
        borderColor: 'var(--color-red6)',
      };
    case 'high':
      return {
        color: 'var(--color-orange10)',
        backgroundColor: 'var(--color-orange3)',
        borderColor: 'var(--color-orange6)',
      };
    case 'medium':
      return {
        color: 'var(--color-blue10)',
        backgroundColor: 'var(--color-blue3)',
        borderColor: 'var(--color-blue6)',
      };
    case 'low':
      return {
        color: 'var(--color-gray10)',
        backgroundColor: 'var(--color-gray3)',
        borderColor: 'var(--color-gray6)',
      };
  }
};

const getSeverityBadgeColors = (severity: SeverityLevel): React.CSSProperties => {
  switch (severity) {
    case 'critical':
      return { backgroundColor: 'var(--color-red9)', color: 'white' };
    case 'high':
      return { backgroundColor: 'var(--color-orange9)', color: 'white' };
    case 'medium':
      return { backgroundColor: 'var(--color-blue9)', color: 'white' };
    case 'low':
      return { backgroundColor: 'var(--color-gray9)', color: 'white' };
  }
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
        return <CheckCircle color="var(--color-green10)" size={16} />;
      case 'rejected':
        return <XCircle color="var(--color-red10)" size={16} />;
      case 'submitted':
        return <Clock color="var(--color-blue10)" size={16} />;
      default:
        return <AlertCircle color="var(--color-orange10)" size={16} />;
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
    <Card
      elevation={1}
      style={{
        borderWidth: 1,
        borderStyle: 'solid',
        borderColor: 'var(--color-border)',
      }}
    >
      <Stack
        style={{
          padding: 24,
          borderBottomWidth: 1,
          borderBottomStyle: 'solid',
          borderBottomColor: 'var(--color-border)',
        }}
      >
        <Row
          style={{
            alignItems: 'center',
            justifyContent: 'space-between',
            marginBottom: 16,
            flexWrap: 'wrap',
          }}
        >
          <Stack>
            <H1 style={{ fontSize: 18, fontWeight: 600, color: 'var(--color-gray12)' }}>
              My Tasks
            </H1>
            <Text style={{ fontSize: 12, color: 'var(--color-gray11)' }}>Tasks assigned to you</Text>
          </Stack>
          <Row style={{ alignItems: 'center', gap: 8 }}>
            <Button
              onPress={() => setFilter('all')}
              style={{
                paddingLeft: 12,
                paddingRight: 12,
                paddingTop: 4,
                paddingBottom: 4,
                fontSize: 12,
                fontWeight: 500,
                borderRadius: 4,
                backgroundColor: filter === 'all' ? 'var(--color-blue9)' : 'var(--color-gray3)',
                color: filter === 'all' ? 'white' : 'var(--color-gray11)',
              }}
            >
              All
            </Button>
            <Button
              onPress={() => setFilter('broker')}
              style={{
                paddingLeft: 12,
                paddingRight: 12,
                paddingTop: 4,
                paddingBottom: 4,
                fontSize: 12,
                fontWeight: 500,
                borderRadius: 4,
                backgroundColor: filter === 'broker' ? 'var(--color-blue9)' : 'var(--color-gray3)',
                color: filter === 'broker' ? 'white' : 'var(--color-gray11)',
              }}
            >
              From Broker
            </Button>
            <Button
              onPress={() => setFilter('manager')}
              style={{
                paddingLeft: 12,
                paddingRight: 12,
                paddingTop: 4,
                paddingBottom: 4,
                fontSize: 12,
                fontWeight: 500,
                borderRadius: 4,
                backgroundColor: filter === 'manager' ? 'var(--color-blue9)' : 'var(--color-gray3)',
                color: filter === 'manager' ? 'white' : 'var(--color-gray11)',
              }}
            >
              From Manager
            </Button>
          </Row>
        </Row>
      </Stack>

      <Stack style={{ padding: 24 }}>
        <Stack style={{ gap: 16 }}>
          {sortedTasks.map((task) => {
            const metadata = task.metadata as
              | SubcontractorTaskMetadata
              | undefined;
            const severity = getSeverityLevel(task);
            const severityColors = getSeverityColors(severity);
            const badgeColors = getSeverityBadgeColors(severity);

            return (
              <Card
                key={task.id}
                elevation={0}
                style={{
                  borderWidth: 2,
                  borderStyle: 'solid',
                  borderRadius: 8,
                  padding: 16,
                  cursor: 'pointer',
                  backgroundColor: severityColors.backgroundColor,
                  borderColor: severityColors.borderColor,
                }}
                onPress={() => onTaskClick?.(task)}
              >
                <Row style={{ alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: 12 }}>
                  <Stack style={{ flex: 1 }}>
                    <Row style={{ alignItems: 'center', gap: 8, marginBottom: 8, flexWrap: 'wrap' }}>
                      <span
                        style={{
                          display: 'inline-flex',
                          alignItems: 'center',
                          paddingLeft: 8,
                          paddingRight: 8,
                          paddingTop: 2,
                          paddingBottom: 2,
                          borderRadius: 4,
                          ...badgeColors,
                        }}
                      >
                        <Text style={{ fontSize: 10, fontWeight: 'bold', textTransform: 'uppercase', color: badgeColors.color }}>
                          {severity}
                        </Text>
                      </span>
                      <span
                        style={{
                          display: 'inline-flex',
                          alignItems: 'center',
                          paddingLeft: 8,
                          paddingRight: 8,
                          paddingTop: 2,
                          paddingBottom: 2,
                          borderRadius: 4,
                          backgroundColor: task.origin_role === 'broker' ? 'var(--color-gray9)' : 'var(--color-blue9)',
                        }}
                      >
                        <Text style={{ fontSize: 10, fontWeight: 500, color: 'white' }}>
                          {task.origin_role || 'manager'}
                        </Text>
                      </span>
                      <span
                        style={{
                          display: 'inline-flex',
                          alignItems: 'center',
                          paddingLeft: 8,
                          paddingRight: 8,
                          paddingTop: 2,
                          paddingBottom: 2,
                          borderRadius: 4,
                          backgroundColor: 'var(--color-gray3)',
                        }}
                      >
                        <Text style={{ fontSize: 10, fontWeight: 500, color: 'var(--color-gray11)' }}>
                          {getTaskTypeLabel(task.task_type)}
                        </Text>
                      </span>
                      <Row style={{ alignItems: 'center', gap: 4 }}>
                        {getStatusIcon(task.status)}
                        <Text style={{ fontSize: 10, color: 'var(--color-gray11)' }}>
                          {getStatusLabel(task.status)}
                        </Text>
                      </Row>
                    </Row>

                    <Text style={{ fontSize: 12, fontWeight: 600, color: 'var(--color-gray12)', marginBottom: 4 }}>
                      {task.title}
                    </Text>
                    {task.description && (
                      <Text style={{ fontSize: 12, color: 'var(--color-gray11)', marginBottom: 8 }}>
                        {task.description}
                      </Text>
                    )}

                    {/* Project and GC Info */}
                    {(task.project_name || task.gc_company_name) && (
                      <Row style={{ alignItems: 'center', gap: 16, marginBottom: 8 }}>
                        {task.project_name && (
                          <Row style={{ alignItems: 'center' }}>
                            <Building size={12} style={{ marginRight: 4 }} />
                            <Text style={{ fontSize: 10, color: 'var(--color-gray11)' }}>
                              {task.project_name}
                            </Text>
                          </Row>
                        )}
                        {task.gc_company_name && (
                          <Text style={{ fontSize: 10, color: 'var(--color-gray11)' }}>
                            {task.gc_company_name}
                          </Text>
                        )}
                      </Row>
                    )}

                    {/* Policy Number */}
                    {task.policy_number && (
                      <Text style={{ fontSize: 10, color: 'var(--color-gray11)', marginBottom: 8 }}>
                        Policy: {task.policy_number}
                      </Text>
                    )}

                    {/* Metadata Details */}
                    {metadata && (
                      <Stack style={{ marginTop: 8, gap: 4 }}>
                        {metadata.missing_endorsement && (
                          <Text style={{ fontSize: 10, color: 'var(--color-gray11)' }}>
                            <Text style={{ fontWeight: 'bold' }}>Missing:</Text>{' '}
                            {metadata.missing_endorsement}
                          </Text>
                        )}
                        {metadata.required_endorsement_form && (
                          <Text style={{ fontSize: 10, color: 'var(--color-gray11)' }}>
                            <Text style={{ fontWeight: 'bold' }}>Required Form:</Text>{' '}
                            {metadata.required_endorsement_form}
                          </Text>
                        )}
                        {metadata.current_limit && metadata.required_limit && (
                          <Text style={{ fontSize: 10, color: 'var(--color-gray11)' }}>
                            <Text style={{ fontWeight: 'bold' }}>Current:</Text> $
                            {(metadata.current_limit / 1000000).toFixed(1)}M |{' '}
                            <Text style={{ fontWeight: 'bold' }}>Required:</Text> $
                            {(metadata.required_limit / 1000000).toFixed(1)}M
                          </Text>
                        )}
                        {metadata.current_symbol &&
                          metadata.required_symbol && (
                            <Text style={{ fontSize: 10, color: 'var(--color-gray11)' }}>
                              <Text style={{ fontWeight: 'bold' }}>Current:</Text>{' '}
                              {metadata.current_symbol} |{' '}
                              <Text style={{ fontWeight: 'bold' }}>Required:</Text>{' '}
                              {metadata.required_symbol}
                            </Text>
                          )}
                        {metadata.rejection_reason && (
                          <Card
                            style={{
                              backgroundColor: 'var(--color-red3)',
                              padding: 8,
                              borderRadius: 4,
                              marginTop: 8,
                            }}
                          >
                            <Text style={{ fontSize: 10, color: 'var(--color-red10)' }}>
                              <Text style={{ fontWeight: 'bold' }}>Rejection Reason:</Text>{' '}
                              {metadata.rejection_reason}
                            </Text>
                          </Card>
                        )}
                      </Stack>
                    )}
                  </Stack>
                </Row>

                <Row
                  style={{
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    marginTop: 12,
                    paddingTop: 12,
                    borderTopWidth: 1,
                    borderTopStyle: 'solid',
                    borderTopColor: 'var(--color-border)',
                    opacity: 0.5,
                  }}
                >
                  <Row style={{ alignItems: 'center', gap: 16 }}>
                    {task.created_by && (
                      <Row style={{ alignItems: 'center' }}>
                        <Building size={12} style={{ marginRight: 4 }} />
                        <Text style={{ fontSize: 10, color: 'var(--color-gray11)' }}>
                          {task.created_by.name}
                        </Text>
                      </Row>
                    )}
                    {task.due_date && (
                      <Row style={{ alignItems: 'center' }}>
                        <Clock size={12} style={{ marginRight: 4 }} />
                        {isOverdue(task.due_date) ? (
                          <Text style={{ fontSize: 10, color: 'var(--color-red10)', fontWeight: 500 }}>
                            Overdue!
                          </Text>
                        ) : (
                          <Text style={{ fontSize: 10, color: 'var(--color-gray11)' }}>
                            Due {formatDate(task.due_date)}
                          </Text>
                        )}
                      </Row>
                    )}
                    {task.document_link && (
                      <a href={task.document_link}
                        target="_blank"
                        rel="noopener noreferrer"
                        style={{
                          display: 'flex',
                          alignItems: 'center',
                          color: 'var(--color-blue10)',
                          textDecoration: 'none',
                        }}
                        onClick={(e) => e.stopPropagation()}
                      >
                        <FileText size={12} style={{ marginRight: 4 }} />
                        <Text style={{ fontSize: 10 }}>View Doc</Text>
                      </a>
                    )}
                  </Row>

                  <Row style={{ alignItems: 'center', gap: 8 }}>
                    {/* Quick Actions */}
                    {task.quick_actions && task.quick_actions.length > 0 && (
                      <>
                        {task.quick_actions.includes('upload_document') && (
                          <CommonButton
                            size="sm"
                            variant="ghost"
                            onPress={(e) =>
                              handleQuickAction('upload_document', task, e)
                            }
                          >
                            <Row style={{ alignItems: 'center', gap: 4 }}>
                              <Upload size={14} />
                              <Text style={{ fontSize: 10 }}>Upload</Text>
                            </Row>
                          </CommonButton>
                        )}
                        {task.quick_actions.includes('view_requirements') && (
                          <CommonButton
                            size="sm"
                            variant="ghost"
                            onPress={(e) =>
                              handleQuickAction('view_requirements', task, e)
                            }
                          >
                            <Row style={{ alignItems: 'center', gap: 4 }}>
                              <Eye size={14} />
                              <Text style={{ fontSize: 10 }}>Requirements</Text>
                            </Row>
                          </CommonButton>
                        )}
                        {task.quick_actions.includes('contact_broker') && (
                          <CommonButton
                            size="sm"
                            variant="ghost"
                            onPress={(e) =>
                              handleQuickAction('contact_broker', task, e)
                            }
                          >
                            <Row style={{ alignItems: 'center', gap: 4 }}>
                              <Mail size={14} />
                              <Text style={{ fontSize: 10 }}>Broker</Text>
                            </Row>
                          </CommonButton>
                        )}
                        {(task.quick_actions.includes('request_quote') ||
                          task.quick_actions.includes('view_quote')) && (
                          <CommonButton
                            size="sm"
                            variant="ghost"
                            onPress={(e) =>
                              handleQuickAction('request_quote', task, e)
                            }
                          >
                            <Row style={{ alignItems: 'center', gap: 4 }}>
                              <DollarSign size={14} />
                              <Text style={{ fontSize: 10 }}>
                                {task.quick_actions.includes('view_quote')
                                  ? 'Quote'
                                  : 'Request Quote'}
                              </Text>
                            </Row>
                          </CommonButton>
                        )}
                      </>
                    )}

                    {/* Complete Button - only show for pending/submitted tasks */}
                    {(task.status === 'pending' ||
                      task.status === 'submitted') && (
                      <CommonButton
                        size="sm"
                        onPress={(e) => {
                          e.stopPropagation();
                          onCompleteTask?.(task.id);
                        }}
                      >
                        <Row style={{ alignItems: 'center', gap: 4 }}>
                          <CheckCircle size={14} />
                          <Text style={{ fontSize: 10 }}>Complete</Text>
                        </Row>
                      </CommonButton>
                    )}
                  </Row>
                </Row>
              </Card>
            );
          })}
        </Stack>

        {sortedTasks.length === 0 && (
          <Stack style={{ alignItems: 'center', paddingTop: 48, paddingBottom: 48 }}>
            <CheckCircle color="var(--color-green10)" size={48} style={{ marginBottom: 12 }} />
            <Text style={{ color: 'var(--color-gray12)', fontWeight: 500, marginBottom: 8 }}>
              All caught up!
            </Text>
            <Text style={{ color: 'var(--color-gray11)', fontSize: 12 }}>
              No pending tasks
            </Text>
          </Stack>
        )}
      </Stack>
    </Card>
  );
}
