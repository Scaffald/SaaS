/**
 * createVariants – CVA-style variant resolver for React Native
 *
 * Builds a style resolver from base styles and variant maps.
 * Use for component variants (e.g. Button variant, color, size).
 *
 * @example
 * ```tsx
 * const getStyles = createVariants({
 *   base: { padding: 12, borderRadius: 8 },
 *   variants: {
 *     variant: {
 *       filled: { backgroundColor: colors.primary[500] },
 *       outlined: { borderWidth: 1, borderColor: colors.border.light.default },
 *     },
 *     size: {
 *       sm: { height: 32, paddingHorizontal: 12 },
 *       md: { height: 44, paddingHorizontal: 20 },
 *       lg: { height: 48, paddingHorizontal: 24 },
 *     },
 *   },
 *   defaultVariants: { variant: 'filled', size: 'md' },
 * })
 *
 * const styles = getStyles({ variant: 'outlined', size: 'lg' })
 * ```
 */

import type { ViewStyle, TextStyle, StyleProp } from 'react-native'

type StyleObject = ViewStyle | TextStyle | Record<string, unknown>

type VariantMap<T extends string> = Partial<Record<T, StyleObject>>

type VariantConfig<TVariant extends string, TColor extends string, TSize extends string> = {
  base?: StyleObject
  variants?: {
    variant?: VariantMap<TVariant>
    color?: VariantMap<TColor>
    size?: VariantMap<TSize>
    [key: string]: VariantMap<string> | undefined
  }
  defaultVariants?: Partial<Record<string, string>>
}

type ResolvedProps<T> = T & {
  style?: StyleProp<StyleObject>
  sx?: StyleProp<StyleObject>
}

function mergeStyles(...styles: (StyleObject | null | undefined)[]): ViewStyle {
  return Object.assign({}, ...styles.filter(Boolean))
}

/**
 * Creates a variant-based style resolver for React Native components.
 * Resolves base + variant + color + size styles, then applies style/sx overrides.
 */
export function createVariants<
  TVariant extends string = string,
  TColor extends string = string,
  TSize extends string = string,
>(config: VariantConfig<TVariant, TColor, TSize>) {
  const { base = {}, variants = {}, defaultVariants = {} } = config

  return function getStyles(
    props: ResolvedProps<{
      variant?: TVariant
      color?: TColor
      size?: TSize
      [key: string]: string | undefined
    }>
  ): ViewStyle {
    const merged: ViewStyle = mergeStyles(base)

    for (const [key, map] of Object.entries(variants)) {
      if (!map || typeof map !== 'object') continue
      const propValue = (props[key] ?? defaultVariants[key]) as string | undefined
      if (propValue && propValue in map) {
        const variantStyles = map[propValue as keyof typeof map]
        if (variantStyles && typeof variantStyles === 'object') {
          Object.assign(merged, variantStyles)
        }
      }
    }

    // Merge style/sx overrides (per-component style overrides)
    const styleOverride = Array.isArray(props.style)
      ? Object.assign({}, ...props.style.filter(Boolean))
      : props.style
    const sxOverride = Array.isArray(props.sx)
      ? Object.assign({}, ...props.sx.filter(Boolean))
      : props.sx
    if (styleOverride && typeof styleOverride === 'object') Object.assign(merged, styleOverride)
    if (sxOverride && typeof sxOverride === 'object') Object.assign(merged, sxOverride)

    return merged
  }
}
