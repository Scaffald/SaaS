/**
 * FlagBadge - Flag badge component using Beyond UI
 * REQ-269: Policy & Endorsement Level Flags
 */
import React from 'react';
import { Row, Stack, Text } from '@unicornlove/beyond-ui';
import { Chip as Badge } from '@unicornlove/beyond-ui';
import { AlertTriangle, AlertCircle, Info, FileText, Layers, ScrollText } from 'lucide-react';
import { FlaggableEntityType, FlagSeverity, FLAG_SEVERITY_CONFIG } from '../../types';

export interface FlagBadgeProps {
  entityType: FlaggableEntityType;
  severity: FlagSeverity;
  flagType?: string;
  title?: string;
  description?: string;
  compact?: boolean;
  showDescription?: boolean;
}

export function getEntityTypeLabel(entityType: FlaggableEntityType): string {
  switch (entityType) {
    case 'policy':
      return 'Policy Flag';
    case 'provision':
      return 'Provision Flag';
    case 'endorsement':
      return 'Endorsement Flag';
    default:
      return 'Flag';
  }
}

function getEntityTypeIcon(entityType: FlaggableEntityType) {
  const size = 14;
  switch (entityType) {
    case 'policy':
      return <FileText size={size} />;
    case 'provision':
      return <Layers size={size} />;
    case 'endorsement':
      return <ScrollText size={size} />;
    default:
      return <FileText size={size} />;
  }
}

function getSeverityIcon(severity: FlagSeverity) {
  const size = 14;
  switch (severity) {
    case 'critical':
      return <AlertTriangle size={size} />;
    case 'warning':
      return <AlertCircle size={size} />;
    case 'info':
      return <Info size={size} />;
    default:
      return <AlertCircle size={size} />;
  }
}

const severityVariantMap: Record<FlagSeverity, 'default' | 'success' | 'warning' | 'error' | 'info'> = {
  critical: 'error',
  warning: 'warning',
  info: 'info',
};

function getSeverityStyles(severity: FlagSeverity): React.CSSProperties {
  switch (severity) {
    case 'critical':
      return {
        borderColor: 'var(--color-red-6)',
        backgroundColor: 'var(--color-red-2)',
      };
    case 'warning':
      return {
        borderColor: 'var(--color-yellow-6)',
        backgroundColor: 'var(--color-yellow-2)',
      };
    case 'info':
    default:
      return {
        borderColor: 'var(--color-blue-6)',
        backgroundColor: 'var(--color-blue-2)',
      };
  }
}

export const FlagBadge: React.FC<FlagBadgeProps> = ({
  entityType,
  severity,
  flagType,
  title,
  description,
  compact = false,
  showDescription = false,
}) => {
  const config = FLAG_SEVERITY_CONFIG[severity];
  const label = getEntityTypeLabel(entityType);
  const variant = severityVariantMap[severity] || 'default';

  if (compact) {
    return (
      <Badge
        variant={variant}
        size="$2"
        aria-label={`${label}: ${config.label} severity`}
        title={title || `${label} - ${config.label}`}
      >
        <Row style={{ alignItems: 'center', gap: 4 }}>
          {getSeverityIcon(severity)}
          <Text>{label}</Text>
        </Row>
      </Badge>
    );
  }

  return (
    <Stack
      style={{
        borderRadius: 'var(--radius-3)',
        borderWidth: 1,
        borderStyle: 'solid',
        padding: 'var(--space-3)',
        ...getSeverityStyles(severity),
      }}
      aria-label={`${label}: ${config.label} severity`}
    >
      <Row style={{ alignItems: 'flex-start', gap: 'var(--space-3)' }}>
        <Stack style={{ flexShrink: 0 }}>
          {getSeverityIcon(severity)}
        </Stack>

        <Stack style={{ flex: 1, minWidth: 0, gap: 4 }}>
          <Row style={{ alignItems: 'center', gap: 'var(--space-2)', flexWrap: 'wrap' }}>
            <Badge variant="default" size="$2">
              <Row style={{ alignItems: 'center', gap: 4 }}>
                {getEntityTypeIcon(entityType)}
                <Text>{label}</Text>
              </Row>
            </Badge>

            <Badge variant={variant} size="$2">
              {config.label}
            </Badge>

            {flagType && (
              <Text style={{ fontSize: 'var(--font-size-1)', color: 'var(--color-9)', fontWeight: 500 }}>
                {flagType.replace(/_/g, ' ')}
              </Text>
            )}
          </Row>

          {title && (
            <Text style={{ fontSize: 'var(--font-size-2)', fontWeight: 500, color: 'var(--color-11)', marginTop: 4 }}>
              {title}
            </Text>
          )}

          {showDescription && description && (
            <Text style={{ fontSize: 'var(--font-size-2)', color: 'var(--color-10)', marginTop: 4 }}>
              {description}
            </Text>
          )}
        </Stack>
      </Row>
    </Stack>
  );
};

export default FlagBadge;
