/**
 * Dropdown Section component
 * Section with heading for grouping DropdownItems
 * Mapped from Figma Forsured Design System
 */

import { View, Text } from 'react-native'
import type { DropdownSectionProps } from './Dropdown.types'
import { getDropdownStyles } from './Dropdown.styles'

export function DropdownSection({
  heading,
  children,
  divider = false,
  style,
  headingStyle,
}: DropdownSectionProps) {
  const styles = getDropdownStyles()

  return (
    <View style={[styles.section, style]}>
      {heading && <Text style={[styles.sectionHeading, headingStyle]}>{heading}</Text>}
      {children}
      {divider && <View style={styles.divider} />}
    </View>
  )
}
