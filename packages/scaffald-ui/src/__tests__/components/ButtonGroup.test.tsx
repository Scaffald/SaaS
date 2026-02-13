/**
 * ButtonGroup component tests
 */

import React from 'react'
import { render, fireEvent } from '@testing-library/react-native'
import { describe, it, expect, vi } from 'vitest'
import { ButtonGroup } from '../../components/ButtonGroup'
import type { ButtonGroupItem, ButtonGroupMode, ButtonGroupSize } from '../../components/ButtonGroup'

// Mock icon component for testing
const MockIcon = ({ size, color }: { size: number; color: string }) => <></>

// Test data
const basicItems: ButtonGroupItem[] = [
  { id: '1', label: 'Option 1' },
  { id: '2', label: 'Option 2' },
  { id: '3', label: 'Option 3' },
]

const itemsWithIcons: ButtonGroupItem[] = [
  { id: '1', label: 'Bold', icon: MockIcon },
  { id: '2', label: 'Italic', icon: MockIcon },
  { id: '3', label: 'Underline', icon: MockIcon },
]

describe('ButtonGroup', () => {
  describe('Basic Rendering', () => {
    it('should render all items', () => {
      const { getByText } = render(<ButtonGroup items={basicItems} />)
      expect(getByText('Option 1')).toBeTruthy()
      expect(getByText('Option 2')).toBeTruthy()
      expect(getByText('Option 3')).toBeTruthy()
    })

    it('should render icon-only items', () => {
      const iconOnlyItems: ButtonGroupItem[] = [
        { id: '1', icon: MockIcon },
        { id: '2', icon: MockIcon },
      ]
      const { container } = render(<ButtonGroup items={iconOnlyItems} />)
      expect(container).toBeTruthy()
    })
  })

  describe('Selection Modes', () => {
    describe('Single Selection Mode', () => {
      it('should select only one item at a time (uncontrolled)', () => {
        const onChange = vi.fn()
        const { getByText } = render(<ButtonGroup items={basicItems} mode="single" onChange={onChange} />)

        fireEvent.press(getByText('Option 1'))
        expect(onChange).toHaveBeenCalledWith('1')

        fireEvent.press(getByText('Option 2'))
        expect(onChange).toHaveBeenCalledWith('2')
      })

      it('should work in controlled mode', () => {
        const onChange = vi.fn()
        const { getByText, rerender } = render(
          <ButtonGroup items={basicItems} mode="single" value="1" onChange={onChange} />,
        )

        fireEvent.press(getByText('Option 2'))
        expect(onChange).toHaveBeenCalledWith('2')

        // Simulate parent updating value
        rerender(<ButtonGroup items={basicItems} mode="single" value="2" onChange={onChange} />)
      })
    })

    describe('Multiple Selection Mode', () => {
      it('should allow multiple selections (uncontrolled)', () => {
        const onChange = vi.fn()
        const { getByText } = render(<ButtonGroup items={basicItems} mode="multiple" onChange={onChange} />)

        // First selection - adds to empty array
        fireEvent.press(getByText('Option 1'))
        expect(onChange).toHaveBeenNthCalledWith(1, ['1'])

        // Second selection - in uncontrolled mode without value prop,
        // the component uses its internal state, so this adds to the existing selection
        fireEvent.press(getByText('Option 2'))
        expect(onChange).toHaveBeenNthCalledWith(2, ['1', '2'])
      })

      it('should toggle selections on and off', () => {
        const onChange = vi.fn()
        const { getByText } = render(<ButtonGroup items={basicItems} mode="multiple" value={['1']} onChange={onChange} />)

        // Add selection
        fireEvent.press(getByText('Option 2'))
        expect(onChange).toHaveBeenCalledWith(['1', '2'])

        // Remove selection
        fireEvent.press(getByText('Option 1'))
        expect(onChange).toHaveBeenCalledWith([])
      })

      it('should work in controlled mode', () => {
        const onChange = vi.fn()
        const { getByText } = render(
          <ButtonGroup items={basicItems} mode="multiple" value={['1', '2']} onChange={onChange} />,
        )

        fireEvent.press(getByText('Option 3'))
        expect(onChange).toHaveBeenCalledWith(['1', '2', '3'])
      })
    })
  })

  describe('Size Variants', () => {
    const sizes: ButtonGroupSize[] = ['xs', 'sm', 'md']

    sizes.forEach((size) => {
      it(`should render ${size} size`, () => {
        const { getByText, unmount } = render(<ButtonGroup items={basicItems} size={size} />)
        expect(getByText('Option 1')).toBeTruthy()
        unmount()
      })
    })
  })

  describe('Orientation', () => {
    it('should render horizontal orientation', () => {
      const { getByText } = render(<ButtonGroup items={basicItems} orientation="horizontal" />)
      expect(getByText('Option 1')).toBeTruthy()
    })

    it('should render vertical orientation', () => {
      const { getByText } = render(<ButtonGroup items={basicItems} orientation="vertical" />)
      expect(getByText('Option 1')).toBeTruthy()
    })
  })

  describe('Icons', () => {
    it('should render items with icons', () => {
      const { getByText } = render(<ButtonGroup items={itemsWithIcons} />)
      expect(getByText('Bold')).toBeTruthy()
      expect(getByText('Italic')).toBeTruthy()
    })

    it('should render icons at start position', () => {
      const items: ButtonGroupItem[] = [
        { id: '1', label: 'Option', icon: MockIcon, iconPosition: 'start' },
      ]
      const { getByText } = render(<ButtonGroup items={items} />)
      expect(getByText('Option')).toBeTruthy()
    })

    it('should render icons at end position', () => {
      const items: ButtonGroupItem[] = [
        { id: '1', label: 'Option', icon: MockIcon, iconPosition: 'end' },
      ]
      const { getByText } = render(<ButtonGroup items={items} />)
      expect(getByText('Option')).toBeTruthy()
    })
  })

  describe('Disabled State', () => {
    it('should disable entire group', () => {
      const onChange = vi.fn()
      const { getByText } = render(<ButtonGroup items={basicItems} disabled onChange={onChange} />)

      fireEvent.press(getByText('Option 1'))
      expect(onChange).not.toHaveBeenCalled()
    })

    it('should disable individual items', () => {
      const onChange = vi.fn()
      const items: ButtonGroupItem[] = [
        { id: '1', label: 'Option 1' },
        { id: '2', label: 'Option 2', disabled: true },
      ]
      const { getByText } = render(<ButtonGroup items={items} onChange={onChange} />)

      fireEvent.press(getByText('Option 1'))
      expect(onChange).toHaveBeenCalledWith('1')

      fireEvent.press(getByText('Option 2'))
      expect(onChange).toHaveBeenCalledTimes(1) // Should not be called again
    })
  })

  describe('Full Width', () => {
    it('should render full width button group', () => {
      const { getByText } = render(<ButtonGroup items={basicItems} fullWidth />)
      expect(getByText('Option 1')).toBeTruthy()
    })
  })

  describe('Default Value', () => {
    it('should use default value in single mode', () => {
      const onChange = vi.fn()
      const { getByText } = render(<ButtonGroup items={basicItems} mode="single" defaultValue="2" onChange={onChange} />)

      fireEvent.press(getByText('Option 3'))
      expect(onChange).toHaveBeenCalledWith('3')
    })

    it('should use default value in multiple mode', () => {
      const onChange = vi.fn()
      const { getByText } = render(
        <ButtonGroup items={basicItems} mode="multiple" defaultValue={['1', '2']} onChange={onChange} />,
      )

      fireEvent.press(getByText('Option 3'))
      expect(onChange).toHaveBeenCalledWith(['1', '2', '3'])
    })
  })

  describe('Combined Variants', () => {
    it('should render small vertical button group with multiple selection', () => {
      const onChange = vi.fn()
      const { getByText } = render(
        <ButtonGroup items={basicItems} size="sm" orientation="vertical" mode="multiple" onChange={onChange} />,
      )

      fireEvent.press(getByText('Option 1'))
      fireEvent.press(getByText('Option 2'))
      expect(onChange).toHaveBeenCalledTimes(2)
    })

    it('should render full width horizontal group with icons', () => {
      const { getByText } = render(<ButtonGroup items={itemsWithIcons} fullWidth orientation="horizontal" />)
      expect(getByText('Bold')).toBeTruthy()
      expect(getByText('Italic')).toBeTruthy()
    })
  })
})
