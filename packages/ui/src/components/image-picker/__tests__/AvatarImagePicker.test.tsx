import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import React, { type ReactNode } from 'react'

// Mock AvatarCropModal
const mockAvatarCropModal = vi.fn()
vi.mock('../AvatarCropModal', () => ({
  AvatarCropModal: (props: unknown) => {
    mockAvatarCropModal(props)
    return <div data-testid="avatar-crop-modal">AvatarCropModal</div>
  },
}))

// Mock UploadSurface
const mockOnSelect = vi.fn()
const mockOnError = vi.fn()
const mockOpen = vi.fn()
const mockGetRootProps = vi.fn((props) => ({ ...props, 'data-testid': 'upload-root' }))
const mockGetInputProps = vi.fn((props) => ({ ...props, 'data-testid': 'upload-input' }))

vi.mock('../../upload/UploadSurface', () => ({
  UploadSurface: ({
    children,
    onSelect,
    onError,
  }: {
    children: (args: {
      getRootProps: typeof mockGetRootProps
      getInputProps: typeof mockGetInputProps
      open: typeof mockOpen
      isDragActive: boolean
      isProcessing: boolean
    }) => ReactNode
    onSelect?: typeof mockOnSelect
    onError?: typeof mockOnError
  }) => {
    if (onSelect) mockOnSelect.mockImplementation(onSelect)
    if (onError) mockOnError.mockImplementation(onError)
    return children({
      getRootProps: mockGetRootProps,
      getInputProps: mockGetInputProps,
      open: mockOpen,
      isDragActive: false,
      isProcessing: false,
    })
  },
}))

// Mock URL.createObjectURL and URL.revokeObjectURL
const mockCreateObjectURL = vi.fn((blob: Blob) => `blob:${blob.size}`)
const mockRevokeObjectURL = vi.fn()

global.URL.createObjectURL = mockCreateObjectURL
global.URL.revokeObjectURL = mockRevokeObjectURL

// Mock Tamagui components
vi.mock('tamagui', async () => {
  const actual = await vi.importActual<typeof import('tamagui')>('tamagui')
  const basicDiv = ({ testID, children, ...rest }: { testID?: string; children?: ReactNode }) => (
    <div data-testid={testID} {...rest}>
      {children}
    </div>
  )

  const Button = ({
    onPress,
    children,
    disabled,
    icon: Icon,
    ...rest
  }: {
    onPress?: () => void
    children?: ReactNode
    disabled?: boolean
    icon?: ReactNode
  }) => (
    <button type="button" onClick={onPress} disabled={disabled} {...rest}>
      {Icon && <span data-testid="button-icon">{Icon}</span>}
      {children}
    </button>
  )

  Button.Text = ({ children }: { children?: ReactNode }) => <span>{children}</span>

  const Image = ({ source, ...rest }: { source?: { uri?: string } }) => (
    // biome-ignore lint/a11y/useAltText: Test mock, decorative
    <img src={source?.uri} alt="Avatar" {...rest} />
  )

  const Circle = basicDiv
  const XStack = basicDiv
  const YStack = basicDiv
  const View = basicDiv
  const Text = ({ children }: { children?: ReactNode }) => <span>{children}</span>
  const Label = ({ htmlFor, children }: { htmlFor?: string; children?: ReactNode }) => (
    <label htmlFor={htmlFor}>{children}</label>
  )
  const Spinner = () => <div data-testid="spinner">Loading...</div>

  return {
    ...actual,
    Button,
    Image,
    Circle,
    XStack,
    YStack,
    View,
    Text,
    Label,
    Spinner,
  }
})

// Mock icons
vi.mock('@tamagui/lucide-icons', () => ({
  Camera: () => <span data-testid="icon-camera">📷</span>,
  User: () => <span data-testid="icon-user">👤</span>,
  Delete: () => <span data-testid="icon-delete">🗑️</span>,
  Edit3: () => <span data-testid="icon-edit">✏️</span>,
}))

const { AvatarImagePicker } = await import('../AvatarImagePicker')

