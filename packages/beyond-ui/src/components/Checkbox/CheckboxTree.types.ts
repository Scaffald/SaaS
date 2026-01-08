/**
 * CheckboxTree types
 */

import type { CheckboxSize, CheckboxColor } from './Checkbox.types'

export interface CheckboxTreeNode {
  id: string
  label: string
  checked?: boolean
  disabled?: boolean
  children?: CheckboxTreeNode[]
}

export interface CheckboxTreeProps {
  /**
   * Tree data structure
   */
  nodes: CheckboxTreeNode[]

  /**
   * Callback when a node's checked state changes
   */
  onChange?: (nodeId: string, checked: boolean, node: CheckboxTreeNode) => void

  /**
   * Checkbox size
   * @default 'sm'
   */
  size?: CheckboxSize

  /**
   * Checkbox color
   * @default 'primary'
   */
  color?: CheckboxColor

  /**
   * Indent size in pixels for each level
   * @default 24
   */
  indentSize?: number

  /**
   * Gap between items in pixels
   * @default 12
   */
  itemGap?: number

  /**
   * Default expanded state for all nodes
   * @default false
   */
  defaultExpanded?: boolean

  /**
   * Controlled expanded state
   */
  expandedIds?: string[]

  /**
   * Callback when expand/collapse changes
   */
  onExpandChange?: (nodeId: string, expanded: boolean) => void
}

export interface CheckboxTreeNodeProps {
  node: CheckboxTreeNode
  level: number
  size: CheckboxSize
  color: CheckboxColor
  indentSize: number
  isExpanded: boolean
  onToggleExpand: (nodeId: string) => void
  onCheckChange: (nodeId: string, checked: boolean, node: CheckboxTreeNode) => void
  getNodeState: (node: CheckboxTreeNode) => { checked: boolean; indeterminate: boolean }
}
