/**
 * DependencyGraph Component
 * REQ-2, TASK-15: Dependency Visualizer with Interactive Tree
 *
 * Displays requirement dependencies as an expandable tree with:
 * - Hierarchical tree view
 * - Dependency type indicators
 * - Click to view requirement details
 * - Requirement selection
 */

import React, { useState, useMemo } from 'react'
import { ChevronRight, ChevronDown, GitBranch, AlertTriangle, Info, Search } from 'lucide-react'
import {
  Stack,
  Row,
  Text,
  Input,
  Button,
  H3,
} from '@unicornlove/beyond-ui'
import {
  useComplianceRequirements,
  type ComplianceRequirement,
} from '../../../hooks/useComplianceRequirements'
import { trpc } from '../../../lib/trpc'
import { LoadingSpinner } from '../../Common/LoadingSpinner'

// =============================================================================
// Types
// =============================================================================

interface DependencyGraphProps {
  organizationId: string
  selectedRequirement: ComplianceRequirement | null
  onSelectRequirement: (requirement: ComplianceRequirement | null) => void
}

interface DependencyNode {
  id: string
  requirement_id: string
  name: string
  code: string
  type: string
  dependency_type: 'requires' | 'recommended' | 'alternative'
  children: DependencyNode[]
}

// =============================================================================
// Constants
// =============================================================================

const DEPENDENCY_TYPE_LABELS = {
  requires: 'Required',
  recommended: 'Recommended',
  alternative: 'Alternative',
}

function getDependencyColor(type: string): { bg: string; color: string; border: string } {
  switch (type) {
    case 'requires':
      return { bg: 'var(--color-red-2)', color: 'var(--color-red-10)', border: 'var(--color-red-6)' }
    case 'recommended':
      return { bg: 'var(--color-yellow-2)', color: 'var(--color-yellow-10)', border: 'var(--color-yellow-6)' }
    case 'alternative':
      return { bg: 'var(--color-blue-2)', color: 'var(--color-blue-10)', border: 'var(--color-blue-6)' }
    default:
      return { bg: 'var(--color-gray-2)', color: 'var(--color-gray-10)', border: 'var(--color-gray-6)' }
  }
}

// =============================================================================
// Tree Node Component
// =============================================================================

interface TreeNodeProps {
  node: DependencyNode
  level: number
  onSelect: (id: string) => void
}

function TreeNode({ node, level, onSelect }: TreeNodeProps) {
  const [isExpanded, setIsExpanded] = useState(level < 2)
  const hasChildren = node.children.length > 0

  const depColors = getDependencyColor(node.dependency_type)

  return (
    <Stack>
      <Row
        style={{
          alignItems: 'center',
          gap: 8,
          paddingTop: 8,
          paddingBottom: 8,
          paddingLeft: 12,
          paddingRight: 12,
          borderRadius: 12,
          cursor: 'pointer',
          backgroundColor: level === 0 ? 'var(--color-blue-2)' : 'transparent',
          borderWidth: level === 0 ? 1 : 0,
          borderColor: level === 0 ? 'var(--color-blue-6)' : 'transparent',
          marginLeft: level * 24,
          userSelect: 'none',
        }}
        onClick={() => onSelect(node.requirement_id)}
      >
        {hasChildren ? (
          <Button
            variant="ghost"
            style={{ padding: 4, borderRadius: 6 }}
            onClick={(e) => {
              e.stopPropagation()
              setIsExpanded(!isExpanded)
            }}
          >
            {isExpanded ? <ChevronDown size={16} /> : <ChevronRight size={16} />}
          </Button>
        ) : (
          <Stack style={{ width: 20 }} />
        )}

        <Stack>
          <GitBranch size={16} style={{ color: 'var(--color-gray-10)' }} />
        </Stack>

        <Text style={{ fontFamily: 'monospace', fontSize: 11, color: 'var(--color-gray-11)' }}>
          {node.code}
        </Text>
        <Text style={{ fontWeight: 600, fontSize: 14 }}>
          {node.name}
        </Text>

        {level > 0 && (
          <Text
            style={{
              fontSize: 11,
              paddingLeft: 8,
              paddingRight: 8,
              paddingTop: 4,
              paddingBottom: 4,
              borderRadius: 9999,
              borderWidth: 1,
              backgroundColor: depColors.bg,
              color: depColors.color,
              borderColor: depColors.border,
            }}
          >
            {DEPENDENCY_TYPE_LABELS[node.dependency_type]}
          </Text>
        )}
      </Row>

      {isExpanded && hasChildren && (
        <Stack style={{ marginLeft: 8, borderLeft: '1px solid var(--color-gray-6)' }}>
          {node.children.map((child) => (
            <TreeNode key={child.id} node={child} level={level + 1} onSelect={onSelect} />
          ))}
        </Stack>
      )}
    </Stack>
  )
}

