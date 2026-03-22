/**
 * Glass Style Utilities
 *
 * Core utility that translates Liquid Glass material tokens into platform-aware
 * style objects. Web renders multi-layer glass with backdrop-filter + mix-blend-mode.
 * Native renders a single-layer fallback with elevated shadows.
 */

import { Platform, type ViewStyle } from 'react-native'
import {
  glassMaterials,
  glassControlCenter,
  glassVibrantColors,
  type GlassMaterial,
  type GlassControlCenterConfig,
} from '../tokens/glass'
import { shadows } from '../tokens/shadows'
import type { ResolvedThemeMode } from '../tokens/colors'

// ============================================================================
// Types
// ============================================================================

/** Result of computing glass material styles */
export interface GlassMaterialStyleResult {
  /** Base container style (borderRadius, overflow, position) */
  container: ViewStyle
  /** Web-only: styles for the tint layer (absolute-positioned child div) */
  tintLayer?: ViewStyle
  /** Web-only: styles for the blur layer (absolute-positioned child div) */
  blurLayer?: ViewStyle
  /** Whether this material needs nested DOM layers (web multi-layer rendering) */
  needsLayers: boolean
  /** Native-only: single container with fallback bg + shadow */
  nativeContainer: ViewStyle
}

/** Result of computing Control Center glass panel styles */
export interface GlassControlCenterStyleResult {
  /** Base container style */
  container: ViewStyle
  /** Web-only: styles for each blending layer (3 layers) */
  blendLayers: ViewStyle[]
  /** Web-only: inner glow layer style */
  innerGlow: ViewStyle
  /** Web-only: inset box-shadow string */
  insetShadow: string
  /** Specular border styles */
  specularBorder: ViewStyle
  /** Native fallback container */
  nativeContainer: ViewStyle
}

// ============================================================================
// Helpers
// ============================================================================

/** Create an absolute-fill layer style with optional web-only properties */
function makeLayer(props: {
  background: string
  blendMode?: string
  blurRadius?: number
}): ViewStyle {
  const style: Record<string, unknown> = {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: props.background,
    pointerEvents: 'none',
  }
  if (props.blendMode) {
    style.mixBlendMode = props.blendMode
  }
  if (props.blurRadius) {
    style.backdropFilter = `blur(${props.blurRadius}px)`
    style.WebkitBackdropFilter = `blur(${props.blurRadius}px)`
  }
  return style as ViewStyle
}

// ============================================================================
// Core Material Style Generator
// ============================================================================

/**
 * Compute platform-aware glass material styles.
 *
 * On web, returns multi-layer styles using backdrop-filter and mix-blend-mode.
 * On native, returns a single container with a higher-opacity fallback background.
 */
export function getGlassMaterialStyles(
  material: GlassMaterial,
  theme: ResolvedThemeMode,
): GlassMaterialStyleResult {
  const config = glassMaterials[theme][material]

  // Native fallback — simple semi-transparent bg + glass shadow
  const nativeContainer: ViewStyle = {
    backgroundColor: config.nativeFallback,
    ...(shadows.glassElevated as Record<string, unknown> as ViewStyle),
  }

  if (Platform.OS !== 'web') {
    return {
      container: nativeContainer,
      needsLayers: false,
      nativeContainer,
    }
  }

  // Web: build layer styles
  const container: ViewStyle = {
    overflow: 'hidden' as const,
  }

  // Single-layer materials (dark ultrathin/thin/regular/thick, light chrome)
  if (config.singleLayer) {
    const tintLayer = makeLayer({
      background: config.tintLayer.background,
      blendMode: config.tintLayer.blendMode,
      blurRadius: config.tintLayer.blurRadius,
    })

    return {
      container,
      tintLayer,
      needsLayers: true,
      nativeContainer,
    }
  }

  // Multi-layer materials
  const tintLayer = makeLayer({
    background: config.tintLayer.background,
    blendMode: config.tintLayer.blendMode,
  })

  const blurLayerConfig = config.blurLayer ?? config.tintLayer
  const blurLayer = makeLayer({
    background: blurLayerConfig.background,
    blendMode: blurLayerConfig.blendMode,
    blurRadius: blurLayerConfig.blurRadius,
  })

  return {
    container,
    tintLayer,
    blurLayer,
    needsLayers: true,
    nativeContainer,
  }
}

// ============================================================================
// Control Center Panel Style Generator
// ============================================================================

/**
 * Compute styles for Control Center glass panels (the 3-layer + inset shadow effect).
 */
export function getGlassControlCenterStyles(
  theme: ResolvedThemeMode,
): GlassControlCenterStyleResult {
  const config: GlassControlCenterConfig = glassControlCenter[theme]

  const container: ViewStyle = {
    overflow: 'hidden' as const,
  }

  const nativeContainer: ViewStyle = {
    backgroundColor: theme === 'dark' ? 'rgba(0, 0, 0, 0.55)' : 'rgba(40, 40, 40, 0.6)',
    ...(shadows.glassElevated as Record<string, unknown> as ViewStyle),
  }

  if (Platform.OS !== 'web') {
    return {
      container: nativeContainer,
      blendLayers: [],
      innerGlow: {} as ViewStyle,
      insetShadow: '',
      specularBorder: {},
      nativeContainer,
    }
  }

  // 3 blending layers
  const blendLayers = config.layers.map((layer) =>
    makeLayer({
      background: layer.background,
      blendMode: layer.blendMode,
    }),
  )

  // Inner glow
  const innerGlow = makeLayer({
    background: config.innerGlow.background,
    blendMode: config.innerGlow.blendMode,
    blurRadius: config.innerGlow.blurRadius,
  })

  // Specular border
  const specularBorder: ViewStyle = {
    borderWidth: 1,
    borderColor: config.specularBorder,
  }

  return {
    container,
    blendLayers,
    innerGlow,
    insetShadow: config.insetShadow,
    specularBorder,
    nativeContainer,
  }
}

// ============================================================================
// Vibrant Color Helpers
// ============================================================================

type VibrantLevel = 'primary' | 'secondary' | 'tertiary' | 'quaternary'

/**
 * Get vibrant text color for glass surfaces.
 */
export function getGlassVibrantTextColor(
  level: VibrantLevel,
  theme: ResolvedThemeMode,
): string {
  const key = `${level}Text` as const
  return glassVibrantColors[theme][key]
}

/**
 * Get vibrant fill color for glass surfaces.
 */
export function getGlassVibrantFillColor(
  level: Exclude<VibrantLevel, 'quaternary'>,
  theme: ResolvedThemeMode,
): string {
  const key = `${level}Fill` as const
  return glassVibrantColors[theme][key]
}

/**
 * Get glass separator color.
 */
export function getGlassSeparatorColor(theme: ResolvedThemeMode): string {
  return glassVibrantColors[theme].separator
}
