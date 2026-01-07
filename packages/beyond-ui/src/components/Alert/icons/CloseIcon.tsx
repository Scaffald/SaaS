/**
 * CloseIcon component
 * X icon for dismissing alerts
 */

import { View, StyleSheet } from 'react-native'
import Svg, { Path } from 'react-native-svg'

interface CloseIconProps {
  color: string
  size?: number
}

export function CloseIcon({ color, size = 24 }: CloseIconProps) {
  return (
    <View
      style={[
        styles.container,
        {
          width: size,
          height: size,
        },
      ]}
    >
      <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
        <Path
          d="M18 6L6 18M6 6L18 18"
          stroke={color}
          strokeWidth={2}
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </Svg>
    </View>
  )
}

const styles = StyleSheet.create({
  container: {
    justifyContent: 'center',
    alignItems: 'center',
  },
})