// =============================================================================
// Main Component
// =============================================================================

export function DependencyGraph({
  organizationId,
  selectedRequirement,
  onSelectRequirement,
}: DependencyGraphProps) {
  const [searchQuery, setSearchQuery] = useState('')

  // Fetch all requirements for selection
  const { data: requirementsData, isLoading: isLoadingRequirements } = useComplianceRequirements({
    organizationId,
    pageSize: 100,
  })

  // Fetch dependency tree for selected requirement
  const dependencyTreeQuery = trpc.complianceDependencies.getDependencyTree.useQuery(
    {
      organizationId,
      requirementId: selectedRequirement?.id ?? '',
    },
    {
      enabled: !!selectedRequirement?.id,
    }
  )

  // Filter requirements by search
  const filteredRequirements = useMemo(() => {
    const requirements = requirementsData?.data ?? []
    if (!searchQuery) return requirements
    const query = searchQuery.toLowerCase()
    return requirements.filter(
      (r) => r.name.toLowerCase().includes(query) || r.code.toLowerCase().includes(query)
    )
  }, [requirementsData?.data, searchQuery])

  // Build tree from dependency data
  const dependencyTree = useMemo((): DependencyNode | null => {
    if (!selectedRequirement || !dependencyTreeQuery.data?.tree) return null

    const buildNode = (data: Record<string, unknown>): DependencyNode => ({
      id: data.id as string,
      requirement_id: data.requirement_id as string,
      name: data.name as string,
      code: data.code as string,
      type: data.type as string,
      dependency_type:
        (data.dependency_type as 'requires' | 'recommended' | 'alternative') || 'requires',
      children: ((data.children as Record<string, unknown>[]) ?? []).map(buildNode),
    })

    return {
      id: selectedRequirement.id,
      requirement_id: selectedRequirement.id,
      name: selectedRequirement.name,
      code: selectedRequirement.code,
      type: selectedRequirement.type,
      dependency_type: 'requires',
      children: dependencyTreeQuery.data.tree.children?.map(buildNode) ?? [],
    }
  }, [selectedRequirement, dependencyTreeQuery.data])

  // Handle requirement selection from tree
  const handleTreeSelect = (requirementId: string) => {
    const requirement = requirementsData?.data?.find((r) => r.id === requirementId)
    if (requirement) {
      onSelectRequirement(requirement)
    }
  }

  return (
    <Stack style={{ backgroundColor: 'var(--color-background)', borderRadius: 12, borderWidth: 1, borderColor: 'var(--color-border)' }}>
      <Row style={{ height: 600 }}>
        {/* Requirement Selector */}
        <Stack style={{ padding: 16, overflow: 'auto', flex: 1, borderRight: '1px solid var(--color-border)' }}>
          <H3 style={{ fontWeight: 600, color: 'var(--color-12)', marginBottom: 12 }}>
            Select Requirement
          </H3>

          {/* Search */}
          <Row style={{ position: 'relative', marginBottom: 12 }}>
            <Stack
              style={{
                position: 'absolute',
                left: 12,
                top: '50%',
                transform: 'translateY(-50%)',
                zIndex: 1,
                pointerEvents: 'none',
              }}
            >
              <Search size={16} style={{ color: 'var(--color-gray-10)' }} />
            </Stack>
            <Input
              style={{
                flex: 1,
                paddingLeft: 36,
                paddingRight: 12,
                paddingTop: 8,
                paddingBottom: 8,
                fontSize: 14,
                borderWidth: 1,
                borderColor: 'var(--color-gray-8)',
                borderRadius: 12,
              }}
              placeholder="Search requirements..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </Row>

          {/* Requirements List */}
          {isLoadingRequirements ? (
            <Stack style={{ alignItems: 'center', justifyContent: 'center', paddingTop: 32, paddingBottom: 32 }}>
              <LoadingSpinner size="sm" />
            </Stack>
          ) : (
            <Stack style={{ gap: 4 }}>
              {filteredRequirements.map((req) => (
                <Button
                  key={req.id}
                  variant="ghost"
                  style={{
                    width: '100%',
                    textAlign: 'left',
                    paddingLeft: 12,
                    paddingRight: 12,
                    paddingTop: 8,
                    paddingBottom: 8,
                    borderRadius: 12,
                    backgroundColor:
                      selectedRequirement?.id === req.id ? 'var(--color-blue-3)' : 'transparent',
                  }}
                  onClick={() => onSelectRequirement(req)}
                >
                  <Stack>
                    <Text style={{ fontWeight: 600, fontSize: 14, color: selectedRequirement?.id === req.id ? 'var(--color-blue-11)' : 'var(--color-12)' }}>
                      {req.name}
                    </Text>
                    <Text style={{ fontSize: 11, color: 'var(--color-gray-11)' }}>
                      {req.code}
                    </Text>
                  </Stack>
                </Button>
              ))}
              {filteredRequirements.length === 0 && (
                <Text style={{ fontSize: 14, color: 'var(--color-gray-11)', textAlign: 'center', paddingTop: 16, paddingBottom: 16 }}>
                  No requirements found
                </Text>
              )}
            </Stack>
          )}
        </Stack>

        {/* Dependency Tree */}
        <Stack style={{ flex: 2, padding: 16, overflow: 'auto' }}>
          <H3 style={{ fontWeight: 600, color: 'var(--color-12)', marginBottom: 12 }}>
            Dependency Tree
          </H3>

          {!selectedRequirement ? (
            <Stack
              style={{
                flex: 1,
                alignItems: 'center',
                justifyContent: 'center',
                color: 'var(--color-gray-11)',
              }}
            >
              <Stack style={{ marginBottom: 16 }}>
                <Info size={48} style={{ color: 'var(--color-gray-8)' }} />
              </Stack>
              <Text style={{ color: 'var(--color-gray-11)' }}>Select a requirement to view its dependencies</Text>
            </Stack>
          ) : dependencyTreeQuery.isLoading ? (
            <Stack style={{ flex: 1, alignItems: 'center', justifyContent: 'center' }}>
              <LoadingSpinner />
              <Text style={{ marginLeft: 8, color: 'var(--color-gray-11)' }}>
                Loading dependencies...
              </Text>
            </Stack>
          ) : dependencyTreeQuery.isError ? (
            <Stack
              style={{
                flex: 1,
                alignItems: 'center',
                justifyContent: 'center',
                color: 'var(--color-red-10)',
              }}
            >
              <Stack style={{ marginBottom: 16 }}>
                <AlertTriangle size={48} style={{ color: 'var(--color-red-10)' }} />
              </Stack>
              <Text style={{ color: 'var(--color-red-10)' }}>Failed to load dependencies</Text>
              <Text style={{ fontSize: 14, color: 'var(--color-gray-11)', marginTop: 4 }}>
                {dependencyTreeQuery.error?.message}
              </Text>
            </Stack>
          ) : dependencyTree ? (
            <Stack style={{ gap: 4 }}>
              <TreeNode node={dependencyTree} level={0} onSelect={handleTreeSelect} />
              {dependencyTree.children.length === 0 && (
                <Text style={{ fontSize: 14, color: 'var(--color-gray-11)', marginLeft: 24, marginTop: 16 }}>
                  This requirement has no dependencies
                </Text>
              )}
            </Stack>
          ) : null}

          {/* Legend */}
          {selectedRequirement && dependencyTree && dependencyTree.children.length > 0 && (
            <Stack style={{ marginTop: 24, paddingTop: 16, borderTop: '1px solid var(--color-border)' }}>
              <Text style={{ fontSize: 14, fontWeight: 600, color: 'var(--color-11)', marginBottom: 8 }}>
                Legend
              </Text>
              <Row style={{ alignItems: 'center', gap: 16, flexWrap: 'wrap' }}>
                <Text
                  style={{
                    fontSize: 11,
                    paddingLeft: 8,
                    paddingRight: 8,
                    paddingTop: 4,
                    paddingBottom: 4,
                    borderRadius: 9999,
                    borderWidth: 1,
                    backgroundColor: 'var(--color-red-2)',
                    color: 'var(--color-red-10)',
                    borderColor: 'var(--color-red-6)',
                  }}
                >
                  Required - Must be present
                </Text>
                <Text
                  style={{
                    fontSize: 11,
                    paddingLeft: 8,
                    paddingRight: 8,
                    paddingTop: 4,
                    paddingBottom: 4,
                    borderRadius: 9999,
                    borderWidth: 1,
                    backgroundColor: 'var(--color-yellow-2)',
                    color: 'var(--color-yellow-10)',
                    borderColor: 'var(--color-yellow-6)',
                  }}
                >
                  Recommended - Should have
                </Text>
                <Text
                  style={{
                    fontSize: 11,
                    paddingLeft: 8,
                    paddingRight: 8,
                    paddingTop: 4,
                    paddingBottom: 4,
                    borderRadius: 9999,
                    borderWidth: 1,
                    backgroundColor: 'var(--color-blue-2)',
                    color: 'var(--color-blue-10)',
                    borderColor: 'var(--color-blue-6)',
                  }}
                >
                  Alternative - One of many
                </Text>
              </Row>
            </Stack>
          )}
        </Stack>
      </Row>
    </Stack>
  )
}

export default DependencyGraph
