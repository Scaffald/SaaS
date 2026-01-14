/**
 * RelationshipCard - Relationship card using Beyond UI
 */
import React from 'react';
import { Row, Stack, Text, Card } from '@unicornlove/beyond-ui';
import { Chip as Badge } from '@unicornlove/beyond-ui';
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
      style={{
        padding: 24,
        cursor: onClick ? 'pointer' : 'default',
      }}
      onClick={onClick}
    >
      <Row style={{ alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: 16 }}>
        <Row style={{ alignItems: 'flex-start', gap: 12 }}>
          <Stack
            style={{
              width: 48,
              height: 48,
              backgroundColor: 'var(--color-blue3)',
              borderRadius: 8,
              alignItems: 'center',
              justifyContent: 'center',
              flexShrink: 0,
            }}
          >
            <Building size={24} color="currentColor" />
          </Stack>
          <Stack style={{ gap: 4 }}>
            <Text style={{ fontSize: 18, fontWeight: 600, color: 'var(--color-color11)' }}>
              {organizationName}
            </Text>
            <Badge variant={getTypeBadgeVariant()} size="sm">
              {getTypeLabel()}
            </Badge>
          </Stack>
        </Row>
        <StatusBadge status={status} size="sm" />
      </Row>

      <Row style={{ flexWrap: 'wrap', gap: 16 }}>
        {complianceScore !== undefined && (
          <Stack style={{ gap: 4 }}>
            <Text style={{ fontSize: 12, color: 'var(--color-color10)', marginBottom: 4 }}>
              Compliance
            </Text>
            <ComplianceScore
              score={complianceScore}
              size="sm"
              showTrend={false}
            />
          </Stack>
        )}

        {relationshipHealth && (
          <Stack style={{ gap: 4 }}>
            <Text style={{ fontSize: 12, color: 'var(--color-color10)', marginBottom: 4 }}>
              Relationship Health
            </Text>
            <Row style={{ alignItems: 'center', gap: 4 }}>
              {getHealthIcon()}
              <Text style={{ fontSize: 14, fontWeight: 500, color: 'var(--color-color11)', textTransform: 'capitalize' }}>
                {relationshipHealth}
              </Text>
            </Row>
          </Stack>
        )}

        {activeProjects !== undefined && (
          <Stack style={{ gap: 4 }}>
            <Text style={{ fontSize: 12, color: 'var(--color-color10)', marginBottom: 4 }}>
              Active Projects
            </Text>
            <Text style={{ fontSize: 14, fontWeight: 600, color: 'var(--color-color11)' }}>
              {activeProjects}
            </Text>
          </Stack>
        )}

        <Stack style={{ gap: 4 }}>
          <Text style={{ fontSize: 12, color: 'var(--color-color10)', marginBottom: 4 }}>
            Last Activity
          </Text>
          <Row style={{ alignItems: 'center', gap: 4, color: 'var(--color-color10)' }}>
            <Clock size={12} />
            <Text style={{ fontSize: 14 }}>{formatDistanceToNow(lastActivity)}</Text>
          </Row>
        </Stack>
      </Row>
    </Card>
  );
}
