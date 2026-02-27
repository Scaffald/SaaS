/**
 * Requirement Type Badge
 * Visual type indicator for coverage requirements
 */

import { Row, Text } from '@scaffald/ui';
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

interface TypeConfig {
  label: string;
  backgroundColor: string;
  textColor: string;
  borderColor: string;
  icon: LucideIcon;
}

const typeConfig: Record<CoverageType, TypeConfig> = {
  general_liability: {
    label: 'General Liability',
    backgroundColor: 'var(--color-blue-4)',
    textColor: 'var(--color-blue-11)',
    borderColor: 'var(--color-blue-6)',
    icon: Shield,
  },
  umbrella_liability: {
    label: 'Umbrella',
    backgroundColor: 'var(--color-purple-4)',
    textColor: 'var(--color-purple-11)',
    borderColor: 'var(--color-purple-6)',
    icon: Umbrella,
  },
  auto_liability: {
    label: 'Auto',
    backgroundColor: 'var(--color-blue-4)',
    textColor: 'var(--color-blue-11)',
    borderColor: 'var(--color-blue-6)',
    icon: Car,
  },
  workers_comp: {
    label: 'Workers Comp',
    backgroundColor: 'var(--color-yellow-4)',
    textColor: 'var(--color-yellow-11)',
    borderColor: 'var(--color-yellow-6)',
    icon: HardHat,
  },
  professional_liability: {
    label: 'Professional',
    backgroundColor: 'var(--color-purple-4)',
    textColor: 'var(--color-purple-11)',
    borderColor: 'var(--color-purple-6)',
    icon: Building2,
  },
  excess_liability: {
    label: 'Excess',
    backgroundColor: 'var(--color-purple-4)',
    textColor: 'var(--color-purple-11)',
    borderColor: 'var(--color-purple-6)',
    icon: FileCheck,
  },
};

interface SizeConfig {
  paddingHorizontal: string;
  paddingVertical: string;
  fontSize: string;
  gap: string;
}

const sizeConfig: Record<'xs' | 'sm' | 'md', SizeConfig> = {
  xs: {
    paddingHorizontal: '6px',
    paddingVertical: '2px',
    fontSize: 'var(--font-size-2)',
    gap: '4px',
  },
  sm: {
    paddingHorizontal: '8px',
    paddingVertical: '2px',
    fontSize: 'var(--font-size-2)',
    gap: '4px',
  },
  md: {
    paddingHorizontal: '10px',
    paddingVertical: '4px',
    fontSize: 'var(--font-size-3)',
    gap: '6px',
  },
};

const iconSizes: Record<'xs' | 'sm' | 'md', number> = {
  xs: 10,
  sm: 12,
  md: 14,
};

export function RequirementTypeBadge({ type, size = 'sm', showIcon = true }: RequirementTypeBadgeProps) {
  const config = typeConfig[type] || typeConfig.general_liability;
  const sizeProps = sizeConfig[size];
  const Icon = config.icon;

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
        gap: sizeProps.gap,
      }}
    >
      {showIcon && <Icon size={iconSizes[size]} style={{ color: config.textColor }} />}
      <Text style={{ fontSize: sizeProps.fontSize, fontWeight: 500, color: config.textColor }}>
        {config.label}
      </Text>
    </Row>
  );
}

export default RequirementTypeBadge;
