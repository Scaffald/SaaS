/**
 * Sheet Components Stories
 * Demonstrates Sheet, SheetHeader, SheetContent, SheetFooter
 */

import type { Meta, StoryObj } from '@storybook/react'
import { useState } from 'react'
import { View, StyleSheet } from 'react-native'
import { Sheet, SheetHeader, SheetContent, SheetFooter } from '../../../components/Sheet'
import { Button } from '../../../components/Button'
import { Stack, Row } from '../../../components/Layout'
import { Text, H4, Paragraph } from '../../../components/Typography'
import { Input } from '../../../components/Input'
import { spacing } from '../../../tokens/spacing'
import { colors } from '../../../tokens/colors'

const meta: Meta = {
  title: 'Components/Sheet',
  parameters: {
    layout: 'padded',
    docs: {
      description: {
        component:
          'Sheet is a bottom sheet/drawer component for mobile-friendly overlays. Supports drag-to-dismiss, multiple height presets, and customizable header/footer.',
      },
    },
  },
}

export default meta

// ============================================================================
// Interactive Demo Components
// ============================================================================

function BasicSheetDemo() {
  const [visible, setVisible] = useState(false)

  return (
    <View>
      <Button onPress={() => setVisible(true)}>Open Basic Sheet</Button>
      <Sheet visible={visible} onClose={() => setVisible(false)} height="half">
        <SheetHeader title="Basic Sheet" onClose={() => setVisible(false)} />
        <SheetContent>
          <Paragraph>
            This is a basic sheet with default settings. It opens at half the screen height and can
            be dismissed by tapping the backdrop or dragging down.
          </Paragraph>
        </SheetContent>
      </Sheet>
    </View>
  )
}

function SheetWithActionsDemo() {
  const [visible, setVisible] = useState(false)

  return (
    <View>
      <Button onPress={() => setVisible(true)}>Open Sheet with Actions</Button>
      <Sheet visible={visible} onClose={() => setVisible(false)} height="half">
        <SheetHeader
          title="Confirm Action"
          subtitle="This action cannot be undone"
          onClose={() => setVisible(false)}
        />
        <SheetContent>
          <Paragraph>
            Are you sure you want to delete this item? This action is permanent and cannot be
            reversed.
          </Paragraph>
        </SheetContent>
        <SheetFooter>
          <Button variant="outline" onPress={() => setVisible(false)}>
            Cancel
          </Button>
          <Button color="error" onPress={() => setVisible(false)}>
            Delete
          </Button>
        </SheetFooter>
      </Sheet>
    </View>
  )
}

function SheetHeightsDemo() {
  const [visible, setVisible] = useState(false)
  const [height, setHeight] = useState<'quarter' | 'half' | 'three-quarters' | 'full'>('half')

  const openWithHeight = (h: typeof height) => {
    setHeight(h)
    setVisible(true)
  }

  return (
    <Stack gap={12}>
      <Text size="sm" color="secondary">
        Open sheet at different heights:
      </Text>
      <Row gap={12} style={styles.wrap}>
        <Button variant="outline" size="sm" onPress={() => openWithHeight('quarter')}>
          Quarter
        </Button>
        <Button variant="outline" size="sm" onPress={() => openWithHeight('half')}>
          Half
        </Button>
        <Button variant="outline" size="sm" onPress={() => openWithHeight('three-quarters')}>
          Three-Quarters
        </Button>
        <Button variant="outline" size="sm" onPress={() => openWithHeight('full')}>
          Full
        </Button>
      </Row>
      <Sheet visible={visible} onClose={() => setVisible(false)} height={height}>
        <SheetHeader title={`${height} Height Sheet`} onClose={() => setVisible(false)} />
        <SheetContent>
          <Paragraph>
            This sheet is set to "{height}" height. The sheet animates smoothly to its target
            position.
          </Paragraph>
        </SheetContent>
      </Sheet>
    </Stack>
  )
}

function SheetWithFormDemo() {
  const [visible, setVisible] = useState(false)

  return (
    <View>
      <Button onPress={() => setVisible(true)}>Open Form Sheet</Button>
      <Sheet visible={visible} onClose={() => setVisible(false)} height="three-quarters">
        <SheetHeader title="Add New Contact" onClose={() => setVisible(false)} />
        <SheetContent>
          <Stack gap={16}>
            <Input label="First Name" placeholder="Enter first name" />
            <Input label="Last Name" placeholder="Enter last name" />
            <Input label="Email" placeholder="Enter email" type="email" />
            <Input label="Phone" placeholder="Enter phone number" />
          </Stack>
        </SheetContent>
        <SheetFooter>
          <Button variant="outline" onPress={() => setVisible(false)}>
            Cancel
          </Button>
          <Button onPress={() => setVisible(false)}>Save Contact</Button>
        </SheetFooter>
      </Sheet>
    </View>
  )
}

