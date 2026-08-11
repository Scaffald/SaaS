import { fireEvent, render, screen } from '@testing-library/react'
import type { ReactNode } from 'react'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { PortfolioManager } from '../PortfolioManager'

// Mock window.confirm
const mockConfirm = vi.fn()
global.confirm = mockConfirm

// Mock toast
const mockShow = vi.fn()
// Mock API
const mockPortfolioItems = [
  {
    id: 'item-1',
    title: 'Project Alpha',
    description: 'A great project',
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
  mockCreateMutation: vi.fn(),
  mockUpdateMutation: vi.fn(),
  mockDeleteMutation: vi.fn(),
  mockReorderMutation: vi.fn(),
  mockUploadImageMutation: vi.fn(),
  mockInvalidate: vi.fn(),
}))

const {
  mockUseQuery,
  mockCreateMutation,
  mockUpdateMutation,
  mockDeleteMutation,
  mockReorderMutation,
  mockUploadImageMutation,
  mockInvalidate,
} = mockMocks

vi.mock('@scf/core/utils/api', () => ({
  api: {
    portfolio: {
      list: {
        useQuery: mockMocks.mockUseQuery,
      },
      create: {
        useMutation: () => ({
          mutate: mockMocks.mockCreateMutation,
          mutateAsync: vi.fn(),
          isPending: false,
        }),
      },
      update: {
        useMutation: () => ({
          mutate: mockMocks.mockUpdateMutation,
          mutateAsync: vi.fn(),
          isPending: false,
        }),
      },
      delete: {
        useMutation: () => ({
          mutate: mockMocks.mockDeleteMutation,
          mutateAsync: vi.fn(),
          isPending: false,
        }),
      },
      reorder: {
        useMutation: () => ({
          mutate: mockMocks.mockReorderMutation,
          mutateAsync: vi.fn(),
          isPending: false,
        }),
      },
      uploadImage: {
        useMutation: () => ({
          mutate: mockMocks.mockUploadImageMutation,
          mutateAsync: vi.fn().mockResolvedValue({
            imageUrl: 'https://example.com/uploaded.jpg',
            filePath: 'portfolio/user-123/uploaded.jpg',
          }),
        }),
      },
    },
    useUtils: () => ({
      portfolio: {
        list: {
          invalidate: mockMocks.mockInvalidate,
        },
      },
    }),
  },
}))

// Mock getStorageUrl
vi.mock('@scf/core/utils/supabase/storage', () => ({
  getStorageUrl: (bucket: string, path: string) => `https://storage.example.com/${bucket}/${path}`,
}))

// Mock UI components

// Mock profile components
vi.mock('../components', () => ({
  ProfileFormPanel: ({ children }: { children?: ReactNode }) => (
    <div data-testid="profile-form-panel">{children}</div>
  ),
  ProfileResultsPanel: ({
    children,
    title,
    isLoading,
    isEmpty,
    emptyMessage,
  }: {
    children?: ReactNode
    title?: string
    isLoading?: boolean
    isEmpty?: boolean
    emptyMessage?: string
  }) => (
    <div data-testid="profile-results-panel">
      {title && <h3>{title}</h3>}
      {isLoading && <div data-testid="loading">Loading...</div>}
      {isEmpty && <div data-testid="empty">{emptyMessage}</div>}
      {children}
    </div>
  ),
  ProfileResultCard: ({
    children,
    onRemove,
    actions,
  }: {
    children?: ReactNode
    onRemove?: () => void
    actions?: ReactNode
  }) => (
    <div data-testid="profile-result-card">
      {children}
      {actions}
      {onRemove && (
        <button type="button" onClick={onRemove} data-testid="remove-button">
          Remove
        </button>
      )}
    </div>
  ),
}))

