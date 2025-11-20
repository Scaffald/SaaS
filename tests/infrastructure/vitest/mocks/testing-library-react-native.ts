import {
  cleanup as domCleanup,
  fireEvent as domFireEvent,
  render as domRender,
} from '@testing-library/react'

export * from '@testing-library/react'

type FireEventType = typeof domFireEvent & {
  press: (
    element: Parameters<typeof domFireEvent.click>[0],
    options?: Parameters<typeof domFireEvent.click>[1]
  ) => boolean
  changeText: (element: Element, value: string) => boolean
}

const fireEventFn = ((element: Element, eventName?: string, ...data: unknown[]) => {
  if (typeof eventName === 'string') {
    switch (eventName) {
      case 'press':
        return domFireEvent.click(element, data[0] as Parameters<typeof domFireEvent.click>[1])
      case 'changeText':
        return domFireEvent.change(element, { target: { value: data[0] } })
      default: {
        const handler = (domFireEvent as Record<string, unknown>)[eventName]
        if (typeof handler === 'function') {
          return (handler as (...args: any[]) => boolean)(element, ...data)
        }
      }
    }
  }
  return domFireEvent(element as any, eventName as any, ...data)
}) as unknown as FireEventType

fireEventFn.press = (
  element: Parameters<typeof domFireEvent.click>[0],
  options?: Parameters<typeof domFireEvent.click>[1]
) => domFireEvent.click(element, options)

fireEventFn.changeText = (element: Element, value: string) =>
  domFireEvent.change(element, { target: { value } })

export const fireEvent = fireEventFn

export const render = domRender
export const cleanup = domCleanup
