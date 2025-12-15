/**
 * Avatar Component Tests - UNI-Construct @unicornlove/ui
 *
 * Migrated from FRS-Prototype packages/core
 * Tests for the AvatarGroup component (replaces simple Avatar component).
 *
 * NOTE: FRS-Prototype had a simple Avatar component for single avatars.
 * UNI-Construct has AvatarGroup for displaying multiple user avatars with overflow.
 * Tests have been adapted to the new API which works with arrays of avatars.
 */

import { describe, it, expect, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import { AvatarGroup } from '../components/avatars/AvatarGroup'
import type { AvatarGroupAvatar } from '../components/avatars/AvatarGroup'

// Mock Tamagui's components for testing
vi.mock('tamagui', async () => {
  const React = await import('react')
  return {
    styled: (_component: unknown, config: Record<string, unknown>) => {
      const StyledComponent = ({ children, ...props }: Record<string, unknown>) =>
        React.createElement(
          'div',
          { 'data-name': config.name, ...props },
          children as React.ReactNode
        )
      return StyledComponent
    },
    XStack: ({ children, ...props }: Record<string, unknown>) =>
      React.createElement('div', { 'data-testid': 'avatar-group', ...props }, children as React.ReactNode),
    Avatar: Object.assign(
      ({ children, ...props }: Record<string, unknown>) =>
        React.createElement(
          'div',
          { 'data-testid': 'avatar', ...props },
          children as React.ReactNode
        ),
      {
        Image: ({ src, alt, ...props }: Record<string, unknown>) =>
          React.createElement('img', { src, alt, 'data-testid': 'avatar-image', ...props }),
        Fallback: ({ children, ...props }: Record<string, unknown>) =>
          React.createElement(
            'div',
            { 'data-testid': 'avatar-fallback', ...props },
            children as React.ReactNode
          ),
      }
    ),
    Text: ({ children, ...props }: Record<string, unknown>) =>
      React.createElement('span', props, children as React.ReactNode),
  }
})

describe('AvatarGroup Component', () => {
  describe('Basic Rendering', () => {
    it('should render single avatar', () => {
      const avatars: AvatarGroupAvatar[] = [{ name: 'John Doe' }]

      render(<AvatarGroup avatars={avatars} />)
      expect(screen.getByTestId('avatar-group')).toBeInTheDocument()
      expect(screen.getByText('J')).toBeInTheDocument()
    })

    it('should render multiple avatars', () => {
      const avatars: AvatarGroupAvatar[] = [
        { name: 'John Doe' },
        { name: 'Jane Smith' },
        { name: 'Bob Johnson' },
      ]

      render(<AvatarGroup avatars={avatars} />)
      expect(screen.getByText('J')).toBeInTheDocument()
      expect(screen.getByText('J')).toBeInTheDocument()
      expect(screen.getByText('B')).toBeInTheDocument()
    })

    it('should render nothing when avatars array is empty', () => {
      const { container } = render(<AvatarGroup avatars={[]} />)
      expect(container.firstChild).toBeNull()
    })
  })

  describe('Image Source', () => {
    it('should render avatar with image source', () => {
      const avatars: AvatarGroupAvatar[] = [
        { name: 'John Doe', src: 'https://example.com/avatar.jpg' },
      ]

      render(<AvatarGroup avatars={avatars} />)
      const images = screen.getAllByTestId('avatar-image')
      expect(images[0]).toHaveAttribute('src', 'https://example.com/avatar.jpg')
    })

    it('should render multiple avatars with different sources', () => {
      const avatars: AvatarGroupAvatar[] = [
        { name: 'John Doe', src: 'https://example.com/john.jpg' },
        { name: 'Jane Smith', src: 'https://example.com/jane.jpg' },
      ]

      render(<AvatarGroup avatars={avatars} />)
      const images = screen.getAllByTestId('avatar-image')
      expect(images[0]).toHaveAttribute('src', 'https://example.com/john.jpg')
      expect(images[1]).toHaveAttribute('src', 'https://example.com/jane.jpg')
    })
  })

  describe('Fallback Initials', () => {
    it('should render first letter of name as fallback', () => {
      const avatars: AvatarGroupAvatar[] = [{ name: 'John Doe' }]

      render(<AvatarGroup avatars={avatars} />)
      expect(screen.getByText('J')).toBeInTheDocument()
    })

    it('should handle lowercase names', () => {
      const avatars: AvatarGroupAvatar[] = [{ name: 'jane smith' }]

      render(<AvatarGroup avatars={avatars} />)
      expect(screen.getByText('J')).toBeInTheDocument()
    })

    it('should show fallback when no src provided', () => {
      const avatars: AvatarGroupAvatar[] = [{ name: 'Test User' }]

      render(<AvatarGroup avatars={avatars} />)
      expect(screen.getAllByTestId('avatar-fallback')).toHaveLength(1)
    })
  })

  describe('Overflow Handling', () => {
    it('should display overflow count when exceeding maxVisible', () => {
      const avatars: AvatarGroupAvatar[] = [
        { name: 'User 1' },
        { name: 'User 2' },
        { name: 'User 3' },
        { name: 'User 4' },
        { name: 'User 5' },
        { name: 'User 6' },
      ]

      render(<AvatarGroup avatars={avatars} maxVisible={3} />)

      expect(screen.getByText('+3')).toBeInTheDocument()
    })

    it('should not display overflow when within maxVisible', () => {
      const avatars: AvatarGroupAvatar[] = [
        { name: 'User 1' },
        { name: 'User 2' },
        { name: 'User 3' },
      ]

      render(<AvatarGroup avatars={avatars} maxVisible={5} />)

      expect(screen.queryByText(/\+/)).not.toBeInTheDocument()
    })

    it('should use default maxVisible of 5', () => {
      const avatars: AvatarGroupAvatar[] = Array.from({ length: 10 }, (_, i) => ({
        name: `User ${i + 1}`,
      }))

      render(<AvatarGroup avatars={avatars} />)

      expect(screen.getByText('+5')).toBeInTheDocument()
    })
  })

  describe('Size Prop', () => {
    it('should accept numeric size', () => {
      const avatars: AvatarGroupAvatar[] = [{ name: 'User' }]

      render(<AvatarGroup avatars={avatars} size={48} />)
      expect(screen.getByTestId('avatar-group')).toBeInTheDocument()
    })

    it('should accept Tamagui size token', () => {
      const avatars: AvatarGroupAvatar[] = [{ name: 'User' }]

      render(<AvatarGroup avatars={avatars} size="$6" />)
      expect(screen.getByTestId('avatar-group')).toBeInTheDocument()
    })

    it('should use default size when not specified', () => {
      const avatars: AvatarGroupAvatar[] = [{ name: 'User' }]

      render(<AvatarGroup avatars={avatars} />)
      expect(screen.getByTestId('avatar-group')).toBeInTheDocument()
    })
  })

  // TODO: Single Avatar component differences
  // FRS-Prototype had a single Avatar component:
  // - Single avatar display: <Avatar src="..." alt="..." fallback="JD" size="lg" />
  // - Size variants: 'sm' | 'md' | 'lg' | 'xl'
  // - Individual fallback text prop
  //
  // UNI-Construct has AvatarGroup:
  // - Array-based: avatars prop with multiple avatar objects
  // - Automatic initial generation from name
  // - Built-in overflow handling with maxVisible
  // - Overlapping layout design
  //
  // If single Avatar API is needed, either:
  // 1. Use AvatarGroup with single-item array
  // 2. Create a separate Avatar component that wraps Tamagui's Avatar
  // 3. Use Tamagui's Avatar directly: import { Avatar } from 'tamagui'
})
