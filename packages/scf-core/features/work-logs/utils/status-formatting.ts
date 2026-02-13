import { colors } from '@unicornlove/beyond-ui/tokens'
import type { Theme } from '@unicornlove/beyond-ui'

const STATUS_LABELS: Record<string, string> = {
  draft: 'Draft',
  pending_verification: 'Awaiting Verification',
  verified: 'Verified',
  disputed: 'Disputed',
}

export const getStatusLabel = (status: string | null | undefined): string => {
  if (!status) return 'Unknown'
  return STATUS_LABELS[status] ?? status.replace(/_/g, ' ')
}

export const getStatusColor = (status: string | null | undefined, theme: Theme): string => {
  if (!status) {
    return colors.text[theme].secondary
  }

  const STATUS_COLORS: Record<string, string> = {
    draft: colors.text[theme].tertiary,
    pending_verification: colors.text[theme].warning,
    verified: colors.text[theme].success,
    disputed: colors.text[theme].error,
  }

  return STATUS_COLORS[status] ?? colors.text[theme].tertiary
}
