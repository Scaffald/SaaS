import React from 'react'
import { ChevronRight } from '@tamagui/lucide-icons'
import { Text, XStack } from 'tamagui'
import { Link } from 'expo-router'
import { useWindowDimensions } from 'tamagui'

export interface BreadcrumbItem {
  /** Label text for the breadcrumb */
  label: string
  /** Optional href for navigation. If not provided, item is not clickable */
  href?: string
  /** Whether this is the active/current page */
  isActive?: boolean
}

export interface BreadcrumbProps {
  /** Array of breadcrumb items to display */
  items: BreadcrumbItem[]
  /** Maximum number of items to show on mobile (default: 2) */
  maxItemsMobile?: number
  /** Optional callback when item is pressed (for custom navigation) */
  onItemPress?: (item: BreadcrumbItem, index: number) => void
}

/**
 * Breadcrumb component for displaying navigation hierarchy
 *
 * Features:
 * - Responsive: Shows last N items on mobile, full path on desktop
 * - Clickable navigation segments
 * - Theme-aware styling
 * - Supports custom navigation via onItemPress callback
 *
 * @example
 * ```tsx
 * <Breadcrumb
 *   items={[
 *     { label: 'Dashboard', href: '/dashboard' },
 *     { label: 'Discover Workers', href: '/dashboard/discover/workers' },
 *     { label: 'John Smith', isActive: true },
 *   ]}
 * />
 * ```
 */
export function Breadcrumb({ items, maxItemsMobile = 2, onItemPress }: BreadcrumbProps) {
  const { width } = useWindowDimensions()
  const isMobile = width < 640

  // On mobile, show only the last N items
  const displayItems =
    isMobile && items.length > maxItemsMobile ? items.slice(-maxItemsMobile) : items

  // If we truncated on mobile, add ellipsis indicator
  const showEllipsis = isMobile && items.length > maxItemsMobile

  return (
    <XStack alignItems="center" gap="$2" flexWrap="wrap">
      {showEllipsis && (
        <>
          <Text fontSize={12} color="$color10">
            ...
          </Text>
          <ChevronRight size={12} color="var(--color8)" />
        </>
      )}
      {displayItems.map((item, index) => {
        const isLast = index === displayItems.length - 1
        const isActive = item.isActive ?? isLast
        const actualIndex = showEllipsis ? items.length - displayItems.length + index : index

        const content = (
          <Text
            fontSize={12}
            color={isActive ? '$color11' : '$color10'}
            fontWeight={isActive ? '600' : '400'}
            style={{
              cursor: item.href || onItemPress ? 'pointer' : 'default',
            }}
          >
            {item.label}
          </Text>
        )

        return (
          <React.Fragment key={`${item.label}-${actualIndex}`}>
            {item.href && !onItemPress ? (
              <Link href={item.href} asChild>
                <XStack pressStyle={{ opacity: 0.7 }} cursor="pointer">
                  {content}
                </XStack>
              </Link>
            ) : onItemPress ? (
              <XStack onPress={() => onItemPress(item, actualIndex)} pressStyle={{ opacity: 0.7 }}>
                {content}
              </XStack>
            ) : (
              content
            )}
            {!isLast && <ChevronRight size={12} color="var(--color8)" />}
          </React.Fragment>
        )
      })}
    </XStack>
  )
}
