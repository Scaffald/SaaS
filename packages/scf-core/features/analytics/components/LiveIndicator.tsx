import { Row, Text, useThemeContext } from '@scaffald/ui'
import { colors } from '@scaffald/ui/tokens'
import { useEffect, useRef } from 'react'
import { Animated, StyleSheet } from 'react-native'

interface LiveIndicatorProps {
  count: number
}

export function LiveIndicator({ count }: LiveIndicatorProps) {
  const { theme } = useThemeContext()
  const resolvedTheme = theme === 'dark' ? 'dark' : 'light'
  const pulseAnim = useRef(new Animated.Value(1)).current

  useEffect(() => {
    const animation = Animated.loop(
      Animated.sequence([
        Animated.timing(pulseAnim, { toValue: 0.3, duration: 1000, useNativeDriver: true }),
        Animated.timing(pulseAnim, { toValue: 1, duration: 1000, useNativeDriver: true }),
      ])
    )
    animation.start()
    return () => animation.stop()
  }, [pulseAnim])

  if (count === 0) return null

  return (
    <Row gap={6} align="center">
      <Animated.View style={[styles.dot, { opacity: pulseAnim }]} />
      <Text style={{ fontSize: 12, color: colors.text[resolvedTheme].secondary, fontWeight: '500' }}>
        {count} viewing now
      </Text>
    </Row>
  )
}

const styles = StyleSheet.create({
  dot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#22c55e',
  },
})
