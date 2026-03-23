import { MapPin, User } from 'lucide-react-native'
import type { ComponentType, ReactNode } from 'react'
import { memo } from 'react'
import { Image, View } from 'react-native'
import type { ViewStyle } from 'react-native'
import { Card, Text, Row, Stack, useThemeContext, useResponsive } from '@scaffald/ui'
import { colors } from '@scaffald/ui/tokens'
import type { ResolvedThemeMode } from '@scaffald/ui/tokens'
import {
  workerPalette,
  metricColumnStyle,
  textCaption,
  iconCircleStyle,
} from '@scf/core/components/ui'

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export type DirectoryCardStatus = 'online' | 'offline' | 'busy' | 'away'

export interface DirectoryCardBadge {
  id: string
  label: string
  /** Badge color palette key */
  color?: 'primary' | 'accent' | 'gray'
}

export interface DirectoryCardMetric {
  /** Metric value (number or string, e.g. 94 or "8 years") */
  value: string | number
  /** Label below the value, e.g. "SCORE", "REVIEWS" */
  label: string
}

export interface DirectoryCardProps {
  /** Unique identifier */
  id: string

  // --- Identity section ---
  /** Display name (bold headline) */
  name: string
  /** Role/title (secondary text) */
  role?: string
  /** Location string, shown with MapPin icon */
  location?: string
  /** Avatar image URL. Falls back to initials icon. */
  avatarUrl?: string | null
  /** Online/offline status dot on avatar */
  status?: DirectoryCardStatus
  /** Skill/cert badge pills */
  badges?: DirectoryCardBadge[]

  // --- Metrics section ---
  /** Metric columns shown on the right (max ~4) */
  metrics?: DirectoryCardMetric[]

  // --- Behavior ---
  /** Callback when card is pressed */
  onPress?: (id: string) => void
  /** Whether card is currently selected */
  isSelected?: boolean
  /**
   * Card layout variant.
   * - 'full' = two-column with vertical divider (desktop directory)
   * - 'compact' = stacked layout, smaller avatar (mobile / map rail)
   * - 'auto' = picks full on desktop, compact on mobile (default)
   * @default 'auto'
   */
  variant?: 'full' | 'compact' | 'auto'

  // --- Extensibility ---
  /** Extra content below badges (left section) */
  footer?: ReactNode
  /** Action buttons */
  actions?: ReactNode
  /** Custom avatar icon (replaces default User icon for non-image avatars) */
  avatarIcon?: ComponentType<{ size: number; color: string }>
  /** Additional style overrides */
  style?: ViewStyle
}

// ---------------------------------------------------------------------------
// Status dot colors
// ---------------------------------------------------------------------------

const STATUS_COLORS: Record<DirectoryCardStatus, string> = {
  online: '#22c55e',
  offline: '#9ca3af',
  busy: '#ef4444',
  away: '#f59e0b',
}

// ---------------------------------------------------------------------------
// Badge color mapping
// ---------------------------------------------------------------------------

function badgeColors(
  color: DirectoryCardBadge['color'],
  theme: ResolvedThemeMode
): { bg: string; text: string } {
  const isDark = theme === 'dark'
  switch (color) {
    case 'primary':
      return {
        bg: isDark ? 'rgba(2, 45, 56, 0.3)' : 'rgba(29, 114, 130, 0.06)',
        text: isDark ? colors.primary[300] : colors.primary[700],
      }
    case 'accent':
      return {
        bg: isDark ? 'rgba(67, 56, 202, 0.2)' : 'rgba(67, 56, 202, 0.05)',
        text: isDark ? colors.violet[300] : colors.violet[700],
      }
    default:
      return {
        bg: isDark ? colors.gray[800] : colors.gray[100],
        text: isDark ? colors.gray[300] : colors.gray[600],
      }
  }
}

// ---------------------------------------------------------------------------
// DirectoryCard
// ---------------------------------------------------------------------------

