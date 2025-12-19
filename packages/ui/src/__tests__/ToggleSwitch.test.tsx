/**
 * ToggleSwitch Component Tests
 * REQ-288: Tamagui UI Component Library
 *
 * MIGRATED FROM: FRS-Prototype/packages/forms/src/__tests__/ToggleSwitch.test.tsx
 * Migration Notes:
 * - Updated import path to use ToggleSwitch from ../components/inputs/ToggleSwitch
 * - TODO: Verify ToggleSwitch API matches (checked, onCheckedChange, disabled, size props)
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
    XStack: ({ children, ...props }: Record<string, unknown>) => React.createElement('div', { 'data-testid': 'xstack', ...props }, children as React.ReactNode),
    View: ({ children, ...props }: Record<string, unknown>) => React.createElement('div', props, children as React.ReactNode),
  }
})

// Mock react-native Platform
vi.mock('react-native', () => ({
  Platform: { OS: 'web' },
}))

import { ToggleSwitch } from '../components/inputs/ToggleSwitch'

describe('ToggleSwitch Component', () => {
  describe('Basic Rendering', () => {
    it('should render switch', () => {
      const onCheckedChange = vi.fn()
      render(<ToggleSwitch checked={false} onCheckedChange={onCheckedChange} />)

      expect(screen.getByRole('switch')).toBeInTheDocument()
    })

    it('should render unchecked switch', () => {
      const onCheckedChange = vi.fn()
      render(<ToggleSwitch checked={false} onCheckedChange={onCheckedChange} />)

      expect(screen.getByRole('switch')).toHaveAttribute('aria-checked', 'false')
    })

    it('should render checked switch', () => {
      const onCheckedChange = vi.fn()
      render(<ToggleSwitch checked={true} onCheckedChange={onCheckedChange} />)

      expect(screen.getByRole('switch')).toHaveAttribute('aria-checked', 'true')
    })
  })

  describe('Click Behavior', () => {
    it('should call onCheckedChange with true when unchecked switch is clicked', () => {
      const onCheckedChange = vi.fn()
      render(<ToggleSwitch checked={false} onCheckedChange={onCheckedChange} />)

      fireEvent.click(screen.getByRole('switch'))

      expect(onCheckedChange).toHaveBeenCalledWith(true)
    })

    it('should call onCheckedChange with false when checked switch is clicked', () => {
      const onCheckedChange = vi.fn()
      render(<ToggleSwitch checked={true} onCheckedChange={onCheckedChange} />)

      fireEvent.click(screen.getByRole('switch'))

      expect(onCheckedChange).toHaveBeenCalledWith(false)
    })

    it('should not call onCheckedChange when disabled', () => {
      const onCheckedChange = vi.fn()
      render(<ToggleSwitch checked={false} onCheckedChange={onCheckedChange} disabled />)

      fireEvent.click(screen.getByRole('switch'))

      expect(onCheckedChange).not.toHaveBeenCalled()
    })
  })

  describe('Disabled State', () => {
    it('should have aria-disabled when disabled', () => {
      const onCheckedChange = vi.fn()
      render(<ToggleSwitch checked={false} onCheckedChange={onCheckedChange} disabled />)

      expect(screen.getByRole('switch')).toHaveAttribute('aria-disabled', 'true')
    })

    it('should not toggle when disabled and checked', () => {
      const onCheckedChange = vi.fn()
      render(<ToggleSwitch checked={true} onCheckedChange={onCheckedChange} disabled />)

      fireEvent.click(screen.getByRole('switch'))

      expect(onCheckedChange).not.toHaveBeenCalled()
    })
  })

  describe('Sizes', () => {
    it('should render small switch', () => {
      const onCheckedChange = vi.fn()
      render(<ToggleSwitch checked={false} onCheckedChange={onCheckedChange} size="sm" />)

      expect(screen.getByRole('switch')).toBeInTheDocument()
    })

    it('should render medium switch (default)', () => {
      const onCheckedChange = vi.fn()
      render(<ToggleSwitch checked={false} onCheckedChange={onCheckedChange} size="md" />)

      expect(screen.getByRole('switch')).toBeInTheDocument()
    })

    it('should render large switch', () => {
      const onCheckedChange = vi.fn()
      render(<ToggleSwitch checked={false} onCheckedChange={onCheckedChange} size="lg" />)

      expect(screen.getByRole('switch')).toBeInTheDocument()
    })
  })

  describe('Accessibility', () => {
    it('should have switch role', () => {
      const onCheckedChange = vi.fn()
      render(<ToggleSwitch checked={false} onCheckedChange={onCheckedChange} />)

      expect(screen.getByRole('switch')).toBeInTheDocument()
    })

    it('should have correct aria-checked for unchecked state', () => {
      const onCheckedChange = vi.fn()
      render(<ToggleSwitch checked={false} onCheckedChange={onCheckedChange} />)

      expect(screen.getByRole('switch')).toHaveAttribute('aria-checked', 'false')
    })

    it('should have correct aria-checked for checked state', () => {
      const onCheckedChange = vi.fn()
      render(<ToggleSwitch checked={true} onCheckedChange={onCheckedChange} />)

      expect(screen.getByRole('switch')).toHaveAttribute('aria-checked', 'true')
    })
  })

  describe('State Transitions', () => {
    it('should toggle from off to on', () => {
      const onCheckedChange = vi.fn()
      const { rerender } = render(
        <ToggleSwitch checked={false} onCheckedChange={onCheckedChange} />
      )

      expect(screen.getByRole('switch')).toHaveAttribute('aria-checked', 'false')

      rerender(<ToggleSwitch checked={true} onCheckedChange={onCheckedChange} />)

      expect(screen.getByRole('switch')).toHaveAttribute('aria-checked', 'true')
    })

    it('should toggle from on to off', () => {
      const onCheckedChange = vi.fn()
      const { rerender } = render(
        <ToggleSwitch checked={true} onCheckedChange={onCheckedChange} />
      )

      expect(screen.getByRole('switch')).toHaveAttribute('aria-checked', 'true')

      rerender(<ToggleSwitch checked={false} onCheckedChange={onCheckedChange} />)

      expect(screen.getByRole('switch')).toHaveAttribute('aria-checked', 'false')
    })
  })
})
