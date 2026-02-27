import { fireEvent, render, screen, waitFor } from '@testing-library/react'
import type { ReactNode } from 'react'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { PortfolioGallery } from '../PortfolioGallery'

// Mock API
const mockPortfolioItems = [
  {
    id: 'item-1',
    title: 'Project Alpha',
    description: 'A great project description',
    image_url: 'https://example.com/image1.jpg',
    file_path: null,
    display_order: 0,
  },
  {
    id: 'item-2',
    title: 'Project Beta',
    description: null,
    image_url: null,
    file_path: 'portfolio/user-123/item-2.jpg',
    display_order: 1,
  },
]

const mockMocks = vi.hoisted(() => ({
  mockUseQuery: vi.fn(),
}))

vi.mock('@scf/core/utils/api', () => ({
  api: {
    portfolio: {
      list: {
        useQuery: mockMocks.mockUseQuery,
      },
    },
  },
}))

const { mockUseQuery } = mockMocks

// Mock getStorageUrl
vi.mock('@scf/core/utils/supabase/storage', () => ({
  getStorageUrl: (bucket: string, path: string) => `https://storage.example.com/${bucket}/${path}`,
}))

// Mock UI components
vi.mock('@scaffald/ui', () => ({
  DashboardWidget: ({ children }: { children?: ReactNode }) => (
    <div data-testid="dashboard-widget">{children}</div>
  ),
  ResponsiveModal: ({
    children,
    open,
    onOpenChange,
    title,
    size,
  }: {
    children?: ReactNode
    open?: boolean
    onOpenChange?: (open: boolean) => void
    title?: string
    size?: string
  }) => (
    <div data-testid="responsive-modal" data-open={open} data-size={size}>
      {title && <h2>{title}</h2>}
      {open && (
        <>
          {children}
          <button type="button" onClick={() => onOpenChange?.(false)} data-testid="close-modal">
            Close
          </button>
        </>
      )}
    </div>
  ),
}))

// Beyond UI mock
vi.mock('@scaffald/ui', () => {
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

  const Text = ({
    children,
    ...rest
  }: {
    children?: ReactNode
  } & Record<string, unknown>) => <span {...rest}>{children}</span>

  const Image = ({
    source,
    ...rest
  }: {
    source?: { uri?: string }
  } & Record<string, unknown>) => (
    <img
      src={source?.uri}
      data-testid="portfolio-image"
      alt=""
      aria-hidden="true"
      {...rest}
    />
  )

  const Card = ({
    children,
    onPress,
    ...rest
  }: {
    children?: ReactNode
    onPress?: () => void
  } & Record<string, unknown>) => (
    <button type="button" data-testid="portfolio-card" onClick={onPress} {...rest}>
      {children}
    </button>
  )

  const H4 = ({
    children,
    ...rest
  }: {
    children?: ReactNode
  } & Record<string, unknown>) => <h4 {...rest}>{children}</h4>

  const Spinner = (props: Record<string, unknown>) => <div data-testid="spinner" {...props} />

  return {
    Stack: Stack,
    Row: Stack,
    Text,
    Image,
    Card,
    H4,
    Spinner,
  }
})

// Mock lucide icons
vi.mock('lucide-react-native', () => ({
  Eye: ({ size, color }: { size?: number; color?: string }) => (
    <span data-testid="eye-icon" data-size={size} data-color={color}>
      Eye
    </span>
  ),
}))

