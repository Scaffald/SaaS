/**
 * ComplianceRequirements Admin Page
 * Compliance requirements management
 *
 * Main admin page for managing compliance requirements with tabs for:
 * - List view with CRUD operations
 * - Dependency visualization
 * - Version history
 * - Bulk operations (import/export)
 */

import { useState, useCallback } from 'react'
import { Stack, Row, Text, Button, Heading, Card, colors, spacing } from '@unicornlove/beyond-ui'
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
      <Stack style={{ padding: spacing[32] }}>
        <Row
          alignItems="center"
          gap={spacing[12]}
          style={{
            padding: spacing[16],
            backgroundColor: colors.warning[200],
            borderWidth: 1,
            borderColor: colors.warning[400],
            borderRadius: spacing[16],
          }}
        >
          <AlertCircle size={20} color={colors.warning[600]} />
          <Stack>
            <Text weight="semibold" color={colors.warning[600]}>
              Organization Required
            </Text>
            <Text size="sm" color={colors.warning[600]}>
              Please select an organization to manage compliance requirements.
            </Text>
          </Stack>
        </Row>
      </Stack>
    )
  }

  return (
    <Stack style={{ minHeight: '100vh', backgroundColor: colors.bg.light.subtle }}>
      {/* Header */}
      <Row
        style={{
          backgroundColor: colors.bg.light.default,
          borderBottomWidth: 1,
          borderBottomColor: colors.border.light.default,
        }}
      >
        <Stack
          style={{
            maxWidth: 1280,
            width: '100%',
            marginHorizontal: 'auto',
            paddingHorizontal: spacing[24],
            paddingVertical: spacing[16],
          }}
        >
          <Row alignItems="center" justifyContent="space-between">
            <Stack>
              <Heading
                level={1}
                weight="bold"
                style={{ fontSize: 32, color: colors.text.light.primary }}
              >
                Compliance Requirements
              </Heading>
              <Text size="sm" color={colors.text.light.secondary} style={{ marginTop: spacing[4] }}>
                Manage insurance coverage requirements and dependencies
              </Text>
            </Stack>
            <Row alignItems="center" gap={spacing[8]}>
              <Button
                onPress={handleBulkImport}
                iconStart={Upload}
                variant="text"
                color="gray"
                size="sm"
              >
                Import
              </Button>
              <Button
                onPress={handleBulkExport}
                iconStart={Download}
                variant="text"
                color="gray"
                size="sm"
              >
                Export
              </Button>
            </Row>
          </Row>

          {/* Tabs */}
          <Row
            alignItems="center"
            gap={spacing[4]}
            style={{ marginTop: spacing[16], marginBottom: -1 }}
          >
            {TABS.map((tab) => (
              <Button
                key={tab.id}
                onPress={() => setActiveTab(tab.id)}
                iconStart={tab.icon as any}
                variant="text"
                color={activeTab === tab.id ? 'primary' : 'gray'}
                size="sm"
                style={{
                  borderBottomWidth: 2,
                  borderBottomColor: activeTab === tab.id ? colors.primary[500] : 'transparent',
                  borderRadius: 0,
                }}
              >
                {tab.label}
              </Button>
            ))}
          </Row>
        </Stack>
      </Row>

      {/* Content */}
      <Stack
        style={{
          maxWidth: 1280,
          width: '100%',
          marginHorizontal: 'auto',
          paddingHorizontal: spacing[24],
          paddingVertical: spacing[24],
        }}
      >
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
          <Card style={{ borderWidth: 1, padding: spacing[24] }}>
            <Heading
              level={2}
              weight="semibold"
              style={{ fontSize: 20, marginBottom: spacing[16] }}
            >
              Bulk Operations
            </Heading>
            <Row style={{ flexWrap: 'wrap', gap: spacing[24] }}>
              <Card
                style={{
                  padding: spacing[24],
                  borderWidth: 1,
                  borderRadius: spacing[16],
                  backgroundColor: colors.bg.light.default,
                  cursor: 'pointer',
                  flex: 1,
                  minWidth: 300,
                }}
                onPress={handleBulkImport}
              >
                <Stack alignItems="flex-start" gap={spacing[12]}>
                  <Upload size={32} color={colors.primary[500]} />
                  <Heading level={3} weight="semibold">
                    Import Requirements
                  </Heading>
                  <Text size="sm" color={colors.text.light.secondary}>
                    Upload CSV or JSON file to bulk import compliance requirements
                  </Text>
                </Stack>
              </Card>
              <Card
                style={{
                  padding: spacing[24],
                  borderWidth: 1,
                  borderRadius: spacing[16],
                  backgroundColor: colors.bg.light.default,
                  cursor: 'pointer',
                  flex: 1,
                  minWidth: 300,
                }}
                onPress={handleBulkExport}
              >
                <Stack alignItems="flex-start" gap={spacing[12]}>
                  <Download size={32} color={colors.success[500]} />
                  <Heading level={3} weight="semibold">
                    Export Requirements
                  </Heading>
                  <Text size="sm" color={colors.text.light.secondary}>
                    Download requirements as CSV, JSON, or Excel file
                  </Text>
                </Stack>
              </Card>
            </Row>
          </Card>
        )}
      </Stack>

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
    </Stack>
  )
}

export default ComplianceRequirements
