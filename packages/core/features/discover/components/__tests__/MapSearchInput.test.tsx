import type { CSSProperties, ReactNode } from 'react'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { beforeEach, describe, expect, it, vi } from 'vitest'

const selectHandler = vi.fn()
const closeHandler = vi.fn()

vi.mock('tamagui', async () => {
  const actual = await vi.importActual<typeof import('tamagui')>('tamagui')
  const mapStyleProps = (props: Record<string, unknown>) => {
    const style = { ...(props.style as Record<string, unknown> | undefined) }
    const passthrough: Record<string, unknown> = {}
    for (const [key, value] of Object.entries(props)) {
      if (key === 'style') continue
      switch (key) {
        case 'position':
        case 'top':
        case 'bottom':
        case 'left':
        case 'right':
        case 'justify':
        case 'items':
        case 'px':
        case 'bg':
        case 'gap':
          style[key] = value
          break
        default:
          passthrough[key] = value
      }
    }
    return { style, passthrough } as const
  }

  const MockXStack = ({ children, ...rest }: { children: ReactNode; style?: CSSProperties }) => {
    const { style, passthrough } = mapStyleProps(rest)
    return (
      <div data-testid="x-stack" style={style} {...passthrough}>
        {children}
      </div>
    )
  }

  const MockYStack = ({ children, ...rest }: { children: ReactNode; style?: CSSProperties }) => {
    const { style, passthrough } = mapStyleProps(rest)
    return (
      <div data-testid="y-stack" style={style} {...passthrough}>
        {children}
      </div>
    )
  }

  return {
    ...actual,
    AnimatePresence: ({ children }: { children: React.ReactNode }) => <>{children}</>,
    XStack: MockXStack,
    YStack: MockYStack,
    Text: ({ children }: { children: React.ReactNode }) => <span>{children}</span>,
  }
})

vi.mock('@app/ui', () => ({
  AddressAutocomplete: ({
    onChange,
    onAddressSelect,
    value,
  }: {
    onChange: (value: string) => void
    onAddressSelect: (result: {
      coordinates: { lng: number; lat: number }
      formattedAddress: string
    }) => void
    value: string
  }) => (
    <div>
      <input
        aria-label="search"
        value={value}
        onChange={(event) => onChange(event.target.value)}
      />
      <button
        type="button"
        onClick={() =>
          onAddressSelect({
            coordinates: { lng: -80.1, lat: 35.2 },
            formattedAddress: 'Charlotte, NC',
          })
        }
      >
        choose-location
      </button>
    </div>
  ),
}))

vi.mock('@tamagui/lucide-icons', () => ({
  AlertCircle: () => <span data-testid="alert-icon" />,
}))

const { MapSearchInput } = await import('../MapSearchInput')

describe('MapSearchInput', () => {
  beforeEach(() => {
    vi.resetModules()
    selectHandler.mockReset()
    closeHandler.mockReset()
  })

  it('renders error state when token missing', () => {
    process.env.EXPO_PUBLIC_MAPBOX_TOKEN = undefined

    render(
      <MapSearchInput
        isVisible
        onClose={closeHandler}
        onLocationSelect={selectHandler}
      />
    )

    expect(screen.getByTestId('alert-icon')).toBeInTheDocument()
    expect(screen.getByText('Map Search Unavailable')).toBeInTheDocument()
  })

  it('renders search input and calls handlers when token valid', async () => {
    process.env.EXPO_PUBLIC_MAPBOX_TOKEN = 'pk.valid-token'
    const user = userEvent.setup()

    render(
      <MapSearchInput
        isVisible
        onClose={closeHandler}
        onLocationSelect={selectHandler}
      />
    )

    const input = screen.getByLabelText('search')
    await user.type(input, 'Charlotte')
    await user.click(screen.getByText('choose-location'))

    expect(selectHandler).toHaveBeenCalledWith({
      longitude: -80.1,
      latitude: 35.2,
      label: 'Charlotte, NC',
    })
    expect(closeHandler).toHaveBeenCalled()
  })
})
