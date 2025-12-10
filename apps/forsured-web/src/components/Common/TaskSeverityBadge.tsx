/**
 * Task Severity Badge Component - Using Tamagui
 * REQ-266: Task Correlation with Compliance Score
 */
import React, { useState } from 'react';
import { XStack, YStack, Text, styled } from '@unicornlove/ui';
import { Chip as Badge } from '@unicornlove/ui';
import {
  AlertTriangle,
  AlertCircle,
  Info,
  CheckCircle,
  ShieldAlert,
} from 'lucide-react';
import {
  TaskSeverity,
  TASK_SEVERITY_CONFIG,
  ConsequenceType,
} from '../../types';

// Severity definitions for tooltip display
const SEVERITY_DEFINITIONS: Record<TaskSeverity, string> = {
  critical: 'Immediate action required. Compliance gap affecting site access or payments.',
  high: 'Urgent attention needed. High-risk compliance issue.',
  medium: 'Attention needed. Moderate compliance concern.',
  low: 'Routine follow-up. Minor compliance item.',
  info: 'Informational. No immediate action required.',
};

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
};

// Map severity to Badge variant
const SEVERITY_VARIANT_MAP: Record<TaskSeverity, 'default' | 'success' | 'warning' | 'error' | 'info'> = {
  critical: 'error',
  high: 'error',
  medium: 'warning',
  low: 'info',
  info: 'default',
};

const Tooltip = styled(YStack, {
  name: 'Tooltip',
  position: 'absolute',
  zIndex: 50,
  bottom: '100%',
  left: '50%',
  transform: [{ translateX: '-50%' }],
  marginBottom: '$2',
  paddingHorizontal: '$3',
  paddingVertical: '$2',
  fontSize: '$1',
  color: '$color1',
  backgroundColor: '$color12',
  borderRadius: '$md',
  shadowColor: '$shadowColor',
  shadowRadius: 8,
  shadowOffset: { width: 0, height: 4 },
  whiteSpace: 'pre-line',
  maxWidth: 320,
});

interface TaskSeverityBadgeProps {
  severity: TaskSeverity;
  consequenceType?: ConsequenceType;
  size?: 'xs' | 'sm' | 'md' | 'lg';
  showIcon?: boolean;
  showLabel?: boolean;
  className?: string;
}

export default function TaskSeverityBadge({
  severity,
  consequenceType,
  size = 'sm',
  showIcon = true,
  showLabel = true,
  className = '',
}: TaskSeverityBadgeProps) {
  const [showTooltip, setShowTooltip] = useState(false);

  const config = TASK_SEVERITY_CONFIG[severity];
  const Icon = SEVERITY_ICONS[severity];
  const variant = SEVERITY_VARIANT_MAP[severity];

  const iconSizes = {
    xs: 10,
    sm: 12,
    md: 14,
    lg: 16,
  };

  // Build tooltip content
  const getTooltipContent = () => {
    const definition = SEVERITY_DEFINITIONS[severity];

    if (consequenceType) {
      const consequenceLabel = consequenceType.replace(/_/g, ' ');
      return `${config.label} Severity\n\n${definition}\n\nConsequence: ${consequenceLabel}`;
    }

    return `${config.label} Severity\n\n${definition}`;
  };

  return (
    <YStack position="relative" display="inline-block">
      <Badge
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
        <XStack gap="$1" alignItems="center">
          {showIcon && <Icon size={iconSizes[size]} />}
          {showLabel && <Text>{config.label}</Text>}
        </XStack>
      </Badge>

      {/* Tooltip */}
      {showTooltip && (
        <Tooltip role="tooltip">
          <Text>{getTooltipContent()}</Text>
        </Tooltip>
      )}
    </YStack>
  );
}

/**
 * Compact severity indicator (icon only) for dense lists
 */
interface CompactSeverityIndicatorProps {
  severity: TaskSeverity;
  className?: string;
}

export function CompactSeverityIndicator({
  severity,
  className = '',
}: CompactSeverityIndicatorProps) {
  const config = TASK_SEVERITY_CONFIG[severity];
  const Icon = SEVERITY_ICONS[severity];
  const variant = SEVERITY_VARIANT_MAP[severity];

  return (
    <Badge
      variant={variant}
      size="sm"
      title={`${config.label} severity`}
      aria-label={`${config.label} severity`}
    >
      <Icon size={12} />
    </Badge>
  );
}

/**
 * Severity dot indicator for minimal display
 */
interface SeverityDotProps {
  severity: TaskSeverity;
  size?: 'sm' | 'md' | 'lg';
  className?: string;
}

const Dot = styled(YStack, {
  name: 'SeverityDot',
  borderRadius: '$10',
  
  variants: {
    size: {
      sm: { width: 8, height: 8 },
      md: { width: 12, height: 12 },
      lg: { width: 16, height: 16 },
    },
    severity: {
      critical: { backgroundColor: '$red9' },
      high: { backgroundColor: '$orange9' },
      medium: { backgroundColor: '$yellow9' },
      low: { backgroundColor: '$blue9' },
      info: { backgroundColor: '$color8' },
    },
  } as const,
  
  defaultVariants: {
    size: 'md',
    severity: 'info',
  },
});

export function SeverityDot({
  severity,
  size = 'md',
  className = '',
}: SeverityDotProps) {
  const config = TASK_SEVERITY_CONFIG[severity];

  return (
    <Dot
      size={size}
      severity={severity}
      title={`${config.label} severity`}
      aria-label={`${config.label} severity`}
    />
  );
}

/**
 * Helper function to get severity color class for text
 */
export function getSeverityTextColor(severity: TaskSeverity): string {
  return TASK_SEVERITY_CONFIG[severity].color;
}

/**
 * Helper function to get severity background color class
 */
export function getSeverityBgColor(severity: TaskSeverity): string {
  return TASK_SEVERITY_CONFIG[severity].bgColor;
}

/**
 * Helper function to get severity border color class
 */
export function getSeverityBorderColor(severity: TaskSeverity): string {
  return TASK_SEVERITY_CONFIG[severity].borderColor;
}
