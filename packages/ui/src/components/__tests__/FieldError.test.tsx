import { describe, expect, test } from 'vitest'

import { FieldError } from '../FieldError'
import { render, screen } from '../../../test/test-utils'

describe('FieldError', () => {
  test('renders an animated error message when provided', () => {
    render(<FieldError message="This field is required" />)

    expect(screen.getByText('This field is required')).toBeInTheDocument()
  })

  test('does not render anything when message is undefined', () => {
    const { container } = render(<FieldError message={undefined} />)
    expect(container.textContent).toBe('')
  })
})
