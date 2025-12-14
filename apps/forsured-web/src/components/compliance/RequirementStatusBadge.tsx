/**
 * Requirement Status Badge
 * REQ-2, TASK-13: Visual status indicator for compliance requirements
 */

import type { RequirementStatus } from '../../server/schemas/forsured/compliance-requirements.schema';

interface RequirementStatusBadgeProps {
  status: RequirementStatus;
  size?: 'xs' | 'sm' | 'md';
}

const statusConfig: Record<RequirementStatus, { label: string; className: string }> = {
  draft: {
    label: 'Draft',
    className: 'bg-gray-100 text-gray-700 border-gray-200',
  },
  active: {
    label: 'Active',
    className: 'bg-success-50 text-success-700 border-success-200',
  },
  pending_approval: {
    label: 'Pending Approval',
    className: 'bg-warning-50 text-warning-700 border-warning-200',
  },
  deprecated: {
    label: 'Deprecated',
    className: 'bg-orange-50 text-orange-700 border-orange-200',
  },
  archived: {
    label: 'Archived',
    className: 'bg-gray-100 text-gray-500 border-gray-200',
  },
};

const sizeClasses = {
  xs: 'px-1.5 py-0.5 text-xs',
  sm: 'px-2 py-0.5 text-xs',
  md: 'px-2.5 py-1 text-sm',
};

export function RequirementStatusBadge({ status, size = 'sm' }: RequirementStatusBadgeProps) {
  const config = statusConfig[status] || statusConfig.draft;

  return (
    <span
      className={`inline-flex items-center font-medium rounded border ${config.className} ${sizeClasses[size]}`}
    >
      {config.label}
    </span>
  );
}

export default RequirementStatusBadge;
