/**
 * REQ-263: Org-Level vs Project-Level Coverage Distinction
 * TASK-4: Build Project-Level Coverage Requirements UI
 *
 * Settings interface for managing project-level coverage limit requirements.
 * Shows requirements with "PROJECT" badge and supports add/edit/delete operations.
 * Accessible to admins and project managers.
 */

import React, { useState, useMemo, useCallback, useEffect } from 'react';
import {
  Plus,
  Search,
  Edit2,
  Trash2,
  Shield,
  FolderKanban,
  DollarSign,
  AlertCircle,
  Building2,
} from 'lucide-react';
import Button from '../Common/Button';
import Card from '../Common/Card';
import Modal from '../Common/Modal';
import Select from '../Common/Select';
import CoverageRequirementForm, { CoverageRequirementFormData } from './CoverageRequirementForm';
import {
  CoverageLimitRequirement,
  CoverageLimitType,
  CreateCoverageLimitRequirementRequest,
  UpdateCoverageLimitRequirementRequest,
} from '../../types';
import {
  getProjectLevelRequirements,
  getOrgLevelRequirements,
  createCoverageLimitRequirement,
  updateCoverageLimitRequirement,
  deleteCoverageLimitRequirement,
  canManageProjectLevel,
  VALID_COVERAGE_TYPES,
  UserContext,
} from '../../lib/coverageRequirements/coverageLimitRequirementService';

// Coverage type display config
const COVERAGE_TYPE_CONFIG: Record<CoverageLimitType, { label: string; shortLabel: string }> = {
  general_liability: { label: 'General Liability', shortLabel: 'GL' },
  workers_comp: { label: "Workers' Compensation", shortLabel: 'WC' },
  commercial_auto: { label: 'Commercial Auto', shortLabel: 'Auto' },
  umbrella_excess: { label: 'Umbrella/Excess', shortLabel: 'Umbrella' },
  professional_liability: { label: 'Professional Liability', shortLabel: 'Prof' },
  pollution_liability: { label: 'Pollution Liability', shortLabel: 'Pollution' },
  builders_risk: { label: "Builder's Risk", shortLabel: 'BR' },
  equipment_floater: { label: 'Equipment Floater', shortLabel: 'Equip' },
};

// Toast notification type
interface Toast {
  id: string;
  type: 'success' | 'error';
  message: string;
}

interface ProjectCoverageRequirementsPageProps {
  projectId: string;
  projectName?: string;
  organizationId?: string;
  currentUser?: UserContext;
}

