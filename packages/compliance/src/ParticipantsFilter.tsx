/**
 * ParticipantsFilter - Filter buttons for compliance status (participants tab).
 */

import { StyleSheet, Pressable } from 'react-native'
import { Text, Row, useThemeContext } from '@scaffald/ui'
import { colors, spacing } from '@scaffald/ui/tokens'
import type { ViewStyle } from 'react-native'
import type { ComplianceStatus } from './ParticipantsTable'

export type FilterOption = 'all' | ComplianceStatus

export interface ParticipantsFilterProps {
  /** Currently active filter */
  activeFilter: FilterOption
  /** Callback when filter changes */
  onFilterChange: (filter: FilterOption) => void
  /** Counts for each status (optional) */
  counts?: {
    all?: number
    compliant?: number
    pending?: number
    'at-risk'?: number
    'non-compliant'?: number
  }
  /** Additional styles */
  style?: ViewStyle
}

const filterOptions: { value: FilterOption; label: string }[] = [
  { value: 'all', label: 'All' },
  { value: 'compliant', label: 'Compliant' },
  { value: 'pending', label: 'Pending' },
  { value: 'at-risk', label: 'At Risk' },
  { value: 'non-compliant', label: 'Non-Compliant' },
]

export function ParticipantsFilter({
  activeFilter,
  onFilterChange,
  counts,
  style,
}: ParticipantsFilterProps) {
  const { theme } = useThemeContext()

  return (
    <Row gap={spacing[2]} style={{...styles.container, ...style}}>
      {filterOptions.map((option) => {
        const isActive = activeFilter === option.value
        const count = counts?.[option.value]

        return (
          <Pressable
            key={option.value}
            onPress={() => onFilterChange(option.value)}
            style={{
              ...styles.button,
              backgroundColor: isActive
                ? colors.bg[theme].selected
                : colors.bg[theme].muted,
              borderWidth: 1,
              borderColor: isActive
                ? colors.border[theme].active
                : colors.border[theme].subtle,
            }}
          >
            <Row gap={spacing[2]} align="center">
              <Text
                size="xs"
                weight="medium"
                style={{
                  color: isActive
                    ? colors.fg[theme].active
                    : colors.text[theme].secondary,
                }}
              >
                {option.label}
              </Text>
              {count !== undefined && (
                <Row
                  paddingHorizontal={spacing[2]}
                  paddingVertical={1}
                  style={{
                    ...styles.countBadge,
                    backgroundColor: isActive
                      ? colors.bg[theme].selected
                      : colors.bg[theme].subtle,
                  }}
                >
                  <Text
                    size="xs"
                    weight="semibold"
                    style={{
                      color: isActive
                        ? colors.fg[theme].active
                        : colors.text[theme].tertiary,
                    }}
                  >
                    {count}
                  </Text>
                </Row>
              )}
            </Row>
          </Pressable>
        )
      })}
    </Row>
  )
}

const styles = StyleSheet.create({
  container: {
    flexWrap: 'wrap',
  },
  button: {
    paddingHorizontal: spacing[4],
    paddingVertical: spacing[2],
    borderRadius: 9999,
  },
  countBadge: {
    borderRadius: 9999,
    minWidth: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
})
