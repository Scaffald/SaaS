/**
 * Requirement Type Badge
 * REQ-2, TASK-13: Visual type indicator for coverage requirements
 */

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

const typeConfig: Record<CoverageType, { label: string; className: string; icon: LucideIcon }> = {
  general_liability: {
    label: 'General Liability',
    className: 'bg-blue-50 text-blue-700 border-blue-200',
    icon: Shield,
  },
  umbrella_liability: {
    label: 'Umbrella',
    className: 'bg-purple-50 text-purple-700 border-purple-200',
    icon: Umbrella,
  },
  auto_liability: {
    label: 'Auto',
    className: 'bg-cyan-50 text-cyan-700 border-cyan-200',
    icon: Car,
  },
  workers_comp: {
    label: 'Workers Comp',
    className: 'bg-amber-50 text-amber-700 border-amber-200',
    icon: HardHat,
  },
  professional_liability: {
    label: 'Professional',
    className: 'bg-indigo-50 text-indigo-700 border-indigo-200',
    icon: Building2,
  },
  excess_liability: {
    label: 'Excess',
    className: 'bg-violet-50 text-violet-700 border-violet-200',
    icon: FileCheck,
  },
};

const sizeClasses = {
  xs: 'px-1.5 py-0.5 text-xs gap-1',
  sm: 'px-2 py-0.5 text-xs gap-1',
  md: 'px-2.5 py-1 text-sm gap-1.5',
};

const iconSizes = {
  xs: 10,
  sm: 12,
  md: 14,
};

export function RequirementTypeBadge({ type, size = 'sm', showIcon = true }: RequirementTypeBadgeProps) {
  const config = typeConfig[type] || typeConfig.general_liability;
  const Icon = config.icon;

  return (
    <span
      className={`inline-flex items-center font-medium rounded border ${config.className} ${sizeClasses[size]}`}
    >
      {showIcon && <Icon size={iconSizes[size]} />}
      {config.label}
    </span>
  );
}

export default RequirementTypeBadge;
