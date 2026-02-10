/**
 * Dependency Resolver
 * Algorithms for circular dependency detection and dependency tree building
 */

import type { DependencyType, RequirementDependency } from './dependency-types';

/**
 * Represents a node in the dependency tree
 */
export interface DependencyNode {
  /** The requirement ID */
  id: string;
  /** The requirement name */
  name: string;
  /** The requirement type (coverage type) */
  type: string;
  /** Dependencies of this node */
  children: DependencyNode[];
  /** Depth in the tree (0 = root) */
  depth: number;
  /** Dependency type from parent (null for root) */
  dependency_type: DependencyType | null;
}

/**
 * Error thrown when a circular dependency is detected
 */
export class CircularDependencyError extends Error {
  /** The cycle path as requirement IDs */
  public readonly cycle: string[];

  constructor(cycle: string[], message?: string) {
    const cycleStr = cycle.join(' → ');
    super(message ?? `Circular dependency detected: ${cycleStr}`);
    this.name = 'CircularDependencyError';
    this.cycle = cycle;
  }
}

/**
 * Simple requirement info used for tree building
 */
export interface RequirementInfo {
  id: string;
  name: string;
  type: string;
}

/**
 * Result of cycle validation
 */
export interface CycleValidationResult {
  /** Whether adding this dependency would create a cycle */
  would_create_cycle: boolean;
  /** The cycle path if a cycle would be created */
  cycle_path: string[] | null;
  /** Human-readable message */
  message: string;
}

/**
 * Validates that adding a dependency would not create a circular dependency
 *
 * @param requirementId - The requirement that would have the dependency
 * @param dependsOnId - The requirement being depended upon
 * @param dependencies - All existing dependencies (from database)
 * @param requirements - Map of requirement ID to info (from database)
 * @returns Validation result indicating if a cycle would be created
 */
export function validateNoCycles(
  requirementId: string,
  dependsOnId: string,
  dependencies: RequirementDependency[],
  requirements: Map<string, RequirementInfo>
): CycleValidationResult {
  // Self-reference is always a cycle
  if (requirementId === dependsOnId) {
    return {
      would_create_cycle: true,
      cycle_path: [requirementId, dependsOnId],
      message: 'A requirement cannot depend on itself',
    };
  }

  // Build adjacency list from existing dependencies
  const adjacencyList = buildAdjacencyList(dependencies);

  // Temporarily add the proposed dependency
  if (!adjacencyList.has(requirementId)) {
    adjacencyList.set(requirementId, []);
  }
  adjacencyList.get(requirementId)!.push(dependsOnId);

  // Check for cycles using DFS from the requirement
  const visited = new Set<string>();
  const recursionStack = new Set<string>();
  const path: string[] = [];

  const cyclePath = detectCycle(requirementId, adjacencyList, visited, recursionStack, path);

  if (cyclePath) {
    const reqNames = cyclePath.map((id) => requirements.get(id)?.name ?? id);
    return {
      would_create_cycle: true,
      cycle_path: cyclePath,
      message: `Adding this dependency would create a circular reference: ${reqNames.join(' → ')}`,
    };
  }

  return {
    would_create_cycle: false,
    cycle_path: null,
    message: 'No circular dependency would be created',
  };
}

/**
 * Builds a complete dependency tree for a requirement
 *
 * @param requirementId - The root requirement ID
 * @param dependencies - All dependencies (from database)
 * @param requirements - Map of requirement ID to info (from database)
 * @param maxDepth - Maximum tree depth (default 10, prevents deep recursion)
 * @returns The dependency tree rooted at the requirement
 * @throws CircularDependencyError if a cycle is detected
 */
export function getDependencyTree(
  requirementId: string,
  dependencies: RequirementDependency[],
  requirements: Map<string, RequirementInfo>,
  maxDepth: number = 10
): DependencyNode {
  const adjacencyList = buildAdjacencyList(dependencies);
  const dependencyTypeMap = buildDependencyTypeMap(dependencies);
  const visited = new Set<string>();

  return buildTreeRecursive(
    requirementId,
    adjacencyList,
    dependencyTypeMap,
    requirements,
    visited,
    0,
    maxDepth,
    null
  );
}

/**
 * Gets all requirements that depend on a given requirement (reverse lookup)
 *
 * @param requirementId - The requirement to find dependents for
 * @param dependencies - All dependencies (from database)
 * @returns Array of requirement IDs that depend on this requirement
 */
export function getDependents(
  requirementId: string,
  dependencies: RequirementDependency[]
): string[] {
  const dependents: string[] = [];

  for (const dep of dependencies) {
    if (dep.depends_on_id === requirementId) {
      dependents.push(dep.requirement_id);
    }
  }

  return dependents;
}

/**
 * Gets the depth of the dependency tree (longest path from root to leaf)
 *
 * @param tree - The dependency tree
 * @returns Maximum depth of the tree
 */
export function getTreeDepth(tree: DependencyNode): number {
  if (tree.children.length === 0) {
    return tree.depth;
  }

  let maxChildDepth = tree.depth;
  for (const child of tree.children) {
    const childDepth = getTreeDepth(child);
    if (childDepth > maxChildDepth) {
      maxChildDepth = childDepth;
    }
  }

  return maxChildDepth;
}

