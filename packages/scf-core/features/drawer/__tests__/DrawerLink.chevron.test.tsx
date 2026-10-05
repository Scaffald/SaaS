import { render, screen } from '@testing-library/react'
import { describe, expect, it, vi } from 'vitest'
import { DrawerLink } from '../DrawerLink'
import type { DrawerItemConfig } from '../types'

vi.mock('expo-router', () => ({
  Link: ({ children, href }: { children: React.ReactNode; href: string }) => (
    <a href={href}>{children}</a>
  ),
}))

vi.mock('lucide-react-native', async (importOriginal) => ({
  ...(await importOriginal<Record<string, unknown>>()),
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

vi.mock('@scaffald/ui', async (importOriginal) => ({
  ...(await importOriginal<Record<string, unknown>>()),
  useThemeContext: () => ({ theme: 'light' }),
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
      />
    )

    expect(screen.queryByTestId('chevron-right')).not.toBeInTheDocument()
    expect(screen.queryByTestId('chevron-down')).not.toBeInTheDocument()
  })

  it('should show ChevronRight for items with hasChevron=true', () => {
    const item: DrawerItemConfig = {
      ...baseItem,
      hasChevron: true,
    }

    render(
      <DrawerLink
        item={item}
        pathname="/test"
      />
    )

    expect(screen.getByTestId('chevron-right')).toBeInTheDocument()
    expect(screen.queryByTestId('chevron-down')).not.toBeInTheDocument()
  })

  it('does not draw a section with children as a tree — its children are its tabs', () => {
    const item: DrawerItemConfig = {
      ...baseItem,
      subItems: [{ key: 'sub-1', title: 'Sub Item', href: '/test/sub' }],
    }

    render(
      <DrawerLink
        item={item}
        pathname="/test"
      />
    )

    expect(screen.queryByTestId('chevron-right')).not.toBeInTheDocument()
    expect(screen.queryByText('Sub Item')).not.toBeInTheDocument()
  })
})
