/**
 * Task Severity Badge Component - Using Beyond UI
 * Task severity and compliance correlation

 */
import React, { useState } from 'react'
import { Row, Stack, Text, Chip } from '@unicornlove/beyond-ui'
import { AlertTriangle, AlertCircle, Info, CheckCircle, ShieldAlert } from 'lucide-react'
import { TaskSeverity, TASK_SEVERITY_CONFIG, ConsequenceType } from '../../types'

// Severity definitions for tooltip display
const SEVERITY_DEFINITIONS: Record<TaskSeverity, string> = {
  critical: 'Immediate action required. Compliance gap affecting site access or payments.',
  high: 'Urgent attention needed. High-risk compliance issue.',
  medium: 'Attention needed. Moderate compliance concern.',
  low: 'Routine follow-up. Minor compliance item.',
  info: 'Informational. No immediate action required.',
}

// Icon mapping for each severity level
const SEVERITY_ICONS: Record<
  TaskSeverity,
  React.ComponentType<{ size?: number; className?: string }>
> = {
  critical: ShieldAlert,
  high: AlertTriangle,
  medium: AlertCircle,
  low: Info,
  info: CheckCircle,
}

// Map severity to Badge variant
const SEVERITY_VARIANT_MAP: Record<
  TaskSeverity,
  'default' | 'success' | 'warning' | 'error' | 'info'
> = {
  critical: 'error',
  high: 'error',
  medium: 'warning',
  low: 'info',
  info: 'default',
}

interface TaskSeverityBadgeProps {
  severity: TaskSeverity
  consequenceType?: ConsequenceType
  size?: 'xs' | 'sm' | 'md' | 'lg'
  showIcon?: boolean
  showLabel?: boolean
  className?: string
}

export default function TaskSeverityBadge({
  severity,
  consequenceType,
  size = 'sm',
  showIcon = true,
  showLabel = true,
  className = '',
}: TaskSeverityBadgeProps) {
  const [showTooltip, setShowTooltip] = useState(false)

  const config = TASK_SEVERITY_CONFIG[severity]
  const Icon = SEVERITY_ICONS[severity]
  const variant = SEVERITY_VARIANT_MAP[severity]

  const iconSizes = {
    xs: 10,
    sm: 12,
    md: 14,
    lg: 16,
  }

  // Build tooltip content
  const getTooltipContent = () => {
    const definition = SEVERITY_DEFINITIONS[severity]

    if (consequenceType) {
      const consequenceLabel = consequenceType.replace(/_/g, ' ')
      return `${config.label} Severity\n\n${definition}\n\nConsequence: ${consequenceLabel}`
    }

    return `${config.label} Severity\n\n${definition}`
  }

  return (
    <Stack style={{ position: 'relative', display: 'inline-block' }}>
      <Chip
        variant={variant}
        size={size}
        onMouseEnter={() => setShowTooltip(true)}
        onMouseLeave={() => setShowTooltip(false)}
        onFocus={() => setShowTooltip(true)}
        onBlur={() => setShowTooltip(false)}
        tabIndex={0}
        role="status"
        aria-label={`Severity: ${config.label}. ${SEVERITY_DEFINITIONS[severity]}`}
      >
        <Row gap={4} alignItems="center">
          {showIcon && <Icon size={iconSizes[size]} />}
          {showLabel && <span>{config.label}</span>}
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
  )
}

/**
 * Compact severity indicator (icon only) for dense lists
 */
interface CompactSeverityIndicatorProps {
  severity: TaskSeverity
  className?: string
}

export function CompactSeverityIndicator({
  severity,
  className = '',
}: CompactSeverityIndicatorProps) {
  const config = TASK_SEVERITY_CONFIG[severity]
  const Icon = SEVERITY_ICONS[severity]
  const variant = SEVERITY_VARIANT_MAP[severity]

  return (
    <Chip
      variant={variant}
      size="sm"
      title={`${config.label} severity`}
      aria-label={`${config.label} severity`}
    >
      <Icon size={12} />
    </Chip>
  )
}

/**
 * Severity dot indicator for minimal display
 */
interface SeverityDotProps {
  severity: TaskSeverity
  size?: 'sm' | 'md' | 'lg'
  className?: string
}

const dotSizes = {
  sm: 8,
  md: 12,
  lg: 16,
}

const dotColors: Record<TaskSeverity, string> = {
  critical: 'var(--color-red-9)',
  high: 'var(--color-orange-9)',
  medium: 'var(--color-yellow-9)',
  low: 'var(--color-blue-9)',
  info: 'var(--color-text-muted)',
}

export function SeverityDot({ severity, size = 'md', className = '' }: SeverityDotProps) {
  const config = TASK_SEVERITY_CONFIG[severity]
  const dotSize = dotSizes[size]

  return (
    <Stack
      title={`${config.label} severity`}
      aria-label={`${config.label} severity`}
      style={{
        width: dotSize,
        height: dotSize,
        borderRadius: '50%',
        backgroundColor: dotColors[severity],
      }}
    />
  )
}

/**
 * Helper function to get severity color class for text
 */
export function getSeverityTextColor(severity: TaskSeverity): string {
  return TASK_SEVERITY_CONFIG[severity].color
}

/**
 * Helper function to get severity background color class
 */
export function getSeverityBgColor(severity: TaskSeverity): string {
  return TASK_SEVERITY_CONFIG[severity].bgColor
}

/**
 * Helper function to get severity border color class
 */
export function getSeverityBorderColor(severity: TaskSeverity): string {
  return TASK_SEVERITY_CONFIG[severity].borderColor
}
