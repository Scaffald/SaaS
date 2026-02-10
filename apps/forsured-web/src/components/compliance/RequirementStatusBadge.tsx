/**
 * Requirement Status Badge
 * Visual status indicator for compliance requirements
 */

import { Row, Text } from '@unicornlove/beyond-ui';
import type { RequirementStatus } from '../../server/schemas/forsured/compliance-requirements.schema';

interface RequirementStatusBadgeProps {
  status: RequirementStatus;
  size?: 'xs' | 'sm' | 'md';
}

interface StatusConfig {
  label: string;
  backgroundColor: string;
  textColor: string;
  borderColor: string;
}

const statusConfig: Record<RequirementStatus, StatusConfig> = {
  draft: {
    label: 'Draft',
    backgroundColor: 'var(--color-gray-4)',
    textColor: 'var(--color-gray-11)',
    borderColor: 'var(--color-gray-6)',
  },
  active: {
    label: 'Active',
    backgroundColor: 'var(--color-green-4)',
    textColor: 'var(--color-green-11)',
    borderColor: 'var(--color-green-6)',
  },
  pending_approval: {
    label: 'Pending Approval',
    backgroundColor: 'var(--color-yellow-4)',
    textColor: 'var(--color-yellow-11)',
    borderColor: 'var(--color-yellow-6)',
  },
  deprecated: {
    label: 'Deprecated',
    backgroundColor: 'var(--color-orange-4)',
    textColor: 'var(--color-orange-11)',
    borderColor: 'var(--color-orange-6)',
  },
  archived: {
    label: 'Archived',
    backgroundColor: 'var(--color-gray-4)',
    textColor: 'var(--color-gray-10)',
    borderColor: 'var(--color-gray-6)',
  },
};

interface SizeConfig {
  paddingHorizontal: string;
  paddingVertical: string;
  fontSize: string;
}

const sizeConfig: Record<'xs' | 'sm' | 'md', SizeConfig> = {
  xs: {
    paddingHorizontal: '6px',
    paddingVertical: '2px',
    fontSize: 'var(--font-size-2)',
  },
  sm: {
    paddingHorizontal: '8px',
    paddingVertical: '2px',
    fontSize: 'var(--font-size-2)',
  },
  md: {
    paddingHorizontal: '10px',
    paddingVertical: '4px',
    fontSize: 'var(--font-size-3)',
  },
};

export function RequirementStatusBadge({ status, size = 'sm' }: RequirementStatusBadgeProps) {
  const config = statusConfig[status] || statusConfig.draft;
  const sizeProps = sizeConfig[size];

  return (
    <Row
      style={{
        alignItems: 'center',
        borderRadius: 'var(--radius-2)',
        borderWidth: 1,
        borderStyle: 'solid',
        backgroundColor: config.backgroundColor,
        borderColor: config.borderColor,
        paddingLeft: sizeProps.paddingHorizontal,
        paddingRight: sizeProps.paddingHorizontal,
        paddingTop: sizeProps.paddingVertical,
        paddingBottom: sizeProps.paddingVertical,
      }}
    >
      <Text style={{ fontSize: sizeProps.fontSize, fontWeight: 500, color: config.textColor }}>
        {config.label}
      </Text>
    </Row>
  );
}

export default RequirementStatusBadge;
