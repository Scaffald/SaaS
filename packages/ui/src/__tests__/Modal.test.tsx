/**
 * MIGRATED from FRS-Prototype/packages/layout/src/__tests__/Modal.test.tsx
 * ResponsiveModal Component Tests
 * REQ-288: Tamagui UI Component Library
 *
 * TODO: Update test expectations for ResponsiveModal API differences:
 * - Old API: open, onClose, title, size, showCloseButton
 * - New API: open, onOpenChange, title, size, showHeader, showCloseButton
 * - Component adapts to viewport: Dialog (desktop) vs Sheet (mobile)
 * - May need to mock useWindowDimensions for responsive testing
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
    YStack: ({ children, ...props }: Record<string, unknown>) => React.createElement('div', { 'data-testid': 'ystack', ...props }, children as React.ReactNode),
    XStack: ({ children, ...props }: Record<string, unknown>) => React.createElement('div', { 'data-testid': 'xstack', ...props }, children as React.ReactNode),
    View: ({ children, ...props }: Record<string, unknown>) => React.createElement('div', props, children as React.ReactNode),
    Text: ({ children, ...props }: Record<string, unknown>) => React.createElement('span', props, children as React.ReactNode),
    AnimatePresence: ({ children }: { children: React.ReactNode }) => children,
    ScrollView: ({ children, ...props }: Record<string, unknown>) => React.createElement('div', { 'data-testid': 'scrollview', ...props }, children as React.ReactNode),
    useWindowDimensions: () => ({ width: 1024, height: 768 }), // Desktop by default
  }
})

// Mock lucide icons
vi.mock('@tamagui/lucide-icons', async () => {
  const React = await import('react')
  return {
    X: () => React.createElement('svg', { 'data-testid': 'close-icon' }),
  }
})

// Mock Dialog component
vi.mock('../components/dialog/Dialog', () => {
  const React = require('react')
  const Dialog = ({ children, open }: { children: React.ReactNode; open: boolean }) =>
    open ? React.createElement('div', { 'data-testid': 'dialog' }, children) : null

  Dialog.Portal = ({ children }: { children: React.ReactNode }) =>
    React.createElement('div', { 'data-testid': 'dialog-portal' }, children)
  Dialog.Overlay = () => React.createElement('div', { 'data-testid': 'dialog-overlay' })
  Dialog.Content = ({ children, ...props }: Record<string, unknown>) =>
    React.createElement('div', { 'data-testid': 'dialog-content', ...props }, children)
  Dialog.Title = ({ children, ...props }: Record<string, unknown>) =>
    React.createElement('h2', { 'data-testid': 'dialog-title', ...props }, children)
  Dialog.Close = ({ children }: { children: React.ReactNode }) =>
    React.createElement('div', { 'data-testid': 'dialog-close' }, children)

  return { Dialog }
})

// Mock Sheet component
vi.mock('../components/sheets/Sheet', () => {
  const React = require('react')
  const Sheet = ({ children, open }: { children: React.ReactNode; open: boolean }) =>
    open ? React.createElement('div', { 'data-testid': 'sheet' }, children) : null

  Sheet.Overlay = () => React.createElement('div', { 'data-testid': 'sheet-overlay' })
  Sheet.Frame = ({ children, ...props }: Record<string, unknown>) =>
    React.createElement('div', { 'data-testid': 'sheet-frame', ...props }, children)
  Sheet.Handle = () => React.createElement('div', { 'data-testid': 'sheet-handle' })

  return { Sheet }
})

import { ResponsiveModal } from '../components/modal/ResponsiveModal'

describe('ResponsiveModal Component', () => {
  describe('Basic Rendering', () => {
    it('should not render when closed', () => {
      const onOpenChange = vi.fn()
      render(
        <ResponsiveModal open={false} onOpenChange={onOpenChange} title="Test">
          <div>Modal Content</div>
        </ResponsiveModal>
      )

      expect(screen.queryByText('Modal Content')).not.toBeInTheDocument()
    })

    it('should render when open', () => {
      const onOpenChange = vi.fn()
      render(
        <ResponsiveModal open={true} onOpenChange={onOpenChange} title="Modal Title">
          <div>Modal Content</div>
        </ResponsiveModal>
      )

      expect(screen.getByText('Modal Content')).toBeInTheDocument()
    })

    it('should render title when provided', () => {
      const onOpenChange = vi.fn()
      render(
        <ResponsiveModal open={true} onOpenChange={onOpenChange} title="Modal Title">
          <div>Content</div>
        </ResponsiveModal>
      )

      expect(screen.getByText('Modal Title')).toBeInTheDocument()
    })
  })

  describe('Close Button', () => {
    it('should show close button by default', () => {
      const onOpenChange = vi.fn()
      render(
        <ResponsiveModal open={true} onOpenChange={onOpenChange} title="Test">
          <div>Content</div>
        </ResponsiveModal>
      )

      expect(screen.getByTestId('close-icon')).toBeInTheDocument()
    })

    it('should hide close button when showCloseButton is false', () => {
      const onOpenChange = vi.fn()
      render(
        <ResponsiveModal open={true} onOpenChange={onOpenChange} title="Test" showCloseButton={false}>
          <div>Content</div>
        </ResponsiveModal>
      )

      expect(screen.queryByTestId('close-icon')).not.toBeInTheDocument()
    })

    it('should call onOpenChange when close button is clicked', () => {
      const onOpenChange = vi.fn()
      render(
        <ResponsiveModal open={true} onOpenChange={onOpenChange} title="Test">
          <div>Content</div>
        </ResponsiveModal>
      )

      fireEvent.click(screen.getByTestId('close-icon'))

      expect(onOpenChange).toHaveBeenCalledWith(false)
    })
  })

  describe('Sizes', () => {
    it('should render small modal', () => {
      const onOpenChange = vi.fn()
      render(
        <ResponsiveModal open={true} onOpenChange={onOpenChange} title="Test" size="small">
          <div>Content</div>
        </ResponsiveModal>
      )

      expect(screen.getByText('Content')).toBeInTheDocument()
    })

    it('should render medium modal (default)', () => {
      const onOpenChange = vi.fn()
      render(
        <ResponsiveModal open={true} onOpenChange={onOpenChange} title="Test" size="medium">
          <div>Content</div>
        </ResponsiveModal>
      )

      expect(screen.getByText('Content')).toBeInTheDocument()
    })

    it('should render large modal', () => {
      const onOpenChange = vi.fn()
      render(
        <ResponsiveModal open={true} onOpenChange={onOpenChange} title="Test" size="large">
          <div>Content</div>
        </ResponsiveModal>
      )

      expect(screen.getByText('Content')).toBeInTheDocument()
    })

    it('should render full size modal', () => {
      const onOpenChange = vi.fn()
      render(
        <ResponsiveModal open={true} onOpenChange={onOpenChange} title="Test" size="full">
          <div>Content</div>
        </ResponsiveModal>
      )

      expect(screen.getByText('Content')).toBeInTheDocument()
    })
  })

  describe('Header Control', () => {
    it('should hide header when showHeader is false', () => {
      const onOpenChange = vi.fn()
      render(
        <ResponsiveModal open={true} onOpenChange={onOpenChange} title="Test" showHeader={false}>
          <div>Content</div>
        </ResponsiveModal>
      )

      expect(screen.queryByText('Test')).not.toBeInTheDocument()
      expect(screen.queryByTestId('close-icon')).not.toBeInTheDocument()
    })
  })

  describe('Content', () => {
    it('should render complex content', () => {
      const onOpenChange = vi.fn()
      render(
        <ResponsiveModal open={true} onOpenChange={onOpenChange} title="Form">
          <div>
            <h2>Form Header</h2>
            <input placeholder="Name" />
            <button>Submit</button>
          </div>
        </ResponsiveModal>
      )

      expect(screen.getByText('Form Header')).toBeInTheDocument()
      expect(screen.getByPlaceholderText('Name')).toBeInTheDocument()
      expect(screen.getByText('Submit')).toBeInTheDocument()
    })
  })

  describe('State Changes', () => {
    it('should show/hide based on open prop', () => {
      const onOpenChange = vi.fn()
      const { rerender } = render(
        <ResponsiveModal open={false} onOpenChange={onOpenChange} title="Test">
          <div>Content</div>
        </ResponsiveModal>
      )

      expect(screen.queryByText('Content')).not.toBeInTheDocument()

      rerender(
        <ResponsiveModal open={true} onOpenChange={onOpenChange} title="Test">
          <div>Content</div>
        </ResponsiveModal>
      )

      expect(screen.getByText('Content')).toBeInTheDocument()
    })
  })
})
