import { render, screen, fireEvent, waitFor, act } from '@testing-library/react'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import React, { type ReactNode } from 'react'

// Mock processCroppedImage
const mockProcessCroppedImage = vi.fn()
vi.mock('../utils/imageProcessing', () => ({
  processCroppedImage: (...args: unknown[]) => mockProcessCroppedImage(...args),
}))

// Mock AvatarCropModal
const mockAvatarCropModal = vi.fn()
vi.mock('../AvatarCropModal', () => ({
  AvatarCropModal: (props: unknown) => {
    mockAvatarCropModal(props)
    return <div data-testid="avatar-crop-modal">AvatarCropModal</div>
  },
}))

// Mock UploadSurface
let storedOnSelect: ((selection: unknown) => Promise<void> | void) | null = null
let storedOnError: ((message: string) => void) | null = null
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
    onSelect?: (selection: unknown) => Promise<void> | void
    onError?: (message: string) => void
  }) => {
    storedOnSelect = onSelect || null
    storedOnError = onError || null
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

  // biome-ignore lint/a11y/useAltText: Mock component, alt text is provided in the img element
  const Image = ({ source, ...rest }: { source?: { uri?: string } }) => (
    <img src={source?.uri} alt="Avatar" aria-label="Avatar" {...rest} />
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
  Camera: ({ size, color }: { size?: number; color?: string }) => (
    <span data-testid="icon-camera" data-size={size} data-color={color}>
      📷
    </span>
  ),
  User: ({ size, color }: { size?: number; color?: string }) => (
    <span data-testid="icon-user" data-size={size} data-color={color}>
      👤
    </span>
  ),
  Delete: ({ size, color }: { size?: number; color?: string }) => (
    <span data-testid="icon-delete" data-size={size} data-color={color}>
      🗑️
    </span>
  ),
  Edit3: ({ size, color }: { size?: number; color?: string }) => (
    <span data-testid="icon-edit" data-size={size} data-color={color}>
      ✏️
    </span>
  ),
}))

const { AvatarImagePicker } = await import('../AvatarImagePicker')

