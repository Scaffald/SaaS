import { useThemeSetting } from '@scf/core/provider/theme/UniversalThemeProvider'
import { useCallback } from 'react'
import { AppearanceThemeCard, Row, Stack } from '@scaffald/ui'

const CHOICES = ['system', 'light', 'dark'] as const
type Choice = (typeof CHOICES)[number]

const CARD_STYLE = { flex: 1, minWidth: 0, maxWidth: 160 } as const

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
    // Titled and explained by the Settings screen's section head (#1212).
    <Stack gap={12} testID="appearance-settings">
      {/* One row, never wrapped: each card grows to its 160 px design width and
          shrinks evenly below it, so a phone shows three narrower cards instead
          of two and an orphan (#1090). Desktop is unchanged. */}
      <Row gap={12} align="stretch">
        {CHOICES.map((choice) => (
          <AppearanceThemeCard
            key={choice}
            variant={choice}
            selected={current === choice}
            onPress={() => pick(choice)}
            accessibilityState={{ selected: current === choice }}
            style={CARD_STYLE}
          />
        ))}
      </Row>
    </Stack>
  )
}
