/**
 * FlagBadge - Flag badge component using Tamagui
 * REQ-269: Policy & Endorsement Level Flags
 */
import React from 'react';
import { XStack, YStack, Text } from '@unicornlove/ui';
import { Chip as Badge } from '@unicornlove/ui';
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
        size="sm"
        aria-label={`${label}: ${config.label} severity`}
        title={title || `${label} - ${config.label}`}
      >
        <XStack alignItems="center" gap="$1">
          {getSeverityIcon(severity)}
          <Text>{label}</Text>
        </XStack>
      </Badge>
    );
  }

  return (
    <YStack
      borderRadius="$md"
      borderWidth={1}
      borderColor={severity === 'critical' ? '$red6' : severity === 'warning' ? '$yellow6' : '$blue6'}
      backgroundColor={severity === 'critical' ? '$red2' : severity === 'warning' ? '$yellow2' : '$blue2'}
      padding="$3"
      aria-label={`${label}: ${config.label} severity`}
    >
      <XStack alignItems="flex-start" gap="$3">
        <YStack flexShrink={0}>
          {getSeverityIcon(severity)}
        </YStack>

        <YStack flex={1} minWidth={0} gap="$1">
          <XStack alignItems="center" gap="$2" flexWrap="wrap">
            <Badge variant="default" size="sm">
              <XStack alignItems="center" gap="$1">
                {getEntityTypeIcon(entityType)}
                <Text>{label}</Text>
              </XStack>
            </Badge>

            <Badge variant={variant} size="sm">
              {config.label}
            </Badge>

            {flagType && (
              <Text fontSize="$1" color="$color9" fontWeight="500">
                {flagType.replace(/_/g, ' ')}
              </Text>
            )}
          </XStack>

          {title && (
            <Text fontSize="$2" fontWeight="500" color="$color11" marginTop="$1">
              {title}
            </Text>
          )}

          {showDescription && description && (
            <Text fontSize="$2" color="$color10" marginTop="$1">
              {description}
            </Text>
          )}
        </YStack>
      </XStack>
    </YStack>
  );
};

export default FlagBadge;
