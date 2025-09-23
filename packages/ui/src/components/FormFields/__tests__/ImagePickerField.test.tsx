const imagePickerMock = vi.hoisted(() => ({
  renderSpy: vi.fn(),
  descriptor: { path: 'new-image.png', fileURL: 'blob:new-image' },
}))

vi.mock('../../Shake', async () => {
  await import('react')
  return {
    Shake: ({ children }: { children: unknown }) => <>{children}</>,
  }
})

vi.mock('@ts-react/form', () => ({
  useTsController: vi.fn(),
  useFieldInfo: vi.fn(),
}))

vi.mock('../../elements/pickers/ImagePicker', async () => {
  const React = await import('react')

  // biome-ignore lint/suspicious/noExplicitAny: Test mock component with flexible props
  const ImagePicker = React.forwardRef<HTMLInputElement, any>((props, ref) => {
    imagePickerMock.renderSpy(props)
    const { onChangeText, onBlur, value: _value, placeholder: _placeholder, ...rest } = props

    return (
      <input
        data-testid="image-picker"
        ref={ref as React.ForwardedRef<HTMLInputElement>}
        onChange={() => onChangeText?.(imagePickerMock.descriptor)}
        onClick={() => onChangeText?.(imagePickerMock.descriptor)}
        onBlur={onBlur}
        {...rest}
      />
    )
  })

  return { ImagePicker }
})

import { afterEach, beforeEach, describe, expect, test, vi } from 'vitest'

import { fireEvent, render, screen } from '../../../../test/test-utils'
import { ImagePickerField } from '../ImagePickerField'
import { useFieldInfo, useTsController } from '@ts-react/form'

describe('ImagePickerField', () => {
  const mockedUseTsController = vi.mocked(useTsController)
  const mockedUseFieldInfo = vi.mocked(useFieldInfo)

  beforeEach(() => {
    mockedUseFieldInfo.mockReturnValue({ label: 'Cover image' })
    mockedUseTsController.mockReturnValue({
      field: {
        value: { path: 'initial.png', fileURL: 'blob:initial' },
        onChange: vi.fn(),
        onBlur: vi.fn(),
        ref: { current: null },
      },
      error: {},
      formState: { isSubmitting: false },
      // biome-ignore lint/suspicious/noExplicitAny: Test mock with flexible types
    } as any)
    imagePickerMock.renderSpy.mockClear()
  })

  afterEach(() => {
    vi.clearAllMocks()
  })

  test('renders the configured field label', () => {
    render(<ImagePickerField size="$3" />)
    expect(screen.getByText('Cover image')).toBeInTheDocument()
  })

  test('propagates change and blur events to the controller', () => {
    const onChange = vi.fn()
    const onBlur = vi.fn()

    mockedUseTsController.mockReturnValue({
      field: {
        value: undefined,
        onChange,
        onBlur,
        ref: { current: null },
      },
      error: {},
      formState: { isSubmitting: false },
      // biome-ignore lint/suspicious/noExplicitAny: Test mock with flexible types
    } as any)

    render(<ImagePickerField size="$3" />)

    const input = screen.getByTestId('image-picker')
    fireEvent.click(input)
    expect(onChange).toHaveBeenCalledWith(imagePickerMock.descriptor)

    fireEvent.blur(input)
    expect(onBlur).toHaveBeenCalled()
  })

  test('disables the picker when the form is submitting', () => {
    mockedUseTsController.mockReturnValue({
      field: {
        value: { path: 'initial.png', fileURL: 'blob:initial' },
        onChange: vi.fn(),
        onBlur: vi.fn(),
        ref: { current: null },
      },
      error: {},
      formState: { isSubmitting: true },
      // biome-ignore lint/suspicious/noExplicitAny: Test mock with flexible types
    } as any)

    render(<ImagePickerField size="$3" />)

    const input = screen.getByTestId('image-picker')
    expect(input).toBeDisabled()
    expect(imagePickerMock.renderSpy).toHaveBeenCalled()
    expect(imagePickerMock.renderSpy.mock.calls[0][0].disabled).toBe(true)
  })
})
