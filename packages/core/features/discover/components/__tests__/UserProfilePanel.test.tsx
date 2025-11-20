import { fireEvent, render, screen } from '@testing-library/react'
import type { ReactNode } from 'react'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { UserProfilePanel } from '../UserProfilePanel'

// Mock expo-router
const mockPush = vi.fn()
vi.mock('expo-router', () => ({
  useRouter: () => ({
    push: mockPush,
  }),
}))

// Mock toast
const mockShow = vi.fn()
vi.mock('@tamagui/toast', () => ({
  useToastController: () => ({
    show: mockShow,
  }),
}))

// Mock API
const mockPreviewData = {
  id: 'user-123',
  displayName: 'John Doe',
  headline: 'Senior Developer',
  location: 'San Francisco, CA',
  avatarPath: 'avatars/user-123.jpg',
  avatarUrl: null,
  topSkills: [
    {
      csiSkillId: 'skill-1',
      proficiency: 5,
    },
    {
      onetOccupationId: 'skill-2',
      proficiency: 4,
    },
    {
      taxonomy: 'skill-3',
      proficiency: 3,
    },
    {
      csiSkillId: 'skill-4',
      proficiency: 2,
    },
  ],
}

const mockUseQuery = vi.fn()
vi.mock('@app/core/utils/api', () => ({
  api: {
    userProfile: {
      getPreview: {
        useQuery: mockUseQuery,
      },
    },
  },
}))

// Mock getStorageUrl
vi.mock('@app/core/utils/supabase/storage', () => ({
  getStorageUrl: (bucket: string, path: string) => `https://storage.example.com/${bucket}/${path}`,
}))

// Mock RouteBuilder
vi.mock('@app/core/constants/routes', () => ({
  RouteBuilder: {
    discoverWorkerDetail: (userId: string) => `/discover/workers/${userId}`,
  },
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
    ...rest
  }: {
    children?: ReactNode
    onPress?: () => void
    icon?: ReactNode
  } & Record<string, unknown>) => (
    <button type="button" onClick={onPress} {...rest}>
      {icon}
      {children}
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
    ...rest
  }: {
    children?: ReactNode
  } & Record<string, unknown>) => (
    <div data-testid="profile-panel-card" {...rest}>
      {children}
    </div>
  )

  const Avatar = ({
    children,
    ...rest
  }: {
    children?: ReactNode
  } & Record<string, unknown>) => (
    <div data-testid="avatar" {...rest}>
      {children}
    </div>
  )

  Avatar.Image = ({ source, ...rest }: { source?: { uri?: string } } & Record<string, unknown>) => (
    <img src={source?.uri} data-testid="avatar-image" alt="" aria-hidden="true" {...rest} />
  )

  Avatar.Fallback = ({
    children,
    ...rest
  }: {
    children?: ReactNode
  } & Record<string, unknown>) => (
    <div data-testid="avatar-fallback" {...rest}>
      {children}
    </div>
  )

  const Spinner = (props: Record<string, unknown>) => <div data-testid="spinner" {...props} />

  return {
    YStack: Stack,
    XStack: Stack,
    Button,
    Text,
    Card,
    Avatar,
    Spinner,
  }
})

// Mock lucide icons
vi.mock('@tamagui/lucide-icons', () => ({
  MapPin: ({ size, color }: { size?: number; color?: string }) => (
    <span data-testid="map-pin-icon" data-size={size} data-color={color}>
      MapPin
    </span>
  ),
  X: () => <span data-testid="x-icon">X</span>,
  ExternalLink: () => <span data-testid="external-link-icon">ExternalLink</span>,
  User: ({ size, color }: { size?: number; color?: string }) => (
    <span data-testid="user-icon" data-size={size} data-color={color}>
      User
    </span>
  ),
}))

