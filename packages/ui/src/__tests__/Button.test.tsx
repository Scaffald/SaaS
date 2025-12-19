/**
 * Button Component Tests - UNI-Construct @unicornlove/ui
 *
 * Migrated from FRS-Prototype packages/core
 * Tests for the Tamagui-based Button component with variants, sizes, and states.
 */

import { describe, it, expect, vi } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import { Button } from '../components/buttons/Button'

// Mock Tamagui's styled components for testing
vi.mock('tamagui', async () => {
  const React = await import('react')
  return {
    styled: (_component: unknown, config: Record<string, unknown>) => {
      const StyledComponent = React.forwardRef<HTMLElement, Record<string, unknown>>(
        ({ children, onPress, disabled, ...props }, ref) => {
          const handleClick = (e: React.MouseEvent) => {
            if (!disabled && onPress) {
              ;(onPress as (e: unknown) => void)(e)
            }
          }
          return React.createElement(
            'button',
            {
              ref,
              disabled,
              onClick: handleClick,
              'data-name': config.name,
              ...props,
            },
            children
          )
        }
      )
      StyledComponent.displayName = (config.name as string) || 'StyledComponent'
      return StyledComponent
    },
    Button: React.forwardRef<HTMLButtonElement, Record<string, unknown>>(
      ({ children, onPress, disabled, ...props }, ref) => {
        const handleClick = (e: React.MouseEvent) => {
          if (!disabled && onPress) {
            ;(onPress as (e: unknown) => void)(e)
          }
        }
        return React.createElement(
          'button',
          { ref, disabled, onClick: handleClick, ...props },
          children
        )
      }
    ),
    XStack: ({ children, ...props }: Record<string, unknown>) =>
      React.createElement('div', props, children as React.ReactNode),
    Spinner: () => React.createElement('div', { 'data-testid': 'spinner' }),
  }
})

describe('Button Component', () => {
  describe('Basic Rendering', () => {
    it('should render button with text content', () => {
      render(<Button>Click me</Button>)

      const button = screen.getByRole('button')
      expect(button).toBeInTheDocument()
      expect(button).toHaveTextContent('Click me')
    })

    it('should render as a button element', () => {
      render(<Button>Submit</Button>)

      const button = screen.getByRole('button')
      expect(button.tagName).toBe('BUTTON')
    })
  })

  describe('Variants', () => {
    it('should accept primary variant', () => {
      render(<Button variant="primary">Primary</Button>)

      const button = screen.getByRole('button')
      expect(button).toBeInTheDocument()
    })

    it('should accept secondary variant', () => {
      render(<Button variant="secondary">Secondary</Button>)

      const button = screen.getByRole('button')
      expect(button).toBeInTheDocument()
    })

    it('should accept outlined variant', () => {
      render(<Button variant="outlined">Outlined</Button>)

      const button = screen.getByRole('button')
      expect(button).toBeInTheDocument()
    })

    it('should accept ghost variant', () => {
      render(<Button variant="ghost">Ghost</Button>)

      const button = screen.getByRole('button')
      expect(button).toBeInTheDocument()
    })

    it('should accept danger variant', () => {
      render(<Button variant="danger">Danger</Button>)

      const button = screen.getByRole('button')
      expect(button).toBeInTheDocument()
    })
  })

  describe('Sizes', () => {
    // TODO: Verify size prop API - UNI-Construct Button uses Tamagui size tokens ($1-$10)
    // FRS-Prototype used sm/md/lg - need to check if size prop is supported
    it('should accept size prop', () => {
      render(<Button size="$4">Medium</Button>)

      const button = screen.getByRole('button')
      expect(button).toBeInTheDocument()
    })
  })

  describe('User Interactions', () => {
    it('should call onPress handler when clicked', () => {
      const handlePress = vi.fn()

      render(<Button onPress={handlePress}>Click me</Button>)

      const button = screen.getByRole('button')
      fireEvent.click(button)

      expect(handlePress).toHaveBeenCalledTimes(1)
    })

    it('should not call onPress when disabled', () => {
      const handlePress = vi.fn()

      render(
        <Button onPress={handlePress} disabled>
          Disabled
        </Button>
      )

      const button = screen.getByRole('button')
      fireEvent.click(button)

      expect(handlePress).not.toHaveBeenCalled()
    })
  })

  describe('Disabled State', () => {
    it('should be disabled when disabled prop is true', () => {
      render(<Button disabled>Disabled</Button>)

      const button = screen.getByRole('button')
      expect(button).toBeDisabled()
    })

    it('should not be disabled by default', () => {
      render(<Button>Enabled</Button>)

      const button = screen.getByRole('button')
      expect(button).not.toBeDisabled()
    })
  })

  describe('Icon Support', () => {
    // TODO: Verify icon API - UNI-Construct Button has Button.Icon compound component
    // FRS-Prototype used icon prop - need to test Button.Icon pattern instead
    it('should support Button.Icon compound component', () => {
      const MockIcon = () => <span data-testid="mock-icon">icon</span>

      render(
        <Button>
          <Button.Icon>
            <MockIcon />
          </Button.Icon>
          <Button.Text>With Icon</Button.Text>
        </Button>
      )

      const button = screen.getByRole('button')
      expect(button).toBeInTheDocument()
      expect(screen.getByTestId('mock-icon')).toBeInTheDocument()
    })
  })

  describe('Tone Support', () => {
    // UNI-Construct Button uses theme prop instead of tone
    it('should accept theme prop', () => {
      render(<Button theme="success">Success Theme</Button>)

      const button = screen.getByRole('button')
      expect(button).toBeInTheDocument()
    })

    it('should accept blue theme', () => {
      render(<Button theme="blue">Blue Theme</Button>)

      const button = screen.getByRole('button')
      expect(button).toBeInTheDocument()
    })

    it('should accept error theme', () => {
      render(<Button theme="error">Error Theme</Button>)

      const button = screen.getByRole('button')
      expect(button).toBeInTheDocument()
    })
  })
})