export const DirectoryCard = memo(function DirectoryCard({
  id,
  name,
  role,
  location,
  avatarUrl,
  status,
  badges = [],
  metrics = [],
  onPress,
  isSelected = false,
  variant = 'auto',
  footer,
  actions,
  avatarIcon: AvatarIcon = User,
  style,
}: DirectoryCardProps) {
  const { theme } = useThemeContext()
  const { isMobile } = useResponsive()
  const t = theme === 'dark' ? 'dark' : 'light'
  const pal = workerPalette[t]
  const mStyles = metricColumnStyle(t)

  // Resolve layout: 'auto' checks viewport, otherwise use explicit variant
  const isCompact = variant === 'compact' || (variant === 'auto' && isMobile)
  const hasMetrics = metrics.length > 0

  const avatarSize = isCompact ? 64 : 80
  const avatarRadius = isCompact ? 12 : 14

  return (
    <Card
      pressable={!!onPress}
      onPress={onPress ? () => onPress(id) : undefined}
      variant="glass"
      glassMaterial="thin"
      padding={isCompact ? 'md' : 'lg'}
      radius="2xl"
      style={[
        isSelected && { borderColor: pal.selectedBorder, borderWidth: 2 },
        style,
      ]}
    >
      {isCompact ? (
        <CompactLayout
          name={name}
          role={role}
          location={location}
          avatarUrl={avatarUrl}
          avatarIcon={AvatarIcon}
          avatarSize={avatarSize}
          avatarRadius={avatarRadius}
          status={status}
          badges={badges}
          metrics={metrics}
          mStyles={mStyles}
          pal={pal}
          theme={t}
          footer={footer}
          actions={actions}
        />
      ) : (
        <FullLayout
          name={name}
          role={role}
          location={location}
          avatarUrl={avatarUrl}
          avatarIcon={AvatarIcon}
          avatarSize={avatarSize}
          avatarRadius={avatarRadius}
          status={status}
          badges={badges}
          metrics={metrics}
          hasMetrics={hasMetrics}
          mStyles={mStyles}
          pal={pal}
          theme={t}
          footer={footer}
          actions={actions}
        />
      )}
    </Card>
  )
})

// ---------------------------------------------------------------------------
// Full layout — two-column with vertical divider (desktop)
// ---------------------------------------------------------------------------

