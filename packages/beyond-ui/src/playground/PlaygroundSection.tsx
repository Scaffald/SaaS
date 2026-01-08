/**
 * Playground Section Component
 * Wrapper for grouping playground examples with consistent spacing
 */

import type React from 'react'
import { View, StyleSheet } from 'react-native'
import { spacing } from '../tokens/spacing'

interface PlaygroundSectionProps {
  children: React.ReactNode
  gap?: number
}

export function PlaygroundSection({ children, gap = spacing[40] }: PlaygroundSectionProps) {
  return <View style={[styles.container, { gap }]}>{children}</View>
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'column',
    width: '100%',
  },
})
