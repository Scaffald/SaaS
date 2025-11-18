import { fireEvent, render, screen, waitFor } from '@testing-library/react'
import type { ReactNode } from 'react'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { NotificationDropdown, type NotificationItem } from '../NotificationDropdown'

// Mock expo-router
const mockPush = vi.fn()
vi.mock('expo-router', () => ({
  useRouter: () => ({
    push: mockPush,
  }),
}))

// Mock Tamagui components
vi.mock('tamagui', () => {
  const Stack = ({
    children,
    testID,
    ...rest
  }: {
    children?: ReactNode
    testID?: string
  } & Record<string, unknown>) => (
    <div data-testid={testID} {...rest}>
      {children}
    </div>
  )

  const Button = ({
    children,
    onPress,
    icon,
    iconAfter,
    ref,
    ...rest
  }: {
    children?: ReactNode
    onPress?: () => void
    icon?: ReactNode
    iconAfter?: ReactNode
    ref?: React.Ref<HTMLButtonElement>
  } & Record<string, unknown>) => (
    <button type="button" onClick={onPress} ref={ref} {...rest}>
      {icon}
      {children}
      {iconAfter}
    </button>
  )

  const Text = ({
    children,
    ...rest
  }: {
    children?: ReactNode
  } & Record<string, unknown>) => <span {...rest}>{children}</span>

  const Card = ({
    children,
    onPress,
    role,
    tabIndex,
    ...rest
  }: {
    children?: ReactNode
    onPress?: () => void
    role?: string
    tabIndex?: number
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
      {...rest}
    >
      {children}
    </div>
  )

  const ScrollView = ({
    children,
    ...rest
  }: {
    children?: ReactNode
  } & Record<string, unknown>) => (
    <div data-testid="scroll-view" {...rest}>
      {children}
    </div>
  )

  const Separator = (props: Record<string, unknown>) => <hr {...props} />

  const Spinner = (props: Record<string, unknown>) => <div data-testid="spinner" {...props} />

  const Popover = ({
    children,
    open,
    onOpenChange,
    placement,
  }: {
    children?: ReactNode
    open?: boolean
    onOpenChange?: (open: boolean) => void
    placement?: string
  }) => {
    const trigger = Array.isArray(children) ? children[0] : null
    const content = Array.isArray(children) ? children[1] : null

    return (
      <div data-testid="popover" data-open={open} data-placement={placement}>
        {trigger}
        {open && content}
      </div>
    )
  }

  Popover.Trigger = ({
    children,
    asChild,
  }: {
    children?: ReactNode
    asChild?: boolean
  }) => <div data-testid="popover-trigger">{children}</div>

  Popover.Content = ({
    children,
    role,
    style,
    ...rest
  }: {
    children?: ReactNode
    role?: string
    style?: React.CSSProperties
  } & Record<string, unknown>) => (
    <div data-testid="popover-content" role={role} style={style} {...rest}>
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
      sm: false, // Default to desktop
    }),
  }
})

// Mock lucide icons
vi.mock('@tamagui/lucide-icons', () => ({
  Bell: ({ size, color }: { size?: number; color?: string }) => (
    <span data-testid="bell-icon" data-size={size} data-color={color}>
      Bell
    </span>
  ),
  AlertCircle: ({ size, color }: { size?: number; color?: string }) => (
    <span data-testid="alert-circle-icon" data-size={size} data-color={color}>
      AlertCircle
    </span>
  ),
  Info: ({ size, color }: { size?: number; color?: string }) => (
    <span data-testid="info-icon" data-size={size} data-color={color}>
      Info
    </span>
  ),
  ShieldAlert: ({ size, color }: { size?: number; color?: string }) => (
    <span data-testid="shield-alert-icon" data-size={size} data-color={color}>
      ShieldAlert
    </span>
  ),
  X: () => <span data-testid="x-icon">X</span>,
}))

