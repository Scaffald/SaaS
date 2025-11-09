import {
  fireEvent as domFireEvent,
  render as domRender,
  cleanup as domCleanup,
} from '@testing-library/react'

export * from '@testing-library/react'

export const fireEvent = {
  ...domFireEvent,
  press: (
    element: Parameters<typeof domFireEvent.click>[0],
    options?: Parameters<typeof domFireEvent.click>[1],
  ) => domFireEvent.click(element, options),
}

export const render = domRender
export const cleanup = domCleanup


