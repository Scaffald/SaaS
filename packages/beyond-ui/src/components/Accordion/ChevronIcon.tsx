/**
 * ChevronIcon component
 * Animated chevron for accordion expand/collapse
 */

import { View, StyleSheet } from 'react-native'
import Svg, { Path } from 'react-native-svg'

interface ChevronIconProps {
  expanded: boolean
  color: string
  size?: number
}

export function ChevronIcon({ expanded, color, size = 24 }: ChevronIconProps) {
  return (
    <View
      style={[
        styles.container,
        {
          width: size,
          height: size,
          transform: [{ rotate: expanded ? '180deg' : '0deg' }],
        },
      ]}
    >
      <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
        <Path
          d="M6 9L12 15L18 9"
          stroke={color}
          strokeWidth={1.5}
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
