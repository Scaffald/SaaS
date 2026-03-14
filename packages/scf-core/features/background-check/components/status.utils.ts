import type { AppRouter } from '@scf/supabase/client-types'
import { colors } from '@scaffald/ui/tokens'
import type { inferRouterOutputs } from '@trpc/server'

type RouterOutputs = inferRouterOutputs<AppRouter>

export type BackgroundCheckSummary = RouterOutputs['backgroundChecks']['listChecks'][number]
export type BackgroundCheckStatus = BackgroundCheckSummary['status']

type GetCheckOutput = RouterOutputs['backgroundChecks']['getCheck']
export type BackgroundCheckDetail = GetCheckOutput['check']
export type BackgroundCheckDocument = GetCheckOutput['documents'][number]

type StatusTone = 'info' | 'success' | 'warning' | 'danger' | 'neutral'

export const BACKGROUND_CHECK_STATUSES: BackgroundCheckStatus[] = [
  'pending',
  'invited',
  'submitted',
  'in_progress',
  'under_review',
  'partially_completed',
  'disputed',
  'completed_clear',
  'completed_consider',
  'completed_not_clear',
  'failed',
  'cancelled',
  'expired',
  'refunded',
] as const

const ACTIVE_STATUSES = new Set<BackgroundCheckStatus>([
  'pending',
  'invited',
  'submitted',
  'in_progress',
  'under_review',
  'partially_completed',
  'disputed',
])

const COMPLETED_STATUSES = new Set<BackgroundCheckStatus>([
  'completed_clear',
  'completed_consider',
  'completed_not_clear',
  'failed',
  'cancelled',
  'refunded',
])

const EXPIRED_STATUSES = new Set<BackgroundCheckStatus>(['expired'])

const DISPUTE_ELIGIBLE_STATUSES = new Set<BackgroundCheckStatus>([
  'completed_clear',
  'completed_consider',
  'completed_not_clear',
  'partially_completed',
  'failed',
  'cancelled',
  'refunded',
])

const STATUS_METADATA: Record<
  BackgroundCheckStatus,
  { label: string; tone: StatusTone; description?: string }
> = {
  pending: {
    label: 'Pending',
    tone: 'info',
    description: 'Awaiting required information to begin your screening.',
  },
  invited: {
    label: 'Invited',
    tone: 'info',
    description: 'You have been invited to complete required steps.',
  },
  submitted: {
    label: 'Submitted',
    tone: 'info',
    description: 'Your information has been submitted to the screening provider.',
  },
  in_progress: {
    label: 'In Progress',
    tone: 'info',
    description: 'Your screening is underway with the provider.',
  },
  under_review: {
    label: 'Under Review',
    tone: 'warning',
    description: 'Provider analysts are reviewing findings.',
  },
  completed_clear: {
    label: 'Completed – Clear',
    tone: 'success',
    description: 'No issues were identified in your screening.',
  },
  completed_consider: {
    label: 'Completed – Consider',
    tone: 'warning',
    description: 'Review recommended before sharing with organizations.',
  },
  completed_not_clear: {
    label: 'Completed – Needs Attention',
    tone: 'danger',
    description: 'Items require review before sharing results.',
  },
  partially_completed: {
    label: 'Partially Completed',
    tone: 'warning',
    description: 'Some components remain outstanding with the provider.',
  },
  failed: {
    label: 'Failed',
    tone: 'danger',
    description: 'The screening could not be completed. Contact support.',
  },
  cancelled: {
    label: 'Cancelled',
    tone: 'neutral',
    description: 'This screening request was cancelled.',
  },
  disputed: {
    label: 'Disputed',
    tone: 'warning',
    description: 'You have submitted a dispute. Waiting on resolution.',
  },
  expired: {
    label: 'Expired',
    tone: 'neutral',
    description: 'Results are no longer shareable. Renew to keep them current.',
  },
  refunded: {
    label: 'Refunded',
    tone: 'neutral',
    description: 'Payment was refunded. Start a new screening if needed.',
  },
}

const STATUS_PROGRESS: Partial<Record<BackgroundCheckStatus, number>> = {
  pending: 10,
  invited: 20,
  submitted: 35,
  in_progress: 55,
  under_review: 70,
  partially_completed: 80,
  disputed: 60,
  completed_clear: 100,
  completed_consider: 100,
  completed_not_clear: 100,
  failed: 100,
  cancelled: 100,
  expired: 100,
  refunded: 100,
}

