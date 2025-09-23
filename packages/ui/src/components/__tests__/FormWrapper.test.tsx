import { describe, expect, test } from 'vitest'

import { FormWrapper } from '../FormWrapper'
import { render, screen } from '../../../test/test-utils'

describe('FormWrapper', () => {
  test('renders wrapper, body, and footer content', () => {
    render(
      <FormWrapper aria-label="Account settings" data-testid="form-wrapper">
        <FormWrapper.Body aria-label="Form body section">
          <p>Body content</p>
        </FormWrapper.Body>
        <FormWrapper.Footer aria-label="Form actions">
          <button type="button">Save changes</button>
        </FormWrapper.Footer>
      </FormWrapper>
    )

    const wrapper = screen.getByTestId('form-wrapper')
    expect(wrapper).toHaveAttribute('aria-label', 'Account settings')
    expect(screen.getByText('Body content')).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Save changes' })).toBeInTheDocument()
  })

  test('forwards accessibility props to body and footer', () => {
    render(
      <FormWrapper>
        <FormWrapper.Body role="form" aria-label="Personal details">
          <input aria-label="First name" />
        </FormWrapper.Body>
        <FormWrapper.Footer role="contentinfo" aria-label="Form footer">
          <span>Footer content</span>
        </FormWrapper.Footer>
      </FormWrapper>
    )

    expect(screen.getByRole('form', { name: 'Personal details' })).toBeInTheDocument()
    const footer = screen.getByRole('contentinfo', { name: 'Form footer' })
    expect(footer).toContainElement(screen.getByText('Footer content'))
  })
})
