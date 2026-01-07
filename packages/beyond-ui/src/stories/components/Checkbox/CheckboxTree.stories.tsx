/**
 * CheckboxTree component stories
 */

import type { Meta, StoryObj } from '@storybook/react'
import { useState } from 'react'
import { View, Text, StyleSheet } from 'react-native'
import { CheckboxTree } from '../../../components/Checkbox/CheckboxTree'
import {
  updateNodeChecked,
  getCheckedNodeIds,
} from '../../../components/Checkbox/CheckboxTree.utils'
import type { CheckboxTreeNode } from '../../../components/Checkbox/CheckboxTree.types'
import { colors } from '../../../tokens/colors'
import { spacing } from '../../../tokens/spacing'
import { typography } from '../../../tokens/typography'

const meta = {
  title: 'Components/CheckboxTree',
  component: CheckboxTree,
  parameters: {
    layout: 'centered',
  },
  tags: ['autodocs'],
} satisfies Meta<typeof CheckboxTree>

export default meta
type Story = StoryObj<typeof meta>

// Sample tree data matching Figma design
const geographyTree: CheckboxTreeNode[] = [
  {
    id: 'europe',
    label: 'Europe',
    checked: false,
    children: [
      {
        id: 'france',
        label: 'France',
        checked: false,
        children: [
          { id: 'paris', label: 'Paris', checked: false },
          { id: 'lyon', label: 'Lyon', checked: true },
          { id: 'marseille', label: 'Marseille', checked: false },
        ],
      },
      { id: 'spain', label: 'Spain', checked: false },
      { id: 'italy', label: 'Italy', checked: false },
    ],
  },
  {
    id: 'north-america',
    label: 'North America',
    checked: false,
    children: [
      {
        id: 'usa',
        label: 'United States',
        checked: false,
        children: [
          { id: 'la', label: 'Los Angeles', checked: false },
          { id: 'houston', label: 'Houston', checked: false },
          { id: 'nyc', label: 'New York City', checked: false },
        ],
      },
    ],
  },
  {
    id: 'africa',
    label: 'Africa',
    checked: false,
  },
]

// Basic tree
export const Default: Story = {
  render: () => {
    const [nodes, setNodes] = useState<CheckboxTreeNode[]>(geographyTree)

    return (
      <CheckboxTree
        nodes={nodes}
        onChange={(nodeId, checked) => {
          setNodes(updateNodeChecked(nodes, nodeId, checked))
        }}
      />
    )
  },
}

// Tree with some nodes expanded by default
export const PartiallyExpanded: Story = {
  render: () => {
    const [nodes, setNodes] = useState<CheckboxTreeNode[]>(geographyTree)

    return (
      <CheckboxTree
        nodes={nodes}
        expandedIds={['europe', 'france']}
        onChange={(nodeId, checked) => {
          setNodes(updateNodeChecked(nodes, nodeId, checked))
        }}
      />
    )
  },
}

// All nodes expanded
export const AllExpanded: Story = {
  render: () => {
    const [nodes, setNodes] = useState<CheckboxTreeNode[]>(geographyTree)

    return (
      <CheckboxTree
        nodes={nodes}
        defaultExpanded={true}
        onChange={(nodeId, checked) => {
          setNodes(updateNodeChecked(nodes, nodeId, checked))
        }}
      />
    )
  },
}

// Medium size checkboxes
export const MediumSize: Story = {
  render: () => {
    const [nodes, setNodes] = useState<CheckboxTreeNode[]>(geographyTree)

    return (
      <CheckboxTree
        nodes={nodes}
        size="md"
        defaultExpanded={true}
        onChange={(nodeId, checked) => {
          setNodes(updateNodeChecked(nodes, nodeId, checked))
        }}
      />
    )
  },
}

// Gray color variant
export const GrayColor: Story = {
  render: () => {
    const [nodes, setNodes] = useState<CheckboxTreeNode[]>(geographyTree)

    return (
      <CheckboxTree
        nodes={nodes}
        color="gray"
        defaultExpanded={true}
        onChange={(nodeId, checked) => {
          setNodes(updateNodeChecked(nodes, nodeId, checked))
        }}
      />
    )
  },
}

// Custom indent size
export const CustomIndent: Story = {
  render: () => {
    const [nodes, setNodes] = useState<CheckboxTreeNode[]>(geographyTree)

    return (
      <CheckboxTree
        nodes={nodes}
        indentSize={40}
        defaultExpanded={true}
        onChange={(nodeId, checked) => {
          setNodes(updateNodeChecked(nodes, nodeId, checked))
        }}
      />
    )
  },
}

// Interactive example with state display
export const InteractiveWithState: Story = {
  render: () => {
    const [nodes, setNodes] = useState<CheckboxTreeNode[]>(geographyTree)
    const checkedIds = getCheckedNodeIds(nodes)

    return (
      <View style={styles.interactiveContainer}>
        <Text style={styles.title}>Select Locations</Text>
        <CheckboxTree
          nodes={nodes}
          defaultExpanded={true}
          onChange={(nodeId, checked) => {
            setNodes(updateNodeChecked(nodes, nodeId, checked))
          }}
        />
        <View style={styles.stateDisplay}>
          <Text style={styles.stateTitle}>Selected IDs:</Text>
          <Text style={styles.stateText}>
            {checkedIds.length > 0 ? checkedIds.join(', ') : 'None'}
          </Text>
        </View>
      </View>
    )
  },
}

