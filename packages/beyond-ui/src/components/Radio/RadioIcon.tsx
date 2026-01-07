/**
 * RadioIcon - Filled circle icon for checked state
 */

import { View, StyleSheet } from 'react-native'

interface RadioIconProps {
  size?: number
  color?: string
}

export function RadioIcon({ size = 10, color = '#FFFFFF' }: RadioIconProps) {
  return (
    <View
      style={[
        styles.circle,
        {
          width: size,
          height: size,
          backgroundColor: color,
        },
      ]}
    />
  )
}

const styles = StyleSheet.create({
  circle: {
    borderRadius: 9999, // Fully circular
  },
})