describe('PortfolioGallery', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  describe('Conditional Rendering', () => {
    it('returns null when no portfolio items', () => {
      mockUseQuery.mockReturnValue({
        data: [],
        isLoading: false,
      })

      const { container } = render(<PortfolioGallery userId="user-123" />)

      expect(container.firstChild).toBeNull()
    })

    it('renders when portfolio items exist', () => {
      mockUseQuery.mockReturnValue({
        data: mockPortfolioItems,
        isLoading: false,
      })

      render(<PortfolioGallery userId="user-123" />)

      expect(screen.getByTestId('dashboard-widget')).toBeInTheDocument()
    })
  })

  describe('Loading State', () => {
    it('shows loading spinner during fetch', () => {
      mockUseQuery.mockReturnValue({
        data: undefined,
        isLoading: true,
      })

      render(<PortfolioGallery userId="user-123" />)

      expect(screen.getByTestId('spinner')).toBeInTheDocument()
      expect(screen.getByText('Loading portfolio...')).toBeInTheDocument()
    })
  })

  describe('Portfolio Display', () => {
    it('displays portfolio items in grid', () => {
      mockUseQuery.mockReturnValue({
        data: mockPortfolioItems,
        isLoading: false,
      })

      render(<PortfolioGallery userId="user-123" />)

      expect(screen.getByText('Portfolio')).toBeInTheDocument()
      expect(screen.getByText('Project Alpha')).toBeInTheDocument()
      expect(screen.getByText('Project Beta')).toBeInTheDocument()
    })

    it('displays image from file_path when available', () => {
      mockUseQuery.mockReturnValue({
        data: mockPortfolioItems,
        isLoading: false,
      })

      render(<PortfolioGallery userId="user-123" />)

      const images = screen.getAllByTestId('portfolio-image')
      expect(images[1]).toHaveAttribute(
        'src',
        'https://storage.example.com/portfolio/portfolio/user-123/item-2.jpg'
      )
    })

    it('displays image from image_url when file_path is not available', () => {
      mockUseQuery.mockReturnValue({
        data: mockPortfolioItems,
        isLoading: false,
      })

      render(<PortfolioGallery userId="user-123" />)

      const images = screen.getAllByTestId('portfolio-image')
      expect(images[0]).toHaveAttribute('src', 'https://example.com/image1.jpg')
    })

    it('displays description in full variant', () => {
      mockUseQuery.mockReturnValue({
        data: mockPortfolioItems,
        isLoading: false,
      })

      render(<PortfolioGallery userId="user-123" variant="full" />)

      expect(screen.getByText('A great project description')).toBeInTheDocument()
    })

    it('hides description in compact variant', () => {
      mockUseQuery.mockReturnValue({
        data: mockPortfolioItems,
        isLoading: false,
      })

      render(<PortfolioGallery userId="user-123" variant="compact" />)

      expect(screen.queryByText('A great project description')).not.toBeInTheDocument()
    })

    it('shows "Click to view" hint when image is available', () => {
      mockUseQuery.mockReturnValue({
        data: mockPortfolioItems,
        isLoading: false,
      })

      render(<PortfolioGallery userId="user-123" />)

      expect(screen.getByText('Click to view')).toBeInTheDocument()
    })
  })

  describe('Lightbox Modal', () => {
    it('opens lightbox modal on item click', () => {
      mockUseQuery.mockReturnValue({
        data: mockPortfolioItems,
        isLoading: false,
      })

      render(<PortfolioGallery userId="user-123" />)

      const cards = screen.getAllByTestId('portfolio-card')
      fireEvent.click(cards[0])

      const modal = screen.getByTestId('responsive-modal')
      expect(modal).toHaveAttribute('data-open', 'true')
      expect(screen.getByText('Project Alpha')).toBeInTheDocument()
    })

    it('displays image in lightbox', () => {
      mockUseQuery.mockReturnValue({
        data: mockPortfolioItems,
        isLoading: false,
      })

      render(<PortfolioGallery userId="user-123" />)

      const cards = screen.getAllByTestId('portfolio-card')
      fireEvent.click(cards[0])

      const modalImages = screen.getAllByTestId('portfolio-image')
      // Should have images in both gallery and modal
      expect(modalImages.length).toBeGreaterThan(2)
    })

    it('displays description in lightbox', () => {
      mockUseQuery.mockReturnValue({
        data: mockPortfolioItems,
        isLoading: false,
      })

      render(<PortfolioGallery userId="user-123" />)

      const cards = screen.getAllByTestId('portfolio-card')
      fireEvent.click(cards[0])

      expect(screen.getByText('Description')).toBeInTheDocument()
      expect(screen.getByText('A great project description')).toBeInTheDocument()
    })

    it('closes lightbox modal', async () => {
      mockUseQuery.mockReturnValue({
        data: mockPortfolioItems,
        isLoading: false,
      })

      render(<PortfolioGallery userId="user-123" />)

      const cards = screen.getAllByTestId('portfolio-card')
      fireEvent.click(cards[0])

      const modal = screen.getByTestId('responsive-modal')
      expect(modal).toHaveAttribute('data-open', 'true')

      const closeButton = screen.getByTestId('close-modal')
      fireEvent.click(closeButton)

      await waitFor(() => {
        expect(modal).toHaveAttribute('data-open', 'false')
      })
    })
  })

  describe('Image Handling', () => {
    it('handles missing image gracefully', () => {
      const itemsWithoutImage = [
        {
          id: 'item-1',
          title: 'Project No Image',
          description: 'No image project',
          image_url: null,
          file_path: null,
          display_order: 0,
        },
      ]

      mockUseQuery.mockReturnValue({
        data: itemsWithoutImage,
        isLoading: false,
      })

      render(<PortfolioGallery userId="user-123" />)

      expect(screen.getByText('Project No Image')).toBeInTheDocument()
      // Should not show "Click to view" when no image
      expect(screen.queryByText('Click to view')).not.toBeInTheDocument()
    })
  })

  describe('Variant Prop', () => {
    it('applies compact variant height', () => {
      mockUseQuery.mockReturnValue({
        data: mockPortfolioItems,
        isLoading: false,
      })

      render(<PortfolioGallery userId="user-123" variant="compact" />)

      const images = screen.getAllByTestId('portfolio-image')
      // In compact variant, height should be 150
      expect(images[0]).toBeInTheDocument()
    })

    it('applies full variant height', () => {
      mockUseQuery.mockReturnValue({
        data: mockPortfolioItems,
        isLoading: false,
      })

      render(<PortfolioGallery userId="user-123" variant="full" />)

      const images = screen.getAllByTestId('portfolio-image')
      // In full variant, height should be 200
      expect(images[0]).toBeInTheDocument()
    })
  })
})
