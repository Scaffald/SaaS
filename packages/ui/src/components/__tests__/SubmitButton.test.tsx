vi.mock('react-hook-form', () => ({
  useFormState: vi.fn(),
}))

import { afterEach, describe, expect, test, vi } from 'vitest'

import { fireEvent, render, screen } from '../../../test/test-utils'
import { SubmitButton } from '../SubmitButton'
import { useFormState } from 'react-hook-form'

const mockedUseFormState = vi.mocked(useFormState)

describe('SubmitButton', () => {
  afterEach(() => {
    mockedUseFormState.mockReset()
  })

  test('forwards props to the underlying button', () => {
    mockedUseFormState.mockReturnValue({ isSubmitting: false } as any)
    const onPress = vi.fn()

    render(
      <SubmitButton aria-label="Submit form" onPress={onPress}>
        Submit
      </SubmitButton>
    )

    const button = screen.getByRole('button', { name: 'Submit form' })
    expect(button).toBeEnabled()

    fireEvent.click(button)
    expect(onPress).toHaveBeenCalled()
  })

  test('disables the button when the form is submitting', () => {
    mockedUseFormState.mockReturnValue({ isSubmitting: true } as any)

    render(<SubmitButton aria-label="Saving form">Save</SubmitButton>)

    const button = screen.getByRole('button', { name: 'Saving form' })
    expect(button).toBeDisabled()
  })
})
