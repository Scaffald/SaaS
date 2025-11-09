import { cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react'
import { describe, expect, beforeAll, beforeEach, afterEach, it, vi } from 'vitest'

const mockOpen = vi.fn()
let mockOnPick: ((args: any) => void) | undefined

vi.mock('../hooks/useFilePicker', () => ({
  useFilePicker: (options: any) => {
    mockOnPick = options.onPick
    return {
      open: mockOpen,
      getInputProps: () => ({}),
      getRootProps: () => ({}),
      dragStatus: { isDragActive: false },
    }
  },
}))

vi.mock('../AvatarCropModal', () => ({
  AvatarCropModal: (props: any) => {
    return (
      <div data-testid="crop-modal">
        <button type="button" onClick={() => props.onCropComplete('data:image/jpeg;base64,TEST')}>
          complete-crop
        </button>
        <button type="button" onClick={() => props.onError?.('Crop failed')}>
          error-crop
        </button>
      </div>
    )
  },
}))

describe('AvatarImagePicker', () => {
  const onImageSelect = vi.fn()
  const onCropError = vi.fn()
  let AvatarImagePicker: (typeof import('../AvatarImagePicker'))['AvatarImagePicker']

  beforeAll(async () => {
    AvatarImagePicker = (await import('../AvatarImagePicker')).AvatarImagePicker
  })

  beforeEach(() => {
    vi.clearAllMocks()
    mockOnPick = undefined
  })

  afterEach(() => {
    cleanup()
  })

  it('renders edit button when value is present', () => {
    render(
      <AvatarImagePicker
        value="https://example.com/avatar.jpg"
        onImageSelect={onImageSelect}
        onCropError={onCropError}
      />,
    )
    expect(screen.getByRole('button', { name: 'Edit Photo' })).toBeInTheDocument()
  })

  it('invokes file picker when selecting a new photo', () => {
    render(<AvatarImagePicker onImageSelect={onImageSelect} onCropError={onCropError} />)
    fireEvent.click(screen.getByRole('button', { name: 'Select a photo' }))
    expect(mockOpen).toHaveBeenCalledTimes(1)
  })

  it('passes cropped image back to consumer on completion', async () => {
    render(<AvatarImagePicker onImageSelect={onImageSelect} onCropError={onCropError} />)

    if (mockOnPick) {
      await mockOnPick({
        webFiles: [new File(['test'], 'avatar.png', { type: 'image/png' })],
        nativeFiles: null,
      })
    }

    await waitFor(() => expect(screen.getByTestId('crop-modal')).toBeInTheDocument())
    fireEvent.click(screen.getByText('complete-crop'))

    expect(onImageSelect).toHaveBeenCalledWith('data:image/jpeg;base64,TEST')
  })

  it('bubbles crop errors to provided handler', async () => {
    render(
      <AvatarImagePicker
        value="https://example.com/avatar.jpg"
        onImageSelect={onImageSelect}
        onCropError={onCropError}
      />,
    )

    fireEvent.click(screen.getByRole('button', { name: 'Edit Photo' }))
    await waitFor(() => expect(screen.getByTestId('crop-modal')).toBeInTheDocument())
    fireEvent.click(screen.getByText('error-crop'))

    expect(onCropError).toHaveBeenCalledWith('Crop failed')
  })
})

