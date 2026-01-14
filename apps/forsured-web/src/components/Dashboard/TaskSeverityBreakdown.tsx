/**
 * TaskSeverityBreakdown - Task severity breakdown widget using Beyond UI
 * REQ-266: Task Correlation with Compliance Score
 * Migrated from Tamagui to Beyond UI
 */
import React from 'react';
import { Stack, Row, Text, Chip } from '@unicornlove/beyond-ui';
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
      return <AlertTriangle size={16} />;
    case 'high':
      return <AlertCircle size={16} />;
    case 'medium':
      return <Info size={16} />;
    case 'low':
      return <CheckCircle size={16} />;
    case 'info':
      return <Info size={16} />;
    default:
      return <Info size={16} />;
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
    <Chip variant={variantMap[severity]} size="sm">
      <Row alignItems="center" gap={4}>
        {getSeverityIcon(severity)}
        <span>{count}</span>
        <span style={{ display: 'none' }}>{config.label.toLowerCase()}</span>
      </Row>
    </Chip>
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
      <Stack padding={16} gap={8}>
        <Text size="sm" muted>Loading task breakdown...</Text>
      </Stack>
    );
  }

  if (totalTasks === 0) {
    return (
      <Stack padding={16} gap={8}>
        <Text size="sm" muted>No tasks available</Text>
      </Stack>
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
    <Stack
      gap={12}
      padding={16}
      onClick={onClick}
      style={{ cursor: onClick ? 'pointer' : 'default' }}
      className={className}
    >
      <Row alignItems="center" gap={8} style={{ flexWrap: 'wrap' }}>
        {showIcon && (
          <AlertTriangle size={20} />
        )}
        <Text size="lg" weight="semibold">
          {totalTasks} tasks
        </Text>
        {breakdownText && (
          <Text size="md" muted>
            {breakdownText}
          </Text>
        )}
      </Row>

      {showBreakdown && (
        <Row gap={8} style={{ flexWrap: 'wrap' }}>
          <SeverityBadge severity="critical" count={counts.critical} />
          <SeverityBadge severity="high" count={counts.high} />
          <SeverityBadge severity="medium" count={counts.medium} />
          <SeverityBadge severity="low" count={counts.low} />
          {includeInfo && <SeverityBadge severity="info" count={counts.info} />}
        </Row>
      )}
    </Stack>
  );
};

export default TaskSeverityBreakdown;

// Stub for CompactSeverityBreakdown
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
    return <Text size="sm" muted>No tasks</Text>;
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
    <Row
      alignItems="center"
      gap={8}
      onClick={onClick}
      style={{ cursor: onClick ? 'pointer' : 'default' }}
      className={className}
    >
      <Text size="md" weight="medium">
        {totalTasks} {taskWord}{breakdownText}
      </Text>
    </Row>
  );
};
