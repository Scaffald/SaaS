/**
 * REQ-263: Org-Level vs Project-Level Coverage Distinction
 * TASK-3: Build Org Coverage Requirements Settings UI
 *
 * Admin interface for managing organization-level coverage limit requirements.
 * Displays requirements with "ORG" badge and provides CRUD operations.
 */

import React, { useState, useMemo, useCallback, useEffect } from 'react';
import {
  Plus,
  Search,
  Edit2,
  Trash2,
  Shield,
  Building2,
  DollarSign,
  AlertCircle,
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
  getOrgLevelRequirements,
  createCoverageLimitRequirement,
  updateCoverageLimitRequirement,
  deleteCoverageLimitRequirement,
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

interface OrgCoverageRequirementsPageProps {
  organizationId?: string;
  currentUser?: UserContext;
}

export default function OrgCoverageRequirementsPage({
  organizationId = 'org-1',
  currentUser = { id: 'admin-1', role: 'admin', organization_id: 'org-1' },
}: OrgCoverageRequirementsPageProps) {
  const [requirements, setRequirements] = useState<CoverageLimitRequirement[]>([]);
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

  // Check if user is admin
  const isAdmin = currentUser.role === 'admin';

  // Add toast notification
  const addToast = useCallback((type: 'success' | 'error', message: string) => {
    const id = crypto.randomUUID();
    setToasts((prev) => [...prev, { id, type, message }]);
    // Auto-remove after 5 seconds
    setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id));
    }, 5000);
  }, []);

  // Fetch org-level requirements
  const fetchRequirements = useCallback(async () => {
    setIsLoading(true);
    const response = await getOrgLevelRequirements(organizationId);
    if (response.success && response.data) {
      let filtered = response.data;
      if (selectedCoverageType !== 'all') {
        filtered = filtered.filter((r) => r.coverage_type === selectedCoverageType);
      }
      setRequirements(filtered);
    } else {
      addToast('error', response.error || 'Failed to load coverage requirements');
    }
    setIsLoading(false);
  }, [organizationId, selectedCoverageType, addToast]);

  useEffect(() => {
    fetchRequirements();
  }, [fetchRequirements]);

  // Filter requirements by search
  const filteredRequirements = useMemo(() => {
    if (!searchQuery) return requirements;
    const query = searchQuery.toLowerCase();
    return requirements.filter(
      (req) =>
        req.name.toLowerCase().includes(query) ||
        COVERAGE_TYPE_CONFIG[req.coverage_type].label.toLowerCase().includes(query)
    );
  }, [requirements, searchQuery]);

  // Handle create requirement
  const handleCreate = useCallback(
    async (data: CoverageRequirementFormData) => {
      setIsSubmitting(true);
      const input: CreateCoverageLimitRequirementRequest = {
        name: data.name,
        level: 'org',
        organization_id: organizationId,
        coverage_type: data.coverage_type,
        minimum_limit: data.minimum_limit,
        required: data.required,
      };

      const response = await createCoverageLimitRequirement(input, currentUser);
      setIsSubmitting(false);

      if (response.success) {
        addToast('success', 'Coverage requirement created successfully');
        setShowForm(false);
        fetchRequirements();
      } else {
        addToast('error', response.error || 'Failed to create coverage requirement');
      }
    },
    [organizationId, currentUser, addToast, fetchRequirements]
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
        addToast('success', 'Coverage requirement updated successfully');
        setEditingRequirement(null);
        fetchRequirements();
      } else {
        addToast('error', response.error || 'Failed to update coverage requirement');
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
      addToast('success', 'Coverage requirement deleted successfully');
      setDeleteConfirm(null);
      fetchRequirements();
    } else {
      addToast('error', response.error || 'Failed to delete coverage requirement');
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

  // Non-admin warning
  if (!isAdmin) {
    return (
      <div className="flex flex-col items-center justify-center p-8 text-center">
        <AlertCircle size={48} className="text-warning-500 mb-4" />
        <h2 className="text-xl font-semibold text-text-primary mb-2">Admin Access Required</h2>
        <p className="text-text-secondary">
          Only administrators can manage organization-level coverage requirements.
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
            <span className="px-3 py-1 rounded-full text-sm font-semibold bg-primary-100 text-primary-700 flex items-center gap-1">
              <Building2 size={14} />
              ORG LEVEL
            </span>
          </div>
          <p className="text-text-secondary text-lg mt-1">
            Set organization-wide minimum coverage requirements for all subcontractors
          </p>
        </div>
        <Button variant="primary" leftIcon={Plus} onClick={() => setShowForm(true)}>
          Add Requirement
        </Button>
      </div>

      {/* Info Banner */}
      <Card className="p-4 bg-primary-50 border-primary-200">
        <div className="flex items-start gap-3">
          <Shield className="text-primary-600 mt-0.5" size={20} />
          <div>
            <p className="text-primary-800 font-medium">Organization-Level Requirements</p>
            <p className="text-primary-700 text-sm mt-1">
              These requirements apply to all projects in your organization. Subcontractors must
              meet both org-level and any project-specific requirements for full compliance.
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

      {/* Requirements Table */}
      <Card>
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
                    Loading coverage requirements...
                  </td>
                </tr>
              ) : filteredRequirements.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-4 py-8 text-center text-text-tertiary">
                    {searchQuery
                      ? 'No requirements match your search'
                      : 'No coverage requirements found. Create your first one!'}
                  </td>
                </tr>
              ) : (
                filteredRequirements.map((requirement) => (
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

      {/* Summary Card */}
      {filteredRequirements.length > 0 && (
        <Card className="p-4">
          <div className="flex items-center justify-between text-sm">
            <span className="text-text-secondary">
              Showing {filteredRequirements.length} org-level requirement
              {filteredRequirements.length !== 1 ? 's' : ''}
            </span>
            <div className="flex items-center gap-4">
              <span className="text-text-secondary">
                Required:{' '}
                <span className="font-semibold text-text-primary">
                  {filteredRequirements.filter((r) => r.required).length}
                </span>
              </span>
              <span className="text-text-secondary">
                Optional:{' '}
                <span className="font-semibold text-text-primary">
                  {filteredRequirements.filter((r) => !r.required).length}
                </span>
              </span>
            </div>
          </div>
        </Card>
      )}

      {/* Create Modal */}
      <Modal
        isOpen={showForm}
        onClose={() => setShowForm(false)}
        title="Add Coverage Requirement"
        size="lg"
      >
        <CoverageRequirementForm
          level="org"
          onSubmit={handleCreate}
          onCancel={() => setShowForm(false)}
          isSubmitting={isSubmitting}
        />
      </Modal>

      {/* Edit Modal */}
      <Modal
        isOpen={!!editingRequirement}
        onClose={() => setEditingRequirement(null)}
        title="Edit Coverage Requirement"
        size="lg"
      >
        {editingRequirement && (
          <CoverageRequirementForm
            initialData={editingRequirement}
            level="org"
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
        title="Delete Coverage Requirement"
        size="sm"
      >
        <div className="space-y-4">
          <p className="text-text-secondary">
            Are you sure you want to delete{' '}
            <span className="font-semibold text-text-primary">{deleteConfirm?.name}</span>? This
            action cannot be undone and may affect compliance calculations for all projects.
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
