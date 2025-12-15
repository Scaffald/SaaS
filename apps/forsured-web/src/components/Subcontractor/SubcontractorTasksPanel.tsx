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
import { YStack, XStack, Text, Card, Button } from '@unicornlove/ui';
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

  const getSeverityColors = (severity: SeverityLevel) => {
    switch (severity) {
      case 'critical':
        return {
          textColor: '$red10',
          backgroundColor: '$red3',
          borderColor: '$red6',
        };
      case 'high':
        return {
          textColor: '$orange10',
          backgroundColor: '$orange3',
          borderColor: '$orange6',
        };
      case 'medium':
        return {
          textColor: '$blue10',
          backgroundColor: '$blue3',
          borderColor: '$blue6',
        };
      case 'low':
        return {
          textColor: '$gray10',
          backgroundColor: '$gray3',
          borderColor: '$gray6',
        };
    }
  };

  const getSeverityBadgeColors = (severity: SeverityLevel) => {
    switch (severity) {
      case 'critical':
        return { backgroundColor: '$red9', color: 'white' };
      case 'high':
        return { backgroundColor: '$orange9', color: 'white' };
      case 'medium':
        return { backgroundColor: '$blue9', color: 'white' };
      case 'low':
        return { backgroundColor: '$gray9', color: 'white' };
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
        return <CheckCircle color="$green10" size={16} />;
      case 'rejected':
        return <XCircle color="$red10" size={16} />;
      case 'submitted':
        return <Clock color="$blue10" size={16} />;
      default:
        return <AlertCircle color="$orange10" size={16} />;
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
    <Card elevation={1} borderWidth={1} borderColor="$borderColor">
      <YStack padding="$6" borderBottomWidth={1} borderBottomColor="$borderColor">
        <XStack alignItems="center" justifyContent="space-between" marginBottom="$4">
          <YStack>
            <Text fontSize="$6" fontWeight="600" color="$color12">
              My Tasks
            </Text>
            <Text fontSize="$2" color="$color11">Tasks assigned to you</Text>
          </YStack>
          <XStack alignItems="center" gap="$2">
            <Button
              onPress={() => setFilter('all')}
              paddingHorizontal="$3"
              paddingVertical="$1"
              fontSize="$1"
              fontWeight="500"
              borderRadius="$2"
              backgroundColor={filter === 'all' ? '$blue9' : '$gray3'}
              color={filter === 'all' ? 'white' : '$color11'}
            >
              All
            </Button>
            <Button
              onPress={() => setFilter('broker')}
              paddingHorizontal="$3"
              paddingVertical="$1"
              fontSize="$1"
              fontWeight="500"
              borderRadius="$2"
              backgroundColor={filter === 'broker' ? '$blue9' : '$gray3'}
              color={filter === 'broker' ? 'white' : '$color11'}
            >
              From Broker
            </Button>
            <Button
              onPress={() => setFilter('manager')}
              paddingHorizontal="$3"
              paddingVertical="$1"
              fontSize="$1"
              fontWeight="500"
              borderRadius="$2"
              backgroundColor={filter === 'manager' ? '$blue9' : '$gray3'}
              color={filter === 'manager' ? 'white' : '$color11'}
            >
              From Manager
            </Button>
          </XStack>
        </XStack>
      </YStack>

      <YStack padding="$6">
        <YStack gap="$4">
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
                borderWidth={2}
                borderRadius="$4"
                padding="$4"
                cursor="pointer"
                elevation={0}
                hoverStyle={{
                  elevation: 2,
                }}
                backgroundColor={severityColors.backgroundColor}
                borderColor={severityColors.borderColor}
                onPress={() => onTaskClick?.(task)}
              >
                <XStack alignItems="flex-start" justifyContent="space-between" marginBottom="$3">
                  <YStack flex={1}>
                    <XStack alignItems="center" gap="$2" marginBottom="$2" flexWrap="wrap">
                      <XStack
                        display="inline-flex"
                        alignItems="center"
                        paddingHorizontal="$2"
                        paddingVertical="$0.5"
                        borderRadius="$2"
                        backgroundColor={badgeColors.backgroundColor}
                      >
                        <Text fontSize="$1" fontWeight="bold" textTransform="uppercase" color={badgeColors.color}>
                          {severity}
                        </Text>
                      </XStack>
                      <XStack
                        display="inline-flex"
                        alignItems="center"
                        paddingHorizontal="$2"
                        paddingVertical="$0.5"
                        borderRadius="$2"
                        backgroundColor={task.origin_role === 'broker' ? '$gray9' : '$blue9'}
                      >
                        <Text fontSize="$1" fontWeight="500" color="white">
                          {task.origin_role || 'manager'}
                        </Text>
                      </XStack>
                      <XStack
                        display="inline-flex"
                        alignItems="center"
                        paddingHorizontal="$2"
                        paddingVertical="$0.5"
                        borderRadius="$2"
                        backgroundColor="$gray3"
                      >
                        <Text fontSize="$1" fontWeight="500" color="$color11">
                          {getTaskTypeLabel(task.task_type)}
                        </Text>
                      </XStack>
                      <XStack alignItems="center" gap="$1">
                        {getStatusIcon(task.status)}
                        <Text fontSize="$1" color="$color11">
                          {getStatusLabel(task.status)}
                        </Text>
                      </XStack>
                    </XStack>

                    <Text fontSize="$2" fontWeight="600" color="$color12" marginBottom="$1">
                      {task.title}
                    </Text>
                    {task.description && (
                      <Text fontSize="$2" color="$color11" marginBottom="$2">
                        {task.description}
                      </Text>
                    )}

                    {/* Project and GC Info */}
                    {(task.project_name || task.gc_company_name) && (
                      <XStack alignItems="center" gap="$4" marginBottom="$2">
                        {task.project_name && (
                          <XStack alignItems="center">
                            <Building size={12} marginRight="$1" />
                            <Text fontSize="$1" color="$color11">
                              {task.project_name}
                            </Text>
                          </XStack>
                        )}
                        {task.gc_company_name && (
                          <Text fontSize="$1" color="$color11">
                            {task.gc_company_name}
                          </Text>
                        )}
                      </XStack>
                    )}

                    {/* Policy Number */}
                    {task.policy_number && (
                      <Text fontSize="$1" color="$color11" marginBottom="$2">
                        Policy: {task.policy_number}
                      </Text>
                    )}

                    {/* Metadata Details */}
                    {metadata && (
                      <YStack marginTop="$2" gap="$1">
                        {metadata.missing_endorsement && (
                          <Text fontSize="$1" color="$color11">
                            <Text fontWeight="bold">Missing:</Text>{' '}
                            {metadata.missing_endorsement}
                          </Text>
                        )}
                        {metadata.required_endorsement_form && (
                          <Text fontSize="$1" color="$color11">
                            <Text fontWeight="bold">Required Form:</Text>{' '}
                            {metadata.required_endorsement_form}
                          </Text>
                        )}
                        {metadata.current_limit && metadata.required_limit && (
                          <Text fontSize="$1" color="$color11">
                            <Text fontWeight="bold">Current:</Text> $
                            {(metadata.current_limit / 1000000).toFixed(1)}M |{' '}
                            <Text fontWeight="bold">Required:</Text> $
                            {(metadata.required_limit / 1000000).toFixed(1)}M
                          </Text>
                        )}
                        {metadata.current_symbol &&
                          metadata.required_symbol && (
                            <Text fontSize="$1" color="$color11">
                              <Text fontWeight="bold">Current:</Text>{' '}
                              {metadata.current_symbol} |{' '}
                              <Text fontWeight="bold">Required:</Text>{' '}
                              {metadata.required_symbol}
                            </Text>
                          )}
                        {metadata.rejection_reason && (
                          <Card
                            backgroundColor="$red3"
                            padding="$2"
                            borderRadius="$2"
                            marginTop="$2"
                          >
                            <Text fontSize="$1" color="$red10">
                              <Text fontWeight="bold">Rejection Reason:</Text>{' '}
                              {metadata.rejection_reason}
                            </Text>
                          </Card>
                        )}
                      </YStack>
                    )}
                  </YStack>
                </XStack>

                <XStack alignItems="center" justifyContent="space-between" marginTop="$3" paddingTop="$3" borderTopWidth={1} borderTopColor="$borderColor" opacity={0.5}>
                  <XStack alignItems="center" gap="$4">
                    {task.created_by && (
                      <XStack alignItems="center">
                        <Building size={12} marginRight="$1" />
                        <Text fontSize="$1" color="$color11">
                          {task.created_by.name}
                        </Text>
                      </XStack>
                    )}
                    {task.due_date && (
                      <XStack alignItems="center">
                        <Clock size={12} marginRight="$1" />
                        {isOverdue(task.due_date) ? (
                          <Text fontSize="$1" color="$red10" fontWeight="500">
                            Overdue!
                          </Text>
                        ) : (
                          <Text fontSize="$1" color="$color11">
                            Due {formatDate(task.due_date)}
                          </Text>
                        )}
                      </XStack>
                    )}
                    {task.document_link && (
                      <XStack
                        as="a"
                        href={task.document_link}
                        target="_blank"
                        rel="noopener noreferrer"
                        alignItems="center"
                        color="$blue10"
                        hoverStyle={{
                          color: '$blue12',
                        }}
                        onPress={(e) => e.stopPropagation()}
                      >
                        <FileText size={12} marginRight="$1" />
                        <Text fontSize="$1">View Doc</Text>
                      </XStack>
                    )}
                  </XStack>

                  <XStack alignItems="center" gap="$2">
                    {/* Quick Actions */}
                    {task.quick_actions && task.quick_actions.length > 0 && (
                      <>
                        {task.quick_actions.includes('upload_document') && (
                          <CommonButton
                            size="sm"
                            variant="ghost"
                            onClick={(e) =>
                              handleQuickAction('upload_document', task, e)
                            }
                          >
                            <XStack alignItems="center" gap="$1">
                              <Upload size={14} />
                              <Text fontSize="$1">Upload</Text>
                            </XStack>
                          </CommonButton>
                        )}
                        {task.quick_actions.includes('view_requirements') && (
                          <CommonButton
                            size="sm"
                            variant="ghost"
                            onClick={(e) =>
                              handleQuickAction('view_requirements', task, e)
                            }
                          >
                            <XStack alignItems="center" gap="$1">
                              <Eye size={14} />
                              <Text fontSize="$1">Requirements</Text>
                            </XStack>
                          </CommonButton>
                        )}
                        {task.quick_actions.includes('contact_broker') && (
                          <CommonButton
                            size="sm"
                            variant="ghost"
                            onClick={(e) =>
                              handleQuickAction('contact_broker', task, e)
                            }
                          >
                            <XStack alignItems="center" gap="$1">
                              <Mail size={14} />
                              <Text fontSize="$1">Broker</Text>
                            </XStack>
                          </CommonButton>
                        )}
                        {(task.quick_actions.includes('request_quote') ||
                          task.quick_actions.includes('view_quote')) && (
                          <CommonButton
                            size="sm"
                            variant="ghost"
                            onClick={(e) =>
                              handleQuickAction('request_quote', task, e)
                            }
                          >
                            <XStack alignItems="center" gap="$1">
                              <DollarSign size={14} />
                              <Text fontSize="$1">
                                {task.quick_actions.includes('view_quote')
                                  ? 'Quote'
                                  : 'Request Quote'}
                              </Text>
                            </XStack>
                          </CommonButton>
                        )}
                      </>
                    )}

                    {/* Complete Button - only show for pending/submitted tasks */}
                    {(task.status === 'pending' ||
                      task.status === 'submitted') && (
                      <CommonButton
                        size="sm"
                        onClick={(e) => {
                          e.stopPropagation();
                          onCompleteTask?.(task.id);
                        }}
                      >
                        <XStack alignItems="center" gap="$1">
                          <CheckCircle size={14} />
                          <Text fontSize="$1">Complete</Text>
                        </XStack>
                      </CommonButton>
                    )}
                  </XStack>
                </XStack>
              </Card>
            );
          })}
        </YStack>

        {sortedTasks.length === 0 && (
          <YStack alignItems="center" paddingVertical="$12">
            <CheckCircle color="$green10" size={48} marginBottom="$3" />
            <Text color="$color12" fontWeight="500" marginBottom="$2">
              All caught up!
            </Text>
            <Text color="$color11" fontSize="$2">
              No pending tasks
            </Text>
          </YStack>
        )}
      </YStack>
    </Card>
  );
}
