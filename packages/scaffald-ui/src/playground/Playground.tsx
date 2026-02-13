/**
 * Playground Component
 * Main wrapper for playground examples matching Figma layout
 * - 80px padding around content
 * - Supports both single theme and side-by-side views
 */

import type React from 'react'
import { View, StyleSheet, ScrollView } from 'react-native'
import { spacing } from '../tokens/spacing'
import { useTheme } from './useTheme'
import { colors } from '../tokens/colors'

interface PlaygroundProps {
  children: React.ReactNode
  sideBySide?: boolean
  padding?: number
}

export function Playground({
  children,
  sideBySide = false,
  padding = spacing[80],
}: PlaygroundProps) {
  const { theme } = useTheme()

  const containerStyle = {
    ...styles.container,
    padding,
    backgroundColor: theme === 'light' ? colors.bg.light.default : colors.bg.dark.default,
  }

  if (sideBySide) {
    return (
      <ScrollView style={styles.scrollView} horizontal showsHorizontalScrollIndicator={false}>
        <View style={[containerStyle, styles.sideBySideContainer]}>{children}</View>
      </ScrollView>
    )
  }

  return (
    <ScrollView style={styles.scrollView}>
      <View style={containerStyle}>{children}</View>
    </ScrollView>
  )
}

const styles = StyleSheet.create({
  scrollView: {
    flex: 1,
  },
  container: {
    flex: 1,
    width: '100%',
  },
  sideBySideContainer: {
    flexDirection: 'row',
    gap: spacing[0],
  },
})
