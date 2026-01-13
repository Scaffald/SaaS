/**
 * Tooltip component stories
 */

import type { Meta, StoryObj } from '@storybook/react'
import { useState } from 'react'
import { View, Text, StyleSheet } from 'react-native'
import { Tooltip } from '../../../components/Tooltip'
import { Button } from '../../../components/Button'
import { spacing } from '../../../tokens/spacing'

const meta = {
  title: 'Components/Tooltip',
  component: Tooltip,
  parameters: {
    layout: 'centered',
  },
  tags: ['autodocs'],
} satisfies Meta<typeof Tooltip>

export default meta
type Story = StoryObj<typeof meta>

// Basic default tooltip
export const Default: Story = {
  args: {
    content: 'This is a default tooltip',
    arrowPosition: 'down-center',
    children: <Button>Hover me</Button>,
  },
}

// All arrow positions - Default type, Primary color
export const AllArrowPositionsDefault: Story = {
  render: () => (
    <View style={styles.container}>
      <Text style={styles.sectionTitle}>Default Tooltip - All Arrow Positions (Primary)</Text>
      <View style={styles.grid}>
        <Tooltip content="None arrow position" arrowPosition="none">
          <Button>None</Button>
        </Tooltip>
        <Tooltip content="Up Center" arrowPosition="up-center">
          <Button>Up Center</Button>
        </Tooltip>
        <Tooltip content="Up Left" arrowPosition="up-left">
          <Button>Up Left</Button>
        </Tooltip>
        <Tooltip content="Up Right" arrowPosition="up-right">
          <Button>Up Right</Button>
        </Tooltip>
        <Tooltip content="Down Center" arrowPosition="down-center">
          <Button>Down Center</Button>
        </Tooltip>
        <Tooltip content="Down Left" arrowPosition="down-left">
          <Button>Down Left</Button>
        </Tooltip>
        <Tooltip content="Down Right" arrowPosition="down-right">
          <Button>Down Right</Button>
        </Tooltip>
        <Tooltip content="Left" arrowPosition="left">
          <Button>Left</Button>
        </Tooltip>
        <Tooltip content="Right" arrowPosition="right">
          <Button>Right</Button>
        </Tooltip>
      </View>
    </View>
  ),
}

// All arrow positions - Default type, Gray color
export const AllArrowPositionsGray: Story = {
  render: () => (
    <View style={styles.container}>
      <Text style={styles.sectionTitle}>Default Tooltip - All Arrow Positions (Gray)</Text>
      <View style={styles.grid}>
        <Tooltip content="None arrow position" arrowPosition="none" color="gray">
          <Button>None</Button>
        </Tooltip>
        <Tooltip content="Up Center" arrowPosition="up-center" color="gray">
          <Button>Up Center</Button>
        </Tooltip>
        <Tooltip content="Up Left" arrowPosition="up-left" color="gray">
          <Button>Up Left</Button>
        </Tooltip>
        <Tooltip content="Up Right" arrowPosition="up-right" color="gray">
          <Button>Up Right</Button>
        </Tooltip>
        <Tooltip content="Down Center" arrowPosition="down-center" color="gray">
          <Button>Down Center</Button>
        </Tooltip>
        <Tooltip content="Down Left" arrowPosition="down-left" color="gray">
          <Button>Down Left</Button>
        </Tooltip>
        <Tooltip content="Down Right" arrowPosition="down-right" color="gray">
          <Button>Down Right</Button>
        </Tooltip>
        <Tooltip content="Left" arrowPosition="left" color="gray">
          <Button>Left</Button>
        </Tooltip>
        <Tooltip content="Right" arrowPosition="right" color="gray">
          <Button>Right</Button>
        </Tooltip>
      </View>
    </View>
  ),
}

