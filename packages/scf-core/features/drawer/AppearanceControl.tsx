import { isDarkModeEnabled } from '@scf/core/provider/theme/dark-mode-flag'
import { useThemeSetting } from '@scf/core/provider/theme/UniversalThemeProvider'
import { useCallback, useMemo } from 'react'
import { View } from 'react-native'
import { SegmentedControl, Text, useThemeContext } from '@scaffald/ui'
import { colors, fontSize, lineHeight } from '@scaffald/ui/tokens'

const CHOICES = [
  { key: 'system', label: 'System' },
  { key: 'light', label: 'Light' },
  { key: 'dark', label: 'Dark' },
] as const

const SEGMENTS = CHOICES.map((choice) => choice.label)

/**
 * Appearance — System / Light / Dark.
 *
 * Lives in the account menu on desktop and the account sheet on a phone, next
 * to "Using Scaffald as": both are statements about how you are using the app
 * rather than navigation. Writes through `useThemeSetting`, which persists the
 * choice and bridges it to the ui ThemeProvider.
 *
 * Renders nothing while dark mode is behind its build flag (#833): a control
 * that offered Dark and then rendered light would be a lie. When #840 lifts
 * the gate this appears everywhere on its own.
 */
export function AppearanceControl() {
  const { theme } = useThemeContext()
  const { current, set } = useThemeSetting()

  const selectedIndex = useMemo(() => {
    const index = CHOICES.findIndex((choice) => choice.key === current)
    return index < 0 ? 0 : index
  }, [current])

  const pick = useCallback((index: number) => set(CHOICES[index]?.key ?? 'system'), [set])

  if (!isDarkModeEnabled()) return null

  return (
    <View style={{ gap: 8 }} testID="appearance-control">
      <Text
        style={{
          fontSize: fontSize.h6,
          lineHeight: lineHeight.h6,
          fontWeight: '500',
          letterSpacing: 1.4,
          textTransform: 'uppercase',
          color: colors.text[theme].tertiary,
        }}
      >
        Appearance
      </Text>
      <SegmentedControl
        segments={SEGMENTS}
        selectedIndex={selectedIndex}
        onSelectionChange={pick}
        testID="appearance-segments"
      />
    </View>
  )
}
