import { RotateCcw, Search, X } from 'lucide-react-native'
import type { ReactNode } from 'react'
import { memo } from 'react'
import type { ViewStyle } from 'react-native'
import { Breadcrumb, Button, Input, Row, Stack, Text, useThemeContext } from '@scaffald/ui'
import type { BreadcrumbItemData } from '@scaffald/ui'
import { colors } from '@scaffald/ui/tokens'

type PageHeaderProps = {
  // Row 1 — Breadcrumbs & Quick Actions
  /** Breadcrumb trail items */
  breadcrumbItems?: BreadcrumbItemData[]
  /** Quick action buttons rendered on the right of the breadcrumb row */
  actions?: ReactNode

  // Row 2 — Search / Filter / Sort
  /** Search input value */
  searchValue?: string
  /** Callback when search text changes */
  onSearchChange?: (value: string) => void
  /** Placeholder text for the search input */
  searchPlaceholder?: string
  /** Custom search component (replaces built-in Input when provided) */
  renderSearch?: () => ReactNode
  /** Total result count to display */
  resultCount?: number
  /** Label for result count (e.g. "Workers", "Employers", "Jobs") */
  resultLabel?: string
  /** Callback for reset/clear all action */
  onReset?: () => void
  /** Extra controls rendered between search and result count (filters, dropdowns, etc.) */
  children?: ReactNode
  /** Optional styles applied to the outer wrapper */
  style?: ViewStyle
}

/**
 * Universal page header with two optional rows:
 * 1. Breadcrumbs (left) + quick actions (right)
 * 2. Search input + filter controls + result count + reset button
 *
 * Either row is omitted when its props are absent.
 */
export const PageHeader = memo(function PageHeader({
  breadcrumbItems,
  actions,
  searchValue,
  onSearchChange,
  searchPlaceholder = 'Search...',
  renderSearch,
  resultCount,
  resultLabel,
  onReset,
  children,
  style,
}: PageHeaderProps) {
  const { theme } = useThemeContext()
  const isDark = theme === 'dark'
  const borderColor = isDark ? 'rgba(80, 73, 64, 0.3)' : 'rgba(237, 221, 201, 0.5)'

  const showBreadcrumbRow = (breadcrumbItems && breadcrumbItems.length > 0) || actions
  const showSearchRow = onSearchChange != null || renderSearch != null

  const hasSearch = (searchValue ?? '').length > 0

  return (
    <Stack
      width="100%"
      style={{
        ...(showSearchRow
          ? { borderBottomWidth: 1, borderBottomColor: borderColor }
          : undefined),
        ...style,
      }}
    >
      {/* Row 1 — Breadcrumbs & Actions */}
      {showBreadcrumbRow && (
        <Row
          width="100%"
          paddingHorizontal={16}
          paddingVertical={8}
          align="center"
          justify="space-between"
        >
          {breadcrumbItems && breadcrumbItems.length > 0 ? (
            <Breadcrumb
              items={breadcrumbItems}
              currentIndex={breadcrumbItems.length - 1}
            />
          ) : (
            <Stack />
          )}
          {actions && <Row gap={8} align="center">{actions}</Row>}
        </Row>
      )}

      {/* Row 2 — Search / Filter / Sort */}
      {showSearchRow && (
        <Row
          width="100%"
          paddingHorizontal={16}
          paddingVertical={10}
          gap={10}
          align="center"
        >
          {/* Search Input */}
          <Stack flex={1} minWidth={200}>
            {renderSearch ? (
              renderSearch()
            ) : (
              <Input
                placeholder={searchPlaceholder}
                value={searchValue ?? ''}
                onChangeText={onSearchChange}
                iconStart={Search}
                iconEnd={hasSearch ? X : undefined}
                iconEndOnPress={hasSearch ? () => onSearchChange?.('') : undefined}
                iconEndAccessibilityLabel={hasSearch ? 'Clear search' : undefined}
              />
            )}
          </Stack>

          {/* Extra controls (filters, dropdowns, etc.) */}
          {children}

          {/* Result Count */}
          {resultCount !== undefined && (
            <Text
              style={{
                fontSize: 14,
                fontWeight: '500',
                color: colors.text[theme].secondary,
              }}
              numberOfLines={1}
            >
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
      )}
    </Stack>
  )
})
