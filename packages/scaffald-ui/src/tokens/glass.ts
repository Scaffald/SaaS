/**
 * Liquid Glass Design Tokens
 *
 * Apple iOS 26 Liquid Glass material system.
 * Defines 5 material densities (ultrathin → chrome) for both light and dark modes,
 * vibrant color tokens for text/fills on glass surfaces, and Control Center panel configs.
 *
 * Web-first: Uses CSS backdrop-filter + mix-blend-mode for multi-layer glass rendering.
 * Native fallback: Higher-opacity semi-transparent backgrounds with elevated shadows.
 */

// ============================================================================
// Types
// ============================================================================

/** Material density levels from most transparent to most opaque */
export type GlassMaterial = 'ultrathin' | 'thin' | 'regular' | 'thick' | 'chrome'

/** Configuration for a single blend layer in the glass material stack */
export interface GlassLayerConfig {
  /** CSS background-color (rgba) */
  background: string
  /** CSS mix-blend-mode (e.g., 'color-dodge', 'plus-lighter') */
  blendMode?: string
  /** CSS backdrop-filter blur radius in px (only on the blur layer) */
  blurRadius?: number
}

/** Full material configuration for a single density level */
export interface GlassMaterialConfig {
  /** Tint layer — sits below the blur layer */
  tintLayer: GlassLayerConfig
  /** Blur layer — provides the backdrop-filter effect */
  blurLayer?: GlassLayerConfig
  /** Whether this material uses a single layer (e.g., chrome light) */
  singleLayer: boolean
  /** Native fallback background (higher opacity, no blend modes) */
  nativeFallback: string
}

/** Vibrant color set for text/fills on glass surfaces */
export interface GlassVibrantColors {
  primaryText: string
  secondaryText: string
  tertiaryText: string
  quaternaryText: string
  primaryFill: string
  secondaryFill: string
  tertiaryFill: string
  separator: string
}

/** Control Center panel layer config */
export interface GlassControlCenterConfig {
  /** The 3 blending layers (darken, luminosity, plus-lighter) */
  layers: GlassLayerConfig[]
  /** Inner glow overlay */
  innerGlow: GlassLayerConfig
  /** Specular border (outer) */
  specularBorder: string
  /** Specular border (inner, thinner) */
  specularBorderInner: string
  /** CSS inset box-shadow string */
  insetShadow: string
}

// ============================================================================
// Material Definitions — Light Mode
// ============================================================================

const lightMaterials: Record<GlassMaterial, GlassMaterialConfig> = {
  ultrathin: {
    tintLayer: { background: 'rgba(255, 255, 255, 0.07)' },
    blurLayer: {
      background: 'rgba(255, 255, 255, 0.03)',
      blendMode: 'color-dodge',
      blurRadius: 50,
    },
    singleLayer: false,
    nativeFallback: 'rgba(255, 255, 255, 0.15)',
  },
  thin: {
    tintLayer: { background: 'rgba(255, 255, 255, 0.05)' },
    blurLayer: {
      background: 'rgba(255, 255, 255, 0.4)',
      blendMode: 'color-dodge',
      blurRadius: 50,
    },
    singleLayer: false,
    nativeFallback: 'rgba(255, 255, 255, 0.45)',
  },
  regular: {
    tintLayer: {
      background: 'rgba(255, 255, 255, 0.25)',
      blendMode: 'plus-lighter',
    },
    blurLayer: {
      background: 'rgba(255, 255, 255, 0.6)',
      blendMode: 'color-dodge',
      blurRadius: 50,
    },
    singleLayer: false,
    nativeFallback: 'rgba(255, 255, 255, 0.7)',
  },
  thick: {
    tintLayer: {
      background: 'rgba(255, 255, 255, 0.34)',
      blendMode: 'plus-lighter',
    },
    blurLayer: {
      background: 'rgba(255, 255, 255, 0.84)',
      blendMode: 'color-dodge',
      blurRadius: 50,
    },
    singleLayer: false,
    nativeFallback: 'rgba(255, 255, 255, 0.88)',
  },
  chrome: {
    tintLayer: {
      background: 'rgba(255, 255, 255, 0.75)',
      blendMode: 'hard-light',
      blurRadius: 25,
    },
    singleLayer: true,
    nativeFallback: 'rgba(255, 255, 255, 0.85)',
  },
}

// ============================================================================
// Material Definitions — Dark Mode
// ============================================================================

