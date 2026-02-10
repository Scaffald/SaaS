import { render, screen } from '@testing-library/react'
import { describe, expect, it, vi } from 'vitest'
import { DrawerLink } from '../DrawerLink'
import type { DrawerItemConfig } from '../types'

vi.mock('tamagui', () => ({
  Row: ({ children, ...props }: { children: React.ReactNode }) => (
    <div {...props}>{children}</div>
  ),
  Stack: ({ children, ...props }: { children: React.ReactNode }) => (
    <div {...props}>{children}</div>
  ),
  Paragraph: ({ children, ...props }: { children: React.ReactNode }) => (
    <p {...props}>{children}</p>
  ),
}))

vi.mock('expo-router', () => ({
  Link: ({ children, href }: { children: React.ReactNode; href: string }) => (
    <a href={href}>{children}</a>
  ),
}))

vi.mock('@tamagui/lucide-icons', () => ({
  ChevronRight: () => <span data-testid="chevron-right" />,
  ChevronDown: () => <span data-testid="chevron-down" />,
  Check: () => <span data-testid="check" />,
  Clock: () => <span data-testid="clock" />,
  Palette: () => <span data-testid="palette" />, // Added for transitive dependencies
  FileText: () => <span data-testid="file-text" />, // Added for routes.ts dependency
  Users: () => <span data-testid="users" />, // Added for routes.ts dependency
}))

vi.mock('@scf/core/utils/useTranslation', () => ({
  useTranslation: () => ({
    t: (key: string) => key,
  }),
}))

describe('DrawerLink Chevron Icons', () => {
  const baseItem: DrawerItemConfig = {
    key: 'test-item',
    title: 'Test Item',
    href: '/test',
  }

  it('should not show chevron for items without sub-items and hasChevron=false', () => {
    render(
      <DrawerLink
        item={baseItem}
        pathname="/test"
        expandedItems={new Set()}
        onToggleExpanded={vi.fn()}
      />
    )

    expect(screen.queryByTestId('chevron-right')).not.toBeInTheDocument()
    expect(screen.queryByTestId('chevron-down')).not.toBeInTheDocument()
  })

  it('should show ChevronRight for non-expandable items with hasChevron=true', () => {
    const item: DrawerItemConfig = {
      ...baseItem,
      hasChevron: true,
      isExpandable: false,
    }

    render(
      <DrawerLink
        item={item}
        pathname="/test"
        expandedItems={new Set()}
        onToggleExpanded={vi.fn()}
      />
    )

    expect(screen.getByTestId('chevron-right')).toBeInTheDocument()
    expect(screen.queryByTestId('chevron-down')).not.toBeInTheDocument()
  })

  it('should not show chevron for expandable items (they handle expansion differently)', () => {
    const item: DrawerItemConfig = {
      ...baseItem,
      isExpandable: true,
      subItems: [{ key: 'sub-1', title: 'Sub Item', href: '/test/sub' }],
    }

    render(
      <DrawerLink
        item={item}
        pathname="/test"
        expandedItems={new Set()}
        onToggleExpanded={vi.fn()}
      />
    )

    // Expandable items don't show chevron in renderRightSide (per current implementation)
    // This test documents current behavior
    expect(screen.queryByTestId('chevron-right')).not.toBeInTheDocument()
  })
})
