/**
 * Avatar component
 * Displays user avatars with various types, sizes, and indicators
 */

import { useState, useMemo, useCallback } from 'react'
import { View, Text, Image, Pressable, StyleSheet, Platform } from 'react-native'
import type { AvatarProps } from './Avatar.types'
import { colors } from '../../tokens/colors'
import { fontFamily, fontWeight } from '../../tokens/typography'
import { useThemeContext } from '../../theme'

// Avatar size to dimensions mapping
const SIZE_DIMENSIONS = {
  16: { size: 16, fontSize: 6, ringWidth: 1.5, statusSize: 4, badgeSize: 6 },
  20: { size: 20, fontSize: 7, ringWidth: 2, statusSize: 5, badgeSize: 8 },
  24: { size: 24, fontSize: 9, ringWidth: 2, statusSize: 6, badgeSize: 10 },
  32: { size: 32, fontSize: 12, ringWidth: 2, statusSize: 8, badgeSize: 12 },
  36: { size: 36, fontSize: 14, ringWidth: 2, statusSize: 9, badgeSize: 14 },
  40: { size: 40, fontSize: 16, ringWidth: 2, statusSize: 10, badgeSize: 16 },
  48: { size: 48, fontSize: 18, ringWidth: 2.5, statusSize: 12, badgeSize: 18 },
  56: { size: 56, fontSize: 22, ringWidth: 3, statusSize: 14, badgeSize: 20 },
  64: { size: 64, fontSize: 24, ringWidth: 3, statusSize: 16, badgeSize: 24 },
  72: { size: 72, fontSize: 28, ringWidth: 3, statusSize: 18, badgeSize: 26 },
  80: { size: 80, fontSize: 32, ringWidth: 4, statusSize: 20, badgeSize: 28 },
}

// Status colors
const STATUS_COLORS = {
  online: colors.green[500],
  offline: colors.gray[400],
  busy: colors.error[500],
  away: colors.warning[500],
}

