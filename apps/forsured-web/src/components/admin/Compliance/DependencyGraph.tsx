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

import { useState, useMemo } from 'react'
import { ChevronRight, ChevronDown, GitBranch, AlertTriangle, Info, Search } from 'lucide-react'
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

const DEPENDENCY_TYPE_COLORS = {
  requires: 'text-red-600 bg-red-50 border-red-200',
  recommended: 'text-yellow-600 bg-yellow-50 border-yellow-200',
  alternative: 'text-blue-600 bg-blue-50 border-blue-200',
}

const DEPENDENCY_TYPE_LABELS = {
  requires: 'Required',
  recommended: 'Recommended',
  alternative: 'Alternative',
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

  return (
    <div className="select-none">
      <div
        className={`flex items-center gap-2 py-2 px-3 rounded-lg cursor-pointer hover:bg-gray-50 ${
          level === 0 ? 'bg-blue-50 border border-blue-200' : ''
        }`}
        style={{ marginLeft: `${level * 24}px` }}
        onClick={() => onSelect(node.requirement_id)}
      >
        {hasChildren ? (
          <button
            onClick={(e) => {
              e.stopPropagation()
              setIsExpanded(!isExpanded)
            }}
            className="p-0.5 hover:bg-gray-200 rounded"
          >
            {isExpanded ? <ChevronDown size={16} /> : <ChevronRight size={16} />}
          </button>
        ) : (
          <span className="w-5" />
        )}

        <GitBranch size={16} className="text-gray-400" />

        <span className="font-mono text-xs text-gray-500">{node.code}</span>
        <span className="font-medium text-sm">{node.name}</span>

        {level > 0 && (
          <span
            className={`text-xs px-2 py-0.5 rounded-full border ${
              DEPENDENCY_TYPE_COLORS[node.dependency_type]
            }`}
          >
            {DEPENDENCY_TYPE_LABELS[node.dependency_type]}
          </span>
        )}
      </div>

      {isExpanded && hasChildren && (
        <div className="ml-2 border-l border-gray-200">
          {node.children.map((child) => (
            <TreeNode key={child.id} node={child} level={level + 1} onSelect={onSelect} />
          ))}
        </div>
      )}
    </div>
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
    <div className="bg-white rounded-lg border">
      <div className="grid grid-cols-3 divide-x h-[600px]">
        {/* Requirement Selector */}
        <div className="p-4 overflow-y-auto">
          <h3 className="font-semibold text-gray-900 mb-3">Select Requirement</h3>

          {/* Search */}
          <div className="relative mb-3">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={16} />
            <input
              type="text"
              placeholder="Search requirements..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-3 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          {/* Requirements List */}
          {isLoadingRequirements ? (
            <div className="flex items-center justify-center py-8">
              <LoadingSpinner size="sm" />
            </div>
          ) : (
            <div className="space-y-1">
              {filteredRequirements.map((req) => (
                <button
                  key={req.id}
                  onClick={() => onSelectRequirement(req)}
                  className={`w-full text-left px-3 py-2 rounded-lg text-sm ${
                    selectedRequirement?.id === req.id
                      ? 'bg-blue-100 text-blue-700'
                      : 'hover:bg-gray-50'
                  }`}
                >
                  <div className="font-medium">{req.name}</div>
                  <div className="text-xs text-gray-500">{req.code}</div>
                </button>
              ))}
              {filteredRequirements.length === 0 && (
                <p className="text-sm text-gray-500 text-center py-4">No requirements found</p>
              )}
            </div>
          )}
        </div>

        {/* Dependency Tree */}
        <div className="col-span-2 p-4 overflow-y-auto">
          <h3 className="font-semibold text-gray-900 mb-3">Dependency Tree</h3>

          {!selectedRequirement ? (
            <div className="flex flex-col items-center justify-center h-full text-gray-500">
              <Info size={48} className="mb-4 text-gray-300" />
              <p>Select a requirement to view its dependencies</p>
            </div>
          ) : dependencyTreeQuery.isLoading ? (
            <div className="flex items-center justify-center h-full">
              <LoadingSpinner />
              <span className="ml-2 text-gray-500">Loading dependencies...</span>
            </div>
          ) : dependencyTreeQuery.isError ? (
            <div className="flex flex-col items-center justify-center h-full text-red-500">
              <AlertTriangle size={48} className="mb-4" />
              <p>Failed to load dependencies</p>
              <p className="text-sm text-gray-500 mt-1">{dependencyTreeQuery.error?.message}</p>
            </div>
          ) : dependencyTree ? (
            <div className="space-y-1">
              <TreeNode node={dependencyTree} level={0} onSelect={handleTreeSelect} />
              {dependencyTree.children.length === 0 && (
                <p className="text-sm text-gray-500 ml-6 mt-4">
                  This requirement has no dependencies
                </p>
              )}
            </div>
          ) : null}

          {/* Legend */}
          {selectedRequirement && dependencyTree && dependencyTree.children.length > 0 && (
            <div className="mt-6 pt-4 border-t">
              <h4 className="text-sm font-medium text-gray-700 mb-2">Legend</h4>
              <div className="flex items-center gap-4 text-xs">
                <span
                  className={`px-2 py-1 rounded-full border ${DEPENDENCY_TYPE_COLORS.requires}`}
                >
                  Required - Must be present
                </span>
                <span
                  className={`px-2 py-1 rounded-full border ${DEPENDENCY_TYPE_COLORS.recommended}`}
                >
                  Recommended - Should have
                </span>
                <span
                  className={`px-2 py-1 rounded-full border ${DEPENDENCY_TYPE_COLORS.alternative}`}
                >
                  Alternative - One of many
                </span>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

export default DependencyGraph
