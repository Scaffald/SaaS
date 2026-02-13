import { DashboardWidget } from '@unicornlove/beyond-ui'
import { X } from 'lucide-react-native'
import { Button, Input, Label, Separator, Text, Row, Stack } from '@unicornlove/beyond-ui'

export interface SearchFilterWidgetProps {
  /** Title displayed in the header */
  title: string
  /** Optional subtitle displayed below the title */
  subtitle?: string
  /** Current search query value */
  searchQuery: string
  /** Callback when search input changes */
  onSearchChange: (query: string) => void
  /** Label text or content for the search input */
  searchLabel?: React.ReactNode
  /** Placeholder text for the search input */
  searchPlaceholder?: string
  /** Whether any filters are currently active */
  hasActiveFilters: boolean
  /** Callback to clear all filters */
  onClearFilters: () => void
  /** Additional filter sections rendered between search and active filters summary */
  children?: React.ReactNode
  /** Whether to wrap in DashboardWidget (default: true) */
  wrapped?: boolean
  /** Custom active filters summary content. If provided, overrides the default search query display */
  activeFiltersContent?: React.ReactNode
}

/**
 * Reusable Search & Filter Widget Component
 *
 * Provides a consistent search and filter interface with:
 * - Header with title and clear button
 * - Search input section
 * - Optional additional filter sections (via children)
 * - Active filters summary
 *
 * Can be wrapped in DashboardWidget or used standalone.
 */
export function SearchFilterWidget({
  title,
  subtitle,
  searchQuery,
  onSearchChange,
  searchLabel,
  searchPlaceholder = 'Search...',
  hasActiveFilters,
  onClearFilters,
  children,
  wrapped = true,
  activeFiltersContent,
}: SearchFilterWidgetProps) {
  const headerSection = (
    <Stack gap={subtitle ? '$2' : '$1'}>
      <Row justify="space-between" align="center">
        <Text color="gray">{title}</Text>
        {hasActiveFilters && (
          <Button size={8} chromeless color="$red10" icon={X} onPress={onClearFilters}>
            Clear
          </Button>
        )}
      </Row>
      {subtitle && <Text color="gray">{subtitle}</Text>}
    </Stack>
  )

  const searchSection = (
    <Stack gap={searchLabel ? '$2' : '$2'}>
      {searchLabel && (
        <Label htmlFor="search" color="gray">
          {searchLabel}
        </Label>
      )}
      <Input
        id="search"
        placeholder={searchPlaceholder}
        value={searchQuery}
        onChangeText={onSearchChange}
        size={16}
      />
    </Stack>
  )

  const defaultActiveFiltersContent = searchQuery && (
    <Row gap={8} align="center">
      <Text color="gray">Search:</Text>
      <Text color="$blue10">{searchQuery}</Text>
    </Row>
  )

  const shouldShowActiveFilters =
    hasActiveFilters &&
    (activeFiltersContent !== undefined ? activeFiltersContent : defaultActiveFiltersContent)

  const activeFiltersSection = shouldShowActiveFilters && (
    <>
      <Separator />
      <Stack gap={8}>
        <Text color="gray">Active Filters</Text>
        {activeFiltersContent !== undefined ? activeFiltersContent : defaultActiveFiltersContent}
      </Stack>
    </>
  )

  const content = (
    <>
      {headerSection}
      {searchSection}
      {children && (
        <>
          <Separator />
          {children}
        </>
      )}
      {activeFiltersSection}
    </>
  )

  if (wrapped) {
    return <DashboardWidget>{content}</DashboardWidget>
  }

  return <>{content}</>
}
