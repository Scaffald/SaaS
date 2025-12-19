/**
 * Badge Component Tests - UNI-Construct @unicornlove/ui
 *
 * Migrated from FRS-Prototype packages/core
 * Tests for the CardBadges component (replaces simple Badge component).
 *
 * NOTE: FRS-Prototype had a simple Badge component with variant/size props.
 * UNI-Construct has CardBadges which displays an array of badge objects.
 * Tests have been significantly adapted to the new API.
 */

import { describe, it, expect, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import { CardBadges } from '../components/cards/CardBadges'
import type { CardBadge } from '../components/cards/types'

// Mock Tamagui's styled components for testing
vi.mock('tamagui', async () => {
  const React = await import('react')
  return {
    styled: (_component: unknown, config: Record<string, unknown>) => {
      const StyledComponent = ({ children, ...props }: Record<string, unknown>) =>
        React.createElement(
          'span',
          { 'data-name': config.name, ...props },
          children as React.ReactNode
        )
      return StyledComponent
    },
    XStack: ({ children, ...props }: Record<string, unknown>) =>
      React.createElement('div', props, children as React.ReactNode),
    Text: ({ children, ...props }: Record<string, unknown>) =>
      React.createElement('span', props, children as React.ReactNode),
  }
})

// Mock Chip component used by CardBadges
vi.mock('../components/chips/Chip', () => ({
  Chip: ({ children, ...props }: Record<string, unknown>) => (
    <span data-testid="chip" {...props}>
      {children}
    </span>
  ),
}))

describe('CardBadges Component', () => {
  describe('Basic Rendering', () => {
    it('should render single badge', () => {
      const badges: CardBadge[] = [
        { key: '1', label: 'New', bg: '$blue10', color: '$color1' },
      ]

      render(<CardBadges badges={badges} />)
      expect(screen.getByText('New')).toBeInTheDocument()
    })

    it('should render multiple badges', () => {
      const badges: CardBadge[] = [
        { key: '1', label: 'React', bg: '$blue10', color: '$color1' },
        { key: '2', label: 'TypeScript', bg: '$blue10', color: '$color1' },
        { key: '3', label: 'Node.js', bg: '$green10', color: '$color1' },
      ]

      render(<CardBadges badges={badges} />)
      expect(screen.getByText('React')).toBeInTheDocument()
      expect(screen.getByText('TypeScript')).toBeInTheDocument()
      expect(screen.getByText('Node.js')).toBeInTheDocument()
    })

    it('should render nothing when badges array is empty', () => {
      const { container } = render(<CardBadges badges={[]} />)
      expect(container.firstChild).toBeNull()
    })
  })

  describe('Overflow Handling', () => {
    it('should display overflow count when exceeding maxVisible', () => {
      const badges: CardBadge[] = [
        { key: '1', label: 'Badge 1', bg: '$blue10', color: '$color1' },
        { key: '2', label: 'Badge 2', bg: '$blue10', color: '$color1' },
        { key: '3', label: 'Badge 3', bg: '$blue10', color: '$color1' },
        { key: '4', label: 'Badge 4', bg: '$blue10', color: '$color1' },
        { key: '5', label: 'Badge 5', bg: '$blue10', color: '$color1' },
        { key: '6', label: 'Badge 6', bg: '$blue10', color: '$color1' },
      ]

      render(<CardBadges badges={badges} maxVisible={3} />)

      expect(screen.getByText('Badge 1')).toBeInTheDocument()
      expect(screen.getByText('Badge 2')).toBeInTheDocument()
      expect(screen.getByText('Badge 3')).toBeInTheDocument()
      expect(screen.queryByText('Badge 4')).not.toBeInTheDocument()
      expect(screen.getByText('+3 more')).toBeInTheDocument()
    })

    it('should not display overflow when within maxVisible', () => {
      const badges: CardBadge[] = [
        { key: '1', label: 'Badge 1', bg: '$blue10', color: '$color1' },
        { key: '2', label: 'Badge 2', bg: '$blue10', color: '$color1' },
      ]

      render(<CardBadges badges={badges} maxVisible={5} />)

      expect(screen.getByText('Badge 1')).toBeInTheDocument()
      expect(screen.getByText('Badge 2')).toBeInTheDocument()
      expect(screen.queryByText(/more/)).not.toBeInTheDocument()
    })
  })

  describe('Badge Colors', () => {
    it('should apply custom background and text colors', () => {
      const badges: CardBadge[] = [
        { key: '1', label: 'Custom', bg: '$red9', color: '$color1' },
      ]

      render(<CardBadges badges={badges} />)
      expect(screen.getByText('Custom')).toBeInTheDocument()
    })

    it('should use default colors when not specified', () => {
      const badges: CardBadge[] = [{ key: '1', label: 'Default' }]

      render(<CardBadges badges={badges} />)
      expect(screen.getByText('Default')).toBeInTheDocument()
    })
  })

  describe('Icon Support', () => {
    it('should render badge with icon', () => {
      const MockIcon = () => <svg data-testid="mock-icon" />
      const badges: CardBadge[] = [
        {
          key: '1',
          label: 'With Icon',
          icon: <MockIcon />,
          bg: '$blue10',
          color: '$color1',
        },
      ]

      render(<CardBadges badges={badges} />)
      expect(screen.getByText('With Icon')).toBeInTheDocument()
      expect(screen.getByTestId('mock-icon')).toBeInTheDocument()
    })
  })

  describe('Selection State', () => {
    it('should handle isSelected prop for overflow color', () => {
      const badges: CardBadge[] = [
        { key: '1', label: 'Badge 1', bg: '$blue10', color: '$color1' },
        { key: '2', label: 'Badge 2', bg: '$blue10', color: '$color1' },
        { key: '3', label: 'Badge 3', bg: '$blue10', color: '$color1' },
      ]

      render(<CardBadges badges={badges} maxVisible={2} isSelected />)
      expect(screen.getByText('+1 more')).toBeInTheDocument()
    })
  })

  // TODO: Original Badge component API differences
  // FRS-Prototype Badge had:
  // - variant prop: 'default' | 'success' | 'warning' | 'error' | 'info' | 'outline'
  // - size prop: 'sm' | 'md' | 'lg'
  // - Direct text children: <Badge>Text</Badge>
  //
  // UNI-Construct CardBadges:
  // - Array of badge objects with key, label, bg, color, icon
  // - maxVisible prop for overflow handling
  // - isSelected prop for styling
  //
  // If original Badge API is needed, a separate Badge component should be created.
})
