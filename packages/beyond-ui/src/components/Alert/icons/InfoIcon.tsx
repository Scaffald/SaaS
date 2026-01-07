/**
 * InfoIcon component
 * Filled circle with "i" symbol for info alerts
 */

import { View, StyleSheet } from 'react-native'
import Svg, { Circle, Path } from 'react-native-svg'

interface InfoIconProps {
  color: string
  size?: number
}

export function InfoIcon({ color, size = 24 }: InfoIconProps) {
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
          d="M12 16V12M12 8H12.01"
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
