import { DashboardWidget } from '@scaffald/tamagui-ui'
import { X } from '@tamagui/lucide-icons'
import { Button, Input, Label, Separator, Text, XStack, YStack } from 'tamagui'

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
    <YStack gap={subtitle ? '$2' : '$1'}>
      <XStack justify="space-between" items="center">
        <Text fontSize="$6" fontWeight="700" color="$color12">
          {title}
        </Text>
        {hasActiveFilters && (
          <Button size="$2" chromeless color="$red10" icon={X} onPress={onClearFilters}>
            Clear
          </Button>
        )}
      </XStack>
      {subtitle && (
        <Text fontSize="$3" color="$color11">
          {subtitle}
        </Text>
      )}
    </YStack>
  )

  const searchSection = (
    <YStack gap={searchLabel ? '$2' : '$2'}>
      {searchLabel && (
        <Label htmlFor="search" fontSize="$4" fontWeight="600" color="$color12">
          {searchLabel}
        </Label>
      )}
      <Input
        id="search"
        placeholder={searchPlaceholder}
        value={searchQuery}
        onChangeText={onSearchChange}
        size="$4"
      />
    </YStack>
  )

  const defaultActiveFiltersContent = searchQuery && (
    <XStack gap="$2" items="center">
      <Text fontSize="$3" color="$color11">
        Search:
      </Text>
      <Text fontSize="$3" fontWeight="600" color="$blue10">
        {searchQuery}
      </Text>
    </XStack>
  )

  const shouldShowActiveFilters =
    hasActiveFilters &&
    (activeFiltersContent !== undefined ? activeFiltersContent : defaultActiveFiltersContent)

  const activeFiltersSection = shouldShowActiveFilters && (
    <>
      <Separator />
      <YStack gap="$2">
        <Text fontSize="$4" fontWeight="600" color="$color12">
          Active Filters
        </Text>
        {activeFiltersContent !== undefined ? activeFiltersContent : defaultActiveFiltersContent}
      </YStack>
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
