// React Native's platform extension resolution (.native.tsx / .web.tsx) is a
// Metro feature; tsc doesn't honour it. This shim declares the export shape so
// imports of './NativeBlurView' typecheck for both platforms.
import type { ComponentType } from 'react'
import type { ViewProps } from 'react-native'

export const BlurView: ComponentType<ViewProps & {
  intensity?: number
  tint?: 'light' | 'dark' | 'default' | 'systemChromeMaterial' | 'systemUltraThinMaterial' | 'systemThinMaterial' | 'systemMaterial' | 'systemThickMaterial'
  experimentalBlurMethod?: 'dimezisBlurView' | 'none'
}>
