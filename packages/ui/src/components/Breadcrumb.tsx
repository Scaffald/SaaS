import { ChevronRight } from '@tamagui/lucide-icons'
import { Link, useRouter } from 'expo-router'
import { Fragment, memo, useCallback, useMemo, useState } from 'react'
import {
  Adapt,
  Popover,
  ScrollView,
  Sheet,
  Text,
  useWindowDimensions,
  XStack,
  YStack,
} from 'tamagui'
import { Button as UIButton } from './buttons/Button'

export interface BreadcrumbSibling {
  /** Label text for the sibling breadcrumb */
  label: string
  /** Href for navigation to this sibling */
  href: string
  /** Whether this sibling is currently active */
  isActive?: boolean
}

export interface BreadcrumbItem {
  /** Label text for the breadcrumb */
  label: string
  /** Optional href for navigation. If not provided, item is not clickable */
  href?: string
  /** Whether this is the active/current page */
  isActive?: boolean
  /** Array of sibling routes at this tier level */
  siblings?: BreadcrumbSibling[]
}

export interface BreadcrumbProps {
  /** Array of breadcrumb items to display */
  items: BreadcrumbItem[]
  /** Maximum number of items to show on mobile (default: 2) */
  maxItemsMobile?: number
  /** Maximum number of items to show on desktop before collapsing (default: 4) */
  maxItemsDesktop?: number
  /** Optional callback when item is pressed (for custom navigation) */
  onItemPress?: (item: BreadcrumbItem, index: number) => void
  /** Whether to show dropdown for ellipsis (default: true) */
  showEllipsisDropdown?: boolean
}

/**
 * Breadcrumb component for displaying navigation hierarchy
 *
 * Features:
 * - Responsive: Shows last N items on mobile, full path on desktop
 * - Desktop collapse: Shows up to 4 tiers before collapsing with ellipsis
 * - Mobile collapse: Shows only last 2 tiers
 * - Ellipsis dropdown: Click ellipsis to see hidden middle tiers
 * - Clickable navigation segments (non-terminal items are links)
 * - Terminal items displayed as plain text (not clickable)
 * - Theme-aware styling
 * - Supports custom navigation via onItemPress callback
 * - Accessibility: WCAG 2.1 Level AA compliant with ARIA labels
 * - Memoized for performance optimization
 *
 * @example
 * ```tsx
 * // Basic usage - simple breadcrumb trail
 * <Breadcrumb
 *   items={[
 *     { label: 'Dashboard', href: '/dashboard' },
 *     { label: 'Workers', href: '/dashboard/workers' },
 *     { label: 'John Smith', isActive: true },
 *   ]}
 * />
 * ```
 *
 * @example
 * ```tsx
 * // With auto-generation from route
 * const { breadcrumbs } = useBreadcrumbs({ autoGenerate: true });
 * <Breadcrumb items={breadcrumbs} />
 * ```
 *
 * @example
 * ```tsx
 * // Customize collapse thresholds
 * <Breadcrumb
 *   items={breadcrumbItems}
 *   maxItemsDesktop={5}
 *   maxItemsMobile={3}
 *   showEllipsisDropdown={true}
 * />
 * ```
 */
