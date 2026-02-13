/**
 * LoadingOverlay – full-screen overlay with centered spinner
 * Use for blocking loading states (e.g. page load, submit).
 */

import { View, StyleSheet } from 'react-native'
import { Spinner } from '../Spinner'
import type { LoadingOverlayProps } from './LoadingOverlay.types'

export function LoadingOverlay({
  dimmed = true,
  dimOpacity = 0.4,
  spinnerSize = 'md',
  spinnerColor = 'primary',
  style,
}: LoadingOverlayProps) {
  return (
    <View
      style={[
        styles.overlay,
        dimmed && { backgroundColor: `rgba(0,0,0,${dimOpacity})` },
        style,
      ]}
      pointerEvents="box-none"
    >
      <View style={styles.centered}>
        <Spinner size={spinnerSize} color={spinnerColor} />
      </View>
    </View>
  )
}

const styles = StyleSheet.create({
  overlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 1000,
  },
  centered: {
    justifyContent: 'center',
    alignItems: 'center',
  },
})
