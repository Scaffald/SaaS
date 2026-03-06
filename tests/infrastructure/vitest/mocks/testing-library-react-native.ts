import {
  cleanup as domCleanup,
  fireEvent as domFireEvent,
  render as domRender,
  getByTestId as domGetByTestId,
  queryByTestId as domQueryByTestId,
  getAllByTestId as domGetAllByTestId,
  queryAllByTestId as domQueryAllByTestId,
  findByTestId as domFindByTestId,
  findAllByTestId as domFindAllByTestId,
} from '@testing-library/react'

export * from '@testing-library/react'

// RNTL uses capital-D TestID; re-export with both casings
export const getByTestID = domGetByTestId
export const queryByTestID = domQueryByTestId
export const getAllByTestID = domGetAllByTestId
export const queryAllByTestID = domQueryAllByTestId
export const findByTestID = domFindByTestId
export const findAllByTestID = domFindAllByTestId

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
      case 'pressIn':
        return domFireEvent.mouseDown(element)
      case 'pressOut':
        return domFireEvent.mouseUp(element)
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

// Attach all DOM fireEvent methods (error, mouseEnter, mouseLeave, etc.) to the wrapper
Object.assign(fireEventFn, domFireEvent)

// Override specific methods for RN-to-DOM mapping
fireEventFn.press = (
  element: Parameters<typeof domFireEvent.click>[0],
  options?: Parameters<typeof domFireEvent.click>[1]
) => domFireEvent.click(element, options)

fireEventFn.changeText = (element: Element, value: string) =>
  domFireEvent.change(element, { target: { value } })

export const fireEvent = fireEventFn

export const render = (...args: Parameters<typeof domRender>) => {
  const result = domRender(...args)
  return {
    ...result,
    getByTestID: result.getByTestId,
    queryByTestID: result.queryByTestId,
    getAllByTestID: result.getAllByTestId,
    queryAllByTestID: result.queryAllByTestId,
    findByTestID: result.findByTestId,
    findAllByTestID: result.findAllByTestId,
  }
}
export const cleanup = domCleanup
