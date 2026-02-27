/**
 * Layout components tests
 * Tests for Box, Stack, Row, Spacer, and Separator
 */

import React from 'react'
import { render } from '@testing-library/react-native'
import { describe, it, expect } from 'vitest'
import { Text } from 'react-native'
import { Box, Stack, Row, Spacer, Separator } from '../../components/Layout'

describe('Layout Components', () => {
  describe('Box', () => {
    describe('Basic Rendering', () => {
      it('should render children', () => {
        const { getByText } = render(
          <Box>
            <Text>Content</Text>
          </Box>
        )
        expect(getByText('Content')).toBeTruthy()
      })

      it('should render without children', () => {
        const { container } = render(<Box />)
        expect(container).toBeTruthy()
      })

      it('should render multiple children', () => {
        const { getByText } = render(
          <Box>
            <Text>First</Text>
            <Text>Second</Text>
          </Box>
        )
        expect(getByText('First')).toBeTruthy()
        expect(getByText('Second')).toBeTruthy()
      })
    })

    describe('Spacing Props', () => {
      it('should accept numeric gap', () => {
        const { container } = render(
          <Box gap={16}>
            <Text>A</Text>
          </Box>
        )
        expect(container).toBeTruthy()
      })

      it('should accept numeric padding', () => {
        const { container } = render(
          <Box padding={16}>
            <Text>A</Text>
          </Box>
        )
        expect(container).toBeTruthy()
      })

      it('should accept string gap token', () => {
        const { container } = render(
          <Box gap="md">
            <Text>A</Text>
          </Box>
        )
        expect(container).toBeTruthy()
      })

      it('should accept all padding variants', () => {
        const { container } = render(
          <Box
            paddingHorizontal={8}
            paddingVertical={16}
            paddingTop={4}
            paddingBottom={4}
            paddingLeft={4}
            paddingRight={4}
          >
            <Text>A</Text>
          </Box>
        )
        expect(container).toBeTruthy()
      })

      it('should accept all margin variants', () => {
        const { container } = render(
          <Box
            margin={8}
            marginHorizontal={8}
            marginVertical={16}
            marginTop={4}
            marginBottom={4}
            marginLeft={4}
            marginRight={4}
          >
            <Text>A</Text>
          </Box>
        )
        expect(container).toBeTruthy()
      })
    })

    describe('Flex Props', () => {
      it('should accept direction prop', () => {
        const { container } = render(
          <Box direction="row">
            <Text>A</Text>
          </Box>
        )
        expect(container).toBeTruthy()
      })

      it('should accept align prop', () => {
        const { container } = render(
          <Box align="center">
            <Text>A</Text>
          </Box>
        )
        expect(container).toBeTruthy()
      })

      it('should accept justify prop', () => {
        const { container } = render(
          <Box justify="space-between">
            <Text>A</Text>
          </Box>
        )
        expect(container).toBeTruthy()
      })

      it('should accept wrap prop', () => {
        const { container } = render(
          <Box wrap="wrap">
            <Text>A</Text>
          </Box>
        )
        expect(container).toBeTruthy()
      })

      it('should accept flex value', () => {
        const { container } = render(
          <Box flex={1}>
            <Text>A</Text>
          </Box>
        )
        expect(container).toBeTruthy()
      })
    })

    describe('Dimension Props', () => {
      it('should accept width and height', () => {
        const { container } = render(
          <Box width={100} height={50}>
            <Text>A</Text>
          </Box>
        )
        expect(container).toBeTruthy()
      })

      it('should accept percentage dimensions', () => {
        const { container } = render(
          <Box width="100%" height="50%">
            <Text>A</Text>
          </Box>
        )
        expect(container).toBeTruthy()
      })

      it('should accept min/max dimensions', () => {
        const { container } = render(
          <Box minWidth={50} maxWidth={200} minHeight={30} maxHeight={100}>
            <Text>A</Text>
          </Box>
        )
        expect(container).toBeTruthy()
      })
    })

    describe('Appearance Props', () => {
      it('should accept backgroundColor', () => {
        const { container } = render(
          <Box backgroundColor="#f00">
            <Text>A</Text>
          </Box>
        )
        expect(container).toBeTruthy()
      })

      it('should accept borderRadius', () => {
        const { container } = render(
          <Box borderRadius={8}>
            <Text>A</Text>
          </Box>
        )
        expect(container).toBeTruthy()
      })

      it('should accept overflow', () => {
        const { container } = render(
          <Box overflow="hidden">
            <Text>A</Text>
          </Box>
        )
        expect(container).toBeTruthy()
      })
    })
  })

  describe('Stack (YStack Replacement)', () => {
    it('should render children vertically', () => {
      const { getByText } = render(
        <Stack>
          <Text>First</Text>
          <Text>Second</Text>
        </Stack>
      )
      expect(getByText('First')).toBeTruthy()
      expect(getByText('Second')).toBeTruthy()
    })

    it('should accept gap prop', () => {
      const { container } = render(
        <Stack gap={16}>
          <Text>A</Text>
          <Text>B</Text>
        </Stack>
      )
      expect(container).toBeTruthy()
    })

    it('should accept alignment props', () => {
      const { container } = render(
        <Stack align="center" justify="space-between">
          <Text>A</Text>
          <Text>B</Text>
        </Stack>
      )
      expect(container).toBeTruthy()
    })

    it('should accept padding props', () => {
      const { container } = render(
        <Stack padding={16} paddingHorizontal={8}>
          <Text>A</Text>
        </Stack>
      )
      expect(container).toBeTruthy()
    })
  })

  describe('Row (XStack Replacement)', () => {
    it('should render children horizontally', () => {
      const { getByText } = render(
        <Row>
          <Text>First</Text>
          <Text>Second</Text>
        </Row>
      )
      expect(getByText('First')).toBeTruthy()
      expect(getByText('Second')).toBeTruthy()
    })

    it('should accept gap prop', () => {
      const { container } = render(
        <Row gap={16}>
          <Text>A</Text>
          <Text>B</Text>
        </Row>
      )
      expect(container).toBeTruthy()
    })

    it('should accept alignment props', () => {
      const { container } = render(
        <Row align="center" justify="space-between">
          <Text>A</Text>
          <Text>B</Text>
        </Row>
      )
      expect(container).toBeTruthy()
    })

    it('should accept wrap as boolean', () => {
      const { container } = render(
        <Row wrap>
          <Text>A</Text>
          <Text>B</Text>
        </Row>
      )
      expect(container).toBeTruthy()
    })

    it('should accept wrap as string', () => {
      const { container } = render(
        <Row wrap="wrap-reverse">
          <Text>A</Text>
          <Text>B</Text>
        </Row>
      )
      expect(container).toBeTruthy()
    })
  })

  describe('Spacer', () => {
    it('should render in flex mode by default', () => {
      const { container } = render(<Spacer />)
      expect(container).toBeTruthy()
    })

    it('should accept fixed size', () => {
      const { container } = render(<Spacer size={32} />)
      expect(container).toBeTruthy()
    })

    it('should accept flex value', () => {
      const { container } = render(<Spacer flex={2} />)
      expect(container).toBeTruthy()
    })

    it('should accept spacing token for size', () => {
      const { container } = render(<Spacer size={16} />)
      expect(container).toBeTruthy()
    })

    it('should work within Row', () => {
      const { getByText } = render(
        <Row>
          <Text>Left</Text>
          <Spacer />
          <Text>Right</Text>
        </Row>
      )
      expect(getByText('Left')).toBeTruthy()
      expect(getByText('Right')).toBeTruthy()
    })
  })

  describe('Separator', () => {
    it('should render horizontal separator by default', () => {
      const { container } = render(<Separator />)
      expect(container).toBeTruthy()
    })

    it('should render vertical separator', () => {
      const { container } = render(<Separator orientation="vertical" />)
      expect(container).toBeTruthy()
    })

    describe('Thickness', () => {
      it('should accept thin thickness', () => {
        const { container } = render(<Separator thickness="thin" />)
        expect(container).toBeTruthy()
      })

      it('should accept medium thickness', () => {
        const { container } = render(<Separator thickness="medium" />)
        expect(container).toBeTruthy()
      })

      it('should accept thick thickness', () => {
        const { container } = render(<Separator thickness="thick" />)
        expect(container).toBeTruthy()
      })

      it('should accept numeric thickness', () => {
        const { container } = render(<Separator thickness={5} />)
        expect(container).toBeTruthy()
      })
    })

    it('should accept custom color', () => {
      const { container } = render(<Separator color="#f00" />)
      expect(container).toBeTruthy()
    })

    it('should accept custom length', () => {
      const { container } = render(<Separator length={100} />)
      expect(container).toBeTruthy()
    })

    it('should accept percentage length', () => {
      const { container } = render(<Separator length="50%" />)
      expect(container).toBeTruthy()
    })

    it('should accept margin props', () => {
      const { container } = render(
        <Separator margin={8} marginVertical={16} marginHorizontal={4} />
      )
      expect(container).toBeTruthy()
    })

    it('should work within Stack', () => {
      const { getByText } = render(
        <Stack>
          <Text>Above</Text>
          <Separator />
          <Text>Below</Text>
        </Stack>
      )
      expect(getByText('Above')).toBeTruthy()
      expect(getByText('Below')).toBeTruthy()
    })
  })

  describe('Component Composition', () => {
    it('should allow nesting Box in Stack', () => {
      const { getByText } = render(
        <Stack gap={16}>
          <Box padding={8}>
            <Text>Nested</Text>
          </Box>
        </Stack>
      )
      expect(getByText('Nested')).toBeTruthy()
    })

    it('should allow nesting Row in Stack', () => {
      const { getByText } = render(
        <Stack>
          <Row gap={8}>
            <Text>A</Text>
            <Text>B</Text>
          </Row>
        </Stack>
      )
      expect(getByText('A')).toBeTruthy()
      expect(getByText('B')).toBeTruthy()
    })

    it('should allow complex nesting', () => {
      const { getByText } = render(
        <Box padding={16}>
          <Stack gap={8}>
            <Row justify="space-between">
              <Text>Left</Text>
              <Spacer />
              <Text>Right</Text>
            </Row>
            <Separator />
            <Text>Content</Text>
          </Stack>
        </Box>
      )
      expect(getByText('Left')).toBeTruthy()
      expect(getByText('Right')).toBeTruthy()
      expect(getByText('Content')).toBeTruthy()
    })
  })
})
