/**
 * Shared card building blocks for discover cards (Profile, Job, Organization).
 *
 * These primitives enforce consistent spacing, font sizes, and colors
 * across every entity card so we never drift into hardcoded one-offs.
 */
import type { ComponentType } from 'react'
import { View } from 'react-native'
import { Text, Row, Stack } from '@scaffald/ui'
import { colors } from '@scaffald/ui/tokens'
import type { ResolvedThemeMode } from '@scaffald/ui/tokens'
import { iconCircleStyle, pillStyle, textSmall, textCaption, textColors } from './styles'

// ---------------------------------------------------------------------------
// IconCircle — colored circle with an icon, used as card leading avatar
// ---------------------------------------------------------------------------

type IconCircleProps = {
  icon: ComponentType<{ size: number; color: string }>
  size?: number
  iconSize?: number
  bgColor: string
  iconColor: string
  borderRadius?: number
}

export function IconCircle({
  icon: Icon,
  size = 48,
  iconSize = 22,
  bgColor,
  iconColor,
  borderRadius,
}: IconCircleProps) {
  return (
    <View style={iconCircleStyle(size, bgColor, borderRadius)}>
      <Icon size={iconSize} color={iconColor} />
    </View>
  )
}

// ---------------------------------------------------------------------------
// MetricRow — icon + text in a horizontal row (location, pay, etc.)
// ---------------------------------------------------------------------------

type MetricRowProps = {
  icon: ComponentType<{ size: number; color: string }>
  text: string
  color?: string
  theme: ResolvedThemeMode
  flex?: boolean
}

export function MetricRow({ icon: Icon, text, color, theme, flex }: MetricRowProps) {
  const c = color ?? textColors(theme).tertiary
  return (
    <Row gap={6} align="center">
      <Icon size={14} color={c} />
      <Text style={{ ...textSmall, color: c, ...(flex ? { flex: 1 } : {}) }} numberOfLines={1}>
        {text}
      </Text>
    </Row>
  )
}

// ---------------------------------------------------------------------------
// MetricDot — the "·" separator between inline metrics
// ---------------------------------------------------------------------------

export function MetricDot({ theme }: { theme: ResolvedThemeMode }) {
  return <Text style={{ ...textSmall, color: colors.gray[theme === 'dark' ? 600 : 300] }}>·</Text>
}

// ---------------------------------------------------------------------------
// Pill — small rounded tag (skills, certs, employment type, etc.)
// ---------------------------------------------------------------------------

type PillProps = {
  label: string
  bgColor: string
  textColor: string
  compact?: boolean
}

export function Pill({ label, bgColor, textColor, compact }: PillProps) {
  return (
    <View style={{ ...pillStyle, backgroundColor: bgColor }}>
      <Text style={{ ...textCaption, color: textColor, ...(compact ? { fontSize: 11 } : {}) }}>
        {label}
      </Text>
    </View>
  )
}

// ---------------------------------------------------------------------------
// OverflowCount — "+3 more" indicator at end of pill row
// ---------------------------------------------------------------------------

export function OverflowCount({ count, theme }: { count: number; theme: ResolvedThemeMode }) {
  return (
    <Text style={{ ...textCaption, color: textColors(theme).muted, alignSelf: 'center' as const }}>
      +{count}
    </Text>
  )
}

// ---------------------------------------------------------------------------
// CardHeader — icon circle + title + subtitle in a row
// ---------------------------------------------------------------------------

type CardHeaderProps = {
  icon: ComponentType<{ size: number; color: string }>
  iconBg: string
  iconColor: string
  title: string
  subtitle?: string | null
  compact?: boolean
  theme: ResolvedThemeMode
  trailing?: React.ReactNode
  /** Use circular avatar (true for profiles, false for entity icons) */
  circular?: boolean
}

export function CardHeader({
  icon,
  iconBg,
  iconColor,
  title,
  subtitle,
  compact = false,
  theme,
  trailing,
  circular = false,
}: CardHeaderProps) {
  const size = compact ? 44 : 48
  const iconSize = compact ? 20 : 22
  return (
    <Row gap={12} align="center">
      <IconCircle
        icon={icon}
        size={size}
        iconSize={iconSize}
        bgColor={iconBg}
        iconColor={iconColor}
        borderRadius={circular ? size / 2 : 12}
      />
      <Stack flex={1} gap={2}>
        <Text style={{ fontWeight: '600', fontSize: compact ? 14 : 15 }} numberOfLines={1}>
          {title}
        </Text>
        {subtitle ? (
          <Text
            style={{ ...textSmall, color: colors.text[theme].tertiary }}
            numberOfLines={compact ? 1 : 2}
          >
            {subtitle}
          </Text>
        ) : null}
      </Stack>
      {trailing}
    </Row>
  )
}