function FullLayout({
  name,
  role,
  location,
  avatarUrl,
  avatarIcon: AvatarIcon,
  avatarSize,
  avatarRadius,
  status,
  badges,
  metrics,
  hasMetrics,
  mStyles,
  pal,
  theme,
  footer,
  actions,
}: {
  name: string
  role?: string
  location?: string
  avatarUrl?: string | null
  avatarIcon: ComponentType<{ size: number; color: string }>
  avatarSize: number
  avatarRadius: number
  status?: DirectoryCardStatus
  badges: DirectoryCardBadge[]
  metrics: DirectoryCardMetric[]
  hasMetrics: boolean
  mStyles: ReturnType<typeof metricColumnStyle>
  pal: (typeof workerPalette)['light'] | (typeof workerPalette)['dark']
  theme: ResolvedThemeMode
  footer?: ReactNode
  actions?: ReactNode
}) {
  return (
    <Row align="center" gap={0}>
      {/* Left column — Identity & Badges */}
      <Stack flex={7} gap={16}>
        <Row gap={16} align="center">
          {/* Avatar */}
          <Avatar
            url={avatarUrl}
            icon={AvatarIcon}
            size={avatarSize}
            radius={avatarRadius}
            status={status}
            pal={pal}
            theme={theme}
          />

          {/* Name, Role, Location — each on its own line */}
          <Stack flex={1} gap={4}>
            <Text
              style={{
                fontWeight: '700',
                fontSize: 18,
                color: colors.text[theme].primary,
              }}
              numberOfLines={1}
            >
              {name}
            </Text>
            {role && (
              <Text
                style={{
                  fontSize: 14,
                  fontWeight: '500',
                  color: colors.text[theme].tertiary,
                }}
                numberOfLines={1}
              >
                {role}
              </Text>
            )}
            {location && (
              <Row gap={3} align="center">
                <MapPin size={13} color={colors.text[theme].tertiary} />
                <Text
                  style={{
                    fontSize: 13,
                    fontWeight: '500',
                    color: colors.text[theme].tertiary,
                  }}
                  numberOfLines={1}
                >
                  {location}
                </Text>
              </Row>
            )}
          </Stack>
        </Row>

        {/* Badge pills */}
        {badges.length > 0 && (
          <Row gap={6} wrap style={{ paddingLeft: avatarSize + 16 }}>
            {badges.map((badge) => {
              const bc = badgeColors(badge.color, theme)
              return (
                <View
                  key={badge.id}
                  style={{
                    paddingHorizontal: 10,
                    paddingVertical: 4,
                    borderRadius: 4,
                    backgroundColor: bc.bg,
                  }}
                >
                  <Text
                    style={{
                      fontSize: 10,
                      fontWeight: '700',
                      textTransform: 'uppercase',
                      letterSpacing: 0.5,
                      color: bc.text,
                    }}
                  >
                    {badge.label}
                  </Text>
                </View>
              )
            })}
          </Row>
        )}

        {footer}
      </Stack>

      {/* Vertical divider + Right column — Metrics */}
      {hasMetrics && (
        <>
          <View
            style={{
              width: 1,
              alignSelf: 'stretch',
              backgroundColor: colors.border[theme].ghost,
              marginHorizontal: 24,
            }}
          />
          <Stack flex={5} justify="center">
            <Row justify="space-around" align="center">
              {metrics.map((metric, idx) => (
                <Stack key={idx} align="center" gap={4}>
                  <Text style={mStyles.value}>
                    {metric.value}
                  </Text>
                  <Text style={mStyles.label}>
                    {metric.label}
                  </Text>
                </Stack>
              ))}
            </Row>
            {actions && (
              <Row justify="flex-end" style={{ marginTop: 12 }}>
                {actions}
              </Row>
            )}
          </Stack>
        </>
      )}

      {/* Actions when no metrics */}
      {!hasMetrics && actions && (
        <Row align="center" style={{ marginLeft: 'auto' }}>
          {actions}
        </Row>
      )}
    </Row>
  )
}

// ---------------------------------------------------------------------------
// Compact layout — stacked for narrow viewports / map rail
// ---------------------------------------------------------------------------

