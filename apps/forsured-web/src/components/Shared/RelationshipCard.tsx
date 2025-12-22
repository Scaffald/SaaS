/**
 * RelationshipCard - Relationship card using Tamagui
 */
import React from 'react';
import { XStack, YStack, Text } from '@unicornlove/ui';
import { Card } from '@unicornlove/ui';
import { Chip as Badge } from '@unicornlove/ui';
import {
  Building,
  TrendingUp,
  TrendingDown,
  Clock,
  CheckCircle,
  AlertTriangle,
} from 'lucide-react';
import ComplianceScore from '../Common/ComplianceScore';
import StatusBadge from '../Common/StatusBadge';
import { formatDistanceToNow } from '../../utils/dateHelpers';

interface RelationshipCardProps {
  organizationName: string;
  organizationType: 'gc' | 'subcontractor' | 'broker';
  status: 'invited' | 'active' | 'inactive' | 'pending';
  complianceScore?: number;
  lastActivity: string;
  relationshipHealth?: 'excellent' | 'good' | 'fair' | 'poor';
  activeProjects?: number;
  onClick?: () => void;
}

export default function RelationshipCard({
  organizationName,
  organizationType,
  status,
  complianceScore,
  lastActivity,
  relationshipHealth,
  activeProjects,
  onClick,
}: RelationshipCardProps) {
  const getHealthIcon = () => {
    switch (relationshipHealth) {
      case 'excellent':
        return <TrendingUp size={16} color="currentColor" />;
      case 'good':
        return <CheckCircle size={16} color="currentColor" />;
      case 'fair':
        return <AlertTriangle size={16} color="currentColor" />;
      case 'poor':
        return <TrendingDown size={16} color="currentColor" />;
      default:
        return null;
    }
  };

  const getTypeLabel = () => {
    switch (organizationType) {
      case 'gc':
        return 'General Contractor';
      case 'subcontractor':
        return 'Subcontractor';
      case 'broker':
        return 'Insurance Broker';
    }
  };

  const getTypeBadgeVariant = (): 'default' | 'success' | 'warning' | 'error' | 'info' => {
    switch (organizationType) {
      case 'gc':
        return 'default';
      case 'subcontractor':
        return 'info';
      case 'broker':
        return 'success';
    }
  };

  return (
    <Card
      padding="$6"
      onPress={onClick}
      cursor={onClick ? 'pointer' : 'default'}
      hoverStyle={onClick ? { shadowRadius: 8, shadowOffset: { width: 0, height: 4 }, borderColor: '$blue9' } : undefined}
    >
      <XStack alignItems="flex-start" justifyContent="space-between" mb="$4">
        <XStack alignItems="flex-start" gap="$3">
          <YStack
            width={48}
            height={48}
            backgroundColor="$blue3"
            borderRadius="$3"
            alignItems="center"
            justifyContent="center"
            flexShrink={0}
          >
            <Building size={24} color="currentColor" />
          </YStack>
          <YStack gap="$1">
            <Text fontSize="$5" fontWeight="600" color="$color11">
              {organizationName}
            </Text>
            <Badge variant={getTypeBadgeVariant()} size="sm">
              {getTypeLabel()}
            </Badge>
          </YStack>
        </XStack>
        <StatusBadge status={status} size="sm" />
      </XStack>

      <XStack flexWrap="wrap" gap="$4">
        {complianceScore !== undefined && (
          <YStack gap="$1">
            <Text fontSize="$1" color="$color10" mb="$1">
              Compliance
            </Text>
            <ComplianceScore
              score={complianceScore}
              size="sm"
              showTrend={false}
            />
          </YStack>
        )}

        {relationshipHealth && (
          <YStack gap="$1">
            <Text fontSize="$1" color="$color10" mb="$1">
              Relationship Health
            </Text>
            <XStack alignItems="center" gap="$1">
              {getHealthIcon()}
              <Text fontSize="$2" fontWeight="500" color="$color11" textTransform="capitalize">
                {relationshipHealth}
              </Text>
            </XStack>
          </YStack>
        )}

        {activeProjects !== undefined && (
          <YStack gap="$1">
            <Text fontSize="$1" color="$color10" mb="$1">
              Active Projects
            </Text>
            <Text fontSize="$2" fontWeight="600" color="$color11">
              {activeProjects}
            </Text>
          </YStack>
        )}

        <YStack gap="$1">
          <Text fontSize="$1" color="$color10" mb="$1">
            Last Activity
          </Text>
          <XStack alignItems="center" gap="$1" color="$color10">
            <Clock size={12} />
            <Text fontSize="$2">{formatDistanceToNow(lastActivity)}</Text>
          </XStack>
        </YStack>
      </XStack>
    </Card>
  );
}
