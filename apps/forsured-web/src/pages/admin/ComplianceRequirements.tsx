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
      <div className="p-8">
        <div className="flex items-center gap-3 p-4 bg-yellow-50 border border-yellow-200 rounded-lg text-yellow-700">
          <AlertCircle size={20} />
          <div>
            <p className="font-medium">Organization Required</p>
            <p className="text-sm">
              Please select an organization to manage compliance requirements.
            </p>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b">
        <div className="max-w-7xl mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Compliance Requirements</h1>
              <p className="text-sm text-gray-500 mt-1">
                Manage insurance coverage requirements and dependencies
              </p>
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={handleBulkImport}
                className="flex items-center gap-2 px-3 py-2 text-sm text-gray-700 hover:bg-gray-100 rounded-lg"
              >
                <Upload size={16} />
                Import
              </button>
              <button
                onClick={handleBulkExport}
                className="flex items-center gap-2 px-3 py-2 text-sm text-gray-700 hover:bg-gray-100 rounded-lg"
              >
                <Download size={16} />
                Export
              </button>
            </div>
          </div>

          {/* Tabs */}
          <div className="flex items-center gap-1 mt-4 -mb-px">
            {TABS.map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex items-center gap-2 px-4 py-2.5 text-sm font-medium border-b-2 transition-colors ${
                  activeTab === tab.id
                    ? 'border-blue-500 text-blue-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                {tab.icon}
                {tab.label}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-7xl mx-auto px-6 py-6">
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
          <div className="bg-white rounded-lg border p-6">
            <h2 className="text-lg font-semibold mb-4">Bulk Operations</h2>
            <div className="grid grid-cols-2 gap-6">
              <div
                className="p-6 border rounded-lg hover:border-blue-500 cursor-pointer"
                onClick={handleBulkImport}
              >
                <Upload size={32} className="text-blue-500 mb-3" />
                <h3 className="font-medium">Import Requirements</h3>
                <p className="text-sm text-gray-500 mt-1">
                  Upload CSV or JSON file to bulk import compliance requirements
                </p>
              </div>
              <div
                className="p-6 border rounded-lg hover:border-green-500 cursor-pointer"
                onClick={handleBulkExport}
              >
                <Download size={32} className="text-green-500 mb-3" />
                <h3 className="font-medium">Export Requirements</h3>
                <p className="text-sm text-gray-500 mt-1">
                  Download requirements as CSV, JSON, or Excel file
                </p>
              </div>
            </div>
          </div>
        )}
      </div>

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
