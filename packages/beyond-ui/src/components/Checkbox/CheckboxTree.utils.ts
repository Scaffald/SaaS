/**
 * Utility functions for CheckboxTree state management
 */

import type { CheckboxTreeNode } from './CheckboxTree.types'

/**
 * Update a node's checked state and cascade to all children
 */
export function updateNodeChecked(
  nodes: CheckboxTreeNode[],
  nodeId: string,
  checked: boolean
): CheckboxTreeNode[] {
  return nodes.map((node) => {
    if (node.id === nodeId) {
      // Update this node and all its children
      return setNodeAndChildrenChecked(node, checked)
    }

    if (node.children) {
      // Recursively update children
      const updatedChildren = updateNodeChecked(node.children, nodeId, checked)
      return {
        ...node,
        children: updatedChildren,
      }
    }

    return node
  })
}

/**
 * Set a node and all its children to a specific checked state
 */
function setNodeAndChildrenChecked(node: CheckboxTreeNode, checked: boolean): CheckboxTreeNode {
  const updatedNode: CheckboxTreeNode = {
    ...node,
    checked,
  }

  if (node.children) {
    updatedNode.children = node.children.map((child) => setNodeAndChildrenChecked(child, checked))
  }

  return updatedNode
}

/**
 * Find a node by ID in the tree
 */
export function findNode(nodes: CheckboxTreeNode[], nodeId: string): CheckboxTreeNode | undefined {
  for (const node of nodes) {
    if (node.id === nodeId) {
      return node
    }

    if (node.children) {
      const found = findNode(node.children, nodeId)
      if (found) {
        return found
      }
    }
  }

  return undefined
}

/**
 * Get all node IDs in the tree (for expanding all)
 */
export function getAllNodeIds(nodes: CheckboxTreeNode[]): string[] {
  const ids: string[] = []

  const collectIds = (nodeList: CheckboxTreeNode[]) => {
    nodeList.forEach((node) => {
      ids.push(node.id)
      if (node.children) {
        collectIds(node.children)
      }
    })
  }

  collectIds(nodes)
  return ids
}

/**
 * Get all checked node IDs
 */
export function getCheckedNodeIds(nodes: CheckboxTreeNode[]): string[] {
  const ids: string[] = []

  const collectCheckedIds = (nodeList: CheckboxTreeNode[]) => {
    nodeList.forEach((node) => {
      if (node.checked) {
        ids.push(node.id)
      }
      if (node.children) {
        collectCheckedIds(node.children)
      }
    })
  }

  collectCheckedIds(nodes)
  return ids
}

/**
 * Get all leaf node IDs (nodes without children)
 */
export function getLeafNodeIds(nodes: CheckboxTreeNode[]): string[] {
  const ids: string[] = []

  const collectLeafIds = (nodeList: CheckboxTreeNode[]) => {
    nodeList.forEach((node) => {
      if (!node.children || node.children.length === 0) {
        ids.push(node.id)
      } else {
        collectLeafIds(node.children)
      }
    })
  }

  collectLeafIds(nodes)
  return ids
}
