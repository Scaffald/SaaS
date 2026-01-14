/**
 * Popover Components Stories
 * Demonstrates Popover, PopoverHeader, PopoverContent, PopoverFooter
 */

import type { Meta, StoryObj } from '@storybook/react'
import { useState } from 'react'
import { View, StyleSheet } from 'react-native'
import {
  Popover,
  PopoverHeader,
  PopoverContent,
  PopoverFooter,
} from '../../../components/Popover'
import type { PopoverPlacement } from '../../../components/Popover'
import { Button } from '../../../components/Button'
import { Stack, Row } from '../../../components/Layout'
import { Text, H4, } from '../../../components/Typography'
import { Input } from '../../../components/Input'
import { spacing } from '../../../tokens/spacing'
import { colors } from '../../../tokens/colors'

const meta: Meta = {
  title: 'Components/Popover',
  parameters: {
    layout: 'centered',
    docs: {
      description: {
        component:
          'Popover is a floating container for interactive content. It appears relative to a trigger element and supports various placements.',
      },
    },
  },
}

export default meta

// ============================================================================
// Demo Components
// ============================================================================

function BasicPopoverDemo() {
  return (
    <Popover
      placement="bottom"
      content={
        <PopoverContent>
          <Text>This is a basic popover with some content.</Text>
        </PopoverContent>
      }
    >
      <Button>Open Popover</Button>
    </Popover>
  )
}

function PopoverWithHeaderDemo() {
  return (
    <Popover
      placement="bottom"
      content={
        <>
          <PopoverHeader title="Popover Title" showCloseButton />
          <PopoverContent>
            <Text>This popover has a header with a title and close button.</Text>
          </PopoverContent>
        </>
      }
    >
      <Button>With Header</Button>
    </Popover>
  )
}

function PopoverWithFooterDemo() {
  return (
    <Popover
      placement="bottom"
      content={
        <>
          <PopoverHeader title="Confirm" />
          <PopoverContent>
            <Text>Are you sure you want to proceed?</Text>
          </PopoverContent>
          <PopoverFooter>
            <Button variant="outline" size="sm">
              Cancel
            </Button>
            <Button size="sm">Confirm</Button>
          </PopoverFooter>
        </>
      }
    >
      <Button>With Footer</Button>
    </Popover>
  )
}

function PlacementDemo() {
  const placements: PopoverPlacement[] = [
    'top',
    'top-start',
    'top-end',
    'bottom',
    'bottom-start',
    'bottom-end',
    'left',
    'right',
  ]

  return (
    <View style={styles.placementGrid}>
      {placements.map((placement) => (
        <Popover
          key={placement}
          placement={placement}
          content={
            <PopoverContent>
              <Text size="sm">Placement: {placement}</Text>
            </PopoverContent>
          }
        >
          <Button variant="outline" size="sm">
            {placement}
          </Button>
        </Popover>
      ))}
    </View>
  )
}

function ControlledPopoverDemo() {
  const [open, setOpen] = useState(false)

  return (
    <Stack gap={12}>
      <Row gap={8}>
        <Button variant="outline" size="sm" onPress={() => setOpen(true)}>
          Open
        </Button>
        <Button variant="outline" size="sm" onPress={() => setOpen(false)}>
          Close
        </Button>
      </Row>
      <Popover
        open={open}
        onOpenChange={setOpen}
        trigger="manual"
        placement="bottom"
        content={
          <>
            <PopoverHeader title="Controlled Popover" showCloseButton />
            <PopoverContent>
              <Text>This popover is controlled externally.</Text>
            </PopoverContent>
          </>
        }
      >
        <Button>Trigger (disabled)</Button>
      </Popover>
    </Stack>
  )
}

