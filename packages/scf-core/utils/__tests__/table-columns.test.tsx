import { Component, isValidElement, type ReactElement } from 'react'
import { Text } from 'react-native'
import { describe, expect, it } from 'vitest'
import { columnsFromTanStack } from '../table-columns'

/**
 * Every value a cell can produce has to reach the Table as something a
 * native <View> can hold (#768). flexRender turns any function into a
 * component, which hid a formatter's string return behind an element.
 */
type Row = Record<string, unknown>
const render = (def: Parameters<typeof columnsFromTanStack<Row>>[0][number], value: unknown) =>
  columnsFromTanStack<Row>([def])[0].render?.(value, { id: 'r1' }, 0)

const isText = (node: unknown): node is ReactElement =>
  isValidElement(node) && node.type === Text

describe('columnsFromTanStack render', () => {
  it('wraps a formatter function’s string in <Text> instead of a bare element', () => {
    const out = render({ id: 'bytes', header: 'Bytes', cell: (info) => `${info.getValue()} MB` }, 55)
    expect(isText(out)).toBe(true)
    expect((out as ReactElement<{ children: string }>).props.children).toBe('55 MB')
  })

  it('passes an element a formatter returns straight through', () => {
    const el = <Text>custom</Text>
    const out = render({ id: 'x', header: 'X', cell: () => el }, 'ignored')
    expect(out).toBe(el)
  })

  it('wraps the raw value when there is no cell', () => {
    const out = render({ id: 'plain', header: 'Plain', accessorKey: 'plain' } as never, 42)
    expect(isText(out)).toBe(true)
    expect((out as ReactElement<{ children: string }>).props.children).toBe('42')
  })

  it('still lets a class component render itself', () => {
    class Cell extends Component {
      override render() {
        return <Text>class</Text>
      }
    }
    const out = render({ id: 'c', header: 'C', cell: Cell as never }, 'v')
    expect(isValidElement(out) && out.type === Cell).toBe(true)
  })

  it('renders an empty cell as an empty string, not null-in-a-View', () => {
    const out = render({ id: 'e', header: 'E' } as never, null)
    expect(isText(out)).toBe(true)
  })
})