describe('Avatar Image Picker Integration Tests', () => {
  const mockOnImageSelect = vi.fn()
  const mockOnCropError = vi.fn()

  beforeEach(() => {
    vi.clearAllMocks()
    storedOnSelect = null
    storedOnError = null
    mockCreateObjectURL.mockReturnValue('blob:test-url')
    mockProcessCroppedImage.mockResolvedValue({
      dataUrl: 'data:image/jpeg;base64,processed',
      mimeType: 'image/jpeg',
      width: 512,
      height: 512,
      size: 100000,
    })
  })

  describe('Full Workflow: Upload → Crop → Save', () => {
    it('completes full upload to crop to save workflow', async () => {
      render(<AvatarImagePicker value="" onImageSelect={mockOnImageSelect} />)

      // Step 1: Upload image
      const mockFile = new File(['test'], 'test.jpg', { type: 'image/jpeg' })
      const mockSelection = {
        platform: 'web' as const,
        file: mockFile,
      }

      expect(storedOnSelect).toBeDefined()
      if (storedOnSelect) {
        await act(async () => {
          await storedOnSelect(mockSelection)
        })
      }

      // Step 2: Wait for crop modal to open
      await waitFor(() => {
        const calls = mockAvatarCropModal.mock.calls
        const lastCall = calls[calls.length - 1]
        expect(lastCall?.[0]?.open).toBe(true)
      })

      // Step 3: Complete crop
      const calls = mockAvatarCropModal.mock.calls
      const lastCall = calls[calls.length - 1]
      const onCropComplete = lastCall[0]?.onCropComplete

      expect(onCropComplete).toBeDefined()
      if (onCropComplete) {
        await act(async () => {
          onCropComplete('data:image/jpeg;base64,cropped')
        })
      }

      // Step 4: Verify final state
      expect(mockOnImageSelect).toHaveBeenCalledWith('data:image/jpeg;base64,cropped')
      expect(mockRevokeObjectURL).toHaveBeenCalled()
    })
  })

  describe('Full Workflow: Upload → Cancel', () => {
    it('completes upload to cancel workflow', async () => {
      render(<AvatarImagePicker value="" onImageSelect={mockOnImageSelect} />)

      // Step 1: Upload image
      const mockFile = new File(['test'], 'test.jpg', { type: 'image/jpeg' })
      const mockSelection = {
        platform: 'web' as const,
        file: mockFile,
      }

      expect(storedOnSelect).toBeDefined()
      if (storedOnSelect) {
        await act(async () => {
          await storedOnSelect(mockSelection)
        })
      }

      // Step 2: Wait for crop modal to open
      await waitFor(() => {
        const calls = mockAvatarCropModal.mock.calls
        const lastCall = calls[calls.length - 1]
        expect(lastCall?.[0]?.open).toBe(true)
      })

      // Step 3: Cancel crop
      const calls = mockAvatarCropModal.mock.calls
      const lastCall = calls[calls.length - 1]
      const onOpenChange = lastCall[0]?.onOpenChange

      expect(onOpenChange).toBeDefined()
      if (onOpenChange) {
        await act(async () => {
          onOpenChange(false)
        })
      }

      // Step 4: Verify state
      expect(mockOnImageSelect).not.toHaveBeenCalled()
      expect(mockRevokeObjectURL).toHaveBeenCalled()
    })
  })

  describe('Full Workflow: Edit Existing → Crop → Save', () => {
    it('completes edit existing to crop to save workflow', async () => {
      const existingAvatar = 'https://example.com/avatar.jpg'
      render(<AvatarImagePicker value={existingAvatar} onImageSelect={mockOnImageSelect} />)

      // Step 1: Click Edit button
      const editText = screen.getByText('Edit')
      const editButton = editText.closest('button')
      expect(editButton).toBeInTheDocument()
      if (editButton) {
        fireEvent.click(editButton)
      }

      // Step 2: Wait for crop modal to open with existing avatar
      await waitFor(() => {
        const calls = mockAvatarCropModal.mock.calls
        const lastCall = calls[calls.length - 1]
        expect(lastCall?.[0]?.open).toBe(true)
        expect(lastCall?.[0]?.imageUri).toBe(existingAvatar)
      })

      // Step 3: Complete crop
      const calls = mockAvatarCropModal.mock.calls
      const lastCall = calls[calls.length - 1]
      const onCropComplete = lastCall[0]?.onCropComplete

      expect(onCropComplete).toBeDefined()
      if (onCropComplete) {
        await act(async () => {
          onCropComplete('data:image/jpeg;base64,edited')
        })
      }

      // Step 4: Verify final state
      expect(mockOnImageSelect).toHaveBeenCalledWith('data:image/jpeg;base64,edited')
    })
  })

  describe('Full Workflow: Edit Existing → Cancel', () => {
    it('preserves original avatar when edit is cancelled', async () => {
      const existingAvatar = 'https://example.com/avatar.jpg'
      render(<AvatarImagePicker value={existingAvatar} onImageSelect={mockOnImageSelect} />)

      // Step 1: Click Edit button
      const editText = screen.getByText('Edit')
      const editButton = editText.closest('button')
      expect(editButton).toBeInTheDocument()
      if (editButton) {
        fireEvent.click(editButton)
      }

      // Step 2: Wait for crop modal to open
      await waitFor(() => {
        const calls = mockAvatarCropModal.mock.calls
        const lastCall = calls[calls.length - 1]
        expect(lastCall?.[0]?.open).toBe(true)
      })

      // Step 3: Cancel crop
      const calls = mockAvatarCropModal.mock.calls
      const lastCall = calls[calls.length - 1]
      const onOpenChange = lastCall[0]?.onOpenChange

      expect(onOpenChange).toBeDefined()
      if (onOpenChange) {
        await act(async () => {
          onOpenChange(false)
        })
      }

      // Step 4: Verify original is preserved
      expect(mockOnImageSelect).not.toHaveBeenCalled()
      // Original avatar should still be displayed
      const image = screen.getByAltText('Avatar')
      expect(image).toHaveAttribute('src', existingAvatar)
    })
  })

  describe('Error Recovery', () => {
    it('recovers from upload error', async () => {
      render(
        <AvatarImagePicker
          value=""
          onImageSelect={mockOnImageSelect}
          onCropError={mockOnCropError}
        />
      )

      // Simulate upload error
      expect(storedOnError).toBeDefined()
      if (storedOnError) {
        storedOnError('Upload failed')
      }

      expect(mockOnCropError).toHaveBeenCalledWith('Upload failed')
      // Component should still be functional after error
      expect(screen.getByTestId('upload-root')).toBeInTheDocument()
    })

    it('recovers from crop processing error', async () => {
      const processingError = new Error('Crop processing failed')
      mockProcessCroppedImage.mockRejectedValueOnce(processingError)

      render(
        <AvatarImagePicker
          value=""
          onImageSelect={mockOnImageSelect}
          onCropError={mockOnCropError}
        />
      )

      // Step 1: Upload image
      const mockFile = new File(['test'], 'test.jpg', { type: 'image/jpeg' })
      const mockSelection = {
        platform: 'web' as const,
        file: mockFile,
      }

      expect(storedOnSelect).toBeDefined()
      if (storedOnSelect) {
        await act(async () => {
          await storedOnSelect(mockSelection)
        })
      }

      // Step 2: Wait for crop modal to open
      await waitFor(() => {
        const calls = mockAvatarCropModal.mock.calls
        const lastCall = calls[calls.length - 1]
        expect(lastCall?.[0]?.open).toBe(true)
      })

      // Step 3: Try to save (will fail)
      const calls = mockAvatarCropModal.mock.calls
      const lastCall = calls[calls.length - 1]
      const onError = lastCall[0]?.onError

      expect(onError).toBeDefined()
      if (onError) {
        onError('Crop processing failed')
      }

      // Step 4: Verify error handling
      expect(mockOnCropError).toHaveBeenCalledWith('Crop processing failed')
      expect(mockRevokeObjectURL).toHaveBeenCalled()
    })

    it('allows retry after error', async () => {
      render(
        <AvatarImagePicker
          value=""
          onImageSelect={mockOnImageSelect}
          onCropError={mockOnCropError}
        />
      )

      // First attempt fails
      expect(storedOnError).toBeDefined()
      if (storedOnError) {
        storedOnError('First attempt failed')
      }

      expect(mockOnCropError).toHaveBeenCalledWith('First attempt failed')

      // Second attempt succeeds
      const mockFile = new File(['test'], 'test.jpg', { type: 'image/jpeg' })
      const mockSelection = {
        platform: 'web' as const,
        file: mockFile,
      }

      vi.clearAllMocks()
      mockOnCropError.mockClear()

      expect(storedOnSelect).toBeDefined()
      if (storedOnSelect) {
        await act(async () => {
          await storedOnSelect(mockSelection)
        })
      }

      // Should be able to proceed with second attempt
      await waitFor(() => {
        const calls = mockAvatarCropModal.mock.calls
        const lastCall = calls[calls.length - 1]
        expect(lastCall?.[0]?.open).toBe(true)
      })
    })
  })

  describe('State Persistence', () => {
    it('maintains modal state correctly', async () => {
      render(<AvatarImagePicker value="" onImageSelect={mockOnImageSelect} />)

      // Open modal
      const mockFile = new File(['test'], 'test.jpg', { type: 'image/jpeg' })
      const mockSelection = {
        platform: 'web' as const,
        file: mockFile,
      }

      expect(storedOnSelect).toBeDefined()
      if (storedOnSelect) {
        await act(async () => {
          await storedOnSelect(mockSelection)
        })
      }

      await waitFor(() => {
        const calls = mockAvatarCropModal.mock.calls
        const lastCall = calls[calls.length - 1]
        expect(lastCall?.[0]?.open).toBe(true)
      })

      // Close modal
      const calls = mockAvatarCropModal.mock.calls
      const lastCall = calls[calls.length - 1]
      const onOpenChange = lastCall[0]?.onOpenChange

      if (onOpenChange) {
        await act(async () => {
          onOpenChange(false)
        })
      }

      // Verify modal is closed
      await waitFor(() => {
        const calls = mockAvatarCropModal.mock.calls
        const lastCall = calls[calls.length - 1]
        expect(lastCall?.[0]?.open).toBe(false)
      })
    })

    it('maintains image state correctly', async () => {
      const existingAvatar = 'https://example.com/avatar.jpg'
      render(<AvatarImagePicker value={existingAvatar} onImageSelect={mockOnImageSelect} />)

      // Verify initial state
      const image = screen.getByAltText('Avatar')
      expect(image).toHaveAttribute('src', existingAvatar)

      // Edit and save
      const editText = screen.getByText('Edit')
      const editButton = editText.closest('button')
      if (editButton) {
        fireEvent.click(editButton)
      }

      await waitFor(() => {
        const calls = mockAvatarCropModal.mock.calls
        const lastCall = calls[calls.length - 1]
        expect(lastCall?.[0]?.open).toBe(true)
      })

      const calls = mockAvatarCropModal.mock.calls
      const lastCall = calls[calls.length - 1]
      const onCropComplete = lastCall[0]?.onCropComplete

      if (onCropComplete) {
        await act(async () => {
          onCropComplete('data:image/jpeg;base64,new')
        })
      }

      // Verify state updated
      expect(mockOnImageSelect).toHaveBeenCalledWith('data:image/jpeg;base64,new')
    })
  })

  describe('Multiple Rapid Operations', () => {
    it('prevents race conditions with rapid uploads', async () => {
      render(<AvatarImagePicker value="" onImageSelect={mockOnImageSelect} />)

      // Rapidly trigger multiple uploads
      const mockFile1 = new File(['test1'], 'test1.jpg', { type: 'image/jpeg' })
      const mockFile2 = new File(['test2'], 'test2.jpg', { type: 'image/jpeg' })

      expect(storedOnSelect).toBeDefined()
      if (storedOnSelect) {
        // Trigger first upload
        await act(async () => {
          await storedOnSelect({ platform: 'web' as const, file: mockFile1 })
        })

        // Immediately trigger second upload
        await act(async () => {
          await storedOnSelect({ platform: 'web' as const, file: mockFile2 })
        })
      }

      // Should handle both gracefully
      expect(mockCreateObjectURL).toHaveBeenCalledTimes(2)
    })

    it('handles rapid open/close of crop modal', async () => {
      render(<AvatarImagePicker value="" onImageSelect={mockOnImageSelect} />)

      const mockFile = new File(['test'], 'test.jpg', { type: 'image/jpeg' })
      const mockSelection = {
        platform: 'web' as const,
        file: mockFile,
      }

      expect(storedOnSelect).toBeDefined()
      if (storedOnSelect) {
        await act(async () => {
          await storedOnSelect(mockSelection)
        })
      }

      await waitFor(() => {
        const calls = mockAvatarCropModal.mock.calls
        const lastCall = calls[calls.length - 1]
        expect(lastCall?.[0]?.open).toBe(true)
      })

      const calls = mockAvatarCropModal.mock.calls
      const lastCall = calls[calls.length - 1]
      const onOpenChange = lastCall[0]?.onOpenChange

      // Rapidly open and close
      if (onOpenChange) {
        await act(async () => {
          onOpenChange(false)
          onOpenChange(true)
          onOpenChange(false)
        })
      }

      // Should handle gracefully
      expect(mockRevokeObjectURL).toHaveBeenCalled()
    })
  })
})
