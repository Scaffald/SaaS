/**
 * GlassSurface component styles
 * Style factory for the glass surface primitive
 */

import type { ViewStyle } from 'react-native'
import { Platform } from 'react-native'
import { spacing } from '../../tokens/spacing'
import { borderRadius } from '../../tokens/borders'
import { boxShadows, shadows } from '../../tokens/shadows'
import { colors } from '../../tokens/colors'
import type { GlassMaterial } from '../../tokens/glass'
import type { CardPadding, CardRadius } from '../Card/Card.types'
import type { GlassSurfaceVariant } from './GlassSurface.types'
import type { ResolvedThemeMode } from '../../tokens/colors'
import {
  getGlassMaterialStyles,
  getGlassControlCenterStyles,
} from '../../utils/glassStyles'

// ============================================================================
// Constants
// ============================================================================

const PADDING_MAP: Record<CardPadding, number> = {
  none: 0,
  sm: spacing[8],
  md: spacing[12],
  lg: spacing[16],
  xl: spacing[24],
  '2xl': spacing[32],
}

const RADIUS_MAP: Record<CardRadius, number> = {
  sm: borderRadius.l,       // 8
  md: borderRadius.xxl,     // 12
  lg: borderRadius.xxxl,    // 16
  xl: 20,
  '2xl': borderRadius.xxxxl, // 24
  '3xl': 32,
}

// ============================================================================
// Types
// ============================================================================

export interface GlassSurfaceStyleConfig {
  /** Outer container (borderRadius, overflow, position) */
  outer: ViewStyle
  /** Content wrapper (padding, position: relative) */
  content: ViewStyle
  /** Web-only: tint layer style */
  tintLayer?: ViewStyle
  /** Web-only: blur layer style */
  blurLayer?: ViewStyle
  /** Web-only: blend layers (control-center variant, 3 layers) */
  blendLayers?: ViewStyle[]
  /** Web-only: inner glow layer */
  innerGlow?: ViewStyle
  /** Web-only: inset shadow string */
  insetShadow?: string
  /** Whether web layers need to be rendered */
  needsWebLayers: boolean
}

// ============================================================================
// Style Factory
// ============================================================================

export function getGlassSurfaceStyles(
  material: GlassMaterial,
  variant: GlassSurfaceVariant,
  padding: CardPadding,
  radius: CardRadius,
  elevated: boolean,
  specularBorder: boolean,
  insetShadow: boolean,
  theme: ResolvedThemeMode,
): GlassSurfaceStyleConfig {
  const radiusValue = RADIUS_MAP[radius]
  const paddingValue = PADDING_MAP[padding]

  // Content wrapper always gets padding and sits above layers
  const content: ViewStyle = {
    padding: paddingValue,
    zIndex: 1,
  }
  if (Platform.OS === 'web') {
    (content as Record<string, unknown>).position = 'relative'
  }

  // Native path — simple single container
  if (Platform.OS !== 'web') {
    const nativeBg = variant === 'control-center'
      ? (theme === 'dark' ? 'rgba(0, 0, 0, 0.55)' : 'rgba(40, 40, 40, 0.6)')
      : getGlassMaterialStyles(material, theme).nativeContainer.backgroundColor

    const outer: ViewStyle = {
      borderRadius: radiusValue,
      overflow: 'hidden',
      backgroundColor: nativeBg as string,
      ...(elevated
        ? (shadows.glassElevated as Record<string, unknown> as ViewStyle)
        : (shadows.glass as Record<string, unknown> as ViewStyle)),
    }

    if (specularBorder) {
      outer.borderWidth = 1
      outer.borderColor = colors.border[theme].ghost
    }

    return { outer, content, needsWebLayers: false }
  }

  // Web path — multi-layer rendering
  const outer: ViewStyle = {
    borderRadius: radiusValue,
    overflow: 'hidden',
  }
  if (Platform.OS === 'web') {
    (outer as Record<string, unknown>).position = 'relative'
  }

  if (elevated) {
    (outer as Record<string, unknown>).boxShadow = boxShadows.glassElevated
  }

  if (specularBorder) {
    outer.borderWidth = 1
    outer.borderColor = colors.border[theme].glassSpecular
  }

  // Standard material variant
  if (variant === 'standard') {
    const materialStyles = getGlassMaterialStyles(material, theme)

    const result: GlassSurfaceStyleConfig = {
      outer,
      content,
      tintLayer: materialStyles.tintLayer,
      blurLayer: materialStyles.blurLayer,
      needsWebLayers: materialStyles.needsLayers,
    }

    if (insetShadow) {
      result.insetShadow = boxShadows.glassInset
    }

    return result
  }

  // Control Center variant
  const ccStyles = getGlassControlCenterStyles(theme)

  const result: GlassSurfaceStyleConfig = {
    outer,
    content,
    blendLayers: ccStyles.blendLayers,
    innerGlow: ccStyles.innerGlow,
    needsWebLayers: true,
  }

  if (insetShadow) {
    result.insetShadow = ccStyles.insetShadow
  }

  if (specularBorder) {
    outer.borderColor = ccStyles.specularBorder.borderColor
  }

  return result
}