/**
 * Flattens a dependency tree into an array of nodes (breadth-first order)
 *
 * @param tree - The dependency tree
 * @returns Array of all nodes in the tree
 */
export function flattenTree(tree: DependencyNode): DependencyNode[] {
  const result: DependencyNode[] = [];
  const queue: DependencyNode[] = [tree];

  while (queue.length > 0) {
    const node = queue.shift()!;
    result.push(node);
    queue.push(...node.children);
  }

  return result;
}

/**
 * Gets all unique requirement IDs in a dependency tree
 *
 * @param tree - The dependency tree
 * @returns Set of all requirement IDs
 */
export function getTreeRequirementIds(tree: DependencyNode): Set<string> {
  const ids = new Set<string>();
  const nodes = flattenTree(tree);

  for (const node of nodes) {
    ids.add(node.id);
  }

  return ids;
}

// ============================================================================
// INTERNAL HELPERS
// ============================================================================

/**
 * Builds an adjacency list from dependency records
 */
function buildAdjacencyList(
  dependencies: RequirementDependency[]
): Map<string, string[]> {
  const adjacencyList = new Map<string, string[]>();

  for (const dep of dependencies) {
    if (!adjacencyList.has(dep.requirement_id)) {
      adjacencyList.set(dep.requirement_id, []);
    }
    adjacencyList.get(dep.requirement_id)!.push(dep.depends_on_id);
  }

  return adjacencyList;
}

/**
 * Builds a map of (requirement_id, depends_on_id) -> dependency_type
 */
function buildDependencyTypeMap(
  dependencies: RequirementDependency[]
): Map<string, DependencyType> {
  const typeMap = new Map<string, DependencyType>();

  for (const dep of dependencies) {
    const key = `${dep.requirement_id}:${dep.depends_on_id}`;
    typeMap.set(key, dep.dependency_type);
  }

  return typeMap;
}

/**
 * Detects a cycle using DFS
 * Returns the cycle path if found, null otherwise
 */
function detectCycle(
  nodeId: string,
  adjacencyList: Map<string, string[]>,
  visited: Set<string>,
  recursionStack: Set<string>,
  path: string[]
): string[] | null {
  visited.add(nodeId);
  recursionStack.add(nodeId);
  path.push(nodeId);

  const neighbors = adjacencyList.get(nodeId) ?? [];

  for (const neighbor of neighbors) {
    if (!visited.has(neighbor)) {
      const cyclePath = detectCycle(neighbor, adjacencyList, visited, recursionStack, path);
      if (cyclePath) {
        return cyclePath;
      }
    } else if (recursionStack.has(neighbor)) {
      // Found a back edge - cycle detected
      // Extract the cycle from the path
      const cycleStart = path.indexOf(neighbor);
      const cyclePath = path.slice(cycleStart);
      cyclePath.push(neighbor); // Close the cycle
      return cyclePath;
    }
  }

  recursionStack.delete(nodeId);
  path.pop();
  return null;
}

/**
 * Recursively builds the dependency tree
 */
function buildTreeRecursive(
  nodeId: string,
  adjacencyList: Map<string, string[]>,
  dependencyTypeMap: Map<string, DependencyType>,
  requirements: Map<string, RequirementInfo>,
  visited: Set<string>,
  depth: number,
  maxDepth: number,
  parentDependencyType: DependencyType | null
): DependencyNode {
  // Check for cycle
  if (visited.has(nodeId)) {
    throw new CircularDependencyError(
      [...visited, nodeId],
      `Circular dependency detected at ${nodeId}`
    );
  }

  // Check max depth
  if (depth > maxDepth) {
    const reqInfo = requirements.get(nodeId);
    return {
      id: nodeId,
      name: reqInfo?.name ?? 'Unknown',
      type: reqInfo?.type ?? 'unknown',
      children: [], // Stop recursion at max depth
      depth,
      dependency_type: parentDependencyType,
    };
  }

  visited.add(nodeId);

  const reqInfo = requirements.get(nodeId);
  const childIds = adjacencyList.get(nodeId) ?? [];

  const children: DependencyNode[] = [];
  for (const childId of childIds) {
    // Don't recurse if child would exceed max depth
    if (depth + 1 > maxDepth) {
      continue;
    }
    const depTypeKey = `${nodeId}:${childId}`;
    const depType = dependencyTypeMap.get(depTypeKey) ?? null;

    // Create a new visited set for each branch to allow diamond patterns (A->B, A->C, B->D, C->D)
    const branchVisited = new Set(visited);

    try {
      const childNode = buildTreeRecursive(
        childId,
        adjacencyList,
        dependencyTypeMap,
        requirements,
        branchVisited,
        depth + 1,
        maxDepth,
        depType
      );
      children.push(childNode);
    } catch (error) {
      if (error instanceof CircularDependencyError) {
        throw error;
      }
      throw error;
    }
  }

  visited.delete(nodeId); // Allow node to appear in different branches

  return {
    id: nodeId,
    name: reqInfo?.name ?? 'Unknown',
    type: reqInfo?.type ?? 'unknown',
    children,
    depth,
    dependency_type: parentDependencyType,
  };
}
