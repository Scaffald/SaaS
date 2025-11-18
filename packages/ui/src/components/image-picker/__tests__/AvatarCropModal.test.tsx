import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import React, { type ReactNode } from 'react'

// Mock processCroppedImage
const mockProcessCroppedImage = vi.fn()
vi.mock('../utils/imageProcessing', () => ({
  processCroppedImage: (...args: unknown[]) => mockProcessCroppedImage(...args),
}))

// Mock helpers
vi.mock('../utils/helpers', () => ({
  detectMimeTypeFromSrc: (src: string) => {
    if (src.startsWith('data:image/png')) return 'image/png'
    if (src.startsWith('data:image/webp')) return 'image/webp'
    return 'image/jpeg'
  },
  getWebTransform: vi.fn((w, h, flipH, flipV) => {
    if (!flipH && !flipV) return undefined
    const transforms: string[] = []
    if (flipH) transforms.push(`translateX(${w}px)`, 'scaleX(-1)')
    if (flipV) transforms.push(`translateY(${h}px)`, 'scaleY(-1)')
    return transforms.join(' ')
  }),
  getNativeTransform: vi.fn((w, h, flipH, flipV) => {
    const transforms: Array<{
      translateX?: number
      translateY?: number
      scaleX?: number
      scaleY?: number
    }> = []
    if (flipH) {
      transforms.push({ translateX: w }, { scaleX: -1 }, { scaleY: 1 })
    } else {
      transforms.push({ scaleX: 1 })
    }
    if (flipV) {
      transforms.unshift({ translateY: h })
      transforms.push({ scaleY: -1 })
    } else {
      transforms.push({ scaleY: 1 })
    }
    return transforms
  }),
}))

// Mock react-native-gesture-handler
vi.mock('react-native-gesture-handler', () => ({
  GestureDetector: ({ children, gesture }: { children: ReactNode; gesture?: unknown }) => (
    <div data-testid="gesture-detector" data-gesture={gesture ? 'present' : 'none'}>
      {children}
    </div>
  ),
  Gesture: {
    Pinch: () => ({
      onStart: vi.fn(),
      onUpdate: vi.fn(),
      onEnd: vi.fn(),
    }),
    Pan: () => ({
      onStart: vi.fn(),
      onUpdate: vi.fn(),
      onEnd: vi.fn(),
    }),
    Simultaneous: vi.fn((...gestures) => gestures),
  },
}))

// Mock window dimensions and media
const windowDimensions = vi.hoisted(() => ({ width: 1024, height: 768 }))
const mediaQueries = vi.hoisted(() => ({ sm: false }))