const darkMaterials: Record<GlassMaterial, GlassMaterialConfig> = {
  ultrathin: {
    tintLayer: {
      background: 'rgba(0, 0, 0, 0.02)',
      blurRadius: 50,
    },
    singleLayer: true,
    nativeFallback: 'rgba(0, 0, 0, 0.15)',
  },
  thin: {
    tintLayer: {
      background: 'rgba(0, 0, 0, 0.26)',
      blurRadius: 50,
    },
    singleLayer: true,
    nativeFallback: 'rgba(0, 0, 0, 0.4)',
  },
  regular: {
    tintLayer: {
      background: 'rgba(0, 0, 0, 0.41)',
      blurRadius: 50,
    },
    singleLayer: true,
    nativeFallback: 'rgba(0, 0, 0, 0.55)',
  },
  thick: {
    tintLayer: {
      background: 'rgba(0, 0, 0, 0.6)',
      blurRadius: 50,
    },
    singleLayer: true,
    nativeFallback: 'rgba(0, 0, 0, 0.75)',
  },
  chrome: {
    tintLayer: { background: 'rgba(28, 28, 28, 0.9)' },
    blurLayer: {
      background: '#7c7c7c',
      blendMode: 'overlay',
      blurRadius: 50,
    },
    singleLayer: false,
    nativeFallback: 'rgba(28, 28, 28, 0.92)',
  },
}

// ============================================================================
// Exported Material Maps
// ============================================================================

/** All glass material configs indexed by theme */
export const glassMaterials = {
  light: lightMaterials,
  dark: darkMaterials,
} as const

// ============================================================================
// Vibrant Colors — for text and fills on glass surfaces
// ============================================================================

export const glassVibrantColors = {
  light: {
    primaryText: '#000000',
    secondaryText: '#3d3d3d',
    tertiaryText: 'rgba(80, 80, 80, 0.7)',
    quaternaryText: 'rgba(72, 72, 72, 0.6)',
    primaryFill: '#cccccc',
    secondaryFill: '#e0e0e0',
    tertiaryFill: '#ededed',
    separator: 'rgba(0, 0, 0, 0.12)',
  },
  dark: {
    primaryText: '#ffffff',
    secondaryText: 'rgba(255, 255, 255, 0.85)',
    tertiaryText: 'rgba(255, 255, 255, 0.55)',
    quaternaryText: 'rgba(255, 255, 255, 0.33)',
    primaryFill: '#333333',
    secondaryFill: '#2a2a2a',
    tertiaryFill: '#1f1f1f',
    separator: 'rgba(255, 255, 255, 0.12)',
  },
} as const satisfies Record<string, GlassVibrantColors>

// ============================================================================
// Control Center Panel Config
// ============================================================================

export const glassControlCenter = {
  light: {
    layers: [
      { background: 'rgba(153, 153, 153, 0.3)', blendMode: 'darken' },
      { background: 'rgba(51, 51, 51, 0.45)', blendMode: 'luminosity' },
      { background: 'black', blendMode: 'plus-lighter' },
    ],
    innerGlow: {
      background: 'rgba(255, 255, 255, 0.08)',
      blendMode: 'plus-lighter',
      blurRadius: 3,
    },
    specularBorder: 'rgba(255, 255, 255, 0.01)',
    specularBorderInner: 'rgba(69, 69, 69, 0.3)',
    insetShadow: [
      'inset 1px 1px 0px -0.5px #333',
      'inset -1px -1px 0px -0.5px #262626',
      'inset 1px 1px 0.5px -1px white',
      'inset -1px -1px 0.5px -1px white',
      'inset 0px 0px 3px 0px rgba(255, 255, 255, 0.5)',
      'inset 0px 0px 16px 0px #f2f2f2',
    ].join(', '),
  },
  dark: {
    layers: [
      { background: 'rgba(153, 153, 153, 0.3)', blendMode: 'darken' },
      { background: 'rgba(51, 51, 51, 0.45)', blendMode: 'luminosity' },
      { background: 'black', blendMode: 'plus-lighter' },
    ],
    innerGlow: {
      background: 'rgba(255, 255, 255, 0.08)',
      blendMode: 'plus-lighter',
      blurRadius: 3,
    },
    specularBorder: 'rgba(255, 255, 255, 0.01)',
    specularBorderInner: 'rgba(69, 69, 69, 0.3)',
    insetShadow: [
      'inset 1px 1px 0px -0.5px #333',
      'inset -1px -1px 0px -0.5px #262626',
      'inset 1px 1px 0.5px -1px white',
      'inset -1px -1px 0.5px -1px white',
      'inset 0px 0px 3px 0px rgba(255, 255, 255, 0.5)',
      'inset 0px 0px 16px 0px #f2f2f2',
    ].join(', '),
  },
} as const satisfies Record<string, GlassControlCenterConfig>

// ============================================================================
// Blur Strength Tokens
// ============================================================================

/** Blur radius presets in px */
export const glassBlur = {
  sm: 8,
  md: 20,
  lg: 50,
} as const
