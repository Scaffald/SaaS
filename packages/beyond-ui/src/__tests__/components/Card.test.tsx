/**
 * Card components tests
 * Tests for Card, CardHeader, CardContent, CardFooter, CardMedia
 */

import React from 'react'
import { render, fireEvent } from '@testing-library/react-native'
import { describe, it, expect, vi } from 'vitest'
import { View, Text as RNText } from 'react-native'
import { Card, CardHeader, CardContent, CardFooter, CardMedia } from '../../components/Card'

describe('Card Components', () => {
  describe('Card', () => {
    describe('Basic Rendering', () => {
      it('should render children', () => {
        const { getByText } = render(
          <Card>
            <RNText>Card content</RNText>
          </Card>
        )
        expect(getByText('Card content')).toBeTruthy()
      })

      it('should render with testID', () => {
        const { getByTestId } = render(
          <Card testID="test-card">
            <RNText>Content</RNText>
          </Card>
        )
        expect(getByTestId('test-card')).toBeTruthy()
      })
    })

    describe('Variants', () => {
      it('should render elevated variant by default', () => {
        const { container } = render(
          <Card>
            <RNText>Elevated</RNText>
          </Card>
        )
        expect(container).toBeTruthy()
      })

      it('should render outlined variant', () => {
        const { container } = render(
          <Card variant="outlined">
            <RNText>Outlined</RNText>
          </Card>
        )
        expect(container).toBeTruthy()
      })

      it('should render filled variant', () => {
        const { container } = render(
          <Card variant="filled">
            <RNText>Filled</RNText>
          </Card>
        )
        expect(container).toBeTruthy()
      })
    })

    describe('Elevation', () => {
      it('should accept sm elevation', () => {
        const { container } = render(
          <Card elevation="sm">
            <RNText>Small</RNText>
          </Card>
        )
        expect(container).toBeTruthy()
      })

      it('should accept md elevation', () => {
        const { container } = render(
          <Card elevation="md">
            <RNText>Medium</RNText>
          </Card>
        )
        expect(container).toBeTruthy()
      })

      it('should accept lg elevation', () => {
        const { container } = render(
          <Card elevation="lg">
            <RNText>Large</RNText>
          </Card>
        )
        expect(container).toBeTruthy()
      })
    })

    describe('Border Radius', () => {
      it('should accept all radius sizes', () => {
        const sizes = ['sm', 'md', 'lg', 'xl'] as const
        sizes.forEach((size) => {
          const { container } = render(
            <Card radius={size}>
              <RNText>Radius {size}</RNText>
            </Card>
          )
          expect(container).toBeTruthy()
        })
      })
    })

    describe('Padding', () => {
      it('should accept all padding sizes', () => {
        const sizes = ['none', 'sm', 'md', 'lg', 'xl'] as const
        sizes.forEach((size) => {
          const { container } = render(
            <Card padding={size}>
              <RNText>Padding {size}</RNText>
            </Card>
          )
          expect(container).toBeTruthy()
        })
      })
    })

    describe('Pressable', () => {
      it('should handle press events when pressable', () => {
        const onPress = vi.fn()
        const { getByText } = render(
          <Card pressable onPress={onPress}>
            <RNText>Pressable card</RNText>
          </Card>
        )
        fireEvent.press(getByText('Pressable card'))
        expect(onPress).toHaveBeenCalledTimes(1)
      })

      it('should not call onPress when disabled', () => {
        const onPress = vi.fn()
        const { getByText } = render(
          <Card pressable onPress={onPress} disabled>
            <RNText>Disabled card</RNText>
          </Card>
        )
        fireEvent.press(getByText('Disabled card'))
        expect(onPress).not.toHaveBeenCalled()
      })

      it('should handle pressIn and pressOut events', () => {
        const onPressIn = vi.fn()
        const onPressOut = vi.fn()
        const { getByText } = render(
          <Card pressable onPress={() => {}} onPressIn={onPressIn} onPressOut={onPressOut}>
            <RNText>Press events</RNText>
          </Card>
        )
        const card = getByText('Press events')
        fireEvent(card, 'pressIn')
        expect(onPressIn).toHaveBeenCalledTimes(1)
        fireEvent(card, 'pressOut')
        expect(onPressOut).toHaveBeenCalledTimes(1)
      })
    })

    describe('Accessibility', () => {
      it('should accept accessibilityLabel', () => {
        const { getByLabelText } = render(
          <Card accessibilityLabel="Important card">
            <RNText>Content</RNText>
          </Card>
        )
        expect(getByLabelText('Important card')).toBeTruthy()
      })
    })
  })

  describe('CardHeader', () => {
    describe('Basic Rendering', () => {
      it('should render children', () => {
        const { getByText } = render(
          <CardHeader>
            <RNText>Custom header content</RNText>
          </CardHeader>
        )
        expect(getByText('Custom header content')).toBeTruthy()
      })

      it('should render title', () => {
        const { getByText } = render(<CardHeader title="Card Title" />)
        expect(getByText('Card Title')).toBeTruthy()
      })

      it('should render title and subtitle', () => {
        const { getByText } = render(<CardHeader title="Title" subtitle="Subtitle" />)
        expect(getByText('Title')).toBeTruthy()
        expect(getByText('Subtitle')).toBeTruthy()
      })
    })

    describe('Action', () => {
      it('should render action element', () => {
        const { getByText } = render(
          <CardHeader title="Title" action={<RNText>Action</RNText>} />
        )
        expect(getByText('Action')).toBeTruthy()
      })
    })
  })

  describe('CardContent', () => {
    describe('Basic Rendering', () => {
      it('should render children', () => {
        const { getByText } = render(
          <CardContent>
            <RNText>Content text</RNText>
          </CardContent>
        )
        expect(getByText('Content text')).toBeTruthy()
      })
    })

    describe('Padding', () => {
      it('should accept padding prop', () => {
        const sizes = ['none', 'sm', 'md', 'lg', 'xl'] as const
        sizes.forEach((size) => {
          const { container } = render(
            <CardContent padding={size}>
              <RNText>Content</RNText>
            </CardContent>
          )
          expect(container).toBeTruthy()
        })
      })
    })
  })

  describe('CardFooter', () => {
    describe('Basic Rendering', () => {
      it('should render children', () => {
        const { getByText } = render(
          <CardFooter>
            <RNText>Footer content</RNText>
          </CardFooter>
        )
        expect(getByText('Footer content')).toBeTruthy()
      })
    })

    describe('Alignment', () => {
      it('should accept left alignment', () => {
        const { container } = render(
          <CardFooter align="left">
            <RNText>Left</RNText>
          </CardFooter>
        )
        expect(container).toBeTruthy()
      })

      it('should accept center alignment', () => {
        const { container } = render(
          <CardFooter align="center">
            <RNText>Center</RNText>
          </CardFooter>
        )
        expect(container).toBeTruthy()
      })

      it('should accept right alignment (default)', () => {
        const { container } = render(
          <CardFooter align="right">
            <RNText>Right</RNText>
          </CardFooter>
        )
        expect(container).toBeTruthy()
      })

      it('should accept space-between alignment', () => {
        const { container } = render(
          <CardFooter align="space-between">
            <RNText>Left</RNText>
            <RNText>Right</RNText>
          </CardFooter>
        )
        expect(container).toBeTruthy()
      })
    })
  })

  describe('CardMedia', () => {
    describe('Basic Rendering', () => {
      it('should render with source', () => {
        const { container } = render(
          <CardMedia source={{ uri: 'https://example.com/image.jpg' }} />
        )
        expect(container).toBeTruthy()
      })

      it('should accept height prop', () => {
        const { container } = render(
          <CardMedia source={{ uri: 'https://example.com/image.jpg' }} height={300} />
        )
        expect(container).toBeTruthy()
      })

      it('should accept alt prop', () => {
        const { getByLabelText } = render(
          <CardMedia source={{ uri: 'https://example.com/image.jpg' }} alt="Sample image" />
        )
        expect(getByLabelText('Sample image')).toBeTruthy()
      })
    })
  })

  describe('Composition', () => {
    it('should compose Card with Header, Content, and Footer', () => {
      const { getByText } = render(
        <Card>
          <CardHeader title="Card Title" subtitle="Subtitle" />
          <CardContent>
            <RNText>Main content</RNText>
          </CardContent>
          <CardFooter>
            <RNText>Footer</RNText>
          </CardFooter>
        </Card>
      )
      expect(getByText('Card Title')).toBeTruthy()
      expect(getByText('Subtitle')).toBeTruthy()
      expect(getByText('Main content')).toBeTruthy()
      expect(getByText('Footer')).toBeTruthy()
    })

    it('should compose Card with Media and Content', () => {
      const { getByText, getByLabelText } = render(
        <Card>
          <CardMedia source={{ uri: 'https://example.com/image.jpg' }} alt="Card image" />
          <CardContent>
            <RNText>Content below image</RNText>
          </CardContent>
        </Card>
      )
      expect(getByLabelText('Card image')).toBeTruthy()
      expect(getByText('Content below image')).toBeTruthy()
    })

    it('should compose pressable Card with all sub-components', () => {
      const onPress = vi.fn()
      const { getByText } = render(
        <Card pressable onPress={onPress}>
          <CardHeader title="Pressable Card" />
          <CardContent>
            <RNText>Click me</RNText>
          </CardContent>
          <CardFooter>
            <RNText>Action</RNText>
          </CardFooter>
        </Card>
      )
      expect(getByText('Pressable Card')).toBeTruthy()
      fireEvent.press(getByText('Click me'))
      expect(onPress).toHaveBeenCalledTimes(1)
    })
  })
})
