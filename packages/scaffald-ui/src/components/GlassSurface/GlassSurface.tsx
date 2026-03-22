/**
 * GlassSurface — Foundational Liquid Glass primitive
 *
 * Renders multi-layer glass material on web (backdrop-filter + mix-blend-mode).
 * Falls back to semi-transparent background + shadow on native.
 *
 * All Glass* components compose this primitive.
 *
 * @example
 * ```tsx
 * <GlassSurface material="regular" radius="lg" padding="lg">
 *   <Text>Content on glass</Text>
 * </GlassSurface>
 *
 * <GlassSurface variant="control-center" radius="xl" insetShadow>
 *   <Icon name="camera" />
 * </GlassSurface>
 * ```
 */

import type React from 'react'
import { Platform, View } from 'react-native'
import type { GlassSurfaceProps } from './GlassSurface.types'
import { getGlassSurfaceStyles } from './GlassSurface.styles'
import { useStyles } from '../../hooks'
import { useThemeContext } from '../../theme'

export function GlassSurface({
  children,
  material = 'regular',
  variant = 'standard',
  radius = 'lg',
  padding = 'none',
  elevated = false,
  specularBorder = false,
  insetShadow = false,
  style,
  testID,
}: GlassSurfaceProps): React.ReactElement {
  const { theme } = useThemeContext()

  const styles = useStyles(
    getGlassSurfaceStyles,
    [material, variant, padding, radius, elevated, specularBorder, insetShadow, theme] as const,
  )

  // Native: simple single-container rendering
  if (Platform.OS !== 'web' || !styles.needsWebLayers) {
    return (
      <View style={[styles.outer, style]} testID={testID}>
        <View style={styles.content}>{children}</View>
      </View>
    )
  }

  // Web: multi-layer rendering with blend modes
  return (
    <View style={[styles.outer, style]} testID={testID}>
      {/* Blend layers (control-center variant: 3 layers) */}
      {styles.blendLayers?.map((layerStyle, i) => (
        <View
          key={`blend-${i}`}
          style={layerStyle}
          aria-hidden
          pointerEvents="none"
        />
      ))}

      {/* Tint layer (standard variant) */}
      {styles.tintLayer && (
        <View style={styles.tintLayer} aria-hidden pointerEvents="none" />
      )}

      {/* Blur layer (standard variant) */}
      {styles.blurLayer && (
        <View style={styles.blurLayer} aria-hidden pointerEvents="none" />
      )}

      {/* Inner glow (control-center variant) */}
      {styles.innerGlow && (
        <View style={styles.innerGlow} aria-hidden pointerEvents="none" />
      )}

      {/* Inset shadow overlay (web-only box-shadow) */}
      {styles.insetShadow && (
        <View
          style={{
            position: 'absolute',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            borderRadius: (styles.outer as Record<string, unknown>).borderRadius as number,
            boxShadow: styles.insetShadow,
            pointerEvents: 'none',
          } as Record<string, unknown> as import('react-native').ViewStyle}
          aria-hidden
        />
      )}

      {/* Content */}
      <View style={styles.content}>{children}</View>
    </View>
  )
}
