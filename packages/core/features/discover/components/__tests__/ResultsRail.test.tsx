import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it, vi } from 'vitest'
import { forwardRef } from 'react'

const mockScrollToCard = vi.fn()

vi.mock('tamagui', async () => {
  const actual = await vi.importActual<typeof import('tamagui')>('tamagui')

  const mapStyleProps = (props: Record<string, unknown>) => {
    const style = { ...props.style }
    const passthrough: Record<string, unknown> = {}
    for (const [key, value] of Object.entries(props)) {
      if (key === 'style') continue
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

  const MockYStack = ({
    children,
    ...rest
  }: {
    children: React.ReactNode
    style?: React.CSSProperties
  }) => {
    const { style, passthrough } = mapStyleProps(rest)
    return (
      <div data-testid="y-stack" style={style} {...passthrough}>
        {children}
      </div>
    )
  }

  return {
    ...actual,
    YStack: MockYStack,
  }
})

vi.mock('../ResultList', () => ({
  ResultList: forwardRef(
    (
      {
        onSelect,
        selectedId,
      }: {
        onSelect: (id: string) => void
        selectedId: string | null
      },
      ref,
    ) => {
      mockScrollToCard.mockClear()
      if (ref) {
        (ref as React.MutableRefObject<{ scrollToCard: (id: string) => void } | null>).current = {
          scrollToCard: mockScrollToCard,
        }
      }
      return (
        <div>
          <button type="button" onClick={() => onSelect('profile-1')}>
            select-profile
          </button>
          <div data-testid="selected">{selectedId}</div>
        </div>
      )
    },
  ),
}))

const { ResultsRail } = await import('../ResultsRail')

describe('ResultsRail', () => {
  it('toggles visibility styles based on isVisible flag', () => {
    const { rerender } = render(
      <ResultsRail
        isVisible={false}
        profiles={[]}
        selectedId={null}
        onSelect={vi.fn()}
      />
    )

    const containerHidden = screen.getByTestId('y-stack')
    expect(containerHidden.style.opacity).toBe('0')

    rerender(
      <ResultsRail
        isVisible
        profiles={[]}
        selectedId={null}
        onSelect={vi.fn()}
      />
    )

    const containerVisible = screen.getByTestId('y-stack')
    expect(containerVisible.style.opacity).toBe('1')
  })

  it('passes selection callbacks to ResultList', async () => {
    const onSelect = vi.fn()
    const user = userEvent.setup()

    render(
      <ResultsRail
        isVisible
        profiles={[]}
        selectedId="profile-1"
        onSelect={onSelect}
      />
    )

    await user.click(screen.getByText('select-profile'))
    expect(onSelect).toHaveBeenCalledWith('profile-1')
    expect(screen.getByTestId('selected').textContent).toBe('profile-1')
  })

  it('exposes ref to allow parent scroll control', () => {
    const ref = { current: null } as React.MutableRefObject<{ scrollToCard: (id: string) => void } | null>

    render(
      <ResultsRail
        isVisible
        profiles={[]}
        selectedId={null}
        onSelect={vi.fn()}
        resultListRef={ref}
      />
    )

    expect(typeof ref.current.scrollToCard).toBe('function')
    ref.current.scrollToCard('profile-2')
    expect(mockScrollToCard).toHaveBeenCalledWith('profile-2')
  })
})