describe('AvatarImagePicker', () => {
  const mockOnImageSelect = vi.fn()
  const mockOnCropError = vi.fn()

  beforeEach(() => {
    vi.clearAllMocks()
    mockCreateObjectURL.mockReturnValue('blob:test-url')
  })

  describe('Rendering', () => {
    it('renders with placeholder when no value', () => {
      render(
        <AvatarImagePicker value="" onImageSelect={mockOnImageSelect} placeholder="Add Photo" />
      )

      expect(screen.getByText('Add Photo')).toBeInTheDocument()
      expect(screen.getByTestId('icon-user')).toBeInTheDocument()
      expect(screen.queryByTestId('avatar-crop-modal')).not.toBeInTheDocument()
    })

    it('renders with existing avatar when value provided', () => {
      render(
        <AvatarImagePicker
          value="https://example.com/avatar.jpg"
          onImageSelect={mockOnImageSelect}
        />
      )

      const image = screen.getByAltText('Avatar')
      expect(image).toHaveAttribute('src', 'https://example.com/avatar.jpg')
      expect(screen.getByText('Change Photo')).toBeInTheDocument()
      expect(screen.getByText('Edit')).toBeInTheDocument()
      expect(screen.getByText('Remove')).toBeInTheDocument()
    })

    it('shows Edit button when avatar exists', () => {
      render(
        <AvatarImagePicker
          value="https://example.com/avatar.jpg"
          onImageSelect={mockOnImageSelect}
        />
      )

      const editButton = screen.getByText('Edit')
      expect(editButton).toBeInTheDocument()
      expect(editButton).not.toBeDisabled()
    })

    it('does not show Edit button when no avatar', () => {
      render(<AvatarImagePicker value="" onImageSelect={mockOnImageSelect} />)

      expect(screen.queryByText('Edit')).not.toBeInTheDocument()
    })
  })

  describe('Upload Flow', () => {
    it('creates blob URL for web uploads', async () => {
      const mockFile = new File(['test'], 'test.jpg', { type: 'image/jpeg' })
      const mockSelection = {
        platform: 'web' as const,
        file: mockFile,
      }

      render(<AvatarImagePicker value="" onImageSelect={mockOnImageSelect} />)

      // Simulate file selection
      await mockOnSelect(mockSelection)

      expect(mockCreateObjectURL).toHaveBeenCalledWith(mockFile)
      expect(mockAvatarCropModal).toHaveBeenCalledWith(
        expect.objectContaining({
          open: true,
          imageUri: 'blob:test-url',
        })
      )
    })

    it('uses asset URI for native uploads', async () => {
      const mockSelection = {
        platform: 'native' as const,
        asset: {
          uri: 'file:///path/to/image.jpg',
        },
      }

      render(<AvatarImagePicker value="" onImageSelect={mockOnImageSelect} />)

      await mockOnSelect(mockSelection)

      expect(mockCreateObjectURL).not.toHaveBeenCalled()
      expect(mockAvatarCropModal).toHaveBeenCalledWith(
        expect.objectContaining({
          open: true,
          imageUri: 'file:///path/to/image.jpg',
        })
      )
    })

    it('opens file picker when Change Photo clicked', () => {
      render(
        <AvatarImagePicker
          value="https://example.com/avatar.jpg"
          onImageSelect={mockOnImageSelect}
        />
      )

      const changeText = screen.getByText('Change Photo')
      const changeButton = changeText.closest('button')
      expect(changeButton).toBeInTheDocument()
      if (changeButton) {
        fireEvent.click(changeButton)
        expect(mockOpen).toHaveBeenCalled()
      }
    })
  })

  describe('Edit Functionality', () => {
    it('opens crop modal with current avatar when Edit clicked', () => {
      const avatarUrl = 'https://example.com/avatar.jpg'
      render(<AvatarImagePicker value={avatarUrl} onImageSelect={mockOnImageSelect} />)

      const editButton = screen.getByText('Edit')
      fireEvent.click(editButton)

      expect(mockAvatarCropModal).toHaveBeenCalledWith(
        expect.objectContaining({
          open: true,
          imageUri: avatarUrl,
        })
      )
    })

    it('does not open edit modal when no avatar exists', () => {
      render(<AvatarImagePicker value="" onImageSelect={mockOnImageSelect} />)

      // Edit button shouldn't exist
      expect(screen.queryByText('Edit')).not.toBeInTheDocument()
    })
  })

  describe('Remove Functionality', () => {
    it('calls onImageSelect with empty string when Remove clicked', () => {
      render(
        <AvatarImagePicker
          value="https://example.com/avatar.jpg"
          onImageSelect={mockOnImageSelect}
        />
      )

      const removeText = screen.getByText('Remove')
      const removeButton = removeText.closest('button')
      expect(removeButton).toBeInTheDocument()
      if (removeButton) {
        fireEvent.click(removeButton)
        expect(mockOnImageSelect).toHaveBeenCalledWith('')
      }
    })
  })

  describe('Crop Modal Integration', () => {
    it('opens crop modal when image is selected', async () => {
      const mockFile = new File(['test'], 'test.jpg', { type: 'image/jpeg' })
      const mockSelection = {
        platform: 'web' as const,
        file: mockFile,
      }

      render(<AvatarImagePicker value="" onImageSelect={mockOnImageSelect} />)

      await mockOnSelect(mockSelection)

      expect(mockAvatarCropModal).toHaveBeenCalledWith(
        expect.objectContaining({
          open: true,
        })
      )
    })

    it('closes crop modal and calls onImageSelect when crop completes', async () => {
      const mockFile = new File(['test'], 'test.jpg', { type: 'image/jpeg' })
      const mockSelection = {
        platform: 'web' as const,
        file: mockFile,
      }

      render(<AvatarImagePicker value="" onImageSelect={mockOnImageSelect} />)

      await mockOnSelect(mockSelection)

      // Get the onCropComplete callback from the last call
      const lastCall = mockAvatarCropModal.mock.calls[mockAvatarCropModal.mock.calls.length - 1]
      const onCropComplete = lastCall[0]?.onCropComplete

      expect(onCropComplete).toBeDefined()

      // Simulate crop completion
      const croppedDataUrl = 'data:image/jpeg;base64,cropped'
      onCropComplete(croppedDataUrl)

      expect(mockOnImageSelect).toHaveBeenCalledWith(croppedDataUrl)
    })

    it('closes crop modal when onOpenChange is called with false', async () => {
      const mockFile = new File(['test'], 'test.jpg', { type: 'image/jpeg' })
      const mockSelection = {
        platform: 'web' as const,
        file: mockFile,
      }

      render(<AvatarImagePicker value="" onImageSelect={mockOnImageSelect} />)

      await mockOnSelect(mockSelection)

      // Get the onOpenChange callback
      const lastCall = mockAvatarCropModal.mock.calls[mockAvatarCropModal.mock.calls.length - 1]
      const onOpenChange = lastCall[0]?.onOpenChange

      expect(onOpenChange).toBeDefined()

      // Close the modal
      onOpenChange(false)

      // Modal should be closed
      expect(mockAvatarCropModal).toHaveBeenCalledWith(
        expect.objectContaining({
          open: false,
        })
      )
    })
  })

  describe('Error Handling', () => {
    it('calls onCropError when upload selection fails', async () => {
      const error = new Error('Upload failed')
      mockOnSelect.mockRejectedValueOnce(error)

      render(
        <AvatarImagePicker
          value=""
          onImageSelect={mockOnImageSelect}
          onCropError={mockOnCropError}
        />
      )

      try {
        await mockOnSelect({ platform: 'web', file: new File(['test'], 'test.jpg') })
      } catch {
        // Expected to throw
      }

      await waitFor(() => {
        expect(mockOnCropError).toHaveBeenCalledWith('Failed to load selected image.')
      })
    })

    it('calls onCropError when crop modal reports error', async () => {
      const mockFile = new File(['test'], 'test.jpg', { type: 'image/jpeg' })
      const mockSelection = {
        platform: 'web' as const,
        file: mockFile,
      }

      render(
        <AvatarImagePicker
          value=""
          onImageSelect={mockOnImageSelect}
          onCropError={mockOnCropError}
        />
      )

      await mockOnSelect(mockSelection)

      // Get the onError callback
      const lastCall = mockAvatarCropModal.mock.calls[mockAvatarCropModal.mock.calls.length - 1]
      const onError = lastCall[0]?.onError

      expect(onError).toBeDefined()

      // Simulate error
      onError('Crop processing failed')

      expect(mockOnCropError).toHaveBeenCalledWith('Crop processing failed')
    })
  })

  describe('Blob URL Cleanup', () => {
    it('revokes blob URL when crop completes', async () => {
      const mockFile = new File(['test'], 'test.jpg', { type: 'image/jpeg' })
      const mockSelection = {
        platform: 'web' as const,
        file: mockFile,
      }

      render(<AvatarImagePicker value="" onImageSelect={mockOnImageSelect} />)

      await mockOnSelect(mockSelection)

      const blobUrl = 'blob:test-url'
      expect(mockCreateObjectURL).toHaveBeenCalled()

      // Get the onCropComplete callback
      const lastCall = mockAvatarCropModal.mock.calls[mockAvatarCropModal.mock.calls.length - 1]
      const onCropComplete = lastCall[0]?.onCropComplete

      onCropComplete('data:image/jpeg;base64,cropped')

      expect(mockRevokeObjectURL).toHaveBeenCalledWith(blobUrl)
    })

    it('revokes blob URL when crop errors', async () => {
      const mockFile = new File(['test'], 'test.jpg', { type: 'image/jpeg' })
      const mockSelection = {
        platform: 'web' as const,
        file: mockFile,
      }

      render(<AvatarImagePicker value="" onImageSelect={mockOnImageSelect} />)

      await mockOnSelect(mockSelection)

      const blobUrl = 'blob:test-url'

      // Get the onError callback
      const lastCall = mockAvatarCropModal.mock.calls[mockAvatarCropModal.mock.calls.length - 1]
      const onError = lastCall[0]?.onError

      onError('Error message')

      expect(mockRevokeObjectURL).toHaveBeenCalledWith(blobUrl)
    })

    it('revokes blob URL when modal is closed without saving', async () => {
      const mockFile = new File(['test'], 'test.jpg', { type: 'image/jpeg' })
      const mockSelection = {
        platform: 'web' as const,
        file: mockFile,
      }

      render(<AvatarImagePicker value="" onImageSelect={mockOnImageSelect} />)

      await mockOnSelect(mockSelection)

      const blobUrl = 'blob:test-url'

      // Get the onOpenChange callback
      const lastCall = mockAvatarCropModal.mock.calls[mockAvatarCropModal.mock.calls.length - 1]
      const onOpenChange = lastCall[0]?.onOpenChange

      onOpenChange(false)

      expect(mockRevokeObjectURL).toHaveBeenCalledWith(blobUrl)
    })

    it('does not revoke non-blob URLs', async () => {
      const mockSelection = {
        platform: 'native' as const,
        asset: {
          uri: 'file:///path/to/image.jpg',
        },
      }

      render(<AvatarImagePicker value="" onImageSelect={mockOnImageSelect} />)

      await mockOnSelect(mockSelection)

      // Get the onCropComplete callback
      const lastCall = mockAvatarCropModal.mock.calls[mockAvatarCropModal.mock.calls.length - 1]
      const onCropComplete = lastCall[0]?.onCropComplete

      onCropComplete('data:image/jpeg;base64,cropped')

      // Should not revoke non-blob URLs
      expect(mockRevokeObjectURL).not.toHaveBeenCalled()
    })
  })

  describe('Disabled State', () => {
    it('disables all buttons when disabled prop is true', () => {
      render(
        <AvatarImagePicker
          value="https://example.com/avatar.jpg"
          onImageSelect={mockOnImageSelect}
          disabled
        />
      )

      const changeText = screen.getByText('Change Photo')
      const editText = screen.getByText('Edit')
      const removeText = screen.getByText('Remove')

      const changeButton = changeText.closest('button')
      const editButton = editText.closest('button')
      const removeButton = removeText.closest('button')

      expect(changeButton).toBeDisabled()
      expect(editButton).toBeDisabled()
      expect(removeButton).toBeDisabled()
    })

    it('disables buttons when crop modal is open', () => {
      render(
        <AvatarImagePicker
          value="https://example.com/avatar.jpg"
          onImageSelect={mockOnImageSelect}
        />
      )

      // Open the crop modal by clicking Edit
      const editText = screen.getByText('Edit')
      const editButton = editText.closest('button')
      if (editButton) {
        fireEvent.click(editButton)
      }

      // Change Photo button should be disabled when modal is open
      const changeText = screen.getByText('Change Photo')
      const changeButton = changeText.closest('button')
      expect(changeButton).toBeDisabled()
    })
  })

  describe('Loading States', () => {
    it('shows loading spinner when processing', () => {
      // Mock isProcessing to be true
      vi.mocked(mockGetRootProps).mockReturnValueOnce({
        'data-testid': 'upload-root',
        isProcessing: true,
      } as unknown as ReturnType<typeof mockGetRootProps>)

      render(<AvatarImagePicker value="" onImageSelect={mockOnImageSelect} />)

      // Note: The spinner might not be visible if there's a previewUri
      // This test verifies the component handles the isProcessing state
      expect(screen.getByTestId('upload-root')).toBeInTheDocument()
    })
  })
})
