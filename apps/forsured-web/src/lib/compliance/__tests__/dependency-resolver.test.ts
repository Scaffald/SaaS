/**
 * REQ-2, TASK-5: Dependency Resolver Tests
 * Tests for circular dependency detection and tree resolution
 */

import { describe, expect, it } from 'vitest';
import {
  CircularDependencyError,
  flattenTree,
  getDependencyTree,
  getDependents,
  getTreeDepth,
  getTreeRequirementIds,
  RequirementInfo,
  validateNoCycles,
} from '../dependency-resolver';
import { DependencyType, RequirementDependency } from '../dependency-types';

// Helper to create mock dependencies
function createDependency(
  id: string,
  requirementId: string,
  dependsOnId: string,
  type: DependencyType = DependencyType.REQUIRES
): RequirementDependency {
  return {
    id,
    requirement_id: requirementId,
    depends_on_id: dependsOnId,
    dependency_type: type,
    condition: null,
    notes: null,
    created_at: new Date().toISOString(),
  };
}

// Helper to create requirement info map
function createRequirements(
  items: Array<{ id: string; name: string; type: string }>
): Map<string, RequirementInfo> {
  const map = new Map<string, RequirementInfo>();
  for (const item of items) {
    map.set(item.id, item);
  }
  return map;
}

