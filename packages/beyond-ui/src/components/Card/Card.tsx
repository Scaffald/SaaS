/**
 * Card component
 * A container for grouping related content with visual separation
 */

import React, { useMemo, useCallback, useState } from 'react'
import { View, Pressable, Image, StyleSheet, Platform, type ViewStyle, type ImageStyle } from 'react-native'
import { colors } from '../../tokens/colors'
import { spacing } from '../../tokens/spacing'
import { borderRadius } from '../../tokens/borders'
import { shadows, boxShadows } from '../../tokens/shadows'
import { H4, Text } from '../Typography'
import { Row } from '../Layout'
import type {
  CardProps,
  CardHeaderProps,
  CardContentProps,
  CardFooterProps,
  CardMediaProps,
  CardPadding,
  CardRadius,
  CardElevation,
} from './Card.types'

// ============================================================================
// Types
// ============================================================================

/** Shadow style properties for React Native */
interface ShadowStyle {
  shadowColor: string
  shadowOffset: { width: number; height: number }
  shadowOpacity: number
  shadowRadius: number
  elevation: number
}

// ============================================================================
// Constants
// ============================================================================

const PADDING_MAP: Record<CardPadding, number> = {
  none: 0,
  sm: spacing[8],
  md: spacing[12],
  lg: spacing[16],
  xl: spacing[24],
}

const RADIUS_MAP: Record<CardRadius, number> = {
  sm: borderRadius.s,
  md: borderRadius.m,
  lg: borderRadius.l,
  xl: borderRadius.xl,
}

const SHADOW_MAP: Record<CardElevation, ShadowStyle> = {
  sm: shadows.s as ShadowStyle,
  md: shadows.m as ShadowStyle,
  lg: shadows.l as ShadowStyle,
}

const BOX_SHADOW_MAP: Record<CardElevation, string> = {
  sm: boxShadows.s,
  md: boxShadows.m,
  lg: boxShadows.l,
}

// ============================================================================
// Card Component
// ============================================================================

/**
 * Card - A container for grouping related content
 *
 * @example
 * // Basic elevated card
 * <Card>
 *   <CardHeader title="Card Title" subtitle="Subtitle" />
 *   <CardContent>Content goes here</CardContent>
 *   <CardFooter>
 *     <Button>Action</Button>
 *   </CardFooter>
 * </Card>
 *
 * @example
 * // Outlined card
 * <Card variant="outlined">
 *   <CardContent>Simple content</CardContent>
 * </Card>
 *
 * @example
 * // Pressable card
 * <Card pressable onPress={() => console.log('pressed')}>
 *   <CardContent>Click me!</CardContent>
 * </Card>
 */
export function Card({
  children,
  variant = 'elevated',
  padding = 'none',
  radius = 'lg',
  elevation = 'sm',
  pressable = false,
  onPress,
  onPressOut,
  onPressIn,
  disabled = false,
  style,
  testID,
  accessibilityLabel,
}: CardProps): React.ReactElement {
  const [isPressed, setIsPressed] = useState(false)

  const handlePressIn = useCallback(() => {
    setIsPressed(true)
    onPressIn?.()
  }, [onPressIn])

  const handlePressOut = useCallback(() => {
    setIsPressed(false)
    onPressOut?.()
  }, [onPressOut])

  const cardStyle = useMemo<ViewStyle>(() => {
    const baseStyle: ViewStyle = {
      backgroundColor: colors.bg.light.default,
      borderRadius: RADIUS_MAP[radius],
      padding: PADDING_MAP[padding],
      overflow: 'hidden',
    }

    // Variant-specific styles
    switch (variant) {
      case 'elevated': {
        const elevatedStyle: ViewStyle = {
          ...baseStyle,
          ...SHADOW_MAP[elevation],
        }
        // Add web-specific box-shadow
        if (Platform.OS === 'web') {
          ;(elevatedStyle as Record<string, unknown>).boxShadow = BOX_SHADOW_MAP[elevation]
        }
        return elevatedStyle
      }
      case 'outlined':
        return {
          ...baseStyle,
          borderWidth: 1,
          borderColor: colors.border.light.default,
        }
      case 'filled':
        return {
          ...baseStyle,
          backgroundColor: colors.bg.light.subtle,
        }
      default:
        return baseStyle
    }
  }, [variant, radius, padding, elevation])

  const pressedStyle = useMemo<ViewStyle>(() => {
    if (!isPressed || disabled) return {}
    return {
      opacity: 0.9,
      transform: [{ scale: 0.98 }],
    }
  }, [isPressed, disabled])

  const disabledStyle = useMemo<ViewStyle>(() => {
    if (!disabled) return {}
    return {
      opacity: 0.6,
    }
  }, [disabled])

  const combinedStyle = [cardStyle, pressedStyle, disabledStyle, style]

  if (pressable && onPress) {
    return (
      <Pressable
        style={combinedStyle}
        onPress={disabled ? undefined : onPress}
        onPressIn={disabled ? undefined : handlePressIn}
        onPressOut={disabled ? undefined : handlePressOut}
        disabled={disabled}
        testID={testID}
        accessibilityLabel={accessibilityLabel}
        accessibilityRole="button"
        accessibilityState={{ disabled }}
      >
        {children}
      </Pressable>
    )
  }

  return (
    <View style={combinedStyle} testID={testID} accessibilityLabel={accessibilityLabel}>
      {children}
    </View>
  )
}

