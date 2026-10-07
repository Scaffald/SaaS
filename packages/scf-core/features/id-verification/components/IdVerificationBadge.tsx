import { ShieldAlert, ShieldCheck, ShieldQuestion, ShieldX } from 'lucide-react-native'
import { Text, Row, useThemeContext } from '@scaffald/ui'
import { colors } from '@scaffald/ui/tokens'

type BadgeStatus = 'active' | 'expired' | 'revoked' | null | undefined

type IdVerificationBadgeProps = {
  status: BadgeStatus
  badgeExpiresAt?: string | null
  size?: 'sm' | 'md'
  muted?: boolean
}

type Tone = 'success' | 'warning' | 'error' | 'neutral'

const STATUS_COPY: Record<
  'active' | 'expired' | 'revoked' | 'unknown',
  { label: string; icon: typeof ShieldCheck; tone: Tone }
> = {
  active: { label: 'ID Verified', icon: ShieldCheck, tone: 'success' },
  expired: { label: 'ID badge expired', icon: ShieldAlert, tone: 'warning' },
  revoked: { label: 'ID badge revoked', icon: ShieldX, tone: 'error' },
  unknown: { label: 'ID badge unavailable', icon: ShieldQuestion, tone: 'neutral' },
}

/**
 * Colours from the theme. These were fixed 100/300/700 ramps, so every badge
 * was a pale block on the dark ground; "ID badge unavailable" was a white one
 * (#1034). A status tone is its semantic foreground on a faint tint of it.
 */
function toneColors(tone: Tone, t: 'light' | 'dark') {
  if (tone === 'neutral') {
    return {
      color: colors.text[t].secondary,
      background: colors.bg[t].subtle,
      border: colors.border[t].default,
    }
  }
  return {
    color: colors.fg[t][tone],
    background: `${colors.fg[t][tone]}1A`,
    border: colors.border[t][tone],
  }
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

  const { theme } = useThemeContext()
  const t = theme === 'dark' ? 'dark' : 'light'
  const copy = STATUS_COPY[normalizedStatus]
  const Icon = copy.icon
  const expiresText = normalizedStatus === 'active' ? formatDate(badgeExpiresAt) : null
  const tone = toneColors(muted ? 'neutral' : copy.tone, t)

  return (
    <Row
      align="center"
      gap={6}
      paddingHorizontal={size === 'sm' ? 8 : 12}
      paddingVertical={size === 'sm' ? 4 : 8}
      style={{ borderRadius: 7 }}
      backgroundColor={tone.background}
      borderWidth={1}
      borderColor={tone.border}
    >
      <Icon size={size === 'sm' ? 14 : 16} color={tone.color} />
      <Text style={{ color: tone.color }}>{copy.label}</Text>
      {expiresText && <Text style={{ color: tone.color }}>· exp {expiresText}</Text>}
    </Row>
  )
}
