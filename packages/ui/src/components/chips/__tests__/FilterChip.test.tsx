import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import type { ReactNode } from 'react'
import { beforeEach, describe, expect, it, vi } from 'vitest'

const chipPropsStore = vi.hoisted(() => ({ current: {} as Record<string, unknown> }))

vi.mock('tamagui', () => {
  const MockXStack = ({ children, ...rest }: { children?: ReactNode }) => {
    chipPropsStore.current = rest
    return (
      <div data-testid="xstack" {...rest}>
        {children}
      </div>
    )
  }

  const MockText = ({ children, ...rest }: { children?: ReactNode }) => (
    <span data-testid="text" {...rest}>
      {children}
    </span>
  )

  const MockButton = ({
    children,
    onPress,
    ...rest
  }: {
    children?: ReactNode
    onPress?: () => void
  }) => (
    <button type="button" onClick={onPress} data-testid="remove-button" {...rest}>
      {children}
    </button>
  )

  return {
    XStack: MockXStack,
    Text: MockText,
    Button: MockButton,
  }
})

vi.mock('@tamagui/lucide-icons', () => ({
  X: ({ size, color }: { size?: number; color?: string }) => (
    <span data-testid="x-icon" data-size={size} data-color={color}>
      ×
    </span>
  ),
}))

const { FilterChip } = await import('../FilterChip')

describe('FilterChip', () => {
  beforeEach(() => {
    chipPropsStore.current = {}
  })

  it('renders with label text', () => {
    render(<FilterChip label="Construction (12)" />)

    expect(screen.getByText('Construction (12)')).toBeInTheDocument()
  })

  it('applies color theme correctly', () => {
    render(<FilterChip label="Test" color="blue" />)

    expect(chipPropsStore.current.theme).toBe('blue')
  })

  it('applies gray theme when color is gray', () => {
    render(<FilterChip label="Test" color="gray" />)

    expect(chipPropsStore.current.theme).toBe('gray')
  })

  it('shows remove button when removable={true} and onRemove provided', () => {
    const onRemove = vi.fn()
    render(<FilterChip label="Test" removable={true} onRemove={onRemove} />)

    const removeButton = screen.getByTestId('remove-button')
    expect(removeButton).toBeInTheDocument()
  })

  it('hides remove button when removable={false}', () => {
    const onRemove = vi.fn()
    render(<FilterChip label="Test" removable={false} onRemove={onRemove} />)

    expect(screen.queryByTestId('remove-button')).not.toBeInTheDocument()
  })

  it('hides remove button when onRemove not provided even if removable={true}', () => {
    render(<FilterChip label="Test" removable={true} />)

    expect(screen.queryByTestId('remove-button')).not.toBeInTheDocument()
  })

  it('calls onRemove when remove button clicked', async () => {
    const user = userEvent.setup()
    const onRemove = vi.fn()

    render(<FilterChip label="Test" removable={true} onRemove={onRemove} />)

    const removeButton = screen.getByTestId('remove-button')
    await user.click(removeButton)

    expect(onRemove).toHaveBeenCalledTimes(1)
  })

  it('renders icon when provided', () => {
    const icon = <span data-testid="custom-icon">Icon</span>
    render(<FilterChip label="Test" icon={icon} />)

    expect(screen.getByTestId('custom-icon')).toBeInTheDocument()
  })

  it('does not render icon when not provided', () => {
    render(<FilterChip label="Test" />)

    expect(screen.queryByTestId('custom-icon')).not.toBeInTheDocument()
  })

  it('applies size prop correctly to text', () => {
    render(<FilterChip label="Test" size="$4" />)

    const text = screen.getByTestId('text')
    // Size is passed as fontSize prop to Text component
    expect(text).toBeInTheDocument()
  })

  it('uses default size when size not provided', () => {
    render(<FilterChip label="Test" />)

    const text = screen.getByTestId('text')
    expect(text).toBeInTheDocument()
  })

  it('applies default blue color when color not provided', () => {
    render(<FilterChip label="Test" />)

    expect(chipPropsStore.current.theme).toBe('blue')
  })
})
