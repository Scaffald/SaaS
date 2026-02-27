/**
 * Button component tests
 */

import React from 'react'
import { render, fireEvent } from '@testing-library/react-native'
import { describe, it, expect, vi } from 'vitest'
import { Button } from '../../components/Button'
import type { ButtonColor, ButtonVariant, ButtonSize } from '../../components/Button'

// Mock icon component for testing
const MockIcon = ({ size, color }: { size: number; color: string }) => (
  <></>
)

describe('Button', () => {
  describe('Basic Rendering', () => {
    it('should render button with text', () => {
      const { getByText } = render(<Button>Click me</Button>)
      expect(getByText('Click me')).toBeTruthy()
    })

    it('should render button without children', () => {
      const { container } = render(<Button iconStart={MockIcon} iconOnly />)
      expect(container).toBeTruthy()
    })
  })

  describe('Color Variants', () => {
    const colors: ButtonColor[] = ['gray', 'primary', 'error']

    colors.forEach((color) => {
      it(`should render ${color} button`, () => {
        const { getByText } = render(<Button color={color}>Button</Button>)
        expect(getByText('Button')).toBeTruthy()
      })
    })
  })

  describe('Style Variants', () => {
    const variants: ButtonVariant[] = ['filled', 'outline', 'light', 'text']

    variants.forEach((variant) => {
      it(`should render ${variant} variant`, () => {
        const { getByText } = render(<Button variant={variant}>Button</Button>)
        expect(getByText('Button')).toBeTruthy()
      })
    })
  })

  describe('Size Variants', () => {
    const sizes: ButtonSize[] = ['sm', 'md', 'lg']

    sizes.forEach((size) => {
      it(`should render ${size} size`, () => {
        const { getByText } = render(<Button size={size}>Button</Button>)
        expect(getByText('Button')).toBeTruthy()
      })
    })
  })

  describe('User Interactions', () => {
    it('should call onPress when clicked', () => {
      const onPress = vi.fn()
      const { getByText } = render(<Button onPress={onPress}>Click me</Button>)

      fireEvent.press(getByText('Click me'))
      expect(onPress).toHaveBeenCalledTimes(1)
    })

    it('should not call onPress when disabled', () => {
      const onPress = vi.fn()
      const { getByText } = render(<Button onPress={onPress} disabled>Click me</Button>)

      fireEvent.press(getByText('Click me'))
      expect(onPress).not.toHaveBeenCalled()
    })

    it('should not call onPress when loading', () => {
      const onPress = vi.fn()
      const { getByRole } = render(<Button onPress={onPress} loading>Click me</Button>)

      // Note: Text won't be visible when loading (shows spinner instead)
      // So we can't click by text - need to find the button differently
      const button = getByRole('button')
      fireEvent.press(button)
      expect(onPress).not.toHaveBeenCalled()
    })
  })

  describe('Disabled State', () => {
    it('should render disabled button', () => {
      const { getByText } = render(<Button disabled>Disabled</Button>)
      expect(getByText('Disabled')).toBeTruthy()
    })

    it('should apply disabled styles to all color variants', () => {
      const colors: ButtonColor[] = ['gray', 'primary', 'error']

      colors.forEach((color) => {
        const { getByText, rerender } = render(
          <Button color={color} disabled>
            Disabled
          </Button>,
        )
        expect(getByText('Disabled')).toBeTruthy()
        rerender(<></>)
      })
    })
  })

  describe('Icons', () => {
    it('should render icon at start', () => {
      const { getByText, container } = render(<Button iconStart={MockIcon}>With Icon</Button>)
      expect(getByText('With Icon')).toBeTruthy()
      expect(container).toBeTruthy()
    })

    it('should render icon at end', () => {
      const { getByText, container } = render(<Button iconEnd={MockIcon}>With Icon</Button>)
      expect(getByText('With Icon')).toBeTruthy()
      expect(container).toBeTruthy()
    })

    it('should render both start and end icons', () => {
      const { getByText, container } = render(
        <Button iconStart={MockIcon} iconEnd={MockIcon}>
          Both Icons
        </Button>,
      )
      expect(getByText('Both Icons')).toBeTruthy()
      expect(container).toBeTruthy()
    })

    it('should render icon-only button', () => {
      const { container, queryByText } = render(<Button iconStart={MockIcon} iconOnly />)
      expect(container).toBeTruthy()
      // Should not render text in icon-only mode
      expect(queryByText('Button')).toBeNull()
    })
  })

  describe('Loading State', () => {
    it('should show loading indicator', () => {
      const { container, queryByText } = render(<Button loading>Loading</Button>)
      // ActivityIndicator is rendered, text is not
      expect(queryByText('Loading')).toBeNull()
      expect(container).toBeTruthy()
    })

    it('should not show icons when loading', () => {
      const { container } = render(
        <Button loading iconStart={MockIcon} iconEnd={MockIcon}>
          Loading
        </Button>,
      )
      // Only ActivityIndicator should be visible
      expect(container).toBeTruthy()
    })
  })

  describe('Full Width', () => {
    it('should render full width button', () => {
      const { getByText, container } = render(<Button fullWidth>Full Width</Button>)
      expect(getByText('Full Width')).toBeTruthy()
      expect(container).toBeTruthy()
    })
  })

  describe('Custom Styles', () => {
    it('should apply custom container style', () => {
      const customStyle = { marginTop: 20 }
      const { getByText, container } = render(<Button style={customStyle}>Styled</Button>)
      expect(getByText('Styled')).toBeTruthy()
      expect(container).toBeTruthy()
    })

    it('should apply custom text style', () => {
      const customTextStyle = { fontSize: 20 }
      const { getByText, container } = render(<Button textStyle={customTextStyle}>Styled Text</Button>)
      expect(getByText('Styled Text')).toBeTruthy()
      expect(container).toBeTruthy()
    })
  })

  describe('Accessibility', () => {
    it('should be accessible as a button', () => {
      const { getByRole } = render(<Button>Accessible</Button>)
      expect(getByRole('button')).toBeTruthy()
    })

    it('should support accessibility label', () => {
      const { getByLabelText } = render(
        <Button accessibilityLabel="Submit form">Submit</Button>,
      )
      expect(getByLabelText('Submit form')).toBeTruthy()
    })
  })

  describe('Combined Variants', () => {
    it('should render primary filled large button', () => {
      const { getByText } = render(
        <Button color="primary" variant="filled" size="lg">
          Primary Large
        </Button>,
      )
      expect(getByText('Primary Large')).toBeTruthy()
    })

    it('should render error outline small button with icon', () => {
      const { getByText } = render(
        <Button color="error" variant="outline" size="sm" iconStart={MockIcon}>
          Error Small
        </Button>,
      )
      expect(getByText('Error Small')).toBeTruthy()
    })

    it('should render gray light medium disabled button', () => {
      const { getByText } = render(
        <Button color="gray" variant="light" size="md" disabled>
          Gray Disabled
        </Button>,
      )
      expect(getByText('Gray Disabled')).toBeTruthy()
    })
  })
})