// Rich tooltip - All arrow positions
export const RichTooltipAllPositions: Story = {
  render: () => (
    <View style={styles.container}>
      <Text style={styles.sectionTitle}>Rich Tooltip - All Arrow Positions</Text>
      <View style={styles.grid}>
        <Tooltip
          type="rich"
          title="What is a tooltip?"
          description="A tooltip is a brief, informative message that appears when a user interacts with an element."
          arrowPosition="down-center"
          actions={[
            { label: 'Learn more', onPress: () => console.log('Learn more') },
            { label: 'Dismiss', onPress: () => console.log('Dismiss') },
          ]}
        >
          <Button>Down Center</Button>
        </Tooltip>
        <Tooltip
          type="rich"
          title="Rich Tooltip"
          description="This is a rich tooltip with title, description, and actions."
          arrowPosition="up-center"
          color="gray"
          actions={[{ label: 'Action', onPress: () => console.log('Action') }]}
        >
          <Button>Up Center</Button>
        </Tooltip>
        <Tooltip
          type="rich"
          title="Left Arrow"
          description="Tooltip appears to the left of the trigger."
          arrowPosition="right"
          actions={[{ label: 'OK', onPress: () => console.log('OK') }]}
        >
          <Button>Right</Button>
        </Tooltip>
      </View>
    </View>
  ),
}

// Rich tooltip variants
export const RichTooltipVariants: Story = {
  render: () => (
    <View style={styles.container}>
      <Text style={styles.sectionTitle}>Rich Tooltip - All Variants</Text>
      <View style={styles.column}>
        <Tooltip
          type="rich"
          title="Primary Rich Tooltip"
          description="This is a rich tooltip with primary color scheme."
          arrowPosition="down-center"
          color="primary"
          actions={[
            { label: 'Primary Action', onPress: () => console.log('Primary') },
            { label: 'Secondary', onPress: () => console.log('Secondary') },
          ]}
        >
          <Button>Primary Rich</Button>
        </Tooltip>
        <Tooltip
          type="rich"
          title="Gray Rich Tooltip"
          description="This is a rich tooltip with gray color scheme."
          arrowPosition="down-center"
          color="gray"
          actions={[
            { label: 'Action 1', onPress: () => console.log('Action 1') },
            { label: 'Action 2', onPress: () => console.log('Action 2') },
          ]}
        >
          <Button>Gray Rich</Button>
        </Tooltip>
        <Tooltip
          type="rich"
          title="Without Actions"
          description="Rich tooltip can be displayed without action buttons."
          arrowPosition="down-center"
          showActions={false}
        >
          <Button>No Actions</Button>
        </Tooltip>
        <Tooltip
          type="rich"
          title="Single Action"
          description="Rich tooltip with only one action button."
          arrowPosition="down-center"
          actions={[{ label: 'Single Action', onPress: () => console.log('Single') }]}
        >
          <Button>Single Action</Button>
        </Tooltip>
      </View>
    </View>
  ),
}

// Default vs Rich comparison
export const DefaultVsRich: Story = {
  render: () => (
    <View style={styles.container}>
      <Text style={styles.sectionTitle}>Default vs Rich Tooltip Comparison</Text>
      <View style={styles.row}>
        <Tooltip content="This is a default tooltip with simple text content." arrowPosition="down-center">
          <Button>Default</Button>
        </Tooltip>
        <Tooltip
          type="rich"
          title="Rich Tooltip"
          description="This is a rich tooltip with title, description, and action buttons."
          arrowPosition="down-center"
          actions={[{ label: 'Action', onPress: () => console.log('Action') }]}
        >
          <Button>Rich</Button>
        </Tooltip>
      </View>
    </View>
  ),
}

// Controlled tooltip
export const Controlled: Story = {
  render: () => {
    const [visible, setVisible] = useState(false)

    return (
      <View style={styles.container}>
        <Text style={styles.sectionTitle}>Controlled Tooltip</Text>
        <Tooltip
          content="This is a controlled tooltip"
          arrowPosition="down-center"
          visible={visible}
          onVisibleChange={setVisible}
        >
          <Button>Toggle Tooltip</Button>
        </Tooltip>
        <View style={styles.buttonRow}>
          <Text style={styles.button} onPress={() => setVisible(!visible)}>
            {visible ? 'Hide Tooltip' : 'Show Tooltip'}
          </Text>
        </View>
        <Text style={styles.status}>Visible: {visible ? 'true' : 'false'}</Text>
      </View>
    )
  },
}

