/**
 * TaskStatusBadge - Task status badge using Tamagui
 * REQ-166: Task Management Workflow & UI
 */
import React from 'react';
import { XStack, Text, Spinner } from '@unicornlove/ui';
import { Chip as Badge } from '@unicornlove/ui';
import { Clock, CheckCircle, XCircle } from 'lucide-react';
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
    icon: <Spinner size="small" color="$blue10" />,
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
    <Badge
      variant={config.variant}
      size={size}
      role="status"
      aria-label={`Task status: ${config.label}`}
    >
      <XStack alignItems="center" gap="$1">
        {showIcon && config.icon}
        <Text>{config.label}</Text>
      </XStack>
    </Badge>
  );
};
