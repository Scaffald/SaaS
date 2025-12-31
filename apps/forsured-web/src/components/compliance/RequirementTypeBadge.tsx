/**
 * Requirement Type Badge
 * REQ-2, TASK-13: Visual type indicator for coverage requirements
 */

import { XStack, Text } from '@unicornlove/ui';
import {
  Shield,
  Umbrella,
  Car,
  HardHat,
  Building2,
  FileCheck,
  LucideIcon,
} from 'lucide-react';
import type { CoverageType } from '../../server/schemas/forsured/compliance-requirements.schema';

interface RequirementTypeBadgeProps {
  type: CoverageType;
  size?: 'xs' | 'sm' | 'md';
  showIcon?: boolean;
}

const typeConfig: Record<CoverageType, { label: string; backgroundColor: string; textColor: string; borderColor: string; icon: LucideIcon }> = {
  general_liability: {
    label: 'General Liability',
    backgroundColor: '$blue4',
    textColor: '$blue11',
    borderColor: '$blue6',
    icon: Shield,
  },
  umbrella_liability: {
    label: 'Umbrella',
    backgroundColor: '$purple4',
    textColor: '$purple11',
    borderColor: '$purple6',
    icon: Umbrella,
  },
  auto_liability: {
    label: 'Auto',
    backgroundColor: '$blue4',
    textColor: '$blue11',
    borderColor: '$blue6',
    icon: Car,
  },
  workers_comp: {
    label: 'Workers Comp',
    backgroundColor: '$yellow4',
    textColor: '$yellow11',
    borderColor: '$yellow6',
    icon: HardHat,
  },
  professional_liability: {
    label: 'Professional',
    backgroundColor: '$purple4',
    textColor: '$purple11',
    borderColor: '$purple6',
    icon: Building2,
  },
  excess_liability: {
    label: 'Excess',
    backgroundColor: '$purple4',
    textColor: '$purple11',
    borderColor: '$purple6',
    icon: FileCheck,
  },
};

const sizeConfig = {
  xs: {
    paddingHorizontal: '$1.5',
    paddingVertical: '$0.5',
    fontSize: '$2',
    gap: '$1',
  },
  sm: {
    paddingHorizontal: '$2',
    paddingVertical: '$0.5',
    fontSize: '$2',
    gap: '$1',
  },
  md: {
    paddingHorizontal: '$2.5',
    paddingVertical: '$1',
    fontSize: '$3',
    gap: '$1.5',
  },
};

const iconSizes = {
  xs: 10,
  sm: 12,
  md: 14,
};

export function RequirementTypeBadge({ type, size = 'sm', showIcon = true }: RequirementTypeBadgeProps) {
  const config = typeConfig[type] || typeConfig.general_liability;
  const sizeProps = sizeConfig[size];
  const Icon = config.icon;

  return (
    <XStack
      alignItems="center"
      borderRadius="$2"
      borderWidth={1}
      backgroundColor={config.backgroundColor}
      borderColor={config.borderColor}
      paddingHorizontal={sizeProps.paddingHorizontal}
      paddingVertical={sizeProps.paddingVertical}
      gap={sizeProps.gap}
    >
      {showIcon && <Icon size={iconSizes[size]} />}
      <Text fontSize={sizeProps.fontSize} fontWeight="500" color={config.textColor}>
        {config.label}
      </Text>
    </XStack>
  );
}

export default RequirementTypeBadge;