// Long content
export const LongContent: Story = {
  render: () => (
    <View style={styles.container}>
      <Text style={styles.sectionTitle}>Tooltip with Long Content</Text>
      <View style={styles.column}>
        <Tooltip
          content="This is a very long tooltip content that demonstrates how the tooltip handles longer text. It should wrap nicely and maintain proper spacing and alignment throughout the tooltip component."
          arrowPosition="down-center"
        >
          <Button>Long Default</Button>
        </Tooltip>
        <Tooltip
          type="rich"
          title="Very Long Title That Might Wrap to Multiple Lines"
          description="This is a very long description that demonstrates how the rich tooltip handles longer text content. It should wrap nicely and maintain proper spacing and alignment throughout. The tooltip component is designed to be flexible and accommodate various content lengths while maintaining readability and visual hierarchy."
          arrowPosition="down-center"
          actions={[
            { label: 'Primary action with long label', onPress: () => console.log('Primary') },
            { label: 'Secondary', onPress: () => console.log('Secondary') },
          ]}
        >
          <Button>Long Rich</Button>
        </Tooltip>
      </View>
    </View>
  ),
}

// Custom delay
export const CustomDelay: Story = {
  render: () => (
    <View style={styles.container}>
      <Text style={styles.sectionTitle}>Tooltip with Custom Delay</Text>
      <View style={styles.row}>
        <Tooltip content="No delay (0ms)" arrowPosition="down-center" delay={0}>
          <Button>No Delay</Button>
        </Tooltip>
        <Tooltip content="Short delay (200ms)" arrowPosition="down-center" delay={200}>
          <Button>200ms Delay</Button>
        </Tooltip>
        <Tooltip content="Long delay (1000ms)" arrowPosition="down-center" delay={1000}>
          <Button>1000ms Delay</Button>
        </Tooltip>
      </View>
    </View>
  ),
}

// With custom ReactNode content
export const CustomContent: Story = {
  render: () => (
    <View style={styles.container}>
      <Text style={styles.sectionTitle}>Tooltip with Custom ReactNode Content</Text>
      <Tooltip
        content={
          <View>
            <Text style={{ fontWeight: '600', marginBottom: spacing[4] }}>Custom Content</Text>
            <Text>This tooltip uses custom ReactNode content instead of a simple string.</Text>
          </View>
        }
        arrowPosition="down-center"
      >
        <Button>Custom Content</Button>
      </Tooltip>
    </View>
  ),
}

// Edge cases
export const EdgeCases: Story = {
  render: () => (
    <View style={styles.container}>
      <Text style={styles.sectionTitle}>Edge Cases</Text>
      <View style={styles.column}>
        <Tooltip content="Short" arrowPosition="down-center">
          <Button>Short Text</Button>
        </Tooltip>
        <Tooltip
          type="rich"
          title="Title Only"
          arrowPosition="down-center"
          showActions={false}
        >
          <Button>Title Only</Button>
        </Tooltip>
        <Tooltip
          type="rich"
          title="Rich Tooltip"
          description="Description only, no actions"
          arrowPosition="down-center"
          showActions={false}
        >
          <Button>No Actions</Button>
        </Tooltip>
      </View>
    </View>
  ),
}

const styles = StyleSheet.create({
  container: {
    gap: spacing[16],
    padding: spacing[16],
    maxWidth: 800,
    alignItems: 'center',
  },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing[12],
    justifyContent: 'center',
  },
  row: {
    flexDirection: 'row',
    gap: spacing[12],
    alignItems: 'center',
  },
  column: {
    flexDirection: 'column',
    gap: spacing[12],
    alignItems: 'center',
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: spacing[8],
    color: '#344051',
    textAlign: 'center',
  },
  status: {
    fontSize: 14,
    color: '#637083',
    marginTop: spacing[8],
  },
  buttonRow: {
    flexDirection: 'row',
    gap: spacing[12],
    marginTop: spacing[8],
  },
  button: {
    fontSize: 14,
    fontWeight: '500',
    color: '#fb612a',
    textDecorationLine: 'underline',
    padding: spacing[8],
  },
})