// Beyond UI mock
vi.mock('@scaffald/ui', async () => {
  const actual = await vi.importActual('@scaffald/ui')

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

  const Input = ({
    value,
    onChangeText,
    placeholder,
    ...rest
  }: {
    value?: string
    onChangeText?: (text: string) => void
    placeholder?: string
  } & Record<string, unknown>) => (
    <input
      type="text"
      value={value || ''}
      onChange={(e) => onChangeText?.(e.target.value)}
      placeholder={placeholder}
      {...rest}
    />
  )

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

  const H4 = ({
    children,
    ...rest
  }: {
    children?: ReactNode
  } & Record<string, unknown>) => <h4 {...rest}>{children}</h4>

  return {
    ...actual,
    // useToast and the Button/Input/Modal stubs are merged in from two
    // further vi.mock('@scaffald/ui') registrations that used to sit above.
    // Three registrations for one module do not combine — one factory wins,
    // nondeterministically. vitest.config.ts blamed those duplicates for this
    // file failing to transform at all (#566).
    useToast: () => ({ show: mockShow }),
  Button: ({
    children,
    onPress,
    icon,
    disabled,
    ...rest
  }: {
    children?: ReactNode
    onPress?: () => void
    icon?: ReactNode
    disabled?: boolean
  } & Record<string, unknown>) => (
    <button type="button" onClick={onPress} disabled={disabled} {...rest}>
      {icon}
      {children}
    </button>
  ),
  ImageUpload: ({
    value,
    onChange,
    ...rest
  }: {
    value?: string
    onChange?: (uri: string | null) => void
  } & Record<string, unknown>) => (
    <div data-testid="image-upload" data-value={value} {...rest}>
      <input
        type="file"
        data-testid="image-upload-input"
        onChange={(e) => {
          if (onChange && e.target.files?.[0]) {
            onChange(URL.createObjectURL(e.target.files[0]))
          }
        }}
      />
    </div>
  ),
  RichTextEditor: ({
    value,
    onChange,
    placeholder,
    ...rest
  }: {
    value?: unknown
    onChange?: (content: unknown) => void
    placeholder?: string
  } & Record<string, unknown>) => (
    <textarea
      data-testid="rich-text-editor"
      value={typeof value === 'string' ? value : ''}
      onChange={(e) => onChange?.(e.target.value)}
      placeholder={placeholder}
      {...rest}
    />
  ),
  extractPlainText: (content: unknown) => {
    if (typeof content === 'string') return content
    return 'Rich text description'
  },
  plainTextToTipTap: (text: string) => ({
    type: 'doc',
    content: [{ type: 'paragraph', content: [{ type: 'text', text }] }],
  }),
    Stack: Stack,
    Row: Stack,
    Text,
    Input,
    Image,
    H4,
  }
})

// Mock lucide icons
vi.mock('lucide-react-native', async (importOriginal) => ({
  ...(await importOriginal<Record<string, unknown>>()),
  // Icons used by PortfolioManager
  Plus: () => <span data-testid="plus-icon">Plus</span>,
  Edit3: () => <span data-testid="edit-icon">Edit3</span>,
  ArrowUp: () => <span data-testid="arrow-up-icon">ArrowUp</span>,
  ArrowDown: () => <span data-testid="arrow-down-icon">ArrowDown</span>,
  Image: () => <span data-testid="image-icon">Image</span>,
  // Icons used by routes.ts (transitive dependency)
  AlertTriangle: () => <span data-testid="alert-triangle" />,
  Bell: () => <span data-testid="bell" />,
  Briefcase: () => <span data-testid="briefcase" />,
  Building2: () => <span data-testid="building2" />,
  ClipboardCheck: () => <span data-testid="clipboard-check" />,
  CreditCard: () => <span data-testid="credit-card" />,
  FileText: () => <span data-testid="file-text" />,
  Fingerprint: () => <span data-testid="fingerprint" />,
  GraduationCap: () => <span data-testid="graduation-cap" />,
  HardDrive: () => <span data-testid="hard-drive" />,
  Palette: () => <span data-testid="palette" />,
  ShieldCheck: () => <span data-testid="shield-check" />,
  Users: () => <span data-testid="users" />,
}))

