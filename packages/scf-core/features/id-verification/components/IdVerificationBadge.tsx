import { ShieldAlert, ShieldCheck, ShieldQuestion, ShieldX } from '@tamagui/lucide-icons'
import { type GetThemeValueForKey, Text, Row } from '@unicornlove/beyond-ui'

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
  color: GetThemeValueForKey<'color'>
  background: GetThemeValueForKey<'backgroundColor'>
  border: GetThemeValueForKey<'borderColor'>
}

const STATUS_COPY: Record<'active' | 'expired' | 'revoked' | 'unknown', BadgeVisual> = {
  active: {
    label: 'ID Verified',
    icon: ShieldCheck,
    color: '$green11',
    background: '$green3',
    border: '$green6',
  },
  expired: {
    label: 'ID badge expired',
    icon: ShieldAlert,
    color: '$orange11',
    background: '$orange3',
    border: '$orange6',
  },
  revoked: {
    label: 'ID badge revoked',
    icon: ShieldX,
    color: '$red11',
    background: '$red3',
    border: '$red6',
  },
  unknown: {
    label: 'ID badge unavailable',
    icon: ShieldQuestion,
    color: '$color11',
    background: '$color3',
    border: '$borderColor',
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
  const mutedBackground = '$color2' as GetThemeValueForKey<'backgroundColor'>
  const mutedBorder = '$borderColor' as GetThemeValueForKey<'borderColor'>
  const mutedColor = '$color11' as GetThemeValueForKey<'color'>
  const mutedSubtext = '$color10' as GetThemeValueForKey<'color'>

  return (
    <Row
      alignItems="center"
      gap="$1.5"
      paddingHorizontal={size === 'sm' ? '$2' : '$3'}
      paddingVertical={size === 'sm' ? '$1' : '$2'}
      borderRadius="$10"
      backgroundColor={muted ? mutedBackground : copy.background}
      borderWidth={1}
      borderColor={muted ? mutedBorder : copy.border}
    >
      <Icon size={size === 'sm' ? 14 : 16} color={muted ? mutedColor : copy.color} />
      <Text fontSize={size === 'sm' ? '$2' : '$3'} color={muted ? mutedColor : copy.color}>
        {copy.label}
      </Text>
      {expiresText && (
        <Text fontSize="$2" color={muted ? mutedSubtext : copy.color}>
          · exp {expiresText}
        </Text>
      )}
    </Row>
  )
}
