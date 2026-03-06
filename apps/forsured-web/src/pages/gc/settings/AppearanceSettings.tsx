// src/pages/gc/settings/AppearanceSettings.tsx
import {
  Stack,
  Grid,
  AppearanceThemeCard,
  SettingsSectionHeader,
} from '@scaffald/ui'
import { Palette } from 'lucide-react-native'
import { useTheme } from '../../../contexts/ThemeContext'

function GCAppearanceSettings() {
  const { theme, setTheme } = useTheme()
  // Forsured theme is light | dark | earth; earth is shown as light for selection
  const selectedForCard = theme === 'earth' ? 'light' : theme

  const handleThemeChange = (variant: 'light' | 'dark') => {
    setTheme(variant)
  }

  return (
    <Stack style={{ gap: 'var(--space-6)' }}>
      <SettingsSectionHeader
        icon={Palette}
        title="Appearance"
        description="Choose your preferred theme"
      />
      <Grid columns={{ base: 1, sm: 2 }} gap="var(--space-4)">
        <AppearanceThemeCard
          variant="light"
          selected={selectedForCard === 'light'}
          onPress={() => handleThemeChange('light')}
        />
        <AppearanceThemeCard
          variant="dark"
          selected={selectedForCard === 'dark'}
          onPress={() => handleThemeChange('dark')}
        />
      </Grid>
    </Stack>
  )
}

export default GCAppearanceSettings
