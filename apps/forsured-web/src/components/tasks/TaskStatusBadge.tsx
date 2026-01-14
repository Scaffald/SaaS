/**
 * TaskStatusBadge - Task status badge using Beyond UI
 * REQ-166: Task Management Workflow & UI
 */
import React from 'react';
import { Row, Text, Chip } from '@unicornlove/beyond-ui';
import { Clock, CheckCircle, XCircle, Loader2 } from 'lucide-react';
import { TaskStatus } from '../../types';

interface TaskStatusBadgeProps {
  status: TaskStatus;
  size?: 'sm' | 'md' | 'lg';
  showIcon?: boolean;
  className?: string;
}

const statusConfig: Record<TaskStatus | 'unknown', {
  label: string;
  variant: 'default' | 'success' | 'warning' | 'error' | 'info';
  icon: React.ReactNode;
}> = {
  pending: {
    label: 'Pending',
    variant: 'default',
    icon: <Clock size={16} data-testid="status-icon-pending" />,
  },
  in_progress: {
    label: 'In Progress',
    variant: 'info',
    icon: <Loader2 size={16} className="animate-spin" style={{ color: 'var(--color-blue10)' }} />,
  },
  completed: {
    label: 'Completed',
    variant: 'success',
    icon: <CheckCircle size={16} data-testid="status-icon-completed" />,
  },
  cancelled: {
    label: 'Cancelled',
    variant: 'error',
    icon: <XCircle size={16} data-testid="status-icon-cancelled" />,
  },
  unknown: {
    label: 'Unknown',
    variant: 'default',
    icon: <Clock size={16} />,
  },
};

export const TaskStatusBadge: React.FC<TaskStatusBadgeProps> = ({
  status,
  size = 'md',
  showIcon = false,
  className = '',
}) => {
  const config = statusConfig[status as TaskStatus] || statusConfig.unknown;

  return (
    <Chip
      variant={config.variant}
      size={size}
      role="status"
      aria-label={`Task status: ${config.label}`}
    >
      <Row style={{ alignItems: 'center', gap: '4px' }}>
        {showIcon && config.icon}
        <Text>{config.label}</Text>
      </Row>
    </Chip>
  );
};