const COMPONENT_COMPLETE_STATUSES = new Set<BackgroundCheckStatus>([
  'completed_clear',
  'completed_consider',
  'completed_not_clear',
  'failed',
  'cancelled',
  'refunded',
])

const MS_IN_DAY = 1000 * 60 * 60 * 24

export function getStatusMetadata(status: BackgroundCheckStatus) {
  return (
    STATUS_METADATA[status] ?? {
      label: status.replace(/_/g, ' ').replace(/\b\w/g, (char: string) => char.toUpperCase()),
      tone: 'neutral' as StatusTone,
    }
  )
}

export function getStatusProgress(
  status: BackgroundCheckStatus,
  componentStatuses?: Array<{ status?: string | null }> | null
) {
  if (componentStatuses && componentStatuses.length > 0) {
    const total = componentStatuses.length
    const completed = componentStatuses.filter((component) =>
      COMPONENT_COMPLETE_STATUSES.has(component.status as BackgroundCheckStatus)
    ).length
    return Math.round((completed / total) * 100)
  }

  return STATUS_PROGRESS[status] ?? 0
}

export function isActiveStatus(status: BackgroundCheckStatus) {
  return ACTIVE_STATUSES.has(status)
}

export function isCompletedStatus(status: BackgroundCheckStatus) {
  return COMPLETED_STATUSES.has(status)
}

export function isExpiredStatus(status: BackgroundCheckStatus) {
  return EXPIRED_STATUSES.has(status)
}

export function canDisputeStatus(status: BackgroundCheckStatus) {
  return DISPUTE_ELIGIBLE_STATUSES.has(status)
}

export function getStatusCategory(
  status: BackgroundCheckStatus
): 'active' | 'completed' | 'expired' | 'other' {
  if (isActiveStatus(status)) return 'active'
  if (isExpiredStatus(status)) return 'expired'
  if (isCompletedStatus(status)) return 'completed'
  return 'other'
}

export function getStatusToneColors(tone: StatusTone, t: 'light' | 'dark' = 'light') {
  switch (tone) {
    case 'info':
      return {
        background: t === 'dark' ? colors.blue[900] : colors.blue[50],
        border: t === 'dark' ? colors.blue[700] : colors.blue[300],
        text: t === 'dark' ? colors.blue[300] : colors.blue[700],
      }
    case 'success':
      return {
        background: t === 'dark' ? colors.green[900] : colors.green[50],
        border: t === 'dark' ? colors.green[700] : colors.green[300],
        text: t === 'dark' ? colors.green[300] : colors.green[700],
      }
    case 'warning':
      return {
        background: t === 'dark' ? colors.yellow[900] : colors.yellow[50],
        border: t === 'dark' ? colors.yellow[700] : colors.yellow[300],
        text: t === 'dark' ? colors.yellow[300] : colors.yellow[700],
      }
    case 'danger':
      return {
        background: t === 'dark' ? colors.error[900] : colors.error[50],
        border: t === 'dark' ? colors.error[700] : colors.error[300],
        text: t === 'dark' ? colors.error[300] : colors.error[700],
      }
    default:
      return {
        background: colors.bg[t].muted,
        border: colors.border[t].default,
        text: colors.text[t].primary,
      }
  }
}

export function shouldShowExpirationWarning(expiresAt?: string | null) {
  if (!expiresAt) return false
  const expires = new Date(expiresAt).getTime()
  if (Number.isNaN(expires)) {
    return false
  }
  const diffDays = Math.round((expires - Date.now()) / MS_IN_DAY)
  return diffDays <= 30
}

export function hasExpired(expiresAt?: string | null) {
  if (!expiresAt) return false
  const expires = new Date(expiresAt).getTime()
  if (Number.isNaN(expires)) {
    return false
  }
  return expires < Date.now()
}

export function isRenewalEligible(status: BackgroundCheckStatus, expiresAt?: string | null) {
  if (isExpiredStatus(status)) return true
  if (isCompletedStatus(status)) {
    return hasExpired(expiresAt)
  }
  return false
}

export function daysUntilExpiration(expiresAt?: string | null) {
  if (!expiresAt) return null
  const expires = new Date(expiresAt).getTime()
  if (Number.isNaN(expires)) return null
  return Math.round((expires - Date.now()) / MS_IN_DAY)
}
