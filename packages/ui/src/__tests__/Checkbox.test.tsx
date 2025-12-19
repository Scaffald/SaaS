/**
 * Checkbox Component Tests
 * REQ-288: Tamagui UI Component Library
 *
 * MIGRATED FROM: FRS-Prototype/packages/forms/src/__tests__/Checkbox.test.tsx
 * Migration Notes:
 * - Updated import path to use Checkbox from ../components/inputs/Checkbox
 * - Component exported as CustomCheckbox in index.ts - using direct import here
 * - TODO: Verify Checkbox API matches (checked, onCheckedChange, disabled, size props)
 */

import { describe, it, expect, vi } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'

// Mock Tamagui before importing component
vi.mock('tamagui', async () => {
  const React = await import('react')
  return {
    styled: (_component: unknown, config: Record<string, unknown>) => {
      const StyledComponent = React.forwardRef<HTMLElement, Record<string, unknown>>(
        ({ children, onPress, ...props }, ref) => {
          const handleClick = (e: React.MouseEvent) => {
            if (onPress) (onPress as (e: unknown) => void)(e)
          }
          return React.createElement('div', { ref, onClick: handleClick, 'data-name': config.name, ...props }, children)
        }
      )
      StyledComponent.displayName = (config.name as string) || 'StyledComponent'
      return StyledComponent
    },
    View: ({ children, ...props }: Record<string, unknown>) => React.createElement('div', props, children as React.ReactNode),
  }
})

// Mock lucide icons
vi.mock('@tamagui/lucide-icons', async () => {
  const React = await import('react')
  return {
    Check: () => React.createElement('svg', { 'data-testid': 'check-icon' }),
  }
})

// Mock react-native Platform
vi.mock('react-native', () => ({
  Platform: { OS: 'web' },
}))

import { Checkbox } from '../components/inputs/Checkbox'

describe('Checkbox Component', () => {
  describe('Basic Rendering', () => {
    it('should render unchecked checkbox', () => {
      const onCheckedChange = vi.fn()
      render(<Checkbox checked={false} onCheckedChange={onCheckedChange} />)

      expect(screen.getByRole('checkbox')).toBeInTheDocument()
    })

    it('should render checked checkbox', () => {
      const onCheckedChange = vi.fn()
      render(<Checkbox checked={true} onCheckedChange={onCheckedChange} />)

      const checkbox = screen.getByRole('checkbox')
      expect(checkbox).toHaveAttribute('aria-checked', 'true')
    })

    it('should render check icon when checked', () => {
      const onCheckedChange = vi.fn()
      render(<Checkbox checked={true} onCheckedChange={onCheckedChange} />)

      expect(screen.getByTestId('check-icon')).toBeInTheDocument()
    })
  })

  describe('Click Behavior', () => {
    it('should call onCheckedChange with true when unchecked checkbox is clicked', () => {
      const onCheckedChange = vi.fn()
      render(<Checkbox checked={false} onCheckedChange={onCheckedChange} />)

      fireEvent.click(screen.getByRole('checkbox'))

      expect(onCheckedChange).toHaveBeenCalledWith(true)
    })

    it('should call onCheckedChange with false when checked checkbox is clicked', () => {
      const onCheckedChange = vi.fn()
      render(<Checkbox checked={true} onCheckedChange={onCheckedChange} />)

      fireEvent.click(screen.getByRole('checkbox'))

      expect(onCheckedChange).toHaveBeenCalledWith(false)
    })

    it('should not call onCheckedChange when disabled', () => {
      const onCheckedChange = vi.fn()
      render(<Checkbox checked={false} onCheckedChange={onCheckedChange} disabled />)

      fireEvent.click(screen.getByRole('checkbox'))

      expect(onCheckedChange).not.toHaveBeenCalled()
    })
  })

  describe('Disabled State', () => {
    it('should have aria-disabled when disabled', () => {
      const onCheckedChange = vi.fn()
      render(<Checkbox checked={false} onCheckedChange={onCheckedChange} disabled />)

      expect(screen.getByRole('checkbox')).toHaveAttribute('aria-disabled', 'true')
    })

    it('should not toggle when disabled and checked', () => {
      const onCheckedChange = vi.fn()
      render(<Checkbox checked={true} onCheckedChange={onCheckedChange} disabled />)

      fireEvent.click(screen.getByRole('checkbox'))

      expect(onCheckedChange).not.toHaveBeenCalled()
    })
  })

  describe('Sizes', () => {
    it('should render small checkbox', () => {
      const onCheckedChange = vi.fn()
      render(<Checkbox checked={false} onCheckedChange={onCheckedChange} size="sm" />)

      expect(screen.getByRole('checkbox')).toBeInTheDocument()
    })

    it('should render medium checkbox (default)', () => {
      const onCheckedChange = vi.fn()
      render(<Checkbox checked={false} onCheckedChange={onCheckedChange} size="md" />)

      expect(screen.getByRole('checkbox')).toBeInTheDocument()
    })

    it('should render large checkbox', () => {
      const onCheckedChange = vi.fn()
      render(<Checkbox checked={false} onCheckedChange={onCheckedChange} size="lg" />)

      expect(screen.getByRole('checkbox')).toBeInTheDocument()
    })
  })

  describe('Accessibility', () => {
    it('should have checkbox role', () => {
      const onCheckedChange = vi.fn()
      render(<Checkbox checked={false} onCheckedChange={onCheckedChange} />)

      expect(screen.getByRole('checkbox')).toBeInTheDocument()
    })

    it('should have correct aria-checked for unchecked state', () => {
      const onCheckedChange = vi.fn()
      render(<Checkbox checked={false} onCheckedChange={onCheckedChange} />)

      expect(screen.getByRole('checkbox')).toHaveAttribute('aria-checked', 'false')
    })

    it('should have correct aria-checked for checked state', () => {
      const onCheckedChange = vi.fn()
      render(<Checkbox checked={true} onCheckedChange={onCheckedChange} />)

      expect(screen.getByRole('checkbox')).toHaveAttribute('aria-checked', 'true')
    })
  })
})