export function Avatar({
  size = 40,
  color = 'gray',
  src,
  initials,
  icon,
  alt,
  showRing = false,
  status,
  badge,
  verified = false,
  star = false,
  containerStyle,
  avatarStyle,
  onPress,
  onError,
}: AvatarProps) {
  const { theme } = useThemeContext()
  const [imageError, setImageError] = useState(false)

  // Enhanced image error handler
  const handleImageError = useCallback(() => {
    setImageError(true)
    if (__DEV__) {
      console.warn('[Avatar] Image load failed:', src)
    }
    if (onError) {
      onError(new Error('Failed to load avatar image'))
    }
  }, [src, onError])

  const dimensions = SIZE_DIMENSIONS[size]
  const isClickable = !!onPress

  // Accessibility label
  const getAccessibilityLabel = () => {
    let label = alt || 'Avatar'
    if (status) {
      label += `, status: ${status}`
    }
    if (verified) {
      label += ', verified'
    }
    if (star) {
      label += ', starred'
    }
    return label
  }

  // Accessibility hint for status
  const getAccessibilityHint = () => {
    if (status) {
      return `User status: ${status}`
    }
    return undefined
  }

  // Determine avatar type
  const hasImage = src && !imageError
  const hasInitials = initials && initials.length > 0
  const hasIcon = !!icon

  // Get background color based on color prop
  const backgroundColor = useMemo(() => {
    switch (color) {
      case 'primary':
        return colors.primary[100]
      case 'info':
        return colors.blue[100]
      case 'success':
        return colors.green[100]
      case 'warning':
        return colors.warning[100]
      case 'error':
        return colors.error[100]
      default:
        return colors.gray[100]
    }
  }, [color])

  // Get text color based on color prop
  const textColor = useMemo(() => {
    switch (color) {
      case 'primary':
        return colors.primary[700]
      case 'info':
        return colors.blue[700]
      case 'success':
        return colors.green[700]
      case 'warning':
        return colors.warning[700]
      case 'error':
        return colors.error[700]
      default:
        return colors.gray[700]
    }
  }, [color])

  // Get ring color
  const ringColor = useMemo(() => {
    switch (color) {
      case 'primary':
        return colors.primary[600]
      case 'info':
        return colors.blue[600]
      case 'success':
        return colors.green[600]
      case 'warning':
        return colors.warning[600]
      case 'error':
        return colors.error[600]
      default:
        return colors.gray[300]
    }
  }, [color])

  const avatarContent = (
    <View
      style={[
        styles.container,
        {
          width: dimensions.size,
          height: dimensions.size,
          borderRadius: dimensions.size / 2,
        },
        containerStyle,
      ]}
      accessible={true}
      accessibilityLabel={getAccessibilityLabel()}
      accessibilityHint={getAccessibilityHint()}
      accessibilityRole="image"
      {...(status && { accessibilityLiveRegion: 'polite' as const })}
    >
      {/* Ring border */}
      {showRing && (
        <View
          style={[
            styles.ring,
            {
              width: dimensions.size,
              height: dimensions.size,
              borderRadius: dimensions.size / 2,
              borderWidth: dimensions.ringWidth,
              borderColor: ringColor,
            },
          ]}
        />
      )}

      {/* Avatar content */}
      <View
        style={[
          styles.avatar,
          {
            width: dimensions.size - (showRing ? dimensions.ringWidth * 2 : 0),
            height: dimensions.size - (showRing ? dimensions.ringWidth * 2 : 0),
            borderRadius: (dimensions.size - (showRing ? dimensions.ringWidth * 2 : 0)) / 2,
            backgroundColor: hasImage ? 'transparent' : backgroundColor,
          },
          avatarStyle,
        ]}
      >
        {/* Photo */}
        {hasImage && typeof src === 'string' && (
          <Image
            source={{ uri: src }}
            style={[
              styles.image,
              {
                width: dimensions.size - (showRing ? dimensions.ringWidth * 2 : 0),
                height: dimensions.size - (showRing ? dimensions.ringWidth * 2 : 0),
                borderRadius: (dimensions.size - (showRing ? dimensions.ringWidth * 2 : 0)) / 2,
              },
            ]}
            onError={handleImageError}
            accessibilityLabel={alt}
          />
        )}
        {hasImage && typeof src !== 'string' && (
          <Image
            source={src}
            style={[
              styles.image,
              {
                width: dimensions.size - (showRing ? dimensions.ringWidth * 2 : 0),
                height: dimensions.size - (showRing ? dimensions.ringWidth * 2 : 0),
                borderRadius: (dimensions.size - (showRing ? dimensions.ringWidth * 2 : 0)) / 2,
              },
            ]}
            onError={handleImageError}
            accessibilityLabel={alt}
          />
        )}

        {/* Initials */}
        {!hasImage && hasInitials && (
          <Text
            style={[
              styles.initials,
              {
                fontSize: dimensions.fontSize,
                color: textColor,
                fontFamily: fontFamily.body,
                fontWeight: fontWeight.medium,
              },
            ]}
          >
            {initials.toUpperCase().slice(0, 2)}
          </Text>
        )}

        {/* Icon/Logo */}
        {!hasImage && !hasInitials && hasIcon && <View style={styles.iconContainer}>{icon}</View>}
      </View>

      {/* Status indicator */}
      {status && (
        <View
          style={[
            styles.statusIndicator,
            {
              width: dimensions.statusSize,
              height: dimensions.statusSize,
              borderRadius: dimensions.statusSize / 2,
              backgroundColor: STATUS_COLORS[status],
              borderWidth: dimensions.statusSize > 10 ? 2 : 1.5,
              borderColor: colors.bg[theme].default,
              bottom: 0,
              right: 0,
            },
          ]}
        />
      )}

      {/* Verified badge */}
      {verified && (
        <View
          style={[
            styles.badge,
            {
              width: dimensions.badgeSize,
              height: dimensions.badgeSize,
              borderRadius: dimensions.badgeSize / 2,
              backgroundColor: colors.blue[500],
              borderWidth: dimensions.badgeSize > 12 ? 2 : 1.5,
              borderColor: colors.bg[theme].default,
              bottom: 0,
              right: 0,
            },
          ]}
        >
          <Text style={[styles.badgeText, { fontSize: dimensions.badgeSize * 0.6 }]}>✓</Text>
        </View>
      )}

      {/* Star badge */}
      {star && !verified && (
        <View
          style={[
            styles.badge,
            {
              width: dimensions.badgeSize,
              height: dimensions.badgeSize,
              borderRadius: dimensions.badgeSize / 2,
              backgroundColor: colors.warning[500],
              borderWidth: dimensions.badgeSize > 12 ? 2 : 1.5,
              borderColor: colors.bg[theme].default,
              bottom: 0,
              right: 0,
            },
          ]}
        >
          <Text style={[styles.badgeText, { fontSize: dimensions.badgeSize * 0.6 }]}>★</Text>
        </View>
      )}

      {/* Custom badge */}
      {badge && !verified && !star && (
        <View
          style={[
            styles.badge,
            {
              bottom: 0,
              right: 0,
            },
          ]}
        >
          {badge}
        </View>
      )}
    </View>
  )

  if (isClickable) {
    return (
      <Pressable
        onPress={onPress}
        style={({ pressed }) => [pressed && Platform.OS !== 'web' && { opacity: 0.8 }]}
        accessibilityRole="button"
        accessibilityLabel={getAccessibilityLabel()}
        accessibilityHint="Double tap to open profile"
      >
        {avatarContent}
      </Pressable>
    )
  }

  return avatarContent
}

const styles = StyleSheet.create({
  container: {
    position: 'relative',
    justifyContent: 'center',
    alignItems: 'center',
  },
  ring: {
    position: 'absolute',
  },
  avatar: {
    justifyContent: 'center',
    alignItems: 'center',
    overflow: 'hidden',
  },
  image: {
    resizeMode: 'cover',
  },
  initials: {
    textAlign: 'center',
  },
  iconContainer: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  statusIndicator: {
    position: 'absolute',
  },
  badge: {
    position: 'absolute',
    justifyContent: 'center',
    alignItems: 'center',
  },
  badgeText: {
    color: '#FFFFFF',
    fontWeight: '600',
  },
})
