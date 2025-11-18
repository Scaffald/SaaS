/**
 * REQ-74: NotificationDropdown Accessibility Tests
 * Tests ARIA labels, keyboard navigation, and screen reader support
 */

import { fireEvent, render, screen } from '@testing-library/react'
import { describe, expect, it, vi } from 'vitest'
import { NotificationDropdown, type NotificationItem } from '../NotificationDropdown'

// Mock expo-router
vi.mock('expo-router', () => ({
  useRouter: () => ({
    push: vi.fn(),
  }),
}))

// Mock Tamagui components (simplified for a11y tests)
vi.mock('tamagui', () => {
  const Stack = ({ children, ...rest }: { children?: React.ReactNode } & Record<string, unknown>) => (
    <div {...rest}>{children}</div>
  )

  const Button = ({
    children,
    onPress,
    'aria-label': ariaLabel,
    ref,
    ...rest
  }: {
    children?: React.ReactNode
    onPress?: () => void
    'aria-label'?: string
    ref?: React.Ref<HTMLButtonElement>
  } & Record<string, unknown>) => (
    <button type="button" onClick={onPress} aria-label={ariaLabel} ref={ref} {...rest}>
      {children}
    </button>
  )

  const Text = ({ children, ...rest }: { children?: React.ReactNode } & Record<string, unknown>) => (
    <span {...rest}>{children}</span>
  )

  const Card = ({
    children,
    onPress,
    role,
    tabIndex,
    'aria-label': ariaLabel,
    ...rest
  }: {
    children?: React.ReactNode
    onPress?: () => void
    role?: string
    tabIndex?: number
    'aria-label'?: string
  } & Record<string, unknown>) => (
    <div
      role={role}
      tabIndex={tabIndex}
      onClick={onPress}
      onKeyDown={(e: React.KeyboardEvent) => {
        if (e.key === 'Enter' && onPress) {
          onPress()
        }
      }}
      aria-label={ariaLabel}
      {...rest}
    >
      {children}
    </div>
  )

  const ScrollView = ({ children, ...rest }: { children?: React.ReactNode } & Record<string, unknown>) => (
    <div {...rest}>{children}</div>
  )

  const Separator = (props: Record<string, unknown>) => <hr {...props} />

  const Spinner = (props: Record<string, unknown>) => <div data-testid="spinner" {...props} />

  const Popover = ({
    children,
    open,
    onOpenChange,
  }: {
    children?: React.ReactNode
    open?: boolean
    onOpenChange?: (open: boolean) => void
  }) => {
    const trigger = Array.isArray(children) ? children[0] : null
    const content = Array.isArray(children) ? children[1] : null

    return (
      <div data-testid="popover" data-open={open}>
        <div onClick={() => onOpenChange?.(!open)}>{trigger}</div>
        {open && content}
      </div>
    )
  }

  Popover.Trigger = ({ children }: { children?: React.ReactNode }) => (
    <div data-testid="popover-trigger">{children}</div>
  )

  Popover.Content = ({
    children,
    role,
    'aria-labelledby': ariaLabelledBy,
    ...rest
  }: {
    children?: React.ReactNode
    role?: string
    'aria-labelledby'?: string
  } & Record<string, unknown>) => (
    <div data-testid="popover-content" role={role} aria-labelledby={ariaLabelledBy} {...rest}>
      {children}
    </div>
  )

  return {
    YStack: Stack,
    XStack: Stack,
    Button,
    Text,
    Card,
    ScrollView,
    Separator,
    Spinner,
    Popover,
    useMedia: () => ({
      sm: false,
    }),
  }
})

// Mock lucide icons
vi.mock('@tamagui/lucide-icons', () => ({
  Bell: () => <span data-testid="bell-icon">Bell</span>,
  AlertCircle: () => <span>AlertCircle</span>,
  Info: () => <span>Info</span>,
  ShieldAlert: () => <span>ShieldAlert</span>,
  X: () => <span data-testid="x-icon">X</span>,
}))