// ============================================================================
// CardHeader Component
// ============================================================================

/**
 * CardHeader - Header section of a card with title, subtitle, and optional action
 *
 * @example
 * <CardHeader title="Card Title" subtitle="Optional subtitle" action={<IconButton />} />
 *
 * @example
 * <CardHeader>
 *   <CustomHeaderContent />
 * </CardHeader>
 */
export function CardHeader({
  children,
  title,
  subtitle,
  action,
  style,
}: CardHeaderProps): React.ReactElement {
  // If custom children provided, render them
  if (children && !title) {
    return <View style={[styles.header, style]}>{children}</View>
  }

  // Otherwise render title/subtitle/action layout
  return (
    <View style={[styles.header, style]}>
      <Row justify="space-between" align="flex-start">
        <View style={styles.headerText}>
          {title && <H4>{title}</H4>}
          {subtitle && (
            <Text size="sm" color="secondary" style={styles.subtitle}>
              {subtitle}
            </Text>
          )}
        </View>
        {action && <View style={styles.headerAction}>{action}</View>}
      </Row>
    </View>
  )
}

// ============================================================================
// CardContent Component
// ============================================================================

/**
 * CardContent - Main content area of a card
 *
 * @example
 * <CardContent>
 *   <Text>Main card content goes here</Text>
 * </CardContent>
 */
export function CardContent({
  children,
  padding = 'md',
  style,
}: CardContentProps): React.ReactElement {
  const contentStyle = useMemo<ViewStyle>(
    () => ({
      padding: PADDING_MAP[padding],
    }),
    [padding]
  )

  return <View style={[contentStyle, style]}>{children}</View>
}

// ============================================================================
// CardFooter Component
// ============================================================================

/**
 * CardFooter - Footer section of a card, typically for actions
 *
 * @example
 * <CardFooter align="right">
 *   <Button variant="ghost">Cancel</Button>
 *   <Button>Save</Button>
 * </CardFooter>
 */
export function CardFooter({
  children,
  align = 'right',
  style,
}: CardFooterProps): React.ReactElement {
  const alignMap: Record<string, ViewStyle['justifyContent']> = {
    left: 'flex-start',
    center: 'center',
    right: 'flex-end',
    'space-between': 'space-between',
  }

  const footerStyle = useMemo<ViewStyle>(
    () => ({
      flexDirection: 'row',
      justifyContent: alignMap[align],
      alignItems: 'center',
      gap: spacing[8],
    }),
    [align]
  )

  return <View style={[styles.footer, footerStyle, style]}>{children}</View>
}

// ============================================================================
// CardMedia Component
// ============================================================================

/**
 * CardMedia - Media section for images/videos in a card
 *
 * @example
 * <Card>
 *   <CardMedia source={{ uri: 'https://example.com/image.jpg' }} height={200} />
 *   <CardContent>Content below image</CardContent>
 * </Card>
 */
export function CardMedia({
  source,
  alt,
  height = 200,
  style,
}: CardMediaProps): React.ReactElement {
  const mediaStyle = useMemo(
    (): ImageStyle => ({
      width: '100%' as unknown as number, // 100% works on web, cast for RN types
      height,
    }),
    [height]
  )

  return (
    <Image
      source={source}
      style={[mediaStyle, style] as ImageStyle[]}
      accessibilityLabel={alt}
      resizeMode="cover"
    />
  )
}

// ============================================================================
// Styles
// ============================================================================

const styles = StyleSheet.create({
  header: {
    padding: spacing[16],
    paddingBottom: spacing[8],
  },
  headerText: {
    flex: 1,
  },
  subtitle: {
    marginTop: spacing[4],
  },
  headerAction: {
    marginLeft: spacing[12],
  },
  footer: {
    padding: spacing[16],
    paddingTop: spacing[8],
    borderTopWidth: 1,
    borderTopColor: colors.border.light.subtle,
  },
})
