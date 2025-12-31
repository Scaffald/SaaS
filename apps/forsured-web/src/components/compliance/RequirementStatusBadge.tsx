/**
 * Requirement Status Badge
 * REQ-2, TASK-13: Visual status indicator for compliance requirements
 */

import { XStack, Text } from '@unicornlove/ui';
import type { RequirementStatus } from '../../server/schemas/forsured/compliance-requirements.schema';

interface RequirementStatusBadgeProps {
  status: RequirementStatus;
  size?: 'xs' | 'sm' | 'md';
}

const statusConfig: Record<RequirementStatus, { label: string; backgroundColor: string; textColor: string; borderColor: string }> = {
  draft: {
    label: 'Draft',
    backgroundColor: '$gray4',
    textColor: '$gray11',
    borderColor: '$gray6',
  },
  active: {
    label: 'Active',
    backgroundColor: '$green4',
    textColor: '$green11',
    borderColor: '$green6',
  },
  pending_approval: {
    label: 'Pending Approval',
    backgroundColor: '$yellow4',
    textColor: '$yellow11',
    borderColor: '$yellow6',
  },
  deprecated: {
    label: 'Deprecated',
    backgroundColor: '$orange4',
    textColor: '$orange11',
    borderColor: '$orange6',
  },
  archived: {
    label: 'Archived',
    backgroundColor: '$gray4',
    textColor: '$gray10',
    borderColor: '$gray6',
  },
};

const sizeConfig = {
  xs: {
    paddingHorizontal: '$1.5',
    paddingVertical: '$0.5',
    fontSize: '$2',
  },
  sm: {
    paddingHorizontal: '$2',
    paddingVertical: '$0.5',
    fontSize: '$2',
  },
  md: {
    paddingHorizontal: '$2.5',
    paddingVertical: '$1',
    fontSize: '$3',
  },
};

export function RequirementStatusBadge({ status, size = 'sm' }: RequirementStatusBadgeProps) {
  const config = statusConfig[status] || statusConfig.draft;
  const sizeProps = sizeConfig[size];

  return (
    <XStack
      alignItems="center"
      borderRadius="$2"
      borderWidth={1}
      backgroundColor={config.backgroundColor}
      borderColor={config.borderColor}
      paddingHorizontal={sizeProps.paddingHorizontal}
      paddingVertical={sizeProps.paddingVertical}
    >
      <Text fontSize={sizeProps.fontSize} fontWeight="500" color={config.textColor}>
        {config.label}
      </Text>
    </XStack>
  );
}

export default RequirementStatusBadge;
