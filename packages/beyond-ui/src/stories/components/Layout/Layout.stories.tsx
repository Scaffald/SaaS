/**
 * Layout Components Stories
 * Demonstrates Box, Stack, Row, Spacer, and Separator components
 */

import type { Meta, StoryObj } from '@storybook/react'
import { View, Text, StyleSheet } from 'react-native'
import { Box, Stack, Row, Spacer, Separator } from '../../../components/Layout'
import { Button } from '../../../components/Button'
import { colors } from '../../../tokens/colors'

const meta: Meta = {
  title: 'Components/Layout',
  parameters: {
    layout: 'padded',
    docs: {
      description: {
        component:
          'Layout primitives for building flexible UI layouts. Includes Box, Stack (YStack replacement), Row (XStack replacement), Spacer, and Separator components.',
      },
    },
  },
}

export default meta

// Helper component for visualizing layout
const LayoutBlock = ({
  children,
  color = colors.primary[100],
}: {
  children: React.ReactNode
  color?: string
}) => (
  <View
    style={{
      backgroundColor: color,
      padding: 12,
      borderRadius: 4,
      minWidth: 60,
      alignItems: 'center',
    }}
  >
    <Text style={{ color: colors.primary[700], fontWeight: '500' }}>{children}</Text>
  </View>
)

// ============================================================================
// Box Stories
// ============================================================================

export const BoxBasic: StoryObj = {
  name: 'Box - Basic',
  render: () => (
    <Box padding={16} backgroundColor={colors.gray[100]} borderRadius={8}>
      <Text>Box with padding and background</Text>
    </Box>
  ),
}

export const BoxFlexLayout: StoryObj = {
  name: 'Box - Flex Layout',
  render: () => (
    <Box
      direction="row"
      gap={12}
      padding={16}
      backgroundColor={colors.gray[100]}
      borderRadius={8}
      align="center"
      justify="space-between"
    >
      <LayoutBlock>Left</LayoutBlock>
      <LayoutBlock>Center</LayoutBlock>
      <LayoutBlock>Right</LayoutBlock>
    </Box>
  ),
}

export const BoxNested: StoryObj = {
  name: 'Box - Nested',
  render: () => (
    <Box padding={16} gap={16} backgroundColor={colors.gray[50]} borderRadius={8}>
      <Box direction="row" gap={12}>
        <LayoutBlock>1</LayoutBlock>
        <LayoutBlock>2</LayoutBlock>
      </Box>
      <Box direction="row" gap={12}>
        <LayoutBlock>3</LayoutBlock>
        <LayoutBlock>4</LayoutBlock>
        <LayoutBlock>5</LayoutBlock>
      </Box>
    </Box>
  ),
}

// ============================================================================
// Stack Stories (YStack Replacement)
// ============================================================================

export const StackBasic: StoryObj = {
  name: 'Stack - Basic (YStack)',
  render: () => (
    <Stack gap={12}>
      <LayoutBlock>First</LayoutBlock>
      <LayoutBlock>Second</LayoutBlock>
      <LayoutBlock>Third</LayoutBlock>
    </Stack>
  ),
}

export const StackWithAlignment: StoryObj = {
  name: 'Stack - With Alignment',
  render: () => (
    <View style={{ flexDirection: 'row', gap: 24 }}>
      <View>
        <Text style={styles.label}>align="flex-start"</Text>
        <Stack gap={8} align="flex-start" padding={16} backgroundColor={colors.gray[100]}>
          <LayoutBlock>Short</LayoutBlock>
          <LayoutBlock>Medium Length</LayoutBlock>
          <LayoutBlock>Long Content Here</LayoutBlock>
        </Stack>
      </View>

      <View>
        <Text style={styles.label}>align="center"</Text>
        <Stack gap={8} align="center" padding={16} backgroundColor={colors.gray[100]}>
          <LayoutBlock>Short</LayoutBlock>
          <LayoutBlock>Medium Length</LayoutBlock>
          <LayoutBlock>Long Content Here</LayoutBlock>
        </Stack>
      </View>

      <View>
        <Text style={styles.label}>align="flex-end"</Text>
        <Stack gap={8} align="flex-end" padding={16} backgroundColor={colors.gray[100]}>
          <LayoutBlock>Short</LayoutBlock>
          <LayoutBlock>Medium Length</LayoutBlock>
          <LayoutBlock>Long Content Here</LayoutBlock>
        </Stack>
      </View>
    </View>
  ),
}

export const StackMigrationExample: StoryObj = {
  name: 'Stack - Migration Example',
  render: () => (
    <View style={{ gap: 24 }}>
      <View>
        <Text style={styles.label}>Token-based (legacy):</Text>
        <Text style={styles.code}>{'<Stack gap={16} padding={12}>...</Stack>'}</Text>
      </View>
      <View>
        <Text style={styles.label}>Beyond UI Stack:</Text>
        <Stack gap={16} padding={12} backgroundColor={colors.gray[100]} borderRadius={8}>
          <LayoutBlock>Item 1</LayoutBlock>
          <LayoutBlock>Item 2</LayoutBlock>
          <LayoutBlock>Item 3</LayoutBlock>
        </Stack>
        <Text style={styles.code}>{'<Stack gap={16} padding={12}>...</Stack>'}</Text>
      </View>
    </View>
  ),
}

