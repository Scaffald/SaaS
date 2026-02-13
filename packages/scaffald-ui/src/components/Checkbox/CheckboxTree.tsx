/**
 * CheckboxTree component
 * Hierarchical tree structure with checkboxes that support parent-child relationships
 *
 * @example
 * ```tsx
 * import { CheckboxTree } from '@scaffald/ui'
 *
 * const treeData = [
 *   {
 *     id: 'europe',
 *     label: 'Europe',
 *     children: [
 *       { id: 'france', label: 'France', children: [
 *         { id: 'paris', label: 'Paris' },
 *         { id: 'lyon', label: 'Lyon' }
 *       ]},
 *       { id: 'spain', label: 'Spain' },
 *     ]
 *   }
 * ]
 *
 * <CheckboxTree
 *   nodes={treeData}
 *   onChange={(nodeId, checked) => console.log(nodeId, checked)}
 * />
 * ```
 */

import { useState, useCallback, useMemo } from 'react'
import { View, Pressable, StyleSheet } from 'react-native'
import { Checkbox } from './Checkbox'
import { ArrowRightIcon } from './ArrowRightIcon'
import { ArrowDownIcon } from './ArrowDownIcon'
import { spacing } from '../../tokens/spacing'
import { colors } from '../../tokens/colors'
import { useThemeContext } from '../../theme'
import type {
  CheckboxTreeProps,
  CheckboxTreeNodeProps,
  CheckboxTreeNode,
} from './CheckboxTree.types'

/**
 * Calculate if a node should be checked or indeterminate based on children
 */
function calculateNodeState(node: CheckboxTreeNode): { checked: boolean; indeterminate: boolean } {
  // If no children, use the node's own checked state
  if (!node.children || node.children.length === 0) {
    return { checked: node.checked ?? false, indeterminate: false }
  }

  // Calculate children states
  const childStates = node.children.map(calculateNodeState)
  const allChecked = childStates.every((state) => state.checked && !state.indeterminate)
  const someChecked = childStates.some((state) => state.checked || state.indeterminate)

  return {
    checked: allChecked,
    indeterminate: someChecked && !allChecked,
  }
}

/**
 * TreeNode component - renders a single node with expand/collapse and checkbox
 */
function TreeNode({
  node,
  level,
  size,
  color,
  indentSize,
  isExpanded,
  onToggleExpand,
  onCheckChange,
  getNodeState,
  expandedIds,
}: CheckboxTreeNodeProps & { expandedIds: Set<string> }) {
  const { theme } = useThemeContext()
  const hasChildren = node.children && node.children.length > 0
  const { checked, indeterminate } = getNodeState(node)

  const handleCheckChange = (newChecked: boolean) => {
    onCheckChange(node.id, newChecked, node)
  }

  const handleExpandToggle = () => {
    if (hasChildren) {
      onToggleExpand(node.id)
    }
  }

  return (
    <>
      <View
        style={[
          styles.treeItem,
          {
            paddingLeft: level * indentSize,
          },
        ]}
      >
        {/* Expand/collapse arrow */}
        <Pressable onPress={handleExpandToggle} style={styles.arrowButton} disabled={!hasChildren}>
          {hasChildren ? (
            isExpanded ? (
              <ArrowDownIcon size={16} color={colors.text[theme].primary} />
            ) : (
              <ArrowRightIcon size={16} color={colors.text[theme].primary} />
            )
          ) : (
            <View style={{ width: 16, height: 16 }} />
          )}
        </Pressable>

        {/* Checkbox with label */}
        <Checkbox
          checked={checked}
          indeterminate={indeterminate}
          onChange={handleCheckChange}
          label={node.label}
          size={size}
          color={color}
          disabled={node.disabled}
        />
      </View>

      {/* Render children if expanded */}
      {hasChildren && isExpanded && (
        <View>
          {node.children?.map((child) => (
            <TreeNode
              key={child.id}
              node={child}
              level={level + 1}
              size={size}
              color={color}
              indentSize={indentSize}
              isExpanded={expandedIds.has(child.id)}
              onToggleExpand={onToggleExpand}
              onCheckChange={onCheckChange}
              getNodeState={getNodeState}
              expandedIds={expandedIds}
            />
          ))}
        </View>
      )}
    </>
  )
}

export function CheckboxTree({
  nodes,
  onChange,
  size = 'sm',
  color = 'primary',
  indentSize = 24,
  itemGap = 12,
  defaultExpanded = false,
  expandedIds: controlledExpandedIds,
  onExpandChange,
}: CheckboxTreeProps) {
  // Manage expanded state (controlled or uncontrolled)
  const [internalExpandedIds, setInternalExpandedIds] = useState<Set<string>>(() => {
    if (defaultExpanded) {
      // Expand all nodes by default
      const allIds = new Set<string>()
      const collectIds = (nodeList: CheckboxTreeNode[]) => {
        nodeList.forEach((node) => {
          if (node.children && node.children.length > 0) {
            allIds.add(node.id)
            collectIds(node.children)
          }
        })
      }
      collectIds(nodes)
      return allIds
    }
    return new Set()
  })

  const expandedIds = useMemo(() => {
    if (controlledExpandedIds) {
      return new Set(controlledExpandedIds)
    }
    return internalExpandedIds
  }, [controlledExpandedIds, internalExpandedIds])

  const handleToggleExpand = useCallback(
    (nodeId: string) => {
      const newExpanded = !expandedIds.has(nodeId)

      if (onExpandChange) {
        onExpandChange(nodeId, newExpanded)
      }

      if (!controlledExpandedIds) {
        setInternalExpandedIds((prev) => {
          const next = new Set(prev)
          if (newExpanded) {
            next.add(nodeId)
          } else {
            next.delete(nodeId)
          }
          return next
        })
      }
    },
    [expandedIds, onExpandChange, controlledExpandedIds]
  )

  /**
   * Handle checkbox change with cascading to children
   */
  const handleCheckChange = useCallback(
    (nodeId: string, checked: boolean, node: CheckboxTreeNode) => {
      onChange?.(nodeId, checked, node)
    },
    [onChange]
  )

  /**
   * Get the computed state for a node based on its children
   */
  const getNodeState = useCallback((node: CheckboxTreeNode) => {
    return calculateNodeState(node)
  }, [])

  return (
    <View style={[styles.container, { gap: itemGap }]}>
      {nodes.map((node) => (
        <TreeNode
          key={node.id}
          node={node}
          level={0}
          size={size}
          color={color}
          indentSize={indentSize}
          isExpanded={expandedIds.has(node.id)}
          onToggleExpand={handleToggleExpand}
          onCheckChange={handleCheckChange}
          getNodeState={getNodeState}
          expandedIds={expandedIds}
        />
      ))}
    </View>
  )
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'column',
  },
  treeItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing[6],
  },
  arrowButton: {
    width: 16,
    height: 16,
    justifyContent: 'center',
    alignItems: 'center',
  },
})

// Export types
export type { CheckboxTreeProps, CheckboxTreeNode } from './CheckboxTree.types'
