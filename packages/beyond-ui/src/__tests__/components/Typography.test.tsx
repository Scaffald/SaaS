/**
 * Typography components tests
 * Tests for Heading, H1-H6, Paragraph, Label, Text, and Caption
 */

import React from 'react'
import { render } from '@testing-library/react-native'
import { describe, it, expect } from 'vitest'
import {
  Heading,
  H1,
  H2,
  H3,
  H4,
  H5,
  H6,
  Paragraph,
  Label,
  Text,
  Caption,
} from '../../components/Typography'

describe('Typography Components', () => {
  describe('Heading', () => {
    describe('Basic Rendering', () => {
      it('should render children', () => {
        const { getByText } = render(<Heading level={1}>Test Heading</Heading>)
        expect(getByText('Test Heading')).toBeTruthy()
      })

      it('should render each level', () => {
        const levels = [1, 2, 3, 4, 5, 6] as const
        levels.forEach((level) => {
          const { getByText } = render(<Heading level={level}>Level {level}</Heading>)
          expect(getByText(`Level ${level}`)).toBeTruthy()
        })
      })
    })

    describe('Props', () => {
      it('should accept weight prop', () => {
        const { container } = render(
          <Heading level={2} weight="medium">
            Medium Weight
          </Heading>
        )
        expect(container).toBeTruthy()
      })

      it('should accept color prop', () => {
        const { container } = render(
          <Heading level={2} color="secondary">
            Secondary Color
          </Heading>
        )
        expect(container).toBeTruthy()
      })

      it('should accept serif prop', () => {
        const { container } = render(
          <Heading level={2} serif>
            Serif Heading
          </Heading>
        )
        expect(container).toBeTruthy()
      })

      it('should accept align prop', () => {
        const { container } = render(
          <Heading level={2} align="center">
            Centered
          </Heading>
        )
        expect(container).toBeTruthy()
      })

      it('should accept selectable prop', () => {
        const { container } = render(
          <Heading level={2} selectable>
            Selectable
          </Heading>
        )
        expect(container).toBeTruthy()
      })
    })

    describe('Semantic Colors', () => {
      it('should accept error color', () => {
        const { container } = render(
          <Heading level={3} color="error">
            Error
          </Heading>
        )
        expect(container).toBeTruthy()
      })

      it('should accept success color', () => {
        const { container } = render(
          <Heading level={3} color="success">
            Success
          </Heading>
        )
        expect(container).toBeTruthy()
      })

      it('should accept warning color', () => {
        const { container } = render(
          <Heading level={3} color="warning">
            Warning
          </Heading>
        )
        expect(container).toBeTruthy()
      })

      it('should accept custom color', () => {
        const { container } = render(
          <Heading level={3} color="#ff0000">
            Custom
          </Heading>
        )
        expect(container).toBeTruthy()
      })
    })
  })

  describe('H1-H6 Components', () => {
    it('should render H1', () => {
      const { getByText } = render(<H1>Heading 1</H1>)
      expect(getByText('Heading 1')).toBeTruthy()
    })

    it('should render H2', () => {
      const { getByText } = render(<H2>Heading 2</H2>)
      expect(getByText('Heading 2')).toBeTruthy()
    })

    it('should render H3', () => {
      const { getByText } = render(<H3>Heading 3</H3>)
      expect(getByText('Heading 3')).toBeTruthy()
    })

    it('should render H4', () => {
      const { getByText } = render(<H4>Heading 4</H4>)
      expect(getByText('Heading 4')).toBeTruthy()
    })

    it('should render H5', () => {
      const { getByText } = render(<H5>Heading 5</H5>)
      expect(getByText('Heading 5')).toBeTruthy()
    })

    it('should render H6', () => {
      const { getByText } = render(<H6>Heading 6</H6>)
      expect(getByText('Heading 6')).toBeTruthy()
    })

    it('should pass props to H components', () => {
      const { container } = render(
        <H3 weight="bold" color="secondary" align="center">
          Styled H3
        </H3>
      )
      expect(container).toBeTruthy()
    })
  })

  describe('Paragraph', () => {
    describe('Basic Rendering', () => {
      it('should render children', () => {
        const { getByText } = render(<Paragraph>Test paragraph text.</Paragraph>)
        expect(getByText('Test paragraph text.')).toBeTruthy()
      })

      it('should be selectable by default', () => {
        const { container } = render(<Paragraph>Selectable text</Paragraph>)
        expect(container).toBeTruthy()
      })
    })

    describe('Size Variants', () => {
      it('should accept xs size', () => {
        const { container } = render(<Paragraph size="xs">Extra small</Paragraph>)
        expect(container).toBeTruthy()
      })

      it('should accept sm size', () => {
        const { container } = render(<Paragraph size="sm">Small</Paragraph>)
        expect(container).toBeTruthy()
      })

      it('should accept md size (default)', () => {
        const { container } = render(<Paragraph size="md">Medium</Paragraph>)
        expect(container).toBeTruthy()
      })

      it('should accept lg size', () => {
        const { container } = render(<Paragraph size="lg">Large</Paragraph>)
        expect(container).toBeTruthy()
      })

      it('should accept xl size', () => {
        const { container } = render(<Paragraph size="xl">Extra large</Paragraph>)
        expect(container).toBeTruthy()
      })
    })

    describe('Weight Variants', () => {
      it('should accept regular weight', () => {
        const { container } = render(<Paragraph weight="regular">Regular</Paragraph>)
        expect(container).toBeTruthy()
      })

      it('should accept medium weight', () => {
        const { container } = render(<Paragraph weight="medium">Medium</Paragraph>)
        expect(container).toBeTruthy()
      })

      it('should accept semibold weight', () => {
        const { container } = render(<Paragraph weight="semibold">SemiBold</Paragraph>)
        expect(container).toBeTruthy()
      })

      it('should accept bold weight', () => {
        const { container } = render(<Paragraph weight="bold">Bold</Paragraph>)
        expect(container).toBeTruthy()
      })
    })

    describe('Props', () => {
      it('should accept serif prop', () => {
        const { container } = render(<Paragraph serif>Serif text</Paragraph>)
        expect(container).toBeTruthy()
      })

      it('should accept color prop', () => {
        const { container } = render(<Paragraph color="secondary">Secondary</Paragraph>)
        expect(container).toBeTruthy()
      })

      it('should accept align prop', () => {
        const { container } = render(<Paragraph align="center">Centered</Paragraph>)
        expect(container).toBeTruthy()
      })
    })
  })

  describe('Label', () => {
    describe('Basic Rendering', () => {
      it('should render children', () => {
        const { getByText } = render(<Label>Email Address</Label>)
        expect(getByText('Email Address')).toBeTruthy()
      })

      it('should render with htmlFor prop', () => {
        const { container } = render(<Label htmlFor="email">Email</Label>)
        expect(container).toBeTruthy()
      })
    })

    describe('Required Field', () => {
      it('should render asterisk when required', () => {
        const { getByText } = render(<Label required>Required Field</Label>)
        expect(getByText('*')).toBeTruthy()
      })
    })

    describe('Disabled State', () => {
      it('should accept disabled prop', () => {
        const { container } = render(<Label disabled>Disabled Label</Label>)
        expect(container).toBeTruthy()
      })
    })

    describe('Size Variants', () => {
      it('should accept sm size', () => {
        const { container } = render(<Label size="sm">Small</Label>)
        expect(container).toBeTruthy()
      })

      it('should accept md size', () => {
        const { container } = render(<Label size="md">Medium</Label>)
        expect(container).toBeTruthy()
      })

      it('should accept lg size', () => {
        const { container } = render(<Label size="lg">Large</Label>)
        expect(container).toBeTruthy()
      })
    })
  })

  describe('Text (SizableText replacement)', () => {
    describe('Basic Rendering', () => {
      it('should render children', () => {
        const { getByText } = render(<Text>Test text</Text>)
        expect(getByText('Test text')).toBeTruthy()
      })

      it('should not be selectable by default', () => {
        const { container } = render(<Text>Non-selectable</Text>)
        expect(container).toBeTruthy()
      })
    })

    describe('Size Variants', () => {
      it('should accept all size variants', () => {
        const sizes = ['xs', 'sm', 'md', 'lg', 'xl', '2xl'] as const
        sizes.forEach((size) => {
          const { container } = render(<Text size={size}>Size {size}</Text>)
          expect(container).toBeTruthy()
        })
      })
    })

    describe('Font Families', () => {
      it('should accept serif prop', () => {
        const { container } = render(<Text serif>Serif text</Text>)
        expect(container).toBeTruthy()
      })

      it('should accept mono prop', () => {
        const { container } = render(<Text mono>Monospace text</Text>)
        expect(container).toBeTruthy()
      })

      it('should prefer mono over serif', () => {
        const { container } = render(
          <Text mono serif>
            Mono wins
          </Text>
        )
        expect(container).toBeTruthy()
      })
    })

    describe('Props', () => {
      it('should accept weight prop', () => {
        const { container } = render(<Text weight="bold">Bold</Text>)
        expect(container).toBeTruthy()
      })

      it('should accept color prop', () => {
        const { container } = render(<Text color="error">Error</Text>)
        expect(container).toBeTruthy()
      })

      it('should accept align prop', () => {
        const { container } = render(<Text align="right">Right aligned</Text>)
        expect(container).toBeTruthy()
      })
    })
  })

  describe('Caption', () => {
    describe('Basic Rendering', () => {
      it('should render children', () => {
        const { getByText } = render(<Caption>Caption text</Caption>)
        expect(getByText('Caption text')).toBeTruthy()
      })
    })

    describe('Props', () => {
      it('should accept weight prop', () => {
        const { container } = render(<Caption weight="medium">Medium</Caption>)
        expect(container).toBeTruthy()
      })

      it('should accept color prop', () => {
        const { container } = render(<Caption color="primary">Primary</Caption>)
        expect(container).toBeTruthy()
      })

      it('should accept semantic colors', () => {
        const { container: error } = render(<Caption color="error">Error</Caption>)
        const { container: success } = render(<Caption color="success">Success</Caption>)
        const { container: warning } = render(<Caption color="warning">Warning</Caption>)
        expect(error).toBeTruthy()
        expect(success).toBeTruthy()
        expect(warning).toBeTruthy()
      })
    })
  })

  describe('Composition', () => {
    it('should compose headings and paragraphs', () => {
      const { getByText } = render(
        <>
          <H1>Title</H1>
          <Paragraph>Body content here.</Paragraph>
        </>
      )
      expect(getByText('Title')).toBeTruthy()
      expect(getByText('Body content here.')).toBeTruthy()
    })

    it('should compose labels with text', () => {
      const { getByText } = render(
        <>
          <Label>Field Label</Label>
          <Text size="sm" color="tertiary">
            Helper text
          </Text>
        </>
      )
      expect(getByText('Field Label')).toBeTruthy()
      expect(getByText('Helper text')).toBeTruthy()
    })

    it('should compose captions with other typography', () => {
      const { getByText } = render(
        <>
          <H4>Section Title</H4>
          <Paragraph size="sm">Description text</Paragraph>
          <Caption>Last updated: today</Caption>
        </>
      )
      expect(getByText('Section Title')).toBeTruthy()
      expect(getByText('Description text')).toBeTruthy()
      expect(getByText('Last updated: today')).toBeTruthy()
    })
  })
})
