/**
 * SegmentedControl — iOS 26 style segmented control
 *
 * A horizontal control with pill-shaped segments. The selected segment
 * gets a white (light) or gray (dark) background pill indicator.
 *
 * @example
 * ```tsx
 * const [selected, setSelected] = useState(0)
 * <SegmentedControl
 *   segments={['Day', 'Week', 'Month']}
 *   selectedIndex={selected}
 *   onSelectionChange={setSelected}
 * />
 * ```
 */

import type React from 'react'
import { Pressable, View } from 'react-native'
import { Text } from '../Typography'
import type { SegmentedControlProps } from './SegmentedControl.types'
import { getSegmentedControlStyles } from './SegmentedControl.styles'
import { useStyles } from '../../hooks'
import { useThemeContext } from '../../theme'

export function SegmentedControl({
  segments,
  selectedIndex,
  onSelectionChange,
  disabled = false,
  style,
  testID,
}: SegmentedControlProps): React.ReactElement {
  const { theme } = useThemeContext()
  const styles = useStyles(getSegmentedControlStyles, [theme] as const)

  return (
    <View style={[styles.container, style]} testID={testID} accessibilityRole="tablist">
      {segments.map((label, index) => {
        const isSelected = index === selectedIndex
        return (
          <Pressable
            key={`${label}-${index}`}
            style={isSelected ? styles.selectedSegment : styles.segment}
            onPress={() => !disabled && onSelectionChange(index)}
            disabled={disabled}
            accessibilityRole="tab"
            accessibilityState={{ selected: isSelected, disabled }}
            accessibilityLabel={label}
          >
            <Text
              style={isSelected ? styles.selectedLabel : styles.label}
              numberOfLines={1}
            >
              {label}
            </Text>
          </Pressable>
        )
      })}
    </View>
  )
}