// ============================================================================
// Row Stories (XStack Replacement)
// ============================================================================

export const RowBasic: StoryObj = {
  name: 'Row - Basic (XStack)',
  render: () => (
    <Row gap={12}>
      <LayoutBlock>First</LayoutBlock>
      <LayoutBlock>Second</LayoutBlock>
      <LayoutBlock>Third</LayoutBlock>
    </Row>
  ),
}

export const RowWithJustify: StoryObj = {
  name: 'Row - Justify Content',
  render: () => (
    <Stack gap={16}>
      <View>
        <Text style={styles.label}>justify="flex-start"</Text>
        <Row gap={8} justify="flex-start" padding={16} backgroundColor={colors.gray[100]}>
          <LayoutBlock>A</LayoutBlock>
          <LayoutBlock>B</LayoutBlock>
          <LayoutBlock>C</LayoutBlock>
        </Row>
      </View>

      <View>
        <Text style={styles.label}>justify="center"</Text>
        <Row gap={8} justify="center" padding={16} backgroundColor={colors.gray[100]}>
          <LayoutBlock>A</LayoutBlock>
          <LayoutBlock>B</LayoutBlock>
          <LayoutBlock>C</LayoutBlock>
        </Row>
      </View>

      <View>
        <Text style={styles.label}>justify="space-between"</Text>
        <Row gap={8} justify="space-between" padding={16} backgroundColor={colors.gray[100]}>
          <LayoutBlock>A</LayoutBlock>
          <LayoutBlock>B</LayoutBlock>
          <LayoutBlock>C</LayoutBlock>
        </Row>
      </View>

      <View>
        <Text style={styles.label}>justify="space-around"</Text>
        <Row gap={8} justify="space-around" padding={16} backgroundColor={colors.gray[100]}>
          <LayoutBlock>A</LayoutBlock>
          <LayoutBlock>B</LayoutBlock>
          <LayoutBlock>C</LayoutBlock>
        </Row>
      </View>
    </Stack>
  ),
}

export const RowWrapping: StoryObj = {
  name: 'Row - Wrapping',
  render: () => (
    <View style={{ width: 300 }}>
      <Text style={styles.label}>Row with wrap (container width: 300px)</Text>
      <Row gap={8} rowGap={8} wrap padding={16} backgroundColor={colors.gray[100]}>
        <LayoutBlock>Tag 1</LayoutBlock>
        <LayoutBlock>Tag 2</LayoutBlock>
        <LayoutBlock>Tag 3</LayoutBlock>
        <LayoutBlock>Tag 4</LayoutBlock>
        <LayoutBlock>Tag 5</LayoutBlock>
        <LayoutBlock>Tag 6</LayoutBlock>
      </Row>
    </View>
  ),
}

export const RowMigrationExample: StoryObj = {
  name: 'Row - Migration Example',
  render: () => (
    <View style={{ gap: 24 }}>
      <View>
        <Text style={styles.label}>Row (legacy pattern):</Text>
        <Text style={styles.code}>
          {'<Row justify="space-between" align="center">...</Row>'}
        </Text>
      </View>
      <View>
        <Text style={styles.label}>Beyond UI Row:</Text>
        <Row
          justify="space-between"
          align="center"
          padding={16}
          backgroundColor={colors.gray[100]}
          borderRadius={8}
        >
          <LayoutBlock>Left</LayoutBlock>
          <LayoutBlock>Right</LayoutBlock>
        </Row>
        <Text style={styles.code}>{'<Row justify="space-between" align="center">...</Row>'}</Text>
      </View>
    </View>
  ),
}

// ============================================================================
// Spacer Stories
// ============================================================================

export const SpacerFlexible: StoryObj = {
  name: 'Spacer - Flexible',
  render: () => (
    <Row padding={16} backgroundColor={colors.gray[100]} borderRadius={8}>
      <Button color="primary">Left</Button>
      <Spacer />
      <Button color="gray">Right</Button>
    </Row>
  ),
}

export const SpacerFixedSize: StoryObj = {
  name: 'Spacer - Fixed Size',
  render: () => (
    <Row padding={16} backgroundColor={colors.gray[100]} borderRadius={8}>
      <LayoutBlock>A</LayoutBlock>
      <Spacer size={32} />
      <LayoutBlock>B</LayoutBlock>
      <Spacer size={64} />
      <LayoutBlock>C</LayoutBlock>
    </Row>
  ),
}

