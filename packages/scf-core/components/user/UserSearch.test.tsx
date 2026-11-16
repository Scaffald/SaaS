import { fireEvent, screen } from '@testing-library/react'
import { renderWithProviders } from '@test-helpers/test-utils'
import { useState } from 'react'
import { describe, expect, it, vi } from 'vitest'
import { UserSearch } from './UserSearch'

vi.mock('@scf/core/utils/office-users-sdk-hooks', () => ({
  useOfficeListUsers: () => ({
    data: {
      users: [{ id: 'u1', first_name: 'Ada', last_name: 'Lovelace', username: 'ada' }],
    },
    isLoading: false,
  }),
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
})
