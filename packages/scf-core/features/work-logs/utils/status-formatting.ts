import { colors } from '@scaffald/ui/tokens'
import type { Theme } from '@scaffald/ui'

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
  const resolvedTheme = theme as 'light' | 'dark'

  if (!status) {
    return colors.text[resolvedTheme].secondary
  }

  const STATUS_COLORS: Record<string, string> = {
    draft: colors.text[resolvedTheme].tertiary,
    pending_verification: colors.text[resolvedTheme].warning,
    verified: colors.text[resolvedTheme].success,
    disputed: colors.text[resolvedTheme].error,
  }

  return STATUS_COLORS[status] ?? colors.text[resolvedTheme].tertiary
}
