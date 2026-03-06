import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import type { ReactNode } from 'react'
import { describe, expect, it, vi } from 'vitest'

const mockResults = [
  {
    id: 'depth0',
    title: 'Top OSHA',
    description: 'Top level certification',
    depth: 0,
    sort_order: 1,
    parent_id: null,
    parent_title: null,
    parent_slug: null,
    slug: 'osha-top',
  },
  {
    id: 'depth1',
    title: 'OSHA Category',
    description: 'Category level certification',
    depth: 1,
    sort_order: 2,
    parent_id: 'depth0',
    parent_title: 'Top OSHA',
    parent_slug: 'osha-top',
    slug: 'osha-category',
  },
  {
    id: 'depth2',
    title: 'OSHA 10-Hour',
    description: 'Specific certification',
    depth: 2,
    sort_order: 3,
    parent_id: 'depth1',
    parent_title: 'OSHA Category',
    parent_slug: 'osha-category',
    slug: 'osha-10',
  },
] as const

const userFactory = () => userEvent.setup()

const mockBeyondUI = vi.hoisted(() => {
  const React = require('react') as typeof import('react')

  const createComponent =
    (tag = 'div') =>
    ({
      children,
      onPress,
      ...rest
    }: {
      children?: ReactNode
      onPress?: () => void
      role?: string
    }) => {
      const props = {
        ...rest,
        onClick: onPress,
        role: onPress ? (rest.role ?? 'button') : rest.role,
      }
      return React.createElement(tag, props, children)
    }

  const Input = ({
    value,
    onChangeText,
    ...rest
  }: {
    value?: string
    onChangeText?: (value: string) => void
    placeholder?: string
    onFocus?: () => void
    onBlur?: () => void
  }) => (
    <input
      value={value}
      onChange={(event) => onChangeText?.(event.target.value)}
      {...rest}
      data-testid="cert-search-input"
    />
  )

  const Text = ({ children, ...rest }: { children?: ReactNode }) => (
    <span {...rest}>{children}</span>
  )

  return {
    Input,
    Text,
    Stack: createComponent(),
    Row: createComponent(),
    ScrollView: ({ children }: { children?: ReactNode }) => (
      <div data-testid="scroll-view">{children}</div>
    ),
    Card: createComponent(),
  }
})

// Use real @scaffald/ui (no mock) so CertificationSearch renders correctly

vi.mock('lucide-react-native', () => ({
  Search: () => <span data-testid="icon-search" />,
  Award: () => <span data-testid="icon-award" />,
}))

const { CertificationSearch } = await import('../CertificationSearch')

const flushDebounce = () => new Promise((resolve) => setTimeout(resolve, 350))

describe('CertificationSearch', () => {
  const openResults = async (user: ReturnType<typeof userFactory>, query = 'OSHA') => {
    const input = screen.getByPlaceholderText(/Search certifications/i)
    await user.type(input, query)
    await screen.findByTestId('cert-search-results')
  }

  it('debounces search input and groups results by depth', async () => {
    const user = userFactory()
    const onSearchChange = vi.fn()

    render(
      <CertificationSearch
        searchResults={mockResults as unknown as (typeof mockResults)[number][]}
        onSelect={vi.fn()}
        onSearchChange={onSearchChange}
      />
    )

    await openResults(user)
    await flushDebounce()

    expect(onSearchChange).toHaveBeenCalledWith('OSHA')
    expect(screen.getByText('Top Level Categories')).toBeInTheDocument()
    expect(screen.getByText('Top OSHA > Categories')).toBeInTheDocument()
    expect(screen.getByText('OSHA Category > Certifications')).toBeInTheDocument()
  })

  it('filters out selected certifications and invokes onSelect when clicking a card', async () => {
    const user = userFactory()
    const onSelect = vi.fn()

    render(
      <CertificationSearch
        searchResults={mockResults as unknown as (typeof mockResults)[number][]}
        onSelect={onSelect}
        onSearchChange={vi.fn()}
        selectedIds={['depth1']}
      />
    )

    await openResults(user)

    expect(screen.queryByText('OSHA Category')).not.toBeInTheDocument()

    await user.click(screen.getByText('OSHA 10-Hour'))
    expect(onSelect).toHaveBeenCalledWith(
      expect.objectContaining({
        id: 'depth2',
        title: 'OSHA 10-Hour',
      })
    )
  })

  it('shows loading indicator when searching', async () => {
    const user = userFactory()

    render(
      <CertificationSearch
        searchResults={[]}
        onSelect={vi.fn()}
        onSearchChange={vi.fn()}
        isLoading
      />
    )

    await openResults(user, 'Welding')
    expect(screen.getByText('Searching...')).toBeInTheDocument()
  })
})
