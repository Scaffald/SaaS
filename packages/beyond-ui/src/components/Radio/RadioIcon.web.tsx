/**
 * RadioIcon component (Web version)
 * Simple filled circle for web/Storybook compatibility
 */

import { View, StyleSheet } from 'react-native'

export function RadioIcon({ size = 10, color = '#FFFFFF' }: { size?: number; color?: string }) {
  return (
    <View
      style={[
        styles.circle,
        {
          width: size,
          height: size,
          backgroundColor: color,
          borderRadius: size / 2,
        },
      ]}
    />
  )
}

const styles = StyleSheet.create({
  circle: {
    // Circular dot for checked state
  },
})