function PopoverWithFormDemo() {
  return (
    <Popover
      placement="bottom"
      width={280}
      content={
        <>
          <PopoverHeader title="Quick Edit" showCloseButton />
          <PopoverContent>
            <Stack gap={12}>
              <Input label="Name" placeholder="Enter name" size="sm" />
              <Input label="Email" placeholder="Enter email" size="sm" />
            </Stack>
          </PopoverContent>
          <PopoverFooter>
            <Button size="sm">Save</Button>
          </PopoverFooter>
        </>
      }
    >
      <Button>Edit Profile</Button>
    </Popover>
  )
}

function PopoverMenuDemo() {
  return (
    <Popover
      placement="bottom-start"
      showArrow={false}
      content={
        <Stack gap={0}>
          <MenuItem label="View Profile" />
          <MenuItem label="Settings" />
          <MenuItem label="Help" />
          <View style={styles.menuDivider} />
          <MenuItem label="Sign Out" danger />
        </Stack>
      }
    >
      <Button variant="outline">Menu</Button>
    </Popover>
  )
}

function MenuItem({ label, danger }: { label: string; danger?: boolean }) {
  return (
    <View style={styles.menuItem}>
      <Text color={danger ? 'error' : 'primary'}>{label}</Text>
    </View>
  )
}

function NoArrowDemo() {
  return (
    <Popover
      placement="bottom"
      showArrow={false}
      content={
        <PopoverContent>
          <Text>This popover has no arrow indicator.</Text>
        </PopoverContent>
      }
    >
      <Button variant="outline">No Arrow</Button>
    </Popover>
  )
}

// ============================================================================
// Stories
// ============================================================================

export const InteractiveDemo: StoryObj = {
  name: 'Interactive Demo',
  render: () => (
    <Stack gap={32} style={styles.container}>
      <View>
        <H4 style={styles.sectionTitle}>Basic Usage</H4>
        <Row gap={12} style={styles.wrap}>
          <BasicPopoverDemo />
          <PopoverWithHeaderDemo />
          <PopoverWithFooterDemo />
        </Row>
      </View>

      <View>
        <H4 style={styles.sectionTitle}>Placements</H4>
        <PlacementDemo />
      </View>

      <View>
        <H4 style={styles.sectionTitle}>Controlled</H4>
        <ControlledPopoverDemo />
      </View>

      <View>
        <H4 style={styles.sectionTitle}>With Form</H4>
        <PopoverWithFormDemo />
      </View>

      <View>
        <H4 style={styles.sectionTitle}>Menu Style</H4>
        <Row gap={12}>
          <PopoverMenuDemo />
          <NoArrowDemo />
        </Row>
      </View>
    </Stack>
  ),
}

export const BasicPopover: StoryObj = {
  name: 'Basic Popover',
  render: () => <BasicPopoverDemo />,
}

export const WithHeaderAndFooter: StoryObj = {
  name: 'With Header & Footer',
  render: () => <PopoverWithFooterDemo />,
}

export const Placements: StoryObj = {
  name: 'Placement Options',
  render: () => (
    <View style={styles.placementsContainer}>
      <PlacementDemo />
    </View>
  ),
}

export const FormPopover: StoryObj = {
  name: 'Form Popover',
  render: () => <PopoverWithFormDemo />,
}

export const MenuPopover: StoryObj = {
  name: 'Menu Popover',
  render: () => <PopoverMenuDemo />,
}

// ============================================================================
// Styles
// ============================================================================

const styles = StyleSheet.create({
  container: {
    padding: spacing[16],
    minHeight: 500,
  },
  sectionTitle: {
    marginBottom: spacing[12],
  },
  wrap: {
    flexWrap: 'wrap',
  },
  placementGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing[8],
    maxWidth: 400,
  },
  placementsContainer: {
    padding: spacing[32],
    minHeight: 300,
  },
  menuItem: {
    paddingHorizontal: spacing[12],
    paddingVertical: spacing[8],
  },
  menuDivider: {
    height: 1,
    backgroundColor: colors.border.light.subtle,
    marginVertical: spacing[4],
  },
})
