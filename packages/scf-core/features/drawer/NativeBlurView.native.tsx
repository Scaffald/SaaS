// Defensive wrapper around expo-blur's BlurView.
//
// If the native ExpoBlur module isn't registered (e.g. the dev binary was
// built before expo-blur was added and hasn't been rebuilt), the upstream
// BlurView renders a yellow "Unimplemented component:
// ViewManagerAdapter_ExpoBlur_ExpoBlurView" warning in place of the blur.
// Detect that via requireOptionalNativeModule and swap to a plain View so
// the rest of the chrome (border, shadow, fallback bg) still renders.
import { BlurView as ExpoBlurView } from 'expo-blur'
import { requireOptionalNativeModule } from 'expo-modules-core'
import { forwardRef } from 'react'
import { View, type ViewProps } from 'react-native'

type BlurViewProps = ViewProps & {
  intensity?: number
  tint?:
    | 'light'
    | 'dark'
    | 'default'
    | 'systemChromeMaterial'
    | 'systemUltraThinMaterial'
    | 'systemThinMaterial'
    | 'systemMaterial'
    | 'systemThickMaterial'
  experimentalBlurMethod?: 'dimezisBlurView' | 'none'
}

const hasNativeModule = requireOptionalNativeModule('ExpoBlur') != null

export const BlurView = forwardRef<View, BlurViewProps>(function BlurView(props, ref) {
  if (hasNativeModule) {
    // biome-ignore lint/suspicious/noExplicitAny: expo-blur's ref typing differs from View
    return <ExpoBlurView ref={ref as any} {...props} />
  }
  const { intensity: _intensity, tint: _tint, experimentalBlurMethod: _method, ...viewProps } = props
  return <View ref={ref} {...viewProps} />
})