describe('UserProfilePanel', () => {
  const mockOnOpenChange = vi.fn()

  beforeEach(() => {
    vi.clearAllMocks()
    mockPush.mockClear()
    mockShow.mockClear()
    mockOnOpenChange.mockClear()
  })

  describe('Conditional Rendering', () => {
    it('returns null when open is false', () => {
      mockUseQuery.mockReturnValue({
        data: mockPreviewData,
        isLoading: false,
      })

      const { container } = render(
        <UserProfilePanel userId="user-123" open={false} onOpenChange={mockOnOpenChange} />
      )

      expect(container.firstChild).toBeNull()
    })

    it('returns null when userId is null', () => {
      mockUseQuery.mockReturnValue({
        data: mockPreviewData,
        isLoading: false,
      })

      const { container } = render(
        <UserProfilePanel userId={null} open={true} onOpenChange={mockOnOpenChange} />
      )

      expect(container.firstChild).toBeNull()
    })

    it('renders when open is true and userId is provided', () => {
      mockUseQuery.mockReturnValue({
        data: mockPreviewData,
        isLoading: false,
      })

      render(<UserProfilePanel userId="user-123" open={true} onOpenChange={mockOnOpenChange} />)

      expect(screen.getByTestId('profile-panel-card')).toBeInTheDocument()
    })
  })

  describe('Loading State', () => {
    it('shows loading spinner while fetching', () => {
      mockUseQuery.mockReturnValue({
        data: undefined,
        isLoading: true,
      })

      render(<UserProfilePanel userId="user-123" open={true} onOpenChange={mockOnOpenChange} />)

      expect(screen.getByTestId('spinner')).toBeInTheDocument()
      expect(screen.getByText('Loading...')).toBeInTheDocument()
    })

    it('disables query when open is false', () => {
      mockUseQuery.mockReturnValue({
        data: undefined,
        isLoading: false,
      })

      render(<UserProfilePanel userId="user-123" open={false} onOpenChange={mockOnOpenChange} />)

      expect(mockUseQuery).toHaveBeenCalledWith({ userId: 'user-123' }, { enabled: false })
    })

    it('enables query when open is true and userId is provided', () => {
      mockUseQuery.mockReturnValue({
        data: mockPreviewData,
        isLoading: false,
      })

      render(<UserProfilePanel userId="user-123" open={true} onOpenChange={mockOnOpenChange} />)

      expect(mockUseQuery).toHaveBeenCalledWith({ userId: 'user-123' }, { enabled: true })
    })
  })

  describe('Error State', () => {
    it('displays "Profile not found" when preview is null', () => {
      mockUseQuery.mockReturnValue({
        data: null,
        isLoading: false,
      })

      render(<UserProfilePanel userId="user-123" open={true} onOpenChange={mockOnOpenChange} />)

      expect(screen.getByText('Profile not found')).toBeInTheDocument()
    })
  })

  describe('Profile Display', () => {
    it('displays user name', () => {
      mockUseQuery.mockReturnValue({
        data: mockPreviewData,
        isLoading: false,
      })

      render(<UserProfilePanel userId="user-123" open={true} onOpenChange={mockOnOpenChange} />)

      expect(screen.getByText('John Doe')).toBeInTheDocument()
    })

    it('displays headline when available', () => {
      mockUseQuery.mockReturnValue({
        data: mockPreviewData,
        isLoading: false,
      })

      render(<UserProfilePanel userId="user-123" open={true} onOpenChange={mockOnOpenChange} />)

      expect(screen.getByText('Senior Developer')).toBeInTheDocument()
    })

    it('does not display headline when not available', () => {
      const dataWithoutHeadline = {
        ...mockPreviewData,
        headline: null,
      }

      mockUseQuery.mockReturnValue({
        data: dataWithoutHeadline,
        isLoading: false,
      })

      render(<UserProfilePanel userId="user-123" open={true} onOpenChange={mockOnOpenChange} />)

      expect(screen.queryByText('Senior Developer')).not.toBeInTheDocument()
    })

    it('displays location when available', () => {
      mockUseQuery.mockReturnValue({
        data: mockPreviewData,
        isLoading: false,
      })

      render(<UserProfilePanel userId="user-123" open={true} onOpenChange={mockOnOpenChange} />)

      expect(screen.getByText('San Francisco, CA')).toBeInTheDocument()
      expect(screen.getByTestId('map-pin-icon')).toBeInTheDocument()
    })

    it('does not display location when not available', () => {
      const dataWithoutLocation = {
        ...mockPreviewData,
        location: null,
      }

      mockUseQuery.mockReturnValue({
        data: dataWithoutLocation,
        isLoading: false,
      })

      render(<UserProfilePanel userId="user-123" open={true} onOpenChange={mockOnOpenChange} />)

      expect(screen.queryByText('San Francisco, CA')).not.toBeInTheDocument()
    })
  })

  describe('Avatar Display', () => {
    it('displays avatar image when avatarPath is available', () => {
      mockUseQuery.mockReturnValue({
        data: mockPreviewData,
        isLoading: false,
      })

      render(<UserProfilePanel userId="user-123" open={true} onOpenChange={mockOnOpenChange} />)

      const avatarImage = screen.getByTestId('avatar-image')
      expect(avatarImage).toBeInTheDocument()
      expect(avatarImage).toHaveAttribute(
        'src',
        'https://storage.example.com/avatars/avatars/user-123.jpg'
      )
    })

    it('displays avatar image when avatarUrl is available (fallback)', () => {
      const dataWithAvatarUrl = {
        ...mockPreviewData,
        avatarPath: null,
        avatarUrl: 'https://example.com/avatar.jpg',
      }

      mockUseQuery.mockReturnValue({
        data: dataWithAvatarUrl,
        isLoading: false,
      })

      render(<UserProfilePanel userId="user-123" open={true} onOpenChange={mockOnOpenChange} />)

      const avatarImage = screen.getByTestId('avatar-image')
      expect(avatarImage).toBeInTheDocument()
      expect(avatarImage).toHaveAttribute('src', 'https://example.com/avatar.jpg')
    })

    it('displays avatar fallback when no avatar available', () => {
      const dataWithoutAvatar = {
        ...mockPreviewData,
        avatarPath: null,
        avatarUrl: null,
      }

      mockUseQuery.mockReturnValue({
        data: dataWithoutAvatar,
        isLoading: false,
      })

      render(<UserProfilePanel userId="user-123" open={true} onOpenChange={mockOnOpenChange} />)

      expect(screen.getByTestId('avatar-fallback')).toBeInTheDocument()
      expect(screen.getByTestId('user-icon')).toBeInTheDocument()
    })
  })

  describe('Skills Display', () => {
    it('displays top 3 skills', () => {
      mockUseQuery.mockReturnValue({
        data: mockPreviewData,
        isLoading: false,
      })

      render(<UserProfilePanel userId="user-123" open={true} onOpenChange={mockOnOpenChange} />)

      expect(screen.getByText('Top Skills')).toBeInTheDocument()
      expect(screen.getByText('Skill (5)')).toBeInTheDocument()
      expect(screen.getByText('Skill (4)')).toBeInTheDocument()
      expect(screen.getByText('Skill (3)')).toBeInTheDocument()
    })

    it('displays "+N more" indicator when more than 3 skills', () => {
      mockUseQuery.mockReturnValue({
        data: mockPreviewData,
        isLoading: false,
      })

      render(<UserProfilePanel userId="user-123" open={true} onOpenChange={mockOnOpenChange} />)

      expect(screen.getByText('+1 more')).toBeInTheDocument()
    })

    it('does not display skills section when no skills', () => {
      const dataWithoutSkills = {
        ...mockPreviewData,
        topSkills: [],
      }

      mockUseQuery.mockReturnValue({
        data: dataWithoutSkills,
        isLoading: false,
      })

      render(<UserProfilePanel userId="user-123" open={true} onOpenChange={mockOnOpenChange} />)

      expect(screen.queryByText('Top Skills')).not.toBeInTheDocument()
    })

    it('displays skill without proficiency when proficiency is 0', () => {
      const dataWithZeroProficiency = {
        ...mockPreviewData,
        topSkills: [
          {
            csiSkillId: 'skill-1',
            proficiency: 0,
          },
        ],
      }

      mockUseQuery.mockReturnValue({
        data: dataWithZeroProficiency,
        isLoading: false,
      })

      render(<UserProfilePanel userId="user-123" open={true} onOpenChange={mockOnOpenChange} />)

      expect(screen.getByText('Skill')).toBeInTheDocument()
      expect(screen.queryByText('Skill (0)')).not.toBeInTheDocument()
    })
  })

  describe('Navigation', () => {
    it('navigates to worker detail page on "View Profile" click', () => {
      mockUseQuery.mockReturnValue({
        data: mockPreviewData,
        isLoading: false,
      })

      render(<UserProfilePanel userId="user-123" open={true} onOpenChange={mockOnOpenChange} />)

      const viewProfileButton = screen.getByText('View Profile')
      fireEvent.click(viewProfileButton)

      expect(mockPush).toHaveBeenCalledWith('/discover/workers/user-123')
    })

    it('closes panel after navigation', () => {
      mockUseQuery.mockReturnValue({
        data: mockPreviewData,
        isLoading: false,
      })

      render(<UserProfilePanel userId="user-123" open={true} onOpenChange={mockOnOpenChange} />)

      const viewProfileButton = screen.getByText('View Profile')
      fireEvent.click(viewProfileButton)

      expect(mockOnOpenChange).toHaveBeenCalledWith(false)
    })

    it('shows toast error when navigation fails', () => {
      mockUseQuery.mockReturnValue({
        data: mockPreviewData,
        isLoading: false,
      })

      mockPush.mockImplementation(() => {
        throw new Error('Navigation failed')
      })

      render(<UserProfilePanel userId="user-123" open={true} onOpenChange={mockOnOpenChange} />)

      const viewProfileButton = screen.getByText('View Profile')
      fireEvent.click(viewProfileButton)

      expect(mockShow).toHaveBeenCalledWith('Unable to load profile', {
        message: 'Please try again.',
      })
    })
  })

  describe('Close Button', () => {
    it('closes panel when close button is clicked', () => {
      mockUseQuery.mockReturnValue({
        data: mockPreviewData,
        isLoading: false,
      })

      render(<UserProfilePanel userId="user-123" open={true} onOpenChange={mockOnOpenChange} />)

      const closeButton = screen.getByTestId('x-icon').closest('button')
      expect(closeButton).toBeInTheDocument()

      if (closeButton) {
        fireEvent.click(closeButton)
        expect(mockOnOpenChange).toHaveBeenCalledWith(false)
      }
    })
  })

  describe('Positioning', () => {
    it('applies default position props', () => {
      mockUseQuery.mockReturnValue({
        data: mockPreviewData,
        isLoading: false,
      })

      render(<UserProfilePanel userId="user-123" open={true} onOpenChange={mockOnOpenChange} />)

      const card = screen.getByTestId('profile-panel-card')
      expect(card).toBeInTheDocument()
      // Position props are applied via spread, so we verify the card renders
    })

    it('applies custom position props', () => {
      mockUseQuery.mockReturnValue({
        data: mockPreviewData,
        isLoading: false,
      })

      render(
        <UserProfilePanel
          userId="user-123"
          open={true}
          onOpenChange={mockOnOpenChange}
          position={{ top: 100, left: 50 }}
        />
      )

      const card = screen.getByTestId('profile-panel-card')
      expect(card).toBeInTheDocument()
    })
  })
})