export const Breadcrumb = memo(function Breadcrumb({
  items,
  maxItemsMobile = 2,
  maxItemsDesktop = 4,
  onItemPress,
  showEllipsisDropdown = true,
}: BreadcrumbProps) {
  // Use window dimensions for item calculation logic
  // Breakpoint: 800px (matches Tamagui $sm/$md breakpoint)
  const { width } = useWindowDimensions()
  const isMobile = width <= 800
  const router = useRouter()
  const [ellipsisOpen, setEllipsisOpen] = useState(false)

  // Calculate which items to display based on viewport (memoized)
  const { displayItems, showEllipsis, hiddenItems, hiddenStartIndex } = useMemo(() => {
    let displayItems: BreadcrumbItem[]
    let showEllipsis = false
    let hiddenStartIndex = -1
    let hiddenEndIndex = -1

    if (isMobile) {
      // Mobile: show only last N items
      if (items.length > maxItemsMobile) {
        displayItems = items.slice(-maxItemsMobile)
        showEllipsis = true
        hiddenStartIndex = 0
        hiddenEndIndex = items.length - maxItemsMobile - 1
      } else {
        displayItems = items
      }
    } else {
      // Desktop: show first + last (maxItemsDesktop - 1) items if exceeding threshold
      if (items.length > maxItemsDesktop) {
        const visibleCount = maxItemsDesktop
        const firstItem = items[0]
        const lastItems = items.slice(-(visibleCount - 1))
        displayItems = [firstItem, ...lastItems]
        showEllipsis = true
        hiddenStartIndex = 1
        hiddenEndIndex = items.length - (visibleCount - 1) - 1
      } else {
        displayItems = items
      }
    }

    // Get hidden items for ellipsis dropdown
    const hiddenItems =
      showEllipsis && hiddenStartIndex >= 0 && hiddenEndIndex >= hiddenStartIndex
        ? items.slice(hiddenStartIndex, hiddenEndIndex + 1)
        : []

    return {
      displayItems,
      showEllipsis,
      hiddenItems,
      hiddenStartIndex,
      hiddenEndIndex,
    }
  }, [items, isMobile, maxItemsMobile, maxItemsDesktop])

  // Handle navigation to hidden item (memoized)
  const handleHiddenItemPress = useCallback(
    (item: BreadcrumbItem, index: number) => {
      if (item.href && !onItemPress) {
        router.push(item.href as any)
      } else if (onItemPress) {
        onItemPress(item, index)
      }
      setEllipsisOpen(false)
    },
    [router, onItemPress]
  )

  // Render ellipsis dropdown content
  const renderEllipsisDropdown = () => {
    if (!showEllipsisDropdown || hiddenItems.length === 0) {
      return null
    }

    const dropdownContent = (
      <YStack gap="$2" p="$2" minW={200} maxH={300}>
        <ScrollView maxH={300}>
          {hiddenItems.map((item, idx) => {
            const actualIndex = hiddenStartIndex + idx
            const isActive = item.isActive ?? false
            return (
              <UIButton
                key={`ellipsis-${actualIndex}`}
                size="$3"
                variant={isActive ? 'outlined' : 'ghost'}
                onPress={() => handleHiddenItemPress(item, actualIndex)}
                justify="flex-start"
                aria-label={`Navigate to ${item.label}`}
                role="menuitem"
              >
                <Text
                  fontSize={12}
                  color={isActive ? '$color11' : '$color10'}
                  fontWeight={isActive ? '600' : '400'}
                >
                  {item.label}
                </Text>
              </UIButton>
            )
          })}
        </ScrollView>
      </YStack>
    )

    return (
      <Popover
        open={ellipsisOpen}
        onOpenChange={setEllipsisOpen}
        placement="bottom-start"
        allowFlip
      >
        <Popover.Trigger asChild>
          <XStack
            cursor="pointer"
            pressStyle={{ opacity: 0.7 }}
            items="center"
            gap="$1"
            aria-label="Show hidden breadcrumb items"
            aria-expanded={ellipsisOpen}
          >
            <Text fontSize={12} color="$color10">
              ...
            </Text>
          </XStack>
        </Popover.Trigger>
        <Adapt when="sm" platform="touch">
          <Sheet
            modal
            open={ellipsisOpen}
            onOpenChange={setEllipsisOpen}
            dismissOnSnapToBottom
            snapPoints={[50]}
          >
            <Sheet.Overlay />
            <Sheet.Frame p="$4">
              <Sheet.Handle />
              <YStack gap="$2" pt="$2">
                <Text fontSize={16} fontWeight="600" mb="$2">
                  Hidden Breadcrumb Items
                </Text>
                {dropdownContent}
              </YStack>
            </Sheet.Frame>
          </Sheet>
        </Adapt>
        <Popover.Content
          p={0}
          borderWidth={1}
          borderColor="$borderColor"
          bg="$background"
          elevation={4}
          enterStyle={{ opacity: 0, scale: 0.95, y: -10 }}
          exitStyle={{ opacity: 0, scale: 0.95, y: -10 }}
          animation="quick"
        >
          {dropdownContent}
        </Popover.Content>
      </Popover>
    )
  }

  return (
    <XStack items="center" gap="$2" flexWrap="wrap" aria-label="Breadcrumb navigation">
      {showEllipsis && showEllipsisDropdown && hiddenItems.length > 0 ? (
        <>
          {renderEllipsisDropdown()}
          <ChevronRight size={12} color="var(--color8)" />
        </>
      ) : showEllipsis ? (
        <>
          <Text fontSize={12} color="$color10">
            ...
          </Text>
          <ChevronRight size={12} color="var(--color8)" />
        </>
      ) : null}
      {displayItems.map((item, displayIndex) => {
        // Calculate actual index in original items array
        let actualIndex: number
        if (isMobile && showEllipsis) {
          // Mobile: displayItems are the last N items
          actualIndex = items.length - displayItems.length + displayIndex
        } else if (!isMobile && showEllipsis) {
          // Desktop: first item + last N-1 items
          if (displayIndex === 0) {
            actualIndex = 0
          } else {
            actualIndex = items.length - (displayItems.length - 1) + (displayIndex - 1)
          }
        } else {
          actualIndex = displayIndex
        }

        const isLast = displayIndex === displayItems.length - 1
        const isActive = item.isActive ?? isLast

        // Render regular breadcrumb item (no dropdowns - simplified)
        // Terminal routes (isActive) should not be clickable
        const isClickable = !isActive && (item.href || onItemPress)

        const content = (
          <Text
            fontSize={12}
            color={isActive ? '$color11' : '$color10'}
            fontWeight={isActive ? '600' : '400'}
            style={{
              cursor: isClickable ? 'pointer' : 'default',
            }}
            aria-current={isActive ? 'page' : undefined}
          >
            {item.label}
          </Text>
        )

        return (
          <Fragment key={`${item.label}-${actualIndex}`}>
            {isClickable && item.href && !onItemPress ? (
              <Link href={item.href} asChild>
                <XStack pressStyle={{ opacity: 0.7 }} cursor="pointer">
                  {content}
                </XStack>
              </Link>
            ) : isClickable && onItemPress ? (
              <XStack onPress={() => onItemPress(item, actualIndex)} pressStyle={{ opacity: 0.7 }}>
                {content}
              </XStack>
            ) : (
              content
            )}
            {!isLast && <ChevronRight size={12} color="var(--color8)" />}
          </Fragment>
        )
      })}
    </XStack>
  )
})
