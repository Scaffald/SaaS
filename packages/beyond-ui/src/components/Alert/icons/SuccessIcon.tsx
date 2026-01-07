/**
 * SuccessIcon component
 * Circle with checkmark for success alerts
 */

import { View, StyleSheet } from 'react-native'
import Svg, { Circle, Path } from 'react-native-svg'

interface SuccessIconProps {
  color: string
  size?: number
}

export function SuccessIcon({ color, size = 24 }: SuccessIconProps) {
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
        <Circle cx="12" cy="12" r="10" fill={color} />
        <Path
          d="M9 12L11 14L15 10"
          stroke="white"
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
