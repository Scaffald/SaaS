import { useThemeSetting } from '@scf/core/provider/theme/UniversalThemeProvider'
import { useCallback } from 'react'
import { AppearanceThemeCard, Row, Stack, Text } from '@scaffald/ui'

const CHOICES = ['system', 'light', 'dark'] as const
type Choice = (typeof CHOICES)[number]

/**
 * Appearance on the Settings screen — the three preview cards the ui package
 * has carried since the tokens landed, finally with a screen to sit on.
 *
 * The same preference the account menu's quick switch writes
 * (`features/drawer/AppearanceControl`): one stored value, two doors.
 */
export function AppearanceSettingsSection() {
  const { current, set } = useThemeSetting()
  const pick = useCallback((choice: Choice) => set(choice), [set])

  return (
    <Stack gap={12} testID="appearance-settings">
      <Text size="xl">Appearance</Text>
      <Text color="gray">
        Light, dark, or whatever your device is set to. Changes apply straight away and are
        remembered on this device.
      </Text>
      <Row gap={12} wrap>
        {CHOICES.map((choice) => (
          <AppearanceThemeCard
            key={choice}
            variant={choice}
            selected={current === choice}
            onPress={() => pick(choice)}
            accessibilityState={{ selected: current === choice }}
          />
        ))}
      </Row>
    </Stack>
  )
}
