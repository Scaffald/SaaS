/**
 * Theme Toggle Component
 * Button to switch between light and dark themes
 */

import { Pressable, Text, StyleSheet } from 'react-native'
import { useTheme } from './useTheme'
import { colors } from '../tokens/colors'
import { spacing } from '../tokens/spacing'
import { borderRadius } from '../tokens/borders'
import { typography } from '../tokens/typography'

interface ThemeToggleProps {
  variant?: 'button' | 'icon'
}

export function ThemeToggle({ variant = 'button' }: ThemeToggleProps) {
  const { theme, toggleTheme } = useTheme()

  if (variant === 'icon') {
    return (
      <Pressable onPress={toggleTheme} style={styles.iconButton}>
        <Text style={styles.icon}>{theme === 'light' ? '🌙' : '☀️'}</Text>
      </Pressable>
    )
  }

  return (
    <Pressable
      onPress={toggleTheme}
      style={({ pressed }) => [
        styles.button,
        {
          backgroundColor: theme === 'light' ? colors.bg.light.subtle : colors.bg.dark.subtle,
          borderColor: theme === 'light' ? colors.border.light.default : colors.border.dark.default,
          opacity: pressed ? 0.8 : 1,
        },
      ]}
    >
      <Text
        style={[
          styles.text,
          {
            color: theme === 'light' ? colors.text.light.primary : colors.text.dark.primary,
          },
        ]}
      >
        {theme === 'light' ? '🌙 Dark Mode' : '☀️ Light Mode'}
      </Text>
    </Pressable>
  )
}

const styles = StyleSheet.create({
  button: {
    paddingHorizontal: spacing[16],
    paddingVertical: spacing[8],
    borderRadius: borderRadius.m,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  text: {
    fontFamily: typography.bodyMedium.fontFamily,
    fontSize: typography.bodyMedium.fontSize,
    fontWeight: typography.bodyMedium.fontWeight,
  },
  iconButton: {
    padding: spacing[8],
    alignItems: 'center',
    justifyContent: 'center',
  },
  icon: {
    fontSize: 20,
  },
})