function CompactLayout({
  name,
  role,
  location,
  avatarUrl,
  avatarIcon: AvatarIcon,
  avatarSize,
  avatarRadius,
  status,
  badges,
  metrics,
  mStyles,
  pal,
  theme,
  footer,
  actions,
}: {
  name: string
  role?: string
  location?: string
  avatarUrl?: string | null
  avatarIcon: ComponentType<{ size: number; color: string }>
  avatarSize: number
  avatarRadius: number
  status?: DirectoryCardStatus
  badges: DirectoryCardBadge[]
  metrics: DirectoryCardMetric[]
  mStyles: ReturnType<typeof metricColumnStyle>
  pal: (typeof workerPalette)['light'] | (typeof workerPalette)['dark']
  theme: ResolvedThemeMode
  footer?: ReactNode
  actions?: ReactNode
}) {
  return (
    <Stack gap={0}>
      {/* Row 1 — Avatar + Name / Role / Location */}
      <Row gap={14} align="flex-start" style={{ marginBottom: badges.length > 0 ? 14 : 0 }}>
        <Avatar
          url={avatarUrl}
          icon={AvatarIcon}
          size={avatarSize}
          radius={avatarRadius}
          status={status}
          pal={pal}
          theme={theme}
        />
        <Stack flex={1} gap={3}>
          <Text
            style={{ fontWeight: '700', fontSize: 17, color: colors.text[theme].primary }}
            numberOfLines={1}
          >
            {name}
          </Text>
          {role && (
            <Text
              style={{ fontSize: 13, fontWeight: '500', color: colors.text[theme].tertiary }}
              numberOfLines={1}
            >
              {role}
            </Text>
          )}
          {location && (
            <Row gap={3} align="center" style={{ marginTop: 1 }}>
              <MapPin size={12} color={colors.text[theme].tertiary} />
              <Text
                style={{ fontSize: 12, fontWeight: '500', color: colors.text[theme].tertiary }}
                numberOfLines={1}
              >
                {location}
              </Text>
            </Row>
          )}
        </Stack>
      </Row>

      {/* Row 2 — Badge pills */}
      {badges.length > 0 && (
        <Row gap={6} wrap style={{ marginBottom: metrics.length > 0 ? 16 : 0 }}>
          {badges.slice(0, 4).map((badge) => {
            const bc = badgeColors(badge.color, theme)
            return (
              <View
                key={badge.id}
                style={{
                  paddingHorizontal: 9,
                  paddingVertical: 4,
                  borderRadius: 6,
                  backgroundColor: bc.bg,
                }}
              >
                <Text
                  style={{
                    fontSize: 10,
                    fontWeight: '600',
                    textTransform: 'uppercase',
                    letterSpacing: 0.5,
                    color: bc.text,
                  }}
                >
                  {badge.label}
                </Text>
              </View>
            )
          })}
          {badges.length > 4 && (
            <Text style={{ ...textCaption, color: colors.text[theme].tertiary, alignSelf: 'center' }}>
              +{badges.length - 4}
            </Text>
          )}
        </Row>
      )}

      {/* Row 3 — Metrics grid with top border, label above value */}
      {metrics.length > 0 && (
        <Row
          justify="space-around"
          align="center"
          style={{
            paddingTop: 14,
            borderTopWidth: 1,
            borderTopColor: colors.border[theme].ghost,
          }}
        >
          {metrics.map((metric, idx) => (
            <Stack key={idx} align="center" gap={2}>
              <Text style={mStyles.label}>{metric.label}</Text>
              <Text style={{ ...mStyles.value, fontSize: 18 }}>{metric.value}</Text>
            </Stack>
          ))}
        </Row>
      )}

      {footer}
      {actions && <Row justify="flex-end" style={{ marginTop: 10 }}>{actions}</Row>}
    </Stack>
  )
}

// ---------------------------------------------------------------------------
// Avatar sub-component
// ---------------------------------------------------------------------------

function Avatar({
  url,
  icon: Icon,
  size,
  radius,
  status,
  pal,
  theme,
}: {
  url?: string | null
  icon: ComponentType<{ size: number; color: string }>
  size: number
  radius: number
  status?: DirectoryCardStatus
  pal: (typeof workerPalette)['light'] | (typeof workerPalette)['dark']
  theme: ResolvedThemeMode
}) {
  return (
    <View style={{ width: size, height: size, flexShrink: 0 }}>
      {url ? (
        <View
          style={{
            width: size,
            height: size,
            borderRadius: radius,
            overflow: 'hidden',
            backgroundColor: colors.gray[theme === 'dark' ? 700 : 100],
          }}
        >
          <Image
            source={{ uri: url }}
            style={{ width: '100%', height: '100%' }}
            resizeMode="cover"
          />
        </View>
      ) : (
        <View style={iconCircleStyle(size, pal.iconBg, radius)}>
          <Icon size={size * 0.4} color={pal.iconFg} />
        </View>
      )}

      {/* Status dot */}
      {status && (
        <View
          style={{
            position: 'absolute',
            bottom: -2,
            right: -2,
            width: size > 60 ? 18 : 12,
            height: size > 60 ? 18 : 12,
            borderRadius: 9999,
            backgroundColor: STATUS_COLORS[status],
            borderWidth: 2,
            borderColor: theme === 'dark' ? colors.bg.dark.default : '#ffffff',
          }}
        />
      )}
    </View>
  )
}