function SheetNoHandleDemo() {
  const [visible, setVisible] = useState(false)

  return (
    <View>
      <Button variant="outline" onPress={() => setVisible(true)}>
        Open Sheet (No Handle)
      </Button>
      <Sheet
        visible={visible}
        onClose={() => setVisible(false)}
        height="half"
        showHandle={false}
        enableDragToDismiss={false}
      >
        <SheetHeader title="No Drag Handle" onClose={() => setVisible(false)} />
        <SheetContent>
          <Paragraph>
            This sheet has the drag handle hidden and drag-to-dismiss disabled. It can only be
            closed using the close button or backdrop tap.
          </Paragraph>
        </SheetContent>
      </Sheet>
    </View>
  )
}

function SheetAutoHeightDemo() {
  const [visible, setVisible] = useState(false)

  return (
    <View>
      <Button variant="outline" onPress={() => setVisible(true)}>
        Open Auto-Height Sheet
      </Button>
      <Sheet visible={visible} onClose={() => setVisible(false)} height="auto">
        <SheetHeader title="Auto Height" onClose={() => setVisible(false)} />
        <SheetContent scrollable={false}>
          <Paragraph>This sheet automatically sizes to fit its content.</Paragraph>
        </SheetContent>
        <SheetFooter>
          <Button onPress={() => setVisible(false)}>Got It</Button>
        </SheetFooter>
      </Sheet>
    </View>
  )
}

function SheetWithScrollableContentDemo() {
  const [visible, setVisible] = useState(false)

  return (
    <View>
      <Button onPress={() => setVisible(true)}>Open Scrollable Sheet</Button>
      <Sheet visible={visible} onClose={() => setVisible(false)} height="half">
        <SheetHeader title="Scrollable Content" onClose={() => setVisible(false)} />
        <SheetContent>
          <Stack gap={16}>
            {Array.from({ length: 20 }).map((_, i) => (
              <View key={i} style={styles.listItem}>
                <Text weight="medium">Item {i + 1}</Text>
                <Text size="sm" color="secondary">
                  This is a description for item {i + 1}
                </Text>
              </View>
            ))}
          </Stack>
        </SheetContent>
      </Sheet>
    </View>
  )
}

// ============================================================================
// Stories
// ============================================================================

export const InteractiveDemo: StoryObj = {
  name: 'Interactive Demo',
  render: () => (
    <Stack gap={32}>
      <View>
        <H4 style={styles.sectionTitle}>Basic Usage</H4>
        <BasicSheetDemo />
      </View>

      <View>
        <H4 style={styles.sectionTitle}>With Actions</H4>
        <SheetWithActionsDemo />
      </View>

      <View>
        <H4 style={styles.sectionTitle}>Height Variants</H4>
        <SheetHeightsDemo />
      </View>

      <View>
        <H4 style={styles.sectionTitle}>With Form</H4>
        <SheetWithFormDemo />
      </View>

      <View>
        <H4 style={styles.sectionTitle}>Scrollable Content</H4>
        <SheetWithScrollableContentDemo />
      </View>

      <View>
        <H4 style={styles.sectionTitle}>Options</H4>
        <Row gap={12} style={styles.wrap}>
          <SheetNoHandleDemo />
          <SheetAutoHeightDemo />
        </Row>
      </View>
    </Stack>
  ),
}

export const BasicSheet: StoryObj = {
  name: 'Basic Sheet',
  render: () => <BasicSheetDemo />,
}

export const SheetWithFooter: StoryObj = {
  name: 'With Footer Actions',
  render: () => <SheetWithActionsDemo />,
}

export const HeightVariants: StoryObj = {
  name: 'Height Variants',
  render: () => <SheetHeightsDemo />,
}

export const FormSheet: StoryObj = {
  name: 'Form Sheet',
  render: () => <SheetWithFormDemo />,
}

export const ScrollableContent: StoryObj = {
  name: 'Scrollable Content',
  render: () => <SheetWithScrollableContentDemo />,
}

// ============================================================================
// Styles
// ============================================================================

const styles = StyleSheet.create({
  sectionTitle: {
    marginBottom: spacing[12],
  },
  wrap: {
    flexWrap: 'wrap',
  },
  listItem: {
    padding: spacing[12],
    backgroundColor: colors.bg.light.subtle,
    borderRadius: 8,
    gap: spacing[4],
  },
})
