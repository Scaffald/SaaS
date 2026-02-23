import { ShieldAlert, ShieldCheck, ShieldQuestion, ShieldX } from 'lucide-react-native'
import { Text, Row } from '@scaffald/ui'
import { colors } from '@scaffald/ui/tokens'

type BadgeStatus = 'active' | 'expired' | 'revoked' | null | undefined

type IdVerificationBadgeProps = {
  status: BadgeStatus
  badgeExpiresAt?: string | null
  size?: 'sm' | 'md'
  muted?: boolean
}

type BadgeVisual = {
  label: string
  icon: typeof ShieldCheck
  color: string
  background: string
  border: string
}

const STATUS_COPY: Record<'active' | 'expired' | 'revoked' | 'unknown', BadgeVisual> = {
  active: {
    label: 'ID Verified',
    icon: ShieldCheck,
    color: colors.success[700],
    background: colors.success[100],
    border: colors.success[300],
  },
  expired: {
    label: 'ID badge expired',
    icon: ShieldAlert,
    color: colors.warning[700],
    background: colors.warning[100],
    border: colors.warning[300],
  },
  revoked: {
    label: 'ID badge revoked',
    icon: ShieldX,
    color: colors.error[600],
    background: colors.error[100],
    border: colors.error[300],
  },
  unknown: {
    label: 'ID badge unavailable',
    icon: ShieldQuestion,
    color: colors.gray[600],
    background: colors.gray[100],
    border: colors.gray[200],
  },
}

function formatDate(value?: string | null): string | null {
  if (!value) return null
  try {
    return new Date(value).toLocaleDateString()
  } catch {
    return null
  }
}

export function IdVerificationBadge({
  status,
  badgeExpiresAt,
  size = 'md',
  muted = false,
}: IdVerificationBadgeProps) {
  const normalizedStatus: 'active' | 'expired' | 'revoked' | 'unknown' =
    status === 'active' || status === 'expired' || status === 'revoked' ? status : 'unknown'

  const copy = STATUS_COPY[normalizedStatus]
  const Icon = copy.icon
  const expiresText = normalizedStatus === 'active' ? formatDate(badgeExpiresAt) : null
  const mutedBackground = colors.gray[50]
  const mutedBorder = colors.gray[200]
  const mutedColor = colors.gray[600]
  const mutedSubtext = colors.gray[500]

  return (
    <Row
      align="center"
      gap={6}
      paddingHorizontal={size === 'sm' ? 8 : 12}
      paddingVertical={size === 'sm' ? 4 : 8}
      style={{ borderRadius: 10 }}
      backgroundColor={muted ? mutedBackground : copy.background}
      borderWidth={1}
      borderColor={muted ? mutedBorder : copy.border}
    >
      <Icon size={size === 'sm' ? 14 : 16} color={muted ? mutedColor : copy.color} />
      <Text style={{ color: muted ? mutedColor : copy.color }}>{copy.label}</Text>
      {expiresText && <Text style={{ color: muted ? mutedSubtext : copy.color }}>· exp {expiresText}</Text>}
    </Row>
  )
}
