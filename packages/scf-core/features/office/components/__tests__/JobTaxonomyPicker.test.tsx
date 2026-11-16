import { act, fireEvent, screen } from '@testing-library/react'
import { renderWithProviders } from '@test-helpers/test-utils'
import { useState } from 'react'
import { describe, expect, it, vi } from 'vitest'
import { JobTaxonomyPicker } from '../JobTaxonomyPicker'

vi.mock('@scaffald/ui', async () => {
  const actual = await vi.importActual('@scaffald/ui')
  return {
    ...actual,
    Input: ({
      value,
      onChangeText,
      placeholder,
    }: {
      value: string
      onChangeText?: (text: string) => void
      placeholder?: string
    }) => (
      <input
        type="text"
        value={value}
        onChange={(e) => onChangeText?.(e.target.value)}
        placeholder={placeholder}
      />
    ),
  }
})

const skills = [
  { id: 's1', name: 'Welding' },
  { id: 's2', name: 'Wiring' },
]

function Harness({ onSearch }: { onSearch: (q: string) => Promise<typeof skills> }) {
  const [ids, setIds] = useState<string[]>([])
  // A new onChange on every render, as JobForm passes one.
  return (
    <JobTaxonomyPicker
      selectedIds={ids}
      onChange={(next) => setIds(next)}
      onSearch={onSearch}
      placeholder="Search and add skills"
    />
  )
}

async function type(text: string) {
  vi.useFakeTimers()
  try {
    fireEvent.change(screen.getByPlaceholderText('Search and add skills'), {
      target: { value: text },
    })
    await act(async () => {
      await vi.advanceTimersByTimeAsync(350)
    })
  } finally {
    vi.useRealTimers()
  }
}

describe('JobTaxonomyPicker (#1334)', () => {
  it('lists the matches as listbox options and adds the chosen one as a named chip', async () => {
    const onSearch = vi.fn(async () => skills)
    renderWithProviders(<Harness onSearch={onSearch} />)

    await type('wi')
    expect(onSearch).toHaveBeenCalledWith('wi')
    const options = screen.getAllByRole('option')
    expect(options.map((o) => o.textContent)).toEqual(['Welding', 'Wiring'])

    fireEvent.click(screen.getByText('Wiring'))
    // The chip keeps its name after the parent re-renders with the new ids.
    // Declared inside JobForm, the picker remounted here and the name was lost.
    expect(screen.getByText('Wiring')).toBeTruthy()
    expect(screen.queryAllByRole('option')).toHaveLength(0)
    expect((screen.getByPlaceholderText('Search and add skills') as HTMLInputElement).value).toBe('')
  })

  it('does not offer what is already chosen', async () => {
    renderWithProviders(<Harness onSearch={async () => skills} />)
    await type('wi')
    fireEvent.click(screen.getByText('Welding'))
    await type('we')
    expect(screen.getAllByRole('option').map((o) => o.textContent)).toEqual(['Wiring'])
  })

  it('keeps the latest answer when an older search resolves last', async () => {
    let resolveFirst: (value: typeof skills) => void = () => {}
    const onSearch = vi
      .fn()
      .mockImplementationOnce(() => new Promise<typeof skills>((r) => (resolveFirst = r)))
      .mockImplementationOnce(async () => [skills[1]])
    renderWithProviders(<Harness onSearch={onSearch} />)

    await type('w')
    await type('wir')
    await act(async () => resolveFirst(skills))
    expect(screen.getAllByRole('option').map((o) => o.textContent)).toEqual(['Wiring'])
  })
})
