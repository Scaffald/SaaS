/**
 * Task Status Badge Component - Using Beyond UI
 * REQ-282: Project Tasks Display

 */
import { useState } from 'react'
import type { CSSProperties } from 'react'
import { Row, Stack, Text } from '@unicornlove/beyond-ui'
import { CheckCircle, Clock, Eye, XCircle, HelpCircle, Send } from 'lucide-react'
import type { ProjectTaskStatus } from '../../types'

// Status definitions as per REQ-282
const STATUS_DEFINITIONS: Record<ProjectTaskStatus, string> = {
  submitted: 'Sub submitted response/document',
  in_review: 'Broker/GC reviewing submission',
  approved: 'Submission accepted',
  rejected: 'Submission rejected with reason',
  needs_info: 'More information required',
}

type BadgeVariant = 'default' | 'success' | 'warning' | 'error' | 'info'

// Status configuration mapping to Badge variants
const STATUS_CONFIG: Record<
  ProjectTaskStatus,
  {
    variant: BadgeVariant
    icon: React.ComponentType<{ size?: number; className?: string }>
    label: string
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
}

// Legacy status mapping for backward compatibility
const LEGACY_STATUS_MAP: Record<string, ProjectTaskStatus | null> = {
  pending: null,
  in_progress: 'in_review',
  completed: 'approved',
  cancelled: null,
}

// Variant color styles
const VARIANT_STYLES: Record<BadgeVariant, { bg: string; text: string; border: string }> = {
  default: {
    bg: 'var(--color-3)',
    text: 'var(--color-11)',
    border: 'var(--color-6)',
  },
  success: {
    bg: 'rgba(34, 197, 94, 0.1)',
    text: 'rgb(22, 163, 74)',
    border: 'rgba(34, 197, 94, 0.3)',
  },
  warning: {
    bg: 'rgba(234, 179, 8, 0.1)',
    text: 'rgb(161, 98, 7)',
    border: 'rgba(234, 179, 8, 0.3)',
  },
  error: {
    bg: 'rgba(239, 68, 68, 0.1)',
    text: 'rgb(220, 38, 38)',
    border: 'rgba(239, 68, 68, 0.3)',
  },
  info: {
    bg: 'rgba(59, 130, 246, 0.1)',
    text: 'rgb(37, 99, 235)',
    border: 'rgba(59, 130, 246, 0.3)',
  },
}

interface TaskStatusBadgeProps {
  status: string
  rejectionReason?: string
  size?: 'sm' | 'md' | 'lg'
  showIcon?: boolean
  className?: string
}

export default function TaskStatusBadge({
  status,
  rejectionReason,
  size = 'sm',
  showIcon = true,
}: TaskStatusBadgeProps) {
  const [showTooltip, setShowTooltip] = useState(false)

  // Normalize size - ensure it's a valid size
  const validSize = ['sm', 'md', 'lg'].includes(size) ? size : 'sm'

  // Normalize status to ProjectTaskStatus if possible
  const normalizedStatus: ProjectTaskStatus | null =
    (status as ProjectTaskStatus) in STATUS_CONFIG
      ? (status as ProjectTaskStatus)
      : LEGACY_STATUS_MAP[status] || null

  // Fallback config for unknown statuses
  const config = normalizedStatus
    ? STATUS_CONFIG[normalizedStatus]
    : {
        variant: 'default' as const,
        icon: Clock,
        label: status.replace(/_/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase()),
      }

  const Icon = config.icon
  const variantStyle = VARIANT_STYLES[config.variant]

  const iconSizes: Record<string, number> = {
    sm: 12,
    md: 14,
    lg: 16,
  }

  const paddingSizes: Record<string, { x: number; y: number }> = {
    sm: { x: 8, y: 4 },
    md: { x: 10, y: 5 },
    lg: { x: 12, y: 6 },
  }

  const fontSizes: Record<string, number> = {
    sm: 12,
    md: 13,
    lg: 14,
  }

  // Build tooltip content
  const getTooltipContent = () => {
    if (!normalizedStatus) {
      return `Status: ${config.label}`
    }

    const definition = STATUS_DEFINITIONS[normalizedStatus]

    // For rejected status, include rejection reason if available
    if (normalizedStatus === 'rejected' && rejectionReason) {
      return `${definition}\n\nReason: ${rejectionReason}`
    }

    return definition
  }

  const badgeStyle: CSSProperties = {
    display: 'inline-flex',
    alignItems: 'center',
    gap: 4,
    paddingLeft: paddingSizes[validSize].x,
    paddingRight: paddingSizes[validSize].x,
    paddingTop: paddingSizes[validSize].y,
    paddingBottom: paddingSizes[validSize].y,
    backgroundColor: variantStyle.bg,
    color: variantStyle.text,
    borderRadius: 12,
    border: `1px solid ${variantStyle.border}`,
    fontSize: fontSizes[validSize],
    fontWeight: 500,
    cursor: 'default',
  }

  return (
    <Stack style={{ position: 'relative', display: 'inline-block' }}>
      <output
        style={badgeStyle}
        onMouseEnter={() => setShowTooltip(true)}
        onMouseLeave={() => setShowTooltip(false)}
        aria-label={`Status: ${config.label}. ${getTooltipContent()}`}
      >
        <Row gap={4} alignItems="center">
          {showIcon && <Icon size={iconSizes[validSize]} />}
          <span>{config.label}</span>
        </Row>
      </output>

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
  )
}

/**
 * Helper function to check if a status is a valid ProjectTaskStatus
 */
export function isProjectTaskStatus(status: string): status is ProjectTaskStatus {
  return status in STATUS_CONFIG
}

/**
 * Get the human-readable label for a status
 */
export function getStatusLabel(status: string): string {
  const normalizedStatus =
    (status as ProjectTaskStatus) in STATUS_CONFIG
      ? (status as ProjectTaskStatus)
      : LEGACY_STATUS_MAP[status] || null

  if (normalizedStatus && STATUS_CONFIG[normalizedStatus]) {
    return STATUS_CONFIG[normalizedStatus].label
  }

  return status.replace(/_/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase())
}
