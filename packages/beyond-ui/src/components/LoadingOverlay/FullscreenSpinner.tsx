/**
 * FullscreenSpinner – full-height centered spinner (no overlay)
 * Use when the whole view is loading content (e.g. initial load).
 */

import { View, StyleSheet } from 'react-native'
import { Spinner } from '../Spinner'
import type { FullscreenSpinnerProps } from './LoadingOverlay.types'

export function FullscreenSpinner({
  size = 'md',
  color = 'primary',
  style,
  visible = true,
}: FullscreenSpinnerProps) {
  return (
    <View style={[styles.container, style]}>
      <Spinner size={size} color={color} visible={visible} />
    </View>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
})
