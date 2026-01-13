/**
 * Skeleton components
 * Loading placeholder components for showing content structure while loading
 */

import React, { useEffect, useRef, useMemo } from 'react'
import { View, Animated, StyleSheet, type ViewStyle, type DimensionValue } from 'react-native'
import { colors } from '../../tokens/colors'
import { spacing } from '../../tokens/spacing'
import { borderRadius as radiusTokens } from '../../tokens/borders'
import type {
  SkeletonProps,
  SkeletonTextProps,
  SkeletonAvatarProps,
  SkeletonCardProps,
  SkeletonGroupProps,
  SkeletonShape,
  SkeletonAnimation,
} from './Skeleton.types'

// ============================================================================
// Constants
// ============================================================================

const DEFAULT_ANIMATION_DURATION = 1500
const BASE_COLOR = colors.gray[200]
const HIGHLIGHT_COLOR = colors.gray[100]

const SHAPE_RADIUS: Record<SkeletonShape, number> = {
  rectangle: radiusTokens.xs,
  circle: 9999,
  text: radiusTokens.xxs,
}

// ============================================================================
// Animation Hook
// ============================================================================

function usePulseAnimation(animation: SkeletonAnimation, duration: number) {
  const animValue = useRef(new Animated.Value(0)).current

  useEffect(() => {
    if (animation === 'none') {
      animValue.setValue(0)
      return
    }

    const animate = () => {
      Animated.loop(
        Animated.sequence([
          Animated.timing(animValue, {
            toValue: 1,
            duration: duration / 2,
            useNativeDriver: true,
          }),
          Animated.timing(animValue, {
            toValue: 0,
            duration: duration / 2,
            useNativeDriver: true,
          }),
        ])
      ).start()
    }

    animate()

    return () => {
      animValue.stopAnimation()
    }
  }, [animation, duration, animValue])

  return animValue
}

// ============================================================================
// Skeleton Component
// ============================================================================

/**
 * Skeleton - Base loading placeholder component
 *
 * @example
 * // Basic rectangle
 * <Skeleton width={200} height={20} />
 *
 * @example
 * // Circle (avatar placeholder)
 * <Skeleton width={48} height={48} shape="circle" />
 *
 * @example
 * // Text line
 * <Skeleton width="100%" height={16} shape="text" />
 */
export function Skeleton({
  width = '100%',
  height = 20,
  shape = 'rectangle',
  borderRadius,
  animation = 'pulse',
  animationDuration = DEFAULT_ANIMATION_DURATION,
  style,
  testID,
}: SkeletonProps): React.ReactElement {
  const animValue = usePulseAnimation(animation, animationDuration)

  const computedRadius = borderRadius ?? SHAPE_RADIUS[shape]

  const containerStyle = useMemo<ViewStyle>(
    () => ({
      width,
      height,
      borderRadius: computedRadius,
      backgroundColor: BASE_COLOR,
      overflow: 'hidden',
    }),
    [width, height, computedRadius]
  )

  const animatedStyle = {
    opacity: animation !== 'none' ? animValue.interpolate({
      inputRange: [0, 1],
      outputRange: [1, 0.5],
    }) : 1,
  }

  return (
    <Animated.View style={[containerStyle, animatedStyle, style]} testID={testID}>
      {/* Optional wave overlay could be added here for 'wave' animation */}
    </Animated.View>
  )
}

// ============================================================================
// SkeletonText Component
// ============================================================================

/**
 * SkeletonText - Multiple lines of text placeholder
 *
 * @example
 * <SkeletonText lines={3} lastLineWidth="60%" />
 */
export function SkeletonText({
  lines = 3,
  lastLineWidth = '60%',
  gap = spacing[8],
  lineHeight = 16,
  animation = 'pulse',
  animationDuration = DEFAULT_ANIMATION_DURATION,
  style,
  testID,
}: SkeletonTextProps): React.ReactElement {
  return (
    <View style={[{ gap }, style]} testID={testID}>
      {Array.from({ length: lines }).map((_, index) => {
        const isLastLine = index === lines - 1
        const width: DimensionValue = isLastLine ? lastLineWidth : '100%'

        return (
          <Skeleton
            key={index}
            width={width}
            height={lineHeight}
            shape="text"
            animation={animation}
            animationDuration={animationDuration}
          />
        )
      })}
    </View>
  )
}

// ============================================================================
// SkeletonAvatar Component
// ============================================================================

/**
 * SkeletonAvatar - Circular avatar placeholder
 *
 * @example
 * <SkeletonAvatar size={48} />
 */
export function SkeletonAvatar({
  size = 48,
  animation = 'pulse',
  animationDuration = DEFAULT_ANIMATION_DURATION,
  style,
  testID,
}: SkeletonAvatarProps): React.ReactElement {
  return (
    <Skeleton
      width={size}
      height={size}
      shape="circle"
      animation={animation}
      animationDuration={animationDuration}
      style={style}
      testID={testID}
    />
  )
}

// ============================================================================
// SkeletonCard Component
// ============================================================================

/**
 * SkeletonCard - Card-like skeleton with media, avatar, and text sections
 *
 * @example
 * <SkeletonCard hasMedia hasAvatar textLines={2} />
 */
export function SkeletonCard({
  hasMedia = false,
  mediaHeight = 180,
  hasAvatar = false,
  textLines = 3,
  animation = 'pulse',
  animationDuration = DEFAULT_ANIMATION_DURATION,
  style,
  testID,
}: SkeletonCardProps): React.ReactElement {
  return (
    <View style={[styles.card, style]} testID={testID}>
      {hasMedia && (
        <Skeleton
          width="100%"
          height={mediaHeight}
          borderRadius={0}
          animation={animation}
          animationDuration={animationDuration}
        />
      )}

      <View style={styles.cardContent}>
        {hasAvatar && (
          <View style={styles.cardHeader}>
            <SkeletonAvatar
              size={40}
              animation={animation}
              animationDuration={animationDuration}
            />
            <View style={styles.cardHeaderText}>
              <Skeleton
                width={120}
                height={14}
                shape="text"
                animation={animation}
                animationDuration={animationDuration}
              />
              <Skeleton
                width={80}
                height={12}
                shape="text"
                animation={animation}
                animationDuration={animationDuration}
              />
            </View>
          </View>
        )}

        <SkeletonText
          lines={textLines}
          lastLineWidth="70%"
          animation={animation}
          animationDuration={animationDuration}
        />
      </View>
    </View>
  )
}

// ============================================================================
// SkeletonGroup Component
// ============================================================================

/**
 * SkeletonGroup - Group of skeleton items with consistent spacing
 *
 * @example
 * <SkeletonGroup gap={16} direction="column">
 *   <Skeleton height={20} />
 *   <Skeleton height={20} />
 *   <Skeleton height={20} />
 * </SkeletonGroup>
 */
export function SkeletonGroup({
  children,
  gap = spacing[12],
  direction = 'column',
  style,
}: SkeletonGroupProps): React.ReactElement {
  const groupStyle = useMemo<ViewStyle>(
    () => ({
      flexDirection: direction,
      gap,
    }),
    [direction, gap]
  )

  return <View style={[groupStyle, style]}>{children}</View>
}

// ============================================================================
// Styles
// ============================================================================

const styles = StyleSheet.create({
  card: {
    backgroundColor: colors.bg.light.default,
    borderRadius: radiusTokens.l,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: colors.border.light.default,
  },
  cardContent: {
    padding: spacing[16],
    gap: spacing[12],
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing[12],
    marginBottom: spacing[4],
  },
  cardHeaderText: {
    flex: 1,
    gap: spacing[4],
  },
})
