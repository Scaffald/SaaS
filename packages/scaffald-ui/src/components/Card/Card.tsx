/**
 * Card component
 * A container for grouping related content with visual separation
 */

import type React from 'react'
import { useCallback, useState } from 'react'
import { View, Pressable, Image } from 'react-native'
import { H4, Text } from '../Typography'
import { Row } from '../Layout'
import type {
  CardProps,
  CardHeaderProps,
  CardContentProps,
  CardFooterProps,
  CardMediaProps,
} from './Card.types'
import {
  getCardStyles,
  getCardHeaderStyles,
  getCardContentStyles,
  getCardFooterStyles,
  getCardMediaStyles,
} from './Card.styles'

// ============================================================================
// Card Component
// ============================================================================

/**
 * Card - A container for grouping related content with visual separation.
 * Canonical component for elevated surfaces (forms, auth screens). Use
 * variant="surface" or variant="elevated" with radius="lg", elevation="md",
 * padding="lg" for form containers.
 *
 * @example
 * // Form container (elevated surface)
 * <Card variant="elevated" radius="lg" elevation="md" padding="lg">
 *   <Form>...</Form>
 * </Card>
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
  variant: variantProp = 'elevated',
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
  bordered,
  elevate,
  backgroundColor,
  borderColor,
  borderWidth,
}: CardProps): React.ReactElement {
  const [isPressed, setIsPressed] = useState(false)

  // Map deprecated props to variant
  const variant =
    elevate === true ? 'elevated' : bordered === true ? 'outlined' : variantProp

  const handlePressIn = useCallback(() => {
    setIsPressed(true)
    onPressIn?.()
  }, [onPressIn])

  const handlePressOut = useCallback(() => {
    setIsPressed(false)
    onPressOut?.()
  }, [onPressOut])

  // Get styles from factory function
  const styles = getCardStyles(variant, padding, radius, elevation, isPressed, disabled)
  const deprecatedStyle = [
    backgroundColor !== undefined && { backgroundColor },
    borderColor !== undefined && { borderColor },
    borderWidth !== undefined && { borderWidth },
  ].filter(Boolean)
  const combinedStyle = [
    styles.container,
    styles.pressed,
    styles.disabled,
    ...deprecatedStyle,
    style,
  ]

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
  const styles = getCardHeaderStyles()

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
  const styles = getCardContentStyles(padding)
  return <View style={[styles.content, style]}>{children}</View>
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
  const styles = getCardFooterStyles(align)
  return (
    <View style={[styles.footer, style]}>
      <View style={styles.footerInner}>{children}</View>
    </View>
  )
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
  const styles = getCardMediaStyles(height)
  return (
    <Image
      source={source}
      style={[styles.media, style]}
      accessibilityLabel={alt}
      resizeMode="cover"
    />
  )
}