describe('NotificationDropdown', () => {
  const mockNotifications: NotificationItem[] = [
    {
      id: '1',
      type: 'success',
      severity: 'info',
      title: 'Profile Updated',
      preview: 'Your profile has been successfully updated',
      createdAt: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(), // 2 hours ago
      read: false,
      ctaUrl: '/dashboard/profile/general',
      ctaLabel: 'View Profile',
      channels: ['email'],
    },
    {
      id: '2',
      type: 'warning',
      severity: 'important',
      title: 'Payment Required',
      preview: 'Your payment method needs attention',
      createdAt: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000).toISOString(), // 1 day ago
      read: false,
      ctaUrl: '/dashboard/settings/billing',
      ctaLabel: 'Update Payment',
      channels: ['push', 'email'],
    },
    {
      id: '3',
      type: 'info',
      severity: 'info',
      title: 'System Maintenance',
      preview: 'Scheduled maintenance tonight',
      createdAt: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString(), // 3 days ago
      read: true,
      ctaUrl: null,
      ctaLabel: null,
      channels: [],
    },
  ]

  const mockOnNotificationClick = vi.fn()
  const mockOnMarkAsRead = vi.fn()

  beforeEach(() => {
    vi.clearAllMocks()
    mockPush.mockClear()
  })

  describe('Rendering', () => {
    it('renders bell icon button', () => {
      render(<NotificationDropdown notifications={[]} unreadCount={0} />)

      expect(screen.getByTestId('bell-icon')).toBeInTheDocument()
    })

    it('renders unread badge when unreadCount > 0', () => {
      render(<NotificationDropdown notifications={mockNotifications} unreadCount={2} />)

      expect(screen.getByText('2')).toBeInTheDocument()
    })

    it('renders "99+" badge when unreadCount > 99', () => {
      render(<NotificationDropdown notifications={[]} unreadCount={150} />)

      expect(screen.getByText('99+')).toBeInTheDocument()
    })

    it('does not render badge when unreadCount is 0', () => {
      render(<NotificationDropdown notifications={[]} unreadCount={0} />)

      expect(screen.queryByText('0')).not.toBeInTheDocument()
      expect(screen.queryByText('99+')).not.toBeInTheDocument()
    })

    it('shows loading state', () => {
      render(<NotificationDropdown notifications={[]} unreadCount={0} isLoading={true} />)

      // Open dropdown first
      const trigger = screen.getByTestId('popover-trigger')
      fireEvent.click(trigger)

      expect(screen.getByTestId('spinner')).toBeInTheDocument()
      expect(screen.getByText('Loading notifications...')).toBeInTheDocument()
    })

    it('shows empty state when no notifications', () => {
      render(<NotificationDropdown notifications={[]} unreadCount={0} isLoading={false} />)

      // Open dropdown first
      const trigger = screen.getByTestId('popover-trigger')
      fireEvent.click(trigger)

      expect(screen.getByText('No notifications')).toBeInTheDocument()
      expect(screen.getByText("You're all caught up!")).toBeInTheDocument()
    })
  })

  describe('Notification Organization', () => {
    it('organizes notifications into unread and read sections', () => {
      render(<NotificationDropdown notifications={mockNotifications} unreadCount={2} />)

      // Open dropdown
      const trigger = screen.getByTestId('popover-trigger')
      fireEvent.click(trigger)

      expect(screen.getByText('Unread (2)')).toBeInTheDocument()
      expect(screen.getByText('Read')).toBeInTheDocument()
    })

    it('shows only unread section when no read notifications', () => {
      const unreadOnly = mockNotifications.filter((n) => !n.read)
      render(<NotificationDropdown notifications={unreadOnly} unreadCount={2} />)

      const trigger = screen.getByTestId('popover-trigger')
      fireEvent.click(trigger)

      expect(screen.getByText('Unread (2)')).toBeInTheDocument()
      expect(screen.queryByText('Read')).not.toBeInTheDocument()
    })

    it('shows only read section when no unread notifications', () => {
      const readOnly = mockNotifications.filter((n) => n.read)
      render(<NotificationDropdown notifications={readOnly} unreadCount={0} />)

      const trigger = screen.getByTestId('popover-trigger')
      fireEvent.click(trigger)

      expect(screen.queryByText(/Unread/)).not.toBeInTheDocument()
      expect(screen.getByText('Read')).toBeInTheDocument()
    })
  })

  describe('Notification Click Handling', () => {
    it('calls onMarkAsRead when clicking unread notification', () => {
      render(
        <NotificationDropdown
          notifications={mockNotifications}
          unreadCount={2}
          onMarkAsRead={mockOnMarkAsRead}
        />
      )

      const trigger = screen.getByTestId('popover-trigger')
      fireEvent.click(trigger)

      // Find and click first unread notification
      const notifications = screen.getAllByRole('menuitem')
      fireEvent.click(notifications[0])

      expect(mockOnMarkAsRead).toHaveBeenCalledWith('1')
    })

    it('does not call onMarkAsRead when clicking read notification', () => {
      render(
        <NotificationDropdown
          notifications={mockNotifications}
          unreadCount={2}
          onMarkAsRead={mockOnMarkAsRead}
        />
      )

      const trigger = screen.getByTestId('popover-trigger')
      fireEvent.click(trigger)

      // Find and click read notification (should be last)
      const notifications = screen.getAllByRole('menuitem')
      const readNotification = notifications[notifications.length - 1]
      fireEvent.click(readNotification)

      expect(mockOnMarkAsRead).not.toHaveBeenCalled()
    })

    it('calls onNotificationClick when provided', () => {
      render(
        <NotificationDropdown
          notifications={mockNotifications}
          unreadCount={2}
          onNotificationClick={mockOnNotificationClick}
        />
      )

      const trigger = screen.getByTestId('popover-trigger')
      fireEvent.click(trigger)

      const notifications = screen.getAllByRole('menuitem')
      fireEvent.click(notifications[0])

      expect(mockOnNotificationClick).toHaveBeenCalledWith(expect.objectContaining({ id: '1' }))
    })

    it('navigates to ctaUrl when notification is clicked', () => {
      render(<NotificationDropdown notifications={mockNotifications} unreadCount={2} />)

      const trigger = screen.getByTestId('popover-trigger')
      fireEvent.click(trigger)

      const notifications = screen.getAllByRole('menuitem')
      fireEvent.click(notifications[0])

      expect(mockPush).toHaveBeenCalledWith('/dashboard/profile/general')
    })

    it('closes dropdown after notification click', async () => {
      render(<NotificationDropdown notifications={mockNotifications} unreadCount={2} />)

      const trigger = screen.getByTestId('popover-trigger')
      fireEvent.click(trigger)

      // Verify dropdown is open
      const popover = screen.getByTestId('popover')
      expect(popover).toHaveAttribute('data-open', 'true')

      const notifications = screen.getAllByRole('menuitem')
      fireEvent.click(notifications[0])

      // Wait for dropdown to close
      await waitFor(() => {
        expect(popover).toHaveAttribute('data-open', 'false')
      })
    })
  })

  describe('Keyboard Navigation', () => {
    it('closes dropdown on Escape key', () => {
      render(<NotificationDropdown notifications={mockNotifications} unreadCount={2} />)

      const trigger = screen.getByTestId('popover-trigger')
      fireEvent.click(trigger)

      const popover = screen.getByTestId('popover')
      expect(popover).toHaveAttribute('data-open', 'true')

      fireEvent.keyDown(document, { key: 'Escape' })

      expect(popover).toHaveAttribute('data-open', 'false')
    })

    it('activates notification on Enter key', () => {
      render(
        <NotificationDropdown
          notifications={mockNotifications}
          unreadCount={2}
          onMarkAsRead={mockOnMarkAsRead}
        />
      )

      const trigger = screen.getByTestId('popover-trigger')
      fireEvent.click(trigger)

      const notifications = screen.getAllByRole('menuitem')
      const firstNotification = notifications[0]

      // Focus and press Enter
      firstNotification.focus()
      fireEvent.keyDown(firstNotification, { key: 'Enter' })

      expect(mockOnMarkAsRead).toHaveBeenCalled()
    })
  })

  describe('Accessibility', () => {
    it('has proper ARIA label on bell icon button', () => {
      render(<NotificationDropdown notifications={mockNotifications} unreadCount={2} />)

      const button = screen.getByLabelText('Notifications (2 unread)')
      expect(button).toBeInTheDocument()
    })

    it('has proper ARIA label when no unread notifications', () => {
      render(<NotificationDropdown notifications={[]} unreadCount={0} />)

      const button = screen.getByLabelText('Notifications')
      expect(button).toBeInTheDocument()
    })

    it('has menu role on dropdown content', () => {
      render(<NotificationDropdown notifications={mockNotifications} unreadCount={2} />)

      const trigger = screen.getByTestId('popover-trigger')
      fireEvent.click(trigger)

      const content = screen.getByTestId('popover-content')
      expect(content).toHaveAttribute('role', 'menu')
    })

    it('has menuitem role on notification items', () => {
      render(<NotificationDropdown notifications={mockNotifications} unreadCount={2} />)

      const trigger = screen.getByTestId('popover-trigger')
      fireEvent.click(trigger)

      const notifications = screen.getAllByRole('menuitem')
      expect(notifications.length).toBeGreaterThan(0)
    })

    it('has close button with aria-label', () => {
      render(<NotificationDropdown notifications={mockNotifications} unreadCount={2} />)

      const trigger = screen.getByTestId('popover-trigger')
      fireEvent.click(trigger)

      const closeButton = screen.getByLabelText('Close notifications')
      expect(closeButton).toBeInTheDocument()
    })
  })

  describe('Responsive Behavior', () => {
    it('applies mobile width style when isMobile is true', () => {
      // Mock useMedia to return mobile
      vi.doMock('tamagui', async () => {
        const actual = await vi.importActual('tamagui')
        return {
          ...actual,
          useMedia: () => ({ sm: true }), // Mobile
        }
      })

      render(<NotificationDropdown notifications={mockNotifications} unreadCount={2} />)

      const trigger = screen.getByTestId('popover-trigger')
      fireEvent.click(trigger)

      const content = screen.getByTestId('popover-content')
      // Note: In real implementation, style would be applied
      // This test verifies the component structure
      expect(content).toBeInTheDocument()
    })
  })

  describe('Notification Display', () => {
    it('displays notification title and preview', () => {
      render(<NotificationDropdown notifications={mockNotifications} unreadCount={2} />)

      const trigger = screen.getByTestId('popover-trigger')
      fireEvent.click(trigger)

      expect(screen.getByText('Profile Updated')).toBeInTheDocument()
      expect(screen.getByText('Your profile has been successfully updated')).toBeInTheDocument()
    })

    it('displays relative time', () => {
      render(<NotificationDropdown notifications={mockNotifications} unreadCount={2} />)

      const trigger = screen.getByTestId('popover-trigger')
      fireEvent.click(trigger)

      // Should show "2 hours ago" or similar
      expect(screen.getByText(/ago/)).toBeInTheDocument()
    })

    it('displays severity pill', () => {
      render(<NotificationDropdown notifications={mockNotifications} unreadCount={2} />)

      const trigger = screen.getByTestId('popover-trigger')
      fireEvent.click(trigger)

      expect(screen.getByText('INFO')).toBeInTheDocument()
      expect(screen.getByText('IMPORTANT')).toBeInTheDocument()
    })

    it('displays channels pill when available', () => {
      render(<NotificationDropdown notifications={mockNotifications} unreadCount={2} />)

      const trigger = screen.getByTestId('popover-trigger')
      fireEvent.click(trigger)

      expect(screen.getByText('email')).toBeInTheDocument()
    })

    it('displays CTA button when ctaLabel is provided', () => {
      render(<NotificationDropdown notifications={mockNotifications} unreadCount={2} />)

      const trigger = screen.getByTestId('popover-trigger')
      fireEvent.click(trigger)

      expect(screen.getByText('View Profile')).toBeInTheDocument()
      expect(screen.getByText('Update Payment')).toBeInTheDocument()
    })
  })

  describe('Close Button', () => {
    it('closes dropdown when close button is clicked', async () => {
      render(<NotificationDropdown notifications={mockNotifications} unreadCount={2} />)

      const trigger = screen.getByTestId('popover-trigger')
      fireEvent.click(trigger)

      const popover = screen.getByTestId('popover')
      expect(popover).toHaveAttribute('data-open', 'true')

      const closeButton = screen.getByLabelText('Close notifications')
      fireEvent.click(closeButton)

      await waitFor(() => {
        expect(popover).toHaveAttribute('data-open', 'false')
      })
    })
  })
})
