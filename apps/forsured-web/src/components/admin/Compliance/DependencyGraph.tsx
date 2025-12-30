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
  YStack,
  XStack,
  Text,
  Input,
  Button,
  H3,
} from '@unicornlove/ui'
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

  const getDependencyColor = (type: string) => {
    switch (type) {
      case 'requires':
        return { bg: '$red2', color: '$red10', border: '$red6' }
      case 'recommended':
        return { bg: '$yellow2', color: '$yellow10', border: '$yellow6' }
      case 'alternative':
        return { bg: '$blue2', color: '$blue10', border: '$blue6' }
      default:
        return { bg: '$gray2', color: '$gray10', border: '$gray6' }
    }
  }

  const depColors = getDependencyColor(node.dependency_type)

  return (
    <YStack>
      <XStack
        alignItems="center"
        gap="$2"
        paddingVertical="$2"
        paddingHorizontal="$3"
        borderRadius="$4"
        cursor="pointer"
        hoverStyle={{ backgroundColor: '$gray2' }}
        backgroundColor={level === 0 ? '$blue2' : 'transparent'}
        borderWidth={level === 0 ? 1 : 0}
        borderColor={level === 0 ? '$blue6' : 'transparent'}
        ml={level * 24}
        onPress={() => onSelect(node.requirement_id)}
        userSelect="none"
      >
        {hasChildren ? (
          <Button
            unstyled
            padding="$1"
            hoverStyle={{ backgroundColor: '$gray4' }}
            borderRadius="$2"
            onPress={(e) => {
              e.stopPropagation()
              setIsExpanded(!isExpanded)
            }}
          >
            {isExpanded ? <ChevronDown size={16} /> : <ChevronRight size={16} />}
          </Button>
        ) : (
          <XStack width={20} />
        )}

        <YStack>
          <GitBranch size={16} style={{ color: 'var(--color-gray-10)' }} />
        </YStack>

        <Text fontFamily="$mono" fontSize="$1" color="$gray11">
          {node.code}
        </Text>
        <Text fontWeight="600" fontSize="$3">
          {node.name}
        </Text>

        {level > 0 && (
          <Text
            fontSize="$1"
            paddingHorizontal="$2"
            paddingVertical="$1"
            borderRadius={9999}
            borderWidth={1}
            backgroundColor={depColors.bg}
            color={depColors.color}
            borderColor={depColors.border}
          >
            {DEPENDENCY_TYPE_LABELS[node.dependency_type]}
          </Text>
        )}
      </XStack>

      {isExpanded && hasChildren && (
        <YStack ml="$2" borderLeftWidth={1} borderColor="$gray6">
          {node.children.map((child) => (
            <TreeNode key={child.id} node={child} level={level + 1} onSelect={onSelect} />
          ))}
        </YStack>
      )}
    </YStack>
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
    <YStack backgroundColor="$background" borderRadius="$4" borderWidth={1} borderColor="$borderColor">
      <XStack height={600}>
        {/* Requirement Selector */}
        <YStack padding="$4" overflow="scroll" flex={1} borderRightWidth={1} borderColor="$borderColor">
          <H3 fontWeight="600" color="$color12" mb="$3">
            Select Requirement
          </H3>

          {/* Search */}
          <XStack position="relative" mb="$3">
            <YStack
              position="absolute"
              left="$3"
              top="50%"
              zIndex={1}
              pointerEvents="none"
            >
              <Search size={16} style={{ color: 'var(--color-gray-10)' }} />
            </YStack>
            <Input
              flex={1}
              paddingLeft="$9"
              paddingRight="$3"
              paddingVertical="$2"
              fontSize="$3"
              borderWidth={1}
              borderColor="$gray8"
              borderRadius="$4"
              placeholder="Search requirements..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </XStack>

          {/* Requirements List */}
          {isLoadingRequirements ? (
            <YStack alignItems="center" justifyContent="center" paddingVertical="$8">
              <LoadingSpinner size="sm" />
            </YStack>
          ) : (
            <YStack gap="$1">
              {filteredRequirements.map((req) => (
                <Button
                  key={req.id}
                  unstyled
                  width="100%"
                  style={{ textAlign: 'left' }}
                  paddingHorizontal="$3"
                  paddingVertical="$2"
                  borderRadius="$4"
                  backgroundColor={
                    selectedRequirement?.id === req.id ? '$blue3' : 'transparent'
                  }
                  hoverStyle={{ backgroundColor: '$gray2' }}
                  onPress={() => onSelectRequirement(req)}
                >
                  <YStack>
                    <Text fontWeight="600" fontSize="$3" color={selectedRequirement?.id === req.id ? '$blue11' : '$color12'}>
                      {req.name}
                    </Text>
                    <Text fontSize="$1" color="$gray11">
                      {req.code}
                    </Text>
                  </YStack>
                </Button>
              ))}
              {filteredRequirements.length === 0 && (
                <Text fontSize="$3" color="$gray11" style={{ textAlign: 'center' }} paddingVertical="$4">
                  No requirements found
                </Text>
              )}
            </YStack>
          )}
        </YStack>

        {/* Dependency Tree */}
        <YStack flex={2} padding="$4" overflow="scroll">
          <H3 fontWeight="600" color="$color12" mb="$3">
            Dependency Tree
          </H3>

          {!selectedRequirement ? (
            <YStack
              flex={1}
              alignItems="center"
              justifyContent="center"
              color="$gray11"
            >
              <YStack mb="$4">
                <Info size={48} style={{ color: 'var(--color-gray-8)' }} />
              </YStack>
              <Text color="$gray11">Select a requirement to view its dependencies</Text>
            </YStack>
          ) : dependencyTreeQuery.isLoading ? (
            <YStack flex={1} alignItems="center" justifyContent="center">
              <LoadingSpinner />
              <Text ml="$2" color="$gray11">
                Loading dependencies...
              </Text>
            </YStack>
          ) : dependencyTreeQuery.isError ? (
            <YStack
              flex={1}
              alignItems="center"
              justifyContent="center"
              color="$red10"
            >
              <YStack mb="$4">
                <AlertTriangle size={48} style={{ color: 'var(--color-red-10)' }} />
              </YStack>
              <Text color="$red10">Failed to load dependencies</Text>
              <Text fontSize="$3" color="$gray11" mt="$1">
                {dependencyTreeQuery.error?.message}
              </Text>
            </YStack>
          ) : dependencyTree ? (
            <YStack gap="$1">
              <TreeNode node={dependencyTree} level={0} onSelect={handleTreeSelect} />
              {dependencyTree.children.length === 0 && (
                <Text fontSize="$3" color="$gray11" ml="$6" mt="$4">
                  This requirement has no dependencies
                </Text>
              )}
            </YStack>
          ) : null}

          {/* Legend */}
          {selectedRequirement && dependencyTree && dependencyTree.children.length > 0 && (
            <YStack mt="$6" paddingTop="$4" borderTopWidth={1} borderColor="$borderColor">
              <Text fontSize="$3" fontWeight="600" color="$color11" mb="$2">
                Legend
              </Text>
              <XStack alignItems="center" gap="$4" flexWrap="wrap">
                <Text
                  fontSize="$1"
                  paddingHorizontal="$2"
                  paddingVertical="$1"
                  borderRadius={9999}
                  borderWidth={1}
                  backgroundColor="$red2"
                  color="$red10"
                  borderColor="$red6"
                >
                  Required - Must be present
                </Text>
                <Text
                  fontSize="$1"
                  paddingHorizontal="$2"
                  paddingVertical="$1"
                  borderRadius={9999}
                  borderWidth={1}
                  backgroundColor="$yellow2"
                  color="$yellow10"
                  borderColor="$yellow6"
                >
                  Recommended - Should have
                </Text>
                <Text
                  fontSize="$1"
                  paddingHorizontal="$2"
                  paddingVertical="$1"
                  borderRadius={9999}
                  borderWidth={1}
                  backgroundColor="$blue2"
                  color="$blue10"
                  borderColor="$blue6"
                >
                  Alternative - One of many
                </Text>
              </XStack>
            </YStack>
          )}
        </YStack>
      </XStack>
    </YStack>
  )
}

export default DependencyGraph
