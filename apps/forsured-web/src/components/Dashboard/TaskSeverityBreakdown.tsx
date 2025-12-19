/**
 * TaskSeverityBreakdown - Task severity breakdown widget using Tamagui
 * REQ-266: Task Correlation with Compliance Score
 */
import React from 'react';
import { YStack, XStack, Text } from '@unicornlove/ui';
import { Chip as Badge } from '@unicornlove/ui';
import { AlertTriangle, AlertCircle, Info, CheckCircle } from 'lucide-react';
import {
  Task,
  TaskSeverity,
  TASK_SEVERITY_CONFIG,
} from '../../types';
import {
  countTasksBySeverity,
  enrichTasksWithSeverity,
} from '../../lib/tasks/severityUtils';

export interface TaskSeverityBreakdownProps {
  tasks: Task[];
  includeInfo?: boolean;
  showBreakdown?: boolean;
  showIcon?: boolean;
  className?: string;
  onClick?: () => void;
  loading?: boolean;
}

function getSeverityIcon(severity: TaskSeverity): React.ReactNode {
  switch (severity) {
    case 'critical':
      return <AlertTriangle size={16} color="currentColor" />;
    case 'high':
      return <AlertCircle size={16} color="currentColor" />;
    case 'medium':
      return <Info size={16} color="currentColor" />;
    case 'low':
      return <CheckCircle size={16} color="currentColor" />;
    case 'info':
      return <Info size={16} color="currentColor" />;
    default:
      return <Info size={16} color="currentColor" />;
  }
}

interface SeverityBadgeProps {
  severity: TaskSeverity;
  count: number;
}

const SeverityBadge: React.FC<SeverityBadgeProps> = ({ severity, count }) => {
  const config = TASK_SEVERITY_CONFIG[severity];

  if (count === 0) return null;

  const variantMap: Record<TaskSeverity, 'default' | 'success' | 'warning' | 'error' | 'info'> = {
    critical: 'error',
    high: 'error',
    medium: 'warning',
    low: 'info',
    info: 'default',
  };

  return (
    <Badge variant={variantMap[severity]} size="sm">
      <XStack alignItems="center" gap="$1">
        {getSeverityIcon(severity)}
        <Text>{count}</Text>
        <Text display={{ sm: 'none' }}>{config.label.toLowerCase()}</Text>
      </XStack>
    </Badge>
  );
};

export const TaskSeverityBreakdown: React.FC<TaskSeverityBreakdownProps> = ({
  tasks,
  includeInfo = false,
  showBreakdown = true,
  showIcon = true,
  className = '',
  onClick,
  loading = false,
}) => {
  const enrichedTasks = enrichTasksWithSeverity(tasks);
  const counts = countTasksBySeverity(enrichedTasks, includeInfo);

  const totalTasks = Object.values(counts).reduce((sum, count) => sum + count, 0);

  if (loading) {
    return (
      <YStack padding="$4" gap="$2">
        <Text fontSize="$2" color="$color10">Loading task breakdown...</Text>
      </YStack>
    );
  }

  if (totalTasks === 0) {
    return (
      <YStack padding="$4" gap="$2">
        <Text fontSize="$2" color="$color10">No tasks available</Text>
      </YStack>
    );
  }

  const breakdownParts: string[] = [];
  if (counts.critical > 0) breakdownParts.push(`${counts.critical} critical`);
  if (counts.high > 0) breakdownParts.push(`${counts.high} high`);
  if (counts.medium > 0) breakdownParts.push(`${counts.medium} medium`);
  if (counts.low > 0) breakdownParts.push(`${counts.low} low`);
  if (includeInfo && counts.info > 0) breakdownParts.push(`${counts.info} info`);

  const breakdownText = breakdownParts.length > 0
    ? `(${breakdownParts.join(', ')})`
    : '';

  return (
    <YStack
      gap="$3"
      padding="$4"
      onPress={onClick}
      cursor={onClick ? 'pointer' : 'default'}
    >
      <XStack alignItems="center" gap="$2" flexWrap="wrap">
        {showIcon && (
          <AlertTriangle size={20} color="currentColor" />
        )}
        <Text fontSize="$4" fontWeight="600" color="$color11">
          {totalTasks} tasks
        </Text>
        {breakdownText && (
          <Text fontSize="$3" color="$color10">
            {breakdownText}
          </Text>
        )}
      </XStack>

      {showBreakdown && (
        <XStack gap="$2" flexWrap="wrap">
          <SeverityBadge severity="critical" count={counts.critical} />
          <SeverityBadge severity="high" count={counts.high} />
          <SeverityBadge severity="medium" count={counts.medium} />
          <SeverityBadge severity="low" count={counts.low} />
          {includeInfo && <SeverityBadge severity="info" count={counts.info} />}
        </XStack>
      )}
    </YStack>
  );
};

export default TaskSeverityBreakdown;

// Stub for CompactSeverityBreakdown - TODO: implement if needed
export interface CompactSeverityBreakdownProps {
  tasks: Task[];
  includeInfo?: boolean;
  className?: string;
  onClick?: () => void;
}

export const CompactSeverityBreakdown: React.FC<CompactSeverityBreakdownProps> = ({
  tasks,
  includeInfo = false,
  className = '',
  onClick,
}) => {
  const enrichedTasks = enrichTasksWithSeverity(tasks);
  const counts = countTasksBySeverity(enrichedTasks, includeInfo);
  const totalTasks = Object.values(counts).reduce((sum, count) => sum + count, 0);

  if (totalTasks === 0) {
    return <Text fontSize="$2" color="$color10">No tasks</Text>;
  }

  const breakdownParts: string[] = [];
  if (counts.critical > 0) breakdownParts.push(`${counts.critical} critical`);
  if (counts.high > 0) breakdownParts.push(`${counts.high} high`);
  if (counts.medium > 0) breakdownParts.push(`${counts.medium} medium`);
  if (counts.low > 0) breakdownParts.push(`${counts.low} low`);
  if (includeInfo && counts.info > 0) breakdownParts.push(`${counts.info} info`);

  const taskWord = totalTasks === 1 ? 'task' : 'tasks';
  const breakdownText = breakdownParts.length > 0 ? ` (${breakdownParts.join(', ')})` : '';

  return (
    <XStack alignItems="center" gap="$2" cursor={onClick ? 'pointer' : 'default'} onPress={onClick}>
      <Text fontSize="$3" fontWeight="500" color="$color11">
        {totalTasks} {taskWord}{breakdownText}
      </Text>
    </XStack>
  );
};
