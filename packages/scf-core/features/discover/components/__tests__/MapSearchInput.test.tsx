import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import type { CSSProperties, ReactNode } from 'react'
import { beforeEach, describe, expect, it, vi } from 'vitest'

const selectHandler = vi.fn()
const closeHandler = vi.fn()

// Mock Tamagui before imports
vi.mock('tamagui', () => {
  const mapStyleProps = (props: Record<string, unknown>) => {
    const style: Record<string, unknown> = { ...(props.style as Record<string, unknown> | undefined) }
    const passthrough: Record<string, unknown> = {}
    for (const [key, value] of Object.entries(props)) {
      if (key === 'style') continue
      // Skip responsive props
      if (key.startsWith('$')) continue
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

  const MockXStack = (props: { children?: ReactNode; style?: CSSProperties; [key: string]: unknown }) => {
    const { children, ...rest } = props
    const { style, passthrough } = mapStyleProps(rest)
    return (
      <div data-testid="x-stack" style={style} {...passthrough}>
        {children}
      </div>
    )
  }

  const MockYStack = (props: { children?: ReactNode; style?: CSSProperties; [key: string]: unknown }) => {
    const { children, ...rest } = props
    const { style, passthrough } = mapStyleProps(rest)
    return (
      <div data-testid="y-stack" style={style} {...passthrough}>
        {children}
      </div>
    )
  }

  return {
    AnimatePresence: (props: { children: ReactNode }) => <>{props.children}</>,
    Row: MockXStack,
    Stack: MockYStack,
    Text: (props: { children: ReactNode }) => <span>{props.children}</span>,
  }
})

vi.mock('@unicornlove/beyond-ui', () => ({
  AddressAutocomplete: (props: {
    onChange: (value: string) => void
    onAddressSelect: (result: {
      coordinates: { lng: number; lat: number }
      formattedAddress: string
    }) => void
    value: string
  }) => (
    <div>
      <input aria-label="search" value={props.value} onChange={(event) => props.onChange(event.target.value)} />
      <button
        type="button"
        onClick={() =>
          props.onAddressSelect({
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

// Import component after mocks are set up
import { MapSearchInput } from '../MapSearchInput'

describe('MapSearchInput', () => {
  beforeEach(() => {
    selectHandler.mockReset()
    closeHandler.mockReset()
  })

  it('renders error state when token missing', () => {
    process.env.EXPO_PUBLIC_MAPBOX_TOKEN = undefined

    render(<MapSearchInput isVisible onClose={closeHandler} onLocationSelect={selectHandler} />)

    expect(screen.getByTestId('alert-icon')).toBeInTheDocument()
    expect(screen.getByText('Map Search Unavailable')).toBeInTheDocument()
  })

  it('renders search input and calls handlers when token valid', async () => {
    process.env.EXPO_PUBLIC_MAPBOX_TOKEN = 'pk.valid-token'
    const user = userEvent.setup()

    render(<MapSearchInput isVisible onClose={closeHandler} onLocationSelect={selectHandler} />)

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

  describe('validateMapboxToken edge cases', () => {
    it('returns invalid for undefined token', () => {
      process.env.EXPO_PUBLIC_MAPBOX_TOKEN = undefined

      render(<MapSearchInput isVisible onClose={closeHandler} onLocationSelect={selectHandler} />)

      expect(screen.getByText('Map Search Unavailable')).toBeInTheDocument()
    })

    it('returns invalid for empty string token', () => {
      process.env.EXPO_PUBLIC_MAPBOX_TOKEN = ''

      render(<MapSearchInput isVisible onClose={closeHandler} onLocationSelect={selectHandler} />)

      expect(screen.getByText('Map Search Unavailable')).toBeInTheDocument()
    })

    it('returns invalid for token not starting with "pk."', () => {
      process.env.EXPO_PUBLIC_MAPBOX_TOKEN = 'invalid-token'

      render(<MapSearchInput isVisible onClose={closeHandler} onLocationSelect={selectHandler} />)

      expect(
        screen.getByText('Map search configuration error. Please contact support.')
      ).toBeInTheDocument()
    })

    it('returns valid for token starting with "pk."', () => {
      process.env.EXPO_PUBLIC_MAPBOX_TOKEN = 'pk.valid-token-123'

      render(<MapSearchInput isVisible onClose={closeHandler} onLocationSelect={selectHandler} />)

      // Should render the search input, not error message
      expect(screen.queryByText('Map Search Unavailable')).not.toBeInTheDocument()
      expect(screen.queryByText('Map search configuration error')).not.toBeInTheDocument()
      expect(screen.getByLabelText('search')).toBeInTheDocument()
    })

    it('displays user-friendly error messages', () => {
      process.env.EXPO_PUBLIC_MAPBOX_TOKEN = undefined

      render(<MapSearchInput isVisible onClose={closeHandler} onLocationSelect={selectHandler} />)

      // Error message should be user-friendly (check for the displayed text)
      expect(screen.getByText('Map Search Unavailable')).toBeInTheDocument()
    })
  })
})
