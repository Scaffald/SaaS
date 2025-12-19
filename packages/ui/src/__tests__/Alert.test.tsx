/**
 * Alert Component Tests - UNI-Construct @unicornlove/ui
 *
 * Tests for the Alert component migrated from forsured-web.
 * Provides contextual feedback messages with different variants.
 */

import { describe, it, expect, vi } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import { Alert } from '../components/alert'

// Mock Tamagui's styled components for testing
vi.mock('@tamagui/core', async () => {
  const React = await import('react')
  return {
    styled: (component: unknown, config: Record<string, unknown>) => {
      const StyledComponent = ({ children, variant, className, ...props }: Record<string, unknown>) => {
        const Component = typeof component === 'string' ? component : 'div'
        return React.createElement(
          Component,
          { 'data-name': config.name, 'data-variant': variant, className, ...props },
          children as React.ReactNode
        )
      }
      return StyledComponent
    },
    YStack: ({ children, ...props }: Record<string, unknown>) =>
      React.createElement('div', { ...props, 'data-component': 'YStack' }, children as React.ReactNode),
    XStack: ({ children, ...props }: Record<string, unknown>) =>
      React.createElement('div', { ...props, 'data-component': 'XStack' }, children as React.ReactNode),
    Text: ({ children, ...props }: Record<string, unknown>) =>
      React.createElement('span', props, children as React.ReactNode),
    useTheme: () => ({
      blue9: { val: '#0066CC' },
      green9: { val: '#00AA00' },
      orange9: { val: '#FF8800' },
      red9: { val: '#DD0000' },
    }),
  }
})

// Mock lucide-react icons
vi.mock('lucide-react', () => ({
  Info: ({ color, size }: { color: string; size: number }) => (
    <svg data-testid="info-icon" data-color={color} data-size={size} />
  ),
  CheckCircle: ({ color, size }: { color: string; size: number }) => (
    <svg data-testid="check-circle-icon" data-color={color} data-size={size} />
  ),
  AlertTriangle: ({ color, size }: { color: string; size: number }) => (
    <svg data-testid="alert-triangle-icon" data-color={color} data-size={size} />
  ),
  XCircle: ({ color, size }: { color: string; size: number }) => (
    <svg data-testid="x-circle-icon" data-color={color} data-size={size} />
  ),
  X: ({ color, size }: { color: string; size: number }) => (
    <svg data-testid="x-icon" data-color={color} data-size={size} />
  ),
}))

// Mock Button component
vi.mock('../components/buttons', () => ({
  Button: ({ children, onPress, ...props }: Record<string, unknown>) =>
    React.createElement(
      'button',
      { onClick: onPress as () => void, ...props },
      children as React.ReactNode
    ),
}))

describe('Alert Component', () => {
  describe('Basic Rendering', () => {
    it('renders with default info variant', () => {
      render(<Alert>Test message</Alert>)
      expect(screen.getByText('Test message')).toBeInTheDocument()
      expect(screen.getByTestId('info-icon')).toBeInTheDocument()
    })

    it('renders with title', () => {
      render(<Alert title="Alert Title">Content</Alert>)
      expect(screen.getByText('Alert Title')).toBeInTheDocument()
      expect(screen.getByText('Content')).toBeInTheDocument()
    })

    it('renders without title', () => {
      render(<Alert>Content only</Alert>)
      expect(screen.queryByText('Alert Title')).not.toBeInTheDocument()
      expect(screen.getByText('Content only')).toBeInTheDocument()
    })
  })

  describe('Variants', () => {
    it('renders info variant with Info icon', () => {
      render(<Alert variant="info">Info message</Alert>)
      expect(screen.getByText('Info message')).toBeInTheDocument()
      expect(screen.getByTestId('info-icon')).toBeInTheDocument()
    })

    it('renders success variant with CheckCircle icon', () => {
      render(<Alert variant="success">Success message</Alert>)
      expect(screen.getByText('Success message')).toBeInTheDocument()
      expect(screen.getByTestId('check-circle-icon')).toBeInTheDocument()
    })

    it('renders warning variant with AlertTriangle icon', () => {
      render(<Alert variant="warning">Warning message</Alert>)
      expect(screen.getByText('Warning message')).toBeInTheDocument()
      expect(screen.getByTestId('alert-triangle-icon')).toBeInTheDocument()
    })

    it('renders error variant with XCircle icon', () => {
      render(<Alert variant="error">Error message</Alert>)
      expect(screen.getByText('Error message')).toBeInTheDocument()
      expect(screen.getByTestId('x-circle-icon')).toBeInTheDocument()
    })
  })

  describe('Icon Display', () => {
    it('displays icon by default', () => {
      render(<Alert>Message with icon</Alert>)
      expect(screen.getByTestId('info-icon')).toBeInTheDocument()
    })

    it('hides icon when icon prop is false', () => {
      render(<Alert icon={false}>Message without icon</Alert>)
      expect(screen.queryByTestId('info-icon')).not.toBeInTheDocument()
    })
  })

  describe('Close Button', () => {
    it('does not show close button by default', () => {
      render(<Alert>Message</Alert>)
      expect(screen.queryByLabelText('Dismiss')).not.toBeInTheDocument()
    })

    it('shows close button when closable is true and onClose provided', () => {
      const handleClose = vi.fn()
      render(
        <Alert closable onClose={handleClose}>
          Message
        </Alert>
      )
      expect(screen.getByLabelText('Dismiss')).toBeInTheDocument()
    })

    it('calls onClose when close button is clicked', () => {
      const handleClose = vi.fn()
      render(
        <Alert closable onClose={handleClose}>
          Message
        </Alert>
      )

      const closeButton = screen.getByLabelText('Dismiss')
      fireEvent.click(closeButton)

      expect(handleClose).toHaveBeenCalledTimes(1)
    })

    it('does not show close button when closable is true but no onClose', () => {
      render(<Alert closable>Message</Alert>)
      expect(screen.queryByLabelText('Dismiss')).not.toBeInTheDocument()
    })

    it('does not show close button when onClose provided but closable is false', () => {
      const handleClose = vi.fn()
      render(<Alert onClose={handleClose}>Message</Alert>)
      expect(screen.queryByLabelText('Dismiss')).not.toBeInTheDocument()
    })
  })


  describe('Accessibility', () => {
    it('has proper aria-label on close button', () => {
      const handleClose = vi.fn()
      render(
        <Alert closable onClose={handleClose}>
          Message
        </Alert>
      )
      expect(screen.getByLabelText('Dismiss')).toBeInTheDocument()
    })
  })
})
