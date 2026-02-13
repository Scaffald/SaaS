/**
 * Theme Comparison Component
 * Side-by-side light and dark mode preview
 */

import type React from 'react'
import { View, StyleSheet } from 'react-native'
import { spacing } from '../tokens/spacing'
import { colors } from '../tokens/colors'
import { ThemeProvider } from './ThemeProvider'

interface ThemeComparisonProps {
  children: (theme: 'light' | 'dark') => React.ReactNode
}

export function ThemeComparison({ children }: ThemeComparisonProps) {
  return (
    <View style={styles.container}>
      <ThemeProvider initialTheme="light">
        <View
          style={[
            styles.themeColumn,
            {
              backgroundColor: colors.bg.light.default,
            },
          ]}
        >
          {children('light')}
        </View>
      </ThemeProvider>
      <ThemeProvider initialTheme="dark">
        <View
          style={[
            styles.themeColumn,
            {
              backgroundColor: colors.bg.dark.default,
            },
          ]}
        >
          {children('dark')}
        </View>
      </ThemeProvider>
    </View>
  )
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    width: '100%',
    gap: spacing[0],
  },
  themeColumn: {
    flex: 1,
    padding: spacing[80],
    minHeight: '100%',
  },
})
