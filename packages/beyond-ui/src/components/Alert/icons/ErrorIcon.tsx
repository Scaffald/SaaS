/**
 * ErrorIcon component
 * Circle with X for error alerts
 */

import { View, StyleSheet } from 'react-native'
import Svg, { Circle, Path } from 'react-native-svg'

interface ErrorIconProps {
  color: string
  size?: number
}

export function ErrorIcon({ color, size = 24 }: ErrorIconProps) {
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
          d="M15 9L9 15M9 9L15 15"
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