export const SpacerWeighted: StoryObj = {
  name: 'Spacer - Weighted',
  render: () => (
    <Row padding={16} backgroundColor={colors.gray[100]} borderRadius={8}>
      <LayoutBlock>Start</LayoutBlock>
      <Spacer flex={1} />
      <LayoutBlock>1/3</LayoutBlock>
      <Spacer flex={2} />
      <LayoutBlock>End</LayoutBlock>
    </Row>
  ),
}

// ============================================================================
// Separator Stories
// ============================================================================

export const SeparatorHorizontal: StoryObj = {
  name: 'Separator - Horizontal',
  render: () => (
    <Stack gap={0} padding={16} backgroundColor={colors.gray[100]} borderRadius={8}>
      <Text style={{ padding: 12 }}>Section 1</Text>
      <Separator />
      <Text style={{ padding: 12 }}>Section 2</Text>
      <Separator />
      <Text style={{ padding: 12 }}>Section 3</Text>
    </Stack>
  ),
}

export const SeparatorVertical: StoryObj = {
  name: 'Separator - Vertical',
  render: () => (
    <Row align="center" height={60} padding={16} backgroundColor={colors.gray[100]} borderRadius={8}>
      <Text>Left</Text>
      <Separator orientation="vertical" marginHorizontal={16} length={40} />
      <Text>Center</Text>
      <Separator orientation="vertical" marginHorizontal={16} length={40} />
      <Text>Right</Text>
    </Row>
  ),
}

export const SeparatorThickness: StoryObj = {
  name: 'Separator - Thickness',
  render: () => (
    <Stack gap={16} padding={16}>
      <View>
        <Text style={styles.label}>thickness="thin" (1px)</Text>
        <Separator thickness="thin" />
      </View>
      <View>
        <Text style={styles.label}>thickness="medium" (2px)</Text>
        <Separator thickness="medium" />
      </View>
      <View>
        <Text style={styles.label}>thickness="thick" (3px)</Text>
        <Separator thickness="thick" />
      </View>
      <View>
        <Text style={styles.label}>thickness={5} (custom)</Text>
        <Separator thickness={5} />
      </View>
    </Stack>
  ),
}

// ============================================================================
// Combined Layout Examples
// ============================================================================

export const CombinedCardLayout: StoryObj = {
  name: 'Combined - Card Layout',
  render: () => (
    <Box
      padding={16}
      backgroundColor={colors.white}
      borderRadius={12}
      style={{
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
        elevation: 3,
        width: 320,
      }}
    >
      <Stack gap={12}>
        <Row justify="space-between" align="center">
          <Text style={{ fontSize: 18, fontWeight: '600' }}>Card Title</Text>
          <Button color="gray" variant="text" size="sm">
            Edit
          </Button>
        </Row>

        <Separator />

        <Text style={{ color: colors.gray[600] }}>
          This is an example card layout using Stack, Row, Spacer, and Separator components.
        </Text>

        <Separator />

        <Row justify="flex-end" gap={8}>
          <Button color="gray" variant="outline">
            Cancel
          </Button>
          <Button color="primary">Save</Button>
        </Row>
      </Stack>
    </Box>
  ),
}

export const CombinedFormLayout: StoryObj = {
  name: 'Combined - Form Layout',
  render: () => (
    <Stack gap={16} padding={16} backgroundColor={colors.gray[50]} borderRadius={8} width={400}>
      <Text style={{ fontSize: 20, fontWeight: '600' }}>Contact Form</Text>

      <Stack gap={8}>
        <Text style={{ fontWeight: '500' }}>Name</Text>
        <Box
          padding={12}
          backgroundColor={colors.white}
          borderRadius={6}
          style={{ borderWidth: 1, borderColor: colors.gray[200] }}
        >
          <Text style={{ color: colors.gray[400] }}>Enter your name</Text>
        </Box>
      </Stack>

      <Stack gap={8}>
        <Text style={{ fontWeight: '500' }}>Email</Text>
        <Box
          padding={12}
          backgroundColor={colors.white}
          borderRadius={6}
          style={{ borderWidth: 1, borderColor: colors.gray[200] }}
        >
          <Text style={{ color: colors.gray[400] }}>Enter your email</Text>
        </Box>
      </Stack>

      <Separator marginVertical={8} />

      <Row justify="space-between">
        <Button color="gray" variant="text">
          Reset
        </Button>
        <Row gap={8}>
          <Button color="gray" variant="outline">
            Cancel
          </Button>
          <Button color="primary">Submit</Button>
        </Row>
      </Row>
    </Stack>
  ),
}

const styles = StyleSheet.create({
  label: {
    fontSize: 12,
    color: colors.gray[500],
    marginBottom: 8,
    fontWeight: '500',
  },
  code: {
    fontSize: 12,
    fontFamily: 'monospace',
    color: colors.gray[600],
    backgroundColor: colors.gray[100],
    padding: 8,
    borderRadius: 4,
    marginTop: 8,
  },
})
