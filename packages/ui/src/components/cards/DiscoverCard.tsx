import { forwardRef, memo } from 'react'
import type { TamaguiElement } from 'tamagui'
import { Card, type CardProps } from 'tamagui'

import { cardShadows } from '../../config/shadows'

type DiscoverCardTone = 'neutral' | 'info' | 'warning'
type DiscoverCardElevation = 'none' | 'base' | 'elevated'

type DiscoverCardProps = Omit<CardProps, 'children'> & {
  children: CardProps['children']
  interactive?: boolean
  selected?: boolean
  isSelected?: boolean
  tone?: DiscoverCardTone
  variant?: DiscoverCardTone
  elevationLevel?: DiscoverCardElevation
}

const elevationShadow = {
  none: cardShadows.none,
  base: cardShadows.light,
  elevated: cardShadows.elevated,
} as const

const elevationHoverShadow = {
  none: cardShadows.light,
  base: cardShadows.lightHover,
  elevated: cardShadows.elevatedHover,
} as const

const elevationPressShadow = {
  none: cardShadows.lightPress,
  base: cardShadows.lightPress,
  elevated: cardShadows.lightPress,
} as const

const tonePalette: Record<
  DiscoverCardTone,
  {
    baseBg: CardProps['bg']
    hoverBg: CardProps['bg']
    pressBg: CardProps['bg']
    selectedBg: CardProps['bg']
    selectedBorderColor: CardProps['borderColor']
    hoverBorderColor: CardProps['borderColor']
    selectedShadow: string
  }
> = {
  neutral: {
    baseBg: '$background',
    hoverBg: '$color2',
    pressBg: '$backgroundPress',
    selectedBg: '$background',
    selectedBorderColor: '$borderColor',
    hoverBorderColor: '$borderColorHover',
    selectedShadow: cardShadows.light,
  },
  info: {
    baseBg: '$background',
    hoverBg: '$blue3',
    pressBg: '$blue4',
    selectedBg: '$blue9',
    selectedBorderColor: '$blue9',
    hoverBorderColor: '$blue8',
    selectedShadow: cardShadows.light,
  },
  warning: {
    baseBg: '$background',
    hoverBg: '$yellow3',
    pressBg: '$yellow4',
    selectedBg: '$yellow2',
    selectedBorderColor: '$yellow8',
    hoverBorderColor: '$yellow6',
    selectedShadow: cardShadows.light,
  },
}

/**
 * DiscoverCard
 *
 * Shared Tamagui Card wrapper for discover rail entities (profiles, jobs, employers).
 * Provides consistent padding, border, hover/press/selection behavior while still
 * allowing per-card overrides through standard Card props plus `tone`, `selected`,
 * `interactive`, and `elevationLevel` controls.
 *
 * Example:
 * ```tsx
 * <DiscoverCard selected tone="warning" onPress={...}>
 *   <Text>Job title</Text>
 * </DiscoverCard>
 * ```
 */
export const DiscoverCard = memo(
  forwardRef<TamaguiElement, DiscoverCardProps>(
    (
      {
        children,
        interactive: interactiveProp = true,
        selected,
        isSelected,
        tone,
        variant,
        elevationLevel = 'none',
        hoverStyle: hoverStyleProp,
        pressStyle: pressStyleProp,
        cursor: cursorProp,
        p,
        width,
        bg: bgProp,
        borderColor: borderColorProp,
        borderWidth: borderWidthProp,
        boxShadow: boxShadowProp,
        onPress,
        ...rest
      },
      ref
    ) => {
      const resolvedSelected = selected ?? isSelected ?? false
      const resolvedVariant = tone ?? variant ?? 'neutral'
      const palette = tonePalette[resolvedVariant] ?? tonePalette.neutral
      const resolvedElevation: DiscoverCardElevation = elevationLevel ?? 'none'
      const resolvedInteractive = interactiveProp ?? Boolean(onPress)
      const resolvedPadding = p ?? '$4'
      const resolvedBg = bgProp ?? (resolvedSelected ? palette.selectedBg : palette.baseBg)
      const resolvedBorderColor =
        borderColorProp ?? (resolvedSelected ? palette.selectedBorderColor : '$borderColor')
      const resolvedBorderWidth = borderWidthProp ?? 1
      const defaultShadow = elevationShadow[resolvedElevation] ?? cardShadows.light
      const resolvedShadow =
        boxShadowProp ?? (resolvedSelected ? palette.selectedShadow : defaultShadow)
      const hoverShadow =
        boxShadowProp ??
        (resolvedSelected
          ? palette.selectedShadow
          : (elevationHoverShadow[resolvedElevation] ?? cardShadows.light))
      const pressShadow =
        boxShadowProp ??
        (resolvedSelected
          ? palette.selectedShadow
          : (elevationPressShadow[resolvedElevation] ?? cardShadows.lightPress))

      const hoverStyle =
        resolvedInteractive && hoverStyleProp !== null
          ? {
              borderColor: resolvedSelected
                ? palette.selectedBorderColor
                : palette.hoverBorderColor,
              bg: resolvedSelected ? palette.selectedBg : palette.hoverBg,
              boxShadow: hoverShadow,
              ...(hoverStyleProp ?? {}),
            }
          : hoverStyleProp

      const pressStyle =
        resolvedInteractive && pressStyleProp !== null
          ? {
              scale: 0.98,
              bg: resolvedSelected ? palette.selectedBg : palette.pressBg,
              boxShadow: pressShadow,
              ...(pressStyleProp ?? {}),
            }
          : pressStyleProp

      return (
        <Card
          ref={ref}
          bordered
          cursor={resolvedInteractive ? (cursorProp ?? 'pointer') : cursorProp}
          p={resolvedPadding}
          bg={resolvedBg}
          borderColor={resolvedBorderColor}
          borderWidth={resolvedBorderWidth}
          boxShadow={resolvedShadow}
          hoverStyle={resolvedInteractive ? hoverStyle : hoverStyleProp}
          pressStyle={resolvedInteractive ? pressStyle : pressStyleProp}
          animation="quick"
          width={width ?? '100%'}
          onPress={onPress}
          {...rest}
        >
          {children}
        </Card>
      )
    }
  )
)

DiscoverCard.displayName = 'DiscoverCard'
