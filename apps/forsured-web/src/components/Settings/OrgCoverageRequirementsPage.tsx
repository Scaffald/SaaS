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
import { Stack, Row, Text, H1, Card, Button } from '@unicornlove/beyond-ui';
import ButtonCommon from '../Common/Button';
import CardCommon from '../Common/Card';
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
      <Stack style={{ alignItems: 'center', justifyContent: 'center', padding: 32, textAlign: 'center' }}>
        <AlertCircle size={48} color="var(--color-yellow10)" style={{ marginBottom: 16 }} />
        <Text style={{ fontSize: 18, fontWeight: 600, color: 'var(--color-color12)', marginBottom: 8 }}>Admin Access Required</Text>
        <Text style={{ color: 'var(--color-color11)' }}>
          Only administrators can manage organization-level coverage requirements.
        </Text>
      </Stack>
    );
  }

  return (
    <Stack style={{ gap: 24 }}>
      {/* Toast notifications */}
      <Stack style={{ position: 'fixed', top: 16, right: 16, zIndex: 50, gap: 8 }}>
        {toasts.map((toast) => (
          <Card
            key={toast.id}
            style={{
              padding: '12px 16px',
              borderRadius: 8,
              boxShadow: '0 4px 6px rgba(0, 0, 0, 0.1)',
              fontSize: 14,
              fontWeight: 500,
              backgroundColor: toast.type === 'success' ? 'var(--color-green2)' : 'var(--color-red2)',
              color: toast.type === 'success' ? 'var(--color-green11)' : 'var(--color-red11)',
              borderColor: toast.type === 'success' ? 'var(--color-green6)' : 'var(--color-red6)',
              borderWidth: 1,
              borderStyle: 'solid',
            }}
          >
            {toast.message}
          </Card>
        ))}
      </Stack>

      {/* Header */}
      <Row style={{ alignItems: 'center', justifyContent: 'space-between' }}>
        <Stack>
          <Row style={{ alignItems: 'center', gap: 12 }}>
            <H1 style={{ fontSize: 32, fontWeight: 'bold', color: 'var(--color-color12)' }}>
              Coverage Requirements
            </H1>
            <Row
              style={{
                paddingLeft: 12,
                paddingRight: 12,
                paddingTop: 4,
                paddingBottom: 4,
                borderRadius: 9999,
                fontSize: 14,
                fontWeight: 600,
                backgroundColor: 'var(--color-blue2)',
                color: 'var(--color-blue11)',
                alignItems: 'center',
                gap: 4,
              }}
            >
              <Building2 size={14} />
              <Text>ORG LEVEL</Text>
            </Row>
          </Row>
          <Text style={{ color: 'var(--color-color11)', fontSize: 18, marginTop: 4 }}>
            Set organization-wide minimum coverage requirements for all subcontractors
          </Text>
        </Stack>
        <ButtonCommon variant="primary" leftIcon={Plus} onPress={() => setShowForm(true)}>
          Add Requirement
        </ButtonCommon>
      </Row>

      {/* Info Banner */}
      <CardCommon style={{ padding: 16, backgroundColor: 'var(--color-blue2)', borderColor: 'var(--color-blue6)' }}>
        <Row style={{ alignItems: 'flex-start', gap: 12 }}>
          <Shield color="var(--color-blue10)" style={{ marginTop: 2 }} size={20} />
          <Stack>
            <Text style={{ color: 'var(--color-blue11)', fontWeight: 500 }}>Organization-Level Requirements</Text>
            <Text style={{ color: 'var(--color-blue10)', fontSize: 14, marginTop: 4 }}>
              These requirements apply to all projects in your organization. Subcontractors must
              meet both org-level and any project-specific requirements for full compliance.
            </Text>
          </Stack>
        </Row>
      </CardCommon>

      {/* Filters */}
      <CardCommon style={{ padding: 16 }}>
        <Row style={{ flexDirection: 'column', gap: 16 }}>
          <Row style={{ flex: 1, position: 'relative' }}>
            <Stack style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', zIndex: 1, pointerEvents: 'none' }}>
              <Search size={20} color="var(--color-color10)" />
            </Stack>
            <input
              type="text"
              placeholder="Search requirements..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              style={{
                width: '100%',
                paddingLeft: 40,
                paddingRight: 16,
                paddingTop: 8,
                paddingBottom: 8,
                backgroundColor: 'var(--color-background)',
                border: '1px solid var(--color-border)',
                borderRadius: 8,
                color: 'var(--color-color12)',
                flex: 1,
              }}
            />
          </Row>
          <Row style={{ alignItems: 'center', gap: 8 }}>
            <DollarSign size={20} color="var(--color-color10)" />
            <Select
              options={coverageTypeOptions}
              value={selectedCoverageType}
              onChange={(e) =>
                setSelectedCoverageType(e.target.value as CoverageLimitType | 'all')
              }
              style={{ width: 224 }}
            />
          </Row>
        </Row>
      </CardCommon>

      {/* Requirements Table */}
      <CardCommon>
        <Stack style={{ overflowX: 'auto' }}>
          <Stack>
            <Row style={{ padding: 16, paddingTop: 12, paddingBottom: 12, borderBottom: '1px solid var(--color-border)' }}>
              <Text style={{ flex: 1, textAlign: 'left', paddingLeft: 16, paddingRight: 16, fontSize: 14, fontWeight: 600, color: 'var(--color-color11)' }}>Name</Text>
              <Text style={{ flex: 1, textAlign: 'left', paddingLeft: 16, paddingRight: 16, fontSize: 14, fontWeight: 600, color: 'var(--color-color11)' }}>Coverage Type</Text>
              <Text style={{ flex: 1, textAlign: 'left', paddingLeft: 16, paddingRight: 16, fontSize: 14, fontWeight: 600, color: 'var(--color-color11)' }}>Minimum Limit</Text>
              <Text style={{ flex: 1, textAlign: 'left', paddingLeft: 16, paddingRight: 16, fontSize: 14, fontWeight: 600, color: 'var(--color-color11)' }}>Level</Text>
              <Text style={{ flex: 1, textAlign: 'left', paddingLeft: 16, paddingRight: 16, fontSize: 14, fontWeight: 600, color: 'var(--color-color11)' }}>Status</Text>
              <Text style={{ flex: 1, textAlign: 'right', paddingLeft: 16, paddingRight: 16, fontSize: 14, fontWeight: 600, color: 'var(--color-color11)' }}>Actions</Text>
            </Row>
            <Stack>
              {isLoading ? (
                <Row style={{ padding: 16, paddingTop: 32, paddingBottom: 32, justifyContent: 'center', alignItems: 'center' }}>
                  <Text style={{ color: 'var(--color-color10)' }}>Loading coverage requirements...</Text>
                </Row>
              ) : filteredRequirements.length === 0 ? (
                <Row style={{ padding: 16, paddingTop: 32, paddingBottom: 32, justifyContent: 'center', alignItems: 'center' }}>
                  <Text style={{ color: 'var(--color-color10)' }}>
                    {searchQuery
                      ? 'No requirements match your search'
                      : 'No coverage requirements found. Create your first one!'}
                  </Text>
                </Row>
              ) : (
                filteredRequirements.map((requirement) => (
                  <Row
                    key={requirement.id}
                    style={{
                      borderBottom: '1px solid var(--color-border)',
                      padding: 12,
                      alignItems: 'center',
                    }}
                  >
                    <Text style={{ flex: 1, paddingLeft: 16, paddingRight: 16, fontWeight: 500, color: 'var(--color-color12)' }}>{requirement.name}</Text>
                    <Row style={{ flex: 1, paddingLeft: 16, paddingRight: 16, alignItems: 'center', gap: 8 }}>
                      <Text
                        style={{
                          paddingLeft: 8,
                          paddingRight: 8,
                          paddingTop: 4,
                          paddingBottom: 4,
                          borderRadius: 4,
                          backgroundColor: 'var(--color-gray2)',
                          color: 'var(--color-gray11)',
                          fontSize: 12,
                          fontWeight: 500,
                        }}
                      >
                        {COVERAGE_TYPE_CONFIG[requirement.coverage_type].shortLabel}
                      </Text>
                      <Text style={{ color: 'var(--color-color11)' }}>
                        {COVERAGE_TYPE_CONFIG[requirement.coverage_type].label}
                      </Text>
                    </Row>
                    <Text style={{ flex: 1, paddingLeft: 16, paddingRight: 16, fontFamily: 'monospace', color: 'var(--color-color12)' }}>
                      {formatCurrency(requirement.minimum_limit)}
                    </Text>
                    <Row style={{ flex: 1, paddingLeft: 16, paddingRight: 16 }}>
                      <Text
                        style={{
                          paddingLeft: 8,
                          paddingRight: 8,
                          paddingTop: 4,
                          paddingBottom: 4,
                          borderRadius: 9999,
                          fontSize: 12,
                          fontWeight: 600,
                          backgroundColor: 'var(--color-blue2)',
                          color: 'var(--color-blue11)',
                        }}
                      >
                        ORG
                      </Text>
                    </Row>
                    <Row style={{ flex: 1, paddingLeft: 16, paddingRight: 16 }}>
                      <Text
                        style={{
                          paddingLeft: 8,
                          paddingRight: 8,
                          paddingTop: 4,
                          paddingBottom: 4,
                          borderRadius: 9999,
                          fontSize: 12,
                          fontWeight: 500,
                          backgroundColor: requirement.required ? 'var(--color-green2)' : 'var(--color-gray2)',
                          color: requirement.required ? 'var(--color-green11)' : 'var(--color-gray11)',
                        }}
                      >
                        {requirement.required ? 'Required' : 'Optional'}
                      </Text>
                    </Row>
                    <Row style={{ flex: 1, paddingLeft: 16, paddingRight: 16, alignItems: 'center', justifyContent: 'flex-end', gap: 8 }}>
                      <Button
                        variant="ghost"
                        onPress={() => setEditingRequirement(requirement)}
                        style={{
                          padding: 8,
                          color: 'var(--color-color10)',
                          borderRadius: 8,
                        }}
                        title="Edit"
                      >
                        <Edit2 size={16} />
                      </Button>
                      <Button
                        variant="ghost"
                        onPress={() => setDeleteConfirm(requirement)}
                        style={{
                          padding: 8,
                          color: 'var(--color-color10)',
                          borderRadius: 8,
                        }}
                        title="Delete"
                      >
                        <Trash2 size={16} />
                      </Button>
                    </Row>
                  </Row>
                ))
              )}
            </Stack>
          </Stack>
        </Stack>
      </CardCommon>

      {/* Summary Card */}
      {filteredRequirements.length > 0 && (
        <CardCommon style={{ padding: 16 }}>
          <Row style={{ alignItems: 'center', justifyContent: 'space-between', fontSize: 14 }}>
            <Text style={{ color: 'var(--color-color11)' }}>
              Showing {filteredRequirements.length} org-level requirement
              {filteredRequirements.length !== 1 ? 's' : ''}
            </Text>
            <Row style={{ alignItems: 'center', gap: 16 }}>
              <Text style={{ color: 'var(--color-color11)' }}>
                Required:{' '}
                <Text style={{ fontWeight: 600, color: 'var(--color-color12)' }}>
                  {filteredRequirements.filter((r) => r.required).length}
                </Text>
              </Text>
              <Text style={{ color: 'var(--color-color11)' }}>
                Optional:{' '}
                <Text style={{ fontWeight: 600, color: 'var(--color-color12)' }}>
                  {filteredRequirements.filter((r) => !r.required).length}
                </Text>
              </Text>
            </Row>
          </Row>
        </CardCommon>
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
        <Stack style={{ gap: 16 }}>
          <Text style={{ color: 'var(--color-color11)' }}>
            Are you sure you want to delete{' '}
            <Text style={{ fontWeight: 600, color: 'var(--color-color12)' }}>{deleteConfirm?.name}</Text>? This
            action cannot be undone and may affect compliance calculations for all projects.
          </Text>
          <Row style={{ justifyContent: 'flex-end', gap: 12 }}>
            <ButtonCommon
              variant="ghost"
              onPress={() => setDeleteConfirm(null)}
              disabled={isSubmitting}
            >
              Cancel
            </ButtonCommon>
            <ButtonCommon variant="danger" onPress={handleDelete} disabled={isSubmitting}>
              {isSubmitting ? 'Deleting...' : 'Delete'}
            </ButtonCommon>
          </Row>
        </Stack>
      </Modal>
    </Stack>
  );
}
