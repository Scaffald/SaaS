import { RotateCcw, Search, X } from 'lucide-react-native'
import type { ReactNode } from 'react'
import { memo } from 'react'
import { Button, Input, Row, Stack, Text, useThemeContext } from '@scaffald/ui'

type DiscoverHeaderProps = {
  /** Search input value */
  searchValue: string
  /** Callback when search text changes */
  onSearchChange: (value: string) => void
  /** Placeholder text for the search input */
  placeholder?: string
  /** Total result count to display */
  resultCount?: number
  /** Label for result count (e.g. "Workers", "Employers", "Jobs") */
  resultLabel?: string
  /** Callback for reset/clear all action */
  onReset?: () => void
  /** Extra controls to render between search and result count (e.g. filter dropdown) */
  children?: ReactNode
}

/**
 * Reusable header bar for Discover pages (Workers, Employers, Jobs, Map).
 * Provides a consistent search + filter + result count + reset toolbar.
 */
export const DiscoverHeader = memo(function DiscoverHeader({
  searchValue,
  onSearchChange,
  placeholder = 'Search...',
  resultCount,
  resultLabel,
  onReset,
  children,
}: DiscoverHeaderProps) {
  const { theme } = useThemeContext()
  const isDark = theme === 'dark'

  const borderColor = isDark ? 'rgba(80, 73, 64, 0.3)' : 'rgba(237, 221, 201, 0.5)'

  const hasSearch = searchValue.length > 0

  return (
    <Row
      width="100%"
      paddingHorizontal={16}
      paddingVertical={10}
      gap={10}
      align="center"
      style={{ borderBottomWidth: 1, borderBottomColor: borderColor }}
    >
      {/* Search Input */}
      <Stack flex={1} minWidth={200}>
        <Input
          placeholder={placeholder}
          value={searchValue}
          onChangeText={onSearchChange}
          iconStart={Search}
          iconEnd={hasSearch ? X : undefined}
          iconEndOnPress={hasSearch ? () => onSearchChange('') : undefined}
          iconEndAccessibilityLabel={hasSearch ? 'Clear search' : undefined}
        />
      </Stack>

      {/* Extra controls (filters, dropdowns, etc.) */}
      {children}

      {/* Result Count */}
      {resultCount !== undefined && (
        <Text style={{ fontSize: 14, fontWeight: '500' }} numberOfLines={1}>
          {resultCount} {resultLabel ?? (resultCount === 1 ? 'result' : 'results')}
        </Text>
      )}

      {/* Reset Button */}
      {onReset && (
        <Button
          size="md"
          variant="outline"
          iconStart={RotateCcw}
          onPress={onReset}
          color="gray"
          accessibilityLabel="Reset filters and search"
        />
      )}
    </Row>
  )
})
