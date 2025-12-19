/**
 * ComplianceRequirements Admin Page
 * REQ-2: Compliance Requirements Management
 *
 * Main admin page for managing compliance requirements with tabs for:
 * - List view with CRUD operations
 * - Dependency visualization
 * - Version history
 * - Bulk operations (import/export)
 */

import { useState, useCallback } from 'react'
import { YStack, XStack, Text, Button, H1, H2, H3, Card } from 'tamagui'
import { useUser } from '../../contexts/UserContext'
import { RequirementsList } from '../../components/Admin/Compliance/RequirementsList'
import { RequirementEditor } from '../../components/Admin/Compliance/RequirementEditor'
import { DependencyGraph } from '../../components/Admin/Compliance/DependencyGraph'
import { VersionHistory } from '../../components/Admin/Compliance/VersionHistory'
import { BulkOperationsModal } from '../../components/Admin/Compliance/BulkOperationsModal'
import type { ComplianceRequirement } from '../../hooks/useComplianceRequirements'
import { List, GitBranch, History, Upload, Download, AlertCircle } from 'lucide-react'

// =============================================================================
// Types
// =============================================================================

type TabId = 'list' | 'dependencies' | 'versions' | 'bulk'

interface Tab {
  id: TabId
  label: string
  icon: React.ReactNode
}

// =============================================================================
// Constants
// =============================================================================

const TABS: Tab[] = [
  { id: 'list', label: 'Requirements', icon: <List size={18} /> },
  { id: 'dependencies', label: 'Dependencies', icon: <GitBranch size={18} /> },
  { id: 'versions', label: 'Version History', icon: <History size={18} /> },
  { id: 'bulk', label: 'Bulk Operations', icon: <Upload size={18} /> },
]

// =============================================================================
// Component
// =============================================================================

