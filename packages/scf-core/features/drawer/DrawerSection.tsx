import { Stack } from '@unicornlove/beyond-ui'
import { DrawerLink } from './DrawerLink'
import type { DrawerSectionProps } from './types'

/**
 * DrawerSection component renders a section of drawer menu items
 * Handles both collapsed and expanded modes with proper item rendering
 */
export const DrawerSection = ({
  section,
  pathname,
  collapsed,
  onNavigate,
  expandedItems,
  onToggleExpanded,
}: DrawerSectionProps) => {
  if (collapsed) {
    // For collapsed mode, show all items flat
    const items = section.items.flatMap((item) => [
      { item, depth: 0 },
      ...(item.subItems?.map((sub) => ({ item: sub, depth: 1 })) ?? []),
    ])

    return (
      <Stack gap="$2">
        {items.map(({ item, depth }) => (
          <DrawerLink
            key={`${section.key}-${item.key}-${depth}`}
            item={item}
            pathname={pathname}
            depth={depth}
            onNavigate={onNavigate}
            expandedItems={expandedItems}
            onToggleExpanded={onToggleExpanded}
            isCollapsed={collapsed}
          />
        ))}
      </Stack>
    )
  }

  // For expanded mode, show items with expandable functionality
  return (
    <Stack gap="$1" flex={1}>
      {section.items.map((item) => (
        <DrawerLink
          key={`${section.key}-${item.key}`}
          item={item}
          pathname={pathname}
          onNavigate={onNavigate}
          expandedItems={expandedItems}
          onToggleExpanded={onToggleExpanded}
          isCollapsed={collapsed}
        />
      ))}
    </Stack>
  )
}
