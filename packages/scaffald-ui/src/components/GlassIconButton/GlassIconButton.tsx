/**
 * GlassIconButton — Circular Liquid Glass toggle button
 *
 * Modeled after iOS 26 Control Center icon buttons.
 * Circular shape with glass material, inset shadows, and optional active accent tint.
 *
 * @example
 * ```tsx
 * <GlassIconButton
 *   icon={<Camera size={19} color="white" />}
 *   onPress={() => toggleCamera()}
 *   accessibilityLabel="Toggle camera"
 * />
 *
 * <GlassIconButton
 *   icon={<Wifi size={16} color="white" />}
 *   onPress={() => toggleWifi()}
 *   active
 *   activeColor="rgba(0, 136, 255, 0.95)"
 *   accessibilityLabel="Toggle Wi-Fi"
 * />
 * ```
 */

import type React from 'react'
import { Pressable, View } from 'react-native'
import { GlassSurface } from '../GlassSurface'
import type { GlassIconButtonProps, GlassIconButtonSize } from './GlassIconButton.types'

const SIZE_MAP: Record<GlassIconButtonSize, number> = {
  sm: 40,
  md: 56,
  lg: 68,
}

const RADIUS_MAP: Record<GlassIconButtonSize, '2xl' | '3xl'> = {
  sm: '2xl',
  md: '3xl',
  lg: '3xl',
}

export function GlassIconButton({
  icon,
  onPress,
  active = false,
  activeColor,
  size = 'lg',
  material = 'regular',
  disabled = false,
  accessibilityLabel,
  style,
  testID,
  _skipSurface = false,
}: GlassIconButtonProps): React.ReactElement {
  const dimension = SIZE_MAP[size]

  const containerStyle = {
    width: dimension,
    height: dimension,
    borderRadius: dimension / 2,
    alignItems: 'center' as const,
    justifyContent: 'center' as const,
    overflow: 'hidden' as const,
  }

  const activeOverlayStyle = active && activeColor ? {
    position: 'absolute' as const,
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: activeColor,
    borderRadius: dimension / 2,
  } : null

  const iconContent = (
    <View style={{ alignItems: 'center', justifyContent: 'center', flex: 1 }}>
      {icon}
    </View>
  )

  const buttonContent = _skipSurface ? (
    <View style={[containerStyle, style]}>
      {activeOverlayStyle && <View style={activeOverlayStyle} />}
      {iconContent}
    </View>
  ) : (
    <GlassSurface
      material={material}
      variant="control-center"
      radius={RADIUS_MAP[size]}
      insetShadow
      specularBorder
      style={[containerStyle, style]}
    >
      {activeOverlayStyle && <View style={activeOverlayStyle} />}
      {iconContent}
    </GlassSurface>
  )

  return (
    <Pressable
      onPress={disabled ? undefined : onPress}
      disabled={disabled}
      accessibilityLabel={accessibilityLabel}
      accessibilityRole="button"
      accessibilityState={{ disabled }}
      testID={testID}
      style={({ pressed }) => pressed && !disabled ? { opacity: 0.8, transform: [{ scale: 0.95 }] } : undefined}
    >
      {buttonContent}
    </Pressable>
  )
}