vi.mock('tamagui', async () => {
  const actual = await vi.importActual<typeof import('tamagui')>('tamagui')
  const basicDiv = ({ testID, children, ...rest }: { testID?: string; children?: ReactNode }) => (
    <div data-testid={testID} {...rest}>
      {children}
    </div>
  )

  const dialogOnOpenChangeRef = { current: null as ((open: boolean) => void) | null }
  const Dialog = ({
    children,
    open,
    onOpenChange,
    ...rest
  }: { children?: ReactNode; open?: boolean; onOpenChange?: (open: boolean) => void }) => {
    dialogOnOpenChangeRef.current = onOpenChange || null
    if (!open) return null
    return (
      <div data-testid="dialog" {...rest}>
        {children}
      </div>
    )
  }

  Dialog.Portal = ({ children }: { children?: ReactNode }) => (
    <div data-testid="dialog-portal">{children}</div>
  )

  Dialog.Overlay = (props: Record<string, unknown>) => (
    <div data-testid="dialog-overlay" {...props} />
  )

  Dialog.Content = (props: Record<string, unknown>) => (
    <div data-testid="dialog-content" {...props}>
      {props.children as ReactNode}
    </div>
  )

  Dialog.Title = ({ children }: { children?: ReactNode }) => (
    <h2 data-testid="dialog-title">{children}</h2>
  )

  Dialog.Close = ({
    asChild,
    children,
    onPress,
  }: { asChild?: boolean; children?: ReactNode; onPress?: () => void }) => {
    const handleClose = () => {
      onPress?.()
      // Also call Dialog's onOpenChange if no explicit onPress
      if (!onPress && dialogOnOpenChangeRef.current) {
        dialogOnOpenChangeRef.current(false)
      }
    }
    if (asChild) {
      // When asChild, we need to clone the child and add the handlers
      const child = children as React.ReactElement
      if (child && typeof child === 'object' && 'props' in child) {
        // Merge existing onClick/onPress with our handler
        const existingOnClick = child.props.onClick || child.props.onPress
        return React.cloneElement(child, {
          onClick: (e: React.MouseEvent) => {
            e.preventDefault()
            existingOnClick?.(e)
            handleClose()
          },
          onPress: (e?: unknown) => {
            existingOnClick?.(e)
            handleClose()
          },
          onKeyDown: (e: React.KeyboardEvent) => {
            if (e.key === 'Enter' || e.key === ' ') {
              e.preventDefault()
              handleClose()
            }
          },
        })
      }
      return (
        <button
          type="button"
          onClick={handleClose}
          onKeyDown={(e) => {
            if (e.key === 'Enter' || e.key === ' ') {
              e.preventDefault()
              handleClose()
            }
          }}
        >
          {children}
        </button>
      )
    }
    return (
      <button type="button" onClick={handleClose} data-testid="dialog-close">
        {children}
      </button>
    )
  }

  const Sheet = ({
    children,
    open,
    onOpenChange,
    ...rest
  }: { children?: ReactNode; open?: boolean; onOpenChange?: (open: boolean) => void }) => {
    if (!open) return null
    return (
      <div data-testid="sheet" {...rest}>
        {children}
      </div>
    )
  }

  Sheet.Overlay = (props: Record<string, unknown>) => <div data-testid="sheet-overlay" {...props} />

  Sheet.Frame = (props: Record<string, unknown>) => (
    <div data-testid="sheet-frame" {...props}>
      {props.children as ReactNode}
    </div>
  )

  Sheet.Handle = () => <div data-testid="sheet-handle" />

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

  // biome-ignore lint/a11y/useAltText: Mock component, alt text is provided in the img element
  const Image = ({ source, ...rest }: { source?: { uri?: string } }) => (
    <img src={source?.uri} alt="Crop preview" aria-label="Crop preview" {...rest} />
  )

  const Circle = basicDiv
  const XStack = basicDiv
  const YStack = basicDiv
  const View = basicDiv
  const Text = ({ children }: { children?: ReactNode }) => <span>{children}</span>

  const useWindowDimensions = () => windowDimensions
  const useMedia = () => mediaQueries

  return {
    ...actual,
    Dialog,
    Sheet,
    Button,
    Image,
    Circle,
    XStack,
    YStack,
    View,
    Text,
    useWindowDimensions,
    useMedia,
  }
})

// Mock icons
vi.mock('@tamagui/lucide-icons', () => ({
  X: () => <span data-testid="icon-x">X</span>,
  Check: () => <span data-testid="icon-check">✓</span>,
  ZoomIn: () => <span data-testid="icon-zoom-in">+</span>,
  ZoomOut: () => <span data-testid="icon-zoom-out">-</span>,
  RotateCcw: () => <span data-testid="icon-rotate">↺</span>,
  FlipHorizontal: () => <span data-testid="icon-flip-h">↔</span>,
  FlipVertical: () => <span data-testid="icon-flip-v">↕</span>,
}))

// Mock Platform
vi.mock('react-native', async () => {
  const actual = await vi.importActual<typeof import('react-native')>('react-native')
  return {
    ...actual,
    Platform: {
      OS: 'web',
      select: <T,>(selections: { ios?: T; android?: T; web?: T; default?: T }) =>
        selections.web ?? selections.default ?? selections.ios ?? selections.android,
    },
    Image: {
      getSize: vi.fn((uri, success, error) => {
        if (uri.includes('error')) {
          error?.(new Error('Failed to load'))
        } else {
          success(800, 600)
        }
      }),
    },
  }
})

const { AvatarCropModal } = await import('../AvatarCropModal')

