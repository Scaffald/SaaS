// src/pages/gc/settings/AppearanceSettings.tsx
import { useState, useEffect } from 'react'
import {
  Stack,
  Grid,
  AppearanceThemeCard,
  SettingsSectionHeader,
  useThemeContext,
} from '@unicornlove/beyond-ui'
import { Palette } from 'lucide-react-native'

function GCAppearanceSettings() {
  const { theme, setTheme } = useThemeContext()
  const [selectedTheme, setSelectedTheme] = useState<'light' | 'dark' | 'system'>('light')

  // Initialize selected theme from current theme
  useEffect(() => {
    // Check if theme is set to system preference
    const storedTheme = localStorage.getItem('theme')
    if (!storedTheme) {
      setSelectedTheme('system')
    } else {
      setSelectedTheme(storedTheme as 'light' | 'dark')
    }
  }, [])

  const handleThemeChange = (variant: 'light' | 'dark' | 'system') => {
    setSelectedTheme(variant)
    if (variant === 'system') {
      // Detect system preference
      const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches
      const systemTheme = prefersDark ? 'dark' : 'light'
      setTheme(systemTheme)
      localStorage.removeItem('theme') // Remove stored theme to use system
    } else {
      setTheme(variant)
      localStorage.setItem('theme', variant)
    }
  }

  return (
    <Stack style={{ gap: 'var(--space-6)' }}>
      <SettingsSectionHeader
        icon={Palette}
        title="Appearance"
        description="Choose your preferred theme"
      />
      <Grid columns={{ base: 1, sm: 3 }} gap="var(--space-4)">
        <AppearanceThemeCard
          variant="light"
          selected={selectedTheme === 'light'}
          onPress={() => handleThemeChange('light')}
        />
        <AppearanceThemeCard
          variant="dark"
          selected={selectedTheme === 'dark'}
          onPress={() => handleThemeChange('dark')}
        />
        <AppearanceThemeCard
          variant="system"
          selected={selectedTheme === 'system'}
          onPress={() => handleThemeChange('system')}
        />
      </Grid>
    </Stack>
  )
}

export default GCAppearanceSettings
