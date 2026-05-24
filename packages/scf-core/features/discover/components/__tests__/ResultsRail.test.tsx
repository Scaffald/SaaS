import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import type { CSSProperties, ReactNode } from 'react'
import { forwardRef } from 'react'
import { describe, expect, it, vi } from 'vitest'

const mockScrollToCard = vi.fn()

// Beyond UI mock: override only Stack for visibility style assertions; use real beyond-ui for the rest
vi.mock('@scaffald/ui', async () => {
  const actual = (await vi.importActual('@scaffald/ui')) as Record<string, unknown>
  const mapStyleProps = (props: Record<string, unknown>) => {
    const style: Record<string, unknown> = { ...(props.style as Record<string, unknown> | undefined) }
    const passthrough: Record<string, unknown> = {}
    for (const [key, value] of Object.entries(props)) {
      if (key === 'style') continue
      if (key.startsWith('$')) continue
      switch (key) {
        case 'position':
        case 'top':
        case 'right':
        case 'height':
        case 'flexBasis':
        case 'maxW':
        case 'gap':
        case 'px':
        case 'overflow':
        case 'bg':
        case 'animation':
        case 'x':
        case 'opacity':
        case 'borderLeftWidth':
        case 'borderColor':
        case 'shadowColor':
        case 'shadowOffset':
        case 'shadowOpacity':
        case 'shadowRadius':
        case 'z':
          style[key] = value
          break
        default:
          passthrough[key] = value
      }
    }
    return { style, passthrough } as const
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

  return { ...actual, Stack: MockYStack }
})

vi.mock('../ResultList', () => ({
  ResultList: forwardRef(
    (
      props: {
        onSelect: (id: string) => void
        selectedId: string | null
      },
      ref: React.Ref<{ scrollToCard: (id: string) => void } | null>
    ) => {
      mockScrollToCard.mockClear()
      if (ref && typeof ref === 'object' && ref !== null) {
        ;(ref as React.MutableRefObject<{ scrollToCard: (id: string) => void } | null>).current = {
          scrollToCard: mockScrollToCard,
        }
      }
      return (
        <div>
          <button type="button" onClick={() => props.onSelect('profile-1')}>
            select-profile
          </button>
          <div data-testid="selected">{props.selectedId}</div>
        </div>
      )
    }
  ),
}))

// Import component after mocks are set up
import { ResultsRail } from '../ResultsRail'

describe('ResultsRail', () => {
  // TODO: ResultsRail now renders multiple Stack/y-stack wrappers.
  // Query by getAllByTestId('y-stack')[0] or add a more specific testid.
  it.skip('toggles visibility styles based on isVisible flag', () => {
    const { rerender } = render(
      <ResultsRail isVisible={false} profiles={[]} selectedId={null} onSelect={vi.fn()} />
    )

    const containerHidden = screen.getByTestId('y-stack')
    expect(containerHidden.style.opacity).toBe('0')

    rerender(<ResultsRail isVisible profiles={[]} selectedId={null} onSelect={vi.fn()} />)

    const containerVisible = screen.getByTestId('y-stack')
    expect(containerVisible.style.opacity).toBe('1')
  })

  it('passes selection callbacks to ResultList', async () => {
    const onSelect = vi.fn()
    const user = userEvent.setup()

    render(<ResultsRail isVisible profiles={[]} selectedId="profile-1" onSelect={onSelect} />)

    await user.click(screen.getByText('select-profile'))
    expect(onSelect).toHaveBeenCalledWith('profile-1')
    expect(screen.getByTestId('selected').textContent).toBe('profile-1')
  })

  it('exposes ref to allow parent scroll control', () => {
    const ref = { current: null } as React.MutableRefObject<{
      scrollToCard: (id: string) => void
    } | null>

    render(
      <ResultsRail
        isVisible
        profiles={[]}
        selectedId={null}
        onSelect={vi.fn()}
        resultListRef={ref}
      />
    )

    if (!ref.current) {
      throw new Error('ResultList ref was not assigned')
    }

    expect(typeof ref.current.scrollToCard).toBe('function')
    ref.current.scrollToCard('profile-2')
    expect(mockScrollToCard).toHaveBeenCalledWith('profile-2')
  })
})
