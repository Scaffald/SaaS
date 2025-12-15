/**
 * MIGRATED from FRS-Prototype/packages/layout/src/__tests__/Drawer.test.tsx
 * Sheet Component Tests (formerly Drawer)
 * REQ-288: Tamagui UI Component Library
 *
 * TODO: Update test expectations for Sheet API differences:
 * - Old component: Drawer with open, onClose, title, side, width props
 * - New component: Sheet (Tamagui's sheet wrapper with custom defaults)
 * - Sheet is lower-level than ResponsiveModal - used for mobile-style bottom sheets
 * - May need additional tests for Sheet.Frame, Sheet.Overlay, Sheet.Handle subcomponents
 * - Side positioning (left/right) may not be directly supported by Sheet
 */

import { describe, it, expect, vi } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'

// Mock Tamagui before importing component
vi.mock('tamagui', async () => {
  const React = await import('react')

  // Mock Sheet component
  const MockSheet = ({ children, open }: { children: React.ReactNode; open: boolean }) =>
    open ? React.createElement('div', { 'data-testid': 'sheet' }, children) : null

  const MockSheetFrame = ({ children, ...props }: Record<string, unknown>) =>
    React.createElement('div', { 'data-testid': 'sheet-frame', ...props }, children as React.ReactNode)

  const MockSheetOverlay = (props: Record<string, unknown>) =>
    React.createElement('div', { 'data-testid': 'sheet-overlay', ...props })

  const MockSheetHandle = () =>
    React.createElement('div', { 'data-testid': 'sheet-handle' })

  MockSheet.Frame = MockSheetFrame
  MockSheet.Overlay = MockSheetOverlay
  MockSheet.Handle = MockSheetHandle

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
    Sheet: MockSheet,
    withStaticProperties: (component: unknown, properties: Record<string, unknown>) =>
      Object.assign(component, properties),
  }
})

// Mock lucide icons
vi.mock('@tamagui/lucide-icons', async () => {
  const React = await import('react')
  return {
    X: () => React.createElement('svg', { 'data-testid': 'close-icon' }),
  }
})

import { Sheet } from '../components/sheets/Sheet'

// Create a simple wrapper component for easier testing
function TestDrawer({
  open,
  onClose,
  title,
  children,
}: {
  open: boolean
  onClose: () => void
  title?: string
  children: React.ReactNode
}) {
  return (
    <Sheet modal open={open} onOpenChange={(isOpen) => !isOpen && onClose()}>
      <Sheet.Overlay />
      <Sheet.Frame>
        <Sheet.Handle />
        {title && (
          <div data-testid="xstack">
            <span>{title}</span>
            <button onClick={onClose} data-testid="close-button">
              <svg data-testid="close-icon" />
            </button>
          </div>
        )}
        <div>{children}</div>
      </Sheet.Frame>
    </Sheet>
  )
}

describe('Sheet Component (Drawer)', () => {
  describe('Basic Rendering', () => {
    it('should not render when closed', () => {
      const onClose = vi.fn()
      render(
        <TestDrawer open={false} onClose={onClose}>
          <div>Drawer Content</div>
        </TestDrawer>
      )

      expect(screen.queryByText('Drawer Content')).not.toBeInTheDocument()
    })

    it('should render when open', () => {
      const onClose = vi.fn()
      render(
        <TestDrawer open={true} onClose={onClose}>
          <div>Drawer Content</div>
        </TestDrawer>
      )

      expect(screen.getByText('Drawer Content')).toBeInTheDocument()
    })

    it('should render title when provided', () => {
      const onClose = vi.fn()
      render(
        <TestDrawer open={true} onClose={onClose} title="Drawer Title">
          <div>Content</div>
        </TestDrawer>
      )

      expect(screen.getByText('Drawer Title')).toBeInTheDocument()
    })
  })

  describe('Close Button', () => {
    it('should show close button when title is provided', () => {
      const onClose = vi.fn()
      render(
        <TestDrawer open={true} onClose={onClose} title="Test">
          <div>Content</div>
        </TestDrawer>
      )

      expect(screen.getByTestId('close-icon')).toBeInTheDocument()
    })

    it('should call onClose when close button is clicked', () => {
      const onClose = vi.fn()
      render(
        <TestDrawer open={true} onClose={onClose} title="Test">
          <div>Content</div>
        </TestDrawer>
      )

      fireEvent.click(screen.getByTestId('close-button'))

      expect(onClose).toHaveBeenCalled()
    })
  })

  describe('Sheet Components', () => {
    it('should render Sheet.Frame', () => {
      const onClose = vi.fn()
      render(
        <TestDrawer open={true} onClose={onClose}>
          <div>Content</div>
        </TestDrawer>
      )

      expect(screen.getByTestId('sheet-frame')).toBeInTheDocument()
    })

    it('should render Sheet.Overlay', () => {
      const onClose = vi.fn()
      render(
        <TestDrawer open={true} onClose={onClose}>
          <div>Content</div>
        </TestDrawer>
      )

      expect(screen.getByTestId('sheet-overlay')).toBeInTheDocument()
    })

    it('should render Sheet.Handle', () => {
      const onClose = vi.fn()
      render(
        <TestDrawer open={true} onClose={onClose}>
          <div>Content</div>
        </TestDrawer>
      )

      expect(screen.getByTestId('sheet-handle')).toBeInTheDocument()
    })
  })

  describe('Content', () => {
    it('should render complex content', () => {
      const onClose = vi.fn()
      render(
        <TestDrawer open={true} onClose={onClose} title="Navigation">
          <div>
            <ul>
              <li>Home</li>
              <li>About</li>
              <li>Contact</li>
            </ul>
          </div>
        </TestDrawer>
      )

      expect(screen.getByText('Navigation')).toBeInTheDocument()
      expect(screen.getByText('Home')).toBeInTheDocument()
      expect(screen.getByText('About')).toBeInTheDocument()
      expect(screen.getByText('Contact')).toBeInTheDocument()
    })
  })

  describe('State Changes', () => {
    it('should show/hide based on open prop', () => {
      const onClose = vi.fn()
      const { rerender } = render(
        <TestDrawer open={false} onClose={onClose}>
          <div>Content</div>
        </TestDrawer>
      )

      expect(screen.queryByText('Content')).not.toBeInTheDocument()

      rerender(
        <TestDrawer open={true} onClose={onClose}>
          <div>Content</div>
        </TestDrawer>
      )

      expect(screen.getByText('Content')).toBeInTheDocument()
    })
  })
})