describe('PortfolioManager', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mockConfirm.mockReturnValue(true) // Default to confirming actions
    mockUseQuery.mockReturnValue({
      data: mockPortfolioItems,
      isLoading: false,
    })
  })

  describe('Rendering', () => {
    it('renders portfolio items in order', () => {
      render(<PortfolioManager userId="user-123" />)

      expect(screen.getByText('Project Alpha')).toBeInTheDocument()
      expect(screen.getByText('Project Beta')).toBeInTheDocument()
    })

    it('displays empty state when no items', () => {
      mockUseQuery.mockReturnValue({
        data: [],
        isLoading: false,
      })

      render(<PortfolioManager userId="user-123" />)

      expect(
        screen.getByText('No portfolio items yet. Add your first item to showcase your work.')
      ).toBeInTheDocument()
    })

    it('shows loading state', () => {
      mockUseQuery.mockReturnValue({
        data: undefined,
        isLoading: true,
      })

      render(<PortfolioManager userId="user-123" />)

      expect(screen.getByTestId('loading')).toBeInTheDocument()
    })
  })

  describe('Add Portfolio Item', () => {
    it('opens add form when "Add Portfolio Item" is clicked', () => {
      render(<PortfolioManager userId="user-123" />)

      const addButton = screen.getByText('Add Portfolio Item')
      fireEvent.click(addButton)

      expect(screen.getByText('Add Portfolio Item')).toBeInTheDocument() // Form header
      expect(screen.getByPlaceholderText('e.g., Project Name, Work Sample...')).toBeInTheDocument()
    })

    it('validates title is required', () => {
      render(<PortfolioManager userId="user-123" />)

      const addButton = screen.getByText('Add Portfolio Item')
      fireEvent.click(addButton)

      const saveButton = screen.getByText('Add Portfolio Item')
      fireEvent.click(saveButton)

      expect(mockShow).toHaveBeenCalledWith('Error', {
        message: 'Please enter a title for your portfolio item.',
      })
      expect(mockCreateMutation).not.toHaveBeenCalled()
    })

    it('creates new portfolio item successfully', () => {
      render(<PortfolioManager userId="user-123" />)

      const addButton = screen.getByText('Add Portfolio Item')
      fireEvent.click(addButton)

      const titleInput = screen.getByPlaceholderText('e.g., Project Name, Work Sample...')
      fireEvent.change(titleInput, { target: { value: 'New Project' } })

      const saveButton = screen.getByText('Add Portfolio Item')
      fireEvent.click(saveButton)

      expect(mockCreateMutation).toHaveBeenCalledWith({
        title: 'New Project',
        description: null,
        imageUrl: null,
        filePath: null,
        displayOrder: 2,
      })
    })
  })

  describe('Edit Portfolio Item', () => {
    it('opens edit form when edit button is clicked', () => {
      render(<PortfolioManager userId="user-123" />)

      const editButtons = screen.getAllByTestId('edit-icon')
      const editButton = editButtons[0].closest('button')
      if (editButton) {
        fireEvent.click(editButton)
      }

      expect(screen.getByText('Edit Portfolio Item')).toBeInTheDocument()
      expect(screen.getByDisplayValue('Project Alpha')).toBeInTheDocument()
    })

    it('updates portfolio item successfully', () => {
      render(<PortfolioManager userId="user-123" />)

      const editButtons = screen.getAllByTestId('edit-icon')
      const editButton = editButtons[0].closest('button')
      if (editButton) {
        fireEvent.click(editButton)
      }

      const titleInput = screen.getByDisplayValue('Project Alpha')
      fireEvent.change(titleInput, { target: { value: 'Updated Project' } })

      const updateButton = screen.getByText('Update Portfolio Item')
      fireEvent.click(updateButton)

      expect(mockUpdateMutation).toHaveBeenCalledWith({
        id: 'item-1',
        title: 'Updated Project',
        description: expect.anything(),
        imageUrl: 'https://example.com/image1.jpg',
        filePath: null,
      })
    })
  })

  describe('Delete Portfolio Item', () => {
    it('deletes portfolio item with confirmation', () => {
      render(<PortfolioManager userId="user-123" />)

      const removeButtons = screen.getAllByTestId('remove-button')
      fireEvent.click(removeButtons[0])

      expect(mockConfirm).toHaveBeenCalled()
      expect(mockDeleteMutation).toHaveBeenCalledWith({ id: 'item-1' })
    })

    it('does not delete when confirmation is cancelled', () => {
      mockConfirm.mockReturnValue(false)

      render(<PortfolioManager userId="user-123" />)

      const removeButtons = screen.getAllByTestId('remove-button')
      fireEvent.click(removeButtons[0])

      expect(mockConfirm).toHaveBeenCalled()
      expect(mockDeleteMutation).not.toHaveBeenCalled()
    })
  })

  describe('Reorder Items', () => {
    it('moves item up', () => {
      render(<PortfolioManager userId="user-123" />)

      const arrowUpButtons = screen.getAllByTestId('arrow-up-icon')
      // Click move up on second item
      const upButton = arrowUpButtons[1]?.closest('button')
      if (upButton) {
        fireEvent.click(upButton)
      }

      expect(mockReorderMutation).toHaveBeenCalled()
    })

    it('moves item down', () => {
      render(<PortfolioManager userId="user-123" />)

      const arrowDownButtons = screen.getAllByTestId('arrow-down-icon')
      // Click move down on first item
      const downButton = arrowDownButtons[0]?.closest('button')
      if (downButton) {
        fireEvent.click(downButton)
      }

      expect(mockReorderMutation).toHaveBeenCalled()
    })

    it('disables move up on first item', () => {
      render(<PortfolioManager userId="user-123" />)

      const arrowUpButtons = screen.getAllByTestId('arrow-up-icon')
      const firstButton = arrowUpButtons[0].closest('button')
      expect(firstButton).toBeDisabled()
    })

    it('disables move down on last item', () => {
      render(<PortfolioManager userId="user-123" />)

      const arrowDownButtons = screen.getAllByTestId('arrow-down-icon')
      const lastButton = arrowDownButtons[arrowDownButtons.length - 1].closest('button')
      expect(lastButton).toBeDisabled()
    })
  })

  describe('Cancel', () => {
    it('cancels add form', () => {
      render(<PortfolioManager userId="user-123" />)

      const addButton = screen.getByText('Add Portfolio Item')
      fireEvent.click(addButton)

      const cancelButtons = screen.getAllByText('Cancel')
      fireEvent.click(cancelButtons[0])

      expect(
        screen.queryByPlaceholderText('e.g., Project Name, Work Sample...')
      ).not.toBeInTheDocument()
    })

    it('cancels edit form', () => {
      render(<PortfolioManager userId="user-123" />)

      const editButtons = screen.getAllByTestId('edit-icon')
      const editButton = editButtons[0].closest('button')
      if (editButton) {
        fireEvent.click(editButton)
      }

      const cancelButtons = screen.getAllByText('Cancel')
      fireEvent.click(cancelButtons[0])

      expect(screen.queryByDisplayValue('Project Alpha')).not.toBeInTheDocument()
    })
  })

  describe('Image Display', () => {
    it('displays image from file_path when available', () => {
      render(<PortfolioManager userId="user-123" />)

      const images = screen.getAllByTestId('portfolio-image')
      expect(images[1]).toHaveAttribute(
        'src',
        'https://storage.example.com/portfolio/portfolio/user-123/item-2.jpg'
      )
    })

    it('displays image from image_url when file_path is not available', () => {
      render(<PortfolioManager userId="user-123" />)

      const images = screen.getAllByTestId('portfolio-image')
      expect(images[0]).toHaveAttribute('src', 'https://example.com/image1.jpg')
    })
  })
})
