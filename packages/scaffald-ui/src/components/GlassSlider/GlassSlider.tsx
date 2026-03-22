/**
 * GlassSlider — Liquid Glass slider control
 *
 * A slider with a glass material track, matching the iOS 26 Control Center
 * brightness and volume controls. Supports vertical and horizontal orientation.
 *
 * @example
 * ```tsx
 * <GlassSlider
 *   value={brightness}
 *   onValueChange={setBrightness}
 *   vertical
 *   icon={<Sun size={24} color="white" />}
 *   accessibilityLabel="Brightness"
 * />
 * ```
 */

import type React from 'react'
import { useCallback, useRef } from 'react'
import { View, Platform, type GestureResponderEvent } from 'react-native'
import { GlassSurface } from '../GlassSurface'
import type { GlassSliderProps } from './GlassSlider.types'

export function GlassSlider({
  value,
  onValueChange,
  min = 0,
  max = 1,
  vertical = true,
  icon,
  material = 'thin',
  trackSize = 68,
  trackLength = 151,
  disabled = false,
  accessibilityLabel,
  style,
  testID,
}: GlassSliderProps): React.ReactElement {
  const trackRef = useRef<View>(null)

  // Normalize value to 0-1 range
  const normalizedValue = Math.max(0, Math.min(1, (value - min) / (max - min)))

  const handleTouch = useCallback(
    (event: GestureResponderEvent) => {
      if (disabled) return

      const { locationX, locationY } = event.nativeEvent
      let newNormalized: number

      if (vertical) {
        // Vertical: bottom = 0, top = 1
        newNormalized = 1 - locationY / trackLength
      } else {
        newNormalized = locationX / trackLength
      }

      newNormalized = Math.max(0, Math.min(1, newNormalized))
      const newValue = min + newNormalized * (max - min)
      onValueChange(newValue)
    },
    [disabled, vertical, trackLength, min, max, onValueChange],
  )

  // Fill dimensions
  const fillSize = normalizedValue * trackLength
  const fillStyle = vertical
    ? {
        position: 'absolute' as const,
        bottom: 0,
        left: 0,
        width: trackSize,
        height: fillSize,
        borderBottomLeftRadius: 24,
        borderBottomRightRadius: 24,
        backgroundColor: 'rgba(255, 255, 255, 0.27)',
      }
    : {
        position: 'absolute' as const,
        bottom: 0,
        left: 0,
        height: trackSize,
        width: fillSize,
        borderBottomLeftRadius: 24,
        borderTopLeftRadius: 24,
        backgroundColor: 'rgba(255, 255, 255, 0.27)',
      }

  // Add web mix-blend-mode
  if (Platform.OS === 'web') {
    (fillStyle as Record<string, unknown>).mixBlendMode = 'plus-lighter'
  }

  const outerStyle = vertical
    ? { width: trackSize, height: trackLength }
    : { width: trackLength, height: trackSize }

  const iconContainerStyle = vertical
    ? {
        position: 'absolute' as const,
        bottom: 12,
        left: 0,
        right: 0,
        alignItems: 'center' as const,
        justifyContent: 'center' as const,
        zIndex: 2,
      }
    : {
        position: 'absolute' as const,
        left: 12,
        top: 0,
        bottom: 0,
        alignItems: 'center' as const,
        justifyContent: 'center' as const,
        zIndex: 2,
      }

  return (
    <View style={[outerStyle, style]} testID={testID}>
      <GlassSurface
        material={material}
        variant="control-center"
        radius="xl"
        insetShadow
        style={{ width: '100%', height: '100%' } as import('react-native').ViewStyle}
      >
        {/* Touch target */}
        <View
          ref={trackRef}
          style={{
            position: 'absolute',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            zIndex: 3,
          }}
          onStartShouldSetResponder={() => !disabled}
          onMoveShouldSetResponder={() => !disabled}
          onResponderGrant={handleTouch}
          onResponderMove={handleTouch}
          accessibilityRole="adjustable"
          accessibilityLabel={accessibilityLabel}
          accessibilityValue={{
            min,
            max,
            now: value,
          }}
        />

        {/* Fill indicator */}
        <View style={fillStyle} pointerEvents="none" />

        {/* Icon */}
        {icon && <View style={iconContainerStyle} pointerEvents="none">{icon}</View>}
      </GlassSurface>
    </View>
  )
}
