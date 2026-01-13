/**
 * Task Status Badge Component - Using Beyond UI
 * REQ-282: Project Tasks Display
 * Migrated from Tamagui to Beyond UI
 */
import React, { useState } from 'react';
import { Row, Stack, Text, Chip } from '@unicornlove/beyond-ui';
import {
  CheckCircle,
  Clock,
  Eye,
  XCircle,
  HelpCircle,
  Send,
} from 'lucide-react';
import { ProjectTaskStatus } from '../../types';

// Status definitions as per REQ-282
const STATUS_DEFINITIONS: Record<ProjectTaskStatus, string> = {
  submitted: 'Sub submitted response/document',
  in_review: 'Broker/GC reviewing submission',
  approved: 'Submission accepted',
  rejected: 'Submission rejected with reason',
  needs_info: 'More information required',
};

// Status configuration mapping to Badge variants
const STATUS_CONFIG: Record<
  ProjectTaskStatus,
  {
    variant: 'default' | 'success' | 'warning' | 'error' | 'info';
    icon: React.ComponentType<{ size?: number; className?: string }>;
    label: string;
  }
> = {
  submitted: {
    variant: 'info',
    icon: Send,
    label: 'Submitted',
  },
  in_review: {
    variant: 'info',
    icon: Eye,
    label: 'In Review',
  },
  approved: {
    variant: 'success',
    icon: CheckCircle,
    label: 'Approved',
  },
  rejected: {
    variant: 'error',
    icon: XCircle,
    label: 'Rejected',
  },
  needs_info: {
    variant: 'warning',
    icon: HelpCircle,
    label: 'Needs Info',
  },
};

// Legacy status mapping for backward compatibility
const LEGACY_STATUS_MAP: Record<string, ProjectTaskStatus | null> = {
  pending: null,
  in_progress: 'in_review',
  completed: 'approved',
  cancelled: null,
};

interface TaskStatusBadgeProps {
  status: string;
  rejectionReason?: string;
  size?: 'xs' | 'sm' | 'md' | 'lg';
  showIcon?: boolean;
  className?: string;
}

export default function TaskStatusBadge({
  status,
  rejectionReason,
  size = 'sm',
  showIcon = true,
  className = '',
}: TaskStatusBadgeProps) {
  const [showTooltip, setShowTooltip] = useState(false);

  // Normalize status to ProjectTaskStatus if possible
  const normalizedStatus: ProjectTaskStatus | null =
    (status as ProjectTaskStatus) in STATUS_CONFIG
      ? (status as ProjectTaskStatus)
      : LEGACY_STATUS_MAP[status] || null;

  // Fallback config for unknown statuses
  const config = normalizedStatus
    ? STATUS_CONFIG[normalizedStatus]
    : {
        variant: 'default' as const,
        icon: Clock,
        label: status.replace(/_/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase()),
      };

  const Icon = config.icon;

  const iconSizes = {
    xs: 10,
    sm: 12,
    md: 14,
    lg: 16,
  };

  // Build tooltip content
  const getTooltipContent = () => {
    if (!normalizedStatus) {
      return `Status: ${config.label}`;
    }

    const definition = STATUS_DEFINITIONS[normalizedStatus];

    // For rejected status, include rejection reason if available
    if (normalizedStatus === 'rejected' && rejectionReason) {
      return `${definition}\n\nReason: ${rejectionReason}`;
    }

    return definition;
  };

  return (
    <Stack style={{ position: 'relative', display: 'inline-block' }}>
      <Chip
        variant={config.variant}
        size={size}
        onMouseEnter={() => setShowTooltip(true)}
        onMouseLeave={() => setShowTooltip(false)}
        onFocus={() => setShowTooltip(true)}
        onBlur={() => setShowTooltip(false)}
        tabIndex={0}
        role="status"
        aria-label={`Status: ${config.label}. ${getTooltipContent()}`}
      >
        <Row gap={4} alignItems="center">
          {showIcon && <Icon size={iconSizes[size]} />}
          <span>{config.label}</span>
        </Row>
      </Chip>

      {/* Tooltip */}
      {showTooltip && (
        <Stack
          role="tooltip"
          style={{
            position: 'absolute',
            zIndex: 50,
            bottom: '100%',
            left: '50%',
            transform: 'translateX(-50%)',
            marginBottom: 8,
            paddingLeft: 12,
            paddingRight: 12,
            paddingTop: 8,
            paddingBottom: 8,
            fontSize: 12,
            color: 'var(--color-background)',
            backgroundColor: 'var(--color-text)',
            borderRadius: 12,
            boxShadow: '0 4px 8px var(--color-shadow)',
            whiteSpace: 'pre-line',
            maxWidth: 320,
          }}
        >
          <Text size="xs">{getTooltipContent()}</Text>
        </Stack>
      )}
    </Stack>
  );
}

/**
 * Helper function to check if a status is a valid ProjectTaskStatus
 */
export function isProjectTaskStatus(status: string): status is ProjectTaskStatus {
  return status in STATUS_CONFIG;
}

/**
 * Get the human-readable label for a status
 */
export function getStatusLabel(status: string): string {
  const normalizedStatus =
    (status as ProjectTaskStatus) in STATUS_CONFIG
      ? (status as ProjectTaskStatus)
      : LEGACY_STATUS_MAP[status] || null;

  if (normalizedStatus && STATUS_CONFIG[normalizedStatus]) {
    return STATUS_CONFIG[normalizedStatus].label;
  }

  return status.replace(/_/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase());
}
