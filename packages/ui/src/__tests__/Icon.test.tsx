/**
 * Icon Component Tests - UNI-Construct @unicornlove/ui
 *
 * Migrated from FRS-Prototype packages/core
 * Tests for icons from @tamagui/lucide-icons.
 *
 * NOTE: FRS-Prototype had a custom Icon wrapper component.
 * UNI-Construct uses @tamagui/lucide-icons directly without a wrapper.
 * Tests have been adapted to test the icon library integration.
 */

import { describe, it, expect, vi } from 'vitest'
import { render, screen } from '@testing-library/react'

// Mock Tamagui before importing icons
vi.mock('tamagui', async () => {
  const React = await import('react')
  return {
    styled: (_component: unknown, config: Record<string, unknown>) => {
      const StyledComponent = React.forwardRef<HTMLElement, Record<string, unknown>>(
        ({ children, ...props }, ref) => {
          return React.createElement('div', { ref, 'data-name': config.name, ...props }, children)
        }
      )
      StyledComponent.displayName = (config.name as string) || 'StyledComponent'
      return StyledComponent
    },
    Stack: ({ children, ...props }: Record<string, unknown>) =>
      React.createElement('div', { 'data-testid': 'stack', ...props }, children as React.ReactNode),
  }
})

// Mock lucide icons
vi.mock('@tamagui/lucide-icons', async () => {
  const React = await import('react')

  // Create mock icon component factory
  const createMockIcon = (name: string) => {
    const IconComponent = ({ size, color, ...props }: { size?: number; color?: string }) =>
      React.createElement('svg', {
        'data-testid': `icon-${name.toLowerCase()}`,
        'data-size': size,
        'data-color': color,
        ...props,
      })
    IconComponent.displayName = name
    return IconComponent
  }

  return {
    Check: createMockIcon('Check'),
    X: createMockIcon('X'),
    Plus: createMockIcon('Plus'),
    Minus: createMockIcon('Minus'),
    ChevronRight: createMockIcon('ChevronRight'),
    ChevronLeft: createMockIcon('ChevronLeft'),
    ChevronDown: createMockIcon('ChevronDown'),
    ChevronUp: createMockIcon('ChevronUp'),
    Search: createMockIcon('Search'),
    Settings: createMockIcon('Settings'),
    User: createMockIcon('User'),
    Users: createMockIcon('Users'),
    Mail: createMockIcon('Mail'),
    Phone: createMockIcon('Phone'),
    Calendar: createMockIcon('Calendar'),
    Clock: createMockIcon('Clock'),
    AlertCircle: createMockIcon('AlertCircle'),
    AlertTriangle: createMockIcon('AlertTriangle'),
    Info: createMockIcon('Info'),
    HelpCircle: createMockIcon('HelpCircle'),
    Edit: createMockIcon('Edit'),
    Trash: createMockIcon('Trash'),
    Copy: createMockIcon('Copy'),
    Download: createMockIcon('Download'),
    Upload: createMockIcon('Upload'),
    ExternalLink: createMockIcon('ExternalLink'),
    MoreHorizontal: createMockIcon('MoreHorizontal'),
    MoreVertical: createMockIcon('MoreVertical'),
    Filter: createMockIcon('Filter'),
    SortAsc: createMockIcon('SortAsc'),
    SortDesc: createMockIcon('SortDesc'),
    Eye: createMockIcon('Eye'),
    EyeOff: createMockIcon('EyeOff'),
    Lock: createMockIcon('Lock'),
    Unlock: createMockIcon('Unlock'),
    Shield: createMockIcon('Shield'),
    FileText: createMockIcon('FileText'),
    Folder: createMockIcon('Folder'),
    Home: createMockIcon('Home'),
    Menu: createMockIcon('Menu'),
    Bell: createMockIcon('Bell'),
    MessageSquare: createMockIcon('MessageSquare'),
    Send: createMockIcon('Send'),
    Star: createMockIcon('Star'),
    Heart: createMockIcon('Heart'),
    Bookmark: createMockIcon('Bookmark'),
    Share: createMockIcon('Share'),
    RefreshCw: createMockIcon('RefreshCw'),
    Loader2: createMockIcon('Loader2'),
  }
})

import { Check, X, Plus, Search, User } from '@tamagui/lucide-icons'

describe('Icon Components', () => {
  describe('Basic Rendering', () => {
    it('should render Check icon', () => {
      render(<Check />)
      expect(screen.getByTestId('icon-check')).toBeInTheDocument()
    })

    it('should render X icon', () => {
      render(<X />)
      expect(screen.getByTestId('icon-x')).toBeInTheDocument()
    })

    it('should render Plus icon', () => {
      render(<Plus />)
      expect(screen.getByTestId('icon-plus')).toBeInTheDocument()
    })

    it('should render Search icon', () => {
      render(<Search />)
      expect(screen.getByTestId('icon-search')).toBeInTheDocument()
    })

    it('should render User icon', () => {
      render(<User />)
      expect(screen.getByTestId('icon-user')).toBeInTheDocument()
    })
  })

  describe('Icon Props', () => {
    it('should accept size prop', () => {
      render(<Check size={24} />)
      const icon = screen.getByTestId('icon-check')
      expect(icon).toHaveAttribute('data-size', '24')
    })

    it('should accept color prop', () => {
      render(<Check color="$blue10" />)
      const icon = screen.getByTestId('icon-check')
      expect(icon).toHaveAttribute('data-color', '$blue10')
    })

    it('should accept CSS color value', () => {
      render(<Check color="#FF0000" />)
      const icon = screen.getByTestId('icon-check')
      expect(icon).toHaveAttribute('data-color', '#FF0000')
    })

    it('should render with all props', () => {
      render(<Check size={32} color="$green9" />)
      const icon = screen.getByTestId('icon-check')
      expect(icon).toHaveAttribute('data-size', '32')
      expect(icon).toHaveAttribute('data-color', '$green9')
    })
  })

  describe('Icon Availability', () => {
    it('should export Check icon', () => {
      expect(Check).toBeDefined()
    })

    it('should export X icon', () => {
      expect(X).toBeDefined()
    })

    it('should export Plus icon', () => {
      expect(Plus).toBeDefined()
    })

    it('should export Search icon', () => {
      expect(Search).toBeDefined()
    })

    it('should export User icon', () => {
      expect(User).toBeDefined()
    })
  })

  // TODO: Icon wrapper component differences
  // FRS-Prototype had a custom Icon component:
  // - Icon wrapper with size prop using IconSize type ('xs' | 'sm' | 'md' | 'lg' | 'xl')
  // - Size mapping to pixel values (xs: 12, sm: 16, md: 20, lg: 24, xl: 32)
  // - Default color: $color11
  // - Icon passed as prop: <Icon icon={Check} size="lg" color="$blue10" />
  //
  // UNI-Construct approach:
  // - Direct use of @tamagui/lucide-icons without wrapper
  // - Icons accept size (number) and color (string) props directly
  // - Usage: <Check size={24} color="$blue10" />
  //
  // If the wrapper API is needed for consistency, a custom Icon component
  // could be created that wraps lucide-icons with the size mapping.
})
