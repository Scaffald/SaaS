import { fireEvent, screen, waitFor } from '@testing-library/react'
import { renderWithProviders } from '@test-helpers/test-utils'
import { useState } from 'react'
import { describe, expect, it, vi } from 'vitest'
import { UserSearch } from './UserSearch'

const listUsers = vi.fn(
  (options?: { search?: string; ids?: string[]; enabled?: boolean }) => ({
    data: { users: [{ id: 'u1', first_name: 'Ada', last_name: 'Lovelace', username: 'ada' }] },
    isLoading: false,
    options,
  })
)
vi.mock('@scf/core/utils/office-users-sdk-hooks', () => ({
  useOfficeListUsers: (options?: { search?: string; ids?: string[]; enabled?: boolean }) =>
    listUsers(options),
}))

// The real Input draws its trailing icon as a button; this stand-in keeps that
// contract (iconEnd + iconEndOnPress + iconEndAccessibilityLabel) visible.
vi.mock('@scaffald/ui', async () => {
  const actual = await vi.importActual('@scaffald/ui')
  return {
    ...actual,
    Input: ({
      value,
      onChangeText,
      placeholder,
      iconEnd,
      iconEndOnPress,
      iconEndAccessibilityLabel,
    }: {
      value: string
      onChangeText?: (text: string) => void
      placeholder?: string
      iconEnd?: unknown
      iconEndOnPress?: () => void
      iconEndAccessibilityLabel?: string
    }) => (
      <span data-testid="field">
        <input value={value} onChange={(e) => onChangeText?.(e.target.value)} placeholder={placeholder} />
        {iconEnd && iconEndOnPress ? (
          <button type="button" aria-label={iconEndAccessibilityLabel} onClick={iconEndOnPress} />
        ) : null}
      </span>
    ),
  }
})

// The job form owns the id: onChange feeds back into `value`.
function Field({ onChange }: { onChange: (id: string) => void }) {
  const [id, setId] = useState('u1')
  return (
    <UserSearch
      value={id}
      onChange={(next) => {
        setId(next)
        onChange(next)
      }}
      placeholder="Hiring manager"
    />
  )
}

describe('UserSearch (#1335)', () => {
  it('draws the clear button inside the one field, and it clears the selection', () => {
    const onChange = vi.fn()
    renderWithProviders(<Field onChange={onChange} />)

    const input = screen.getByPlaceholderText('Hiring manager') as HTMLInputElement
    expect(input.value).toBe('Ada Lovelace (ada)')
    const clear = screen.getByRole('button', { name: 'Clear' })
    expect(screen.getByTestId('field').contains(clear)).toBe(true)

    fireEvent.click(clear)
    expect(input.value).toBe('')
    expect(onChange).toHaveBeenCalledWith('')
  })

  it('has no clear button while the field is empty', () => {
    renderWithProviders(<UserSearch placeholder="Hiring manager" />)
    expect(screen.queryByRole('button', { name: 'Clear' })).toBeNull()
  })

  it('searches on the server, not in a first page of users (#1343)', async () => {
    listUsers.mockClear()
    renderWithProviders(<UserSearch placeholder="Hiring manager" />)
    fireEvent.change(screen.getByPlaceholderText('Hiring manager'), { target: { value: 'love' } })
    await waitFor(() =>
      expect(listUsers).toHaveBeenCalledWith(
        expect.objectContaining({ search: 'love', enabled: true })
      )
    )
  })

  it('names a saved user by id, without a search (#1343)', () => {
    listUsers.mockClear()
    renderWithProviders(<UserSearch value="u1" placeholder="Hiring manager" />)
    expect(listUsers).toHaveBeenCalledWith(expect.objectContaining({ ids: ['u1'], enabled: true }))
  })
})