export default function ProjectCoverageRequirementsPage({
  projectId,
  projectName = 'Project',
  organizationId = 'org-1',
  currentUser = {
    id: 'admin-1',
    role: 'admin',
    organization_id: 'org-1',
    project_ids: [projectId],
  },
}: ProjectCoverageRequirementsPageProps) {
  const [projectRequirements, setProjectRequirements] = useState<CoverageLimitRequirement[]>([]);
  const [orgRequirements, setOrgRequirements] = useState<CoverageLimitRequirement[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCoverageType, setSelectedCoverageType] = useState<CoverageLimitType | 'all'>(
    'all'
  );
  const [showForm, setShowForm] = useState(false);
  const [editingRequirement, setEditingRequirement] = useState<CoverageLimitRequirement | null>(
    null
  );
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [deleteConfirm, setDeleteConfirm] = useState<CoverageLimitRequirement | null>(null);
  const [toasts, setToasts] = useState<Toast[]>([]);
  const [showOrgRequirements, setShowOrgRequirements] = useState(true);

  // Check if user can manage this project
  const canManage = canManageProjectLevel(currentUser, projectId);

  // Add toast notification
  const addToast = useCallback((type: 'success' | 'error', message: string) => {
    const id = crypto.randomUUID();
    setToasts((prev) => [...prev, { id, type, message }]);
    // Auto-remove after 5 seconds
    setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id));
    }, 5000);
  }, []);

  // Fetch both project and org level requirements
  const fetchRequirements = useCallback(async () => {
    setIsLoading(true);

    // Fetch project-level requirements
    const projectResponse = await getProjectLevelRequirements(projectId);
    if (projectResponse.success && projectResponse.data) {
      let filtered = projectResponse.data;
      if (selectedCoverageType !== 'all') {
        filtered = filtered.filter((r) => r.coverage_type === selectedCoverageType);
      }
      setProjectRequirements(filtered);
    } else {
      addToast('error', projectResponse.error || 'Failed to load project requirements');
    }

    // Fetch org-level requirements for reference
    const orgResponse = await getOrgLevelRequirements(organizationId);
    if (orgResponse.success && orgResponse.data) {
      let filtered = orgResponse.data;
      if (selectedCoverageType !== 'all') {
        filtered = filtered.filter((r) => r.coverage_type === selectedCoverageType);
      }
      setOrgRequirements(filtered);
    }

    setIsLoading(false);
  }, [projectId, organizationId, selectedCoverageType, addToast]);

  useEffect(() => {
    fetchRequirements();
  }, [fetchRequirements]);

  // Filter requirements by search
  const filteredProjectRequirements = useMemo(() => {
    if (!searchQuery) return projectRequirements;
    const query = searchQuery.toLowerCase();
    return projectRequirements.filter(
      (req) =>
        req.name.toLowerCase().includes(query) ||
        COVERAGE_TYPE_CONFIG[req.coverage_type].label.toLowerCase().includes(query)
    );
  }, [projectRequirements, searchQuery]);

  const filteredOrgRequirements = useMemo(() => {
    if (!searchQuery) return orgRequirements;
    const query = searchQuery.toLowerCase();
    return orgRequirements.filter(
      (req) =>
        req.name.toLowerCase().includes(query) ||
        COVERAGE_TYPE_CONFIG[req.coverage_type].label.toLowerCase().includes(query)
    );
  }, [orgRequirements, searchQuery]);

  // Handle create requirement
  const handleCreate = useCallback(
    async (data: CoverageRequirementFormData) => {
      setIsSubmitting(true);
      const input: CreateCoverageLimitRequirementRequest = {
        name: data.name,
        level: 'project',
        organization_id: organizationId,
        project_id: projectId,
        coverage_type: data.coverage_type,
        minimum_limit: data.minimum_limit,
        required: data.required,
      };

      const response = await createCoverageLimitRequirement(input, currentUser);
      setIsSubmitting(false);

      if (response.success) {
        addToast('success', 'Project requirement created successfully');
        setShowForm(false);
        fetchRequirements();
      } else {
        addToast('error', response.error || 'Failed to create project requirement');
      }
    },
    [organizationId, projectId, currentUser, addToast, fetchRequirements]
  );

  // Handle update requirement
  const handleUpdate = useCallback(
    async (data: CoverageRequirementFormData) => {
      if (!editingRequirement) return;

      setIsSubmitting(true);
      const input: UpdateCoverageLimitRequirementRequest = {
        name: data.name,
        coverage_type: data.coverage_type,
        minimum_limit: data.minimum_limit,
        required: data.required,
      };

      const response = await updateCoverageLimitRequirement(
        editingRequirement.id,
        input,
        currentUser
      );
      setIsSubmitting(false);

      if (response.success) {
        addToast('success', 'Project requirement updated successfully');
        setEditingRequirement(null);
        fetchRequirements();
      } else {
        addToast('error', response.error || 'Failed to update project requirement');
      }
    },
    [editingRequirement, currentUser, addToast, fetchRequirements]
  );

  // Handle delete requirement
  const handleDelete = useCallback(async () => {
    if (!deleteConfirm) return;

    setIsSubmitting(true);
    const response = await deleteCoverageLimitRequirement(deleteConfirm.id, currentUser);
    setIsSubmitting(false);

    if (response.success) {
      addToast('success', 'Project requirement deleted successfully');
      setDeleteConfirm(null);
      fetchRequirements();
    } else {
      addToast('error', response.error || 'Failed to delete project requirement');
    }
  }, [deleteConfirm, currentUser, addToast, fetchRequirements]);

  // Coverage type filter options
  const coverageTypeOptions = [
    { value: 'all', label: 'All Coverage Types' },
    ...VALID_COVERAGE_TYPES.map((type) => ({
      value: type,
      label: COVERAGE_TYPE_CONFIG[type].label,
    })),
  ];

  // Format currency
  const formatCurrency = (value: number): string => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(value);
  };

  // Access denied view
  if (!canManage) {
    return (
      <div className="flex flex-col items-center justify-center p-8 text-center">
        <AlertCircle size={48} className="text-warning-500 mb-4" />
        <h2 className="text-xl font-semibold text-text-primary mb-2">Access Denied</h2>
        <p className="text-text-secondary">
          You don't have permission to manage coverage requirements for this project.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Toast notifications */}
      <div className="fixed top-4 right-4 z-50 space-y-2">
        {toasts.map((toast) => (
          <div
            key={toast.id}
            className={`px-4 py-3 rounded-lg shadow-lg text-sm font-medium ${
              toast.type === 'success'
                ? 'bg-success-100 text-success-800 border border-success-200'
                : 'bg-error-100 text-error-800 border border-error-200'
            }`}
          >
            {toast.message}
          </div>
        ))}
      </div>

      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <div className="flex items-center gap-3">
            <h1 className="font-display text-3xl font-bold text-text-primary">
              Coverage Requirements
            </h1>
            <span className="px-3 py-1 rounded-full text-sm font-semibold bg-purple-100 text-purple-700 flex items-center gap-1">
              <FolderKanban size={14} />
              PROJECT
            </span>
          </div>
          <p className="text-text-secondary text-lg mt-1">
            Set project-specific coverage requirements for <strong>{projectName}</strong>
          </p>
        </div>
        <Button variant="primary" leftIcon={Plus} onClick={() => setShowForm(true)}>
          Add Project Requirement
        </Button>
      </div>

      {/* Info Banner */}
      <Card className="p-4 bg-purple-50 border-purple-200">
        <div className="flex items-start gap-3">
          <Shield className="text-purple-600 mt-0.5" size={20} />
          <div>
            <p className="text-purple-800 font-medium">Project-Level Requirements</p>
            <p className="text-purple-700 text-sm mt-1">
              These requirements are specific to this project and supplement the organization-wide
              requirements. Subcontractors must meet both org-level and project-level requirements.
            </p>
          </div>
        </div>
      </Card>

      {/* Filters */}
      <Card className="p-4">
        <div className="flex flex-col sm:flex-row gap-4">
          <div className="flex-1 relative">
            <Search
              className="absolute left-3 top-1/2 -translate-y-1/2 text-text-tertiary"
              size={20}
            />
            <input
              type="text"
              placeholder="Search requirements..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2 bg-bg-primary border border-border rounded-lg text-text-primary placeholder-text-tertiary focus:outline-none focus:ring-2 focus:ring-primary-500"
            />
          </div>
          <div className="flex items-center gap-2">
            <DollarSign size={20} className="text-text-tertiary" />
            <Select
              options={coverageTypeOptions}
              value={selectedCoverageType}
              onChange={(e) =>
                setSelectedCoverageType(e.target.value as CoverageLimitType | 'all')
              }
              className="w-56"
            />
          </div>
        </div>
      </Card>

      {/* Project Requirements Table */}
      <Card>
        <div className="px-4 py-3 border-b border-border bg-purple-50/50">
          <div className="flex items-center gap-2">
            <FolderKanban size={18} className="text-purple-600" />
            <h2 className="font-semibold text-text-primary">Project-Specific Requirements</h2>
            <span className="text-sm text-text-secondary">
              ({filteredProjectRequirements.length})
            </span>
          </div>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-border">
                <th className="text-left px-4 py-3 text-sm font-semibold text-text-secondary">
                  Name
                </th>
                <th className="text-left px-4 py-3 text-sm font-semibold text-text-secondary">
                  Coverage Type
                </th>
                <th className="text-left px-4 py-3 text-sm font-semibold text-text-secondary">
                  Minimum Limit
                </th>
                <th className="text-left px-4 py-3 text-sm font-semibold text-text-secondary">
                  Level
                </th>
                <th className="text-left px-4 py-3 text-sm font-semibold text-text-secondary">
                  Status
                </th>
                <th className="text-right px-4 py-3 text-sm font-semibold text-text-secondary">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody>
              {isLoading ? (
                <tr>
                  <td colSpan={6} className="px-4 py-8 text-center text-text-tertiary">
                    Loading project requirements...
                  </td>
                </tr>
              ) : filteredProjectRequirements.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-4 py-8 text-center text-text-tertiary">
                    {searchQuery
                      ? 'No project requirements match your search'
                      : 'No project-specific requirements. Add one above!'}
                  </td>
                </tr>
              ) : (
                filteredProjectRequirements.map((requirement) => (
                  <tr
                    key={requirement.id}
                    className="border-b border-border hover:bg-bg-secondary/50 transition-colors"
                  >
                    <td className="px-4 py-3">
                      <span className="font-medium text-text-primary">{requirement.name}</span>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2">
                        <span className="px-2 py-1 rounded bg-slate-100 text-slate-700 text-xs font-medium">
                          {COVERAGE_TYPE_CONFIG[requirement.coverage_type].shortLabel}
                        </span>
                        <span className="text-text-secondary">
                          {COVERAGE_TYPE_CONFIG[requirement.coverage_type].label}
                        </span>
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <span className="font-mono text-text-primary">
                        {formatCurrency(requirement.minimum_limit)}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <span className="px-2 py-1 rounded-full text-xs font-semibold bg-purple-100 text-purple-700">
                        PROJECT
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <span
                        className={`px-2 py-1 rounded-full text-xs font-medium ${
                          requirement.required
                            ? 'bg-success-100 text-success-700'
                            : 'bg-slate-100 text-slate-600'
                        }`}
                      >
                        {requirement.required ? 'Required' : 'Optional'}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center justify-end gap-2">
                        <button
                          onClick={() => setEditingRequirement(requirement)}
                          className="p-2 text-text-tertiary hover:text-primary-600 hover:bg-primary-50 rounded-lg transition-colors"
                          title="Edit"
                        >
                          <Edit2 size={16} />
                        </button>
                        <button
                          onClick={() => setDeleteConfirm(requirement)}
                          className="p-2 text-text-tertiary hover:text-error-600 hover:bg-error-50 rounded-lg transition-colors"
                          title="Delete"
                        >
                          <Trash2 size={16} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </Card>

      {/* Inherited Org Requirements (Read-only) */}
      <Card>
        <div
          className="px-4 py-3 border-b border-border bg-primary-50/50 cursor-pointer"
          onClick={() => setShowOrgRequirements(!showOrgRequirements)}
        >
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Building2 size={18} className="text-primary-600" />
              <h2 className="font-semibold text-text-primary">
                Inherited Organization Requirements
              </h2>
              <span className="text-sm text-text-secondary">
                ({filteredOrgRequirements.length})
              </span>
            </div>
            <span className="text-sm text-text-tertiary">
              {showOrgRequirements ? 'Hide' : 'Show'}
            </span>
          </div>
          <p className="text-sm text-text-tertiary mt-1">
            These org-level requirements also apply to this project (read-only)
          </p>
        </div>
        {showOrgRequirements && (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-border">
                  <th className="text-left px-4 py-3 text-sm font-semibold text-text-secondary">
                    Name
                  </th>
                  <th className="text-left px-4 py-3 text-sm font-semibold text-text-secondary">
                    Coverage Type
                  </th>
                  <th className="text-left px-4 py-3 text-sm font-semibold text-text-secondary">
                    Minimum Limit
                  </th>
                  <th className="text-left px-4 py-3 text-sm font-semibold text-text-secondary">
                    Level
                  </th>
                  <th className="text-left px-4 py-3 text-sm font-semibold text-text-secondary">
                    Status
                  </th>
                </tr>
              </thead>
              <tbody>
                {filteredOrgRequirements.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="px-4 py-6 text-center text-text-tertiary">
                      No org-level requirements found
                    </td>
                  </tr>
                ) : (
                  filteredOrgRequirements.map((requirement) => (
                    <tr
                      key={requirement.id}
                      className="border-b border-border bg-slate-50/30"
                    >
                      <td className="px-4 py-3">
                        <span className="text-text-secondary">{requirement.name}</span>
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-2">
                          <span className="px-2 py-1 rounded bg-slate-100 text-slate-600 text-xs font-medium">
                            {COVERAGE_TYPE_CONFIG[requirement.coverage_type].shortLabel}
                          </span>
                          <span className="text-text-tertiary">
                            {COVERAGE_TYPE_CONFIG[requirement.coverage_type].label}
                          </span>
                        </div>
                      </td>
                      <td className="px-4 py-3">
                        <span className="font-mono text-text-secondary">
                          {formatCurrency(requirement.minimum_limit)}
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        <span className="px-2 py-1 rounded-full text-xs font-semibold bg-primary-100 text-primary-700">
                          ORG
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        <span
                          className={`px-2 py-1 rounded-full text-xs font-medium ${
                            requirement.required
                              ? 'bg-success-100 text-success-700'
                              : 'bg-slate-100 text-slate-600'
                          }`}
                        >
                          {requirement.required ? 'Required' : 'Optional'}
                        </span>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        )}
      </Card>

      {/* Summary Card */}
      <Card className="p-4">
        <div className="flex items-center justify-between text-sm">
          <span className="text-text-secondary">
            Total requirements for this project:{' '}
            <span className="font-semibold text-text-primary">
              {filteredProjectRequirements.length + filteredOrgRequirements.length}
            </span>{' '}
            ({filteredProjectRequirements.length} project + {filteredOrgRequirements.length} org)
          </span>
          <div className="flex items-center gap-4">
            <span className="text-text-secondary">
              Required:{' '}
              <span className="font-semibold text-text-primary">
                {
                  [...filteredProjectRequirements, ...filteredOrgRequirements].filter(
                    (r) => r.required
                  ).length
                }
              </span>
            </span>
            <span className="text-text-secondary">
              Optional:{' '}
              <span className="font-semibold text-text-primary">
                {
                  [...filteredProjectRequirements, ...filteredOrgRequirements].filter(
                    (r) => !r.required
                  ).length
                }
              </span>
            </span>
          </div>
        </div>
      </Card>

      {/* Create Modal */}
      <Modal
        isOpen={showForm}
        onClose={() => setShowForm(false)}
        title="Add Project Requirement"
        size="lg"
      >
        <CoverageRequirementForm
          level="project"
          onSubmit={handleCreate}
          onCancel={() => setShowForm(false)}
          isSubmitting={isSubmitting}
        />
      </Modal>

      {/* Edit Modal */}
      <Modal
        isOpen={!!editingRequirement}
        onClose={() => setEditingRequirement(null)}
        title="Edit Project Requirement"
        size="lg"
      >
        {editingRequirement && (
          <CoverageRequirementForm
            initialData={editingRequirement}
            level="project"
            onSubmit={handleUpdate}
            onCancel={() => setEditingRequirement(null)}
            isSubmitting={isSubmitting}
          />
        )}
      </Modal>

      {/* Delete Confirmation Modal */}
      <Modal
        isOpen={!!deleteConfirm}
        onClose={() => setDeleteConfirm(null)}
        title="Delete Project Requirement"
        size="sm"
      >
        <div className="space-y-4">
          <p className="text-text-secondary">
            Are you sure you want to delete{' '}
            <span className="font-semibold text-text-primary">{deleteConfirm?.name}</span>? This
            action cannot be undone.
          </p>
          <div className="flex justify-end gap-3">
            <Button
              variant="ghost"
              onClick={() => setDeleteConfirm(null)}
              disabled={isSubmitting}
            >
              Cancel
            </Button>
            <Button variant="danger" onClick={handleDelete} disabled={isSubmitting}>
              {isSubmitting ? 'Deleting...' : 'Delete'}
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