describe('dependency-resolver', () => {
  describe('validateNoCycles', () => {
    it('detects self-reference as a cycle', () => {
      const result = validateNoCycles('req-a', 'req-a', [], new Map());

      expect(result.would_create_cycle).toBe(true);
      expect(result.message).toContain('cannot depend on itself');
    });

    it('returns valid when no cycle exists', () => {
      const dependencies: RequirementDependency[] = [];
      const requirements = createRequirements([
        { id: 'req-a', name: 'Requirement A', type: 'general_liability' },
        { id: 'req-b', name: 'Requirement B', type: 'umbrella' },
      ]);

      const result = validateNoCycles('req-b', 'req-a', dependencies, requirements);

      expect(result.would_create_cycle).toBe(false);
      expect(result.cycle_path).toBeNull();
    });

    it('detects simple two-node cycle', () => {
      // A depends on B, now trying to make B depend on A
      const dependencies = [createDependency('dep-1', 'req-a', 'req-b')];
      const requirements = createRequirements([
        { id: 'req-a', name: 'Requirement A', type: 'general_liability' },
        { id: 'req-b', name: 'Requirement B', type: 'umbrella' },
      ]);

      const result = validateNoCycles('req-b', 'req-a', dependencies, requirements);

      expect(result.would_create_cycle).toBe(true);
      expect(result.cycle_path).toBeDefined();
      expect(result.message).toContain('circular reference');
    });

    it('detects three-node cycle', () => {
      // A -> B -> C, now trying to make C -> A
      const dependencies = [
        createDependency('dep-1', 'req-a', 'req-b'),
        createDependency('dep-2', 'req-b', 'req-c'),
      ];
      const requirements = createRequirements([
        { id: 'req-a', name: 'Requirement A', type: 'general_liability' },
        { id: 'req-b', name: 'Requirement B', type: 'auto_liability' },
        { id: 'req-c', name: 'Requirement C', type: 'umbrella' },
      ]);

      const result = validateNoCycles('req-c', 'req-a', dependencies, requirements);

      expect(result.would_create_cycle).toBe(true);
      expect(result.cycle_path).toBeDefined();
    });

    it('allows diamond dependency pattern (not a cycle)', () => {
      // A -> B, A -> C, B -> D, C -> D (diamond, not cycle)
      const dependencies = [
        createDependency('dep-1', 'req-a', 'req-b'),
        createDependency('dep-2', 'req-a', 'req-c'),
        createDependency('dep-3', 'req-b', 'req-d'),
        createDependency('dep-4', 'req-c', 'req-d'),
      ];
      const requirements = createRequirements([
        { id: 'req-a', name: 'A', type: 'umbrella' },
        { id: 'req-b', name: 'B', type: 'general_liability' },
        { id: 'req-c', name: 'C', type: 'auto_liability' },
        { id: 'req-d', name: 'D', type: 'workers_comp' },
      ]);

      // Adding E that depends on A should be fine
      const result = validateNoCycles('req-e', 'req-a', dependencies, requirements);

      expect(result.would_create_cycle).toBe(false);
    });

    it('detects cycle in complex graph', () => {
      // A -> B -> C -> D -> B (cycle in the middle)
      const dependencies = [
        createDependency('dep-1', 'req-a', 'req-b'),
        createDependency('dep-2', 'req-b', 'req-c'),
        createDependency('dep-3', 'req-c', 'req-d'),
      ];
      const requirements = createRequirements([
        { id: 'req-a', name: 'A', type: 'umbrella' },
        { id: 'req-b', name: 'B', type: 'general_liability' },
        { id: 'req-c', name: 'C', type: 'auto_liability' },
        { id: 'req-d', name: 'D', type: 'workers_comp' },
      ]);

      // Trying to make D -> B creates a cycle B -> C -> D -> B
      const result = validateNoCycles('req-d', 'req-b', dependencies, requirements);

      expect(result.would_create_cycle).toBe(true);
    });
  });

  describe('getDependencyTree', () => {
    it('builds tree for single node with no dependencies', () => {
      const requirements = createRequirements([
        { id: 'req-a', name: 'Requirement A', type: 'general_liability' },
      ]);

      const tree = getDependencyTree('req-a', [], requirements);

      expect(tree.id).toBe('req-a');
      expect(tree.name).toBe('Requirement A');
      expect(tree.children).toHaveLength(0);
      expect(tree.depth).toBe(0);
    });

    it('builds tree with single dependency', () => {
      const dependencies = [createDependency('dep-1', 'req-a', 'req-b')];
      const requirements = createRequirements([
        { id: 'req-a', name: 'Umbrella', type: 'umbrella' },
        { id: 'req-b', name: 'General Liability', type: 'general_liability' },
      ]);

      const tree = getDependencyTree('req-a', dependencies, requirements);

      expect(tree.id).toBe('req-a');
      expect(tree.children).toHaveLength(1);
      expect(tree.children[0].id).toBe('req-b');
      expect(tree.children[0].depth).toBe(1);
    });

    it('builds tree with multiple dependencies', () => {
      const dependencies = [
        createDependency('dep-1', 'req-umbrella', 'req-gl'),
        createDependency('dep-2', 'req-umbrella', 'req-auto'),
        createDependency('dep-3', 'req-umbrella', 'req-el'),
      ];
      const requirements = createRequirements([
        { id: 'req-umbrella', name: 'Umbrella $5M', type: 'umbrella' },
        { id: 'req-gl', name: 'GL $2M', type: 'general_liability' },
        { id: 'req-auto', name: 'Auto $1M', type: 'auto_liability' },
        { id: 'req-el', name: 'EL $1M', type: 'employers_liability' },
      ]);

      const tree = getDependencyTree('req-umbrella', dependencies, requirements);

      expect(tree.children).toHaveLength(3);
      expect(tree.children.map((c) => c.id).sort()).toEqual([
        'req-auto',
        'req-el',
        'req-gl',
      ]);
    });

    it('builds nested dependency tree', () => {
      // Umbrella -> GL -> Additional Insured
      const dependencies = [
        createDependency('dep-1', 'req-umbrella', 'req-gl'),
        createDependency('dep-2', 'req-gl', 'req-ai'),
      ];
      const requirements = createRequirements([
        { id: 'req-umbrella', name: 'Umbrella', type: 'umbrella' },
        { id: 'req-gl', name: 'GL', type: 'general_liability' },
        { id: 'req-ai', name: 'Additional Insured', type: 'custom' },
      ]);

      const tree = getDependencyTree('req-umbrella', dependencies, requirements);

      expect(tree.children).toHaveLength(1);
      expect(tree.children[0].id).toBe('req-gl');
      expect(tree.children[0].children).toHaveLength(1);
      expect(tree.children[0].children[0].id).toBe('req-ai');
      expect(tree.children[0].children[0].depth).toBe(2);
    });

    it('handles diamond pattern correctly', () => {
      // A -> B, A -> C, B -> D, C -> D
      const dependencies = [
        createDependency('dep-1', 'req-a', 'req-b'),
        createDependency('dep-2', 'req-a', 'req-c'),
        createDependency('dep-3', 'req-b', 'req-d'),
        createDependency('dep-4', 'req-c', 'req-d'),
      ];
      const requirements = createRequirements([
        { id: 'req-a', name: 'A', type: 'umbrella' },
        { id: 'req-b', name: 'B', type: 'general_liability' },
        { id: 'req-c', name: 'C', type: 'auto_liability' },
        { id: 'req-d', name: 'D', type: 'workers_comp' },
      ]);

      const tree = getDependencyTree('req-a', dependencies, requirements);

      expect(tree.children).toHaveLength(2);
      // D should appear twice (once under B, once under C)
      const allIds = getTreeRequirementIds(tree);
      expect(allIds.has('req-d')).toBe(true);
    });

    it('throws CircularDependencyError on cycle', () => {
      // A -> B -> A (cycle)
      const dependencies = [
        createDependency('dep-1', 'req-a', 'req-b'),
        createDependency('dep-2', 'req-b', 'req-a'),
      ];
      const requirements = createRequirements([
        { id: 'req-a', name: 'A', type: 'general_liability' },
        { id: 'req-b', name: 'B', type: 'umbrella' },
      ]);

      expect(() => getDependencyTree('req-a', dependencies, requirements)).toThrow(
        CircularDependencyError
      );
    });

    it('respects max depth limit', () => {
      // Chain: A -> B -> C -> D -> E -> F
      const dependencies = [
        createDependency('dep-1', 'req-a', 'req-b'),
        createDependency('dep-2', 'req-b', 'req-c'),
        createDependency('dep-3', 'req-c', 'req-d'),
        createDependency('dep-4', 'req-d', 'req-e'),
        createDependency('dep-5', 'req-e', 'req-f'),
      ];
      const requirements = createRequirements([
        { id: 'req-a', name: 'A', type: 'umbrella' },
        { id: 'req-b', name: 'B', type: 'general_liability' },
        { id: 'req-c', name: 'C', type: 'auto_liability' },
        { id: 'req-d', name: 'D', type: 'workers_comp' },
        { id: 'req-e', name: 'E', type: 'custom' },
        { id: 'req-f', name: 'F', type: 'custom' },
      ]);

      // With max depth 2, should only go A -> B -> C
      const tree = getDependencyTree('req-a', dependencies, requirements, 2);
      const maxDepth = getTreeDepth(tree);

      expect(maxDepth).toBeLessThanOrEqual(2);
    });
  });

  describe('getDependents', () => {
    it('returns empty array when no dependents', () => {
      const dependencies = [createDependency('dep-1', 'req-a', 'req-b')];

      const dependents = getDependents('req-a', dependencies);

      expect(dependents).toHaveLength(0);
    });

    it('finds direct dependents', () => {
      const dependencies = [
        createDependency('dep-1', 'req-a', 'req-b'),
        createDependency('dep-2', 'req-c', 'req-b'),
      ];

      const dependents = getDependents('req-b', dependencies);

      expect(dependents).toHaveLength(2);
      expect(dependents).toContain('req-a');
      expect(dependents).toContain('req-c');
    });
  });

  describe('getTreeDepth', () => {
    it('returns 0 for single node', () => {
      const tree = {
        id: 'req-a',
        name: 'A',
        type: 'umbrella',
        children: [],
        depth: 0,
        dependency_type: null,
      };

      expect(getTreeDepth(tree)).toBe(0);
    });

    it('returns correct depth for nested tree', () => {
      const tree = {
        id: 'req-a',
        name: 'A',
        type: 'umbrella',
        children: [
          {
            id: 'req-b',
            name: 'B',
            type: 'gl',
            children: [
              {
                id: 'req-c',
                name: 'C',
                type: 'auto',
                children: [],
                depth: 2,
                dependency_type: DependencyType.REQUIRES,
              },
            ],
            depth: 1,
            dependency_type: DependencyType.REQUIRES,
          },
        ],
        depth: 0,
        dependency_type: null,
      };

      expect(getTreeDepth(tree)).toBe(2);
    });
  });

  describe('flattenTree', () => {
    it('returns single node for root-only tree', () => {
      const tree = {
        id: 'req-a',
        name: 'A',
        type: 'umbrella',
        children: [],
        depth: 0,
        dependency_type: null,
      };

      const flat = flattenTree(tree);

      expect(flat).toHaveLength(1);
      expect(flat[0].id).toBe('req-a');
    });

    it('flattens in breadth-first order', () => {
      const tree = {
        id: 'req-a',
        name: 'A',
        type: 'umbrella',
        children: [
          {
            id: 'req-b',
            name: 'B',
            type: 'gl',
            children: [
              {
                id: 'req-d',
                name: 'D',
                type: 'custom',
                children: [],
                depth: 2,
                dependency_type: DependencyType.REQUIRES,
              },
            ],
            depth: 1,
            dependency_type: DependencyType.REQUIRES,
          },
          {
            id: 'req-c',
            name: 'C',
            type: 'auto',
            children: [],
            depth: 1,
            dependency_type: DependencyType.REQUIRES,
          },
        ],
        depth: 0,
        dependency_type: null,
      };

      const flat = flattenTree(tree);
      const ids = flat.map((n) => n.id);

      // Breadth-first: A, then B and C, then D
      expect(ids.indexOf('req-a')).toBeLessThan(ids.indexOf('req-b'));
      expect(ids.indexOf('req-a')).toBeLessThan(ids.indexOf('req-c'));
      expect(ids.indexOf('req-b')).toBeLessThan(ids.indexOf('req-d'));
      expect(ids.indexOf('req-c')).toBeLessThan(ids.indexOf('req-d'));
    });
  });

  describe('getTreeRequirementIds', () => {
    it('returns all unique IDs', () => {
      const tree = {
        id: 'req-a',
        name: 'A',
        type: 'umbrella',
        children: [
          {
            id: 'req-b',
            name: 'B',
            type: 'gl',
            children: [],
            depth: 1,
            dependency_type: DependencyType.REQUIRES,
          },
          {
            id: 'req-c',
            name: 'C',
            type: 'auto',
            children: [],
            depth: 1,
            dependency_type: DependencyType.REQUIRES,
          },
        ],
        depth: 0,
        dependency_type: null,
      };

      const ids = getTreeRequirementIds(tree);

      expect(ids.size).toBe(3);
      expect(ids.has('req-a')).toBe(true);
      expect(ids.has('req-b')).toBe(true);
      expect(ids.has('req-c')).toBe(true);
    });
  });

  describe('CircularDependencyError', () => {
    it('includes cycle path in error', () => {
      const error = new CircularDependencyError(['A', 'B', 'C', 'A']);

      expect(error.cycle).toEqual(['A', 'B', 'C', 'A']);
      expect(error.message).toContain('A → B → C → A');
    });

    it('allows custom message', () => {
      const error = new CircularDependencyError(['A', 'B'], 'Custom error message');

      expect(error.message).toBe('Custom error message');
      expect(error.cycle).toEqual(['A', 'B']);
    });
  });

  describe('performance', () => {
    it('handles large trees efficiently (<500ms for 100 nodes)', () => {
      // Create a wide tree with 100 nodes (1 root + 10 children each with 9 grandchildren)
      const dependencies: RequirementDependency[] = [];
      const reqList: Array<{ id: string; name: string; type: string }> = [
        { id: 'root', name: 'Root', type: 'umbrella' },
      ];

      // Create 10 direct children
      for (let i = 0; i < 10; i++) {
        const childId = `child-${i}`;
        reqList.push({ id: childId, name: `Child ${i}`, type: 'general_liability' });
        dependencies.push(createDependency(`dep-${i}`, 'root', childId));

        // Each child has 9 grandchildren
        for (let j = 0; j < 9; j++) {
          const grandchildId = `grandchild-${i}-${j}`;
          reqList.push({ id: grandchildId, name: `Grandchild ${i}-${j}`, type: 'auto_liability' });
          dependencies.push(createDependency(`dep-${i}-${j}`, childId, grandchildId));
        }
      }

      const requirements = createRequirements(reqList);

      const startTime = Date.now();
      const tree = getDependencyTree('root', dependencies, requirements);
      const duration = Date.now() - startTime;

      // Should complete in under 500ms
      expect(duration).toBeLessThan(500);

      // Verify tree structure
      expect(tree.children).toHaveLength(10);
      expect(tree.children[0].children).toHaveLength(9);
    });
  });
});
