/**
 * StatusBadge - Status badge component using Beyond UI

 */
import React from 'react'
import { Row, Chip } from '@unicornlove/beyond-ui'
import { CheckCircle, AlertTriangle, XCircle, Clock, FileText, Edit } from 'lucide-react'

type AckStatus =
  | 'draft'
  | 'pending_broker'
  | 'pending_subcontractor'
  | 'submitted'
  | 'under_review'
  | 'changes_requested'
  | 'approved'
type StandardStatus =
  | 'compliant'
  | 'warning'
  | 'critical'
  | 'pending'
  | 'verified'
  | 'expired'
  | 'rejected'
  | 'active'
  | 'completed'

interface StatusBadgeProps {
  status: StandardStatus | AckStatus
  size?: 'xs' | 'sm' | 'md' | 'lg'
  showIcon?: boolean
}

const getStatusConfig = (status: StandardStatus | AckStatus) => {
  switch (status) {
    case 'compliant':
    case 'verified':
    case 'active':
      return {
        variant: 'success' as const,
        icon: CheckCircle,
        label: status === 'compliant' ? 'Compliant' : status === 'verified' ? 'Verified' : 'Active',
      }
    case 'approved':
      return {
        variant: 'success' as const,
        icon: CheckCircle,
        label: 'Approved',
      }
    case 'warning':
    case 'pending':
      return {
        variant: 'warning' as const,
        icon: AlertTriangle,
        label: status === 'warning' ? 'Warning' : 'Pending',
      }
    case 'submitted':
    case 'under_review':
      return {
        variant: 'info' as const,
        icon: Clock,
        label: status === 'submitted' ? 'Submitted' : 'Under Review',
      }
    case 'changes_requested':
      return {
        variant: 'warning' as const,
        icon: Edit,
        label: 'Changes Requested',
      }
    case 'draft':
      return {
        variant: 'default' as const,
        icon: FileText,
        label: 'Draft',
      }
    case 'pending_broker':
      return {
        variant: 'default' as const,
        icon: Clock,
        label: 'Pending Broker',
      }
    case 'pending_subcontractor':
      return {
        variant: 'default' as const,
        icon: Clock,
        label: 'Pending Sub',
      }
    case 'critical':
    case 'expired':
    case 'rejected':
      return {
        variant: 'error' as const,
        icon: XCircle,
        label: status === 'critical' ? 'Critical' : status === 'expired' ? 'Expired' : 'Rejected',
      }
    case 'completed':
      return {
        variant: 'default' as const,
        icon: CheckCircle,
        label: 'Completed',
      }
    default:
      return {
        variant: 'default' as const,
        icon: Clock,
        label: 'Pending Review',
      }
  }
}

const iconSizes = {
  xs: 10,
  sm: 12,
  md: 14,
  lg: 16,
}

export default function StatusBadge({ status, size = 'md', showIcon = true }: StatusBadgeProps) {
  const config = getStatusConfig(status)
  const Icon = config.icon

  return (
    <Chip variant={config.variant} size={size}>
      <Row gap={4} alignItems="center">
        {showIcon && <Icon size={iconSizes[size]} />}
        <span>{config.label}</span>
      </Row>
    </Chip>
  )
}