export function ComplianceRequirements() {
  const { currentUser } = useUser()
  const organizationId = currentUser?.organization_id

  // Tab state
  const [activeTab, setActiveTab] = useState<TabId>('list')

  // Editor state
  const [isEditorOpen, setIsEditorOpen] = useState(false)
  const [editingRequirement, setEditingRequirement] = useState<ComplianceRequirement | null>(null)

  // Selected requirement for dependency/version views
  const [selectedRequirement, setSelectedRequirement] = useState<ComplianceRequirement | null>(null)

  // Bulk operations modal
  const [isBulkModalOpen, setIsBulkModalOpen] = useState(false)
  const [bulkMode, setBulkMode] = useState<'import' | 'export'>('import')

  // Handlers
  const handleCreateNew = useCallback(() => {
    setEditingRequirement(null)
    setIsEditorOpen(true)
  }, [])

  const handleEdit = useCallback((requirement: ComplianceRequirement) => {
    setEditingRequirement(requirement)
    setIsEditorOpen(true)
  }, [])

  const handleViewDependencies = useCallback((requirement: ComplianceRequirement) => {
    setSelectedRequirement(requirement)
    setActiveTab('dependencies')
  }, [])

  const handleViewVersions = useCallback((requirement: ComplianceRequirement) => {
    setSelectedRequirement(requirement)
    setActiveTab('versions')
  }, [])

  const handleEditorClose = useCallback(() => {
    setIsEditorOpen(false)
    setEditingRequirement(null)
  }, [])

  const handleBulkImport = useCallback(() => {
    setBulkMode('import')
    setIsBulkModalOpen(true)
  }, [])

  const handleBulkExport = useCallback(() => {
    setBulkMode('export')
    setIsBulkModalOpen(true)
  }, [])

  // No organization check
  if (!organizationId) {
    return (
      <YStack padding="$8">
        <XStack alignItems="center" gap="$3" padding="$4" backgroundColor="$yellow4" borderWidth={1} borderColor="$yellow8" borderRadius="$4">
          <AlertCircle size={20} color="$yellow11" />
          <YStack>
            <Text fontWeight="600" color="$yellow11">Organization Required</Text>
            <Text fontSize="$3" color="$yellow11">
              Please select an organization to manage compliance requirements.
            </Text>
          </YStack>
        </XStack>
      </YStack>
    )
  }

  return (
    <YStack minHeight="100vh" backgroundColor="$backgroundHover">
      {/* Header */}
      <XStack backgroundColor="$background" borderBottomWidth={1} borderColor="$borderColor">
        <YStack maxWidth={1280} width="100%" marginHorizontal="auto" paddingHorizontal="$6" paddingVertical="$4">
          <XStack alignItems="center" justifyContent="space-between">
            <YStack>
              <H1 fontSize="$8" fontWeight="700" color="$color12">Compliance Requirements</H1>
              <Text fontSize="$3" color="$color11" marginTop="$1">
                Manage insurance coverage requirements and dependencies
              </Text>
            </YStack>
            <XStack alignItems="center" gap="$2">
              <Button
                onPress={handleBulkImport}
                icon={<Upload size={16} />}
                paddingHorizontal="$3"
                paddingVertical="$2"
                fontSize="$3"
                color="$color12"
                backgroundColor="transparent"
                hoverStyle={{ backgroundColor: "$backgroundHover" }}
                borderRadius="$4"
              >
                Import
              </Button>
              <Button
                onPress={handleBulkExport}
                icon={<Download size={16} />}
                paddingHorizontal="$3"
                paddingVertical="$2"
                fontSize="$3"
                color="$color12"
                backgroundColor="transparent"
                hoverStyle={{ backgroundColor: "$backgroundHover" }}
                borderRadius="$4"
              >
                Export
              </Button>
            </XStack>
          </XStack>

          {/* Tabs */}
          <XStack alignItems="center" gap="$1" marginTop="$4" marginBottom={-1}>
            {TABS.map((tab) => (
              <Button
                key={tab.id}
                onPress={() => setActiveTab(tab.id)}
                icon={tab.icon}
                paddingHorizontal="$4"
                paddingVertical="$2.5"
                fontSize="$3"
                fontWeight="600"
                backgroundColor="transparent"
                borderBottomWidth={2}
                borderBottomColor={activeTab === tab.id ? '$blue10' : 'transparent'}
                color={activeTab === tab.id ? '$blue11' : '$color11'}
                hoverStyle={{
                  backgroundColor: 'transparent',
                  color: activeTab === tab.id ? '$blue11' : '$color12',
                  borderBottomColor: activeTab === tab.id ? '$blue10' : '$borderColor',
                }}
                borderRadius={0}
              >
                {tab.label}
              </Button>
            ))}
          </XStack>
        </YStack>
      </XStack>

      {/* Content */}
      <YStack maxWidth={1280} width="100%" marginHorizontal="auto" paddingHorizontal="$6" paddingVertical="$6">
        {activeTab === 'list' && (
          <RequirementsList
            organizationId={organizationId}
            onCreateNew={handleCreateNew}
            onEdit={handleEdit}
            onViewDependencies={handleViewDependencies}
            onViewVersions={handleViewVersions}
          />
        )}

        {activeTab === 'dependencies' && (
          <DependencyGraph
            organizationId={organizationId}
            selectedRequirement={selectedRequirement}
            onSelectRequirement={setSelectedRequirement}
          />
        )}

        {activeTab === 'versions' && (
          <VersionHistory
            organizationId={organizationId}
            selectedRequirement={selectedRequirement}
            onSelectRequirement={setSelectedRequirement}
          />
        )}

        {activeTab === 'bulk' && (
          <Card backgroundColor="$background" borderRadius="$4" borderWidth={1} padding="$6">
            <H2 fontSize="$6" fontWeight="600" marginBottom="$4">Bulk Operations</H2>
            <XStack flexWrap="wrap" gap="$6">
              <Card
                padding="$6"
                borderWidth={1}
                borderRadius="$4"
                backgroundColor="$background"
                hoverStyle={{ borderColor: "$blue10" }}
                cursor="pointer"
                onPress={handleBulkImport}
                flex={1}
                minWidth={300}
              >
                <YStack alignItems="flex-start" gap="$3">
                  <Upload size={32} color="$blue10" />
                  <H3 fontWeight="600">Import Requirements</H3>
                  <Text fontSize="$3" color="$color11">
                    Upload CSV or JSON file to bulk import compliance requirements
                  </Text>
                </YStack>
              </Card>
              <Card
                padding="$6"
                borderWidth={1}
                borderRadius="$4"
                backgroundColor="$background"
                hoverStyle={{ borderColor: "$green10" }}
                cursor="pointer"
                onPress={handleBulkExport}
                flex={1}
                minWidth={300}
              >
                <YStack alignItems="flex-start" gap="$3">
                  <Download size={32} color="$green10" />
                  <H3 fontWeight="600">Export Requirements</H3>
                  <Text fontSize="$3" color="$color11">
                    Download requirements as CSV, JSON, or Excel file
                  </Text>
                </YStack>
              </Card>
            </XStack>
          </Card>
        )}
      </YStack>

      {/* Modals */}
      <RequirementEditor
        organizationId={organizationId}
        requirement={editingRequirement}
        isOpen={isEditorOpen}
        onClose={handleEditorClose}
      />

      <BulkOperationsModal
        organizationId={organizationId}
        isOpen={isBulkModalOpen}
        mode={bulkMode}
        onClose={() => setIsBulkModalOpen(false)}
      />
    </div>
  )
}

export default ComplianceRequirements
