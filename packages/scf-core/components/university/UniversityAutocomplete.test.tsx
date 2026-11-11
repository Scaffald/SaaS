import { describe, expect, it, vi } from 'vitest'
import { fireEvent, screen } from '@testing-library/react'
import { renderWithProviders } from '@test-helpers/test-utils'
import { UniversityAutocomplete } from './UniversityAutocomplete'

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

describe('UniversityAutocomplete (uncontrolled)', () => {
  // On the profile's education form the field is uncontrolled and `value` only
  // changes on a selection. The sync effect used to reset the input to `value`
  // on every keystroke, so nothing could be typed (found smoke-testing #1330).
  it('keeps what is typed and searches for it', () => {
    const onSearch = vi.fn()
    renderWithProviders(
      <UniversityAutocomplete value="" onSearch={onSearch} results={[]} loading={false} placeholder="Search for institution..." />,
    )
    const input = screen.getByPlaceholderText('Search for institution...') as HTMLInputElement
    fireEvent.change(input, { target: { value: 'harv' } })
    expect(input.value).toBe('harv')
    expect(onSearch).toHaveBeenCalledWith('harv')
  })

  it('still follows `value` when the form changes it', () => {
    const { rerender } = renderWithProviders(
      <UniversityAutocomplete value="" onSearch={vi.fn()} results={[]} loading={false} placeholder="Search for institution..." />,
    )
    rerender(
      <UniversityAutocomplete value="Harvard University" onSearch={vi.fn()} results={[]} loading={false} placeholder="Search for institution..." />,
    )
    const input = screen.getByPlaceholderText('Search for institution...') as HTMLInputElement
    expect(input.value).toBe('Harvard University')
  })
})