// With disabled nodes
export const WithDisabledNodes: Story = {
  render: () => {
    const disabledTree: CheckboxTreeNode[] = [
      {
        id: 'available',
        label: 'Available Regions',
        checked: false,
        children: [
          { id: 'us-east', label: 'US East', checked: true },
          { id: 'us-west', label: 'US West', checked: false },
        ],
      },
      {
        id: 'unavailable',
        label: 'Unavailable Regions',
        disabled: true,
        checked: false,
        children: [
          { id: 'asia', label: 'Asia Pacific', disabled: true, checked: false },
          { id: 'south-america', label: 'South America', disabled: true, checked: false },
        ],
      },
    ]

    const [nodes, setNodes] = useState<CheckboxTreeNode[]>(disabledTree)

    return (
      <CheckboxTree
        nodes={nodes}
        defaultExpanded={true}
        onChange={(nodeId, checked) => {
          setNodes(updateNodeChecked(nodes, nodeId, checked))
        }}
      />
    )
  },
}

// Deep nesting example
export const DeepNesting: Story = {
  render: () => {
    const deepTree: CheckboxTreeNode[] = [
      {
        id: 'root',
        label: 'Root',
        checked: false,
        children: [
          {
            id: 'level1',
            label: 'Level 1',
            checked: false,
            children: [
              {
                id: 'level2',
                label: 'Level 2',
                checked: false,
                children: [
                  {
                    id: 'level3',
                    label: 'Level 3',
                    checked: false,
                    children: [
                      { id: 'level4a', label: 'Level 4 Item A', checked: false },
                      { id: 'level4b', label: 'Level 4 Item B', checked: true },
                    ],
                  },
                ],
              },
            ],
          },
        ],
      },
    ]

    const [nodes, setNodes] = useState<CheckboxTreeNode[]>(deepTree)

    return (
      <CheckboxTree
        nodes={nodes}
        defaultExpanded={true}
        onChange={(nodeId, checked) => {
          setNodes(updateNodeChecked(nodes, nodeId, checked))
        }}
      />
    )
  },
}

// Controlled expand/collapse
export const ControlledExpansion: Story = {
  render: () => {
    const [nodes, setNodes] = useState<CheckboxTreeNode[]>(geographyTree)
    const [expandedIds, setExpandedIds] = useState<string[]>(['europe'])

    return (
      <View style={styles.controlledContainer}>
        <View style={styles.controls}>
          <Text style={styles.controlLabel}>Expand/Collapse Controls:</Text>
          <Text
            style={styles.controlButton}
            onPress={() => setExpandedIds(['europe', 'north-america', 'africa', 'france', 'usa'])}
          >
            Expand All
          </Text>
          <Text style={styles.controlButton} onPress={() => setExpandedIds([])}>
            Collapse All
          </Text>
          <Text style={styles.controlButton} onPress={() => setExpandedIds(['europe', 'france'])}>
            Expand Europe → France
          </Text>
        </View>

        <CheckboxTree
          nodes={nodes}
          expandedIds={expandedIds}
          onExpandChange={(nodeId, expanded) => {
            setExpandedIds((prev) =>
              expanded ? [...prev, nodeId] : prev.filter((id) => id !== nodeId)
            )
          }}
          onChange={(nodeId, checked) => {
            setNodes(updateNodeChecked(nodes, nodeId, checked))
          }}
        />
      </View>
    )
  },
}

const styles = StyleSheet.create({
  interactiveContainer: {
    gap: spacing[16],
    minWidth: 400,
    padding: spacing[20],
    backgroundColor: colors.bg.light.default,
    borderRadius: 8,
  },
  title: {
    fontFamily: typography.bodyMedium.fontFamily,
    fontSize: typography.h6.fontSize,
    fontWeight: typography.bodyMedium.fontWeight,
    color: colors.text.light.primary,
  },
  stateDisplay: {
    marginTop: spacing[16],
    padding: spacing[12],
    backgroundColor: colors.gray[50],
    borderRadius: 4,
    gap: spacing[8],
  },
  stateTitle: {
    fontFamily: typography.bodyMedium.fontFamily,
    fontSize: typography.small.fontSize,
    fontWeight: typography.bodyMedium.fontWeight,
    color: colors.text.light.secondary,
  },
  stateText: {
    fontFamily: typography.body.fontFamily,
    fontSize: typography.small.fontSize,
    color: colors.text.light.primary,
  },
  controlledContainer: {
    gap: spacing[16],
    minWidth: 400,
  },
  controls: {
    gap: spacing[8],
    padding: spacing[12],
    backgroundColor: colors.gray[100],
    borderRadius: 4,
  },
  controlLabel: {
    fontFamily: typography.bodyMedium.fontFamily,
    fontSize: typography.small.fontSize,
    fontWeight: typography.bodyMedium.fontWeight,
    color: colors.text.light.primary,
    marginBottom: spacing[4],
  },
  controlButton: {
    fontFamily: typography.body.fontFamily,
    fontSize: typography.small.fontSize,
    color: colors.primary[600],
    paddingVertical: spacing[4],
    cursor: 'pointer',
  },
})
