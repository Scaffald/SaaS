/**
 * DelegationBadge - Delegation badge using Beyond UI
 */
import React from 'react';
import { Row, Text } from '@unicornlove/beyond-ui';
import { Chip as Badge } from '@unicornlove/beyond-ui';
import { Shield, Eye, Edit } from 'lucide-react';

interface DelegationBadgeProps {
  accessLevel:
    | 'admin'
    | 'full_access'
    | 'read_only'
    | 'view_only'
    | 'manage_policies'
    | 'full_management';
  size?: 'sm' | 'md' | 'lg';
}

export default function DelegationBadge({
  accessLevel,
  size = 'md',
}: DelegationBadgeProps) {
  const getAccessInfo = () => {
    switch (accessLevel) {
      case 'admin':
      case 'full_management':
        return {
          label: 'Full Access',
          icon: Shield,
          variant: 'default' as const,
        };
      case 'full_access':
      case 'manage_policies':
        return {
          label: 'Can Manage',
          icon: Edit,
          variant: 'info' as const,
        };
      case 'read_only':
      case 'view_only':
        return {
          label: 'View Only',
          icon: Eye,
          variant: 'default' as const,
        };
      default:
        return {
          label: 'View Only',
          icon: Eye,
          variant: 'default' as const,
        };
    }
  };

  const iconSizes = {
    sm: 12,
    md: 14,
    lg: 16,
  };

  const { label, icon: Icon, variant } = getAccessInfo();

  return (
    <Badge variant={variant} size={size}>
      <Row style={{ alignItems: 'center', gap: 4 }}>
        <Icon size={iconSizes[size]} />
        <Text>{label}</Text>
      </Row>
    </Badge>
  );
}
