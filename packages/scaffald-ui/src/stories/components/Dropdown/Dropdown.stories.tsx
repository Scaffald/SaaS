/**
 * Dropdown Component Stories
 */

import type { Meta, StoryObj } from '@storybook/react'
import { useState } from 'react'
import { Dropdown, DropdownSection, DropdownItem } from '../../../components/Dropdown'
import { View, StyleSheet } from 'react-native'
import { spacing } from '../../../tokens/spacing'

const meta: Meta<typeof Dropdown> = {
  title: 'Components/Dropdown',
  component: Dropdown,
  parameters: {
    layout: 'centered',
    docs: {
      description: {
        component: 'Dropdown component with menu sections, items, and flexible positioning.',
      },
    },
  },
  argTypes: {
    position: {
      control: 'select',
      options: ['top-left', 'top-right', 'bottom-left', 'bottom-right'],
      description: 'Position of dropdown menu relative to trigger',
    },
    disabled: {
      control: 'boolean',
      description: 'Disabled state',
    },
    trigger: {
      control: 'text',
      description: 'Trigger button text',
    },
  },
}

export default meta
type Story = StoryObj<typeof Dropdown>

export const Default: Story = {
  render: () => {
    const [selected, setSelected] = useState<string>('')
    return (
      <Dropdown trigger="Select">
        <DropdownSection heading="Section 1">
          <DropdownItem checked={selected === 'option1'} onPress={() => setSelected('option1')}>
            Option 1
          </DropdownItem>
          <DropdownItem checked={selected === 'option2'} onPress={() => setSelected('option2')}>
            Option 2
          </DropdownItem>
          <DropdownItem checked={selected === 'option3'} onPress={() => setSelected('option3')}>
            Option 3
          </DropdownItem>
        </DropdownSection>
      </Dropdown>
    )
  },
}

export const WithSections: Story = {
  render: () => {
    const [selected, setSelected] = useState<string>('')
    return (
      <View style={styles.container}>
        <Dropdown trigger="Select">
          <DropdownSection heading="Section 1">
            <DropdownItem checked={selected === 'option1'} onPress={() => setSelected('option1')}>
              Option 1
            </DropdownItem>
            <DropdownItem checked={selected === 'option2'} onPress={() => setSelected('option2')}>
              Option 2
            </DropdownItem>
            <DropdownItem checked={selected === 'option3'} onPress={() => setSelected('option3')}>
              Option 3
            </DropdownItem>
          </DropdownSection>
          <DropdownSection heading="Section 2" divider>
            <DropdownItem checked={selected === 'option4'} onPress={() => setSelected('option4')}>
              Option 4
            </DropdownItem>
            <DropdownItem checked={selected === 'option5'} onPress={() => setSelected('option5')}>
              Option 5
            </DropdownItem>
          </DropdownSection>
        </Dropdown>
      </View>
    )
  },
}

export const Positions: Story = {
  render: () => {
    const [selected1, setSelected1] = useState<string>('')
    const [selected2, setSelected2] = useState<string>('')
    const [selected3, setSelected3] = useState<string>('')
    const [selected4, setSelected4] = useState<string>('')

    return (
      <View style={styles.positionsContainer}>
        <View style={styles.positionRow}>
          <Dropdown trigger="Bottom Right" position="bottom-right">
            <DropdownSection heading="Options">
              <DropdownItem checked={selected1 === '1'} onPress={() => setSelected1('1')}>
                Option 1
              </DropdownItem>
              <DropdownItem checked={selected1 === '2'} onPress={() => setSelected1('2')}>
                Option 2
              </DropdownItem>
            </DropdownSection>
          </Dropdown>

          <Dropdown trigger="Bottom Left" position="bottom-left">
            <DropdownSection heading="Options">
              <DropdownItem checked={selected2 === '1'} onPress={() => setSelected2('1')}>
                Option 1
              </DropdownItem>
              <DropdownItem checked={selected2 === '2'} onPress={() => setSelected2('2')}>
                Option 2
              </DropdownItem>
            </DropdownSection>
          </Dropdown>
        </View>

        <View style={styles.positionRow}>
          <Dropdown trigger="Top Right" position="top-right">
            <DropdownSection heading="Options">
              <DropdownItem checked={selected3 === '1'} onPress={() => setSelected3('1')}>
                Option 1
              </DropdownItem>
              <DropdownItem checked={selected3 === '2'} onPress={() => setSelected3('2')}>
                Option 2
              </DropdownItem>
            </DropdownSection>
          </Dropdown>

          <Dropdown trigger="Top Left" position="top-left">
            <DropdownSection heading="Options">
              <DropdownItem checked={selected4 === '1'} onPress={() => setSelected4('1')}>
                Option 1
              </DropdownItem>
              <DropdownItem checked={selected4 === '2'} onPress={() => setSelected4('2')}>
                Option 2
              </DropdownItem>
            </DropdownSection>
          </Dropdown>
        </View>
      </View>
    )
  },
}

export const States: Story = {
  render: () => {
    const [selected, setSelected] = useState<string>('')
    return (
      <View style={styles.container}>
        <View style={styles.row}>
          <Dropdown trigger="Enabled">
            <DropdownSection heading="Options">
              <DropdownItem checked={selected === '1'} onPress={() => setSelected('1')}>
                Option 1
              </DropdownItem>
              <DropdownItem checked={selected === '2'} onPress={() => setSelected('2')}>
                Option 2
              </DropdownItem>
            </DropdownSection>
          </Dropdown>

          <Dropdown trigger="Disabled" disabled>
            <DropdownSection heading="Options">
              <DropdownItem>Option 1</DropdownItem>
              <DropdownItem>Option 2</DropdownItem>
            </DropdownSection>
          </Dropdown>
        </View>

        <View style={styles.row}>
          <Dropdown trigger="With Disabled Item">
            <DropdownSection heading="Options">
              <DropdownItem checked={selected === '1'} onPress={() => setSelected('1')}>
                Option 1
              </DropdownItem>
              <DropdownItem disabled>Disabled Option</DropdownItem>
              <DropdownItem checked={selected === '2'} onPress={() => setSelected('2')}>
                Option 2
              </DropdownItem>
            </DropdownSection>
          </Dropdown>
        </View>
      </View>
    )
  },
}

const styles = StyleSheet.create({
  container: {
    gap: spacing[16],
    padding: spacing[16],
  },
  row: {
    flexDirection: 'row',
    gap: spacing[16],
    flexWrap: 'wrap',
  },
  positionsContainer: {
    gap: spacing[80],
    padding: spacing[40],
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 400,
  },
  positionRow: {
    flexDirection: 'row',
    gap: spacing[40],
    width: '100%',
    justifyContent: 'space-around',
  },
})