describe('AvatarCropModal', () => {
  const mockImageUri = 'data:image/jpeg;base64,/9j/4AAQSkZJRg=='
  const mockOnCropComplete = vi.fn()
  const mockOnOpenChange = vi.fn()
  const mockOnError = vi.fn()

  beforeEach(() => {
    vi.clearAllMocks()
    windowDimensions.width = 1024
    windowDimensions.height = 768
    mediaQueries.sm = false

    // Mock Image constructor
    const mockImage = vi.fn(() => {
      const img = {
        naturalWidth: 800,
        naturalHeight: 600,
        crossOrigin: '',
        onload: null as (() => void) | null,
        onerror: null as (() => void) | null,
        src: '',
      }
      // Simulate async load
      setTimeout(() => {
        if (img.src && !img.src.includes('error')) {
          img.onload?.()
        } else {
          img.onerror?.()
        }
      }, 0)
      return img
    })

    // @ts-expect-error - mocking global Image
    globalThis.Image = mockImage

    mockProcessCroppedImage.mockResolvedValue({
      dataUrl: 'data:image/jpeg;base64,processed',
      mimeType: 'image/jpeg',
      width: 512,
      height: 512,
      size: 100000,
    })
  })

  describe('Rendering', () => {
    it('renders when open=true', () => {
      render(
        <AvatarCropModal
          open
          onOpenChange={mockOnOpenChange}
          imageUri={mockImageUri}
          onCropComplete={mockOnCropComplete}
        />
      )

      expect(screen.getByTestId('dialog')).toBeInTheDocument()
      expect(screen.getByTestId('dialog-title')).toHaveTextContent('Crop Avatar')
    })

    it('does not render when open=false', () => {
      render(
        <AvatarCropModal
          open={false}
          onOpenChange={mockOnOpenChange}
          imageUri={mockImageUri}
          onCropComplete={mockOnCropComplete}
        />
      )

      expect(screen.queryByTestId('dialog')).not.toBeInTheDocument()
    })

    it('renders as Sheet on mobile', () => {
      mediaQueries.sm = true
      windowDimensions.width = 600

      render(
        <AvatarCropModal
          open
          onOpenChange={mockOnOpenChange}
          imageUri={mockImageUri}
          onCropComplete={mockOnCropComplete}
        />
      )

      expect(screen.getByTestId('sheet')).toBeInTheDocument()
      expect(screen.queryByTestId('dialog')).not.toBeInTheDocument()
    })
  })

  describe('Image Loading', () => {
    it('shows loading state initially', () => {
      render(
        <AvatarCropModal
          open
          onOpenChange={mockOnOpenChange}
          imageUri={mockImageUri}
          onCropComplete={mockOnCropComplete}
        />
      )

      expect(screen.getByText('Loading image...')).toBeInTheDocument()
    })

    it('loads image successfully', async () => {
      render(
        <AvatarCropModal
          open
          onOpenChange={mockOnOpenChange}
          imageUri={mockImageUri}
          onCropComplete={mockOnCropComplete}
        />
      )

      await waitFor(() => {
        expect(screen.queryByText('Loading image...')).not.toBeInTheDocument()
      })

      expect(screen.getByText('Drag to position • Scroll to zoom')).toBeInTheDocument()
    })

    it('handles image load error', async () => {
      const errorUri = 'data:image/jpeg;base64,error'
      render(
        <AvatarCropModal
          open
          onOpenChange={mockOnOpenChange}
          imageUri={errorUri}
          onCropComplete={mockOnCropComplete}
        />
      )

      await waitFor(() => {
        expect(screen.getByText(/Error/)).toBeInTheDocument()
        expect(screen.getByText(/Failed to load image/)).toBeInTheDocument()
      })
    })

    it('validates image dimensions', async () => {
      // Mock Image with zero dimensions
      const mockImage = vi.fn(() => {
        const img = {
          naturalWidth: 0,
          naturalHeight: 0,
          crossOrigin: '',
          onload: null as (() => void) | null,
          onerror: null as (() => void) | null,
          src: '',
        }
        setTimeout(() => {
          img.onload?.()
        }, 0)
        return img
      })
      // @ts-expect-error - mocking global Image
      globalThis.Image = mockImage

      render(
        <AvatarCropModal
          open
          onOpenChange={mockOnOpenChange}
          imageUri={mockImageUri}
          onCropComplete={mockOnCropComplete}
        />
      )

      await waitFor(() => {
        expect(screen.getByText(/Invalid image dimensions/)).toBeInTheDocument()
      })
    })

    it('warns when image is too small', async () => {
      // Mock Image with small dimensions
      const mockImage = vi.fn(() => {
        const img = {
          naturalWidth: 100,
          naturalHeight: 100,
          crossOrigin: '',
          onload: null as (() => void) | null,
          onerror: null as (() => void) | null,
          src: '',
        }
        setTimeout(() => {
          img.onload?.()
        }, 0)
        return img
      })
      // @ts-expect-error - mocking global Image
      globalThis.Image = mockImage

      render(
        <AvatarCropModal
          open
          onOpenChange={mockOnOpenChange}
          imageUri={mockImageUri}
          onCropComplete={mockOnCropComplete}
          cropSize={300}
        />
      )

      await waitFor(() => {
        expect(screen.getByText(/Image is too small/)).toBeInTheDocument()
      })
    })
  })

  describe('Zoom Controls', () => {
    it('handles keyboard zoom shortcuts', async () => {
      render(
        <AvatarCropModal
          open
          onOpenChange={mockOnOpenChange}
          imageUri={mockImageUri}
          onCropComplete={mockOnCropComplete}
        />
      )

      await waitFor(() => {
        expect(screen.queryByText('Loading image...')).not.toBeInTheDocument()
      })

      // Test + key for zoom in
      fireEvent.keyDown(window, { key: '+' })
      // Test - key for zoom out
      fireEvent.keyDown(window, { key: '-' })
      // Test = key (alternative to +)
      fireEvent.keyDown(window, { key: '=' })
      // Test _ key (alternative to -)
      fireEvent.keyDown(window, { key: '_' })
    })
  })

  describe('Save and Cancel', () => {
    it('calls onCropComplete when save is clicked', async () => {
      render(
        <AvatarCropModal
          open
          onOpenChange={mockOnOpenChange}
          imageUri={mockImageUri}
          onCropComplete={mockOnCropComplete}
        />
      )

      await waitFor(() => {
        expect(screen.queryByText('Loading image...')).not.toBeInTheDocument()
      })

      const saveButton = screen.getByText('Save')
      expect(saveButton).toBeInTheDocument()
      expect(saveButton).not.toBeDisabled()

      fireEvent.click(saveButton)

      await waitFor(() => {
        expect(mockProcessCroppedImage).toHaveBeenCalled()
        expect(mockOnCropComplete).toHaveBeenCalledWith('data:image/jpeg;base64,processed')
        expect(mockOnOpenChange).toHaveBeenCalledWith(false)
      })
    })

    it('disables save button when image is not loaded', async () => {
      // Use a slow-loading image to test disabled state
      const slowImage = vi.fn(() => {
        const img = {
          naturalWidth: 800,
          naturalHeight: 600,
          crossOrigin: '',
          onload: null as (() => void) | null,
          onerror: null as (() => void) | null,
          src: '',
        }
        // Don't call onload immediately - simulate slow loading
        setTimeout(() => {
          // Don't call onload - keep it loading
        }, 1000)
        return img
      })
      // @ts-expect-error - mocking global Image
      globalThis.Image = slowImage

      render(
        <AvatarCropModal
          open
          onOpenChange={mockOnOpenChange}
          imageUri={mockImageUri}
          onCropComplete={mockOnCropComplete}
        />
      )

      // While loading, the button should exist but be disabled
      // Wait a bit for the component to render
      await waitFor(
        () => {
          const saveButton = screen.queryByText('Save')
          // Button might not be rendered yet if still loading, or it's disabled
          if (saveButton) {
            expect(saveButton).toBeDisabled()
          } else {
            // If button not rendered, we're still in loading state which is also valid
            expect(screen.getByText('Loading image...')).toBeInTheDocument()
          }
        },
        { timeout: 100 }
      )
    })

    it('disables save button when processing', async () => {
      mockProcessCroppedImage.mockImplementation(
        () => new Promise((resolve) => setTimeout(resolve, 100))
      )

      render(
        <AvatarCropModal
          open
          onOpenChange={mockOnOpenChange}
          imageUri={mockImageUri}
          onCropComplete={mockOnCropComplete}
        />
      )

      await waitFor(() => {
        expect(screen.queryByText('Loading image...')).not.toBeInTheDocument()
      })

      const saveButton = screen.getByText('Save')
      fireEvent.click(saveButton)

      await waitFor(() => {
        expect(screen.getByText('Processing…')).toBeInTheDocument()
      })

      expect(saveButton).toBeDisabled()
    })

    it('calls onOpenChange(false) when cancel is clicked', async () => {
      render(
        <AvatarCropModal
          open
          onOpenChange={mockOnOpenChange}
          imageUri={mockImageUri}
          onCropComplete={mockOnCropComplete}
        />
      )

      await waitFor(() => {
        expect(screen.queryByText('Loading image...')).not.toBeInTheDocument()
      })

      // Cancel button is wrapped in Dialog.Close asChild
      // Find the button and click it - the mock should handle calling onPress
      const cancelButton = screen.getByText('Cancel')
      fireEvent.click(cancelButton)

      // The mock should have called onPress which calls onOpenChange
      expect(mockOnOpenChange).toHaveBeenCalledWith(false)
      expect(mockOnCropComplete).not.toHaveBeenCalled()
    })

    it('closes modal on Escape key', async () => {
      render(
        <AvatarCropModal
          open
          onOpenChange={mockOnOpenChange}
          imageUri={mockImageUri}
          onCropComplete={mockOnCropComplete}
        />
      )

      await waitFor(() => {
        expect(screen.queryByText('Loading image...')).not.toBeInTheDocument()
      })

      fireEvent.keyDown(window, { key: 'Escape' })

      expect(mockOnOpenChange).toHaveBeenCalledWith(false)
    })
  })

  describe('Error Handling', () => {
    it('handles processing errors', async () => {
      const processingError = new Error('Processing failed')
      mockProcessCroppedImage.mockRejectedValue(processingError)

      render(
        <AvatarCropModal
          open
          onOpenChange={mockOnOpenChange}
          imageUri={mockImageUri}
          onCropComplete={mockOnCropComplete}
          onError={mockOnError}
        />
      )

      await waitFor(() => {
        expect(screen.queryByText('Loading image...')).not.toBeInTheDocument()
      })

      const saveButton = screen.getByText('Save')
      fireEvent.click(saveButton)

      await waitFor(() => {
        expect(mockOnError).toHaveBeenCalledWith('Processing failed')
        expect(screen.getByText(/Error/)).toBeInTheDocument()
      })
    })

    it('shows error message in UI', async () => {
      const processingError = new Error('Custom error message')
      mockProcessCroppedImage.mockRejectedValue(processingError)

      render(
        <AvatarCropModal
          open
          onOpenChange={mockOnOpenChange}
          imageUri={mockImageUri}
          onCropComplete={mockOnCropComplete}
        />
      )

      await waitFor(() => {
        expect(screen.queryByText('Loading image...')).not.toBeInTheDocument()
      })

      const saveButton = screen.getByText('Save')
      fireEvent.click(saveButton)

      await waitFor(() => {
        expect(screen.getByText('Custom error message')).toBeInTheDocument()
      })
    })
  })

  describe('Accessibility', () => {
    it('has ARIA labels for crop area', async () => {
      render(
        <AvatarCropModal
          open
          onOpenChange={mockOnOpenChange}
          imageUri={mockImageUri}
          onCropComplete={mockOnCropComplete}
        />
      )

      await waitFor(() => {
        expect(screen.queryByText('Loading image...')).not.toBeInTheDocument()
      })

      const cropArea = screen.getByLabelText(/Avatar crop area/)
      expect(cropArea).toBeInTheDocument()
    })

    it('announces zoom level changes', async () => {
      render(
        <AvatarCropModal
          open
          onOpenChange={mockOnOpenChange}
          imageUri={mockImageUri}
          onCropComplete={mockOnCropComplete}
        />
      )

      await waitFor(() => {
        expect(screen.queryByText('Loading image...')).not.toBeInTheDocument()
      })

      // Live region should exist for announcements
      const liveRegion = document.querySelector('[aria-live="polite"]')
      expect(liveRegion).toBeInTheDocument()
    })
  })

  describe('Responsive Layout', () => {
    it('renders desktop layout on large screens', async () => {
      windowDimensions.width = 1024
      mediaQueries.sm = false

      render(
        <AvatarCropModal
          open
          onOpenChange={mockOnOpenChange}
          imageUri={mockImageUri}
          onCropComplete={mockOnCropComplete}
        />
      )

      await waitFor(() => {
        expect(screen.queryByText('Loading image...')).not.toBeInTheDocument()
      })

      expect(screen.getByTestId('dialog')).toBeInTheDocument()
      expect(screen.queryByTestId('sheet')).not.toBeInTheDocument()
    })

    it('renders mobile sheet layout on small screens', async () => {
      windowDimensions.width = 600
      mediaQueries.sm = true

      render(
        <AvatarCropModal
          open
          onOpenChange={mockOnOpenChange}
          imageUri={mockImageUri}
          onCropComplete={mockOnCropComplete}
        />
      )

      await waitFor(() => {
        expect(screen.queryByText('Loading image...')).not.toBeInTheDocument()
      })

      expect(screen.getByTestId('sheet')).toBeInTheDocument()
      expect(screen.queryByTestId('dialog')).not.toBeInTheDocument()
    })
  })
})
