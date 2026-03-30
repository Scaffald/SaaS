import { StatusBadge } from '@scf/core/components/ui/StatusBadge'

type ApplicationStatus =
  | 'pending'
  | 'reviewing'
  | 'inquired'
  | 'interview'
  | 'offer'
  | 'hired'
  | 'rejected'
  | 'withdrawn'

type BadgeVariant = 'default' | 'success' | 'warning' | 'error'

const STATUS_CONFIG: Record<ApplicationStatus, { label: string; variant: BadgeVariant }> = {
  pending: { label: 'Applied', variant: 'default' },
  reviewing: { label: 'Under Review', variant: 'warning' },
  inquired: { label: 'Inquiry Sent', variant: 'warning' },
  interview: { label: 'Interview', variant: 'success' },
  offer: { label: 'Offer', variant: 'success' },
  hired: { label: 'Hired', variant: 'success' },
  rejected: { label: 'Not Selected', variant: 'error' },
  withdrawn: { label: 'Withdrawn', variant: 'default' },
}

interface ApplicationStatusBadgeProps {
  status: string
}

export function ApplicationStatusBadge({ status }: ApplicationStatusBadgeProps) {
  const config = STATUS_CONFIG[status as ApplicationStatus] ?? {
    label: status,
    variant: 'default' as BadgeVariant,
  }

  return <StatusBadge variant={config.variant}>{config.label}</StatusBadge>
}
