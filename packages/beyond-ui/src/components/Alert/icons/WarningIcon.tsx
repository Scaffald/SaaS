/**
 * WarningIcon component
 * Triangle with exclamation mark for warning alerts
 */

import { View, StyleSheet } from 'react-native'
import Svg, { Path } from 'react-native-svg'

interface WarningIconProps {
  color: string
  size?: number
}

export function WarningIcon({ color, size = 24 }: WarningIconProps) {
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
          d="M12 2L2 20H22L12 2Z"
          fill={color}
          stroke={color}
          strokeWidth={1}
          strokeLinecap="round"
          strokeLinejoin="round"
        />
        <Path
          d="M12 9V13M12 17H12.01"
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