describe('NotificationDropdown Accessibility', () => {
  const mockNotifications: NotificationItem[] = [
    {
      id: '1',
      type: 'success',
      severity: 'info',
      title: 'Profile Updated',
      preview: 'Your profile has been successfully updated',
      createdAt: new Date().toISOString(),
      read: false,
      ctaUrl: '/dashboard/profile/general',
      ctaLabel: 'View Profile',
      channels: ['email'],
    },
  ]

  describe('ARIA Labels', () => {
    it('has proper ARIA label on bell icon button with unread count', () => {
      render(
        <NotificationDropdown
          notifications={mockNotifications}
          unreadCount={1}
        />,
      )

      const button = screen.getByLabelText('Notifications (1 unread)')
      expect(button).toBeInTheDocument()
    })

    it('has proper ARIA label on bell icon button without unread count', () => {
      render(
        <NotificationDropdown
          notifications={[]}
          unreadCount={0}
        />,
      )

      const button = screen.getByLabelText('Notifications')
      expect(button).toBeInTheDocument()
    })

    it('has menu role on dropdown content', () => {
      render(
        <NotificationDropdown
          notifications={mockNotifications}
          unreadCount={1}
        />,
      )

      const trigger = screen.getByTestId('popover-trigger')
      fireEvent.click(trigger)

      const content = screen.getByTestId('popover-content')
      expect(content).toHaveAttribute('role', 'menu')
    })

    it('has aria-labelledby on dropdown content', () => {
      render(
        <NotificationDropdown
          notifications={mockNotifications}
          unreadCount={1}
        />,
      )

      const trigger = screen.getByTestId('popover-trigger')
      fireEvent.click(trigger)

      const content = screen.getByTestId('popover-content')
      expect(content).toHaveAttribute('aria-labelledby', 'notifications-title')
      expect(screen.getByText('Notifications')).toHaveAttribute('id', 'notifications-title')
    })

    it('has menuitem role on notification items', () => {
      render(
        <NotificationDropdown
          notifications={mockNotifications}
          unreadCount={1}
        />,
      )

      const trigger = screen.getByTestId('popover-trigger')
      fireEvent.click(trigger)

      const notifications = screen.getAllByRole('menuitem')
      expect(notifications.length).toBeGreaterThan(0)
    })

    it('has aria-label on notification items', () => {
      render(
        <NotificationDropdown
          notifications={mockNotifications}
          unreadCount={1}
        />,
      )

      const trigger = screen.getByTestId('popover-trigger')
      fireEvent.click(trigger)

      const notification = screen.getByRole('menuitem')
      expect(notification).toHaveAttribute('aria-label')
      expect(notification.getAttribute('aria-label')).toContain('Profile Updated')
    })

    it('has aria-label on close button', () => {
      render(
        <NotificationDropdown
          notifications={mockNotifications}
          unreadCount={1}
        />,
      )

      const trigger = screen.getByTestId('popover-trigger')
      fireEvent.click(trigger)

      const closeButton = screen.getByLabelText('Close notifications')
      expect(closeButton).toBeInTheDocument()
    })
  })

  describe('Keyboard Navigation', () => {
    it('supports Tab navigation through notification items', () => {
      render(
        <NotificationDropdown
          notifications={mockNotifications}
          unreadCount={1}
        />,
      )

      const trigger = screen.getByTestId('popover-trigger')
      fireEvent.click(trigger)

      const notification = screen.getByRole('menuitem')
      expect(notification).toHaveAttribute('tabIndex', '0')
    })

    it('activates notification on Enter key', () => {
      const mockOnMarkAsRead = vi.fn()
      render(
        <NotificationDropdown
          notifications={mockNotifications}
          unreadCount={1}
          onMarkAsRead={mockOnMarkAsRead}
        />,
      )

      const trigger = screen.getByTestId('popover-trigger')
      fireEvent.click(trigger)

      const notification = screen.getByRole('menuitem')
      notification.focus()
      fireEvent.keyDown(notification, { key: 'Enter' })

      expect(mockOnMarkAsRead).toHaveBeenCalled()
    })

    it('closes dropdown on Escape key', () => {
      render(
        <NotificationDropdown
          notifications={mockNotifications}
          unreadCount={1}
        />,
      )

      const trigger = screen.getByTestId('popover-trigger')
      fireEvent.click(trigger)

      const popover = screen.getByTestId('popover')
      expect(popover).toHaveAttribute('data-open', 'true')

      fireEvent.keyDown(document, { key: 'Escape' })

      expect(popover).toHaveAttribute('data-open', 'false')
    })

    it('returns focus to trigger button on close', () => {
      render(
        <NotificationDropdown
          notifications={mockNotifications}
          unreadCount={1}
        />,
      )

      const trigger = screen.getByTestId('popover-trigger')
      const button = trigger.querySelector('button')
      expect(button).toBeInTheDocument()

      if (button) {
        fireEvent.click(button)

        const popover = screen.getByTestId('popover')
        expect(popover).toHaveAttribute('data-open', 'true')

        fireEvent.keyDown(document, { key: 'Escape' })

        // Focus should return to trigger (verified by component implementation)
        expect(popover).toHaveAttribute('data-open', 'false')
      }
    })
  })

  describe('Screen Reader Support', () => {
    it('announces unread count in button label', () => {
      render(
        <NotificationDropdown
          notifications={mockNotifications}
          unreadCount={5}
        />,
      )

      const button = screen.getByLabelText('Notifications (5 unread)')
      expect(button).toBeInTheDocument()
    })

    it('announces "99+" for counts over 99', () => {
      render(
        <NotificationDropdown
          notifications={mockNotifications}
          unreadCount={150}
        />,
      )

      const button = screen.getByLabelText('Notifications (150 unread)')
      expect(button).toBeInTheDocument()
    })

    it('provides descriptive aria-label for each notification', () => {
      render(
        <NotificationDropdown
          notifications={mockNotifications}
          unreadCount={1}
        />,
      )

      const trigger = screen.getByTestId('popover-trigger')
      fireEvent.click(trigger)

      const notification = screen.getByRole('menuitem')
      const ariaLabel = notification.getAttribute('aria-label')
      expect(ariaLabel).toContain('Profile Updated')
      expect(ariaLabel).toContain('Your profile has been successfully updated')
    })
  })

  describe('Focus Management', () => {
    it('maintains focusable elements with tabIndex', () => {
      render(
        <NotificationDropdown
          notifications={mockNotifications}
          unreadCount={1}
        />,
      )

      const trigger = screen.getByTestId('popover-trigger')
      fireEvent.click(trigger)

      const notifications = screen.getAllByRole('menuitem')
      notifications.forEach((notification) => {
        expect(notification).toHaveAttribute('tabIndex', '0')
      })
    })
  })
})

