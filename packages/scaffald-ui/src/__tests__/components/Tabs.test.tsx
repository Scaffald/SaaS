/**
 * Tabs component tests
 */

import React from 'react'
import { render, fireEvent } from '@testing-library/react-native'
import { describe, it, expect, vi } from 'vitest'
import { Tabs } from '../../components/Tabs'
import type { TabType, TabColor, TabSize, TabOrientation } from '../../components/Tabs'

// Mock ThemeProvider
vi.mock('../../theme', () => ({
  useThemeContext: () => ({ theme: 'light' }),
}))

// Mock icon component for testing
const MockIcon = ({ size, color }: { size: number; color: string }) => <></>

describe('Tabs', () => {
  describe('Basic Rendering', () => {
    it('should render tabs with items', () => {
      const { getByText } = render(
        <Tabs defaultValue="tab1">
          <Tabs.Item value="tab1">
            <Tabs.Trigger>Tab 1</Tabs.Trigger>
            <Tabs.Content>Content 1</Tabs.Content>
          </Tabs.Item>
          <Tabs.Item value="tab2">
            <Tabs.Trigger>Tab 2</Tabs.Trigger>
            <Tabs.Content>Content 2</Tabs.Content>
          </Tabs.Item>
        </Tabs>
      )
      expect(getByText('Tab 1')).toBeTruthy()
      expect(getByText('Tab 2')).toBeTruthy()
    })

    it('should render tab content for default selected tab', () => {
      const { getByText, queryByText } = render(
        <Tabs defaultValue="tab1">
          <Tabs.Item value="tab1">
            <Tabs.Trigger>Tab 1</Tabs.Trigger>
            <Tabs.Content>Content 1</Tabs.Content>
          </Tabs.Item>
          <Tabs.Item value="tab2">
            <Tabs.Trigger>Tab 2</Tabs.Trigger>
            <Tabs.Content>Content 2</Tabs.Content>
          </Tabs.Item>
        </Tabs>
      )
      expect(getByText('Content 1')).toBeTruthy()
      expect(queryByText('Content 2')).toBeNull()
    })

    it('should not render content when no default value', () => {
      const { queryByText } = render(
        <Tabs>
          <Tabs.Item value="tab1">
            <Tabs.Trigger>Tab 1</Tabs.Trigger>
            <Tabs.Content>Content 1</Tabs.Content>
          </Tabs.Item>
        </Tabs>
      )
      expect(queryByText('Content 1')).toBeNull()
    })
  })

  describe('Controlled Mode', () => {
    it('should use controlled value', () => {
      const { getByText, queryByText, rerender } = render(
        <Tabs value="tab1">
          <Tabs.Item value="tab1">
            <Tabs.Trigger>Tab 1</Tabs.Trigger>
            <Tabs.Content>Content 1</Tabs.Content>
          </Tabs.Item>
          <Tabs.Item value="tab2">
            <Tabs.Trigger>Tab 2</Tabs.Trigger>
            <Tabs.Content>Content 2</Tabs.Content>
          </Tabs.Item>
        </Tabs>
      )
      expect(getByText('Content 1')).toBeTruthy()
      expect(queryByText('Content 2')).toBeNull()

      // Change controlled value
      rerender(
        <Tabs value="tab2">
          <Tabs.Item value="tab1">
            <Tabs.Trigger>Tab 1</Tabs.Trigger>
            <Tabs.Content>Content 1</Tabs.Content>
          </Tabs.Item>
          <Tabs.Item value="tab2">
            <Tabs.Trigger>Tab 2</Tabs.Trigger>
            <Tabs.Content>Content 2</Tabs.Content>
          </Tabs.Item>
        </Tabs>
      )
      expect(queryByText('Content 1')).toBeNull()
      expect(getByText('Content 2')).toBeTruthy()
    })

    it('should call onValueChange in controlled mode', () => {
      const onValueChange = vi.fn()
      const { getByText } = render(
        <Tabs value="tab1" onValueChange={onValueChange}>
          <Tabs.Item value="tab1">
            <Tabs.Trigger>Tab 1</Tabs.Trigger>
            <Tabs.Content>Content 1</Tabs.Content>
          </Tabs.Item>
          <Tabs.Item value="tab2">
            <Tabs.Trigger>Tab 2</Tabs.Trigger>
            <Tabs.Content>Content 2</Tabs.Content>
          </Tabs.Item>
        </Tabs>
      )

      fireEvent.press(getByText('Tab 2'))
      expect(onValueChange).toHaveBeenCalledWith('tab2')
    })
  })

  describe('Uncontrolled Mode', () => {
    it('should manage internal state in uncontrolled mode', () => {
      const { getByText, queryByText } = render(
        <Tabs defaultValue="tab1">
          <Tabs.Item value="tab1">
            <Tabs.Trigger>Tab 1</Tabs.Trigger>
            <Tabs.Content>Content 1</Tabs.Content>
          </Tabs.Item>
          <Tabs.Item value="tab2">
            <Tabs.Trigger>Tab 2</Tabs.Trigger>
            <Tabs.Content>Content 2</Tabs.Content>
          </Tabs.Item>
        </Tabs>
      )

      expect(getByText('Content 1')).toBeTruthy()
      expect(queryByText('Content 2')).toBeNull()

      // Switch to tab 2
      fireEvent.press(getByText('Tab 2'))
      expect(queryByText('Content 1')).toBeNull()
      expect(getByText('Content 2')).toBeTruthy()
    })

    it('should call onValueChange in uncontrolled mode', () => {
      const onValueChange = vi.fn()
      const { getByText } = render(
        <Tabs defaultValue="tab1" onValueChange={onValueChange}>
          <Tabs.Item value="tab1">
            <Tabs.Trigger>Tab 1</Tabs.Trigger>
            <Tabs.Content>Content 1</Tabs.Content>
          </Tabs.Item>
          <Tabs.Item value="tab2">
            <Tabs.Trigger>Tab 2</Tabs.Trigger>
            <Tabs.Content>Content 2</Tabs.Content>
          </Tabs.Item>
        </Tabs>
      )

      fireEvent.press(getByText('Tab 2'))
      expect(onValueChange).toHaveBeenCalledWith('tab2')
    })
  })

  describe('Type Variants', () => {
    const types: TabType[] = ['default', 'line', 'shadow']

    types.forEach((type) => {
      it(`should render ${type} type`, () => {
        const { getByText } = render(
          <Tabs type={type} defaultValue="tab1">
            <Tabs.Item value="tab1">
              <Tabs.Trigger>Tab 1</Tabs.Trigger>
              <Tabs.Content>Content 1</Tabs.Content>
            </Tabs.Item>
          </Tabs>
        )
        expect(getByText('Tab 1')).toBeTruthy()
      })
    })
  })

  describe('Color Variants', () => {
    const colors: TabColor[] = ['gray', 'primary']

    colors.forEach((color) => {
      it(`should render ${color} color`, () => {
        const { getByText } = render(
          <Tabs color={color} defaultValue="tab1">
            <Tabs.Item value="tab1">
              <Tabs.Trigger>Tab 1</Tabs.Trigger>
              <Tabs.Content>Content 1</Tabs.Content>
            </Tabs.Item>
          </Tabs>
        )
        expect(getByText('Tab 1')).toBeTruthy()
      })
    })
  })

  describe('Size Variants', () => {
    const sizes: TabSize[] = ['sm', 'md', 'lg']

    sizes.forEach((size) => {
      it(`should render ${size} size`, () => {
        const { getByText } = render(
          <Tabs size={size} defaultValue="tab1">
            <Tabs.Item value="tab1">
              <Tabs.Trigger>Tab 1</Tabs.Trigger>
              <Tabs.Content>Content 1</Tabs.Content>
            </Tabs.Item>
          </Tabs>
        )
        expect(getByText('Tab 1')).toBeTruthy()
      })
    })
  })

  describe('Orientation', () => {
    const orientations: TabOrientation[] = ['horizontal', 'vertical']

    orientations.forEach((orientation) => {
      it(`should render ${orientation} orientation`, () => {
        const { getByText } = render(
          <Tabs orientation={orientation} defaultValue="tab1">
            <Tabs.Item value="tab1">
              <Tabs.Trigger>Tab 1</Tabs.Trigger>
              <Tabs.Content>Content 1</Tabs.Content>
            </Tabs.Item>
          </Tabs>
        )
        expect(getByText('Tab 1')).toBeTruthy()
      })
    })
  })

  describe('Selection Behavior', () => {
    it('should switch between tabs on press', () => {
      const { getByText, queryByText } = render(
        <Tabs defaultValue="tab1">
          <Tabs.Item value="tab1">
            <Tabs.Trigger>Tab 1</Tabs.Trigger>
            <Tabs.Content>Content 1</Tabs.Content>
          </Tabs.Item>
          <Tabs.Item value="tab2">
            <Tabs.Trigger>Tab 2</Tabs.Trigger>
            <Tabs.Content>Content 2</Tabs.Content>
          </Tabs.Item>
        </Tabs>
      )

      expect(getByText('Content 1')).toBeTruthy()
      expect(queryByText('Content 2')).toBeNull()

      fireEvent.press(getByText('Tab 2'))

      expect(queryByText('Content 1')).toBeNull()
      expect(getByText('Content 2')).toBeTruthy()
    })

    it('should not switch when clicking selected tab', () => {
      const onValueChange = vi.fn()
      const { getByText } = render(
        <Tabs defaultValue="tab1" onValueChange={onValueChange}>
          <Tabs.Item value="tab1">
            <Tabs.Trigger>Tab 1</Tabs.Trigger>
            <Tabs.Content>Content 1</Tabs.Content>
          </Tabs.Item>
        </Tabs>,
      )

      fireEvent.press(getByText('Tab 1'))
      // Should still call onValueChange even if already selected
      expect(onValueChange).toHaveBeenCalledWith('tab1')
    })
  })

  describe('Disabled State', () => {
    it('should render disabled tabs', () => {
      const { getByText } = render(
        <Tabs disabled defaultValue="tab1">
          <Tabs.Item value="tab1">
            <Tabs.Trigger>Tab 1</Tabs.Trigger>
            <Tabs.Content>Content 1</Tabs.Content>
          </Tabs.Item>
          <Tabs.Item value="tab2">
            <Tabs.Trigger>Tab 2</Tabs.Trigger>
            <Tabs.Content>Content 2</Tabs.Content>
          </Tabs.Item>
        </Tabs>
      )
      expect(getByText('Tab 1')).toBeTruthy()
      expect(getByText('Tab 2')).toBeTruthy()
    })

    it('should not switch tabs when disabled', () => {
      const onValueChange = vi.fn()
      const { getByText, queryByText } = render(
        <Tabs disabled defaultValue="tab1" onValueChange={onValueChange}>
          <Tabs.Item value="tab1">
            <Tabs.Trigger>Tab 1</Tabs.Trigger>
            <Tabs.Content>Content 1</Tabs.Content>
          </Tabs.Item>
          <Tabs.Item value="tab2">
            <Tabs.Trigger>Tab 2</Tabs.Trigger>
            <Tabs.Content>Content 2</Tabs.Content>
          </Tabs.Item>
        </Tabs>
      )

      expect(getByText('Content 1')).toBeTruthy()
      expect(queryByText('Content 2')).toBeNull()

      fireEvent.press(getByText('Tab 2'))
      expect(onValueChange).not.toHaveBeenCalled()
      expect(queryByText('Content 2')).toBeNull()
    })

    it('should not switch individual disabled tab', () => {
      const onValueChange = vi.fn()
      const { getByText, queryByText } = render(
        <Tabs defaultValue="tab1" onValueChange={onValueChange}>
          <Tabs.Item value="tab1">
            <Tabs.Trigger>Tab 1</Tabs.Trigger>
            <Tabs.Content>Content 1</Tabs.Content>
          </Tabs.Item>
          <Tabs.Item value="tab2" disabled>
            <Tabs.Trigger>Tab 2</Tabs.Trigger>
            <Tabs.Content>Content 2</Tabs.Content>
          </Tabs.Item>
        </Tabs>
      )

      expect(getByText('Content 1')).toBeTruthy()
      fireEvent.press(getByText('Tab 2'))
      expect(onValueChange).not.toHaveBeenCalled()
      expect(queryByText('Content 2')).toBeNull()
    })
  })

  describe('Icons', () => {
    it('should render icon at start', () => {
      const { getByText, container } = render(
        <Tabs defaultValue="tab1">
          <Tabs.Item value="tab1">
            <Tabs.Trigger iconStart={MockIcon}>Tab 1</Tabs.Trigger>
            <Tabs.Content>Content 1</Tabs.Content>
          </Tabs.Item>
        </Tabs>
      )
      expect(getByText('Tab 1')).toBeTruthy()
      expect(container).toBeTruthy()
    })

    it('should render icon at end', () => {
      const { getByText, container } = render(
        <Tabs defaultValue="tab1">
          <Tabs.Item value="tab1">
            <Tabs.Trigger iconEnd={MockIcon}>Tab 1</Tabs.Trigger>
            <Tabs.Content>Content 1</Tabs.Content>
          </Tabs.Item>
        </Tabs>
      )
      expect(getByText('Tab 1')).toBeTruthy()
      expect(container).toBeTruthy()
    })

    it('should render both start and end icons', () => {
      const { getByText, container } = render(
        <Tabs defaultValue="tab1">
          <Tabs.Item value="tab1">
            <Tabs.Trigger iconStart={MockIcon} iconEnd={MockIcon}>
              Tab 1
            </Tabs.Trigger>
            <Tabs.Content>Content 1</Tabs.Content>
          </Tabs.Item>
        </Tabs>
      )
      expect(getByText('Tab 1')).toBeTruthy()
      expect(container).toBeTruthy()
    })

    it('should render icon-only tab', () => {
      const { container, queryByText } = render(
        <Tabs defaultValue="tab1">
          <Tabs.Item value="tab1">
            <Tabs.Trigger iconStart={MockIcon} iconOnly />
            <Tabs.Content>Content 1</Tabs.Content>
          </Tabs.Item>
        </Tabs>
      )
      expect(container).toBeTruthy()
      // Should not render text in icon-only mode
      expect(queryByText('Tab 1')).toBeNull()
    })
  })

  describe('Custom Styles', () => {
    it('should apply custom container style', () => {
      const customStyle = { marginTop: 20 }
      const { getByText, container } = render(
        <Tabs defaultValue="tab1" containerStyle={customStyle}>
          <Tabs.Item value="tab1">
            <Tabs.Trigger>Tab 1</Tabs.Trigger>
            <Tabs.Content>Content 1</Tabs.Content>
          </Tabs.Item>
        </Tabs>
      )
      expect(getByText('Tab 1')).toBeTruthy()
      expect(container).toBeTruthy()
    })

    it('should apply custom text style', () => {
      const customTextStyle = { fontSize: 20 }
      const { getByText } = render(
        <Tabs defaultValue="tab1">
          <Tabs.Item value="tab1">
            <Tabs.Trigger textStyle={customTextStyle}>Tab 1</Tabs.Trigger>
            <Tabs.Content>Content 1</Tabs.Content>
          </Tabs.Item>
        </Tabs>
      )
      expect(getByText('Tab 1')).toBeTruthy()
    })
  })

  describe('Accessibility', () => {
    it('should have tab accessibility role', () => {
      const { getByRole } = render(
        <Tabs defaultValue="tab1">
          <Tabs.Item value="tab1">
            <Tabs.Trigger>Tab 1</Tabs.Trigger>
            <Tabs.Content>Content 1</Tabs.Content>
          </Tabs.Item>
        </Tabs>
      )
      expect(getByRole('tab')).toBeTruthy()
    })

    it('should indicate selected state', () => {
      const { getByRole } = render(
        <Tabs defaultValue="tab1">
          <Tabs.Item value="tab1">
            <Tabs.Trigger>Tab 1</Tabs.Trigger>
            <Tabs.Content>Content 1</Tabs.Content>
          </Tabs.Item>
          <Tabs.Item value="tab2">
            <Tabs.Trigger>Tab 2</Tabs.Trigger>
            <Tabs.Content>Content 2</Tabs.Content>
          </Tabs.Item>
        </Tabs>
      )
      const tab1 = getByRole('tab', { name: 'Tab 1' })
      expect(tab1.props.accessibilityState.selected).toBe(true)

      const tab2 = getByRole('tab', { name: 'Tab 2' })
      expect(tab2.props.accessibilityState.selected).toBe(false)
    })

    it('should indicate disabled state', () => {
      const { getByRole } = render(
        <Tabs defaultValue="tab1">
          <Tabs.Item value="tab1">
            <Tabs.Trigger>Tab 1</Tabs.Trigger>
            <Tabs.Content>Content 1</Tabs.Content>
          </Tabs.Item>
          <Tabs.Item value="tab2" disabled>
            <Tabs.Trigger>Tab 2</Tabs.Trigger>
            <Tabs.Content>Content 2</Tabs.Content>
          </Tabs.Item>
        </Tabs>
      )
      const tab2 = getByRole('tab', { name: 'Tab 2' })
      expect(tab2.props.accessibilityState.disabled).toBe(true)
    })
  })

  describe('Combined Variants', () => {
    it('should render primary line large horizontal tabs', () => {
      const { getByText } = render(
        <Tabs type="line" color="primary" size="lg" orientation="horizontal" defaultValue="tab1">
          <Tabs.Item value="tab1">
            <Tabs.Trigger>Tab 1</Tabs.Trigger>
            <Tabs.Content>Content 1</Tabs.Content>
          </Tabs.Item>
        </Tabs>
      )
      expect(getByText('Tab 1')).toBeTruthy()
    })

    it('should render gray shadow small vertical tabs', () => {
      const { getByText } = render(
        <Tabs type="shadow" color="gray" size="sm" orientation="vertical" defaultValue="tab1">
          <Tabs.Item value="tab1">
            <Tabs.Trigger>Tab 1</Tabs.Trigger>
            <Tabs.Content>Content 1</Tabs.Content>
          </Tabs.Item>
        </Tabs>
      )
      expect(getByText('Tab 1')).toBeTruthy()
    })
  })

  describe('Full Width', () => {
    it('should render full width tabs', () => {
      const { getByText, container } = render(
        <Tabs fullWidth defaultValue="tab1">
          <Tabs.Item value="tab1">
            <Tabs.Trigger>Tab 1</Tabs.Trigger>
            <Tabs.Content>Content 1</Tabs.Content>
          </Tabs.Item>
        </Tabs>
      )
      expect(getByText('Tab 1')).toBeTruthy()
      expect(container).toBeTruthy()
    })
  })
})

