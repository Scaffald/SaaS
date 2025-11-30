import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import type { ReactNode } from 'react'
import { beforeEach, describe, expect, it, vi } from 'vitest'

vi.mock('tamagui', () => ({
  Form: ({ children, onSubmit }: { children: ReactNode; onSubmit?: () => void }) => (
    <form
      onSubmit={(event) => {
        event.preventDefault()
        onSubmit?.()
      }}
    >
      {children}
    </form>
  ),
  Button: ({
    children,
    onPress,
    disabled,
  }: {
    children: ReactNode
    onPress?: () => void
    disabled?: boolean
  }) => (
    <button type="button" onClick={onPress} disabled={disabled}>
      {children}
    </button>
  ),
  Input: ({
    value,
    onChangeText,
    ...rest
  }: {
    value?: string
    onChangeText?: (value: string) => void
  }) => <input value={value} onChange={(event) => onChangeText?.(event.target.value)} {...rest} />,
  Label: ({ children, htmlFor }: { children: ReactNode; htmlFor?: string }) => (
    <label htmlFor={htmlFor}>{children}</label>
  ),
  TextArea: ({
    value,
    onChangeText,
    ...rest
  }: {
    value?: string
    onChangeText?: (value: string) => void
  }) => (
    <textarea value={value} onChange={(event) => onChangeText?.(event.target.value)} {...rest} />
  ),
  XStack: ({ children }: { children: ReactNode }) => <div>{children}</div>,
  YStack: ({ children }: { children: ReactNode }) => <div>{children}</div>,
  Text: ({ children }: { children: ReactNode }) => <span>{children}</span>,
  H4: ({ children }: { children: ReactNode }) => <h4>{children}</h4>,
}))

vi.mock('@tamagui/lucide-icons', () => ({
  Save: () => <span data-testid="save-icon" />,
}))

'@scaffald/tamagui-ui', () => ({
  IconSelector: ({
    value,
    onChange,
    disabled,
  }: {
    value: string
    onChange: (value: string) => void
    disabled?: boolean
  }) => (
    <select
      data-testid="icon-selector"
      value={value}
      disabled={disabled}
      onChange={(event) => onChange(event.target.value)}
    >
      <option value="UserSearch">UserSearch</option>
      <option value="Star">Star</option>
    </select>
  ),
  ImageUpload: ({ onChange }: { onChange: (url: string | null) => void }) => (
    <button
      type="button"
      data-testid="image-upload"
      onClick={() => onChange('https://example.com/image.png')}
    >
      upload-image
    </button>
  ),
  ToggleSwitch: ({
    checked,
    onCheckedChange,
    disabled,
  }: {
    checked: boolean
    onCheckedChange: (value: boolean) => void
    disabled?: boolean
  }) => (
    <button
      type="button"
      data-testid="toggle-switch"
      aria-pressed={checked}
      disabled={disabled}
      onClick={() => onCheckedChange(!checked)}
    >
      toggle
    </button>
  ),
}))

const { CMSSlideForm } = await import('../cms-slide-form')

describe('CMSSlideForm', () => {
  const submitSpy = vi.fn()

  beforeEach(() => {
    submitSpy.mockReset()
  })

  it('submits create payload when no initial data provided', async () => {
    const user = userEvent.setup()
    submitSpy.mockResolvedValue(undefined)

    render(<CMSSlideForm onSubmit={submitSpy} />)

    await user.type(screen.getByLabelText(/title/i), 'Welcome')
    await user.type(screen.getByLabelText(/description/i), 'We are glad you are here')
    await user.selectOptions(screen.getByTestId('icon-selector'), 'Star')
    await user.click(screen.getByTestId('image-upload'))
    await user.clear(screen.getByLabelText(/display order/i))
    await user.type(screen.getByLabelText(/display order/i), '3')
    await user.click(screen.getByTestId('toggle-switch'))
    await user.click(screen.getByRole('button', { name: /save slide/i }))

    expect(submitSpy).toHaveBeenCalledWith({
      title: 'Welcome',
      description: 'We are glad you are here',
      icon_name: 'Star',
      background_image_url: 'https://example.com/image.png',
      display_order: 3,
      is_active: false,
    })
  })

  it('includes id when editing existing slide', async () => {
    const user = userEvent.setup()
    submitSpy.mockResolvedValue(undefined)

    render(
      <CMSSlideForm
        onSubmit={submitSpy}
        initialData={{
          id: 'slide-1',
          title: 'Original',
          description: 'Existing description',
          icon_name: 'UserSearch',
          background_image_url: 'https://example.com/original.png',
          display_order: 2,
          is_active: true,
        }}
      />
    )

    await user.type(screen.getByLabelText(/title/i), ' Updated')
    await user.click(screen.getByRole('button', { name: /save slide/i }))

    expect(submitSpy).toHaveBeenCalledWith({
      id: 'slide-1',
      title: 'Original Updated',
      description: 'Existing description',
      icon_name: 'UserSearch',
      background_image_url: 'https://example.com/original.png',
      display_order: 2,
      is_active: true,
    })
  })
})
